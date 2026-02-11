/**
 * Test Order Email with Real Order Data
 *
 * Fetches actual order data from the database and sends a test email
 *
 * Usage:
 *   npx tsx scripts/test-order-email.ts <order-number> [recipient-email]
 *
 * Examples:
 *   npx tsx scripts/test-order-email.ts 12345
 *   npx tsx scripts/test-order-email.ts 12345 brandon@whitespace-consulting.org
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../src/lib/email/resend';
import { orderConfirmationEmail } from '../src/lib/email/templates';

// Load environment variables
dotenv.config({ path: '.env.local' });

const orderNumber = process.argv[2];
const recipientEmailOverride = process.argv[3];

if (!orderNumber) {
  console.error('❌ Please provide an order number');
  console.error('   Usage: npx tsx scripts/test-order-email.ts <order-number> [recipient-email]');
  console.error('\n   Examples:');
  console.error('     npx tsx scripts/test-order-email.ts 12345');
  console.error('     npx tsx scripts/test-order-email.ts 12345 brandon@whitespace-consulting.org');
  process.exit(1);
}

async function testOrderEmail() {
  console.log('🧪 Testing Order Confirmation Email with Real Data...\n');
  console.log(`  Order Number: ${orderNumber}\n`);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch the order with all related data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id(first_name, last_name, email),
        order_items(
          *,
          products(name)
        ),
        fulfillment_locations(
          name,
          address_line1,
          city,
          state
        )
      `)
      .eq('order_number', orderNumber)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError?.message || 'No order with that number');
      process.exit(1);
    }

    console.log('✓ Order found:', order.order_number);
    console.log('  Customer:', order.customer_email || '(no email on record)');
    console.log('  Items:', order.order_items?.length || 0);
    console.log('  Total:', `$${order.total.toFixed(2)}\n`);

    // Check if we have a valid recipient email
    const recipientEmail = recipientEmailOverride || order.customer_email;
    if (!recipientEmail) {
      console.error('❌ No email address available');
      console.error('   This order does not have a customer email on record.');
      console.error('   Please provide an email address:');
      console.error(`   npx tsx scripts/test-order-email.ts ${orderNumber} your-email@example.com`);
      process.exit(1);
    }

    // Transform order data to match email template format
    const orderEmailData = {
      order_number: order.order_number,
      customer_first_name: order.customer_first_name || order.profiles?.first_name,
      customer_last_name: order.customer_last_name || order.profiles?.last_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      status: order.status,
      fulfillment_type: order.fulfillment_type,
      scheduled_date: order.scheduled_date,
      shipping_address: order.shipping_address,
      subtotal: order.subtotal,
      shipping_fee: order.shipping_fee,
      membership_fee: order.membership_fee || 0,
      tax_amount: order.tax_amount,
      discount_amount: order.discount_amount,
      total: order.total,
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      created_at: order.created_at,
      order_items: order.order_items?.map((item: any) => ({
        product_name: item.products?.name || 'Unknown Product',
        quantity: item.quantity,
        unit_price: item.unit_price,
        pricing_type: item.pricing_type,
        actual_weight: item.actual_weight,
        estimated_weight: item.estimated_weight,
      })) || [],
      fulfillment_locations: order.fulfillment_locations,
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { subject, html, text } = orderConfirmationEmail(orderEmailData, baseUrl);

    console.log('📧 Sending styled email...');
    console.log(`  To: ${recipientEmail}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Template: orderConfirmationEmail (STYLED)\n`);

    const result = await sendEmail({
      to: recipientEmail,
      subject: '[TEST] ' + subject,
      html,
      text,
    });

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`\n📧 Check your inbox at: ${recipientEmail}`);
      console.log('\n💡 The email includes:');
      console.log('  ✓ Real order data from your database');
      console.log('  ✓ Actual products ordered');
      console.log('  ✓ Correct quantities and pricing');
      console.log('  ✓ Accurate totals breakdown');
      console.log('  ✓ Modern styled template');
      console.log('  ✓ "View Order Details" button');
    } else {
      console.error('❌ Failed to send email:', result.error);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testOrderEmail();
