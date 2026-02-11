import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

// Define US shipping regions
const shippingZones = [
  {
    name: 'West Coast',
    slug: 'west-coast',
    description: 'California, Oregon, Washington, Alaska, Hawaii',
    states: ['CA', 'OR', 'WA', 'AK', 'HI'],
    base_rate: 0,
    per_lb_rate: 0,
    carrier: 'ups',
    is_active: true,
    sort_order: 1
  },
  {
    name: 'Mountain West',
    slug: 'mountain-west',
    description: 'Montana, Idaho, Wyoming, Nevada, Utah, Colorado, Arizona, New Mexico',
    states: ['MT', 'ID', 'WY', 'NV', 'UT', 'CO', 'AZ', 'NM'],
    base_rate: 0,
    per_lb_rate: 0,
    carrier: 'ups',
    is_active: true,
    sort_order: 2
  },
  {
    name: 'Midwest',
    slug: 'midwest',
    description: 'North Dakota, South Dakota, Nebraska, Kansas, Minnesota, Iowa, Missouri, Wisconsin, Illinois, Michigan, Indiana, Ohio',
    states: ['ND', 'SD', 'NE', 'KS', 'MN', 'IA', 'MO', 'WI', 'IL', 'MI', 'IN', 'OH'],
    base_rate: 0,
    per_lb_rate: 0,
    carrier: 'ups',
    is_active: true,
    sort_order: 3
  },
  {
    name: 'South',
    slug: 'south',
    description: 'Oklahoma, Texas, Arkansas, Louisiana, Mississippi, Alabama, Tennessee, Kentucky, West Virginia, Virginia, North Carolina, South Carolina, Georgia, Florida',
    states: ['OK', 'TX', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY', 'WV', 'VA', 'NC', 'SC', 'GA', 'FL'],
    base_rate: 0,
    per_lb_rate: 0,
    carrier: 'ups',
    is_active: true,
    sort_order: 4
  },
  {
    name: 'Northeast',
    slug: 'northeast',
    description: 'Pennsylvania, New York, New Jersey, Connecticut, Rhode Island, Massachusetts, Vermont, New Hampshire, Maine, Delaware, Maryland, District of Columbia',
    states: ['PA', 'NY', 'NJ', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME', 'DE', 'MD', 'DC'],
    base_rate: 0,
    per_lb_rate: 0,
    carrier: 'ups',
    is_active: true,
    sort_order: 5
  }
];

async function createShippingZones() {
  console.log('Creating US shipping zones...\n');

  for (const zone of shippingZones) {
    // Check if zone already exists
    const { data: existing } = await supabase
      .from('shipping_zones')
      .select('id, name')
      .eq('slug', zone.slug)
      .single();

    if (existing) {
      console.log(`⚠️  Zone "${zone.name}" already exists (${existing.id}), skipping...`);
      continue;
    }

    // Insert new shipping zone
    const { data, error } = await supabase
      .from('shipping_zones')
      .insert(zone)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating "${zone.name}":`, error.message);
    } else {
      console.log(`✓ Created "${zone.name}" with ${zone.states.length} states (ID: ${data.id})`);
      console.log(`  States: ${zone.states.join(', ')}`);
      console.log(`  Rate: $${zone.base_rate} base + $${zone.per_lb_rate}/lb\n`);
    }
  }

  console.log('Done!');
}

createShippingZones().catch(console.error);
