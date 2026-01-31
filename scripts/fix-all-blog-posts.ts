/**
 * Fix remaining formatting issues across ALL blog posts.
 *
 * - Butter post: complete rewrite (lines split into individual <p> tags, no headings, image mid-sentence)
 * - Kefir post: fix broken <ul>/<li> at start and end
 * - A2/A2 post: fix orphaned <strong> tags
 * - Raw milk post: fix orphaned <strong> tags inside headings
 *
 * Usage: npx tsx scripts/fix-all-blog-posts.ts
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

// ── Butter post: complete rewrite ───────────────────────────────────────────

const BUTTER_CHURN_BARN = "https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/blog-images/why-butter-is-better/churn-barn.jpg";
const BUTTER_CHURN_GIRL = "https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/blog-images/why-butter-is-better/churn-girl.jpg";

const BUTTER_CONTENT = `<h2>Vitamins</h2>

<p><a href="/shop">Butter</a> is a rich source of easily absorbed vitamin A, needed for a wide range of functions, from maintaining good vision to keeping the endocrine system in top shape. Butter also contains all the other fat-soluble vitamins (D, E and K2), which are often lacking in the modern industrial diet.</p>

<figure><img src="${BUTTER_CHURN_BARN}" alt="Traditional butter churn in a farm barn" /></figure>

<h2>Minerals</h2>

<p>Butter is rich in important trace minerals, including manganese, chromium, zinc, copper and selenium (a powerful antioxidant). Butter provides more selenium per gram than wheat germ or herring. Butter is also an excellent source of iodine.</p>

<h2>Fatty Acids</h2>

<p>Butter provides appreciable amounts of short- and medium-chain fatty acids, which support immune function, boost metabolism and have anti-microbial properties; that is, they fight against pathogenic microorganisms in the intestinal tract. Butter also provides the perfect balance of omega-3 and omega-6 essential fatty acids. Arachidonic acid in butter is important for brain function, skin health and prostaglandin balance.</p>

<h2>Glycosphingolipids</h2>

<p>These are a special category of fatty acids that protect against gastro-intestinal infections, especially in the very young and the elderly. Children given reduced fat milks have higher rates of diarrhea than those who drink whole milk.</p>

<h2>Cholesterol</h2>

<p>Despite all of the misinformation you may have heard, cholesterol is needed to maintain intestinal health and for brain and nervous system development in the young.</p>

<figure><img src="${BUTTER_CHURN_GIRL}" alt="Young girl making butter with a traditional churn" /></figure>

<h2>Wulzen Factor</h2>

<p>A hormone-like substance that prevents arthritis and joint stiffness, ensuring that calcium in the body is put into the bones rather than the joints and other tissues. The Wulzen factor is present only in raw butter and cream; it is destroyed by pasteurization.</p>

<h2>CLA (Conjugated Linoleic Acid)</h2>

<p>When butter comes from cows eating green grass, it contains high levels of conjugated linoleic acid (CLA), a compound that gives excellent protection against cancer and also helps the body build muscle rather than store fat.</p>`;

// ── Fix functions for other posts ───────────────────────────────────────────

function fixKefirPost(html: string): string {
  let h = html;

  // Fix: opening <ul><li> wrapping what should be a paragraph
  // The post starts with <ul>\n<li>What seems like ages ago...
  // and the list items are mixed with <p> tags throughout
  h = h.replace(/^<ul>\s*\n<li>/, "<p>");

  // Fix: the bullet list at the end has <p>• first item</li> pattern
  // Replace the mixed list section with a clean <ul>
  h = h.replace(
    /<p>• Eliminates constipation<\/li>/,
    "<ul>\n<li>Eliminates constipation</li>"
  );

  // Fix: orphaned </ul> that might be in wrong place
  // The </ul> should come after the last <li>
  // Make sure it's properly closed

  return h;
}

function fixA2Post(html: string): string {
  let h = html;

  // Fix: <p><strong>We are so thrilled... (unclosed strong)
  // followed by <p></strong></p>
  h = h.replace(
    /<p><strong>(We are so thrilled about this as we have heard so many success stories from our members\. People who were suffering from chronic digestive issues are now able to drink milk again\.)<\/p>\s*\n*\s*<p><\/strong><\/p>/,
    "<p><strong>$1</strong></p>"
  );

  return h;
}

function fixRawMilkPost(html: string): string {
  let h = html;

  // Fix: <h3>It seems lactic acid is really hard on</strong><strong> t</strong><strong>he</strong><strong> germs...
  // Should be: <h3>It seems lactic acid is really hard on the germs...
  h = h.replace(
    /<h3>It seems lactic acid is really hard on<\/strong><strong> t<\/strong><strong>he<\/strong><strong> germs that can make us sick if their numbers get too high\. Nice system!<\/h3>/,
    "<h3>It seems lactic acid is really hard on the germs that can make us sick if their numbers get too high. Nice system!</h3>"
  );

  // Fix: <h2>Join us</strong><strong> today and enjoy raw milk how nature intended.</h2>
  h = h.replace(
    /<h2>Join us<\/strong><strong> today and enjoy raw milk how nature intended\.<\/h2>/,
    "<h2>Join us today and enjoy raw milk how nature intended.</h2>"
  );

  return h;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Fix All Blog Posts ===\n");

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, content")
    .order("created_at", { ascending: true });

  if (error || !posts) {
    console.error("Failed to fetch posts:", error?.message);
    process.exit(1);
  }

  let updated = 0;

  for (const post of posts) {
    let newContent: string | null = null;

    switch (post.slug) {
      case "why-butter-is-better":
        newContent = BUTTER_CONTENT;
        console.log(`[~] "${post.title}" → Full content rewrite`);
        break;

      case "amazing-health-benefits-of-kefir-2":
        newContent = fixKefirPost(post.content);
        if (newContent !== post.content) {
          console.log(`[~] "${post.title}" → Fixed broken list HTML`);
        }
        break;

      case "health-benefits-of-a2-a2-milk":
        newContent = fixA2Post(post.content);
        if (newContent !== post.content) {
          console.log(`[~] "${post.title}" → Fixed orphaned <strong> tags`);
        }
        break;

      case "a-little-about-raw-milk":
        newContent = fixRawMilkPost(post.content);
        if (newContent !== post.content) {
          console.log(`[~] "${post.title}" → Fixed orphaned <strong> tags in headings`);
        }
        break;

      default:
        // Check for any remaining issues
        if (post.content.includes("</strong><strong>")) {
          console.log(`[!] "${post.title}" → Has orphaned <strong> tags (needs manual review)`);
        }
        break;
    }

    if (newContent && newContent !== post.content) {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({ content: newContent })
        .eq("id", post.id);

      if (updateError) {
        console.error(`  [x] Error: ${updateError.message}`);
      } else {
        console.log(`  [+] Updated`);
        updated++;
      }
    }
  }

  console.log(`\n=== Summary: ${updated} posts updated ===`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
