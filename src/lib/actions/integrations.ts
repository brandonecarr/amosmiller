"use server";

import { syncNewCustomer } from "@/lib/integrations/mailchimp";

export async function syncRegistrationToMailchimp(params: {
  email: string;
  fullName?: string;
}) {
  try {
    const nameParts = params.fullName?.split(" ") || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    await syncNewCustomer({
      email: params.email,
      firstName,
      lastName,
    });
    return { success: true };
  } catch (error) {
    console.error("Error syncing registration to Mailchimp:", error);
    return { success: false };
  }
}
