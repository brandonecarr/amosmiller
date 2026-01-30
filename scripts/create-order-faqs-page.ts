/**
 * Creates the "Order FAQs" CMS page with content.
 *
 * Usage: npx tsx scripts/create-order-faqs-page.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SLUG = "order-faqs";

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Creating Order FAQs Page ===\n");

  // Step 1: Check if page already exists
  console.log("Step 1: Checking if page exists...");
  const { data: existing } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    console.log("  Page already exists. Deleting to re-create...");
    await supabase.from("pages").delete().eq("id", existing.id);
  }

  // Step 2: Build content blocks
  console.log("\nStep 2: Building page content...");

  const blocks = [
    // ── Hero ──
    {
      id: randomUUID(),
      type: "hero",
      data: {
        title: "Order FAQs",
        subtitle:
          "Everything you need to know about placing orders, payment, cancellations, and farm pickup. We are a Private Member Association \u2013 products are available to active members only.",
        ctaText: "Become a Member",
        ctaLink: "/become-a-member",
      },
    },

    // ── Introduction ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<p>Members must complete the <a href="/become-a-member">membership application</a> to gain access to our farm products. We recommend signing up for our newsletter during registration to stay informed about product availability, monthly specials, and farm updates.</p>

<p>After creating your account, simply log in and begin ordering from our full selection of nutrient-dense, farm-fresh foods.</p>`,
      },
    },

    // ── Placing Orders ──
    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "How do I place an order?",
            answer:
              "Orders are placed through our website. Simply log in to your member account, browse our shop, add items to your cart, and proceed to checkout.\n\nWe ship Monday through Thursday with Friday delivery via UPS or Saturday via FedEx, avoiding weekend transit delays. The order deadline is 11:00 PM the day before shipping.",
          },
          {
            question: "Are there special instructions I should include?",
            answer:
              "Yes! Please specify in your checkout comments:\n\n\u2022 Whether you want items \u201cfresh\u201d or \u201cfrozen\u201d (applies to butter, bread, and buffalo meats)\n\u2022 Write \u201cNO SUBSTITUTES\u201d if you don\u2019t want item replacements for out-of-stock products\n\nAll other meats will ship frozen only. \u201cOn Sale\u201d items cannot be changed from their default state.",
          },
          {
            question: 'What are "Meats Only" orders?',
            answer:
              "Beef and pork orders must be placed separately from dairy and other products. After logging in, a popup window allows you to select your order type.\n\nYour shopping cart cannot mix meats with incompatible items \u2013 the system will notify you to remove conflicting products before checkout.\n\n\u2022 Minimum order: $50.00 (FedEx or UPS shipping)\n\u2022 All pork and beef currently available as \u201cfreshly frozen\u201d only\n\u2022 Separate tracking numbers issued for each distinct order\n\nYour shopping cart never expires unless officially checked out, allowing you to modify items indefinitely before finalizing.",
          },
        ],
      },
    },

    // ── Modifying Orders ──
    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "Can I add items to an existing order?",
            answer:
              "If you\u2019ve forgotten something, please email us immediately and we will add those items manually to your existing order. Please do not place a second order.\n\nThe FedEx/UPS minimum ($50) applies to the combined order total.",
          },
          {
            question: "Can I cancel my order?",
            answer:
              "Orders can be cancelled within 60 minutes by email. We will void the payment and email you a cancellation confirmation.\n\nPlease note that your bank may temporarily hold funds until they process the void \u2013 this is normal and typically resolves within a few business days.",
          },
          {
            question: "Can I leave special requests or instructions?",
            answer:
              "Yes! Before you finalize your order, you can leave a comment or instructions for the farmer in the checkout notes section.\n\nComments help ensure correct fulfillment. You can even request that we call you before packing your order.",
          },
        ],
      },
    },

    // ── Monthly Specials Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "Check our \u201cOn Sale\u201d category regularly for monthly specials and free gift promotions!",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
        linkText: "View Specials",
        linkUrl: "/shop",
      },
    },

    // ── Specials & Promotions ──
    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "How do monthly specials work?",
            answer:
              "Our website features monthly specials in the \u201cOn Sale\u201d category, updated regularly with new products and pricing.",
          },
          {
            question: "How do I get the free gift?",
            answer:
              "We offer a different free gift each month. To qualify:\n\n\u2022 Your order must contain dairy products only\n\u2022 The order must total $100.00 or more (excluding shipping & handling)\n\u2022 You must request the free gift in your checkout comments\n\n\u201cMeats Only\u201d orders are excluded from this promotion and don\u2019t count toward the dairy order total.",
          },
        ],
      },
    },

    // ── Cancellations & Refunds ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Cancellations & Refunds</h2>

<p>Since every order is fulfilled by hand and foods are prepared freshly per order, a cancellation of an existing order is a challenge. Please plan your orders carefully.</p>`,
      },
    },

    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "What are the cancellation fees?",
            answer:
              "Contact us at (717) 556-0672 or email to cancel.\n\n\u2022 Same-day cancellation: No fee\n\u2022 After same day: $10.00 fee for orders up to $300\n\u2022 After same day: $25.00 fee for orders over $300\n\nAlternatively, opt for store credit instead of a refund \u2013 with no cancellation fee \u2013 usable on any future order.",
          },
          {
            question: "What if I accidentally submitted a double payment?",
            answer:
              "Please notify us immediately so we can VOID the duplicate payment on the spot. Contact us at (717) 556-0672 or email as soon as you notice.",
          },
          {
            question:
              "What about Pennsylvania residents ordering raw dairy?",
            answer:
              "We are currently not allowed to sell or ship raw dairy products within our home state of Pennsylvania. Orders from PA residents containing raw dairy products will be refunded with applicable cancellation fees applied.",
          },
        ],
      },
    },

    // ── Farm Pickup ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Farm Pickup</h2>

<p>You are welcome to place your <strong>non-dairy</strong> order online and select \u201cFarm Pickup\u201d at checkout. Please note that we cannot sell raw dairy products at the farm store per current regulations.</p>

<p>You can request specific pickup days and times in your order comments.</p>`,
      },
    },

    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "What are the farm store hours?",
            answer:
              "Our farm store is located at 648 Mill Creek School Rd, Bird in Hand, PA 17505.\n\n\u2022 Monday \u2013 Friday: 8:00 AM \u2013 5:00 PM\n\u2022 Saturday: By appointment\n\u2022 Sunday: Closed",
          },
        ],
      },
    },

    // ── Contact Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "Questions about your order? Call us at (717) 556-0672 or email info@amosmillerorganicfarm.com",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
      },
    },

    // ── Closing ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<p><strong>Thank you for the support you give farming the way it should be \u2013 we appreciate it so much.</strong></p>

<p>Best of health,<br/>Amos Miller Farm and Staff</p>`,
      },
    },

    // ── CTA Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "Ready to order? Browse our farm-fresh products today.",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
        linkText: "Shop Now",
        linkUrl: "/shop",
      },
    },

    // ── Learn More Links ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h3>More Information</h3>
<ul>
<li><a href="/shipping-faqs">Shipping FAQs</a></li>
<li><a href="/our-standards">Our Standards &amp; Principles</a></li>
<li><a href="/our-farm">About Our Farm</a></li>
<li><a href="/become-a-member">Become a Member</a></li>
<li><a href="/shop">Shop Our Products</a></li>
</ul>`,
      },
    },
  ];

  // Step 3: Insert page
  console.log("\nStep 3: Inserting page...");
  const { error: insertError } = await supabase.from("pages").insert({
    title: "Order FAQs",
    slug: SLUG,
    content: blocks,
    meta_title: "Order FAQs | Amos Miller Farm",
    meta_description:
      "Learn how to place orders, manage cancellations, use monthly specials, and arrange farm pickup at Amos Miller Farm.",
    is_published: true,
    show_in_nav: false,
    sort_order: 4,
  });

  if (insertError) {
    console.error(`Failed to insert page: ${insertError.message}`);
    process.exit(1);
  }

  console.log("\n=== Page Created Successfully ===");
  console.log(`  Title: Order FAQs`);
  console.log(`  Slug: ${SLUG}`);
  console.log(`  URL: /order-faqs`);
  console.log(`  Content blocks: ${blocks.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
