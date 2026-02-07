"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schemas
const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  sku: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  pricing_type: z.enum(["fixed", "weight"]).default("fixed"),
  base_price: z.number().min(0),
  sale_price: z.number().min(0).optional().nullable(),
  cost_price: z.number().min(0).optional().nullable(),
  weight_unit: z.enum(["lb", "oz", "kg", "g"]).default("lb"),
  estimated_weight: z.number().min(0).optional().nullable(),
  min_weight: z.number().min(0).optional().nullable(),
  max_weight: z.number().min(0).optional().nullable(),
  price_per_unit: z.number().min(0).optional().nullable(),
  track_inventory: z.boolean().default(true),
  stock_quantity: z.number().int().min(0).default(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  shelf_location: z.string().max(100).optional().nullable(),
  allow_backorder: z.boolean().default(false),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    sort_order: z.number().optional(),
  })).default([]),
  featured_image_url: z.string().url().optional().nullable(),
  tags: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_taxable: z.boolean().default(true),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().optional().nullable(),
  // Subscription fields
  is_subscribable: z.boolean().default(false),
  subscription_frequencies: z.array(z.enum(["weekly", "biweekly", "monthly"])).default([]),
  min_subscription_quantity: z.number().int().min(1).default(1),
  max_subscription_quantity: z.number().int().min(1).default(10),
});

type ProductFormData = z.infer<typeof productSchema>;

// Input type for form (with string numbers that need conversion)
interface ProductFormInput {
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description: string;
  category_id: string;
  pricing_type: "fixed" | "weight";
  base_price: string;
  sale_price: string;
  weight_unit: "lb" | "oz" | "kg" | "g";
  estimated_weight: string;
  min_weight: string;
  max_weight: string;
  track_inventory: boolean;
  stock_quantity: string;
  low_stock_threshold: string;
  shelf_location: string;
  is_active: boolean;
  is_featured: boolean;
  is_taxable: boolean;
  tags: string[];
  images: { url: string; alt: string }[];
  featured_image_url?: string;
  // Subscription fields
  is_subscribable?: boolean;
  subscription_frequencies?: ("weekly" | "biweekly" | "monthly")[];
  min_subscription_quantity?: string;
  max_subscription_quantity?: string;
}

// Convert form input to schema format
function convertFormInput(input: ProductFormInput): ProductFormData {
  return {
    name: input.name,
    slug: input.slug,
    sku: input.sku || null,
    description: input.description || null,
    short_description: input.short_description || null,
    category_id: input.category_id || null,
    pricing_type: input.pricing_type,
    base_price: parseFloat(input.base_price) || 0,
    sale_price: input.sale_price ? parseFloat(input.sale_price) : null,
    weight_unit: input.weight_unit,
    estimated_weight: input.estimated_weight ? parseFloat(input.estimated_weight) : null,
    min_weight: input.min_weight ? parseFloat(input.min_weight) : null,
    max_weight: input.max_weight ? parseFloat(input.max_weight) : null,
    track_inventory: input.track_inventory,
    stock_quantity: parseInt(input.stock_quantity) || 0,
    low_stock_threshold: parseInt(input.low_stock_threshold) || 5,
    shelf_location: input.shelf_location || null,
    allow_backorder: false,
    is_active: input.is_active,
    is_featured: input.is_featured,
    is_taxable: input.is_taxable,
    tags: input.tags,
    images: input.images,
    featured_image_url: input.featured_image_url || (input.images.length > 0 ? input.images[0].url : null),
    // Subscription fields
    is_subscribable: input.is_subscribable || false,
    subscription_frequencies: input.subscription_frequencies || [],
    min_subscription_quantity: input.min_subscription_quantity ? parseInt(input.min_subscription_quantity) : 1,
    max_subscription_quantity: input.max_subscription_quantity ? parseInt(input.max_subscription_quantity) : 10,
  };
}

// Get all products with optional filters
export async function getProducts(filters?: {
  category_id?: string;
  is_active?: boolean;
  is_featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, categories(name, slug)")
    .order("created_at", { ascending: false });

  if (filters?.category_id) {
    query = query.eq("category_id", filters.category_id);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.is_featured !== undefined) {
    query = query.eq("is_featured", filters.is_featured);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single product by ID
export async function getProduct(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name, slug), product_variants(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single product by slug
export async function getProductBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name, slug), product_variants(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new product
export async function createProduct(formInput: ProductFormInput) {
  const supabase = await createClient();

  // Convert and validate input
  const formData = convertFormInput(formInput);
  const validated = productSchema.safeParse(formData);

  if (!validated.success) {
    console.error("Validation error:", validated.error.issues);
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("products")
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");

  return { data, error: null };
}

// Update a product
export async function updateProduct(id: string, formInput: Partial<ProductFormInput>) {
  const supabase = await createClient();

  // Convert form input to proper types
  const formData: Partial<ProductFormData> = {};

  if (formInput.name !== undefined) formData.name = formInput.name;
  if (formInput.slug !== undefined) formData.slug = formInput.slug;
  if (formInput.sku !== undefined) formData.sku = formInput.sku || null;
  if (formInput.description !== undefined) formData.description = formInput.description || null;
  if (formInput.short_description !== undefined) formData.short_description = formInput.short_description || null;
  if (formInput.category_id !== undefined) formData.category_id = formInput.category_id || null;
  if (formInput.pricing_type !== undefined) formData.pricing_type = formInput.pricing_type;
  if (formInput.base_price !== undefined) formData.base_price = parseFloat(formInput.base_price) || 0;
  if (formInput.sale_price !== undefined) formData.sale_price = formInput.sale_price ? parseFloat(formInput.sale_price) : null;
  if (formInput.weight_unit !== undefined) formData.weight_unit = formInput.weight_unit;
  if (formInput.estimated_weight !== undefined) formData.estimated_weight = formInput.estimated_weight ? parseFloat(formInput.estimated_weight) : null;
  if (formInput.min_weight !== undefined) formData.min_weight = formInput.min_weight ? parseFloat(formInput.min_weight) : null;
  if (formInput.max_weight !== undefined) formData.max_weight = formInput.max_weight ? parseFloat(formInput.max_weight) : null;
  if (formInput.track_inventory !== undefined) formData.track_inventory = formInput.track_inventory;
  if (formInput.stock_quantity !== undefined) formData.stock_quantity = parseInt(formInput.stock_quantity) || 0;
  if (formInput.low_stock_threshold !== undefined) formData.low_stock_threshold = parseInt(formInput.low_stock_threshold) || 5;
  if (formInput.shelf_location !== undefined) formData.shelf_location = formInput.shelf_location || null;
  if (formInput.is_active !== undefined) formData.is_active = formInput.is_active;
  if (formInput.is_featured !== undefined) formData.is_featured = formInput.is_featured;
  if (formInput.is_taxable !== undefined) formData.is_taxable = formInput.is_taxable;
  if (formInput.tags !== undefined) formData.tags = formInput.tags;
  if (formInput.images !== undefined) formData.images = formInput.images;
  // Subscription fields
  if (formInput.is_subscribable !== undefined) formData.is_subscribable = formInput.is_subscribable;
  if (formInput.subscription_frequencies !== undefined) formData.subscription_frequencies = formInput.subscription_frequencies;
  if (formInput.min_subscription_quantity !== undefined) formData.min_subscription_quantity = parseInt(formInput.min_subscription_quantity) || 1;
  if (formInput.max_subscription_quantity !== undefined) formData.max_subscription_quantity = parseInt(formInput.max_subscription_quantity) || 10;

  const { data, error } = await supabase
    .from("products")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/shop");
  revalidatePath("/");

  return { data, error: null };
}

// Delete a product
export async function deleteProduct(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");

  return { success: true, error: null };
}

// Toggle product active status
export async function toggleProductActive(id: string, is_active: boolean) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .update({ is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling product status:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");

  return { data, error: null };
}

// Update product stock
export async function updateProductStock(id: string, stock_quantity: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .update({ stock_quantity })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating stock:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");

  return { data, error: null };
}

// Get related products (same category)
export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", excludeId)
    .limit(limit);

  if (error) {
    console.error("Error fetching related products:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get subscribable products for shop
export async function getSubscribableProducts(filters?: {
  category_id?: string;
  search?: string;
  limit?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("is_active", true)
    .eq("is_subscribable", true)
    .order("name");

  if (filters?.category_id) {
    query = query.eq("category_id", filters.category_id);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching subscribable products:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Update product subscription settings
export async function updateProductSubscriptionSettings(
  productId: string,
  settings: {
    is_subscribable: boolean;
    subscription_frequencies: ("weekly" | "biweekly" | "monthly")[];
    min_subscription_quantity: number;
    max_subscription_quantity: number;
  }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .update({
      is_subscribable: settings.is_subscribable,
      subscription_frequencies: settings.subscription_frequencies,
      min_subscription_quantity: settings.min_subscription_quantity,
      max_subscription_quantity: settings.max_subscription_quantity,
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    console.error("Error updating subscription settings:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/shop");

  return { data, error: null };
}

// Bulk update subscription status for multiple products
export async function bulkUpdateSubscriptionStatus(
  productIds: string[],
  is_subscribable: boolean
) {
  const supabase = await createClient();

  const defaultFrequencies = is_subscribable ? ["monthly"] : [];

  const { error } = await supabase
    .from("products")
    .update({
      is_subscribable,
      subscription_frequencies: defaultFrequencies,
    })
    .in("id", productIds);

  if (error) {
    console.error("Error bulk updating subscription status:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/shop");

  return { success: true, error: null };
}
