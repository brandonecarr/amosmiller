/**
 * Creates the "Become a Member" CMS page with content.
 *
 * Usage: npx tsx scripts/create-become-a-member-page.ts
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
const SLUG = "become-a-member";

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Creating Become a Member Page ===\n");

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
        title: "Join Our Private Member Association",
        subtitle:
          "Access real farm-fresh, nutrient-dense foods from Miller\u2019s Organic Farm and surrounding Amish farms \u2013 grown the way nature intended.",
        ctaText: "Shop Now",
        ctaLink: "/shop",
      },
    },

    // ── Introduction ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<p>Miller\u2019s Organic Farm is a <strong>Private Member Association (PMA)</strong>. Our members can purchase products grown using sustainable, traditional farming methods \u2013 chemical-free, GMO-free, soy-free, antibiotic-free, and hormone-free.</p>

<p>All of our products are only available to members who belong to our Private Association and are <strong>not available to the public</strong>.</p>`,
      },
    },

    // ── How It Works ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>How It Works</h2>

<p>Becoming a member is simple. There is no separate application to fill out \u2013 your one-time <strong>$35 lifetime membership fee</strong> is automatically added to your first order at checkout.</p>

<ol>
<li><strong>Create your account</strong> \u2013 Sign up on our website with your name and email</li>
<li><strong>Browse &amp; shop</strong> \u2013 Explore our full selection of farm-fresh products</li>
<li><strong>Checkout</strong> \u2013 The $35 membership fee is included in your first order total</li>
<li><strong>You\u2019re a lifetime member</strong> \u2013 All future orders are membership-fee-free</li>
</ol>

<p>Once your first order is placed, your membership is immediately active and lasts a lifetime. No renewals, no recurring fees \u2013 just one simple payment.</p>`,
      },
    },

    // ── Membership Fee Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "$35 one-time lifetime membership fee \u2013 automatically included in your first order. No renewals. No recurring charges.",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
      },
    },

    // ── What You Get ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>What You Get as a Member</h2>

<ul>
<li><strong>100% raw, grass-fed A2/A2 dairy</strong> \u2013 Milk, cream, butter, yogurt, kefir, and artisan cheeses from pastured cows, buffalo, camel, goat, and sheep</li>
<li><strong>Pastured meats</strong> \u2013 Grass-fed beef, buffalo, lamb, whey-fed pork, milk-fed veal, and free-range poultry</li>
<li><strong>Traditional bakery</strong> \u2013 Sourdough breads, cookies, and pies made from heirloom grains, properly soaked and sprouted</li>
<li><strong>Fermented foods</strong> \u2013 Lactic-acid fermented vegetables, kombucha, and water kefir</li>
<li><strong>Healthy fats &amp; pantry staples</strong> \u2013 Raw honey, maple syrup, tallow, lard, and properly prepared nuts and seeds</li>
<li><strong>Wild-caught seafood</strong> \u2013 Sustainably sourced fish and shellfish</li>
</ul>

<p>Every product is raised or produced without chemicals, pesticides, genetically engineered ingredients, vaccines, or mRNA treatments. Humane animal treatment is our priority.</p>`,
      },
    },

    // ── FAQ ──
    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "Do I need to be a member to purchase products?",
            answer:
              "Yes. Amos Miller Farm is a Private Member Association. All products are available to members only and are not sold to the general public.",
          },
          {
            question: "How much is the membership?",
            answer:
              "The membership fee is $35 for your lifetime. It is non-refundable and is automatically added to your first order at checkout. You will never be charged a membership fee again on future orders.",
          },
          {
            question: "Can I transfer or cancel my membership?",
            answer:
              "Memberships are non-transferable. You can cancel your membership at any time, but the $35 fee is non-refundable as it is a one-time lifetime commitment.",
          },
          {
            question: "How do I start ordering?",
            answer:
              "Simply create an account on our website, browse our shop, and place your first order. The $35 membership fee will be included automatically at checkout. Once your order is placed, you\u2019re a lifetime member.",
          },
          {
            question: "Do you ship nationwide?",
            answer:
              "Yes! We ship via FedEx and UPS to all 50 states. You can also choose Co-Op pickup at one of our locations across the country, or Farm Pickup at our Bird-in-Hand, PA location. See our Shipping FAQs for details on costs and transit times.",
          },
        ],
      },
    },

    // ── CTA Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "Ready to join? Create your account and start shopping \u2013 your membership is included in your first order.",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
        linkText: "Shop Now",
        linkUrl: "/shop",
      },
    },

    // ── Contact ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h3>Questions?</h3>

<p>If you have any questions about membership or our products, we\u2019re happy to help.</p>

<ul>
<li><strong>Email:</strong> info@amosmillerorganicfarm.com</li>
<li><strong>Phone:</strong> (717) 556-0672</li>
</ul>

<p><strong>Thank you for supporting farming the way it should be \u2013 we appreciate it so much.</strong></p>`,
      },
    },

    // ── Learn More Links ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h3>Learn More</h3>
<ul>
<li><a href="/our-standards">Our Standards &amp; Principles</a></li>
<li><a href="/our-farm">About Our Farm</a></li>
<li><a href="/dr-weston-a-price">Dr. Weston A. Price</a></li>
<li><a href="/shipping-faqs">Shipping FAQs</a></li>
<li><a href="/order-faqs">Order FAQs</a></li>
<li><a href="/blog">Read Our Blog</a></li>
</ul>`,
      },
    },
  ];

  // Step 3: Insert page
  console.log("\nStep 3: Inserting page...");
  const { error: insertError } = await supabase.from("pages").insert({
    title: "Become a Member",
    slug: SLUG,
    content: blocks,
    meta_title: "Become a Member | Amos Miller Farm",
    meta_description:
      "Join Amos Miller Farm\u2019s Private Member Association for a one-time $35 lifetime fee. Access raw dairy, pastured meats, and nutrient-dense farm foods shipped nationwide.",
    is_published: true,
    show_in_nav: false,
    sort_order: 5,
  });

  if (insertError) {
    console.error(`Failed to insert page: ${insertError.message}`);
    process.exit(1);
  }

  console.log("\n=== Page Created Successfully ===");
  console.log(`  Title: Become a Member`);
  console.log(`  Slug: ${SLUG}`);
  console.log(`  URL: /become-a-member`);
  console.log(`  Content blocks: ${blocks.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
