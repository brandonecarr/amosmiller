"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const notificationSettingSchema = z.object({
  event_type: z.string().min(1),
  is_enabled: z.boolean(),
  email_template_id: z.string().uuid().nullable().optional(),
  delay_minutes: z.number().int().min(0).optional(),
});

/**
 * Get all notification settings
 */
export async function getNotificationSettings() {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("notification_settings")
    .select("*")
    .order("event_type", { ascending: true });

  if (error) {
    console.error("Error fetching notification settings:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Update a notification setting
 */
export async function updateNotificationSetting(
  id: string,
  updates: { is_enabled?: boolean; delay_minutes?: number; email_template_id?: string | null }
) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("notification_settings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating notification setting:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/settings/notifications");

  return { data, error: null };
}

/**
 * Toggle notification on/off by event type
 */
export async function toggleNotification(eventType: string, enabled: boolean) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("notification_settings")
    .update({ is_enabled: enabled })
    .eq("event_type", eventType)
    .select()
    .single();

  if (error) {
    console.error("Error toggling notification:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/settings/notifications");

  return { data, error: null };
}
