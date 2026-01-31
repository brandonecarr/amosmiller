/**
 * Fixes product images by re-scraping gallery images from the source site.
 *
 * The original enrich script had a deduplication bug: it didn't skip the first
 * WooCommerce gallery image (which is always the featured image), resulting in
 * duplicated featured images across most products.
 *
 * This script:
 * 1. Builds a product name → source URL mapping from category pages
 * 2. For each product, fetches the source page and extracts gallery images
 * 3. Compares source gallery count with stored images
 * 4. Removes duplicates and adds any missing images
 *
 * Usage: npx tsx scripts/fix-product-images.ts
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
const BUCKET = "product-images";

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
    .replace(/&nbsp;/g, " ");
}

function getFullSizeUrl(url: string): string {
  return url.replace(/-\d+x\d+(?=\.\w+$)/, "");
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return map[ext.toLowerCase()] || "image/jpeg";
}

// ── Build name → source URL mapping ──────────────────────────────────────────
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

async function fetchPage(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Image Fix Script)" },
      });
      if (!response.ok) {
        if (attempt < 2) { await sleep(1000); continue; }
        return null;
      }
      return await response.text();
    } catch {
      if (attempt < 2) { await sleep(1000); continue; }
      return null;
    }
  }
  return null;
}

// ── Extract gallery images from product page ─────────────────────────────────
function extractGalleryImages(html: string): string[] {
  const images: string[] = [];

  // Method 1: woocommerce-product-gallery__image with <a href>
  const galleryRegex =
    /woocommerce-product-gallery__image[^>]*>[\s\S]*?<a\s+href="([^"]+)"/gi;
  let match;
  while ((match = galleryRegex.exec(html)) !== null) {
    const imgUrl = getFullSizeUrl(match[1]);
    if (imgUrl && !images.includes(imgUrl)) {
      images.push(imgUrl);
    }
  }

  // Method 2 (fallback): data-large_image attributes
  if (images.length === 0) {
    const largeImgRegex = /data-large_image="([^"]+)"/gi;
    while ((match = largeImgRegex.exec(html)) !== null) {
      const imgUrl = match[1];
      if (imgUrl && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }
  }

  return images;
}

// ── Image upload ─────────────────────────────────────────────────────────────
async function downloadAndUpload(
  sourceUrl: string,
  productId: string,
  index: number
): Promise<string | null> {
  if (!sourceUrl) return null;
  const url = sourceUrl.startsWith("http") ? sourceUrl : `${SOURCE}${sourceUrl}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Image Fix Script)" },
      });
      if (!response.ok) {
        if (attempt < 2) { await sleep(1000); continue; }
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const parsed = new URL(url);
      let ext = path.extname(parsed.pathname).toLowerCase();
      if (!ext || ext.length > 5) ext = ".jpg";

      const filePath = `${productId}/fix-${Date.now()}-${index}${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: getContentType(ext), upsert: true });

      if (error) return null;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return data.publicUrl;
    } catch {
      if (attempt < 2) { await sleep(1000); continue; }
      return null;
    }
  }
  return null;
}

// ── Normalize product name for matching ──────────────────────────────────────
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Fix Product Images Script ===\n");

  // Step 1: Load all products
  console.log("Step 1: Loading products from DB...");
  const { data: allProducts, error: prodError } = await supabase
    .from("products")
    .select("id, name, slug, images, featured_image_url");

  if (prodError || !allProducts) {
    console.error("Failed to load products:", prodError?.message);
    process.exit(1);
  }
  console.log(`  Found ${allProducts.length} products\n`);

  // Step 2: Build name → source URL mapping from category pages
  console.log("Step 2: Building source URL mapping from category pages...");
  const nameToUrl = new Map<string, string>();

  for (const cat of CATEGORIES) {
    const url = `${SOURCE}${cat.sourcePath}`;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const pageUrl = page === 1 ? url : `${url}page/${page}/`;
      const html = await fetchPage(pageUrl);
      if (!html) break;

      const links = extractProductLinks(html);
      if (links.length === 0) {
        hasMore = false;
        break;
      }

      for (const link of links) {
        const key = normalizeName(link.name);
        if (!nameToUrl.has(key)) {
          nameToUrl.set(key, link.sourceUrl);
        }
      }

      page++;
      await sleep(200);
    }
  }
  console.log(`  Mapped ${nameToUrl.size} source product URLs\n`);

  // Step 3: Process each product
  console.log("Step 3: Checking and fixing product images...\n");

  let fixed = 0;
  let alreadyCorrect = 0;
  let noSourceUrl = 0;
  let fetchFailed = 0;
  let imagesAdded = 0;
  let duplicatesRemoved = 0;

  for (const product of allProducts) {
    const key = normalizeName(product.name);
    const sourceUrl = nameToUrl.get(key);

    if (!sourceUrl) {
      noSourceUrl++;
      continue;
    }

    // Fetch the source product page
    const html = await fetchPage(sourceUrl);
    if (!html) {
      fetchFailed++;
      continue;
    }

    // Extract gallery images from source
    const sourceGallery = extractGalleryImages(html);

    // WooCommerce gallery[0] is always the featured image.
    // The actual "additional" images are gallery[1..N]
    const additionalSourceImages = sourceGallery.slice(1);

    // Current state in DB
    const currentImages: { url: string; alt: string; sort_order: number }[] =
      product.images || [];

    // The correct number of images should be:
    // 1 (featured) + additionalSourceImages.length
    const correctCount = 1 + additionalSourceImages.length;

    if (currentImages.length === correctCount) {
      alreadyCorrect++;
      continue;
    }

    console.log(
      `  [~] ${product.name}: have ${currentImages.length} images, source has ${correctCount} (1 featured + ${additionalSourceImages.length} gallery)`
    );

    // Rebuild the images array:
    // Keep the first image (featured) from our existing data
    const newImages: { url: string; alt: string; sort_order: number }[] = [];

    if (currentImages.length > 0) {
      // Keep the original featured image
      newImages.push({ ...currentImages[0], sort_order: 0 });
    }

    // Download and add the additional gallery images from source
    for (let i = 0; i < additionalSourceImages.length; i++) {
      const imgUrl = additionalSourceImages[i];
      const publicUrl = await downloadAndUpload(imgUrl, product.id, i + 1);
      if (publicUrl) {
        newImages.push({
          url: publicUrl,
          alt: product.name,
          sort_order: i + 1,
        });
        imagesAdded++;
      }
    }

    const removed = currentImages.length - 1; // We removed all but the first
    const netRemoved = removed - additionalSourceImages.length;
    if (netRemoved > 0) duplicatesRemoved += netRemoved;

    // Update the product
    const { error: updateError } = await supabase
      .from("products")
      .update({ images: newImages })
      .eq("id", product.id);

    if (updateError) {
      console.error(`  [x] ${product.name}: ${updateError.message}`);
    } else {
      console.log(
        `  [+] ${product.name}: fixed → ${newImages.length} images`
      );
      fixed++;
    }

    await sleep(300);
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`  Total products: ${allProducts.length}`);
  console.log(`  Already correct: ${alreadyCorrect}`);
  console.log(`  Fixed: ${fixed}`);
  console.log(`  No source URL found: ${noSourceUrl}`);
  console.log(`  Fetch failed: ${fetchFailed}`);
  console.log(`  Duplicates removed: ${duplicatesRemoved}`);
  console.log(`  New images added: ${imagesAdded}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
