"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPaymentIntent, capturePaymentIntent, getOrCreateStripeCustomer } from "@/lib/stripe/server";

interface POSCartItem {
  productId: string;
  name: string;
  sku: string | null;
  pricingType: "fixed" | "weight";
  unitPrice: number;
  quantity: number;
  weight?: number;
  weightUnit?: string;
  subtotal: number;
}

interface POSOrderInput {
  customerId?: string;
  items: POSCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "card" | "cash";
  cashReceived?: number;
  notes?: string;
}

// Search customers
export async function searchCustomers(query: string) {
  const supabase = await createClient();

  if (!query.trim()) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone")
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%,phone.ilike.%${query}%`)
    .eq("role", "customer")
    .limit(10);

  if (error) {
    console.error("Error searching customers:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new customer
export async function createPOSCustomer(data: {
  email: string;
  fullName?: string;
  phone?: string;
}) {
  const supabase = await createClient();

  // First check if email already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .single();

  if (existing) {
    return { data: null, error: "Customer with this email already exists" };
  }

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
    },
  });

  if (authError) {
    console.error("Error creating auth user:", authError);
    return { data: null, error: authError.message };
  }

  // Profile is created by trigger, but we can update it
  if (authUser.user) {
    await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone: data.phone,
      })
      .eq("id", authUser.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone")
      .eq("id", authUser.user.id)
      .single();

    return { data: profile, error: null };
  }

  return { data: null, error: "Failed to create customer" };
}

// Create POS order
export async function createPOSOrder(input: POSOrderInput) {
  const supabase = await createClient();

  try {
    // Get current user (staff/admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    let stripePaymentIntentId: string | null = null;
    let stripeChargeId: string | null = null;

    // For card payments, create and capture payment intent
    if (input.paymentMethod === "card" && input.customerId) {
      // Get customer's Stripe ID
      const { data: customerProfile } = await supabase
        .from("profiles")
        .select("stripe_customer_id, email, full_name")
        .eq("id", input.customerId)
        .single();

      let stripeCustomerId = customerProfile?.stripe_customer_id;

      if (!stripeCustomerId && customerProfile) {
        const stripeCustomer = await getOrCreateStripeCustomer({
          email: customerProfile.email,
          name: customerProfile.full_name || undefined,
        });
        stripeCustomerId = stripeCustomer.id;

        // Save Stripe customer ID
        await supabase
          .from("profiles")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", input.customerId);
      }

      if (stripeCustomerId) {
        // Create and immediately capture payment
        const paymentIntent = await createPaymentIntent({
          amount: Math.round(input.total * 100),
          customerId: stripeCustomerId,
          metadata: {
            source: "pos",
          },
        });

        const captured = await capturePaymentIntent(paymentIntent.id);
        stripePaymentIntentId = paymentIntent.id;
        stripeChargeId = captured.latest_charge as string;
      }
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: input.customerId || null,
        status: "delivered", // POS orders are immediately completed
        payment_status: "paid",
        fulfillment_type: "pickup",
        subtotal: input.subtotal,
        tax_amount: input.tax,
        total: input.total,
        stripe_payment_intent_id: stripePaymentIntentId,
        stripe_charge_id: stripeChargeId,
        source: "pos",
        private_notes: input.notes,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating POS order:", orderError);
      return { data: null, error: orderError.message };
    }

    // Create order items
    const orderItems = input.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      pricing_type: item.pricingType,
      actual_weight: item.weight,
      final_price: item.subtotal,
      is_packed: true,
      packed_at: new Date().toISOString(),
      packed_by: user.id,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Don't fail the order, just log the error
    }

    // Update inventory
    for (const item of input.items) {
      const { data: product } = await supabase
        .from("products")
        .select("track_inventory, stock_quantity")
        .eq("id", item.productId)
        .single();

      if (product?.track_inventory) {
        await supabase
          .from("products")
          .update({
            stock_quantity: Math.max(0, (product.stock_quantity || 0) - item.quantity),
          })
          .eq("id", item.productId);
      }
    }

    // Record cash payment if applicable
    if (input.paymentMethod === "cash" && input.cashReceived) {
      // Could log cash transactions to a separate table if needed
    }

    revalidatePath("/pos");
    revalidatePath("/admin/orders");

    return {
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        paymentMethod: input.paymentMethod,
        total: input.total,
        change: input.cashReceived ? Math.max(0, input.cashReceived - input.total) : 0,
      },
      error: null,
    };
  } catch (error) {
    console.error("POS order error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get today's POS stats
export async function getPOSStats() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: orders, error } = await supabase
    .from("orders")
    .select("total, payment_status")
    .eq("source", "pos")
    .gte("created_at", today.toISOString());

  if (error) {
    console.error("Error fetching POS stats:", error);
    return { data: null, error: error.message };
  }

  const paidOrders = orders?.filter((o: { payment_status: string; total: number | null }) => o.payment_status === "paid") || [];
  const totalSales = paidOrders.reduce((sum: number, o: { total: number | null }) => sum + (o.total || 0), 0);

  return {
    data: {
      transactionCount: paidOrders.length,
      totalSales,
      averageOrder: paidOrders.length > 0 ? totalSales / paidOrders.length : 0,
    },
    error: null,
  };
}

// Open cash drawer (if connected)
export async function openCashDrawer() {
  // This would send a command to the cash drawer via connected hardware
  // For Stripe Terminal, this can be done through the terminal SDK
  console.log("Open cash drawer command sent");
  return { success: true };
}

// Print receipt (if printer connected)
export async function printReceipt(orderId: string) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(*)
    `)
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return { success: false, error: error?.message || "Order not found" };
  }

  // This would send the receipt data to a connected printer
  // Could integrate with receipt printers via CUPS, Star WebPRNT, etc.
  console.log("Print receipt for order:", order.order_number);

  return { success: true };
}
