/**
 * Enable Subscriptions for All Products
 *
 * Sets all products to allow biweekly subscriptions with unlimited quantity
 *
 * Usage:
 *   npx tsx scripts/enable-subscriptions.ts
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function enableSubscriptions() {
  console.log('🔄 Enabling subscriptions for all products...\n');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // First, get all products to show what we're updating
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, subscription_frequencies, max_subscription_quantity')
      .order('name');

    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError.message);
      process.exit(1);
    }

    if (!products || products.length === 0) {
      console.log('No products found.');
      process.exit(0);
    }

    console.log(`Found ${products.length} products to update:\n`);

    // Update all products
    const { error: updateError } = await supabase
      .from('products')
      .update({
        subscription_frequencies: ['biweekly'],
        max_subscription_quantity: null,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all (dummy condition)

    if (updateError) {
      console.error('❌ Error updating products:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Successfully updated all products!\n');
    console.log('Changes made:');
    console.log('  ✓ Subscription Frequency: Every 2 Weeks (biweekly)');
    console.log('  ✓ Max Subscription Quantity: Unlimited (null)');
    console.log(`\n📦 Updated ${products.length} products:\n`);

    // Show summary
    products.forEach((product, index) => {
      const oldFreqs = product.subscription_frequencies?.join(', ') || 'none';
      const oldMax = product.max_subscription_quantity ?? 'unlimited';
      console.log(`  ${index + 1}. ${product.name}`);
      console.log(`     Before: frequencies=[${oldFreqs}], max_qty=${oldMax}`);
      console.log(`     After:  frequencies=[biweekly], max_qty=unlimited`);
    });

    console.log('\n✨ All done! Products are now available for biweekly subscriptions with no quantity limit.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

enableSubscriptions();
