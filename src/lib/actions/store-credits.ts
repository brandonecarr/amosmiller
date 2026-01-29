"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface StoreCreditResult {
  balance: number;
  error: string | null;
}

// Get user's store credit balance
export async function getUserStoreCredits(userId: string): Promise<StoreCreditResult> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("store_credits")
    .select("amount")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching store credits:", error);
    return { balance: 0, error: error.message };
  }

  // Sum all credit entries (positive = credit added, negative = credit used)
  const balance = data?.reduce((sum: number, credit: { amount: number }) => sum + credit.amount, 0) || 0;

  return { balance: Math.max(0, balance), error: null };
}

// Add store credit to a user (admin action)
export async function addStoreCredit({
  userId,
  amount,
  reason,
  createdBy,
  orderId,
}: {
  userId: string;
  amount: number;
  reason: string;
  createdBy?: string;
  orderId?: string;
}) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("store_credits")
    .insert({
      user_id: userId,
      amount,
      reason,
      created_by: createdBy || null,
      order_id: orderId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding store credit:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/customers");
  revalidatePath("/account");

  return { data, error: null };
}

// Use store credit (deduct from balance)
export async function useStoreCredit({
  userId,
  amount,
  orderId,
  reason = "Applied to order",
}: {
  userId: string;
  amount: number;
  orderId: string;
  reason?: string;
}) {
  // First check if user has enough balance
  const { balance, error: balanceError } = await getUserStoreCredits(userId);

  if (balanceError) {
    return { success: false, error: balanceError };
  }

  if (balance < amount) {
    return { success: false, error: "Insufficient store credit balance" };
  }

  const supabase = await createClient();

  // Insert a negative credit entry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("store_credits")
    .insert({
      user_id: userId,
      amount: -amount, // Negative to deduct
      reason,
      order_id: orderId,
    });

  if (error) {
    console.error("Error using store credit:", error);
    return { success: false, error: error.message };
  }

  return { success: true, newBalance: balance - amount, error: null };
}

// Refund store credit (when order is cancelled/refunded)
export async function refundStoreCredit({
  userId,
  amount,
  orderId,
  reason = "Order refund",
}: {
  userId: string;
  amount: number;
  orderId: string;
  reason?: string;
}) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("store_credits")
    .insert({
      user_id: userId,
      amount, // Positive to add back
      reason,
      order_id: orderId,
    });

  if (error) {
    console.error("Error refunding store credit:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Get store credit history for a user
export async function getStoreCreditHistory(userId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("store_credits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching store credit history:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get all store credits (admin)
export async function getAllStoreCredits(filters?: { userId?: string }) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("store_credits")
    .select(`
      *,
      user:users(id, email, full_name)
    `)
    .order("created_at", { ascending: false });

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching all store credits:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
