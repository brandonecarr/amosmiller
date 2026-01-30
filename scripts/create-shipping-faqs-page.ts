/**
 * Creates the "Shipping FAQs" CMS page with content and images.
 *
 * Usage: npx tsx scripts/create-shipping-faqs-page.ts
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
const BUCKET = "page-images";
const SLUG = "shipping-faqs";

// ── Upload helpers ───────────────────────────────────────────────────────────

async function uploadLocalFile(
  localPath: string,
  name: string
): Promise<string | null> {
  console.log(`  Uploading ${name} from ${path.basename(localPath)}...`);
  try {
    const buffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase() || ".jpg";
    const filePath = `${SLUG}/${name}${ext}`;

    const contentTypeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: contentTypeMap[ext] || "image/png",
        upsert: true,
      });

    if (error) {
      console.error(`    Upload error for ${name}: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    console.log(`    Uploaded: ${filePath}`);
    return data.publicUrl;
  } catch (e: unknown) {
    console.error(`    Error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

async function uploadBuffer(
  buffer: Buffer,
  name: string,
  ext: string
): Promise<string | null> {
  console.log(`  Uploading ${name}...`);
  try {
    const filePath = `${SLUG}/${name}${ext}`;
    const contentTypeMap: Record<string, string> = {
      ".png": "image/png",
      ".svg": "image/svg+xml",
    };

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: contentTypeMap[ext] || "image/png",
        upsert: true,
      });

    if (error) {
      console.error(`    Upload error for ${name}: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    console.log(`    Uploaded: ${filePath}`);
    return data.publicUrl;
  } catch (e: unknown) {
    console.error(`    Error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

async function downloadAndUpload(
  sourceUrl: string,
  name: string,
  extension?: string
): Promise<string | null> {
  console.log(`  Downloading ${name}...`);
  try {
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Seed Script)" },
    });
    if (!response.ok) {
      console.error(`    Failed to download ${name}: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext =
      extension ||
      path.extname(new URL(sourceUrl).pathname).toLowerCase() ||
      ".png";
    const filePath = `${SLUG}/${name}${ext}`;

    const contentTypeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: contentTypeMap[ext] || "image/png",
        upsert: true,
      });

    if (error) {
      console.error(`    Upload error for ${name}: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    console.log(`    Uploaded: ${filePath}`);
    return data.publicUrl;
  } catch (e: unknown) {
    console.error(`    Error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

// ── Generate credit card badges as a clean SVG ──────────────────────────────

function generateCreditCardSvg(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 80" width="600" height="80">
  <style>
    .card-bg { rx: 8; ry: 8; stroke: #e2e8f0; stroke-width: 1; }
    .label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 700; }
  </style>
  <!-- Visa -->
  <rect x="0" y="0" width="130" height="80" fill="#ffffff" class="card-bg"/>
  <text x="65" y="48" text-anchor="middle" class="label" font-size="28" fill="#1a1f71">VISA</text>
  <!-- Mastercard -->
  <rect x="150" y="0" width="130" height="80" fill="#ffffff" class="card-bg"/>
  <circle cx="200" cy="40" r="22" fill="#eb001b" opacity="0.9"/>
  <circle cx="230" cy="40" r="22" fill="#f79e1b" opacity="0.9"/>
  <text x="215" y="72" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="9" fill="#000" font-weight="600">mastercard</text>
  <!-- Discover -->
  <rect x="300" y="0" width="130" height="80" fill="#ffffff" class="card-bg"/>
  <text x="365" y="44" text-anchor="middle" class="label" font-size="17" fill="#ff6600">DISCOVER</text>
  <text x="365" y="60" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="9" fill="#888">NETWORK</text>
  <!-- Amex -->
  <rect x="450" y="0" width="150" height="80" fill="#ffffff" class="card-bg"/>
  <text x="525" y="36" text-anchor="middle" class="label" font-size="13" fill="#006fcf">AMERICAN</text>
  <text x="525" y="54" text-anchor="middle" class="label" font-size="13" fill="#006fcf">EXPRESS</text>
</svg>`;
  return Buffer.from(svg, "utf-8");
}

const DOWNLOADS = "/Users/brandonecarr/Downloads";
const MAP_FILE =
  "hf_20260130_215436_8280f031-ac01-47c3-bfda-e819af3dc676.png";

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Creating Shipping FAQs Page ===\n");

  // Step 1: Ensure storage bucket exists
  console.log("Step 1: Checking storage bucket...");
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET);
  if (!bucketExists) {
    const { error: bucketError } = await supabase.storage.createBucket(
      BUCKET,
      { public: true }
    );
    if (bucketError) {
      console.error(
        `Failed to create bucket "${BUCKET}": ${bucketError.message}`
      );
      process.exit(1);
    }
    console.log(`  Created bucket "${BUCKET}"`);
  } else {
    console.log(`  Bucket "${BUCKET}" already exists`);
  }

  // Step 2: Check if page already exists
  console.log("\nStep 2: Checking if page exists...");
  const { data: existing } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    console.log("  Page already exists. Deleting to re-create...");
    await supabase.from("pages").delete().eq("id", existing.id);
  }

  // Step 3: Upload images
  console.log("\nStep 3: Uploading images...");

  const images = {
    shippingMap: await uploadLocalFile(
      path.join(DOWNLOADS, MAP_FILE),
      "shipping-map"
    ),
    creditCards: await uploadBuffer(
      generateCreditCardSvg(),
      "credit-cards",
      ".svg"
    ),
  };

  // Step 4: Build content blocks
  console.log("\nStep 4: Building page content...");

  const blocks = [
    // ── Hero ──
    {
      id: randomUUID(),
      type: "hero",
      data: {
        title: "Shipping FAQs",
        subtitle:
          "Everything you need to know about how we ship our farm-fresh foods directly to your door.",
        imageUrl: images.shippingMap || "",
        ctaText: "Shop Now",
        ctaLink: "/shop",
      },
    },

    // ── Shipping Overview ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<p>Shipping costs include the shipping charge from FedEx/UPS and the cost of insulated packaging and ice packs. We pass along our shipper discounts to you \u2013 heavier packages cost considerably less per pound to ship.</p>

<p><strong>High-cost regions</strong> (California, Oregon, Washington, Nevada, Idaho, Utah, Alaska, and Hawaii) require 2-day or overnight express shipping, with costs often exceeding the cost of the food itself.</p>

<p><strong>Ground shipping areas</strong> (rest of country) average about 35% of a typical $150 food order. The range is 20\u201370% depending on order size and distance from Pennsylvania.</p>

<p><strong>Save on shipping:</strong> Join a local <a href="/co-op-food-clubs">co-op or food club</a> for flat-rate per-box shipping, or choose <a href="/shop">Farm Pickup</a> to avoid shipping costs entirely.</p>`,
      },
    },

    // ── How does shipping work? ──
    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "How does shipping work?",
            answer:
              "We ship nationwide via FedEx or UPS at the standard carrier fee. Our preferred method is ground shipping for cost-effectiveness. We ship Monday through Wednesday (occasionally Thursday), depending on your destination. Our target is Friday (UPS) or Saturday (FedEx) delivery, avoiding weekend transit.\n\nFor West Coast and 3+ day ground shipments, we automatically ship Express unless you specifically request ground in your checkout comments.",
          },
          {
            question: "How is my order kept cold during transit?",
            answer:
              "Each box contains a Styrofoam cooler packed with ice. The cold packaging fee ranges from $4.00\u2013$18.00 depending on order size.\n\nOrdering additional frozen foods actually helps \u2013 it reduces overall package weight and allows less ice while maintaining colder temperatures.\n\nSome non-perishable orders may ship without Styrofoam or ice packs, with handling fees of $3.00\u2013$8.00 instead.",
          },
          {
            question: "How long will my package be in transit?",
            answer:
              "We ship Monday through Wednesday/Thursday only, ensuring pre-weekend delivery due to the perishable nature of our products.\n\nWe will only allow a package to be in transit for five consecutive business days. If ground shipping cannot deliver within 5 days, overnight or Express becomes mandatory.\n\nFor shipping concerns, call us at (717) 556-0672.",
          },
        ],
      },
    },

    // ── Shipping Map ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.shippingMap || "",
        alt: "FedEx/UPS ground shipping transit time map from ZIP code 17505 in Bird-in-Hand, PA",
        caption:
          "Ground shipping transit times from our farm in Bird-in-Hand, PA (ZIP 17505). Areas beyond 3 days may require Express shipping.",
      },
    },

    // ── Order & Tracking ──
    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "How will I know when my order has shipped?",
            answer:
              "Orders are usually fulfilled within 24\u201348 hours unless items are temporarily out of stock and you choose to wait.\n\nYou\u2019ll receive an initial confirmation email when your order is placed. After packing and shipping, you\u2019ll receive a carrier tracking number followed by your final invoice receipt matching the shipment contents.",
          },
          {
            question: "When will I pay for my order?",
            answer:
              "Credit card charges occur in two stages:\n\n1. Food charges when your order is placed\n2. A final charge for shipping/handling plus any adjustments for weight changes or out-of-stock items after fulfillment\n\nWe finalize the order with a second charge to the same credit card for the difference only. You\u2019ll receive a professional invoice and tracking number via email.",
          },
          {
            question: "When are the order deadlines?",
            answer:
              "We ship Monday through Wednesday, occasionally Thursday, based on your location.\n\nThe order deadline is 12:00 AM (midnight) the day before shipment. Orders placed too close to weekends \u2013 preventing Saturday delivery \u2013 will ship the following Monday.",
          },
        ],
      },
    },

    // ── Credit Cards Banner ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h3>Accepted Payment Methods</h3>
<p>We accept all major credit cards at checkout.</p>
<p><img src="${images.creditCards || ""}" alt="Accepted credit cards: Visa, Mastercard, Discover, American Express" style="max-width: 400px; height: auto;" /></p>`,
      },
    },

    // ── Order Minimums & Estimates ──
    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "Is there an order minimum?",
            answer:
              "Yes. FedEx/UPS orders require a $50.00 minimum. There is no minimum for Co-Op or Farm Pickup orders.\n\nSmall order shipping becomes cost-prohibitive \u2013 the current minimum shipping charge is $20+, plus $8+ for containers and ice. Larger orders achieve much better per-pound rates.\n\nOptimal order weight: 30\u201350 pounds for the best shipping rates.",
          },
          {
            question: "Do you provide shipping estimates?",
            answer:
              "We currently do not provide shipping estimates. Shipping cost depends on weight and distance.\n\nWe pass along our shipper discounts \u2013 heavier packages cost considerably less per pound. Our recommendation: order more food less frequently versus small amounts frequently.",
          },
        ],
      },
    },

    // ── Cancellations & Issues ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "Questions about your order? Call us at (717) 556-0672 or email help@amosmillerorganicfarm.com",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
      },
    },

    {
      id: randomUUID(),
      type: "faq",
      data: {
        items: [
          {
            question: "What if I have to cancel my order?",
            answer:
              "Contact us via email or phone at (717) 556-0672.\n\nSame-day cancellation: No fee.\nLater cancellation: $10.00 fee for orders up to $300; $25.00 for orders exceeding $300.\n\nAlternatively, opt for store credit instead \u2013 with no cancellation fee \u2013 usable on any future order.",
          },
          {
            question: "What if my order is damaged or something is missing?",
            answer:
              "Damage claims: Photograph damaged items immediately and email help@amosmillerorganicfarm.com with a brief description.\n\nEggs are our most fragile shipped item. We will replace eggs that are completely smashed and unusable \u2013 provide a picture and quantity affected. At one dozen unusable eggs, we ship a free dozen replacement in your next order.\n\nFor missing or incorrect items, contact us immediately at (717) 556-0672.",
          },
          {
            question: "What about ice cream during summer?",
            answer:
              "During warm months, we strongly encourage overnight or 2-Day FedEx Express to guarantee your ice cream reaches you still frozen.\n\nWe cannot be responsible if your order is shipped UPS/FedEx ground past a 2-day transit time. If ice cream melts slightly, you can shake it and refreeze safely.",
          },
          {
            question: "What about large orders over 50 pounds?",
            answer:
              "Orders exceeding 50 pounds ship in multiple boxes or incur an overweight surcharge.\n\nWe recommend choosing plastic containers over glass when available to prevent breakage. For pre-shipping questions, call (717) 556-0672.\n\nMembers near the farm or food club drop-off sites may also pick up orders in person.",
          },
        ],
      },
    },

    // ── Closing ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<p>Thank you for your interest in our farm foods. We strive to grow the most nourishing, healthy and clean foods possible and we feel honored to ship them directly to the well-informed consumer like you, who wants to support this type of agriculture.</p>

<p><strong>Best of health,<br/>Amos Miller Farm and Staff</strong></p>`,
      },
    },

    // ── CTA Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "Save on shipping \u2013 find a co-op near you or choose Farm Pickup!",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
        linkText: "View Co-Op Locations",
        linkUrl: "/co-op-food-clubs",
      },
    },

    // ── Learn More Links ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h3>More Information</h3>
<ul>
<li><a href="/our-standards">Our Standards &amp; Principles</a></li>
<li><a href="/our-farm">About Our Farm</a></li>
<li><a href="/become-a-member">Become a Member</a></li>
<li><a href="/shop">Shop Our Products</a></li>
</ul>`,
      },
    },
  ];

  // Step 5: Insert page
  console.log("\nStep 5: Inserting page...");
  const { error: insertError } = await supabase.from("pages").insert({
    title: "Shipping FAQs",
    slug: SLUG,
    content: blocks,
    meta_title: "Shipping FAQs | Amos Miller Farm",
    meta_description:
      "Learn about shipping costs, transit times, order minimums, and packaging for Amos Miller Farm\u2019s perishable farm foods shipped nationwide via FedEx and UPS.",
    is_published: true,
    show_in_nav: false,
    sort_order: 3,
  });

  if (insertError) {
    console.error(`Failed to insert page: ${insertError.message}`);
    process.exit(1);
  }

  const uploadedCount = Object.values(images).filter(Boolean).length;
  const totalImages = Object.keys(images).length;

  console.log("\n=== Page Created Successfully ===");
  console.log(`  Title: Shipping FAQs`);
  console.log(`  Slug: ${SLUG}`);
  console.log(`  URL: /shipping-faqs`);
  console.log(`  Images: ${uploadedCount}/${totalImages} uploaded`);
  console.log(`  Content blocks: ${blocks.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
