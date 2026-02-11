"use server";

import { createClient } from "@/lib/supabase/server";

interface BundleItem {
  id?: string;
  product_id: string;
  productId?: string; // Alias for compatibility
  quantity: number;
  sort_order?: number;
}

interface BundleProduct {
  id: string;
  product_id: string;
  items: BundleItem[];
  product?: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price: number | null;
    images: string[];
    is_active: boolean;
  };
}

// Get bundle details by product ID
export async function getBundle(productId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("bundles")
    .select(`
      id,
      product_id,
      bundle_items(
        id,
        product_id,
        quantity,
        sort_order,
        product:products(id, name, slug, base_price, sale_price, images, is_active)
      ),
      product:products!bundles_product_id_fkey(
        id, name, slug, base_price, sale_price, images, is_active
      )
    `)
    .eq("product_id", productId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { data: null, error: null }; // Not a bundle
    }
    console.error("Error fetching bundle:", error);
    return { data: null, error: error.message };
  }

  // Transform bundle_items to items for compatibility
  if (data) {
    const transformedData = {
      ...data,
      items: data.bundle_items || [],
    };
    delete transformedData.bundle_items;
    return { data: transformedData as BundleProduct, error: null };
  }

  return { data: null, error: null };
}

// Check if a product is a bundle
export async function isProductBundle(productId: string): Promise<boolean> {
  const { data } = await getBundle(productId);
  return !!data;
}

// Validate bundle inventory (checks all items in the bundle)
export async function validateBundleInventory(
  productId: string,
  quantity: number
): Promise<{
  valid: boolean;
  insufficientItems: Array<{
    productId: string;
    name: string;
    required: number;
    available: number;
  }>;
  error: string | null;
}> {
  const { data: bundle, error } = await getBundle(productId);

  if (error) {
    return { valid: false, insufficientItems: [], error };
  }

  if (!bundle) {
    // Not a bundle, validation passes (regular inventory check should handle this)
    return { valid: true, insufficientItems: [], error: null };
  }

  const supabase = await createClient();
  const productIds = bundle.items.map((item) => item.product_id || item.productId);

  // Get all products in the bundle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products, error: productsError } = await (supabase as any)
    .from("products")
    .select("id, name, track_inventory, stock_quantity, is_active")
    .in("id", productIds);

  if (productsError) {
    console.error("Error fetching bundle products:", productsError);
    return { valid: false, insufficientItems: [], error: productsError.message };
  }

  const insufficientItems: Array<{
    productId: string;
    name: string;
    required: number;
    available: number;
  }> = [];

  for (const bundleItem of bundle.items) {
    const itemProductId = bundleItem.product_id || bundleItem.productId;
    const product = products?.find((p: { id: string }) => p.id === itemProductId);

    if (!product || !product.is_active) {
      insufficientItems.push({
        productId: itemProductId!,
        name: product?.name || "Unknown product",
        required: bundleItem.quantity * quantity,
        available: 0,
      });
      continue;
    }

    if (product.track_inventory) {
      const requiredQuantity = bundleItem.quantity * quantity;
      if (product.stock_quantity < requiredQuantity) {
        insufficientItems.push({
          productId: itemProductId!,
          name: product.name,
          required: requiredQuantity,
          available: product.stock_quantity,
        });
      }
    }
  }

  return {
    valid: insufficientItems.length === 0,
    insufficientItems,
    error: null,
  };
}

// Decrement inventory for all items in a bundle
export async function decrementBundleInventory(
  productId: string,
  quantity: number
): Promise<{ success: boolean; error: string | null }> {
  const { data: bundle, error } = await getBundle(productId);

  if (error) {
    return { success: false, error };
  }

  if (!bundle) {
    return { success: false, error: "Product is not a bundle" };
  }

  const supabase = await createClient();

  // Decrement each item in the bundle
  for (const bundleItem of bundle.items) {
    const itemProductId = bundleItem.product_id || bundleItem.productId;
    const decrementAmount = bundleItem.quantity * quantity;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product, error: fetchError } = await (supabase as any)
      .from("products")
      .select("stock_quantity, track_inventory")
      .eq("id", itemProductId)
      .single();

    if (fetchError) {
      console.error("Error fetching product for bundle decrement:", fetchError);
      continue; // Skip this item but continue with others
    }

    if (product.track_inventory) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("products")
        .update({
          stock_quantity: Math.max(0, product.stock_quantity - decrementAmount),
        })
        .eq("id", itemProductId);

      if (updateError) {
        console.error("Error decrementing bundle item inventory:", updateError);
      }
    }
  }

  return { success: true, error: null };
}

// Get all bundles (admin)
export async function getBundles() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("bundles")
    .select(`
      id,
      product_id,
      items,
      product:products!bundles_product_id_fkey(
        id, name, slug, base_price, sale_price, images, is_active
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bundles:", error);
    return { data: null, error: error.message };
  }

  return { data: data as BundleProduct[], error: null };
}

// Create a bundle
export async function createBundle(productId: string, items: BundleItem[]) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("bundles")
    .insert({
      product_id: productId,
      items,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating bundle:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Update a bundle's items
export async function updateBundleItems(
  bundleId: string,
  productIdOrItems: string | BundleItem[],
  items?: BundleItem[]
) {
  const supabase = await createClient();

  // Handle both signatures: (bundleId, items) and (bundleId, productId, items)
  const bundleItems = Array.isArray(productIdOrItems) ? productIdOrItems : items;

  if (!bundleItems) {
    return { data: null, error: "Items are required" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("bundles")
    .update({ items: bundleItems })
    .eq("id", bundleId)
    .select()
    .single();

  if (error) {
    console.error("Error updating bundle:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Alias for updateBundleItems
export const updateBundle = updateBundleItems;

// Delete a bundle
export async function deleteBundle(bundleId: string, _productId?: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("bundles")
    .delete()
    .eq("id", bundleId);

  if (error) {
    console.error("Error deleting bundle:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
