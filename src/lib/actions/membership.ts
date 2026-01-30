"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Check if a user is already a member.
 */
export async function checkMembership(userId: string): Promise<{
  isMember: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("is_member")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error checking membership:", error);
    return { isMember: false, error: error.message };
  }

  return { isMember: data?.is_member ?? false, error: null };
}

/**
 * Activate membership for a user after successful order with membership fee.
 * Sets is_member = true and records the timestamp.
 */
export async function activateMembership(userId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      is_member: true,
      membership_paid_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error activating membership:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
