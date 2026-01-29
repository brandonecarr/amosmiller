"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createSubscription as createStripeSubscription,
  cancelSubscription as cancelStripeSubscription,
  pauseSubscription as pauseStripeSubscription,
  resumeSubscription as resumeStripeSubscription,
  getOrCreateStripeCustomer,
} from "@/lib/stripe/server";
import { addDays, addWeeks, addMonths } from "date-fns";

// Types
export interface SubscriptionItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
  isCustomizable?: boolean;
}

export interface CreateSubscriptionInput {
  name?: string;
  frequency: "weekly" | "biweekly" | "monthly";
  fulfillmentType: "pickup" | "delivery" | "shipping";
  fulfillmentLocationId?: string | null;
  deliveryZoneId?: string | null;
  shippingZoneId?: string | null;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  items: SubscriptionItem[];
  startDate?: string;
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

// Get user's subscriptions
export async function getUserSubscriptions(userId?: string) {
  const supabase = await createClient();

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
    .from("subscriptions")
    .select(`
      *,
      subscription_items(
        id,
        quantity,
        is_customizable,
        product:products(id, name, slug, base_price, sale_price, pricing_type, featured_image_url),
        variant:product_variants(id, name, price_modifier)
      ),
      fulfillment_locations(name, address_line1, city, state),
      delivery_zones(name),
      shipping_zones(name)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching subscriptions:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get subscription by ID
export async function getSubscription(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .select(`
      *,
      subscription_items(
        id,
        quantity,
        is_customizable,
        product:products(id, name, slug, base_price, sale_price, pricing_type, weight_unit, estimated_weight, featured_image_url),
        variant:product_variants(id, name, price_modifier)
      ),
      fulfillment_locations(name, address_line1, city, state),
      delivery_zones(name, delivery_fee),
      shipping_zones(name, base_rate)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching subscription:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get all subscriptions (admin)
export async function getSubscriptions(filters?: {
  status?: string;
  frequency?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("subscriptions")
    .select(`
      *,
      user:profiles(id, email, full_name),
      subscription_items(count),
      fulfillment_locations(name),
      delivery_zones(name),
      shipping_zones(name)
    `)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.frequency) {
    query = query.eq("frequency", filters.frequency);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,user.email.ilike.%${filters.search}%`
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
    console.error("Error fetching subscriptions:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new subscription
export async function createSubscription(input: CreateSubscriptionInput) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Get user profile for Stripe customer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("email, full_name, stripe_customer_id")
    .eq("id", user.id)
    .single();

  // Calculate start date and next order date
  const startDate = input.startDate ? new Date(input.startDate) : new Date();
  const nextOrderDate = calculateNextOrderDate(input.frequency, startDate);

  // Create subscription in database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscription, error: subError } = await (supabase as any)
    .from("subscriptions")
    .insert({
      user_id: user.id,
      name: input.name || `${input.frequency.charAt(0).toUpperCase() + input.frequency.slice(1)} Subscription`,
      status: "active",
      frequency: input.frequency,
      fulfillment_type: input.fulfillmentType,
      fulfillment_location_id: input.fulfillmentLocationId || null,
      delivery_zone_id: input.deliveryZoneId || null,
      shipping_zone_id: input.shippingZoneId || null,
      shipping_address: input.shippingAddress || null,
      next_order_date: nextOrderDate.toISOString().split("T")[0],
    })
    .select()
    .single();

  if (subError) {
    console.error("Error creating subscription:", subError);
    return { data: null, error: subError.message };
  }

  // Create subscription items
  const items = input.items.map((item) => ({
    subscription_id: subscription.id,
    product_id: item.productId,
    variant_id: item.variantId || null,
    quantity: item.quantity,
    is_customizable: item.isCustomizable || false,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase as any)
    .from("subscription_items")
    .insert(items);

  if (itemsError) {
    // Rollback subscription
    await (supabase as any).from("subscriptions").delete().eq("id", subscription.id);
    console.error("Error creating subscription items:", itemsError);
    return { data: null, error: itemsError.message };
  }

  revalidatePath("/account/subscriptions");
  revalidatePath("/admin/subscriptions");

  return { data: subscription, error: null };
}

// Update subscription items
export async function updateSubscriptionItems(
  subscriptionId: string,
  items: SubscriptionItem[]
) {
  const supabase = await createClient();

  // Delete existing items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("subscription_items")
    .delete()
    .eq("subscription_id", subscriptionId);

  // Insert new items
  const newItems = items.map((item) => ({
    subscription_id: subscriptionId,
    product_id: item.productId,
    variant_id: item.variantId || null,
    quantity: item.quantity,
    is_customizable: item.isCustomizable || false,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("subscription_items")
    .insert(newItems);

  if (error) {
    console.error("Error updating subscription items:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/account/subscriptions");
  revalidatePath(`/account/subscriptions/${subscriptionId}`);
  revalidatePath("/admin/subscriptions");

  return { success: true, error: null };
}

// Update subscription frequency
export async function updateSubscriptionFrequency(
  subscriptionId: string,
  frequency: "weekly" | "biweekly" | "monthly"
) {
  const supabase = await createClient();

  // Get current subscription
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current } = await (supabase as any)
    .from("subscriptions")
    .select("next_order_date")
    .eq("id", subscriptionId)
    .single();

  // Recalculate next order date based on new frequency
  const nextOrderDate = calculateNextOrderDate(
    frequency,
    current?.next_order_date ? new Date(current.next_order_date) : new Date()
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .update({
      frequency,
      next_order_date: nextOrderDate.toISOString().split("T")[0],
    })
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating subscription frequency:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/account/subscriptions");
  revalidatePath(`/account/subscriptions/${subscriptionId}`);

  return { data, error: null };
}

// Skip next order
export async function skipNextOrder(subscriptionId: string) {
  const supabase = await createClient();

  // Get current subscription
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscription, error: fetchError } = await (supabase as any)
    .from("subscriptions")
    .select("next_order_date, frequency, skip_dates")
    .eq("id", subscriptionId)
    .single();

  if (fetchError || !subscription) {
    return { success: false, error: fetchError?.message || "Subscription not found" };
  }

  // Add current next_order_date to skip_dates
  const skipDates = subscription.skip_dates || [];
  if (!skipDates.includes(subscription.next_order_date)) {
    skipDates.push(subscription.next_order_date);
  }

  // Calculate new next order date
  const newNextOrderDate = calculateNextOrderDate(
    subscription.frequency,
    new Date(subscription.next_order_date)
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("subscriptions")
    .update({
      skip_dates: skipDates,
      next_order_date: newNextOrderDate.toISOString().split("T")[0],
    })
    .eq("id", subscriptionId);

  if (error) {
    console.error("Error skipping order:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/account/subscriptions");
  revalidatePath(`/account/subscriptions/${subscriptionId}`);

  return { success: true, error: null };
}

// Pause subscription
export async function pauseSubscription(subscriptionId: string) {
  const supabase = await createClient();

  // Get subscription for Stripe ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscription } = await (supabase as any)
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("id", subscriptionId)
    .single();

  // Pause in Stripe if exists
  if (subscription?.stripe_subscription_id) {
    try {
      await pauseStripeSubscription(subscription.stripe_subscription_id);
    } catch (e) {
      console.error("Error pausing Stripe subscription:", e);
    }
  }

  // Update status in database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .update({ status: "paused" })
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) {
    console.error("Error pausing subscription:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/account/subscriptions");
  revalidatePath(`/account/subscriptions/${subscriptionId}`);
  revalidatePath("/admin/subscriptions");

  return { data, error: null };
}

// Resume subscription
export async function resumeSubscription(subscriptionId: string) {
  const supabase = await createClient();

  // Get subscription
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscription } = await (supabase as any)
    .from("subscriptions")
    .select("stripe_subscription_id, frequency")
    .eq("id", subscriptionId)
    .single();

  // Resume in Stripe if exists
  if (subscription?.stripe_subscription_id) {
    try {
      await resumeStripeSubscription(subscription.stripe_subscription_id);
    } catch (e) {
      console.error("Error resuming Stripe subscription:", e);
    }
  }

  // Calculate next order date from today
  const nextOrderDate = calculateNextOrderDate(subscription?.frequency || "monthly");

  // Update status in database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .update({
      status: "active",
      next_order_date: nextOrderDate.toISOString().split("T")[0],
    })
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) {
    console.error("Error resuming subscription:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/account/subscriptions");
  revalidatePath(`/account/subscriptions/${subscriptionId}`);
  revalidatePath("/admin/subscriptions");

  return { data, error: null };
}

// Cancel subscription
export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
) {
  const supabase = await createClient();

  // Get subscription for Stripe ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscription } = await (supabase as any)
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("id", subscriptionId)
    .single();

  // Cancel in Stripe if exists
  if (subscription?.stripe_subscription_id) {
    try {
      await cancelStripeSubscription(subscription.stripe_subscription_id);
    } catch (e) {
      console.error("Error cancelling Stripe subscription:", e);
    }
  }

  // Update status in database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null,
    })
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) {
    console.error("Error cancelling subscription:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/account/subscriptions");
  revalidatePath(`/account/subscriptions/${subscriptionId}`);
  revalidatePath("/admin/subscriptions");

  return { data, error: null };
}

// Update subscription address
export async function updateSubscriptionAddress(
  subscriptionId: string,
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  }
) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .update({ shipping_address: address })
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating subscription address:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/account/subscriptions");
  revalidatePath(`/account/subscriptions/${subscriptionId}`);

  return { data, error: null };
}

// Update fulfillment details
export async function updateSubscriptionFulfillment(
  subscriptionId: string,
  fulfillment: {
    fulfillmentType: "pickup" | "delivery" | "shipping";
    fulfillmentLocationId?: string | null;
    deliveryZoneId?: string | null;
    shippingZoneId?: string | null;
  }
) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .update({
      fulfillment_type: fulfillment.fulfillmentType,
      fulfillment_location_id: fulfillment.fulfillmentLocationId || null,
      delivery_zone_id: fulfillment.deliveryZoneId || null,
      shipping_zone_id: fulfillment.shippingZoneId || null,
    })
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating subscription fulfillment:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/account/subscriptions");
  revalidatePath(`/account/subscriptions/${subscriptionId}`);

  return { data, error: null };
}

// Get subscriptions due for processing
export async function getSubscriptionsDueForProcessing(date?: Date) {
  const supabase = await createClient();
  const targetDate = (date || new Date()).toISOString().split("T")[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .select(`
      *,
      user:profiles(id, email, full_name, stripe_customer_id),
      subscription_items(
        id,
        quantity,
        product:products(id, name, sku, base_price, sale_price, pricing_type, estimated_weight),
        variant:product_variants(id, name, price_modifier)
      ),
      fulfillment_locations(name),
      delivery_zones(name, delivery_fee),
      shipping_zones(name, base_rate)
    `)
    .eq("status", "active")
    .lte("next_order_date", targetDate);

  if (error) {
    console.error("Error fetching subscriptions due:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

