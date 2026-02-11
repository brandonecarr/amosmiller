/**
 * Update Order Customer Email
 *
 * Updates the customer email for an order
 *
 * Usage:
 *   npx tsx scripts/update-order-email.ts <order-number> <email>
 *
 * Example:
 *   npx tsx scripts/update-order-email.ts 1 brandon@whitespace-consulting.org
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const orderNumber = process.argv[2];
const email = process.argv[3];

if (!orderNumber || !email) {
  console.error('❌ Please provide both order number and email');
  console.error('   Usage: npx tsx scripts/update-order-email.ts <order-number> <email>');
  console.error('\n   Example:');
  console.error('     npx tsx scripts/update-order-email.ts 1 brandon@whitespace-consulting.org');
  process.exit(1);
}

// Basic email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

async function updateOrderEmail() {
  console.log('📧 Updating order email...\n');
  console.log(`  Order Number: ${orderNumber}`);
  console.log(`  New Email: ${email}\n`);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // First check if order exists
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, customer_email')
      .eq('order_number', orderNumber)
      .single();

    if (fetchError || !existingOrder) {
      console.error('❌ Order not found:', fetchError?.message || 'No order with that number');
      process.exit(1);
    }

    console.log('✓ Order found');
    console.log(`  Current email: ${existingOrder.customer_email || '(none)'}`);

    // Update the email
    const { error: updateError } = await supabase
      .from('orders')
      .update({ customer_email: email })
      .eq('order_number', orderNumber);

    if (updateError) {
      console.error('❌ Failed to update:', updateError.message);
      process.exit(1);
    }

    console.log('\n✅ Order email updated successfully!');
    console.log(`\nYou can now send test emails to this order:`);
    console.log(`  npx tsx scripts/test-order-email.ts ${orderNumber}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateOrderEmail();
