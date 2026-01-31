/**
 * Update images for the "A Little About Our Raw Milk" blog post.
 *
 * Uploads 3 new images to Supabase Storage and replaces the old
 * content-0/1/2.jpg references in the blog post content.
 *
 * Usage: npx tsx scripts/update-raw-milk-images.ts
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
const BUCKET = "blog-images";
const SLUG = "a-little-about-raw-milk";

// ── Image mapping: local file → storage path + alt text ─────────────────────
const IMAGES = [
  {
    localPath: "/Users/brandonecarr/Downloads/bacteria.jpg",
    storagePath: `${SLUG}/bacteria-red.jpg`,
    alt: "Close-up of beneficial bacteria found in raw milk",
    replaces: "content-0.jpg",
  },
  {
    localPath: "/Users/brandonecarr/Downloads/bacteria2.jpg",
    storagePath: `${SLUG}/bacteria-blue.jpg`,
    alt: "Microscopic view of probiotic bacteria cultures",
    replaces: "content-1.jpg",
  },
  {
    localPath: "/Users/brandonecarr/Downloads/milkChart.jpg",
    storagePath: `${SLUG}/raw-milk-difference-chart.jpg`,
    alt: "The Raw Milk Difference — comparison chart showing active nutrients in raw vs pasteurized milk",
    replaces: "content-2.jpg",
  },
];

// ── Upload image to Supabase Storage ────────────────────────────────────────

async function uploadImage(
  localPath: string,
  storagePath: string
): Promise<string | null> {
  const fileBuffer = fs.readFileSync(localPath);
  const ext = path.extname(localPath).toLowerCase();
  const contentType =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".png"
        ? "image/png"
        : "application/octet-stream";

  // Remove existing file first (upsert)
  await supabase.storage.from(BUCKET).remove([storagePath]);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType, upsert: true });

  if (error) {
    console.error(`  [x] Failed to upload ${storagePath}:`, error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`=== Update Raw Milk Blog Images ===\n`);

  // Verify all local files exist
  for (const img of IMAGES) {
    if (!fs.existsSync(img.localPath)) {
      console.error(`[x] File not found: ${img.localPath}`);
      process.exit(1);
    }
  }

  // Fetch the blog post
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, content, featured_image_url")
    .eq("slug", SLUG)
    .single();

  if (error || !post) {
    console.error("Failed to fetch blog post:", error?.message);
    process.exit(1);
  }

  console.log(`[~] Post: "${post.title}" (${post.slug})\n`);

  // Upload images and build URL map
  const urlMap: Record<string, { url: string; alt: string }> = {};

  for (const img of IMAGES) {
    console.log(`[+] Uploading ${path.basename(img.localPath)} → ${img.storagePath}`);
    const url = await uploadImage(img.localPath, img.storagePath);
    if (url) {
      urlMap[img.replaces] = { url, alt: img.alt };
      console.log(`    → ${url}`);
    }
  }

  console.log("");

  // Replace image references in content
  let content = post.content;

  for (const [oldFile, { url, alt }] of Object.entries(urlMap)) {
    // Match the old image URL pattern and replace with new URL + alt
    const oldUrlPattern = new RegExp(
      `<img\\s+src="[^"]*/${SLUG}/${oldFile}"[^>]*/>`,
      "g"
    );
    content = content.replace(
      oldUrlPattern,
      `<img src="${url}" alt="${alt}" />`
    );
  }

  // Update the post
  const { error: updateError } = await supabase
    .from("blog_posts")
    .update({ content })
    .eq("id", post.id);

  if (updateError) {
    console.error(`[x] Failed to update post:`, updateError.message);
    process.exit(1);
  }

  console.log(`[+] Blog post updated with new images\n`);
  console.log("=== Done ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
