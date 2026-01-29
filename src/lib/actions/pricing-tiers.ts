"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface PricingTier {
  id: string;
  name: string;
  slug: string;
  discount_percentage: number;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

interface ProductPriceOverride {
  product_id: string;
  pricing_tier_id: string;
  price: number;
}

// Get all pricing tiers
export async function getPricingTiers() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pricing_tiers")
    .select("*")
    .order("discount_percentage", { ascending: true });

  if (error) {
    console.error("Error fetching pricing tiers:", error);
    return { data: null, error: error.message };
  }

  return { data: data as PricingTier[], error: null };
}

// Get a single pricing tier
export async function getPricingTier(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pricing_tiers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching pricing tier:", error);
    return { data: null, error: error.message };
  }

  return { data: data as PricingTier, error: null };
}

// Get pricing tier by slug
export async function getPricingTierBySlug(slug: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pricing_tiers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { data: null, error: null };
    }
    console.error("Error fetching pricing tier by slug:", error);
    return { data: null, error: error.message };
  }

  return { data: data as PricingTier, error: null };
}

// Get default pricing tier (retail)
export async function getDefaultPricingTier() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("pricing_tiers")
    .select("*")
    .eq("is_default", true)
    .single();

  if (error) {
    // Return a default if none set
    return {
      data: {
        id: "default",
        name: "Retail",
        slug: "retail",
        discount_percentage: 0,
        description: "Standard retail pricing",
        is_default: true,
        created_at: new Date().toISOString(),
      } as PricingTier,
      error: null,
    };
  }

  return { data: data as PricingTier, error: null };
}

// Create a pricing tier
export async function createPricingTier(data: {
  name: string;
  slug: string;
  discount_percentage: number;
  description?: string;
}) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tier, error } = await (supabase as any)
    .from("pricing_tiers")
    .insert({
      name: data.name,
      slug: data.slug.toLowerCase().replace(/\s+/g, "-"),
      discount_percentage: data.discount_percentage,
      description: data.description || null,
      is_default: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating pricing tier:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/settings");

  return { data: tier as PricingTier, error: null };
}

// Update a pricing tier
export async function updatePricingTier(
  id: string,
  data: {
    name?: string;
    slug?: string;
    discount_percentage?: number;
    description?: string;
  }
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (data.name) updateData.name = data.name;
  if (data.slug) updateData.slug = data.slug.toLowerCase().replace(/\s+/g, "-");
  if (data.discount_percentage !== undefined)
    updateData.discount_percentage = data.discount_percentage;
  if (data.description !== undefined) updateData.description = data.description;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tier, error } = await (supabase as any)
    .from("pricing_tiers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating pricing tier:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/settings");

  return { data: tier as PricingTier, error: null };
}

// Delete a pricing tier
export async function deletePricingTier(id: string) {
  const supabase = await createClient();

  // Check if tier is default
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tier } = await (supabase as any)
    .from("pricing_tiers")
    .select("is_default")
    .eq("id", id)
    .single();

  if (tier?.is_default) {
    return { success: false, error: "Cannot delete the default pricing tier" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("pricing_tiers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting pricing tier:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/settings");

  return { success: true, error: null };
}

// Get user's pricing tier
export async function getUserPricingTier(userId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user, error } = await (supabase as any)
    .from("users")
    .select(`
      pricing_tier_id,
      pricing_tier:pricing_tiers(*)
    `)
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user pricing tier:", error);
    return getDefaultPricingTier();
  }

  if (!user.pricing_tier) {
    return getDefaultPricingTier();
  }

  return { data: user.pricing_tier as PricingTier, error: null };
}

// Assign pricing tier to user
export async function assignUserPricingTier(userId: string, tierId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("users")
    .update({ pricing_tier_id: tierId })
    .eq("id", userId);

  if (error) {
    console.error("Error assigning pricing tier:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/customers");

  return { success: true, error: null };
}

// Calculate price with tier discount
export async function calculateTieredPrice(
  basePrice: number,
  userId?: string
): Promise<{ price: number; tierName: string; discountPercentage: number }> {
  if (!userId) {
    return {
      price: basePrice,
      tierName: "Retail",
      discountPercentage: 0,
    };
  }

  const { data: tier } = await getUserPricingTier(userId);

  if (!tier || tier.discount_percentage === 0) {
    return {
      price: basePrice,
      tierName: tier?.name || "Retail",
      discountPercentage: 0,
    };
  }

  const discountedPrice = basePrice * (1 - tier.discount_percentage / 100);

  return {
    price: Math.round(discountedPrice * 100) / 100,
    tierName: tier.name,
    discountPercentage: tier.discount_percentage,
  };
}

// Get product price overrides for a tier
export async function getProductPriceOverrides(tierId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("product_price_overrides")
    .select(`
      *,
      product:products(id, name, base_price)
    `)
    .eq("pricing_tier_id", tierId);

  if (error) {
    console.error("Error fetching price overrides:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Set product price override for a tier
export async function setProductPriceOverride(
  productId: string,
  tierId: string,
  price: number
) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("product_price_overrides")
    .upsert({
      product_id: productId,
      pricing_tier_id: tierId,
      price,
    });

  if (error) {
    console.error("Error setting price override:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");

  return { success: true, error: null };
}

// Delete product price override
export async function deleteProductPriceOverride(productId: string, tierId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("product_price_overrides")
    .delete()
    .eq("product_id", productId)
    .eq("pricing_tier_id", tierId);

  if (error) {
    console.error("Error deleting price override:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");

  return { success: true, error: null };
}

// Get final product price for a user (considers tier discount and overrides)
export async function getProductPriceForUser(
  productId: string,
  basePrice: number,
  userId?: string
): Promise<{
  price: number;
  originalPrice: number;
  tierName: string;
  hasDiscount: boolean;
}> {
  if (!userId) {
    return {
      price: basePrice,
      originalPrice: basePrice,
      tierName: "Retail",
      hasDiscount: false,
    };
  }

  const { data: tier } = await getUserPricingTier(userId);

  if (!tier) {
    return {
      price: basePrice,
      originalPrice: basePrice,
      tierName: "Retail",
      hasDiscount: false,
    };
  }

  const supabase = await createClient();

  // Check for specific price override first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: override } = await (supabase as any)
    .from("product_price_overrides")
    .select("price")
    .eq("product_id", productId)
    .eq("pricing_tier_id", tier.id)
    .single();

  if (override) {
    return {
      price: override.price,
      originalPrice: basePrice,
      tierName: tier.name,
      hasDiscount: override.price < basePrice,
    };
  }

  // Apply tier percentage discount
  if (tier.discount_percentage > 0) {
    const discountedPrice = basePrice * (1 - tier.discount_percentage / 100);
    return {
      price: Math.round(discountedPrice * 100) / 100,
      originalPrice: basePrice,
      tierName: tier.name,
      hasDiscount: true,
    };
  }

  return {
    price: basePrice,
    originalPrice: basePrice,
    tierName: tier.name,
    hasDiscount: false,
  };
}

// Get location-based pricing (for delivery zones with special pricing)
export async function getLocationBasedPrice(
  productId: string,
  basePrice: number,
  deliveryZoneId?: string
): Promise<{ price: number; hasLocationDiscount: boolean }> {
  if (!deliveryZoneId) {
    return { price: basePrice, hasLocationDiscount: false };
  }

  const supabase = await createClient();

  // Check if zone has a pricing tier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: zone, error } = await (supabase as any)
    .from("delivery_zones")
    .select(`
      pricing_tier_id,
      pricing_tier:pricing_tiers(discount_percentage)
    `)
    .eq("id", deliveryZoneId)
    .single();

  if (error || !zone?.pricing_tier) {
    return { price: basePrice, hasLocationDiscount: false };
  }

  const discountPercentage = zone.pricing_tier.discount_percentage;

  if (discountPercentage > 0) {
    const discountedPrice = basePrice * (1 - discountPercentage / 100);
    return {
      price: Math.round(discountedPrice * 100) / 100,
      hasLocationDiscount: true,
    };
  }

  return { price: basePrice, hasLocationDiscount: false };
}
