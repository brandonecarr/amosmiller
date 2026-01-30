/**
 * Seed script: Creates co-op pickup locations in Supabase.
 *
 * Usage: npx tsx scripts/seed-coop-locations.ts
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

const COOP_LOCATIONS = [
  { name: "AL - Auburn",                     slug: "al-auburn",                     city: "Auburn",             state: "Alabama" },
  { name: "AL - Birmingham",                 slug: "al-birmingham",                 city: "Birmingham",         state: "Alabama" },
  { name: "AZ - Phoenix",                    slug: "az-phoenix",                    city: "Phoenix",            state: "Arizona" },
  { name: "CA - Pasadena/Claremont",         slug: "ca-pasadena-claremont",         city: "Pasadena/Claremont", state: "California" },
  { name: "CA - San Jose",                   slug: "ca-san-jose",                   city: "San Jose",           state: "California" },
  { name: "CA - Murrieta",                   slug: "ca-murrieta",                   city: "Murrieta",           state: "California" },
  { name: "CO - Lakewood",                   slug: "co-lakewood",                   city: "Lakewood",           state: "Colorado" },
  { name: "FL - Orlando",                    slug: "fl-orlando",                    city: "Orlando",            state: "Florida" },
  { name: "FL - Titusville",                 slug: "fl-titusville",                 city: "Titusville",         state: "Florida" },
  { name: "FL - Tampa",                      slug: "fl-tampa",                      city: "Tampa",              state: "Florida" },
  { name: "FL - Winter Haven Polk County",   slug: "fl-winter-haven-polk-county",   city: "Winter Haven",       state: "Florida" },
  { name: "MA - Chelsea",                    slug: "ma-chelsea",                    city: "Chelsea",            state: "Massachusetts" },
  { name: "MA - Carlisle",                   slug: "ma-carlisle",                   city: "Carlisle",           state: "Massachusetts" },
  { name: "NJ - Williamstown",              slug: "nj-williamstown",               city: "Williamstown",       state: "New Jersey" },
  { name: "NV - Las Vegas",                  slug: "nv-las-vegas",                  city: "Las Vegas",          state: "Nevada" },
  { name: "TX - Austin",                     slug: "tx-austin",                     city: "Austin",             state: "Texas" },
];

async function main() {
  console.log("Creating co-op pickup locations...\n");

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < COOP_LOCATIONS.length; i++) {
    const loc = COOP_LOCATIONS[i];

    // Check if already exists
    const { data: existing } = await supabase
      .from("fulfillment_locations")
      .select("id")
      .eq("slug", loc.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  [=] ${loc.name} (already exists, skipping)`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("fulfillment_locations").insert({
      name: loc.name,
      slug: loc.slug,
      type: "pickup",
      is_coop: true,
      is_active: true,
      city: loc.city,
      state: loc.state,
      sort_order: i + 1,
    });

    if (error) {
      console.error(`  [x] ${loc.name} — ${error.message}`);
    } else {
      console.log(`  [+] ${loc.name}`);
      created++;
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
}

main().catch(console.error);
