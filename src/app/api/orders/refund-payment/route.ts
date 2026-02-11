import { NextRequest, NextResponse } from "next/server";
import { refundPayment } from "@/lib/stripe/server";
import { getOrder } from "@/lib/actions/orders";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentIntentId, amount, reason } = body;

    if (!orderId || !paymentIntentId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get order to find the charge ID
    const { data: order, error: orderError } = await getOrder(orderId);

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.stripe_charge_id) {
      return NextResponse.json(
        { error: "No charge ID found for this order" },
        { status: 400 }
      );
    }

    // Process refund through Stripe
    const refund = await refundPayment(order.stripe_charge_id, amount);

    if (refund.status !== "succeeded") {
      return NextResponse.json(
        { error: `Refund failed: ${refund.status}` },
        { status: 400 }
      );
    }

    // Update order payment status in database
    const supabase = await createClient();

    // Calculate new refund total
    const currentRefunded = order.amount_refunded || 0;
    const newRefundedTotal = currentRefunded + amount;
    const totalPaid = Math.round(order.total * 100);

    // Determine new payment status
    let newPaymentStatus = "paid";
    if (newRefundedTotal >= totalPaid) {
      newPaymentStatus = "refunded";
    } else if (newRefundedTotal > 0) {
      newPaymentStatus = "partially_refunded";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("orders")
      .update({
        payment_status: newPaymentStatus,
        amount_refunded: newRefundedTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json(
        { error: `Order update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amountRefunded: refund.amount,
      newPaymentStatus,
      totalRefunded: newRefundedTotal,
    });
  } catch (error: unknown) {
    console.error("Error processing refund:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
