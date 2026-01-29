/**
 * Enrichment script: Visits each product's individual page on the source site
 * to extract description, short_description, SKU, and additional images.
 *
 * Usage: npx tsx scripts/enrich-products.ts
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

// ── Same categories as seed script ───────────────────────────────────────────
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

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

// ── Step 1: Build name → source URL mapping from category pages ──────────────
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

    // Extract title
    const titleMatch = block.match(
      /productListing__title--list[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i
    );
    if (!titleMatch) continue;
    const name = titleMatch[1].trim().replace(/\*+/g, "").trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Extract product URL from the photo link
    const urlMatch = block.match(
      /productListing__photoLink--list[^>]*href="([^"]+)"/i
    ) || block.match(
      /href="([^"]+)"[^>]*productListing__photoLink--list/i
    );
    if (!urlMatch) continue;

    results.push({ name, sourceUrl: urlMatch[1] });
  }

  return results;
}

// ── Step 2: Parse individual product page ────────────────────────────────────
interface ProductEnrichment {
  description: string | null;
  short_description: string | null;
  sku: string | null;
  galleryImages: string[]; // full-size image URLs
}

function parseProductPage(html: string): ProductEnrichment {
  const result: ProductEnrichment = {
    description: null,
    short_description: null,
    sku: null,
    galleryImages: [],
  };

  // 1. Parse JSON-LD for description and SKU
  const jsonLdMatch = html.match(
    /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i
  );
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      // The JSON-LD can be a single object or have @graph array
      const product = jsonLd["@graph"]
        ? jsonLd["@graph"].find((item: { "@type": string }) => item["@type"] === "Product")
        : jsonLd["@type"] === "Product"
          ? jsonLd
          : null;

      if (product) {
        if (product.description) {
          result.description = decodeEntities(product.description).trim();
        }
        if (product.sku && product.sku !== "N/A") {
          result.sku = String(product.sku);
        }
      }
    } catch {
      // JSON parse failed — try regex fallback
      const descMatch = html.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (descMatch) {
        result.description = decodeEntities(descMatch[1]).trim();
      }
      const skuMatch = html.match(/"sku"\s*:\s*(\d+)/);
      if (skuMatch) {
        result.sku = skuMatch[1];
      }
    }
  }

  // 2. Parse short description from HTML
  const shortDescMatch = html.match(
    /woocommerce-product-details__short-description">([\s\S]*?)<\/div>/i
  );
  if (shortDescMatch) {
    const rawShort = shortDescMatch[1].trim();
    // If there's a nested short-description div (some pages have this), grab it
    const nestedMatch = rawShort.match(
      /woocommerce-product-details__short-description">([\s\S]*?)<\/div>/i
    );
    const shortHtml = nestedMatch ? nestedMatch[1] : rawShort;
    const shortText = stripHtml(decodeEntities(shortHtml));
    if (shortText) {
      result.short_description = shortText;
    }
  }

  // 3. Parse gallery images
  const galleryRegex = /woocommerce-product-gallery__image[^>]*>[\s\S]*?<a\s+href="([^"]+)"/gi;
  let galleryMatch;
  while ((galleryMatch = galleryRegex.exec(html)) !== null) {
    const imgUrl = getFullSizeUrl(galleryMatch[1]);
    if (imgUrl && !result.galleryImages.includes(imgUrl)) {
      result.galleryImages.push(imgUrl);
    }
  }

  // Also check data-large_image attributes as fallback
  if (result.galleryImages.length === 0) {
    const largeImgRegex = /data-large_image="([^"]+)"/gi;
    let largeMatch;
    while ((largeMatch = largeImgRegex.exec(html)) !== null) {
      const imgUrl = largeMatch[1];
      if (imgUrl && !result.galleryImages.includes(imgUrl)) {
        result.galleryImages.push(imgUrl);
      }
    }
  }

  return result;
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
        headers: { "User-Agent": "Mozilla/5.0 (Seed Script)" },
      });
      if (!response.ok) {
        if (attempt < 2) { await sleep(1000); continue; }
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const parsed = new URL(url);
      let ext = path.extname(parsed.pathname).toLowerCase();
      if (!ext || ext.length > 5) ext = ".jpg";

      const filePath = `${productId}/${Date.now()}-${index}${ext}`;
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

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Product Enrichment Script ===\n");

  // Load all products from DB
  const { data: allProducts, error: prodError } = await supabase
    .from("products")
    .select("id, name, slug, description, short_description, sku, images, featured_image_url");

  if (prodError || !allProducts) {
    console.error("Failed to load products:", prodError?.message);
    process.exit(1);
  }

  console.log(`Loaded ${allProducts.length} products from database.\n`);

  // Build a lookup: lowercase name → product record
  const productByName = new Map<string, typeof allProducts[0]>();
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

  // Step 2: Enrich each product
  console.log("Step 2: Enriching products...\n");
  let enriched = 0;
  let skipped = 0;
  let failed = 0;
  let newImages = 0;

  for (const product of allProducts) {
    // Find source URL by name
    const sourceUrl = nameToUrl.get(product.name.toLowerCase());
    if (!sourceUrl) {
      skipped++;
      continue;
    }

    // Skip if already has description (already enriched)
    if (product.description && product.description.length > 10) {
      skipped++;
      continue;
    }

    // Fetch individual product page
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

    const enrichment = parseProductPage(html);

    // Build update payload
    const update: Record<string, unknown> = {};
    let changed = false;

    if (enrichment.description) {
      update.description = enrichment.description;
      changed = true;
    }

    if (enrichment.short_description) {
      update.short_description = enrichment.short_description;
      changed = true;
    }

    if (enrichment.sku) {
      update.sku = enrichment.sku;
      changed = true;
    }

    // Handle gallery images — upload any new ones
    if (enrichment.galleryImages.length > 0) {
      const existingUrls = new Set(
        (product.images || []).map((img: { url: string }) => img.url)
      );
      const currentImages = [...(product.images || [])];
      let imageIndex = currentImages.length;

      for (const imgUrl of enrichment.galleryImages) {
        // Skip if we already have this image (by checking if the source filename is similar)
        const isNew = !existingUrls.size || imageIndex > 0;

        // For the first image, check if it's different from our featured image
        if (imageIndex === 0 && product.featured_image_url) {
          // We already have a featured image, skip unless gallery has additional images
          imageIndex++;
          continue;
        }

        if (isNew && imageIndex > 0) {
          const publicUrl = await downloadAndUpload(imgUrl, product.id, imageIndex);
          if (publicUrl) {
            currentImages.push({
              url: publicUrl,
              alt: product.name,
              sort_order: imageIndex,
            });
            newImages++;
          }
        }
        imageIndex++;
      }

      if (currentImages.length > (product.images || []).length) {
        update.images = currentImages;
        changed = true;
      }
    }

    if (changed) {
      const { error: updateError } = await supabase
        .from("products")
        .update(update)
        .eq("id", product.id);

      if (updateError) {
        console.error(`  [x] ${product.name}: ${updateError.message}`);
        failed++;
      } else {
        enriched++;
        const desc = enrichment.description
          ? enrichment.description.slice(0, 60) + "..."
          : "no desc";
        console.log(`  [+] ${product.name} | ${desc}`);
      }
    } else {
      skipped++;
    }

    await sleep(200);
  }

  console.log("\n=== Enrichment Complete ===");
  console.log(`Enriched: ${enriched}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`New images uploaded: ${newImages}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
