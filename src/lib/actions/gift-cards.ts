"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendGiftCardEmail } from "@/lib/email/gift-card-emails";
import { z } from "zod";

// Validation schema
const giftCardSchema = z.object({
  code: z.string().min(8, "Code must be at least 8 characters").max(20),
  initial_balance: z.number().min(1, "Balance must be at least $1"),
  current_balance: z.number().min(0),
  recipient_email: z.string().email().optional().nullable(),
  recipient_name: z.string().optional().nullable(),
  personal_message: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type GiftCardFormData = z.infer<typeof giftCardSchema>;

interface GiftCardValidationResult {
  valid: boolean;
  giftCard: {
    id: string;
    code: string;
    current_balance: number;
  } | null;
  availableBalance: number;
  error: string | null;
}

// Generate a unique gift card code
export async function generateGiftCardCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing characters
  let code = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Validate a gift card code
export async function validateGiftCard(code: string): Promise<GiftCardValidationResult> {
  const supabase = await createClient();

  // Normalize code (remove dashes, uppercase)
  const normalizedCode = code.replace(/-/g, "").toUpperCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: giftCard, error } = await (supabase as any)
    .from("gift_cards")
    .select("*")
    .eq("code", normalizedCode)
    .eq("is_active", true)
    .single();

  if (error || !giftCard) {
    return {
      valid: false,
      giftCard: null,
      availableBalance: 0,
      error: "Invalid gift card code",
    };
  }

  // Check if expired
  if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
    return {
      valid: false,
      giftCard: null,
      availableBalance: 0,
      error: "Gift card has expired",
    };
  }

  // Check if balance
  if (giftCard.current_balance <= 0) {
    return {
      valid: false,
      giftCard: null,
      availableBalance: 0,
      error: "Gift card has no remaining balance",
    };
  }

  return {
    valid: true,
    giftCard: {
      id: giftCard.id,
      code: giftCard.code,
      current_balance: giftCard.current_balance,
    },
    availableBalance: giftCard.current_balance,
    error: null,
  };
}

// Redeem (use) a gift card
export async function redeemGiftCard(
  giftCardId: string,
  amount: number,
  orderId: string,
  userId?: string
) {
  const supabase = await createClient();

  // Get current balance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: giftCard, error: fetchError } = await (supabase as any)
    .from("gift_cards")
    .select("current_balance")
    .eq("id", giftCardId)
    .single();

  if (fetchError || !giftCard) {
    return { success: false, error: "Gift card not found" };
  }

  if (amount > giftCard.current_balance) {
    return { success: false, error: "Insufficient gift card balance" };
  }

  const newBalance = giftCard.current_balance - amount;

  // Update gift card
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("gift_cards")
    .update({
      current_balance: newBalance,
      redeemed_by_user_id: userId || null,
    })
    .eq("id", giftCardId);

  if (error) {
    console.error("Error redeeming gift card:", error);
    return { success: false, error: error.message };
  }

  return { success: true, newBalance, error: null };
}

// Get all gift cards (admin)
export async function getGiftCards(filters?: { is_active?: boolean; has_balance?: boolean }) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("gift_cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.has_balance) {
    query = query.gt("current_balance", 0);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching gift cards:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single gift card
export async function getGiftCard(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("gift_cards")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching gift card:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new gift card (admin)
export async function createGiftCard(formData: Partial<GiftCardFormData>) {
  const supabase = await createClient();

  // Generate code if not provided
  const code = formData.code || (await generateGiftCardCode()).replace(/-/g, "");

  const data = {
    code,
    initial_balance: formData.initial_balance || 0,
    current_balance: formData.initial_balance || 0,
    recipient_email: formData.recipient_email || null,
    recipient_name: formData.recipient_name || null,
    personal_message: formData.personal_message || null,
    expires_at: formData.expires_at || null,
    is_active: formData.is_active ?? true,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: giftCard, error } = await (supabase as any)
    .from("gift_cards")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Error creating gift card:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/marketing");

  return { data: giftCard, error: null };
}

// Update a gift card
export async function updateGiftCard(id: string, formData: Partial<GiftCardFormData>) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("gift_cards")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating gift card:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/marketing");

  return { data, error: null };
}

// Toggle gift card active status
export async function toggleGiftCardActive(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current, error: fetchError } = await (supabase as any)
    .from("gift_cards")
    .select("is_active")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("gift_cards")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling gift card status:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/marketing");

  return { data, error: null };
}

// Get user's gift cards
export async function getUserGiftCards(userId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("gift_cards")
    .select("*")
    .or(`purchased_by_user_id.eq.${userId},redeemed_by_user_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user gift cards:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Check gift card balance (public endpoint)
export async function checkGiftCardBalance(code: string) {
  const result = await validateGiftCard(code);
  if (!result.valid) {
    return { balance: null, error: result.error };
  }
  return { balance: result.availableBalance, error: null };
}

// Purchase a gift card (customer)
export async function purchaseGiftCard(input: {
  amount: number;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  personalMessage?: string;
}) {
  const supabase = await createClient();

  // Validate amount
  if (input.amount < 10 || input.amount > 500) {
    return { data: null, error: "Gift card amount must be between $10 and $500" };
  }

  // Get current user (optional - can purchase as guest)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Generate unique code
  const code = (await generateGiftCardCode()).replace(/-/g, "");

  // Create gift card
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: giftCard, error } = await (supabase as any)
    .from("gift_cards")
    .insert({
      code,
      initial_balance: input.amount,
      current_balance: input.amount,
      recipient_email: input.recipientEmail,
      recipient_name: input.recipientName,
      personal_message: input.personalMessage || null,
      purchased_by_user_id: user?.id || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating gift card:", error);
    return { data: null, error: error.message };
  }

  // Send gift card email to recipient
  try {
    await sendGiftCardEmail({
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      senderName: input.senderName,
      amount: input.amount,
      code,
      personalMessage: input.personalMessage,
    });
  } catch (emailError) {
    console.error("Error sending gift card email:", emailError);
    // Don't fail the purchase if email fails
  }

  // Format code with dashes for display
  const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;

  revalidatePath("/account/gift-cards");

  return {
    data: {
      id: giftCard.id,
      code: formattedCode,
      amount: input.amount,
    },
    error: null,
  };
}
