"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Update user profile
export async function updateProfile(data: {
  fullName?: string;
  phone?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName || null,
      phone: data.phone || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: error.message };
  }

  revalidatePath("/account/settings");
  revalidatePath("/account");

  return { error: null };
}

// Change password
export async function changePassword(newPassword: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Error changing password:", error);
    return { error: error.message };
  }

  return { error: null };
}
