/**
 * EasyPost Webhook Setup Script
 *
 * This script registers a webhook with EasyPost to receive tracker update notifications.
 * Run once during initial setup: npx tsx scripts/setup-easypost-webhooks.ts
 *
 * Prerequisites:
 * - EASYPOST_API_KEY must be set in .env.local
 * - WEBHOOK_BASE_URL must be set to your production domain
 */

import EasyPost from '@easypost/api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const EASYPOST_API_KEY = process.env.EASYPOST_API_KEY;
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL;

if (!EASYPOST_API_KEY) {
  console.error('❌ EASYPOST_API_KEY is not set in .env.local');
  process.exit(1);
}

if (!WEBHOOK_BASE_URL) {
  console.error('❌ WEBHOOK_BASE_URL is not set in .env.local');
  console.error('   Set it to your production domain, e.g., https://amosmillerfarm.com');
  process.exit(1);
}

const client = new EasyPost(EASYPOST_API_KEY);

async function setupWebhooks() {
  console.log('🚀 Setting up EasyPost webhooks...\n');

  const webhookUrl = `${WEBHOOK_BASE_URL}/api/webhooks/easypost`;
  console.log(`Webhook URL: ${webhookUrl}`);

  try {
    // Create webhook for tracker updates
    const webhook = await client.Webhook.create({
      url: webhookUrl,
    }) as any;

    console.log('\n✅ Webhook registered successfully!');
    console.log('\nWebhook Details:');
    console.log(`  ID: ${webhook.id}`);
    console.log(`  URL: ${webhook.url}`);
    console.log(`  Mode: ${webhook.mode || 'production'}`);

    if (webhook.webhook_secret) {
      console.log('\n⚠️  IMPORTANT: Add this secret to your .env.local:');
      console.log(`\nEASYPOST_WEBHOOK_SECRET=${webhook.webhook_secret}`);
      console.log('\nThis secret is used to verify webhook signatures.');
    }

    console.log('\n📝 Next Steps:');
    console.log('  1. Add the EASYPOST_WEBHOOK_SECRET to your .env.local');
    console.log('  2. Restart your Next.js server');
    console.log('  3. Test the webhook with: npx tsx scripts/test-easypost-webhook.ts');

  } catch (error: any) {
    console.error('\n❌ Error setting up webhook:');
    console.error(error.message);

    if (error.message?.includes('already exists')) {
      console.log('\n💡 Webhook already exists. To list existing webhooks:');
      console.log('   1. Log into your EasyPost dashboard');
      console.log('   2. Navigate to Developers > Webhooks');
      console.log('   3. Find your webhook and copy the secret');
    }

    process.exit(1);
  }
}

setupWebhooks();
