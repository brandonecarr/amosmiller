"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema
const fulfillmentLocationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  type: z.enum(["pickup", "delivery", "shipping"]),
  description: z.string().optional().nullable(),
  address_line1: z.string().max(255).optional().nullable(),
  address_line2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  country: z.string().max(100).default("United States"),
  contact_name: z.string().max(255).optional().nullable(),
  contact_phone: z.string().max(50).optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  instructions: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  is_coop: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

type FulfillmentLocationFormData = z.infer<typeof fulfillmentLocationSchema>;

// Get all fulfillment locations
export async function getFulfillmentLocations(filters?: {
  type?: "pickup" | "delivery" | "shipping";
  is_active?: boolean;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("fulfillment_locations")
    .select("*")
    .order("sort_order", { ascending: true });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching fulfillment locations:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single fulfillment location
export async function getFulfillmentLocation(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fulfillment_locations")
    .select("*, schedule_assignments(*, schedules(*))")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching fulfillment location:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new fulfillment location
export async function createFulfillmentLocation(formData: FulfillmentLocationFormData) {
  const supabase = await createClient();

  const validated = fulfillmentLocationSchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("fulfillment_locations")
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    console.error("Error creating fulfillment location:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Update a fulfillment location
export async function updateFulfillmentLocation(
  id: string,
  formData: Partial<FulfillmentLocationFormData>
) {
  const supabase = await createClient();

  const validated = fulfillmentLocationSchema.partial().safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("fulfillment_locations")
    .update(validated.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating fulfillment location:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");
  revalidatePath(`/admin/fulfillment/locations/${id}`);

  return { data, error: null };
}

// Delete a fulfillment location
export async function deleteFulfillmentLocation(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("fulfillment_locations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting fulfillment location:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { success: true, error: null };
}

// Toggle location active status
export async function toggleFulfillmentLocationActive(id: string) {
  const supabase = await createClient();

  // First get current status
  const { data: current, error: fetchError } = await supabase
    .from("fulfillment_locations")
    .select("is_active")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  // Toggle it
  const { data, error } = await supabase
    .from("fulfillment_locations")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling fulfillment location status:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/fulfillment");

  return { data, error: null };
}

// Reorder locations
export async function reorderFulfillmentLocations(orderedIds: string[]) {
  const supabase = await createClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("fulfillment_locations")
      .update({ sort_order: index })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    return { success: false, error: "Failed to reorder locations" };
  }

  revalidatePath("/admin/fulfillment");

  return { success: true, error: null };
}
