"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const emailTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(255),
  body: z.string().min(1),
  is_active: z.boolean().default(true),
});

/**
 * Get all email templates
 */
export async function getEmailTemplates() {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("email_templates")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching email templates:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Get a single email template
 */
export async function getEmailTemplate(id: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching email template:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Create a new email template
 */
export async function createEmailTemplate(formData: {
  name: string;
  subject: string;
  body: string;
  is_active?: boolean;
}) {
  const supabase = await createClient();

  const validated = emailTemplateSchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await (supabase as any)
    .from("email_templates")
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    console.error("Error creating email template:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/settings/email-templates");

  return { data, error: null };
}

/**
 * Update an email template
 */
export async function updateEmailTemplate(
  id: string,
  formData: {
    name?: string;
    subject?: string;
    body?: string;
    is_active?: boolean;
  }
) {
  const supabase = await createClient();

  const validated = emailTemplateSchema.partial().safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0].message };
  }

  const { data, error } = await (supabase as any)
    .from("email_templates")
    .update(validated.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating email template:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/settings/email-templates");
  revalidatePath(`/admin/settings/email-templates/${id}`);

  return { data, error: null };
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplate(id: string) {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from("email_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting email template:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/settings/email-templates");

  return { success: true, error: null };
}

/**
 * Send a test email using a template
 */
export async function sendTestEmail(templateId: string, testEmail: string) {
  const { sendTestNotification } = await import("@/lib/notifications/dispatcher");
  
  const supabase = await createClient();
  
  const { data: template } = await (supabase as any)
    .from("email_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (!template) {
    return { success: false, error: "Template not found" };
  }

  const result = await sendTestNotification(template.name, testEmail);
  
  return result;
}
