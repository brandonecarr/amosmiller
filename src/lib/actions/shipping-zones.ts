"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema
const shippingZoneSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string().optional().nullable(),
  states: z.array(z.string()).default([]),
  base_rate: z.number().min(0),
  per_lb_rate: z.number().min(0).default(0),
  min_order_amount: z.number().min(0).optional().nullable(),
  max_weight: z.number().min(0).optional().nullable(),
  carrier: z.enum(["usps", "ups", "fedex", "local"]).default("ups"),
  estimated_days_min: z.number().int().min(1).optional().nullable(),
  estimated_days_max: z.number().int().min(1).optional().nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

type ShippingZoneFormData = z.infer<typeof shippingZoneSchema>;

// Get all shipping zones
export async function getShippingZones(filters?: { is_active?: boolean }) {
  const supabase = await createClient();

  let query = supabase
    .from("shipping_zones")
    .select("*")
    .order("sort_order", { ascending: true });

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching shipping zones:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single shipping zone
export async function getShippingZone(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipping_zones")
    .select("*, schedule_assignments(*, schedules(*))")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching shipping zone:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Find shipping zone by state
export async function getShippingZoneByState(stateCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipping_zones")
    .select("*")
    .contains("states", [stateCode])
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error finding shipping zone:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new shipping zone
export async function createShippingZone(formData: ShippingZoneFormData) {
  const supabase = await createClient();

  const validated = shippingZoneSchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("shipping_zones")
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    console.error("Error creating shipping zone:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Update a shipping zone
export async function updateShippingZone(
  id: string,
  formData: Partial<ShippingZoneFormData>
) {
  const supabase = await createClient();

  const validated = shippingZoneSchema.partial().safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("shipping_zones")
    .update(validated.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating shipping zone:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");
  revalidatePath(`/admin/fulfillment/shipping-zones/${id}`);

  return { data, error: null };
}

// Delete a shipping zone
export async function deleteShippingZone(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("shipping_zones")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting shipping zone:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { success: true, error: null };
}

// Toggle zone active status
export async function toggleShippingZoneActive(id: string) {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("shipping_zones")
    .select("is_active")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  const { data, error } = await supabase
    .from("shipping_zones")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling shipping zone status:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Calculate shipping rate for an order
export async function calculateShippingRate(
  zoneId: string,
  totalWeight: number
) {
  const { data: zone, error } = await getShippingZone(zoneId);

  if (error || !zone) {
    return { rate: null, error: error || "Zone not found" };
  }

  // Check max weight
  if (zone.max_weight && totalWeight > zone.max_weight) {
    return { rate: null, error: "Order exceeds maximum weight for this zone" };
  }

  // Calculate rate
  const rate = zone.base_rate + totalWeight * (zone.per_lb_rate || 0);

  return {
    rate,
    carrier: zone.carrier,
    estimatedDays:
      zone.estimated_days_min && zone.estimated_days_max
        ? `${zone.estimated_days_min}-${zone.estimated_days_max} business days`
        : null,
    error: null,
  };
}
