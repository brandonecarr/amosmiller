"use server";

import { format, addDays } from "date-fns";
import { sendEmail } from "./resend";

interface SubscriptionEmailData {
  name: string;
  customer_email: string;
  customer_first_name?: string | null;
  frequency: string;
  next_order_date: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  total: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

function getFirstName(email: string, firstName?: string | null): string {
  return firstName || email.split("@")[0];
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f0e6; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .header { background-color: #2D5A3D; padding: 24px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
  .content { padding: 32px 24px; }
  .section { margin-bottom: 24px; }
  .button { display: inline-block; background-color: #2D5A3D; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
  .button-outline { display: inline-block; border: 2px solid #2D5A3D; color: #2D5A3D; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: 600; }
  .footer { background-color: #f5f0e6; padding: 24px; text-align: center; font-size: 14px; color: #666666; }
  .item-list { background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; }
  .item { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
  .item:last-child { border-bottom: none; }
`;

// Subscription confirmation email
export async function sendSubscriptionConfirmationEmail(subscription: SubscriptionEmailData) {
  const baseUrl = getBaseUrl();
  const firstName = getFirstName(subscription.customer_email, subscription.customer_first_name);

  const frequencyLabels: Record<string, string> = {
    weekly: "weekly",
    biweekly: "every two weeks",
    monthly: "monthly",
  };

  const subject = `Subscription Confirmed - ${subscription.name}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Your subscription "${subscription.name}" has been set up successfully! You'll receive fresh farm products ${frequencyLabels[subscription.frequency] || subscription.frequency}.</p>

          <div class="section">
            <h3 style="margin-bottom: 8px;">Your Items</h3>
            <div class="item-list">
              ${subscription.items.map((item) => `
                <div class="item">${item.name} × ${item.quantity}</div>
              `).join("")}
            </div>
            <p style="font-size: 18px; font-weight: bold;">
              Total: ${formatCurrency(subscription.total)} per delivery
            </p>
          </div>

          <div class="section">
            <h3>First Order</h3>
            <p style="font-size: 16px;">
              ${format(new Date(subscription.next_order_date), "EEEE, MMMM d, yyyy")}
            </p>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${baseUrl}/account/subscriptions" class="button">
              Manage Subscription
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for subscribing!</p>
          <p>Amos Miller Farm<br>amosmillerfarm.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Subscription Confirmed!

Hi ${firstName},

Your subscription "${subscription.name}" has been set up successfully!

Items:
${subscription.items.map((item) => `- ${item.name} × ${item.quantity}`).join("\n")}

Total: ${formatCurrency(subscription.total)} per delivery

First Order: ${format(new Date(subscription.next_order_date), "EEEE, MMMM d, yyyy")}

Manage your subscription: ${baseUrl}/account/subscriptions

Thank you for subscribing!
Amos Miller Farm
  `;

  return sendEmail({
    to: subscription.customer_email,
    subject,
    html,
    text,
  });
}

// Upcoming order reminder (sent 2-3 days before)
export async function sendSubscriptionReminderEmail(subscription: SubscriptionEmailData) {
  const baseUrl = getBaseUrl();
  const firstName = getFirstName(subscription.customer_email, subscription.customer_first_name);

  const subject = `Upcoming Order Reminder - ${subscription.name}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order is Coming Up!</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Just a heads up - your subscription order will be processed on <strong>${format(new Date(subscription.next_order_date), "EEEE, MMMM d")}</strong>.</p>

          <div class="section">
            <h3 style="margin-bottom: 8px;">Order Summary</h3>
            <div class="item-list">
              ${subscription.items.map((item) => `
                <div class="item">${item.name} × ${item.quantity}</div>
              `).join("")}
            </div>
            <p style="font-size: 18px; font-weight: bold;">
              Total: ${formatCurrency(subscription.total)}
            </p>
          </div>

          <p>Need to make changes? You can customize your items, skip this order, or pause your subscription from your account.</p>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${baseUrl}/account/subscriptions" class="button">
              Manage Subscription
            </a>
            <div style="margin-top: 12px;">
              <a href="${baseUrl}/account/subscriptions" class="button-outline">
                Skip This Order
              </a>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>Questions? Just reply to this email.</p>
          <p>Amos Miller Farm<br>amosmillerfarm.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Your Order is Coming Up!

Hi ${firstName},

Just a heads up - your subscription order will be processed on ${format(new Date(subscription.next_order_date), "EEEE, MMMM d")}.

Order Summary:
${subscription.items.map((item) => `- ${item.name} × ${item.quantity}`).join("\n")}

Total: ${formatCurrency(subscription.total)}

Need to make changes? Visit your account to customize items, skip this order, or pause your subscription.

Manage subscription: ${baseUrl}/account/subscriptions

Amos Miller Farm
  `;

  return sendEmail({
    to: subscription.customer_email,
    subject,
    html,
    text,
  });
}

// Subscription paused email
export async function sendSubscriptionPausedEmail(
  email: string,
  firstName: string | null,
  subscriptionName: string
) {
  const baseUrl = getBaseUrl();
  const name = getFirstName(email, firstName);

  const subject = `Subscription Paused - ${subscriptionName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Paused</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your subscription "${subscriptionName}" has been paused. You won't receive any orders until you resume it.</p>

          <p>When you're ready to start receiving fresh farm products again, just click the button below to resume your subscription.</p>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${baseUrl}/account/subscriptions" class="button">
              Resume Subscription
            </a>
          </div>
        </div>
        <div class="footer">
          <p>We hope to see you back soon!</p>
          <p>Amos Miller Farm<br>amosmillerfarm.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Your subscription "${subscriptionName}" has been paused. Resume it anytime at ${baseUrl}/account/subscriptions`,
  });
}

// Subscription cancelled email
export async function sendSubscriptionCancelledEmail(
  email: string,
  firstName: string | null,
  subscriptionName: string
) {
  const baseUrl = getBaseUrl();
  const name = getFirstName(email, firstName);

  const subject = `Subscription Cancelled - ${subscriptionName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Cancelled</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your subscription "${subscriptionName}" has been cancelled. We're sorry to see you go!</p>

          <p>If you ever want to subscribe again, we'd love to have you back. Visit our shop to set up a new subscription anytime.</p>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${baseUrl}/shop" class="button">
              Visit Shop
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for being a customer!</p>
          <p>Amos Miller Farm<br>amosmillerfarm.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Your subscription "${subscriptionName}" has been cancelled. Subscribe again anytime at ${baseUrl}/shop`,
  });
}
