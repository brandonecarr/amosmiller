"use server";

import { getStripe } from "./server";

// Create a connection token for Stripe Terminal
export async function createTerminalConnectionToken() {
  const stripe = getStripe();

  try {
    const connectionToken = await stripe.terminal.connectionTokens.create();
    return { secret: connectionToken.secret, error: null };
  } catch (error) {
    console.error("Error creating connection token:", error);
    return {
      secret: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Create a PaymentIntent for Terminal
export async function createTerminalPaymentIntent(amount: number, metadata?: Record<string, string>) {
  const stripe = getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      payment_method_types: ["card_present"],
      capture_method: "automatic",
      metadata: {
        source: "pos",
        ...metadata,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      error: null,
    };
  } catch (error) {
    console.error("Error creating terminal payment intent:", error);
    return {
      clientSecret: null,
      paymentIntentId: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Capture a Terminal payment
export async function captureTerminalPayment(paymentIntentId: string) {
  const stripe = getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    return {
      success: true,
      status: paymentIntent.status,
      chargeId: paymentIntent.latest_charge as string,
      error: null,
    };
  } catch (error) {
    console.error("Error capturing terminal payment:", error);
    return {
      success: false,
      status: null,
      chargeId: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Cancel a Terminal payment
export async function cancelTerminalPayment(paymentIntentId: string) {
  const stripe = getStripe();

  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
    return { success: true, error: null };
  } catch (error) {
    console.error("Error canceling terminal payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// List registered Terminal readers
export async function listTerminalReaders() {
  const stripe = getStripe();

  try {
    const readers = await stripe.terminal.readers.list({ limit: 10 });
    return {
      readers: readers.data.map((reader) => ({
        id: reader.id,
        label: reader.label,
        deviceType: reader.device_type,
        serialNumber: reader.serial_number,
        status: reader.status,
        location: reader.location,
      })),
      error: null,
    };
  } catch (error) {
    console.error("Error listing terminal readers:", error);
    return {
      readers: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Register a new Terminal reader (for simulated readers in test mode)
export async function registerSimulatedReader(locationId: string) {
  const stripe = getStripe();

  try {
    const reader = await stripe.terminal.readers.create({
      registration_code: "simulated-wpe", // Simulated Verifone P400
      label: "Simulated Reader",
      location: locationId,
    });

    return {
      reader: {
        id: reader.id,
        label: reader.label,
        deviceType: reader.device_type,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error registering simulated reader:", error);
    return {
      reader: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Create a Terminal location
export async function createTerminalLocation(data: {
  displayName: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}) {
  const stripe = getStripe();

  try {
    const location = await stripe.terminal.locations.create({
      display_name: data.displayName,
      address: {
        line1: data.address.line1,
        city: data.address.city,
        state: data.address.state,
        postal_code: data.address.postalCode,
        country: data.address.country,
      },
    });

    return {
      locationId: location.id,
      error: null,
    };
  } catch (error) {
    console.error("Error creating terminal location:", error);
    return {
      locationId: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// List Terminal locations
export async function listTerminalLocations() {
  const stripe = getStripe();

  try {
    const locations = await stripe.terminal.locations.list({ limit: 10 });
    return {
      locations: locations.data.map((loc) => ({
        id: loc.id,
        displayName: loc.display_name,
        address: loc.address,
      })),
      error: null,
    };
  } catch (error) {
    console.error("Error listing terminal locations:", error);
    return {
      locations: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Process a refund for a Terminal payment
export async function refundTerminalPayment(
  paymentIntentId: string,
  amount?: number // If not provided, full refund
) {
  const stripe = getStripe();

  try {
    const refundData: { payment_intent: string; amount?: number } = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
      error: null,
    };
  } catch (error) {
    console.error("Error refunding terminal payment:", error);
    return {
      success: false,
      refundId: null,
      status: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
