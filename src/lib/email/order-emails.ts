"use server";

import { sendEmail } from "./resend";
import {
  orderConfirmationEmail,
  orderStatusUpdateEmail,
  trackingAddedEmail,
  paymentCapturedEmail,
} from "./templates";
import { generateInvoicePDF } from "../pdf/invoice";

interface OrderEmailData {
  order_number: number;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  customer_email: string;
  customer_phone?: string | null;
  status: string;
  fulfillment_type: string;
  scheduled_date?: string | null;
  shipping_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  subtotal: number;
  shipping_fee: number;
  membership_fee?: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  tracking_number?: string | null;
  tracking_url?: string | null;
  created_at: string;
  order_items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    pricing_type: string;
    actual_weight?: number | null;
    estimated_weight?: number | null;
  }>;
  fulfillment_locations?: {
    name: string;
    address_line1?: string;
    city?: string;
    state?: string;
  } | null;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  const baseUrl = getBaseUrl();
  const { subject, html, text } = orderConfirmationEmail(order, baseUrl);

  return sendEmail({
    to: order.customer_email,
    subject,
    html,
    text,
  });
}

export async function sendOrderStatusUpdateEmail(order: OrderEmailData, newStatus: string) {
  // Only send emails for certain status changes
  const emailableStatuses = ["processing", "packed", "shipped", "delivered"];
  if (!emailableStatuses.includes(newStatus)) {
    return { success: true, skipped: true };
  }

  const baseUrl = getBaseUrl();
  const { subject, html, text } = orderStatusUpdateEmail(order, newStatus, baseUrl);

  // Generate and attach PDF invoice when order is shipped
  const attachments = [];
  if (newStatus === "shipped") {
    try {
      const pdfBuffer = await generateInvoicePDF(order);
      attachments.push({
        filename: `invoice-${order.order_number}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      });
    } catch (error: any) {
      console.error("❌ PDF Generation Error:", {
        message: error.message,
        stack: error.stack,
        order_number: order.order_number,
      });
      // Continue sending email even if PDF generation fails
    }
  }

  return sendEmail({
    to: order.customer_email,
    subject,
    html,
    text,
    attachments: attachments.length > 0 ? attachments : undefined,
  });
}

export async function sendTrackingAddedEmail(order: OrderEmailData) {
  if (!order.tracking_number) {
    return { success: false, error: "No tracking number provided" };
  }

  const baseUrl = getBaseUrl();
  const { subject, html, text } = trackingAddedEmail(order, baseUrl);

  return sendEmail({
    to: order.customer_email,
    subject,
    html,
    text,
  });
}

export async function sendPaymentCapturedEmail(order: OrderEmailData) {
  const baseUrl = getBaseUrl();
  const { subject, html, text } = paymentCapturedEmail(order, baseUrl);

  return sendEmail({
    to: order.customer_email,
    subject,
    html,
    text,
  });
}
