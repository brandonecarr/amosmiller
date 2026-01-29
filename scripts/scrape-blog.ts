/**
 * Blog scraping script: Fetches blog posts from the source WordPress site
 * via its REST API and imports them into our blog_posts table.
 * Downloads and re-hosts all images in Supabase Storage.
 *
 * Usage: npx tsx scripts/scrape-blog.ts
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
const BUCKET = "blog-images";
const WP_API = `${SOURCE}/wp-json/wp/v2/posts?per_page=100&_embed`;

// ── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#36;/g, "$")
    .replace(/&#036;/g, "$")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201c")
    .replace(/&#8221;/g, "\u201d")
    .replace(/&#038;/g, "&")
    .replace(/&#8243;/g, "\u201d")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\u00a0/g, " ");
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
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

// ── Image download & upload ──────────────────────────────────────────────────

async function downloadAndUpload(
  sourceUrl: string,
  slug: string,
  name: string
): Promise<string | null> {
  if (!sourceUrl) return null;
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
      // Strip WordPress dimension suffixes like -241x241
      ext = ext.replace(/-\d+x\d+/, "");
      if (!ext || ext.length > 5) ext = ".jpg";

      const filePath = `${slug}/${name}${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: getContentType(ext), upsert: true });

      if (error) {
        console.error(`    Upload error for ${name}: ${error.message}`);
        return null;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e: unknown) {
      if (attempt < 2) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      console.error(`    Download failed for ${name}: ${e instanceof Error ? e.message : e}`);
      return null;
    }
  }
  return null;
}

// ── Rewrite image URLs in HTML content ───────────────────────────────────────

async function rewriteContentImages(
  html: string,
  slug: string
): Promise<string> {
  // Find all image URLs in the content that point to the source site
  const imgRegex = /(<img[^>]*src=["'])([^"']+)(["'][^>]*>)/gi;
  const matches: { full: string; prefix: string; url: string; suffix: string }[] = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[2];
    // Only rewrite images from the source site
    if (url.includes("amosmillerorganicfarm.com") || url.startsWith("/wp-content")) {
      matches.push({ full: match[0], prefix: match[1], url, suffix: match[3] });
    }
  }

  if (matches.length === 0) return html;

  let result = html;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    // Get full-size URL (remove WordPress dimension suffixes)
    const fullUrl = m.url.replace(/-\d+x\d+(?=\.\w+$)/, "");
    const newUrl = await downloadAndUpload(fullUrl, slug, `content-${i}`);
    if (newUrl) {
      result = result.replace(m.full, `${m.prefix}${newUrl}${m.suffix}`);
    }
    await sleep(200);
  }

  return result;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Blog Scraping Script ===\n");

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

  // Step 2: Fetch posts from WordPress REST API
  console.log("\nStep 2: Fetching posts from WordPress REST API...");
  let wpPosts: any[];
  try {
    const res = await fetch(WP_API, {
      headers: { "User-Agent": "Mozilla/5.0 (Seed Script)" },
    });
    if (!res.ok) {
      console.error(`API returned ${res.status}`);
      process.exit(1);
    }
    wpPosts = await res.json();
  } catch (e) {
    console.error("Failed to fetch WordPress API:", e);
    process.exit(1);
  }

  console.log(`  Found ${wpPosts.length} posts\n`);

  // Step 3: Import each post
  console.log("Step 3: Importing posts...\n");
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of wpPosts) {
    const title = decodeEntities(post.title?.rendered || "");
    const slug = post.slug;
    const date = post.date;
    const rawExcerpt = post.excerpt?.rendered || "";
    const excerpt = decodeEntities(stripHtmlTags(rawExcerpt));
    const rawContent = post.content?.rendered || "";

    // Check if already imported
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      console.log(`  [=] "${title}" — already exists, skipping`);
      skipped++;
      continue;
    }

    console.log(`  [~] "${title}" — importing...`);

    // Download featured image
    let featuredImageUrl: string | null = null;
    const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
    if (featuredMedia?.source_url) {
      const fullUrl = featuredMedia.source_url.replace(/-\d+x\d+(?=\.\w+$)/, "");
      featuredImageUrl = await downloadAndUpload(fullUrl, slug, "featured");
      if (featuredImageUrl) {
        console.log(`      Featured image uploaded`);
      }
    }

    // Rewrite content images
    const content = await rewriteContentImages(rawContent, slug);
    const contentImagesCount = (content.match(/blog-images/g) || []).length;
    if (contentImagesCount > 0) {
      console.log(`      ${contentImagesCount} content image(s) re-hosted`);
    }

    // Insert into database
    const { error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title,
        slug,
        excerpt: excerpt || null,
        content: decodeEntities(content),
        featured_image_url: featuredImageUrl,
        author_id: null,
        meta_title: title,
        meta_description: excerpt || null,
        is_published: true,
        published_at: date,
        tags: [],
        created_at: date,
      });

    if (insertError) {
      console.error(`  [x] "${title}" — ${insertError.message}`);
      failed++;
    } else {
      console.log(`  [+] "${title}" — imported successfully`);
      imported++;
    }

    await sleep(200);
  }

  console.log("\n=== Scraping Complete ===");
  console.log(`Posts imported: ${imported}`);
  console.log(`Already existed (skipped): ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
