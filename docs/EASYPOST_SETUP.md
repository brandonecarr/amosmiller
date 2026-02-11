# EasyPost Shipping Integration Setup Guide

This guide walks you through setting up automated shipping notifications with EasyPost for the Amos Miller Farm e-commerce platform.

## Overview

The EasyPost integration provides:
- **Automatic tracking sync** for USPS, UPS, FedEx, and 100+ carriers
- **Real-time webhook notifications** when packages are scanned by carriers
- **Automated customer emails** for out-for-delivery, delivered, and exception events
- **Shipment timeline** on order detail pages in admin
- **Customizable email templates** via admin UI

## Prerequisites

1. **EasyPost Account**
   - Sign up at [https://www.easypost.com/](https://www.easypost.com/)
   - Free tier includes 100 tracker validations/month
   - Paid plans start at $0.05 per tracking number

2. **Production Domain**
   - You'll need a publicly accessible domain for webhooks
   - Local development testing uses ngrok or similar tunneling service

## Step 1: Get Your EasyPost API Key

1. Log into your EasyPost dashboard
2. Navigate to **Developers** → **API Keys**
3. Copy your **Production API Key** (starts with `EZAKPROD...`)
4. Add to `.env.local`:

```env
EASYPOST_API_KEY=your_production_key_here
```

## Step 2: Configure Webhook Base URL

Add your production domain to `.env.local`:

```env
WEBHOOK_BASE_URL=https://yourdomain.com
```

**For local development:**
- Use [ngrok](https://ngrok.com/) to tunnel your localhost
- Run: `ngrok http 3000`
- Copy the https URL (e.g., `https://abc123.ngrok.io`)
- Set `WEBHOOK_BASE_URL=https://abc123.ngrok.io`

## Step 3: Register Webhook with EasyPost

Run the setup script:

```bash
npx tsx scripts/setup-easypost-webhooks.ts
```

This will:
1. Create a webhook endpoint at `${WEBHOOK_BASE_URL}/api/webhooks/easypost`
2. Generate a webhook secret for signature verification
3. Print the secret for you to add to `.env.local`

**Copy the webhook secret** and add it to `.env.local`:

```env
EASYPOST_WEBHOOK_SECRET=your_webhook_secret_here
```

## Step 4: Apply Database Migration

The shipping notifications system requires database tables:

```bash
# Push migration to Supabase
npx supabase db push

# Or apply manually via Supabase dashboard
# Run: supabase/migrations/00014_shipping_notifications.sql
```

This creates:
- `shipment_events` - Tracking event history
- `webhook_events` - Webhook processing log
- `notification_log` - Email delivery audit
- `notification_settings` - Admin toggle controls

## Step 5: Restart Your Server

```bash
# Restart Next.js to load new environment variables
npm run dev
```

## Step 6: Test the Integration

Run the test script to simulate a webhook:

```bash
npx tsx scripts/test-easypost-webhook.ts
```

This sends a fake "out for delivery" event to your local server.

**Expected output:**
```
✅ Webhook processed successfully!
Response: {"success":true}
```

**Check your database:**
- `webhook_events` should have a new test event
- If an order with that tracking number exists, `shipment_events` will have a new record
- If notifications are enabled, `notification_log` will show an email was sent

## Step 7: Admin Configuration

### Enable/Disable Notifications

1. Log into admin: `/admin/settings/notifications`
2. Toggle notifications on/off for each event type:
   - **In Transit** (disabled by default - too frequent)
   - **Out for Delivery** (enabled)
   - **Delivered** (enabled)
   - **Delivery Exception** (enabled)
   - **Failed Delivery Attempt** (enabled)

### Customize Email Templates

1. Navigate to `/admin/settings/email-templates`
2. Click **New Template**
3. Set template name to match event type (e.g., `out_for_delivery`)
4. Write custom HTML email with variables:
   - `{{customer_name}}` - Customer's full name
   - `{{order_number}}` - Order number
   - `{{tracking_number}}` - Carrier tracking number
   - `{{tracking_url}}` - Link to carrier tracking page
   - `{{carrier}}` - Carrier name (USPS, UPS, FedEx)
5. Click **Send Test Email** to verify

## How It Works

### 1. Admin Adds Tracking Number

When admin enters a tracking number on an order:
- System calls EasyPost API to create a tracker
- EasyPost begins monitoring the tracking number
- Tracker ID is stored in `orders.easypost_tracker_id`

### 2. Carrier Scans Package

When USPS/UPS/FedEx scans the package:
- Carrier updates their tracking API
- EasyPost detects the update within minutes
- EasyPost sends webhook POST to your server

### 3. Webhook Processing

Your server receives the webhook at `/api/webhooks/easypost`:
1. Verifies HMAC signature (prevents spoofing)
2. Checks for duplicate events (idempotent)
3. Logs to `webhook_events` table
4. Creates `shipment_events` record
5. Updates order status if delivered
6. Triggers notification dispatcher

### 4. Notification Dispatcher

Checks `notification_settings`:
- If event type is enabled → continue
- Loads email template (database or code fallback)
- Renders template with order variables
- Sends email via Resend
- Logs to `notification_log`

### 5. Customer Receives Email

Customer gets a branded email notification with:
- Order number
- Tracking number
- Link to carrier tracking page
- Estimated delivery date (if available)

## Viewing Shipment History

Admins can view full tracking history on order detail pages:

1. Navigate to `/admin/orders/[id]`
2. Scroll to **Shipment Tracking History** section
3. See timeline with:
   - Event icons (package, truck, checkmark, alert)
   - Event descriptions
   - Timestamps
   - Locations
   - Carrier

## Troubleshooting

### Webhooks Not Arriving

**Check webhook registration:**
1. Log into EasyPost dashboard
2. Navigate to Developers → Webhooks
3. Verify your webhook URL is correct
4. Check webhook secret matches `.env.local`

**Check ngrok tunnel (local development):**
- Ensure ngrok is still running
- Ngrok URLs expire - may need to re-register webhook

### Signature Verification Failing

**Symptom:** 401 Unauthorized responses

**Fix:**
- Ensure `EASYPOST_WEBHOOK_SECRET` in `.env.local` matches EasyPost dashboard
- Restart Next.js server after updating env vars

### Emails Not Sending

**Check notification settings:**
1. Navigate to `/admin/settings/notifications`
2. Ensure event type is toggled ON

**Check Resend API key:**
- Verify `RESEND_API_KEY` is set in `.env.local`
- Check Resend dashboard for delivery errors

**Check notification log:**
```sql
SELECT * FROM notification_log
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

### Duplicate Notifications

**The system prevents duplicates using:**
- `webhook_events.event_id` unique constraint
- EasyPost sends each event once
- If duplicate webhooks arrive, second is ignored with 200 OK

## Cost Estimation

**EasyPost Pricing (Pay As You Go):**
- Tracker validation: **$0.05 per tracking number**
- Webhook delivery: **Free**
- Example: 100 orders/month with shipping = $5/month

**No monthly minimums.** Free tier includes 100 validations.

## Security

### Webhook Signature Verification

All webhooks are verified using HMAC SHA256:

```typescript
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
const expected = hmac.update(payload).digest('hex');
const valid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expected)
);
```

Invalid signatures are rejected with **401 Unauthorized**.

### Row-Level Security

All database tables use RLS policies:
- Customers can only see their own shipment events
- Admins can see all events
- Anonymous users have no access

## Support

**EasyPost Documentation:**
- API Reference: https://www.easypost.com/docs/api
- Tracker Guide: https://www.easypost.com/docs/api#trackers
- Webhooks: https://www.easypost.com/docs/api#webhooks

**Amos Miller Farm Platform:**
- Report issues via admin settings feedback
- Contact development team for custom requirements

---

## Quick Reference: Environment Variables

```env
# Required
EASYPOST_API_KEY=your_production_key_here
EASYPOST_WEBHOOK_SECRET=your_webhook_secret_here
WEBHOOK_BASE_URL=https://yourdomain.com

# Already configured (from existing setup)
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Quick Reference: Scripts

```bash
# Register webhook
npx tsx scripts/setup-easypost-webhooks.ts

# Test webhook locally
npx tsx scripts/test-easypost-webhook.ts

# Apply database migration
npx supabase db push
```

## Quick Reference: Admin URLs

- Notification settings: `/admin/settings/notifications`
- Email templates: `/admin/settings/email-templates`
- Shipment timeline: `/admin/orders/[id]` (scroll to timeline section)
