"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPaymentIntent, getOrCreateStripeCustomer } from "@/lib/stripe/server";
import { redeemGiftCard } from "@/lib/actions/gift-cards";
import { useStoreCredit } from "@/lib/actions/store-credits";
import { z } from "zod";
import {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendTrackingAddedEmail,
  sendPaymentCapturedEmail,
} from "@/lib/email/order-emails";
import { syncCustomerAfterOrder } from "@/lib/integrations/mailchimp";
import { activateMembership } from "@/lib/actions/membership";

// Address schema
const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().default("US"),
});

// Order item schema
const orderItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  name: z.string(),
  sku: z.string().optional().nullable(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  pricingType: z.enum(["fixed", "weight"]),
  estimatedWeight: z.number().optional().nullable(),
});

// Create order input schema
const createOrderSchema = z.object({
  // Customer info
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),

  // Fulfillment
  fulfillmentType: z.enum(["pickup", "delivery", "shipping"]),
  fulfillmentLocationId: z.string().uuid().optional().nullable(),
  deliveryZoneId: z.string().uuid().optional().nullable(),
  shippingZoneId: z.string().uuid().optional().nullable(),
  scheduledDate: z.string(),

  // Address
  shippingAddress: addressSchema.optional().nullable(),
  billingAddress: addressSchema.optional().nullable(),

  // Items
  items: z.array(orderItemSchema).min(1),

  // Pricing
  subtotal: z.number().min(0),
  shippingFee: z.number().min(0).default(0),
  membershipFee: z.number().min(0).default(0),
  membershipOption: z.enum(["standard", "preserve-america"]).optional(),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),

  // Discounts
  couponCode: z.string().optional().nullable(),
  giftCardCode: z.string().optional().nullable(),
  giftCardId: z.string().uuid().optional().nullable(),
  giftCardAmountUsed: z.number().min(0).default(0),
  storeCreditUsed: z.number().min(0).default(0),

  // Notes
  customerNotes: z.string().optional().nullable(),
});

type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Validate inventory before creating order
export async function validateInventory(
  items: { productId: string; quantity: number }[]
): Promise<{ valid: boolean; errors: string[] }> {
  const supabase = await createClient();
  const errors: string[] = [];

  for (const item of items) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product, error } = await (supabase as any)
      .from("products")
      .select("name, stock_quantity, track_inventory, allow_backorder")
      .eq("id", item.productId)
      .single();

    if (error || !product) {
      errors.push(`Product not found: ${item.productId}`);
      continue;
    }

    if (product.track_inventory && !product.allow_backorder) {
      if (product.stock_quantity < item.quantity) {
        errors.push(
          `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock_quantity}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Create a new order with Stripe payment intent
export async function createOrder(input: CreateOrderInput) {
  const supabase = await createClient();

  // Validate input
  const validated = createOrderSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const data = validated.data;

  // Validate inventory
  const inventoryCheck = await validateInventory(
    data.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
  );
  if (!inventoryCheck.valid) {
    return { data: null, error: inventoryCheck.errors.join("; ") };
  }

  // Calculate total
  const total =
    data.subtotal +
    data.shippingFee +
    data.membershipFee +
    data.taxAmount -
    data.discountAmount -
    data.giftCardAmountUsed -
    data.storeCreditUsed;

  // Get or create Stripe customer
  const stripeCustomer = await getOrCreateStripeCustomer({
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
  });

  // Create Stripe payment intent (authorize only, capture later)
  let paymentIntent;
  if (total > 0) {
    paymentIntent = await createPaymentIntent({
      amount: Math.round(total * 100), // Convert to cents
      customerId: stripeCustomer.id,
      metadata: {
        email: data.email,
        fulfillmentType: data.fulfillmentType,
        scheduledDate: data.scheduledDate,
      },
    });
  }

  // Get current user (if logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Create order in database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderError } = await (supabase as any)
    .from("orders")
    .insert({
      user_id: user?.id || null,
      status: "pending",
      payment_status: paymentIntent ? "pending" : "paid", // If total is 0, mark as paid
      fulfillment_type: data.fulfillmentType,
      fulfillment_location_id: data.fulfillmentLocationId || null,
      delivery_zone_id: data.deliveryZoneId || null,
      shipping_zone_id: data.shippingZoneId || null,
      scheduled_date: data.scheduledDate,
      shipping_address: data.shippingAddress || null,
      billing_address: data.billingAddress || data.shippingAddress || null,
      subtotal: data.subtotal,
      discount_amount: data.discountAmount,
      tax_amount: data.taxAmount,
      shipping_fee: data.shippingFee,
      membership_fee: data.membershipFee,
      total,
      stripe_payment_intent_id: paymentIntent?.id || null,
      customer_notes: data.customerNotes || null,
      coupon_code: data.couponCode || null,
      gift_card_amount_used: data.giftCardAmountUsed,
      store_credit_used: data.storeCreditUsed,
      source: "web",
    })
    .select()
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    return { data: null, error: orderError.message };
  }

  // Create order items
  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    variant_id: item.variantId || null,
    product_name: item.name,
    sku: item.sku || null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    pricing_type: item.pricingType,
    estimated_weight: item.estimatedWeight || null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase as any)
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Error creating order items:", itemsError);
    // Rollback order
    await (supabase as any).from("orders").delete().eq("id", order.id);
    return { data: null, error: itemsError.message };
  }

  // Decrement inventory (batch fetch, then update individually)
  const productIds = data.items.map((item: { productId: string }) => item.productId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inventoryProducts } = await (supabase as any)
    .from("products")
    .select("id, stock_quantity, track_inventory")
    .in("id", productIds);

  const inventoryMap = new Map(
    (inventoryProducts || []).map((p: { id: string; stock_quantity: number; track_inventory: boolean }) => [p.id, p])
  );

  for (const item of data.items) {
    const product = inventoryMap.get(item.productId) as { id: string; stock_quantity: number; track_inventory: boolean } | undefined;
    if (product?.track_inventory) {
      await (supabase as any)
        .from("products")
        .update({ stock_quantity: product.stock_quantity - item.quantity })
        .eq("id", item.productId);
    }
  }

  // Redeem gift card if used
  if (data.giftCardId && data.giftCardAmountUsed > 0) {
    const giftCardResult = await redeemGiftCard(
      data.giftCardId,
      data.giftCardAmountUsed,
      order.id
    );
    if (giftCardResult.error) {
      console.error("Error redeeming gift card:", giftCardResult.error);
      // Don't fail the order, just log the error
    }
  }

  // Use store credit if applied
  if (user?.id && data.storeCreditUsed > 0) {
    const storeCreditResult = await useStoreCredit({
      userId: user.id,
      amount: data.storeCreditUsed,
      orderId: order.id,
      reason: `Applied to Order #${order.order_number}`,
    });
    if (storeCreditResult.error) {
      console.error("Error using store credit:", storeCreditResult.error);
      // Don't fail the order, just log the error
    }
  }

  // Send order confirmation email
  try {
    await sendOrderConfirmationEmail({
      order_number: order.order_number,
      customer_first_name: data.firstName,
      customer_last_name: data.lastName,
      customer_email: data.email,
      status: "pending",
      fulfillment_type: data.fulfillmentType,
      scheduled_date: data.scheduledDate,
      shipping_address: data.shippingAddress || null,
      subtotal: data.subtotal,
      shipping_fee: data.shippingFee,
      membership_fee: data.membershipFee,
      tax_amount: data.taxAmount,
      discount_amount: data.discountAmount,
      total,
      order_items: data.items.map((item) => ({
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        pricing_type: item.pricingType,
        estimated_weight: item.estimatedWeight,
      })),
    });
  } catch (emailError) {
    console.error("Error sending order confirmation email:", emailError);
  }

  // Increment coupon usage if a coupon was applied
  if (data.couponCode) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: couponData } = await (supabase as any)
        .from("coupons")
        .select("id, used_count")
        .eq("code", data.couponCode.toUpperCase())
        .single();

      if (couponData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("coupons")
          .update({ used_count: (couponData.used_count || 0) + 1 })
          .eq("id", couponData.id);
      }
    } catch (couponError) {
      console.error("Error incrementing coupon usage:", couponError);
    }
  }

  // Sync customer to Mailchimp after order
  try {
    await syncCustomerAfterOrder({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      orderTotal: total,
    });
  } catch (mailchimpError) {
    console.error("Error syncing customer to Mailchimp:", mailchimpError);
  }

  // Activate membership if this order includes a membership fee
  if (user?.id && data.membershipFee > 0) {
    try {
      const option = data.membershipOption || (data.membershipFee >= 130 ? "preserve-america" : "standard");
      await activateMembership(user.id, option);
    } catch (membershipError) {
      console.error("Error activating membership:", membershipError);
      // Don't fail the order, just log the error
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");

  return {
    data: {
      order,
      clientSecret: paymentIntent?.client_secret || null,
    },
    error: null,
  };
}

// Get order by ID
export async function getOrder(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .select(`
      *,
      order_items(*),
      fulfillment_locations(name, address_line1, city, state),
      delivery_zones(name),
      shipping_zones(name)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get order by order number
export async function getOrderByNumber(orderNumber: number) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .select(`
      *,
      order_items(*),
      fulfillment_locations(name, address_line1, city, state),
      delivery_zones(name),
      shipping_zones(name)
    `)
    .eq("order_number", orderNumber)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get orders for a user
export async function getUserOrders(userId?: string) {
  const supabase = await createClient();

  // If no userId provided, get current user
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) {
    return { data: [], error: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .select("*, order_items(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user orders:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get all orders (admin)
export async function getOrders(filters?: {
  status?: string;
  paymentStatus?: string;
  fulfillmentType?: string;
  scheduledDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("orders")
    .select(`
      *,
      order_items(count),
      fulfillment_locations(name),
      delivery_zones(name),
      shipping_zones(name)
    `)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }
  if (filters?.fulfillmentType) {
    query = query.eq("fulfillment_type", filters.fulfillmentType);
  }
  if (filters?.scheduledDate) {
    query = query.eq("scheduled_date", filters.scheduledDate);
  }
  if (filters?.search) {
    query = query.or(
      `order_number.eq.${filters.search},stripe_payment_intent_id.ilike.%${filters.search}%`
    );
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching orders:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Update order status
export async function updateOrderStatus(
  id: string,
  status: "pending" | "confirmed" | "processing" | "packed" | "shipped" | "delivered" | "cancelled",
  sendEmail: boolean = true
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status };

  // Add timestamps for specific statuses
  if (status === "shipped") {
    updateData.shipped_at = new Date().toISOString();
  } else if (status === "delivered") {
    updateData.delivered_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      order_items(product_name, quantity, unit_price, pricing_type, actual_weight, estimated_weight),
      fulfillment_locations(name, address_line1, city, state)
    `)
    .single();

  if (error) {
    console.error("Error updating order status:", error);
    return { data: null, error: error.message };
  }

  // Send email notification
  if (sendEmail && data.customer_email) {
    try {
      await sendOrderStatusUpdateEmail(data, status);
    } catch (emailError) {
      console.error("Error sending status update email:", emailError);
      // Don't fail the status update if email fails
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  return { data, error: null };
}

// Update payment status
export async function updatePaymentStatus(
  id: string,
  paymentStatus: "pending" | "authorized" | "paid" | "partially_refunded" | "refunded" | "failed",
  stripeChargeId?: string
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { payment_status: paymentStatus };
  if (stripeChargeId) {
    updateData.stripe_charge_id = stripeChargeId;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating payment status:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  return { data, error: null };
}

// Add tracking info
export async function addTrackingInfo(
  id: string,
  trackingNumber: string,
  trackingUrl?: string,
  sendEmail: boolean = true
) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .update({
      tracking_number: trackingNumber,
      tracking_url: trackingUrl || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error adding tracking info:", error);
    return { data: null, error: error.message };
  }

  // Send email notification
  if (sendEmail && data.customer_email && trackingNumber) {
    try {
      await sendTrackingAddedEmail(data);
    } catch (emailError) {
      console.error("Error sending tracking email:", emailError);
      // Don't fail the tracking update if email fails
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  return { data, error: null };
}

// Add notes to order
export async function addOrderNotes(
  id: string,
  notes: { private?: string; invoice?: string }
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (notes.private !== undefined) {
    updateData.private_notes = notes.private;
  }
  if (notes.invoice !== undefined) {
    updateData.invoice_notes = notes.invoice;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error adding order notes:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  return { data, error: null };
}

// Update order item weight (for weight-based pricing)
export async function updateOrderItemWeight(
  itemId: string,
  actualWeight: number
) {
  const supabase = await createClient();

  // Get the item to calculate new price
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: item, error: fetchError } = await (supabase as any)
    .from("order_items")
    .select("*, orders(id)")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    return { data: null, error: fetchError?.message || "Item not found" };
  }

  // Calculate final price based on actual weight
  const finalPrice = item.unit_price * actualWeight * item.quantity;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("order_items")
    .update({
      actual_weight: actualWeight,
      final_price: finalPrice,
      is_packed: true,
      packed_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    console.error("Error updating item weight:", error);
    return { data: null, error: error.message };
  }

  revalidatePath(`/admin/orders/${item.orders.id}`);

  return { data, error: null };
}

// Recalculate order total after weight updates
export async function recalculateOrderTotal(orderId: string) {
  const supabase = await createClient();

  // Get all order items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items, error: itemsError } = await (supabase as any)
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError) {
    return { data: null, error: itemsError.message };
  }

  // Calculate new subtotal
  const subtotal = items.reduce((sum: number, item: any) => {
    if (item.pricing_type === "weight") {
      // Use final_price if set, otherwise estimate
      const price = item.final_price ?? item.unit_price * (item.estimated_weight || 1) * item.quantity;
      return sum + price;
    }
    return sum + item.unit_price * item.quantity;
  }, 0);

  // Get current order for other amounts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderError } = await (supabase as any)
    .from("orders")
    .select("shipping_fee, membership_fee, tax_amount, discount_amount, gift_card_amount_used, store_credit_used")
    .eq("id", orderId)
    .single();

  if (orderError) {
    return { data: null, error: orderError.message };
  }

  const total =
    subtotal +
    order.shipping_fee +
    (order.membership_fee || 0) +
    order.tax_amount -
    order.discount_amount -
    order.gift_card_amount_used -
    order.store_credit_used;

  // Update order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .update({ subtotal, total })
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    console.error("Error recalculating order total:", error);
    return { data: null, error: error.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);

  return { data, error: null };
}

// Reorder items from a previous order
export async function reorderItems(orderId: string) {
  const supabase = await createClient();

  // Get order with items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderError } = await (supabase as any)
    .from("orders")
    .select(`
      id,
      order_items(
        product_id,
        variant_id,
        name,
        quantity,
        unit_price,
        pricing_type,
        estimated_weight
      )
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { items: null, error: orderError?.message || "Order not found" };
  }

  // Get current product data for each item
  const productIds = order.order_items.map((item: { product_id: string }) => item.product_id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products, error: productsError } = await (supabase as any)
    .from("products")
    .select("id, name, slug, base_price, sale_price, pricing_type, weight_unit, estimated_weight, featured_image_url, is_active, track_inventory, stock_quantity")
    .in("id", productIds);

  if (productsError) {
    return { items: null, error: productsError.message };
  }

  // Build cart items with current product data
  const items: Array<{
    productId: string;
    variantId?: string;
    name: string;
    slug: string;
    pricingType: string;
    basePrice: number;
    salePrice: number | null;
    weightUnit: string;
    estimatedWeight: number | null;
    quantity: number;
    imageUrl: string | null;
    unavailable?: boolean;
    unavailableReason?: string;
  }> = [];

  const unavailableItems: string[] = [];

  for (const orderItem of order.order_items) {
    const product = products?.find((p: { id: string }) => p.id === orderItem.product_id);

    if (!product || !product.is_active) {
      unavailableItems.push(orderItem.name);
      continue;
    }

    // Check stock availability
    if (product.track_inventory && product.stock_quantity < orderItem.quantity) {
      if (product.stock_quantity === 0) {
        unavailableItems.push(orderItem.name);
        continue;
      }
      // Adjust quantity to available stock
      orderItem.quantity = product.stock_quantity;
    }

    items.push({
      productId: product.id,
      variantId: orderItem.variant_id || undefined,
      name: product.name,
      slug: product.slug,
      pricingType: product.pricing_type,
      basePrice: product.base_price,
      salePrice: product.sale_price,
      weightUnit: product.weight_unit || "lb",
      estimatedWeight: product.estimated_weight,
      quantity: orderItem.quantity,
      imageUrl: product.featured_image_url,
    });
  }

  if (items.length === 0) {
    return {
      items: null,
      error: "None of the items from this order are currently available",
    };
  }

  let warning: string | null = null;
  if (unavailableItems.length > 0) {
    warning = `Some items are unavailable: ${unavailableItems.join(", ")}`;
  }

  return { items, warning, error: null };
}
