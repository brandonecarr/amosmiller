"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema
const couponSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  description: z.string().optional().nullable(),
  coupon_type: z.enum(["percentage", "fixed", "free_shipping"]),
  value: z.number().min(0),
  min_order_amount: z.number().min(0).optional().nullable(),
  max_discount_amount: z.number().min(0).optional().nullable(),
  max_uses: z.number().int().min(1).optional().nullable(),
  max_uses_per_user: z.number().int().min(1).default(1),
  valid_from: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  applies_to_products: z.array(z.string()).default([]),
  applies_to_categories: z.array(z.string()).default([]),
});

type CouponFormData = z.infer<typeof couponSchema>;

interface CouponValidationResult {
  valid: boolean;
  coupon: {
    id: string;
    code: string;
    coupon_type: "percentage" | "fixed" | "free_shipping";
    value: number;
    max_discount_amount: number | null;
  } | null;
  discount: number;
  freeShipping: boolean;
  error: string | null;
}

// Validate and calculate discount for a coupon
export async function validateCoupon(
  code: string,
  subtotal: number,
  productIds: string[] = [],
  categoryIds: string[] = [],
  userId?: string
): Promise<CouponValidationResult> {
  const supabase = await createClient();

  // Find coupon by code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coupon, error } = await (supabase as any)
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !coupon) {
    return {
      valid: false,
      coupon: null,
      discount: 0,
      freeShipping: false,
      error: "Invalid coupon code",
    };
  }

  // Check if coupon has started
  if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
    return {
      valid: false,
      coupon: null,
      discount: 0,
      freeShipping: false,
      error: "Coupon is not yet valid",
    };
  }

  // Check if coupon has expired
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return {
      valid: false,
      coupon: null,
      discount: 0,
      freeShipping: false,
      error: "Coupon has expired",
    };
  }

  // Check minimum order amount
  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      coupon: null,
      discount: 0,
      freeShipping: false,
      error: `Minimum order amount of $${coupon.min_order_amount.toFixed(2)} required`,
    };
  }

  // Check max uses
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return {
      valid: false,
      coupon: null,
      discount: 0,
      freeShipping: false,
      error: "Coupon usage limit reached",
    };
  }

  // Check max uses per user (if user is logged in)
  if (userId && coupon.max_uses_per_user > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from("orders")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .eq("coupon_id", coupon.id);

    if (count && count >= coupon.max_uses_per_user) {
      return {
        valid: false,
        coupon: null,
        discount: 0,
        freeShipping: false,
        error: "You have already used this coupon the maximum number of times",
      };
    }
  }

  // Check product/category restrictions
  if (coupon.applies_to_products?.length > 0) {
    const hasValidProduct = productIds.some((id) =>
      coupon.applies_to_products.includes(id)
    );
    if (!hasValidProduct) {
      return {
        valid: false,
        coupon: null,
        discount: 0,
        freeShipping: false,
        error: "Coupon does not apply to products in your cart",
      };
    }
  }

  if (coupon.applies_to_categories?.length > 0) {
    const hasValidCategory = categoryIds.some((id) =>
      coupon.applies_to_categories.includes(id)
    );
    if (!hasValidCategory) {
      return {
        valid: false,
        coupon: null,
        discount: 0,
        freeShipping: false,
        error: "Coupon does not apply to categories in your cart",
      };
    }
  }

  // Calculate discount
  let discount = 0;
  let freeShipping = false;

  switch (coupon.coupon_type) {
    case "percentage":
      discount = subtotal * (coupon.value / 100);
      break;
    case "fixed":
      discount = coupon.value;
      break;
    case "free_shipping":
      freeShipping = true;
      break;
  }

  // Apply max discount cap
  if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
    discount = coupon.max_discount_amount;
  }

  // Don't exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      coupon_type: coupon.coupon_type,
      value: coupon.value,
      max_discount_amount: coupon.max_discount_amount,
    },
    discount,
    freeShipping,
    error: null,
  };
}

// Increment coupon usage count
export async function incrementCouponUsage(couponId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coupon, error: fetchError } = await (supabase as any)
    .from("coupons")
    .select("used_count")
    .eq("id", couponId)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("coupons")
    .update({ used_count: coupon.used_count + 1 })
    .eq("id", couponId);

  if (error) {
    console.error("Error incrementing coupon usage:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Get all coupons (admin)
export async function getCoupons(filters?: { is_active?: boolean }) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching coupons:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single coupon
export async function getCoupon(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("coupons")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching coupon:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new coupon
export async function createCoupon(formData: CouponFormData) {
  const supabase = await createClient();

  const validated = couponSchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  // Uppercase the code
  const data = {
    ...validated.data,
    code: validated.data.code.toUpperCase(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coupon, error } = await (supabase as any)
    .from("coupons")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Error creating coupon:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/marketing");

  return { data: coupon, error: null };
}

// Update a coupon
export async function updateCoupon(id: string, formData: Partial<CouponFormData>) {
  const supabase = await createClient();

  const validated = couponSchema.partial().safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  // Uppercase the code if provided
  const data = validated.data.code
    ? { ...validated.data, code: validated.data.code.toUpperCase() }
    : validated.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coupon, error } = await (supabase as any)
    .from("coupons")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating coupon:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/marketing");

  return { data: coupon, error: null };
}

// Delete a coupon
export async function deleteCoupon(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("coupons")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting coupon:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/marketing");

  return { success: true, error: null };
}

// Toggle coupon active status
export async function toggleCouponActive(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current, error: fetchError } = await (supabase as any)
    .from("coupons")
    .select("is_active")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("coupons")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling coupon status:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/marketing");

  return { data, error: null };
}
