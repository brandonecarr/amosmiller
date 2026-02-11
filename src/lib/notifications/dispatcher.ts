import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { getEmailTemplate, renderTemplate } from '@/lib/email/template-engine';

/**
 * Dispatch notification email for a tracking event
 * This is the central notification orchestrator
 * 
 * Flow:
 * 1. Check if notification is enabled for this event type
 * 2. Get order and customer details
 * 3. Load appropriate email template
 * 4. Render template with variables
 * 5. Send email via Resend
 * 6. Log notification attempt
 */
export async function dispatchNotification(eventType: string, orderId: string): Promise<void> {
  const supabase = await createClient();

  try {
    // 1. Check if notification is enabled
    const { data: settings } = await (supabase as any)
      .from('notification_settings')
      .select('*')
      .eq('event_type', eventType)
      .single();

    if (!settings || !settings.is_enabled) {
      console.log(`Notifications disabled for ${eventType}`);
      return;
    }

    // Optional delay (for batching or rate limiting)
    if (settings.delay_minutes > 0) {
      const delayMs = settings.delay_minutes * 60 * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // 2. Get order with customer details
    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name,
          phone
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const customerEmail = order.customer_email || order.profiles?.email;
    if (!customerEmail) {
      throw new Error('No customer email found');
    }

    // 3. Get email template
    const template = await getEmailTemplate(eventType);

    // 4. Prepare template variables
    const variables = {
      customer_name: order.profiles?.full_name || order.customer_email?.split('@')[0] || 'Customer',
      order_number: order.order_number,
      tracking_number: order.tracking_number || 'Not available',
      tracking_url: order.tracking_url || '#',
      carrier: (order.carrier || 'carrier').toUpperCase(),
      order_total: order.total ? `$${order.total.toFixed(2)}` : '$0.00',
    };

    // 5. Render template
    const subject = renderTemplate(template.subject, variables);
    const html = renderTemplate(template.body, variables);

    // 6. Send email
    const emailResult = await sendEmail({
      to: customerEmail,
      subject: subject,
      html: html,
    });

    // 7. Log notification
    await (supabase as any).from('notification_log').insert({
      order_id: orderId,
      recipient_email: customerEmail,
      notification_type: eventType,
      status: emailResult.success ? 'sent' : 'failed',
      provider_message_id: emailResult.success ? (emailResult.data as any)?.id : null,
      error_message: emailResult.success ? null : emailResult.error,
      sent_at: emailResult.success ? new Date().toISOString() : null,
    });

    if (!emailResult.success) {
      console.error(`Failed to send ${eventType} notification:`, emailResult.error);
    } else {
      console.log(`Sent ${eventType} notification to ${customerEmail} for order #${order.order_number}`);
    }

  } catch (error: any) {
    console.error(`Error dispatching ${eventType} notification for order ${orderId}:`, error);
    
    // Log failed attempt
    try {
      await (supabase as any).from('notification_log').insert({
        order_id: orderId,
        recipient_email: 'unknown',
        notification_type: eventType,
        status: 'failed',
        error_message: error.message,
      });
    } catch (logError) {
      console.error('Failed to log notification error:', logError);
    }
  }
}

/**
 * Send test notification
 * Useful for admin testing email templates
 */
export async function sendTestNotification(
  eventType: string,
  testEmail: string,
  testData?: Record<string, any>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const template = await getEmailTemplate(eventType);
    
    const variables = testData || {
      customer_name: 'Test Customer',
      order_number: '12345',
      tracking_number: '1Z999AA10123456784',
      tracking_url: 'https://example.com/tracking',
      carrier: 'UPS',
      order_total: '$123.45',
    };

    const subject = renderTemplate(template.subject, variables);
    const html = renderTemplate(template.body, variables);

    const result = await sendEmail({
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html: html,
    });

    if (result.success) {
      return { success: true, error: null };
    } else {
      return { success: false, error: result.error || 'Unknown error' };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
