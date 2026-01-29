"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema
const variantSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().max(100).optional().nullable(),
  price_modifier: z.number().default(0),
  weight_modifier: z.number().default(0),
  stock_quantity: z.number().int().min(0).default(0),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

type VariantFormData = z.infer<typeof variantSchema>;

// Get variants for a product
export async function getProductVariants(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching variants:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single variant
export async function getVariant(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching variant:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a variant
export async function createVariant(formData: VariantFormData) {
  const supabase = await createClient();

  const validated = variantSchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("product_variants")
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    console.error("Error creating variant:", error);
    return { data: null, error: error.message };
  }

  revalidatePath(`/admin/products/${formData.product_id}`);

  return { data, error: null };
}

// Update a variant
export async function updateVariant(id: string, formData: Partial<VariantFormData>) {
  const supabase = await createClient();

  const validated = variantSchema.partial().safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("product_variants")
    .update(validated.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating variant:", error);
    return { data: null, error: error.message };
  }

  if (data?.product_id) {
    revalidatePath(`/admin/products/${data.product_id}`);
  }

  return { data, error: null };
}

// Delete a variant
export async function deleteVariant(id: string, productId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting variant:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/products/${productId}`);

  return { success: true, error: null };
}

// Bulk update variant order
export async function reorderVariants(productId: string, orderedIds: string[]) {
  const supabase = await createClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("product_variants")
      .update({ sort_order: index })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    return { success: false, error: "Failed to reorder variants" };
  }

  revalidatePath(`/admin/products/${productId}`);

  return { success: true, error: null };
}
