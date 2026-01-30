/**
 * Creates the "Dr. Weston A. Price" CMS page with content and images.
 *
 * Usage: npx tsx scripts/create-dr-price-page.ts
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
const SLUG = "dr-weston-a-price";

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
  console.log("=== Creating Dr. Weston A. Price Page ===\n");

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
    drPrice: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2018/03/image001.jpg",
      "dr-weston-price"
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
        title: "Dr. Weston A. Price",
        subtitle:
          "The pioneering research behind our commitment to nutrient-dense, traditional foods.",
        imageUrl: images.drPrice || "",
        ctaText: "Our Standards",
        ctaLink: "/our-standards",
      },
    },

    // ── Introduction ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<p>Great discoveries often require decades before gaining widespread recognition. The discovery being discussed here may prove critical to human wellbeing, though many remain unaware of it. Growing awareness suggests that much of the conventional nutritional guidance from recent decades contains errors \u2013 with significant health consequences resulting.</p>`,
      },
    },

    // ── Dr. Price Background ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Who Was Dr. Weston A. Price?</h2>

<p>A highly respected researcher who worked as a dentist in Cleveland during the 1920s, Dr. Price observed troubling patterns. His younger patients increasingly exhibited dental cavities, narrow dental arches, crooked teeth, and various health issues that had been absent in earlier generations.</p>

<p>Suspecting dietary changes caused these problems, he theorized that refined Western foods bore the responsibility.</p>`,
      },
    },

    // ── Dr. Price Image ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.drPrice || "",
        alt: "Dr. Weston A. Price conducting nutritional research",
        caption: "Dr. Weston A. Price \u2013 dentist, researcher, and nutritional pioneer",
      },
    },

    // ── Research ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>A Decade of Global Research</h2>

<p>To test his hypothesis, Dr. Price studied isolated indigenous populations who maintained traditional diets and had avoided Western contact. Over an entire decade, he and his wife traveled annually to investigate diverse cultures including South Pacific islanders, African tribes, American Indians, Eskimos, Swiss mountain villagers, Australian Aborigines, and Irish fishing communities.</p>

<p>He meticulously examined each group\u2019s dental conditions and overall health, documenting everything with detailed photographs and laboratory analysis of their native foods.</p>`,
      },
    },

    // ── Key Quote ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "\u201cExcellent dental health was just the first of many revelations \u2013 for the groups who maintained their traditional diets had not just good teeth or straight teeth: they often had perfect, string-of-pearls teeth.\u201d",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
      },
    },

    // ── Dental Findings ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Remarkable Dental Health</h2>

<p>These populations experienced virtually no crowded teeth, overbites, underbites, problematic wisdom teeth, decay, or toothaches across generations \u2013 a remarkable finding given that most of them never brushed their teeth.</p>

<p>Their dental arches were broad and well-formed, with room for all teeth, including wisdom teeth, to emerge properly. This stood in stark contrast to the increasing dental problems Dr. Price was seeing in his American patients.</p>`,
      },
    },

    // ── Health Outcomes ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Health Beyond the Teeth</h2>

<p>Beyond superior dental health, traditional-diet communities showed dramatically reduced incidence of diabetes, cancer, heart disease, multiple sclerosis, and osteoporosis.</p>

<p>Men exhibited robust skeletal development, broad faces, sturdy frames, and exceptional physical conditioning. Remarkably, ancestral skeletal records demonstrated that these characteristics represented their natural healthy state \u2013 not genetic luck, but the direct result of nutrient-dense traditional diets.</p>`,
      },
    },

    // ── Modern Foods Impact ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "When communities adopted modern processed foods, tooth decay, chronic disease, and physical degeneration followed within a single generation.",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
      },
    },

    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>The Impact of Modern Foods</h2>

<p>When neighboring peoples incorporated what Dr. Price called \u201cthe displacing foods of modern commerce\u201d \u2013 including white flour, sugar, jams, jellies, cookies, condensed milk, canned vegetables, margarine, and refined vegetable oils \u2013 dramatically different results emerged.</p>

<p>Beyond rampant tooth decay and increased health problems, subsequent generations born consuming these foods showed striking physical changes: crooked teeth, narrower faces, and altered skeletal structures that diverged significantly from their ancestral patterns.</p>

<p>The changes Dr. Price documented in Western-food-consuming populations remarkably paralleled the conditions appearing in his Cleveland clinic\u2019s American patients.</p>`,
      },
    },

    // ── Sacred Foods ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Sacred Foods &amp; Fat-Soluble Activators</h2>

<p>Understanding Dr. Price\u2019s research illuminated how nutrient-dense traditional foods profoundly impact health. These \u201csacred foods\u201d \u2013 including grass-fed raw dairy products and humanely raised, sunshine-exposed animals \u2013 contain high nutritional vibrancy and critical fat-soluble activators.</p>

<p>Dr. Price identified three key fat-soluble vitamins that traditional cultures prized above all others:</p>

<ul>
<li><strong>Vitamin A</strong> \u2013 found in organ meats, butterfat from grass-fed animals, fish oils, and shellfish</li>
<li><strong>Vitamin D</strong> \u2013 found in organ meats, butterfat, fish oils, shellfish, and the skins of animals exposed to sunlight</li>
<li><strong>Activator X (Vitamin K2)</strong> \u2013 found in the butterfat and organ meats of animals that consume rapidly growing green grass, as well as certain seafoods</li>
</ul>

<p>These activators work synergistically to ensure proper mineral absorption, strong bones and teeth, robust immune function, and optimal development.</p>`,
      },
    },

    // ── Our Commitment ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "\u201cWe honor the principles and philosophies of Dr. Weston A. Price \u2013 emphasizing nutrient density and the presence of the most important fat-soluble activators.\u201d",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
      },
    },

    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Our Commitment to Dr. Price\u2019s Legacy</h2>

<p>Amos Miller Farm exclusively offers vibrant, nutritionally dense foods consistent with Dr. Price\u2019s recommendations. Our members enjoy access to truly nourishing traditional foods \u2013 the same kinds of foods that sustained healthy communities across the globe for generations.</p>

<p>From our raw, grass-fed A2/A2 dairy to our pastured meats and poultry, every product we offer is raised with the goal of maximizing nutritional density. We believe that returning to these time-tested principles is the path to reclaiming the robust health our ancestors enjoyed.</p>`,
      },
    },

    // ── CTA Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "Become a member and start nourishing your family with foods Dr. Price would recommend.",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
        linkText: "Become a Member",
        linkUrl: "/become-a-member",
      },
    },

    // ── Learn More Links ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h3>Continue Reading</h3>
<ul>
<li><a href="/our-standards">Our Standards &amp; Principles</a></li>
<li><a href="/our-farm">About Our Farm</a></li>
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
    title: "Dr. Weston A. Price",
    slug: SLUG,
    content: blocks,
    meta_title: "Dr. Weston A. Price | Amos Miller Farm",
    meta_description:
      "Learn about the pioneering research of Dr. Weston A. Price and how his findings on nutrient-dense traditional foods guide everything we do at Amos Miller Farm.",
    is_published: true,
    show_in_nav: false,
    sort_order: 2,
  });

  if (insertError) {
    console.error(`Failed to insert page: ${insertError.message}`);
    process.exit(1);
  }

  const uploadedCount = Object.values(images).filter(Boolean).length;
  const totalImages = Object.keys(images).length;

  console.log("\n=== Page Created Successfully ===");
  console.log(`  Title: Dr. Weston A. Price`);
  console.log(`  Slug: ${SLUG}`);
  console.log(`  URL: /dr-weston-a-price`);
  console.log(`  Images: ${uploadedCount}/${totalImages} uploaded`);
  console.log(`  Content blocks: ${blocks.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
