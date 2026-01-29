"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPaymentIntent, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { getSubscriptionsDueForProcessing } from "./subscriptions";
import { addWeeks, addMonths } from "date-fns";

interface ProcessedSubscription {
  subscriptionId: string;
  orderId?: string;
  orderNumber?: number;
  success: boolean;
  error?: string;
}

// Calculate next order date based on frequency
function calculateNextOrderDate(
  frequency: "weekly" | "biweekly" | "monthly",
  fromDate: Date = new Date()
): Date {
  switch (frequency) {
    case "weekly":
      return addWeeks(fromDate, 1);
    case "biweekly":
      return addWeeks(fromDate, 2);
    case "monthly":
      return addMonths(fromDate, 1);
    default:
      return addMonths(fromDate, 1);
  }
}

// Process a single subscription and create an order
export async function processSubscription(subscriptionId: string): Promise<ProcessedSubscription> {
  const supabase = await createClient();

  try {
    // Get subscription with all details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscription, error: fetchError } = await (supabase as any)
      .from("subscriptions")
      .select(`
        *,
        user:profiles(id, email, full_name, phone, stripe_customer_id),
        subscription_items(
          id,
          quantity,
          product:products(id, name, sku, base_price, sale_price, pricing_type, estimated_weight, track_inventory, stock_quantity),
          variant:product_variants(id, name, sku, price_modifier)
        ),
        fulfillment_locations(id, name),
        delivery_zones(id, name, delivery_fee),
        shipping_zones(id, name, base_rate)
      `)
      .eq("id", subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return {
        subscriptionId,
        success: false,
        error: fetchError?.message || "Subscription not found",
      };
    }

    // Check if subscription is active
    if (subscription.status !== "active") {
      return {
        subscriptionId,
        success: false,
        error: `Subscription is ${subscription.status}`,
      };
    }

    // Calculate totals
    const shippingFee =
      subscription.delivery_zones?.delivery_fee ||
      subscription.shipping_zones?.base_rate ||
      0;

    const subtotal = subscription.subscription_items.reduce(
      (sum: number, item: {
        quantity: number;
        product: {
          base_price: number;
          sale_price: number | null;
          pricing_type: string;
          estimated_weight: number | null;
        };
        variant?: { price_modifier: number } | null;
      }) => {
        const basePrice = item.product.sale_price ?? item.product.base_price;
        const variantMod = item.variant?.price_modifier || 0;
        const price = basePrice + variantMod;

        if (item.product.pricing_type === "weight") {
          return sum + price * (item.product.estimated_weight || 1) * item.quantity;
        }
        return sum + price * item.quantity;
      },
      0
    );

    const total = subtotal + shippingFee;

    // Validate inventory
    for (const item of subscription.subscription_items) {
      if (item.product.track_inventory) {
        if (item.product.stock_quantity < item.quantity) {
          return {
            subscriptionId,
            success: false,
            error: `Insufficient stock for ${item.product.name}`,
          };
        }
      }
    }

    // Get or create Stripe customer
    let stripeCustomerId = subscription.user.stripe_customer_id;
    if (!stripeCustomerId) {
      const stripeCustomer = await getOrCreateStripeCustomer({
        email: subscription.user.email,
        name: subscription.user.full_name,
      });
      stripeCustomerId = stripeCustomer.id;

      // Update profile with Stripe customer ID
      await (supabase as any)
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", subscription.user.id);
    }

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent({
      amount: Math.round(total * 100),
      customerId: stripeCustomerId,
      metadata: {
        subscription_id: subscriptionId,
        subscription_name: subscription.name,
        email: subscription.user.email,
      },
    });

    // Create order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await (supabase as any)
      .from("orders")
      .insert({
        user_id: subscription.user.id,
        status: "pending",
        payment_status: "pending",
        fulfillment_type: subscription.fulfillment_type,
        fulfillment_location_id: subscription.fulfillment_location_id,
        delivery_zone_id: subscription.delivery_zone_id,
        shipping_zone_id: subscription.shipping_zone_id,
        scheduled_date: subscription.next_order_date,
        shipping_address: subscription.shipping_address,
        subtotal,
        shipping_fee: shippingFee,
        tax_amount: 0,
        discount_amount: 0,
        total,
        stripe_payment_intent_id: paymentIntent.id,
        source: "subscription",
        subscription_id: subscriptionId,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating subscription order:", orderError);
      return {
        subscriptionId,
        success: false,
        error: orderError.message,
      };
    }

    // Create order items
    const orderItems = subscription.subscription_items.map(
      (item: {
        product: {
          id: string;
          name: string;
          sku: string;
          base_price: number;
          sale_price: number | null;
          pricing_type: string;
          estimated_weight: number | null;
        };
        variant?: {
          id: string;
          name: string;
          sku: string;
          price_modifier: number;
        } | null;
        quantity: number;
      }) => {
        const basePrice = item.product.sale_price ?? item.product.base_price;
        const variantMod = item.variant?.price_modifier || 0;

        return {
          order_id: order.id,
          product_id: item.product.id,
          variant_id: item.variant?.id || null,
          product_name: item.product.name,
          sku: item.variant?.sku || item.product.sku,
          quantity: item.quantity,
          unit_price: basePrice + variantMod,
          pricing_type: item.product.pricing_type,
          estimated_weight: item.product.estimated_weight,
        };
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: itemsError } = await (supabase as any)
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      // Rollback order
      await (supabase as any).from("orders").delete().eq("id", order.id);
      console.error("Error creating order items:", itemsError);
      return {
        subscriptionId,
        success: false,
        error: itemsError.message,
      };
    }

    // Decrement inventory
    for (const item of subscription.subscription_items) {
      if (item.product.track_inventory) {
        await (supabase as any)
          .from("products")
          .update({
            stock_quantity: item.product.stock_quantity - item.quantity,
          })
          .eq("id", item.product.id);
      }
    }

    // Update subscription with next order date
    const nextOrderDate = calculateNextOrderDate(
      subscription.frequency,
      new Date(subscription.next_order_date)
    );

    await (supabase as any)
      .from("subscriptions")
      .update({
        next_order_date: nextOrderDate.toISOString().split("T")[0],
        last_order_date: subscription.next_order_date,
      })
      .eq("id", subscriptionId);

    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin/orders");
    revalidatePath("/account/subscriptions");
    revalidatePath("/account/orders");

    return {
      subscriptionId,
      orderId: order.id,
      orderNumber: order.order_number,
      success: true,
    };
  } catch (error) {
    console.error("Error processing subscription:", error);
    return {
      subscriptionId,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Process all due subscriptions
export async function processAllDueSubscriptions(): Promise<{
  processed: ProcessedSubscription[];
  successCount: number;
  errorCount: number;
}> {
  const { data: dueSubscriptions, error } = await getSubscriptionsDueForProcessing();

  if (error || !dueSubscriptions) {
    return {
      processed: [],
      successCount: 0,
      errorCount: 0,
    };
  }

  const results: ProcessedSubscription[] = [];

  for (const subscription of dueSubscriptions) {
    const result = await processSubscription(subscription.id);
    results.push(result);
  }

  const successCount = results.filter((r) => r.success).length;
  const errorCount = results.filter((r) => !r.success).length;

  return {
    processed: results,
    successCount,
    errorCount,
  };
}

// Get subscription order history
export async function getSubscriptionOrderHistory(subscriptionId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .select("id, order_number, status, payment_status, total, created_at")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching subscription orders:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
