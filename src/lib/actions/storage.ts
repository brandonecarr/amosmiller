"use server";

import { createClient } from "@/lib/supabase/server";

// Upload an image to Supabase Storage
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${productId}/${Date.now()}.${fileExt}`;

  // Convert File to Buffer for reliable server-side upload
  // (File objects can lose binary data during server action serialization)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to storage
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(fileName, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error("Error uploading image:", error);
    return { url: null, error: error.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
}

// Delete an image from Supabase Storage
export async function deleteProductImage(
  imageUrl: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  // Extract path from URL
  const urlParts = imageUrl.split("/product-images/");
  if (urlParts.length !== 2) {
    return { success: false, error: "Invalid image URL" };
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from("product-images")
    .remove([filePath]);

  if (error) {
    console.error("Error deleting image:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Upload multiple images
export async function uploadProductImages(
  files: File[],
  productId: string
): Promise<{ urls: string[]; errors: string[] }> {
  const results = await Promise.all(
    files.map((file) => uploadProductImage(file, productId))
  );

  const urls: string[] = [];
  const errors: string[] = [];

  results.forEach((result) => {
    if (result.url) {
      urls.push(result.url);
    }
    if (result.error) {
      errors.push(result.error);
    }
  });

  return { urls, errors };
}

// Upload category image
export async function uploadCategoryImage(
  file: File,
  categoryId: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `categories/${categoryId}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(fileName, buffer, {
      cacheControl: "3600",
      upsert: true, // Overwrite if exists
      contentType: file.type,
    });

  if (error) {
    console.error("Error uploading category image:", error);
    return { url: null, error: error.message };
  }

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
}
