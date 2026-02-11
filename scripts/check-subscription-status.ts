/**
 * Check Subscription Status for All Products
 *
 * Shows current subscription settings for all products
 *
 * Usage:
 *   npx tsx scripts/check-subscription-status.ts
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkSubscriptionStatus() {
  console.log('🔍 Checking subscription status for all products...\n');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get all products with subscription fields
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, is_subscribable, subscription_frequencies, max_subscription_quantity')
      .order('name');

    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError.message);
      process.exit(1);
    }

    if (!products || products.length === 0) {
      console.log('No products found.');
      process.exit(0);
    }

    console.log(`Found ${products.length} products:\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   is_subscribable: ${product.is_subscribable}`);
      console.log(`   subscription_frequencies: [${product.subscription_frequencies?.join(', ') || 'none'}]`);
      console.log(`   max_subscription_quantity: ${product.max_subscription_quantity ?? 'unlimited (null)'}`);
      console.log('');
    });

    // Show summary
    const subscribableCount = products.filter(p => p.is_subscribable).length;
    const biweeklyCount = products.filter(p => p.subscription_frequencies?.includes('biweekly')).length;
    const unlimitedCount = products.filter(p => p.max_subscription_quantity === null).length;
    const max10Count = products.filter(p => p.max_subscription_quantity === 10).length;

    console.log('\n📊 Summary:');
    console.log(`  Total products: ${products.length}`);
    console.log(`  Subscribable (is_subscribable = true): ${subscribableCount}`);
    console.log(`  With biweekly option: ${biweeklyCount}`);
    console.log(`  Unlimited max qty (null): ${unlimitedCount}`);
    console.log(`  Max qty = 10: ${max10Count}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkSubscriptionStatus();
