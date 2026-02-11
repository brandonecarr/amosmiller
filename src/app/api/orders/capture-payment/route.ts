import { NextRequest, NextResponse } from "next/server";
import { capturePaymentIntent } from "@/lib/stripe/server";
import { getOrder } from "@/lib/actions/orders";
import { sendPaymentCapturedEmail } from "@/lib/email/order-emails";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentIntentId, amount } = body;

    if (!orderId || !paymentIntentId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Capture the payment intent
    const capturedIntent = await capturePaymentIntent(paymentIntentId, amount);

    if (capturedIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment capture failed: ${capturedIntent.status}` },
        { status: 400 }
      );
    }

    // Update order payment status using service client (admin permissions)
    const supabase = await createServiceClient();
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        stripe_charge_id: capturedIntent.latest_charge as string | undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json(
        { error: `Order update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Send payment captured email
    try {
      const { data: order } = await getOrder(orderId);
      if (order && order.customer_email) {
        await sendPaymentCapturedEmail(order);
      }
    } catch (emailError) {
      console.error("Error sending payment captured email:", emailError);
      // Don't fail the capture if email fails
    }

    return NextResponse.json({
      success: true,
      chargeId: capturedIntent.latest_charge,
      amountCaptured: capturedIntent.amount_received,
    });
  } catch (error: unknown) {
    console.error("Error capturing payment:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
