import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mailchimp webhook endpoint - receives events when subscribers update
export async function POST(request: NextRequest) {
  // Verify webhook secret
  const webhookSecret = request.headers.get("x-webhook-secret");
  if (webhookSecret !== process.env.MAILCHIMP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    const supabase = await createClient();

    switch (type) {
      case "unsubscribe": {
        // When a user unsubscribes from Mailchimp, update their profile
        const email = data?.email;
        if (email) {
          await supabase
            .from("profiles")
            .update({ email_marketing_opted_in: false })
            .eq("email", email);
        }
        break;
      }

      case "subscribe": {
        // When a new subscriber is added via Mailchimp
        const email = data?.email;
        if (email) {
          await supabase
            .from("profiles")
            .update({ email_marketing_opted_in: true })
            .eq("email", email);
        }
        break;
      }

      default:
        // Unrecognized event types are silently ignored
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mailchimp webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Mailchimp uses GET to verify the webhook URL
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
