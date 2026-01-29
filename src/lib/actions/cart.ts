"use server";

import { createClient } from "@/lib/supabase/server";

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  pricingType: "fixed" | "weight";
  basePrice: number;
  salePrice: number | null;
  weightUnit: "lb" | "oz" | "kg" | "g";
  estimatedWeight: number | null;
  quantity: number;
  imageUrl: string | null;
}

interface FulfillmentSelection {
  type: "pickup" | "delivery" | "shipping" | null;
  locationId: string | null;
  zoneId: string | null;
  scheduledDate: string | null;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
}

interface SavedCart {
  items: CartItem[];
  fulfillment: FulfillmentSelection;
  updatedAt: string;
}

// Get user's saved cart from database
export async function getSavedCart(userId: string): Promise<{ data: SavedCart | null; error: string | null }> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("user_carts")
    .select("cart_data, updated_at")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No cart found, not an error
      return { data: null, error: null };
    }
    console.error("Error fetching saved cart:", error);
    return { data: null, error: error.message };
  }

  return {
    data: {
      ...data.cart_data,
      updatedAt: data.updated_at,
    },
    error: null,
  };
}

// Save cart to database
export async function saveCart(
  userId: string,
  items: CartItem[],
  fulfillment: FulfillmentSelection
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const cartData = {
    items,
    fulfillment,
  };

  // Upsert cart data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_carts")
    .upsert({
      user_id: userId,
      cart_data: cartData,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error saving cart:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Clear user's saved cart
export async function clearSavedCart(userId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_carts")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error clearing saved cart:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Merge local cart with saved cart (used when user logs in)
export async function mergeCartWithSaved(
  userId: string,
  localItems: CartItem[],
  localFulfillment: FulfillmentSelection
): Promise<{ data: SavedCart | null; error: string | null }> {
  // Get saved cart
  const { data: savedCart } = await getSavedCart(userId);

  if (!savedCart || savedCart.items.length === 0) {
    // No saved cart, just save the local cart
    if (localItems.length > 0) {
      await saveCart(userId, localItems, localFulfillment);
    }
    return {
      data: {
        items: localItems,
        fulfillment: localFulfillment,
        updatedAt: new Date().toISOString(),
      },
      error: null,
    };
  }

  if (localItems.length === 0) {
    // No local cart, use saved cart
    return { data: savedCart, error: null };
  }

  // Merge carts - local cart takes precedence for existing items
  const mergedItems = [...savedCart.items];

  for (const localItem of localItems) {
    const existingIndex = mergedItems.findIndex(
      (item) => item.productId === localItem.productId && item.variantId === localItem.variantId
    );

    if (existingIndex >= 0) {
      // Update quantity (add local to saved)
      mergedItems[existingIndex] = {
        ...mergedItems[existingIndex],
        quantity: mergedItems[existingIndex].quantity + localItem.quantity,
      };
    } else {
      // Add new item
      mergedItems.push(localItem);
    }
  }

  // Use local fulfillment if set, otherwise use saved
  const mergedFulfillment = localFulfillment.type ? localFulfillment : savedCart.fulfillment;

  // Save merged cart
  await saveCart(userId, mergedItems, mergedFulfillment);

  return {
    data: {
      items: mergedItems,
      fulfillment: mergedFulfillment,
      updatedAt: new Date().toISOString(),
    },
    error: null,
  };
}

// Validate cart items against current inventory
export async function validateCartInventory(items: CartItem[]): Promise<{
  valid: boolean;
  invalidItems: Array<{
    productId: string;
    name: string;
    requested: number;
    available: number;
    removed: boolean;
  }>;
  error: string | null;
}> {
  if (items.length === 0) {
    return { valid: true, invalidItems: [], error: null };
  }

  const supabase = await createClient();
  const productIds = items.map((item) => item.productId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products, error } = await (supabase as any)
    .from("products")
    .select("id, name, track_inventory, stock_quantity, is_active")
    .in("id", productIds);

  if (error) {
    console.error("Error validating cart inventory:", error);
    return { valid: false, invalidItems: [], error: error.message };
  }

  const invalidItems: Array<{
    productId: string;
    name: string;
    requested: number;
    available: number;
    removed: boolean;
  }> = [];

  for (const item of items) {
    const product = products?.find((p: { id: string }) => p.id === item.productId);

    if (!product || !product.is_active) {
      // Product no longer exists or is inactive
      invalidItems.push({
        productId: item.productId,
        name: item.name,
        requested: item.quantity,
        available: 0,
        removed: true,
      });
      continue;
    }

    if (product.track_inventory && product.stock_quantity < item.quantity) {
      // Not enough stock
      invalidItems.push({
        productId: item.productId,
        name: item.name,
        requested: item.quantity,
        available: product.stock_quantity,
        removed: product.stock_quantity === 0,
      });
    }
  }

  return {
    valid: invalidItems.length === 0,
    invalidItems,
    error: null,
  };
}
