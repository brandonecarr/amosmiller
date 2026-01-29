"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  card_brand: string | null;
  card_last_four: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
  created_at: string;
}

// Get user's payment methods
export async function getUserPaymentMethods(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching payment methods:", error);
    return { data: null, error: error.message };
  }

  return { data: data as PaymentMethod[], error: null };
}

// Create a Stripe SetupIntent for adding a new payment method
export async function createSetupIntent(userId: string) {
  const supabase = await createClient();
  const stripe = getStripe();

  // Get user's Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email, full_name")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return { data: null, error: profileError.message };
  }

  let stripeCustomerId = profile.stripe_customer_id;

  // Create Stripe customer if not exists
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      name: profile.full_name || undefined,
      metadata: { user_id: userId },
    });
    stripeCustomerId = customer.id;

    // Save customer ID to profile
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", userId);
  }

  // Create SetupIntent
  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    metadata: { user_id: userId },
  });

  return {
    data: {
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomerId,
    },
    error: null,
  };
}

// Save a payment method after Stripe confirmation
export async function savePaymentMethod(
  userId: string,
  stripePaymentMethodId: string,
  setAsDefault: boolean = false
) {
  const supabase = await createClient();
  const stripe = getStripe();

  try {
    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId);

    if (!paymentMethod.card) {
      return { data: null, error: "Invalid payment method type" };
    }

    // If setting as default, unset existing defaults first
    if (setAsDefault) {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", userId)
        .eq("is_default", true);
    }

    // Check if this is the first payment method (make it default)
    const { data: existingMethods } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("user_id", userId);

    const isFirstMethod = !existingMethods || existingMethods.length === 0;

    // Save to database
    const { data, error } = await supabase
      .from("payment_methods")
      .insert({
        user_id: userId,
        stripe_payment_method_id: stripePaymentMethodId,
        card_brand: paymentMethod.card.brand,
        card_last_four: paymentMethod.card.last4,
        card_exp_month: paymentMethod.card.exp_month,
        card_exp_year: paymentMethod.card.exp_year,
        is_default: setAsDefault || isFirstMethod,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving payment method:", error);
      return { data: null, error: error.message };
    }

    revalidatePath("/account/payment-methods");
    revalidatePath("/account/subscriptions");

    return { data, error: null };
  } catch (err) {
    console.error("Error saving payment method:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Set a payment method as default
export async function setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
  const supabase = await createClient();

  // Unset existing default
  await supabase
    .from("payment_methods")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("is_default", true);

  // Set new default
  const { data, error } = await supabase
    .from("payment_methods")
    .update({ is_default: true })
    .eq("id", paymentMethodId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error setting default payment method:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/account/payment-methods");
  revalidatePath("/account/subscriptions");

  return { data, error: null };
}

// Delete a payment method
export async function deletePaymentMethod(userId: string, paymentMethodId: string) {
  const supabase = await createClient();
  const stripe = getStripe();

  // Get the payment method first
  const { data: pm, error: fetchError } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("id", paymentMethodId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !pm) {
    return { success: false, error: "Payment method not found" };
  }

  // Check if it's attached to any active subscriptions
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("default_payment_method_id", paymentMethodId)
    .eq("status", "active");

  if (subscriptions && subscriptions.length > 0) {
    return {
      success: false,
      error: "Cannot delete payment method attached to active subscriptions",
    };
  }

  // Detach from Stripe
  try {
    await stripe.paymentMethods.detach(pm.stripe_payment_method_id);
  } catch (err) {
    console.error("Error detaching from Stripe:", err);
  }

  // Delete from database
  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", paymentMethodId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting payment method:", error);
    return { success: false, error: error.message };
  }

  // If it was the default, set another as default
  if (pm.is_default) {
    const { data: remaining } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", remaining[0].id);
    }
  }

  revalidatePath("/account/payment-methods");
  revalidatePath("/account/subscriptions");

  return { success: true, error: null };
}

// Attach payment method to subscription
export async function attachPaymentMethodToSubscription(
  subscriptionId: string,
  paymentMethodId: string,
  userId: string
) {
  const supabase = await createClient();

  // Verify the payment method belongs to the user
  const { data: pm, error: pmError } = await supabase
    .from("payment_methods")
    .select("id")
    .eq("id", paymentMethodId)
    .eq("user_id", userId)
    .single();

  if (pmError || !pm) {
    return { success: false, error: "Payment method not found" };
  }

  // Update subscription
  const { error } = await supabase
    .from("subscriptions")
    .update({ default_payment_method_id: paymentMethodId })
    .eq("id", subscriptionId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error attaching payment method:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/account/subscriptions");

  return { success: true, error: null };
}
