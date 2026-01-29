"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schemas
const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().optional().nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// Get all categories
export async function getCategories() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("categories")
    .select("*, products(count)")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return { data: null, error: error.message };
  }

  // Transform to include product count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoriesWithCount = data?.map((cat: any) => ({
    ...cat,
    productCount: cat.products?.[0]?.count || 0,
  }));

  return { data: categoriesWithCount, error: null };
}

// Get a single category by ID
export async function getCategory(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching category:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new category
export async function createCategory(formData: CategoryFormData) {
  const supabase = await createClient();

  // Validate input
  const validated = categorySchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("categories")
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");

  return { data, error: null };
}

// Update a category
export async function updateCategory(id: string, formData: Partial<CategoryFormData>) {
  const supabase = await createClient();

  // Validate input (partial)
  const validated = categorySchema.partial().safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("categories")
    .update(validated.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating category:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");

  return { data, error: null };
}

// Delete a category
export async function deleteCategory(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");

  return { success: true, error: null };
}

// Toggle category active status
export async function toggleCategoryActive(id: string, is_active: boolean) {
  return updateCategory(id, { is_active });
}

// Reorder categories
export async function reorderCategories(orderedIds: string[]) {
  const supabase = await createClient();

  // Update sort_order for each category
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("categories")
      .update({ sort_order: index })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    return { success: false, error: "Failed to reorder categories" };
  }

  revalidatePath("/admin/categories");

  return { success: true, error: null };
}
