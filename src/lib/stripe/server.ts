import Stripe from "stripe";

// Lazy-load Stripe client to avoid build-time errors
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Export for direct access when needed
export const stripe = {
  get instance() {
    return getStripe();
  },
};

// Helper to create a payment intent with authorization only (capture later)
export async function createPaymentIntent({
  amount,
  currency = "usd",
  customerId,
  metadata,
}: {
  amount: number; // in cents
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  return getStripe().paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    capture_method: "manual", // Authorize only, capture later
    metadata,
  });
}

// Capture a payment intent after order is packed/weighed
export async function capturePaymentIntent(
  paymentIntentId: string,
  amountToCapture?: number // Optional: capture a different amount
) {
  return getStripe().paymentIntents.capture(paymentIntentId, {
    amount_to_capture: amountToCapture,
  });
}

// Create or get Stripe customer
export async function getOrCreateStripeCustomer({
  email,
  name,
  metadata,
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  const stripeClient = getStripe();

  // Check if customer exists
  const existingCustomers = await stripeClient.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  return stripeClient.customers.create({
    email,
    name,
    metadata,
  });
}

// Create a subscription
export async function createSubscription({
  customerId,
  priceId,
  metadata,
}: {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}) {
  return getStripe().subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
    metadata,
  });
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  return getStripe().subscriptions.cancel(subscriptionId);
}

// Pause a subscription (cancel at period end)
export async function pauseSubscription(subscriptionId: string) {
  return getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Resume a paused subscription
export async function resumeSubscription(subscriptionId: string) {
  return getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// Refund a payment
export async function refundPayment(
  chargeId: string,
  amount?: number // Optional partial refund amount in cents
) {
  return getStripe().refunds.create({
    charge: chargeId,
    amount,
  });
}

// Get payment intent details
export async function getPaymentIntent(paymentIntentId: string) {
  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

// Update payment intent amount (before capture)
export async function updatePaymentIntentAmount(
  paymentIntentId: string,
  amount: number // in cents
) {
  return getStripe().paymentIntents.update(paymentIntentId, {
    amount,
  });
}

// Cancel a payment intent
export async function cancelPaymentIntent(paymentIntentId: string) {
  return getStripe().paymentIntents.cancel(paymentIntentId);
}
