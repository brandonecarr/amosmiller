/**
 * Review scraping script: Visits each product's individual page on the source site
 * to extract reviews from JSON-LD structured data.
 *
 * Usage: npx tsx scripts/scrape-reviews.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

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
const SOURCE = "https://amosmillerorganicfarm.com";

// ── Same categories as seed/enrich scripts ──────────────────────────────────
const CATEGORIES = [
  { slug: "meats", sourcePath: "/product-category/meats-only/" },
  { slug: "a2a2-dairy", sourcePath: "/product-category/a2a2-diary/" },
  { slug: "cheese", sourcePath: "/product-category/cheese/" },
  { slug: "water-buffalo", sourcePath: "/product-category/buffalo/" },
  { slug: "bone-broth", sourcePath: "/product-category/bone-broth/" },
  { slug: "pastured-chicken", sourcePath: "/product-category/100-pastured-chicken/" },
  { slug: "pastured-turkey", sourcePath: "/product-category/pastured-turkey/" },
  { slug: "fertile-eggs", sourcePath: "/product-category/eggs/" },
  { slug: "raw-pet-food", sourcePath: "/product-category/raw-pet-food/" },
  { slug: "rabbit", sourcePath: "/product-category/rabbit/" },
  { slug: "seafood", sourcePath: "/product-category/seafood/" },
  { slug: "farm-produce", sourcePath: "/product-category/vegetables/" },
  { slug: "fermented-vegetables", sourcePath: "/product-category/fermented-vegetables/" },
  { slug: "pickled-vegetables", sourcePath: "/product-category/pickled-vegetables/" },
  { slug: "bakery", sourcePath: "/product-category/bakery/" },
  { slug: "drinks", sourcePath: "/product-category/drinks/" },
  { slug: "probiotic-cultures", sourcePath: "/product-category/cultures/" },
  { slug: "ice-cream", sourcePath: "/product-category/ice-cream/" },
  { slug: "healthy-treats", sourcePath: "/product-category/treats/" },
  { slug: "staples", sourcePath: "/product-category/staples/" },
  { slug: "crispy-nuts", sourcePath: "/product-category/crispy-nuts/" },
  { slug: "traditional-fats", sourcePath: "/product-category/healthy-fats/" },
  { slug: "green-pastures", sourcePath: "/product-category/green-pastures/" },
  { slug: "rosita-real-foods", sourcePath: "/product-category/rosita-real-foods/" },
  { slug: "beauty-products", sourcePath: "/product-category/beauty-products/" },
];

// ── Utilities ────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#36;/g, "$")
    .replace(/&#036;/g, "$")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, "&")
    .replace(/&#8243;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\u00a0/g, " ");
}

// ── Extract product links from category page ─────────────────────────────────
interface ProductMapping {
  name: string;
  sourceUrl: string;
}

function extractProductLinks(html: string): ProductMapping[] {
  const decoded = decodeEntities(html);
  const results: ProductMapping[] = [];
  const seen = new Set<string>();
  const blocks = decoded.split("productListing__productContainer--list");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const titleMatch = block.match(
      /productListing__title--list[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i
    );
    if (!titleMatch) continue;
    const name = titleMatch[1].trim().replace(/\*+/g, "").trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const urlMatch =
      block.match(/productListing__photoLink--list[^>]*href="([^"]+)"/i) ||
      block.match(/href="([^"]+)"[^>]*productListing__photoLink--list/i);
    if (!urlMatch) continue;

    results.push({ name, sourceUrl: urlMatch[1] });
  }

  return results;
}

// ── Extract reviews from JSON-LD ─────────────────────────────────────────────
interface SourceReview {
  authorName: string;
  rating: number;
  reviewBody: string | null;
  datePublished: string;
}

function extractReviewsFromHtml(html: string): SourceReview[] {
  // Find all JSON-LD blocks
  const jsonLdRegex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonLd = JSON.parse(match[1]);

      // Find the Product object (may be top-level or in @graph)
      let product = null;
      if (jsonLd["@type"] === "Product") {
        product = jsonLd;
      } else if (jsonLd["@graph"]) {
        product = jsonLd["@graph"].find(
          (item: { "@type": string }) => item["@type"] === "Product"
        );
      }

      if (!product?.review) continue;

      const rawReviews = Array.isArray(product.review)
        ? product.review
        : [product.review];

      return rawReviews
        .filter((r: any) => r["@type"] === "Review")
        .map((r: any) => ({
          authorName: r.author?.name || "Anonymous",
          rating: parseInt(r.reviewRating?.ratingValue || "5", 10),
          reviewBody: r.reviewBody
            ? decodeEntities(String(r.reviewBody)).trim() || null
            : null,
          datePublished: r.datePublished || new Date().toISOString(),
        }));
    } catch {
      // JSON parse failed, try next block
      continue;
    }
  }

  return [];
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Review Scraping Script ===\n");

  // Load all products from DB
  const { data: allProducts, error: prodError } = await supabase
    .from("products")
    .select("id, name, slug");

  if (prodError || !allProducts) {
    console.error("Failed to load products:", prodError?.message);
    process.exit(1);
  }

  console.log(`Loaded ${allProducts.length} products from database.\n`);

  // Build a lookup: lowercase name → product record
  const productByName = new Map<string, (typeof allProducts)[0]>();
  for (const p of allProducts) {
    productByName.set(p.name.toLowerCase(), p);
  }

  // Step 1: Build name → source URL mapping from all category pages
  console.log("Step 1: Building product URL mappings from category pages...");
  const nameToUrl = new Map<string, string>();

  for (const cat of CATEGORIES) {
    try {
      const res = await fetch(`${SOURCE}${cat.sourcePath}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Seed Script)" },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const links = extractProductLinks(html);
      for (const link of links) {
        nameToUrl.set(link.name.toLowerCase(), link.sourceUrl);
      }
    } catch {
      // skip
    }
    await sleep(200);
  }

  console.log(`  Mapped ${nameToUrl.size} product URLs.\n`);

  // Step 2: Scrape reviews from each product page
  console.log("Step 2: Scraping reviews...\n");
  let productsWithReviews = 0;
  let totalReviews = 0;
  let skipped = 0;
  let failed = 0;
  let alreadyImported = 0;

  for (const product of allProducts) {
    const sourceUrl = nameToUrl.get(product.name.toLowerCase());
    if (!sourceUrl) {
      skipped++;
      continue;
    }

    // Check if we already imported reviews for this product
    const { count } = await supabase
      .from("product_reviews")
      .select("id", { count: "exact", head: true })
      .eq("product_id", product.id)
      .eq("is_imported", true);

    if (count && count > 0) {
      alreadyImported++;
      continue;
    }

    // Fetch the product page
    let html: string;
    try {
      const res = await fetch(sourceUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Seed Script)" },
      });
      if (!res.ok) {
        failed++;
        continue;
      }
      html = await res.text();
    } catch {
      failed++;
      continue;
    }

    const reviews = extractReviewsFromHtml(html);
    if (reviews.length === 0) {
      // No reviews for this product
      continue;
    }

    // Insert reviews
    const reviewRows = reviews.map((r) => ({
      product_id: product.id,
      user_id: null,
      author_name: r.authorName,
      rating: Math.min(5, Math.max(1, r.rating)),
      review_body: r.reviewBody,
      is_approved: true,
      is_imported: true,
      source_date: r.datePublished,
      created_at: r.datePublished,
    }));

    const { error: insertError } = await supabase
      .from("product_reviews")
      .insert(reviewRows);

    if (insertError) {
      console.error(`  [x] ${product.name}: ${insertError.message}`);
      failed++;
    } else {
      productsWithReviews++;
      totalReviews += reviews.length;
      console.log(
        `  [+] ${product.name}: ${reviews.length} review${reviews.length !== 1 ? "s" : ""} imported`
      );
    }

    await sleep(200);
  }

  console.log("\n=== Scraping Complete ===");
  console.log(`Products with reviews: ${productsWithReviews}`);
  console.log(`Total reviews imported: ${totalReviews}`);
  console.log(`Already imported (skipped): ${alreadyImported}`);
  console.log(`No source URL (skipped): ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
