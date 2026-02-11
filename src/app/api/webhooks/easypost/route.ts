import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, mapEventType } from '@/lib/shipping/easypost';
import { createClient } from '@/lib/supabase/server';

/**
 * EasyPost Webhook Handler
 * Receives tracking updates from EasyPost and processes them
 * 
 * Security: HMAC signature verification
 * Idempotency: Deduplicates events by provider_event_id
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const payload = await request.text();
    const signature = request.headers.get('x-hmac-signature') || '';

    // 1. Verify HMAC signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhookData = JSON.parse(payload);
    const eventId = webhookData.id;
    const supabase = await createClient();

    // 2. Check for duplicate events (idempotent processing)
    const { data: existing } = await (supabase as any)
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (existing) {
      console.log(`Duplicate event ${eventId}, skipping`);
      return NextResponse.json({ message: 'Duplicate event' }, { status: 200 });
    }

    // 3. Log webhook event
    await (supabase as any).from('webhook_events').insert({
      source: 'easypost',
      event_id: eventId,
      event_type: webhookData.description,
      payload: webhookData,
      signature: signature,
      status: 'pending',
    });

    // 4. Process tracking update
    try {
      const tracker = webhookData.result;
      
      if (!tracker || !tracker.tracking_code) {
        throw new Error('No tracker data in webhook');
      }

      // Find order by tracking number
      const { data: order } = await (supabase as any)
        .from('orders')
        .select('id, user_id')
        .eq('tracking_number', tracker.tracking_code)
        .single();

      if (!order) {
        // Not an error - might be a tracking number we're not managing
        console.log(`No order found for tracking ${tracker.tracking_code}`);
        await (supabase as any)
          .from('webhook_events')
          .update({ 
            status: 'processed', 
            processed_at: new Date().toISOString(),
            last_error: 'Order not found'
          })
          .eq('event_id', eventId);
        
        return NextResponse.json({ message: 'No matching order' }, { status: 200 });
      }

      // Get latest tracking detail
      const trackingDetails = tracker.tracking_details || [];
      if (trackingDetails.length === 0) {
        throw new Error('No tracking details in webhook');
      }

      const latestEvent = trackingDetails[0];
      const eventType = mapEventType(latestEvent.status || 'unknown');

      // 5. Create shipment event
      await (supabase as any).from('shipment_events').insert({
        order_id: order.id,
        event_type: eventType,
        carrier: tracker.carrier?.toLowerCase(),
        tracking_code: tracker.tracking_code,
        occurred_at: latestEvent.datetime || new Date().toISOString(),
        description: latestEvent.message || latestEvent.status_detail || 'Status update',
        location_city: latestEvent.tracking_location?.city,
        location_state: latestEvent.tracking_location?.state,
        provider_event_id: eventId,
        raw_data: latestEvent,
      });

      // 6. Update order if delivered
      if (eventType === 'delivered' && latestEvent.datetime) {
        await (supabase as any)
          .from('orders')
          .update({
            delivered_at: latestEvent.datetime,
            status: 'delivered',
          })
          .eq('id', order.id);
      }

      // 7. Trigger notification (import dynamically to avoid circular deps)
      const { dispatchNotification } = await import('@/lib/notifications/dispatcher');
      await dispatchNotification(eventType, order.id);

      // 8. Mark webhook as processed
      await (supabase as any)
        .from('webhook_events')
        .update({ 
          status: 'processed', 
          processed_at: new Date().toISOString() 
        })
        .eq('event_id', eventId);

      return NextResponse.json({ success: true });

    } catch (processingError: any) {
      console.error('Error processing webhook:', processingError);
      
      // Mark webhook as failed
      await (supabase as any)
        .from('webhook_events')
        .update({ 
          status: 'failed', 
          last_error: processingError.message,
          attempts: 1,
        })
        .eq('event_id', eventId);

      // Return 500 so EasyPost retries
      return NextResponse.json(
        { error: processingError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Fatal webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
