/**
 * Creates the "Co-Op / Food Clubs" CMS page with content.
 *
 * Usage: npx tsx scripts/create-coop-food-clubs-page.ts
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
const SLUG = "co-op-food-clubs";

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Creating Co-Op / Food Clubs Page ===\n");

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
        title: "Co-Op / Food Clubs",
        subtitle:
          "Pick up your farm-fresh order at a local co-op near you \u2013 save on shipping and connect with your community.",
        ctaText: "Shop Now",
        ctaLink: "/shop",
      },
    },

    // ── How It Works ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>How Co-Ops Work</h2>

<p>Our co-op and food club network lets you pick up your order at a location near you instead of shipping directly to your door. This often means <strong>significant savings on shipping costs</strong>.</p>

<p>Each co-op has its own delivery and pickup schedule \u2013 ranging from weekly to biweekly to monthly. Ordering deadlines vary by location, so contact your local co-op coordinator for their specific schedule.</p>

<p><strong>To order via a co-op:</strong></p>
<ol>
<li>Place your order on our website as usual</li>
<li>Select your co-op location at checkout</li>
<li>Your order will be shipped to the co-op coordinator</li>
<li>Pick up your order at the designated time and location</li>
</ol>

<p>If you have questions about a specific co-op, reach out to the coordinator listed below. They can provide details on pickup times, locations, and any local guidelines.</p>`,
      },
    },

    // ── Locations Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "We have co-op locations across the country \u2013 find one near you below.",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
      },
    },

    // ── Alabama ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Alabama</h2>

<h3>Auburn</h3>
<p><strong>Debbie Vail</strong><br/>
Phone: (334) 750-3276</p>

<h3>Birmingham</h3>
<p><strong>Rebecca Rodgers</strong><br/>
Phone: (256) 506-2960</p>`,
      },
    },

    // ── Arizona ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Arizona</h2>

<h3>Phoenix</h3>
<p><strong>Emily Heller</strong><br/>
Phone: (602) 380-4949</p>`,
      },
    },

    // ── California ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>California</h2>

<h3>Murrieta</h3>
<p><strong>Summer Whiteside</strong><br/>
Phone: (760) 885-8226</p>

<h3>Pasadena / Claremont</h3>
<p><strong>Rebekah Thormure</strong><br/>
Phone: (310) 804-7073</p>

<h3>San Jose</h3>
<p><strong>Jill Hume</strong><br/>
Phone: (669) 204-8368</p>`,
      },
    },

    // ── Colorado ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Colorado</h2>

<h3>Lakewood</h3>
<p><strong>Greg Wray</strong><br/>
Phone: (720) 514-9946</p>`,
      },
    },

    // ── Florida ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Florida</h2>

<h3>Orlando</h3>
<p><strong>Diana Coughlin</strong><br/>
Phone: (407) 739-3446<br/>
Website: <a href="https://www.mootoyou.org" target="_blank" rel="noopener noreferrer">www.mootoyou.org</a></p>

<h3>Palm Beaches / Martin County</h3>
<p><strong>Anke</strong><br/>
Phone: (561) 512-7695<br/>
Website: <a href="https://www.pasturedfarmfoodclub.com" target="_blank" rel="noopener noreferrer">www.pasturedfarmfoodclub.com</a></p>

<h3>Tampa</h3>
<p><strong>Eva Vaselev</strong><br/>
Phone: (727) 481-9616</p>

<h3>Titusville</h3>
<p><strong>Ginny Parker</strong><br/>
Phone: (386) 589-6931</p>

<h3>Winter Haven / Polk County</h3>
<p><strong>Jud Donalson</strong><br/>
Phone: (850) 203-0230</p>`,
      },
    },

    // ── Massachusetts ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Massachusetts</h2>

<h3>Carlisle</h3>
<p><strong>Julia MacQueen</strong><br/>
Phone: (781) 686-3508</p>

<h3>Chelsea</h3>
<p><strong>Ann Smith</strong><br/>
Phone: (508) 439-9406</p>`,
      },
    },

    // ── Nevada ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Nevada</h2>

<h3>Las Vegas</h3>
<p><strong>Jewell Lindsay</strong><br/>
Phone: (313) 695-5530<br/>
Email: thedunchclub@gmail.com</p>`,
      },
    },

    // ── New Jersey ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>New Jersey</h2>

<h3>Williamstown (South Jersey)</h3>
<p><strong>Justin Mym</strong><br/>
Phone: (856) 906-0355</p>`,
      },
    },

    // ── Texas ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Texas</h2>

<h3>Austin</h3>
<p><strong>Jennifer N</strong><br/>
Phone: (831) 295-5366<br/>
Email: millersfarmaustin@icloud.com</p>`,
      },
    },

    // ── FAQ ──
    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "How do I order through a co-op?",
            answer:
              "Place your order on our website and select your co-op location at checkout. Your order will be shipped to the co-op coordinator, who will notify you when it\u2019s ready for pickup.",
          },
          {
            question: "How often do co-ops receive deliveries?",
            answer:
              "Delivery schedules vary by location \u2013 some receive weekly deliveries, others biweekly or monthly. Contact your local co-op coordinator for their specific schedule and ordering deadlines.",
          },
          {
            question: "Is there a minimum order for co-op pickup?",
            answer:
              "There is no minimum order amount for co-op pickup. However, your co-op coordinator may have local guidelines \u2013 reach out to them directly for details.",
          },
          {
            question: "Can I start a co-op in my area?",
            answer:
              "We\u2019re always open to expanding our co-op network. If you\u2019re interested in becoming a co-op coordinator in your area, contact us at info@amosmillerorganicfarm.com or call (717) 556-0672.",
          },
        ],
      },
    },

    // ── CTA Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "Don\u2019t see a co-op near you? Contact us about starting one in your area \u2013 or shop online for direct shipping.",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
        linkText: "Shop Now",
        linkUrl: "/shop",
      },
    },

    // ── Contact & Links ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h3>Questions?</h3>

<p>For general questions about co-ops, contact us directly:</p>
<ul>
<li><strong>Email:</strong> info@amosmillerorganicfarm.com</li>
<li><strong>Phone:</strong> (717) 556-0672</li>
</ul>

<h3>More Information</h3>
<ul>
<li><a href="/shipping-faqs">Shipping FAQs</a></li>
<li><a href="/order-faqs">Order FAQs</a></li>
<li><a href="/our-standards">Our Standards &amp; Principles</a></li>
<li><a href="/our-farm">About Our Farm</a></li>
<li><a href="/become-a-member">Become a Member</a></li>
</ul>`,
      },
    },
  ];

  // Step 3: Insert page
  console.log("\nStep 3: Inserting page...");
  const { error: insertError } = await supabase.from("pages").insert({
    title: "Co-Op / Food Clubs",
    slug: SLUG,
    content: blocks,
    meta_title: "Co-Op / Food Clubs | Amos Miller Farm",
    meta_description:
      "Find a local co-op or food club near you for convenient pickup of Amos Miller Farm products. Locations across Alabama, Arizona, California, Colorado, Florida, Massachusetts, Nevada, New Jersey, and Texas.",
    is_published: true,
    show_in_nav: false,
    sort_order: 6,
  });

  if (insertError) {
    console.error(`Failed to insert page: ${insertError.message}`);
    process.exit(1);
  }

  console.log("\n=== Page Created Successfully ===");
  console.log(`  Title: Co-Op / Food Clubs`);
  console.log(`  Slug: ${SLUG}`);
  console.log(`  URL: /co-op-food-clubs`);
  console.log(`  Content blocks: ${blocks.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
