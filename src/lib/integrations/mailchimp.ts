const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX; // e.g. "us21"
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;

function getMailchimpBaseUrl() {
  if (!MAILCHIMP_SERVER_PREFIX) return null;
  return `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
    "Content-Type": "application/json",
  };
}

function md5Hash(email: string): string {
  // Simple hash for subscriber lookup - Mailchimp uses lowercase MD5
  const crypto = require("crypto");
  return crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
}

// Add or update a subscriber in Mailchimp
export async function syncSubscriber(params: {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
}) {
  const baseUrl = getMailchimpBaseUrl();
  if (!baseUrl || !MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
    return { success: false, error: "Mailchimp not configured" };
  }

  const subscriberHash = md5Hash(params.email);

  try {
    const response = await fetch(
      `${baseUrl}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          email_address: params.email,
          status_if_new: "subscribed",
          merge_fields: {
            FNAME: params.firstName || "",
            LNAME: params.lastName || "",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Mailchimp sync error:", error);
      return { success: false, error: error.detail || "Failed to sync subscriber" };
    }

    // Add tags if provided
    if (params.tags && params.tags.length > 0) {
      await fetch(
        `${baseUrl}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            tags: params.tags.map((tag) => ({
              name: tag,
              status: "active",
            })),
          }),
        }
      );
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Mailchimp sync error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Sync a customer after order
export async function syncCustomerAfterOrder(params: {
  email: string;
  firstName?: string;
  lastName?: string;
  orderTotal: number;
}) {
  const tags = ["Customer"];
  if (params.orderTotal >= 100) tags.push("High Value");

  return syncSubscriber({
    email: params.email,
    firstName: params.firstName,
    lastName: params.lastName,
    tags,
  });
}

// Sync subscriber on registration
export async function syncNewCustomer(params: {
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  return syncSubscriber({
    email: params.email,
    firstName: params.firstName,
    lastName: params.lastName,
    tags: ["Customer", "New"],
  });
}

// Check if Mailchimp is configured
export function isMailchimpConfigured(): boolean {
  return !!(MAILCHIMP_API_KEY && MAILCHIMP_SERVER_PREFIX && MAILCHIMP_LIST_ID);
}
