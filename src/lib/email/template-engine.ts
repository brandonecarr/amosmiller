import Handlebars from 'handlebars';
import { createClient } from '@/lib/supabase/server';

/**
 * Render a template with variables using Handlebars
 */
export function renderTemplate(templateBody: string, variables: Record<string, any>): string {
  const template = Handlebars.compile(templateBody);
  return template(variables);
}

/**
 * Get email template from database or fall back to code templates
 * This hybrid approach allows admin customization while maintaining defaults
 */
export async function getEmailTemplate(eventType: string): Promise<{
  subject: string;
  body: string;
  source: 'database' | 'code';
}> {
  const supabase = await createClient();

  // Try database first (admin-customized templates)
  const { data } = await (supabase as any)
    .from('email_templates')
    .select('*')
    .eq('name', eventType)
    .eq('is_active', true)
    .single();

  if (data) {
    return {
      subject: data.subject,
      body: data.body,
      source: 'database',
    };
  }

  // Fall back to code templates
  return getCodeTemplate(eventType);
}

/**
 * Code-based email templates (defaults)
 * These are used when no database template exists
 */
function getCodeTemplate(eventType: string): {
  subject: string;
  body: string;
  source: 'code';
} {
  const templates: Record<string, { subject: string; body: string }> = {
    'out_for_delivery': {
      subject: 'Your order is out for delivery!',
      body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f97316; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px 20px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Out for Delivery</h1>
    </div>
    <div class="content">
      <p>Hi {{customer_name}},</p>
      <p>Good news! Your order <strong>#{{order_number}}</strong> is out for delivery today.</p>
      <p><strong>Carrier:</strong> {{carrier}}<br>
      <strong>Tracking Number:</strong> {{tracking_number}}</p>
      <a href="{{tracking_url}}" class="button">Track Your Package</a>
      <p>You should receive your order later today. Please ensure someone is available to receive the delivery.</p>
    </div>
    <div class="footer">
      <p>Amos Miller Farm<br>648 Mill Creek School Rd, Bird in Hand, PA 17505</p>
    </div>
  </div>
</body>
</html>
      `,
    },
    
    'delivered': {
      subject: 'Your order has been delivered!',
      body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px 20px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✓ Delivered</h1>
    </div>
    <div class="content">
      <p>Hi {{customer_name}},</p>
      <p>Your order <strong>#{{order_number}}</strong> has been delivered!</p>
      <p><strong>Tracking Number:</strong> {{tracking_number}}</p>
      <p>We hope you enjoy your farm-fresh products. If you have any questions or concerns about your order, please don't hesitate to reach out.</p>
      <a href="https://amosmiller.com/account/orders" class="button">View Order Details</a>
    </div>
    <div class="footer">
      <p>Thank you for supporting Amos Miller Farm!</p>
    </div>
  </div>
</body>
</html>
      `,
    },
    
    'exception': {
      subject: 'Delivery update for your order',
      body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px 20px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Delivery Update</h1>
    </div>
    <div class="content">
      <p>Hi {{customer_name}},</p>
      <p>We wanted to let you know about an update regarding your order <strong>#{{order_number}}</strong>.</p>
      <p>The carrier has reported an exception during delivery. This could mean a delay or a delivery attempt issue.</p>
      <p><strong>Carrier:</strong> {{carrier}}<br>
      <strong>Tracking Number:</strong> {{tracking_number}}</p>
      <a href="{{tracking_url}}" class="button">Check Tracking Status</a>
      <p>If you have any questions, please contact us and we'll help resolve this as quickly as possible.</p>
    </div>
    <div class="footer">
      <p>Amos Miller Farm<br>Email: support@amosmiller.com</p>
    </div>
  </div>
</body>
</html>
      `,
    },
    
    'failed_attempt': {
      subject: 'Delivery attempt for your order',
      body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px 20px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Delivery Attempted</h1>
    </div>
    <div class="content">
      <p>Hi {{customer_name}},</p>
      <p>The carrier attempted to deliver your order <strong>#{{order_number}}</strong> but was unable to complete the delivery.</p>
      <p><strong>Carrier:</strong> {{carrier}}<br>
      <strong>Tracking Number:</strong> {{tracking_number}}</p>
      <p>The carrier will typically make another attempt. You can also arrange to pick up the package or reschedule delivery.</p>
      <a href="{{tracking_url}}" class="button">Manage Delivery</a>
    </div>
    <div class="footer">
      <p>Amos Miller Farm</p>
    </div>
  </div>
</body>
</html>
      `,
    },
  };

  const template = templates[eventType];
  
  if (!template) {
    // Generic fallback
    return {
      subject: 'Order Update',
      body: `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; padding: 20px;">
  <p>Hi {{customer_name}},</p>
  <p>There's an update for your order #{{order_number}}.</p>
  <p>Tracking: {{tracking_number}}</p>
</body>
</html>
      `,
      source: 'code',
    };
  }

  return {
    subject: template.subject,
    body: template.body,
    source: 'code',
  };
}
