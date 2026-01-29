"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema
const deliveryZoneSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string().optional().nullable(),
  zip_codes: z.array(z.string()).default([]),
  delivery_fee: z.number().min(0).default(0),
  min_order_amount: z.number().min(0).optional().nullable(),
  free_delivery_threshold: z.number().min(0).optional().nullable(),
  pricing_tier_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

type DeliveryZoneFormData = z.infer<typeof deliveryZoneSchema>;

// Get all delivery zones
export async function getDeliveryZones(filters?: { is_active?: boolean }) {
  const supabase = await createClient();

  let query = supabase
    .from("delivery_zones")
    .select("*, pricing_tiers(name)")
    .order("sort_order", { ascending: true });

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching delivery zones:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single delivery zone
export async function getDeliveryZone(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*, pricing_tiers(name), schedule_assignments(*, schedules(*))")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching delivery zone:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Find delivery zone by zip code
export async function getDeliveryZoneByZip(zipCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .contains("zip_codes", [zipCode])
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error finding delivery zone:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new delivery zone
export async function createDeliveryZone(formData: DeliveryZoneFormData) {
  const supabase = await createClient();

  const validated = deliveryZoneSchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("delivery_zones")
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    console.error("Error creating delivery zone:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Update a delivery zone
export async function updateDeliveryZone(
  id: string,
  formData: Partial<DeliveryZoneFormData>
) {
  const supabase = await createClient();

  const validated = deliveryZoneSchema.partial().safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("delivery_zones")
    .update(validated.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating delivery zone:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");
  revalidatePath(`/admin/fulfillment/delivery-zones/${id}`);

  return { data, error: null };
}

// Delete a delivery zone
export async function deleteDeliveryZone(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_zones")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting delivery zone:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { success: true, error: null };
}

// Toggle zone active status
export async function toggleDeliveryZoneActive(id: string) {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("delivery_zones")
    .select("is_active")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  const { data, error } = await supabase
    .from("delivery_zones")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling delivery zone status:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Add zip codes to zone
export async function addZipCodesToZone(id: string, zipCodes: string[]) {
  const supabase = await createClient();

  // Get current zip codes
  const { data: current, error: fetchError } = await supabase
    .from("delivery_zones")
    .select("zip_codes")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  // Merge and dedupe
  const existingZips = current.zip_codes || [];
  const newZips = [...new Set([...existingZips, ...zipCodes])];

  const { data, error } = await supabase
    .from("delivery_zones")
    .update({ zip_codes: newZips })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error adding zip codes:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Remove zip code from zone
export async function removeZipCodeFromZone(id: string, zipCode: string) {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("delivery_zones")
    .select("zip_codes")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  const newZips = (current.zip_codes || []).filter((z: string) => z !== zipCode);

  const { data, error } = await supabase
    .from("delivery_zones")
    .update({ zip_codes: newZips })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error removing zip code:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}
