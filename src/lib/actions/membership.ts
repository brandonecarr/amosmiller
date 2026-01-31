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
 * Sets is_member = true, records the timestamp and membership option.
 */
export async function activateMembership(
  userId: string,
  membershipOption: "standard" | "preserve-america" = "standard"
): Promise<{
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
      membership_option: membershipOption,
    })
    .eq("id", userId);

  if (error) {
    console.error("Error activating membership:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Get paginated list of members with optional search and tier filter.
 */
export async function getMembers(params: {
  search?: string;
  tier?: "standard" | "preserve-america";
  page?: number;
  pageSize?: number;
}): Promise<{
  members: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    is_member: boolean;
    membership_option: "standard" | "preserve-america" | null;
    membership_paid_at: string | null;
    created_at: string;
  }[];
  count: number;
  error: string | null;
}> {
  const supabase = await createClient();
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("profiles")
    .select(
      "id, email, full_name, phone, is_member, membership_option, membership_paid_at, created_at",
      { count: "exact" }
    )
    .eq("is_member", true)
    .order("membership_paid_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params.search) {
    query = query.or(
      `email.ilike.%${params.search}%,full_name.ilike.%${params.search}%,phone.ilike.%${params.search}%`
    );
  }

  if (params.tier) {
    query = query.eq("membership_option", params.tier);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching members:", error);
    return { members: [], count: 0, error: error.message };
  }

  return { members: data || [], count: count || 0, error: null };
}

/**
 * Get a single member profile by ID.
 */
export async function getMember(userId: string): Promise<{
  member: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    is_member: boolean;
    membership_option: "standard" | "preserve-america" | null;
    membership_paid_at: string | null;
    created_at: string;
  } | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching member:", error);
    return { member: null, error: error.message };
  }

  return { member: data, error: null };
}

/**
 * Get aggregate stats for the members list page.
 */
export async function getMemberStats(): Promise<{
  totalMembers: number;
  standardMembers: number;
  preserveAmericaMembers: number;
  error: string | null;
}> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [totalResult, standardResult, preserveResult] = await Promise.all([
    (supabase as any)
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_member", true),
    (supabase as any)
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_member", true)
      .eq("membership_option", "standard"),
    (supabase as any)
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_member", true)
      .eq("membership_option", "preserve-america"),
  ]);

  return {
    totalMembers: totalResult.count || 0,
    standardMembers: standardResult.count || 0,
    preserveAmericaMembers: preserveResult.count || 0,
    error: null,
  };
}
