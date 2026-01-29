"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema
const reviewSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  author_name: z.string().min(1, "Name is required").max(255),
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  review_body: z.string().max(2000).optional().nullable(),
});

// ── Get approved reviews for a product ────────────────────────────────────────

export async function getProductReviews(productId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch reviews:", error.message);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}

// ── Get review summary (avg rating, count, distribution) ──────────────────────

export async function getProductReviewSummary(productId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_approved", true);

  if (error || !data) {
    return {
      averageRating: 0,
      totalCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const totalCount = data.length;
  if (totalCount === 0) {
    return {
      averageRating: 0,
      totalCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const sum = data.reduce(
    (acc: number, r: { rating: number }) => acc + r.rating,
    0
  );
  const averageRating = Math.round((sum / totalCount) * 10) / 10;

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of data) {
    ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
  }

  return { averageRating, totalCount, ratingDistribution };
}

// ── Check if current user already has a review for this product ───────────────

export async function getUserReviewForProduct(productId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: null };
  }

  const { data, error } = await (supabase as any)
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to check existing review:", error.message);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// ── Create a review ───────────────────────────────────────────────────────────

export async function createReview(formData: {
  product_id: string;
  author_name: string;
  rating: number;
  review_body?: string | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be logged in to submit a review" };
  }

  const validated = reviewSchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  // Check for existing review by this user on this product
  const { data: existing } = await (supabase as any)
    .from("product_reviews")
    .select("id")
    .eq("product_id", validated.data.product_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { data: null, error: "You have already reviewed this product. You can edit your existing review." };
  }

  const { data, error } = await (supabase as any)
    .from("product_reviews")
    .insert({
      product_id: validated.data.product_id,
      user_id: user.id,
      author_name: validated.data.author_name,
      rating: validated.data.rating,
      review_body: validated.data.review_body || null,
      is_approved: true,
      is_imported: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create review:", error.message);
    return { data: null, error: error.message };
  }

  revalidatePath("/shop");

  return { data, error: null };
}

// ── Update a review ───────────────────────────────────────────────────────────

export async function updateReview(
  id: string,
  formData: {
    author_name?: string;
    rating?: number;
    review_body?: string | null;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be logged in" };
  }

  const update: Record<string, unknown> = {};
  if (formData.author_name !== undefined) update.author_name = formData.author_name;
  if (formData.rating !== undefined) update.rating = formData.rating;
  if (formData.review_body !== undefined) update.review_body = formData.review_body;

  const { data, error } = await (supabase as any)
    .from("product_reviews")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update review:", error.message);
    return { data: null, error: error.message };
  }

  revalidatePath("/shop");

  return { data, error: null };
}

// ── Delete a review ───────────────────────────────────────────────────────────

export async function deleteReview(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  const { error } = await (supabase as any)
    .from("product_reviews")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete review:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/shop");

  return { success: true, error: null };
}
