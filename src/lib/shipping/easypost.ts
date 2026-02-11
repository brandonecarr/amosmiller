import EasyPost from '@easypost/api';
import crypto from 'crypto';

// Initialize EasyPost client
const client = new EasyPost(process.env.EASYPOST_API_KEY || '');

/**
 * Create a tracker for a tracking number
 * This registers the tracking number with EasyPost to start receiving webhook events
 */
export async function createTracker(carrier: string, trackingCode: string) {
  try {
    const tracker = await client.Tracker.create({
      tracking_code: trackingCode,
      carrier: carrier.toLowerCase(),
    });
    return { tracker, error: null };
  } catch (error: any) {
    console.error('Error creating EasyPost tracker:', error);
    return { tracker: null, error: error.message };
  }
}

/**
 * Verify webhook HMAC signature to ensure request authenticity
 * EasyPost signs webhooks with HMAC SHA256
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!process.env.EASYPOST_WEBHOOK_SECRET) {
    console.error('EASYPOST_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', process.env.EASYPOST_WEBHOOK_SECRET);
    const expected = hmac.update(payload).digest('hex');
    
    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Map EasyPost tracking status to our event types
 * EasyPost uses different status codes than our simplified types
 */
export function mapEventType(easyPostStatus: string): string {
  const mapping: Record<string, string> = {
    'pre_transit': 'in_transit',
    'in_transit': 'in_transit',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'available_for_pickup': 'out_for_delivery',
    'return_to_sender': 'exception',
    'failure': 'exception',
    'cancelled': 'exception',
    'error': 'exception',
    'unknown': 'in_transit',
  };
  
  return mapping[easyPostStatus.toLowerCase()] || 'in_transit';
}

/**
 * Get tracking details for a tracking number
 * Useful for manually checking status without waiting for webhooks
 */
export async function getTrackingDetails(trackingCode: string, carrier?: string) {
  try {
    const tracker = await client.Tracker.retrieve(trackingCode);
    return { tracker, error: null };
  } catch (error: any) {
    console.error('Error retrieving tracker:', error);
    return { tracker: null, error: error.message };
  }
}

/**
 * List all trackers (for debugging/admin purposes)
 */
export async function listTrackers(pageSize: number = 20) {
  try {
    const trackers = await client.Tracker.all({ page_size: pageSize });
    return { trackers: trackers.trackers, error: null };
  } catch (error: any) {
    console.error('Error listing trackers:', error);
    return { trackers: [], error: error.message };
  }
}
