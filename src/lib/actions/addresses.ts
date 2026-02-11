"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Address {
  id: string;
  user_id: string;
  label: string;
  is_default: boolean;
  full_name: string;
  company: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  delivery_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddressInput {
  label: string;
  is_default?: boolean;
  full_name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  phone?: string;
  delivery_instructions?: string;
}

// Get all addresses for the current user
export async function getUserAddresses() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching addresses:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Get a single address
export async function getAddress(addressId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", addressId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching address:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Create a new address
export async function createAddress(input: AddressInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // If this is set as default, unset any existing default
  if (input.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("is_default", true);
  }

  // Check if this is the first address - make it default
  const { count } = await supabase
    .from("addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isFirstAddress = count === 0;

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      label: input.label,
      is_default: input.is_default || isFirstAddress,
      full_name: input.full_name,
      company: input.company || null,
      address_line1: input.address_line1,
      address_line2: input.address_line2 || null,
      city: input.city,
      state: input.state,
      postal_code: input.postal_code,
      country: input.country || "US",
      phone: input.phone || null,
      delivery_instructions: input.delivery_instructions || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating address:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { data, error: null };
}

// Update an address
export async function updateAddress(addressId: string, input: Partial<AddressInput>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("addresses")
    .select("id")
    .eq("id", addressId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return { data: null, error: "Address not found" };
  }

  // If setting as default, unset any existing default
  if (input.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("addresses")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", addressId)
    .select()
    .single();

  if (error) {
    console.error("Error updating address:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { data, error: null };
}

// Delete an address
export async function deleteAddress(addressId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if this was the default address
  const { data: address } = await supabase
    .from("addresses")
    .select("is_default")
    .eq("id", addressId)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting address:", error);
    return { success: false, error: error.message };
  }

  // If we deleted the default, make the most recent address the new default
  if (address?.is_default) {
    const { data: remaining } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", remaining[0].id);
    }
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { success: true, error: null };
}

// Set an address as default
export async function setDefaultAddress(addressId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Unset any existing default
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id)
    .eq("is_default", true);

  // Set the new default
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error setting default address:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { success: true, error: null };
}

// Get the default address for the current user
export async function getDefaultAddress() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching default address:", error);
    return { data: null, error: error.message };
  }

  return { data: data || null, error: null };
}

// Save address from checkout (internal helper)
export async function saveAddressFromCheckout({
  userId,
  firstName,
  lastName,
  addressLine1,
  addressLine2,
  city,
  state,
  postalCode,
  country = "US",
  phone,
  label,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone?: string | null;
  label: "Shipping" | "Billing";
}) {
  const supabase = await createClient();

  // Check if this exact address already exists for this user
  const { data: existing } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", userId)
    .eq("address_line1", addressLine1)
    .eq("city", city)
    .eq("state", state)
    .eq("postal_code", postalCode)
    .maybeSingle();

  // If address already exists, don't create a duplicate
  if (existing) {
    return { data: existing, error: null };
  }

  // Check if this is the first address - make it default
  const { count } = await supabase
    .from("addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const isFirstAddress = count === 0;

  // Create the new address
  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: userId,
      label,
      is_default: isFirstAddress,
      full_name: `${firstName} ${lastName}`,
      company: null,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      city,
      state,
      postal_code: postalCode,
      country,
      phone: phone || null,
      delivery_instructions: null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving address from checkout:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
