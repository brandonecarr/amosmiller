/**
 * Creates the "Our Standards" CMS page with content and images.
 *
 * Usage: npx tsx scripts/create-our-standards-page.ts
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
const SLUG = "our-standards";

// ── Image download & upload ──────────────────────────────────────────────────

async function downloadAndUpload(
  sourceUrl: string,
  name: string
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
    const ext = path.extname(new URL(sourceUrl).pathname).toLowerCase() || ".jpg";
    const filePath = `${SLUG}/${name}${ext}`;

    const contentTypeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: contentTypeMap[ext] || "image/jpeg",
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

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Creating Our Standards Page ===\n");

  // Step 1: Ensure storage bucket exists
  console.log("Step 1: Checking storage bucket...");
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET);
  if (!bucketExists) {
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
    });
    if (bucketError) {
      console.error(`Failed to create bucket "${BUCKET}": ${bucketError.message}`);
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

  // Step 3: Download and upload images
  console.log("\nStep 3: Downloading images...");
  const images = {
    camels: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/Millers-Camels.jpg",
      "camels"
    ),
    farm: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/millers-farm.jpg",
      "farm"
    ),
    sign: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2018/03/Millers-Sign-Sunburst-800-IMG_8110-EDIT.jpg",
      "sign"
    ),
  };

  // Step 4: Build content blocks
  console.log("\nStep 4: Building page content...");

  const blocks = [
    // Hero block
    {
      id: randomUUID(),
      type: "hero",
      data: {
        title: "Our Standards and Principles",
        subtitle:
          "Providing real farm fresh, nutrient dense foods employing traditional farming methods.",
        imageUrl: images.camels || "",
        ctaText: "Become a Member",
        ctaLink: "/become-a-member",
      },
    },
    // Introduction
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<p>Miller's Organic Farm, located in Bird-in-Hand, Pennsylvania, offers 100% raw grass-fed and finished cow's milk and dairy products, pastured meats and eggs, and other real farm foods to its members. We sell real nutrient dense foods, grown on our own farm and other surrounding Amish farms, without the use of chemicals, GMO or vaccines, including the MRNA kind.</p>

<p>We are a private membership association who is offering real and truly authentic and nutrient dense foods to its members. All of our suppliers have the highest standards in regard to sustainability \u2013 for the land, the environment, and the health of the people who use their products.</p>

<p><strong>Our purpose is to provide real farm fresh, nutrient dense, great tasting truly organic, non-GMO, chemical free, hormone free and antibiotic free foods employing traditional farming methods.</strong></p>

<p><strong>Our goal is to inspire, that our own lives and the lives of following generations could be improved through \u201creal, wholesome foods\u201d to nourish our bodies.</strong></p>`,
      },
    },
    // Mission quote
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "\u201cOur farmer\u2019s mission is to provide nutrient dense, chemical and cruelty-free foods, grown according to God\u2019s Law\u201d",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
      },
    },
    // Farm image
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.farm || "",
        alt: "Miller's Organic Farm",
        caption: "Our farm in Bird-in-Hand, Pennsylvania",
      },
    },
    // Policies heading + Raw Dairy + Grass-Fed
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Policies and Practices</h2>

<h3>Raw Dairy</h3>

<p>Our real cream-top milk comes from entirely pastured, grass fed and genetically verified A2/A2 breeds like cow, buffalo, camel, goat, sheep and it contains all the fat. Our raw milk is the old fashioned kind. It\u2019s non homogenized. It\u2019s entirely raw, straight from the udder and the true definition of whole milk.</p>

<p>Our milk, cream, butter, yogurt, and fresh cheese is <strong>100% raw and nutrient dense</strong>.</p>

<h3>Grass-Fed</h3>

<p>Our milking cows as well as our beef, buffalo, lamb and mutton for meat are <strong>entirely grass-fed</strong>. They eat fresh grass in the pasture and hay enriched with nutrients in the barn. Our goal is to raise the healthiest animals possible.</p>

<p>Our poultry is free to roam on the land and we never feed soy or GMO containing anything.</p>

<h3>Pastured</h3>

<p>All of our animals have access to ample pasture to graze and play in.</p>`,
      },
    },
    // Sign image
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.sign || "",
        alt: "Miller's Organic Farm sign",
        caption: "Miller's Organic Farm \u2013 Bird-in-Hand, PA",
      },
    },
    // Really Fresh + Naturally-Grown + Membership
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h3>Really Fresh</h3>

<ul>
<li>We make fresh dairy products, produced on our own farm from our own milk. These include yogurt, kefir, smoothies and a variety of raw, soft and hard cheeses.</li>
<li>We bake our own bread from heirloom grains and flours, properly soaked, sprouted and/or leavened to make the most nutritious breads, cookies and pies.</li>
<li>Our own farm grown vegetables are fermented or pickled via lactic acid fermentation. Seasonal fresh vegetables or fruits are also available.</li>
<li>Our organic nuts and seeds are prepared by first soaking and then low temp dehydration, to remove phytates and enzyme inhibitors, for ease of digestion.</li>
</ul>

<h3>Naturally-Grown</h3>

<p>Miller\u2019s Organic Farm has never been touched by chemicals, and the neighboring farms we work with \u2013 practice with similar values. All of our products are all-natural, chemical-free, and soy and GMO-free and produced with sustainable practices. We take pride in providing you and your family with nutrient-dense, real food.</p>

<h3>Our Commitment to Members</h3>

<p><strong>We are providing our foods to members only and never to the public.</strong></p>

<p>We promise to supply our members with the most nutritious and clean foods we grow for ourselves and all of those who would like to live off our land. We like transparency and a solid philosophy of farming practices that are hard to find nowadays. Our food is grown without chemicals or pesticides or genetically engineered ingredients and humane animal treatment takes priority. We are against suffering and unethical practices.</p>

<p>All the farms are active in soil regeneration, including composting to restore topsoil and using their land with utmost care, to grow food how nature intended \u2013 brimming with nutrients.</p>`,
      },
    },
    // CTA banner
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "Become a member \u2013 and start enjoying real farm foods today!",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
        linkText: "Become a Member",
        linkUrl: "/become-a-member",
      },
    },
    // Learn more links
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h3>Learn More About Our Farm</h3>
<ul>
<li><a href="/our-farm">About our Farm</a></li>
<li><a href="/shipping-faqs">Shipping FAQs</a></li>
<li><a href="/become-a-member">Become a Member</a></li>
<li><a href="/blog">Read Our Blog</a></li>
</ul>`,
      },
    },
  ];

  // Step 5: Insert page
  console.log("\nStep 5: Inserting page...");
  const { error: insertError } = await supabase.from("pages").insert({
    title: "Our Standards",
    slug: SLUG,
    content: blocks,
    meta_title: "Our Standards and Principles | Amos Miller Farm",
    meta_description:
      "Learn about our commitment to providing real farm fresh, nutrient dense, truly organic, non-GMO, chemical free foods employing traditional farming methods.",
    is_published: true,
    show_in_nav: false,
    sort_order: 0,
  });

  if (insertError) {
    console.error(`Failed to insert page: ${insertError.message}`);
    process.exit(1);
  }

  console.log("\n=== Page Created Successfully ===");
  console.log(`  Title: Our Standards`);
  console.log(`  Slug: ${SLUG}`);
  console.log(`  URL: /our-standards`);
  console.log(`  Images: ${Object.values(images).filter(Boolean).length}/3 uploaded`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
