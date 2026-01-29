/**
 * Seed script: Crawls amosmillerorganicfarm.com, creates categories,
 * downloads product images, uploads to Supabase Storage, and creates products.
 *
 * Usage: npx tsx scripts/seed-products.ts
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

// ── Category definitions ─────────────────────────────────────────────────────
interface CategoryDef {
  name: string;
  slug: string;
  sourcePath: string;
  sortOrder: number;
}

const CATEGORIES: CategoryDef[] = [
  { name: "Meats", slug: "meats", sourcePath: "/product-category/meats-only/", sortOrder: 0 },
  { name: "A2/A2 Dairy", slug: "a2a2-dairy", sourcePath: "/product-category/a2a2-diary/", sortOrder: 1 },
  { name: "Cheese", slug: "cheese", sourcePath: "/product-category/cheese/", sortOrder: 2 },
  { name: "Water Buffalo", slug: "water-buffalo", sourcePath: "/product-category/buffalo/", sortOrder: 3 },
  { name: "Bone Broth", slug: "bone-broth", sourcePath: "/product-category/bone-broth/", sortOrder: 4 },
  { name: "Pastured Chicken", slug: "pastured-chicken", sourcePath: "/product-category/100-pastured-chicken/", sortOrder: 5 },
  { name: "Pastured Turkey", slug: "pastured-turkey", sourcePath: "/product-category/pastured-turkey/", sortOrder: 6 },
  { name: "Fertile Eggs", slug: "fertile-eggs", sourcePath: "/product-category/eggs/", sortOrder: 7 },
  { name: "Raw Pet Food", slug: "raw-pet-food", sourcePath: "/product-category/raw-pet-food/", sortOrder: 8 },
  { name: "Rabbit", slug: "rabbit", sourcePath: "/product-category/rabbit/", sortOrder: 9 },
  { name: "Seafood", slug: "seafood", sourcePath: "/product-category/seafood/", sortOrder: 10 },
  { name: "Farm Produce", slug: "farm-produce", sourcePath: "/product-category/vegetables/", sortOrder: 11 },
  { name: "Fermented Vegetables", slug: "fermented-vegetables", sourcePath: "/product-category/fermented-vegetables/", sortOrder: 12 },
  { name: "Pickled Vegetables", slug: "pickled-vegetables", sourcePath: "/product-category/pickled-vegetables/", sortOrder: 13 },
  { name: "Bakery", slug: "bakery", sourcePath: "/product-category/bakery/", sortOrder: 14 },
  { name: "Drinks", slug: "drinks", sourcePath: "/product-category/drinks/", sortOrder: 15 },
  { name: "Probiotic Cultures", slug: "probiotic-cultures", sourcePath: "/product-category/cultures/", sortOrder: 16 },
  { name: "Ice Cream", slug: "ice-cream", sourcePath: "/product-category/ice-cream/", sortOrder: 17 },
  { name: "Healthy Treats", slug: "healthy-treats", sourcePath: "/product-category/treats/", sortOrder: 18 },
  { name: "Staples", slug: "staples", sourcePath: "/product-category/staples/", sortOrder: 19 },
  { name: "Crispy Nuts", slug: "crispy-nuts", sourcePath: "/product-category/crispy-nuts/", sortOrder: 20 },
  { name: "Traditional Fats", slug: "traditional-fats", sourcePath: "/product-category/healthy-fats/", sortOrder: 21 },
  { name: "Green Pastures", slug: "green-pastures", sourcePath: "/product-category/green-pastures/", sortOrder: 22 },
  { name: "Rosita Real Foods", slug: "rosita-real-foods", sourcePath: "/product-category/rosita-real-foods/", sortOrder: 23 },
  { name: "Beauty Products", slug: "beauty-products", sourcePath: "/product-category/beauty-products/", sortOrder: 24 },
];

// ── Utilities ────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-") // em/en dash
    .replace(/&/g, "and")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
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

/** Remove WooCommerce thumbnail dimension suffix, e.g. `-241x241` */
function getFullSizeUrl(url: string): string {
  return url.replace(/-\d+x\d+(?=\.\w+$)/, "");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── HTML Parsing ─────────────────────────────────────────────────────────────
interface ParsedProduct {
  name: string;
  basePrice: number;
  salePrice?: number;
  imageUrl: string;
  pricingType: "fixed" | "weight";
}

function parseProductsFromHtml(html: string): ParsedProduct[] {
  const products: ParsedProduct[] = [];
  const seen = new Set<string>();

  // Decode HTML entities
  const decoded = html
    .replace(/&#36;/g, "$")
    .replace(/&#036;/g, "$")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&");

  // Split by product container div
  // The theme uses: <div class="productListing__productContainer--list ...">
  const blocks = decoded.split("productListing__productContainer--list");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    // Extract title from <h2 class="productListing__title--list ..."><a>Title</a></h2>
    const titleMatch = block.match(
      /productListing__title--list[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i
    );
    if (!titleMatch) continue;
    const name = titleMatch[1].trim().replace(/\*+/g, "").trim();
    if (!name) continue;

    // Dedup by name
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Extract image URL: <img src="..." ... class="productListing__photoImg--list">
    // src appears before class in this theme
    const imgTagMatch = block.match(
      /<img\s[^>]*class="productListing__photoImg--list"[^>]*>/i
    );
    let imageUrl = "";
    if (imgTagMatch) {
      const srcMatch = imgTagMatch[0].match(/src="([^"]+)"/i);
      if (srcMatch) imageUrl = getFullSizeUrl(srcMatch[1].trim());
    }

    // Extract prices — find the price container and get dollar amounts
    // Only look at the price section to avoid picking up unrelated $ values
    const priceSection = block.match(
      /productListing__price--list[\s\S]*?(?=productListing__addToCart|$)/i
    );
    if (!priceSection) continue;

    // Strip HTML tags and collapse whitespace so "$</span>99.00" becomes "$ 99.00"
    const priceTextClean = priceSection[0].replace(/<[^>]+>/g, " ");
    const priceAmounts = [...priceTextClean.matchAll(/\$\s*([\d,]+(?:\.\d+)?)/g)]
      .map((m) => parseFloat(m[1].replace(",", "")))
      .filter((v) => !isNaN(v) && v > 0);

    // Deduplicate prices (screen-reader text duplicates visible prices)
    const uniquePrices = [...new Set(priceAmounts)];
    if (uniquePrices.length === 0) continue;

    // Determine sale vs regular price
    const hasSale = priceSection[0].includes("<del") && priceSection[0].includes("<ins");
    let basePrice: number;
    let salePrice: number | undefined;

    if (hasSale && uniquePrices.length >= 2) {
      // First unique price = original (in <del>), second = sale (in <ins>)
      basePrice = uniquePrices[0];
      salePrice = uniquePrices[1];
    } else {
      // Single price or price range — use the first price
      basePrice = uniquePrices[0];
    }

    // Determine if weight-based
    const lowerName = name.toLowerCase();
    const isWeight =
      lowerName.includes("per lb") ||
      lowerName.includes("per pound") ||
      lowerName.includes("– lb");

    products.push({
      name,
      basePrice,
      salePrice,
      imageUrl,
      pricingType: isWeight ? "weight" : "fixed",
    });
  }

  return products;
}

// ── Image download & upload ──────────────────────────────────────────────────
async function downloadAndUpload(
  sourceUrl: string,
  productId: string
): Promise<string | null> {
  if (!sourceUrl) return null;

  // Ensure absolute URL
  const url = sourceUrl.startsWith("http") ? sourceUrl : `${SOURCE}${sourceUrl}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Seed Script)" },
      });
      if (!response.ok) {
        if (attempt < 2) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const parsed = new URL(url);
      let ext = path.extname(parsed.pathname).toLowerCase();
      if (!ext || ext.length > 5) ext = ".jpg";

      const filePath = `${productId}/${Date.now()}${ext}`;
      const contentType = getContentType(ext);

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType, upsert: true });

      if (error) {
        console.error(`    Upload failed: ${error.message}`);
        return null;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt < 2) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      console.error(`    Download failed: ${msg}`);
      return null;
    }
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Amos Miller Farm Product Seed ===\n");

  // ── Step 1: Create categories ──────────────────────────────────────────────
  console.log("Step 1: Creating categories...");
  const categoryMap = new Map<string, string>(); // slug -> id

  for (const cat of CATEGORIES) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        {
          name: cat.name,
          slug: cat.slug,
          sort_order: cat.sortOrder,
          is_active: true,
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (error) {
      console.error(`  [x] ${cat.name}: ${error.message}`);
      continue;
    }
    categoryMap.set(cat.slug, data.id);
    console.log(`  [+] ${cat.name}`);
  }
  console.log(`\nCreated ${categoryMap.size} categories.\n`);

  // ── Step 2: Fetch and create products per category ─────────────────────────
  let totalProducts = 0;
  let totalImages = 0;

  for (const cat of CATEGORIES) {
    const categoryId = categoryMap.get(cat.slug);
    if (!categoryId) {
      console.log(`Skipping ${cat.name} (no category ID)`);
      continue;
    }

    console.log(`\n--- ${cat.name} ---`);
    console.log(`Fetching ${SOURCE}${cat.sourcePath}...`);

    let html: string;
    try {
      const res = await fetch(`${SOURCE}${cat.sourcePath}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Seed Script)" },
      });
      if (!res.ok) {
        console.error(`  HTTP ${res.status} — skipping`);
        continue;
      }
      html = await res.text();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  Fetch error: ${msg} — skipping`);
      continue;
    }

    const products = parseProductsFromHtml(html);
    console.log(`  Found ${products.length} products`);

    for (const product of products) {
      const slug = slugify(product.name);

      // Check for existing product
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        console.log(`  [=] ${product.name} (exists)`);
        continue;
      }

      // Create product
      const insertData: Record<string, unknown> = {
        name: product.name,
        slug,
        category_id: categoryId,
        pricing_type: product.pricingType,
        base_price: product.basePrice,
        weight_unit: "lb",
        is_active: true,
        is_taxable: true,
        track_inventory: false,
        stock_quantity: 100,
        low_stock_threshold: 5,
        images: [],
        tags: [],
        subscription_frequencies: [],
      };

      if (product.salePrice !== undefined) {
        insertData.sale_price = product.salePrice;
      }

      const { data: newProduct, error: insertError } = await supabase
        .from("products")
        .insert(insertData)
        .select("id")
        .single();

      if (insertError) {
        console.error(`  [x] ${product.name}: ${insertError.message}`);
        continue;
      }

      // Upload image
      if (product.imageUrl && newProduct) {
        const publicUrl = await downloadAndUpload(
          product.imageUrl,
          newProduct.id
        );
        if (publicUrl) {
          await supabase
            .from("products")
            .update({
              featured_image_url: publicUrl,
              images: [{ url: publicUrl, alt: product.name, sort_order: 0 }],
            })
            .eq("id", newProduct.id);
          totalImages++;
        }
      }

      totalProducts++;
      console.log(
        `  [+] ${product.name} — $${product.basePrice.toFixed(2)}${product.salePrice ? ` (sale: $${product.salePrice.toFixed(2)})` : ""}`
      );

      // Small delay to avoid overwhelming the source server
      await sleep(100);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n=== Seed Complete ===");
  console.log(`Categories: ${categoryMap.size}`);
  console.log(`Products created: ${totalProducts}`);
  console.log(`Images uploaded: ${totalImages}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
