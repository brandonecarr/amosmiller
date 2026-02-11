/**
 * Test Order Email with Real Templates
 *
 * Tests the styled order confirmation email template
 *
 * Usage:
 *   npx tsx scripts/test-order-email.ts your-email@example.com
 */

import dotenv from 'dotenv';
import { sendEmail } from '../src/lib/email/resend';
import { orderConfirmationEmail } from '../src/lib/email/templates';

// Load environment variables
dotenv.config({ path: '.env.local' });

const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('❌ Please provide a recipient email address');
  console.error('   Usage: npx tsx scripts/test-order-email.ts your-email@example.com');
  process.exit(1);
}

async function testOrderEmail() {
  console.log('🧪 Testing Styled Order Confirmation Email...\n');
  console.log(`  Recipient: ${recipientEmail}\n`);

  // Mock order data
  const mockOrder = {
    order_number: 12345,
    customer_first_name: 'John',
    customer_last_name: 'Doe',
    customer_email: recipientEmail,
    customer_phone: '717-555-0123',
    status: 'pending',
    fulfillment_type: 'shipping' as const,
    scheduled_date: '2025-02-15',
    shipping_address: {
      line1: '123 Farm Road',
      line2: 'Apt 4B',
      city: 'Lancaster',
      state: 'PA',
      postalCode: '17601',
    },
    subtotal: 89.50,
    shipping_fee: 12.00,
    membership_fee: 35.00,
    tax_amount: 7.16,
    discount_amount: 10.00,
    total: 133.66,
    created_at: new Date().toISOString(),
    order_items: [
      {
        product_name: 'Raw A2 Milk (1 Gallon)',
        quantity: 2,
        unit_price: 15.00,
        pricing_type: 'fixed' as const,
      },
      {
        product_name: 'Grass-Fed Ground Beef',
        quantity: 1,
        unit_price: 12.50,
        pricing_type: 'weight' as const,
        estimated_weight: 2.5,
      },
      {
        product_name: 'Farm Fresh Eggs (Dozen)',
        quantity: 3,
        unit_price: 8.00,
        pricing_type: 'fixed' as const,
      },
    ],
  };

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { subject, html, text } = orderConfirmationEmail(mockOrder, baseUrl);

    console.log('📧 Sending styled email...');
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
      console.log('  ✓ Full CSS styling with farm colors');
      console.log('  ✓ Formatted order details');
      console.log('  ✓ Itemized products with pricing');
      console.log('  ✓ Totals breakdown');
      console.log('  ✓ Header and footer branding');
      console.log('  ✓ "View Order Details" button');
    } else {
      console.error('❌ Failed to send email:', result.error);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testOrderEmail();
