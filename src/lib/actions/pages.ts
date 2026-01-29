"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const pageSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  content: z.array(z.any()).default([]),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
  is_published: z.boolean().default(false),
  published_at: z.string().optional().nullable(),
  show_in_nav: z.boolean().default(false),
  nav_label: z.string().optional().nullable(),
  sort_order: z.number().int().default(0),
});

type PageFormData = z.infer<typeof pageSchema>;

// Get all pages (admin)
export async function getPages(filters?: { is_published?: boolean }) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("pages")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters?.is_published !== undefined) {
    query = query.eq("is_published", filters.is_published);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching pages:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single page by ID
export async function getPage(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching page:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a published page by slug (storefront)
export async function getPageBySlug(slug: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get pages for navigation
export async function getNavPages() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pages")
    .select("slug, nav_label, title")
    .eq("show_in_nav", true)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching nav pages:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new page
export async function createPage(formData: PageFormData) {
  const supabase = await createClient();

  const validated = pageSchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const data = {
    ...validated.data,
    slug: validated.data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
  };

  // Set published_at if publishing
  if (data.is_published && !data.published_at) {
    data.published_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: page, error } = await (supabase as any)
    .from("pages")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Error creating page:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/pages");
  revalidatePath("/");

  return { data: page, error: null };
}

// Update a page
export async function updatePage(id: string, formData: Partial<PageFormData>) {
  const supabase = await createClient();

  const validated = pageSchema.partial().safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const data = validated.data.slug
    ? { ...validated.data, slug: validated.data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-") }
    : validated.data;

  // Set published_at if publishing for the first time
  if (data.is_published) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("pages")
      .select("published_at")
      .eq("id", id)
      .single();

    if (!existing?.published_at) {
      (data as Record<string, unknown>).published_at = new Date().toISOString();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: page, error } = await (supabase as any)
    .from("pages")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating page:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/pages");
  revalidatePath(`/${page.slug}`);
  revalidatePath("/");

  return { data: page, error: null };
}

// Delete a page
export async function deletePage(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("pages")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting page:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/pages");
  revalidatePath("/");

  return { success: true, error: null };
}

// Toggle page published status
export async function togglePagePublished(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current, error: fetchError } = await (supabase as any)
    .from("pages")
    .select("is_published, published_at, slug")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  const updateData: Record<string, unknown> = {
    is_published: !current.is_published,
    updated_at: new Date().toISOString(),
  };

  // Set published_at when first publishing
  if (!current.is_published && !current.published_at) {
    updateData.published_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pages")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling page status:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/pages");
  revalidatePath(`/${current.slug}`);
  revalidatePath("/");

  return { data, error: null };
}
