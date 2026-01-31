/**
 * Blog cleanup script: Fixes messy WordPress HTML imported by scrape-blog.ts.
 *
 * Transformations applied to ALL posts:
 *   - <h4> body text → <p>
 *   - <h1> inside content → <h2> (page title is already h1)
 *   - Remove <strong> wrappers inside headings
 *   - Strip WordPress block classes (wp-block-heading, wp-block-image, etc.)
 *   - Clean <figure>/<div> wrappers around images
 *   - Remove srcset, sizes, loading, decoding attributes from <img>
 *   - Remove inline style attributes
 *   - Remove empty paragraphs and headings
 *   - Convert <br />-separated bullet lists to <ul><li>
 *   - Clean <hr> elements
 *   - Convert old site product links to /shop
 *
 * For "why-butter-is-better" specifically:
 *   - Uploads two new images to Supabase Storage
 *   - Replaces old image references in content
 *   - Updates featured_image_url
 *
 * Usage: npx tsx scripts/cleanup-blog-posts.ts
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

// ── Image paths for butter post ─────────────────────────────────────────────
const BUTTER_IMAGES = [
  "/Users/brandonecarr/Downloads/churn.jpg",
  "/Users/brandonecarr/Downloads/churn1.jpg",
];

// ── HTML Cleaning ───────────────────────────────────────────────────────────

function cleanBlogHtml(html: string): string {
  let h = html;

  // 1. Remove inline style attributes
  h = h.replace(/\s+style="[^"]*"/g, "");

  // 2. Unwrap <div class="wp-block-image"> wrappers (keep the <figure> inside)
  h = h.replace(/<div class="wp-block-image">\s*/g, "");
  h = h.replace(/\s*<\/div>/g, ""); // remove orphaned closing divs

  // 3. Clean <figure> — remove classes
  h = h.replace(/<figure[^>]*>/g, "<figure>");

  // 4. Clean <img> — remove srcset, sizes, loading, decoding, class, width, height
  h = h.replace(
    /\s+(?:srcset|sizes|loading|decoding|class|width|height)="[^"]*"/g,
    ""
  );

  // 5. Clean <hr> — remove classes
  h = h.replace(/<hr[^>]*\/?>/g, "<hr />");

  // 6. Downgrade <h1> inside content to <h2>, strip <strong> wrappers
  h = h.replace(
    /<h1[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<\/h1>/g,
    (_m, inner) => `<h2>${inner.trim()}</h2>`
  );
  h = h.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, (_m, inner) => `<h2>${inner.trim()}</h2>`);

  // 7. Strip <strong> wrappers from <h2> and <h3>
  h = h.replace(
    /<h2[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<\/h2>/g,
    (_m, inner) => `<h2>${inner.trim()}</h2>`
  );
  h = h.replace(
    /<h3[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<\/h3>/g,
    (_m, inner) => `<h3>${inner.trim()}</h3>`
  );

  // 8. Remove wp-block-heading and other WP classes from remaining headings
  h = h.replace(/<(h[2-6])\s+class="[^"]*">/g, "<$1>");

  // 9. Convert <h4> body text to <p> (the main fix)
  h = h.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/g, (_m, inner) => `<p>${inner.trim()}</p>`);

  // 10. Convert <br />-separated bullet lists to <ul><li>
  // Pattern: <p>• item1<br />• item2<br />• item3</p>
  h = h.replace(/<p>((?:[\s\S]*?)(?:•|&#8226;)[\s\S]*?)<\/p>/g, (_m, content) => {
    const items = content
      .split(/<br\s*\/?>/)
      .map((s: string) => s.replace(/^[\s•&#8226;]+/, "").trim())
      .filter((s: string) => s.length > 0);
    if (items.length > 1) {
      return "<ul>\n" + items.map((item: string) => `<li>${item}</li>`).join("\n") + "\n</ul>";
    }
    return `<p>${content}</p>`;
  });

  // 11. Remove trailing <br /> from inside headings and paragraphs
  h = h.replace(/<br\s*\/?>\s*(<\/(?:h[1-6]|p)>)/g, "$1");
  // Remove leading <br /> inside elements
  h = h.replace(/(<(?:h[1-6]|p)>)\s*<br\s*\/?>/g, "$1");

  // 12. Convert old site links
  // Product category links → /shop
  h = h.replace(
    /https?:\/\/amosmillerorganicfarm\.com\/product-category\/[^"']*/g,
    "/shop"
  );
  // Product links → /shop
  h = h.replace(
    /https?:\/\/amosmillerorganicfarm\.com\/product\/[^"']*/g,
    "/shop"
  );
  // Membership links → remove link but keep text
  h = h.replace(
    /<a href="https?:\/\/amosmillerorganicfarm\.com\/become-a-member\/">([\s\S]*?)<\/a>/g,
    "$1"
  );

  // 13. Remove empty elements
  h = h.replace(/<p>\s*<\/p>/g, "");
  h = h.replace(/<p>&nbsp;<\/p>/g, "");
  h = h.replace(/<p>\s+<\/p>/g, "");
  h = h.replace(/<h[1-6]>\s*<\/h[1-6]>/g, "");
  h = h.replace(/<h[1-6]>\s*<strong>\s*<\/strong>\s*<\/h[1-6]>/g, "");

  // 14. Replace <br /> inside paragraphs with </p><p> (split into separate paragraphs)
  // But only when <br /> separates substantial content (not inline breaks)
  h = h.replace(/<p>([\s\S]*?)<\/p>/g, (_m, inner) => {
    // Split on <br /> sequences
    const parts = inner
      .split(/<br\s*\/?>/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    if (parts.length > 1) {
      return parts.map((part: string) => `<p>${part}</p>`).join("\n\n");
    }
    return `<p>${inner.trim()}</p>`;
  });

  // 15. Collapse multiple blank lines
  h = h.replace(/\n{3,}/g, "\n\n");

  // 16. Trim
  h = h.trim();

  return h;
}

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
        : ext === ".webp"
          ? "image/webp"
          : "application/octet-stream";

  // Remove existing file first (upsert)
  await supabase.storage.from(BUCKET).remove([storagePath]);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
    });

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
  console.log("=== Blog Post Cleanup ===\n");

  // Fetch all blog posts
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, content, featured_image_url")
    .order("created_at", { ascending: true });

  if (error || !posts) {
    console.error("Failed to fetch blog posts:", error?.message);
    process.exit(1);
  }

  console.log(`Found ${posts.length} blog posts\n`);

  // ── Upload butter images first ──────────────────────────────────────────
  let butterImage1Url: string | null = null;
  let butterImage2Url: string | null = null;

  // Check if butter image files exist
  const img1Exists = fs.existsSync(BUTTER_IMAGES[0]);
  const img2Exists = fs.existsSync(BUTTER_IMAGES[1]);

  if (img1Exists && img2Exists) {
    console.log("[+] Uploading butter post images...");

    butterImage1Url = await uploadImage(
      BUTTER_IMAGES[0],
      "why-butter-is-better/churn-barn.jpg"
    );
    if (butterImage1Url) {
      console.log(`    churn-barn.jpg → ${butterImage1Url}`);
    }

    butterImage2Url = await uploadImage(
      BUTTER_IMAGES[1],
      "why-butter-is-better/churn-girl.jpg"
    );
    if (butterImage2Url) {
      console.log(`    churn-girl.jpg → ${butterImage2Url}`);
    }

    console.log("");
  } else {
    console.log(
      "[!] Butter images not found at expected paths, skipping image replacement\n"
    );
  }

  // ── Process each post ───────────────────────────────────────────────────
  let updated = 0;
  let errors = 0;

  for (const post of posts) {
    console.log(`[~] Processing: "${post.title}" (${post.slug})`);

    if (!post.content) {
      console.log("    (no content, skipping)");
      continue;
    }

    let cleanedContent = cleanBlogHtml(post.content);
    let newFeaturedImage = post.featured_image_url;

    // Special handling for the butter post
    if (post.slug === "why-butter-is-better") {
      // Remove ALL existing <figure>/<img> blocks from content
      cleanedContent = cleanedContent.replace(/<figure>[\s\S]*?<\/figure>/g, "");

      // Insert the two new images at appropriate positions
      if (butterImage1Url && butterImage2Url) {
        // Insert first image (barn scene) after the opening paragraph
        const firstParagraphEnd = cleanedContent.indexOf("</p>");
        if (firstParagraphEnd !== -1) {
          cleanedContent =
            cleanedContent.slice(0, firstParagraphEnd + 4) +
            `\n\n<figure><img src="${butterImage1Url}" alt="Traditional butter churn in a farm barn" /></figure>\n\n` +
            cleanedContent.slice(firstParagraphEnd + 4);
        }

        // Insert second image (girl churning) before the last heading
        const lastH2Index = cleanedContent.lastIndexOf("<h2>");
        if (lastH2Index !== -1) {
          cleanedContent =
            cleanedContent.slice(0, lastH2Index) +
            `<figure><img src="${butterImage2Url}" alt="Young girl making butter with a traditional churn" /></figure>\n\n` +
            cleanedContent.slice(lastH2Index);
        }

        // Also update featured image
        newFeaturedImage = butterImage1Url;
      }
    }

    // Update the post
    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({
        content: cleanedContent,
        featured_image_url: newFeaturedImage,
      })
      .eq("id", post.id);

    if (updateError) {
      console.log(`    [x] Error: ${updateError.message}`);
      errors++;
    } else {
      console.log(`    [+] Updated`);
      updated++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total posts: ${posts.length}`);
  console.log(`Updated:     ${updated}`);
  console.log(`Errors:      ${errors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
