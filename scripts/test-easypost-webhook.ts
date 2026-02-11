/**
 * EasyPost Webhook Test Script
 *
 * Sends a test webhook event to your local server to verify the integration.
 *
 * Usage:
 *   npx tsx scripts/test-easypost-webhook.ts
 *
 * Prerequisites:
 *   - EASYPOST_WEBHOOK_SECRET must be set in .env.local
 *   - Next.js server must be running on http://localhost:3000
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const WEBHOOK_SECRET = process.env.EASYPOST_WEBHOOK_SECRET;
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/easypost';

if (!WEBHOOK_SECRET) {
  console.error('❌ EASYPOST_WEBHOOK_SECRET is not set in .env.local');
  console.error('   Run scripts/setup-easypost-webhooks.ts first to get the secret');
  process.exit(1);
}

// Sample webhook payload (tracker.updated event)
const testPayload = {
  id: `test_evt_${Date.now()}`,
  object: 'Event',
  description: 'tracker.updated',
  mode: 'test',
  created_at: new Date().toISOString(),
  result: {
    id: 'trk_test123',
    object: 'Tracker',
    mode: 'test',
    tracking_code: '1Z999AA10123456784',
    status: 'out_for_delivery',
    carrier: 'UPS',
    est_delivery_date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    shipment_id: null,
    carrier_detail: {
      object: 'CarrierDetail',
      service: 'UPS Ground',
      container_type: null,
      est_delivery_date_local: null,
      est_delivery_time_local: null,
      origin_location: 'Lancaster, PA',
      destination_location: 'Philadelphia, PA',
      guaranteed_delivery_date: null,
      alternate_identifier: null,
    },
    tracking_details: [
      {
        object: 'TrackingDetail',
        message: 'Out for delivery',
        description: 'Out for Delivery',
        status: 'out_for_delivery',
        status_detail: 'out_for_delivery',
        datetime: new Date().toISOString(),
        source: 'UPS',
        carrier_code: null,
        tracking_location: {
          object: 'TrackingLocation',
          city: 'Philadelphia',
          state: 'PA',
          country: 'US',
          zip: '19103',
        },
      },
      {
        object: 'TrackingDetail',
        message: 'Package arrived at facility',
        description: 'Arrived at Facility',
        status: 'in_transit',
        status_detail: 'arrived_at_facility',
        datetime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        source: 'UPS',
        carrier_code: null,
        tracking_location: {
          object: 'TrackingLocation',
          city: 'Philadelphia',
          state: 'PA',
          country: 'US',
          zip: '19103',
        },
      },
    ],
    fees: [],
    public_url: 'https://track.easypost.com/djE6dHJrX3Rlc3QxMjM',
    created_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
    updated_at: new Date().toISOString(),
  },
};

async function sendTestWebhook() {
  console.log('🧪 Testing EasyPost webhook integration...\n');

  const payloadString = JSON.stringify(testPayload);

  // Generate HMAC signature (SHA256)
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET!);
  const signature = hmac.update(payloadString).digest('hex');

  console.log('📤 Sending test webhook to:', WEBHOOK_URL);
  console.log('Event Type:', testPayload.description);
  console.log('Tracking Code:', testPayload.result.tracking_code);
  console.log('Status:', testPayload.result.status);
  console.log('Carrier:', testPayload.result.carrier);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HMAC-Signature': signature,
      },
      body: payloadString,
    });

    const responseText = await response.text();

    if (response.ok) {
      console.log('\n✅ Webhook processed successfully!');
      console.log('Response:', responseText);
      console.log('\n📋 Next Steps:');
      console.log('  1. Check your database for a new webhook_events record');
      console.log('  2. Check for a new shipment_events record (if order with tracking exists)');
      console.log('  3. Check notification_log for email delivery');
    } else {
      console.error('\n❌ Webhook failed!');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
    }
  } catch (error: any) {
    console.error('\n❌ Error sending webhook:');
    console.error(error.message);
    console.error('\n💡 Make sure your Next.js server is running on http://localhost:3000');
  }
}

sendTestWebhook();
