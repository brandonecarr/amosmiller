import { NextRequest, NextResponse } from "next/server";
import { processAllDueSubscriptions } from "@/lib/actions/subscription-orders";
import { sendSubscriptionReminderEmail } from "@/lib/email/subscription-emails";
import { createClient } from "@/lib/supabase/server";
import { addDays, format } from "date-fns";

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  // In development, allow requests without secret
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return cronSecret === expectedSecret;
}

// Main cron endpoint for subscription processing
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Process all due subscriptions
    const results = await processAllDueSubscriptions();

    return NextResponse.json({
      success: true,
      processed: results.processed.length,
      successCount: results.successCount,
      errorCount: results.errorCount,
      details: results.processed,
    });
  } catch (error) {
    console.error("Cron subscription processing error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for sending reminder emails (upcoming subscriptions)
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  try {
    // Get subscriptions due in 2 days
    const reminderDate = addDays(new Date(), 2);
    const reminderDateStr = format(reminderDate, "yyyy-MM-dd");

    const { data: upcomingSubscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        name,
        next_order_date,
        frequency,
        user:profiles(email, full_name),
        subscription_items(
          quantity,
          product:products(name, base_price, sale_price, pricing_type, estimated_weight)
        )
      `)
      .eq("status", "active")
      .eq("next_order_date", reminderDateStr);

    if (error) {
      throw error;
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const subscription of upcomingSubscriptions || []) {
      try {
        // Type assertion for the nested user object
        const user = subscription.user as { email: string; full_name: string | null } | null;

        if (!user?.email) continue;

        // Calculate total and build items array
        const items = ((subscription.subscription_items as Array<{
          quantity: number;
          product: { name: string; base_price: number; sale_price: number | null; pricing_type: string; estimated_weight: number | null };
        }>) || []).map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
        }));

        const total = ((subscription.subscription_items as Array<{
          quantity: number;
          product: { base_price: number; sale_price: number | null; pricing_type: string; estimated_weight: number | null };
        }>) || []).reduce((sum, item) => {
          const price = item.product.sale_price ?? item.product.base_price;
          const weight = item.product.pricing_type === "weight" ? (item.product.estimated_weight || 1) : 1;
          return sum + price * weight * item.quantity;
        }, 0);

        await sendSubscriptionReminderEmail({
          name: subscription.name,
          customer_email: user.email,
          customer_first_name: user.full_name,
          frequency: subscription.frequency,
          next_order_date: subscription.next_order_date,
          items,
          total,
        });

        sentCount++;
      } catch (err) {
        errors.push(`Failed to send reminder for subscription ${subscription.id}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: sentCount,
      totalSubscriptions: upcomingSubscriptions?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cron reminder processing error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
