"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Get shipment events for an order
 */
export async function getShipmentEvents(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("shipment_events")
    .select("*")
    .eq("order_id", orderId)
    .order("occurred_at", { ascending: false });

  if (error) {
    console.error("Error fetching shipment events:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Get notification log for an order
 */
export async function getNotificationLog(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("notification_log")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notification log:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Get all webhook events (for debugging)
 */
export async function getWebhookEvents(limit: number = 50) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("webhook_events")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching webhook events:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
