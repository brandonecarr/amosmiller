"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  featured_image_url: z.string().optional().nullable(),
  author_id: z.string().uuid().optional().nullable(),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
  is_published: z.boolean().default(false),
  published_at: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

// Get all blog posts (admin)
export async function getBlogPosts(filters?: {
  is_published?: boolean;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("blog_posts")
    .select("*, author:profiles(full_name)")
    .order("created_at", { ascending: false });

  if (filters?.is_published !== undefined) {
    query = query.eq("is_published", filters.is_published);
  }
  if (filters?.tag) {
    query = query.contains("tags", [filters.tag]);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching blog posts:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single blog post by ID
export async function getBlogPost(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("blog_posts")
    .select("*, author:profiles(full_name)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching blog post:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a published blog post by slug (storefront)
export async function getBlogPostBySlug(slug: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("blog_posts")
    .select("*, author:profiles(full_name)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get all unique tags from published posts
export async function getAllBlogTags() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("blog_posts")
    .select("tags")
    .eq("is_published", true);

  if (error) {
    console.error("Error fetching blog tags:", error);
    return { data: null, error: error.message };
  }

  // Flatten and deduplicate tags
  const allTags = (data || []).flatMap((post: { tags: string[] }) => post.tags || []);
  const uniqueTags = [...new Set(allTags)].sort();

  return { data: uniqueTags, error: null };
}

// Create a new blog post
export async function createBlogPost(formData: BlogPostFormData) {
  const supabase = await createClient();

  const validated = blogPostSchema.safeParse(formData);
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
  const { data: post, error } = await (supabase as any)
    .from("blog_posts")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Error creating blog post:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");

  return { data: post, error: null };
}

// Update a blog post
export async function updateBlogPost(id: string, formData: Partial<BlogPostFormData>) {
  const supabase = await createClient();

  const validated = blogPostSchema.partial().safeParse(formData);
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
      .from("blog_posts")
      .select("published_at, slug")
      .eq("id", id)
      .single();

    if (!existing?.published_at) {
      (data as Record<string, unknown>).published_at = new Date().toISOString();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: post, error } = await (supabase as any)
    .from("blog_posts")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating blog post:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);

  return { data: post, error: null };
}

// Delete a blog post
export async function deleteBlogPost(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting blog post:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");

  return { success: true, error: null };
}

// Toggle blog post published status
export async function toggleBlogPostPublished(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current, error: fetchError } = await (supabase as any)
    .from("blog_posts")
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

  if (!current.is_published && !current.published_at) {
    updateData.published_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("blog_posts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling blog post status:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${current.slug}`);

  return { data, error: null };
}
