/**
 * Creates the "About Our Farm" CMS page with content and images.
 *
 * Usage: npx tsx scripts/create-about-our-farm-page.ts
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
const SLUG = "our-farm";

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
  console.log("=== Creating About Our Farm Page ===\n");

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
    cattle: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/beef-1-1-6.jpg",
      "cattle"
    ),
    buffalo: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/water-buff-hero-1024x633-3-1024x633.jpg",
      "water-buffalo"
    ),
    sheep: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/Sheep-and-cows-e1547261659729-4.jpg",
      "sheep-goats"
    ),
    camels: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/camel-and-cows-amish-farm-1-2.jpg",
      "camels"
    ),
    poultry: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/chicken-on-pasture-2-1024x575.jpg",
      "pastured-poultry"
    ),
    calf: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/calf-drinking-milk-his-mother-39672535-e1547257753309-1-2.jpg",
      "milk-fed-veal"
    ),
    pigs: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/921cef0707af57333fb24265b138652c-sandwich-board-little-pigs-3.jpg",
      "whey-fed-pork"
    ),
    salmon: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/9312f93778d2650eb8df83419ab7d5c2-e1547256306235-2.jpg",
      "wild-seafood"
    ),
    bread: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/7-grain-bread-1.jpg",
      "traditional-bakery"
    ),
    kombucha: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/Batch-of-Kombucha-tea.jpg",
      "healthy-drinks"
    ),
    fats: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/lard-and-tallow-3.jpg",
      "healthy-fats"
    ),
    honey: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/raw-honey-for.....jpg",
      "raw-sweeteners"
    ),
    nuts: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/almonds-in-bowl-1.jpg",
      "crispy-nuts"
    ),
    fermented: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/fermented-foods-e1547259167230-2.jpg",
      "fermented-vegetables"
    ),
    chips: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/sweet-chips-1.jpg",
      "healthy-treats"
    ),
    farmPhoto: await downloadAndUpload(
      "https://amosmillerorganicfarm.com/wp-content/uploads/2023/05/Screenshot_20230527_181009_Gallery-1024x478.jpg",
      "farm-overview"
    ),
  };

  // Step 4: Build content blocks
  console.log("\nStep 4: Building page content...");

  // Helper to build a product section with image + text side by side
  // We'll use richtext blocks with embedded <img> tags for layout control,
  // and alternate image blocks between sections for visual rhythm.

  const blocks = [
    // ── Hero ──
    {
      id: randomUUID(),
      type: "hero",
      data: {
        title: "About Our Farm",
        subtitle:
          "Traditional Amish farm foods \u2013 grown as God intended and shipped directly to your doorstep.",
        imageUrl: images.farmPhoto || "",
        ctaText: "Shop Our Products",
        ctaLink: "/shop",
      },
    },

    // ── Origin Story ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<p>Back in the year of 2000, farmer Amos Miller and his dad attended a conference where Sally Fallon, president of the Weston A. Price Foundation, gave an excellent speech on the importance of eating healthy food \u2013 which was the start of where we are today.</p>

<p>Around here, we are living off our land and our members do the same. All animals are born and raised on the same farm and they live a stress-free life out on pasture. We can trace our foods and we grow everything as nature intended \u2013 brimming with nutrients, in rich soil \u2013 and the quality is the best it can be.</p>

<p><strong>We care a great deal about the \u2018food\u2019 our \u2018food\u2019 is eating and the soil\u2019s quality \u2013 which is ultimately the starting point to grow high quality, nutrient dense food.</strong></p>`,
      },
    },

    // ── Philosophy Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "\u201cWe enjoy good ol\u2019 farming the natural way.\u201d",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
      },
    },

    // ── Cows & Beef ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.cattle || "",
        alt: "Jersey cows grazing on pasture at Amos Miller Farm",
        caption: "Our grass-fed Jersey cows on pasture",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Cows &amp; Beef</h2>

<p>Our cow dairy is raw and from mostly Jersey cows that are fed no grain. They eat strictly grass and hay as well as a free-choice smorgasbord of minerals to maintain a healthy balanced diet.</p>

<p>We are in the process of converting our herds to the better heritage A2/A2 breed which confirms the protein level in the raw milk.</p>

<p>We regularly test all of our raw milk for bacteria, coliform and pathogens, via somatic cell count, the Standard Plate Count (SPC) and other various tests to ensure the safety of our raw milk.</p>`,
      },
    },

    // ── Water Buffalo ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.buffalo || "",
        alt: "Water buffalo grazing on pasture",
        caption: "Our water buffalo herd \u2013 producers of award-winning A2/A2 dairy",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Water Buffalo</h2>

<p>At the moment we have 30 water buffalo. They are strictly grass-fed and they produce award-winning, A2/A2 certified, rich dairy products and raw buffalo cheese.</p>

<p>Water buffalo milk is rich and creamy in flavor and preferred by all of those who are usually sensitive to other types of milks.</p>`,
      },
    },

    // ── Goats & Sheep ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.sheep || "",
        alt: "Sheep and goats on pasture",
        caption: "Our goats and sheep roaming on fertile pastures",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Goats &amp; Sheep</h2>

<p>All of our goat and sheep dairy and cheeses we offer are raw and mostly grass-fed.</p>

<p>Our goats are rotated on our fertile pastures where they get to eat all the grass, vines and shrubs to their heart\u2019s content.</p>`,
      },
    },

    // ── Camels ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.camels || "",
        alt: "Camels alongside cattle on the farm",
        caption: "Our camels \u2013 providing raw camel milk with unique health benefits",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Camels</h2>

<p>Yes, we are milking our own camels and providing raw milk as a valuable natural resource for autism, diabetes, intestinal health and immunity.</p>

<p>Camel milk is naturally comprised of an amazing array of ingredients, including unique proteins and nutrients which make it a perfect milk alternative. Perhaps the most important component of camel milk is the concentrated immune proteins and the unique molecular structure that delivers natural anti-microbials, anti-bacterials, anti-inflammatory agents and anti-fungal properties.</p>

<p>Camel milk contains a gold mine of vitamins and minerals including vitamins A, B, C, D, and E.</p>`,
      },
    },

    // ── Pastured Poultry ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.poultry || "",
        alt: "Free-range chickens foraging on grass",
        caption: "Our free-range poultry on fresh pasture every day",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Pastured Poultry</h2>

<p>Our poultry consist of chicken, turkey, duck and goose. We are happy to say we provide all of our poultry as free-range, GMO-free, soy and corn-free.</p>

<p>We never de-beak our chickens because the chickens need their beaks to eat the grass and insects that give their eggs the rich color, taste and nutrition which you have come to love and expect.</p>

<p>We always move them to new grass every day as it allows our birds to forage a diet of bugs, grubs, flies and a complete salad bar of plants and grasses. This high foraging content of their diet makes their meat extra high in CLA and Omega-3 \u2018good fats.\u2019</p>`,
      },
    },

    // ── Milk-Fed Veal ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.calf || "",
        alt: "Calf nursing from its mother",
        caption: "We never separate the calf from the mother",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Milk-Fed Veal</h2>

<p>All of our occasionally available veal is entirely milk-fed and grass-finished.</p>

<p>We never separate the baby calf from the mother and only sell the excess colostrum \u2013 after the needs of the calf are met.</p>`,
      },
    },

    // ── Whey-Fed Pork ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.pigs || "",
        alt: "Heritage breed piglets on the farm",
        caption: "Our heritage breed pigs \u2013 Tamworth and Old English Blacks",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Whey-Fed Pork</h2>

<p>Our pastured hogs are fed a mostly milk-based ration of whey from cheese making, and organic oats \u2013 soaked in raw skim milk and a bit of our GMO-free, organic heirloom corn. Some folks say our hogs eat a \u2018cleaner\u2019 diet than most Americans!</p>

<p>We grow the heritage breed of pigs which is known to be quite a bit more fatty, such as Tamworth or Old English Blacks. Due to their diet, they produce award-winning tender and flavorful meats.</p>`,
      },
    },

    // ── Wild Seafood ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.salmon || "",
        alt: "Wild-caught Alaskan salmon",
        caption: "Sustainably harvested wild salmon from Bristol Bay, Alaska",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Wild Seafood</h2>

<p>Our salmon comes directly from the fishermen at Wild For Salmon. They harvest the salmon from Bristol Bay, Alaska, the world\u2019s most sustainable Sockeye fishery.</p>

<p>This fishery is certified by the Marine Stewardship Council (MSC) and is Best Choice from the Monterey Bay Aquarium Seafood Watch program. The Sockeye Salmon is slid onto the boat to reduce bruising, immediately submerged in ice-cold sea water to keep it under 40 degrees, and then flash frozen to maintain top quality.</p>`,
      },
    },

    // ── Divider Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "From our bakery and kitchen \u2013 traditional foods made with care",
        backgroundColor: "#f97316",
        textColor: "#ffffff",
      },
    },

    // ── Traditional Bakery ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.bread || "",
        alt: "Fresh baked sourdough bread",
        caption: "Our sourdough and sprouted grain breads \u2013 baked on the farm",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Traditional Bakery</h2>

<p>We bake bread with sourdough and soaked grains and also have sprouted spelt bread available.</p>

<p>The muffins are gluten-free and also baked here at our farm, as well as sprouted grain shoo-fly pie, angel food cake and gluten-free coconut cookies.</p>`,
      },
    },

    // ── Healthy Drinks ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.kombucha || "",
        alt: "Batch of fresh kombucha tea",
        caption: "Kombucha and other healthy fermented beverages",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Healthy Drinks</h2>

<p>Taste our healthy beverages: cabbage juice, kimchee juice, daikon radish juice, apple cider, grape juice, lemonade, ginger ale, kombucha, cranberry kombucha, and beet kvass.</p>`,
      },
    },

    // ── Healthy Fats ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.fats || "",
        alt: "Rendered lard and tallow",
        caption: "Pure, traditional fats \u2013 lard, tallow, and more",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Healthy Fats</h2>

<p>The pure and authentic olive oil comes from a family orchard in Greece and their century-old olive trees.</p>

<p>The cold-pressed, virgin coconut oil comes from the Philippines and our raw, fermented coconut oil comes from Samoa.</p>

<p>We carry the Rosita Brand cod liver oil and the full line of Green Pasture supplements such as coconut ghee, cod liver oil, butter oil and skate liver oil.</p>`,
      },
    },

    // ── Raw Sweeteners ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.honey || "",
        alt: "Raw honey",
        caption: "Local raw honey and Vermont maple syrup",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Raw Sweeteners</h2>

<p>The maple syrup comes from Vermont and it is processed with natural procedures. Raw honey is collected locally and we also carry the brand Really Raw Honey from Maryland.</p>`,
      },
    },

    // ── Crispy Nuts ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.nuts || "",
        alt: "Soaked and dehydrated almonds",
        caption: "Properly prepared nuts \u2013 soaked to remove phytates",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Crispy Nuts</h2>

<p>The nuts are prepared as recommended by the Weston A. Price Foundation for better digestion.</p>

<p>We buy all the organic nuts raw and then soak them 12 hours to remove phytates and enzyme inhibitors.</p>`,
      },
    },

    // ── Fermented Vegetables ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.fermented || "",
        alt: "Assorted fermented vegetables",
        caption: "Lacto-fermented vegetables made with Celtic sea salt",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Fermented Vegetables</h2>

<p>Most of the produce is grown locally here in Lancaster County, PA and always GMO-free and chemical-free, processed here on the Miller\u2019s farm.</p>

<p>We always use only Celtic sea salt, raw whey or apple cider vinegar.</p>`,
      },
    },

    // ── Healthy Treats ──
    {
      id: randomUUID(),
      type: "image",
      data: {
        url: images.chips || "",
        alt: "Sweet potato chips",
        caption: "Homemade chips fried in our own pork lard",
      },
    },
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Healthy Treats</h2>

<p>Try these delicious items such as sweet potato chips and the Amos brand potato chips \u2013 made from our own pork lard and local GMO-free and chemical-free potatoes.</p>`,
      },
    },

    // ── Closing ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Our Promise</h2>

<p>We grow our foods for members who belong to our Private Member Association only. Here is a partial list of ingredients for some of our products we offer, and we take pride to honor the principles and philosophies from Dr. Weston A. Price \u2013 emphasizing on nutrient density and the presence of the most important fat-soluble activators.</p>`,
      },
    },

    // ── CTA Banner ──
    {
      id: randomUUID(),
      type: "banner",
      data: {
        text: "Experience real farm foods \u2013 the way nature intended.",
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
        linkText: "Shop Now",
        linkUrl: "/shop",
      },
    },

    // ── Learn More Links ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h3>Learn More</h3>
<ul>
<li><a href="/our-standards">Our Standards &amp; Principles</a></li>
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
    title: "About Our Farm",
    slug: SLUG,
    content: blocks,
    meta_title: "About Our Farm | Amos Miller Farm",
    meta_description:
      "Learn how Amos Miller Farm raises traditional Amish farm foods \u2013 grass-fed dairy, pastured meats, wild seafood, and more \u2013 grown as God intended.",
    is_published: true,
    show_in_nav: false,
    sort_order: 1,
  });

  if (insertError) {
    console.error(`Failed to insert page: ${insertError.message}`);
    process.exit(1);
  }

  const uploadedCount = Object.values(images).filter(Boolean).length;
  const totalImages = Object.keys(images).length;

  console.log("\n=== Page Created Successfully ===");
  console.log(`  Title: About Our Farm`);
  console.log(`  Slug: ${SLUG}`);
  console.log(`  URL: /our-farm`);
  console.log(`  Images: ${uploadedCount}/${totalImages} uploaded`);
  console.log(`  Content blocks: ${blocks.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
