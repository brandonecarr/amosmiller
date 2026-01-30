import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  pricing_type: string;
  actual_weight?: number | null;
  estimated_weight?: number | null;
}

interface Order {
  order_number: number;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  customer_email: string;
  status: string;
  fulfillment_type: string;
  scheduled_date?: string | null;
  shipping_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  subtotal: number;
  shipping_fee: number;
  membership_fee?: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  tracking_number?: string | null;
  tracking_url?: string | null;
  order_items?: OrderItem[];
  fulfillment_locations?: {
    name: string;
    address_line1?: string;
    city?: string;
    state?: string;
  } | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f0e6; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .header { background-color: #2D5A3D; padding: 24px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
  .content { padding: 32px 24px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 14px; font-weight: 600; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .order-number { font-size: 28px; font-weight: bold; color: #1a1a1a; }
  .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; }
  .status-processing { background-color: #dbeafe; color: #1e40af; }
  .status-packed { background-color: #e9d5ff; color: #7e22ce; }
  .status-shipped { background-color: #c7d2fe; color: #4338ca; }
  .status-delivered { background-color: #dcfce7; color: #166534; }
  .item-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
  .item-name { color: #1a1a1a; }
  .item-details { color: #666666; font-size: 14px; }
  .totals { margin-top: 16px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
  .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 12px; }
  .button { display: inline-block; background-color: #2D5A3D; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
  .footer { background-color: #f5f0e6; padding: 24px; text-align: center; font-size: 14px; color: #666666; }
  .tracking-box { background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; }
  .tracking-number { font-family: monospace; font-size: 18px; font-weight: bold; color: #1a1a1a; }
`;

function getCustomerName(order: Order): string {
  if (order.customer_first_name && order.customer_last_name) {
    return `${order.customer_first_name} ${order.customer_last_name}`;
  }
  return order.customer_email.split("@")[0];
}

function getFirstName(order: Order): string {
  return order.customer_first_name || order.customer_email.split("@")[0];
}

function getFulfillmentLabel(type: string): string {
  const labels: Record<string, string> = {
    pickup: "Pickup",
    delivery: "Delivery",
    shipping: "Shipping",
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    packed: "Packed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}

function renderOrderItems(items: OrderItem[]): string {
  return items
    .map((item) => {
      const weight = item.actual_weight || item.estimated_weight;
      const price =
        item.pricing_type === "weight"
          ? item.unit_price * (weight || 1) * item.quantity
          : item.unit_price * item.quantity;

      return `
        <div class="item-row">
          <div>
            <div class="item-name">${item.product_name}</div>
            <div class="item-details">
              Qty: ${item.quantity}
              ${item.pricing_type === "weight" && weight ? ` × ${weight} lbs` : ""}
            </div>
          </div>
          <div style="text-align: right; font-weight: 500;">
            ${formatCurrency(price)}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTotals(order: Order): string {
  let html = `
    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatCurrency(order.subtotal)}</span>
      </div>
  `;

  if (order.shipping_fee > 0) {
    html += `
      <div class="total-row">
        <span>${order.fulfillment_type === "shipping" ? "Shipping" : "Delivery Fee"}</span>
        <span>${formatCurrency(order.shipping_fee)}</span>
      </div>
    `;
  }

  if (order.membership_fee && order.membership_fee > 0) {
    html += `
      <div class="total-row">
        <span>Membership Fee (one-time)</span>
        <span>${formatCurrency(order.membership_fee)}</span>
      </div>
    `;
  }

  if (order.tax_amount > 0) {
    html += `
      <div class="total-row">
        <span>Tax</span>
        <span>${formatCurrency(order.tax_amount)}</span>
      </div>
    `;
  }

  if (order.discount_amount > 0) {
    html += `
      <div class="total-row" style="color: #166534;">
        <span>Discount</span>
        <span>-${formatCurrency(order.discount_amount)}</span>
      </div>
    `;
  }

  html += `
      <div class="total-row total-final">
        <span>Total</span>
        <span>${formatCurrency(order.total)}</span>
      </div>
    </div>
  `;

  return html;
}

export function orderConfirmationEmail(order: Order, baseUrl: string): { subject: string; html: string; text: string } {
  const subject = `Order Confirmed - #${order.order_number}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You for Your Order!</h1>
        </div>
        <div class="content">
          <p>Hi ${getFirstName(order)},</p>
          <p>We've received your order and it's being processed. Here's a summary:</p>

          <div class="section">
            <div class="section-title">Order Number</div>
            <div class="order-number">#${order.order_number}</div>
          </div>

          ${order.scheduled_date ? `
          <div class="section">
            <div class="section-title">${getFulfillmentLabel(order.fulfillment_type)} Date</div>
            <div style="font-size: 16px; color: #1a1a1a;">
              ${format(parseLocalDate(order.scheduled_date), "EEEE, MMMM d, yyyy")}
            </div>
            ${order.fulfillment_type === "pickup" && order.fulfillment_locations ? `
              <div style="color: #666666; margin-top: 4px;">
                ${order.fulfillment_locations.name}
              </div>
            ` : ""}
          </div>
          ` : ""}

          ${order.shipping_address && order.fulfillment_type !== "pickup" ? `
          <div class="section">
            <div class="section-title">${order.fulfillment_type === "shipping" ? "Shipping" : "Delivery"} Address</div>
            <div style="color: #1a1a1a;">
              ${order.shipping_address.line1}<br>
              ${order.shipping_address.line2 ? order.shipping_address.line2 + "<br>" : ""}
              ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postalCode}
            </div>
          </div>
          ` : ""}

          <div class="section">
            <div class="section-title">Order Items</div>
            ${renderOrderItems(order.order_items || [])}
            ${renderTotals(order)}
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${baseUrl}/account/orders/${order.order_number}" class="button">
              View Order Details
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for supporting our farm!</p>
          <p>Amos Miller Farm<br>amosmillerfarm.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Order Confirmed - #${order.order_number}

Hi ${getFirstName(order)},

We've received your order and it's being processed.

Order Number: #${order.order_number}
${order.scheduled_date ? `${getFulfillmentLabel(order.fulfillment_type)} Date: ${format(parseLocalDate(order.scheduled_date), "EEEE, MMMM d, yyyy")}` : ""}

Items:
${order.order_items?.map((item) => `- ${item.product_name} x${item.quantity}`).join("\n") || ""}

Total: ${formatCurrency(order.total)}

View your order: ${baseUrl}/account/orders/${order.order_number}

Thank you for supporting our farm!
Amos Miller Farm
  `;

  return { subject, html, text };
}

export function orderStatusUpdateEmail(
  order: Order,
  newStatus: string,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const statusMessages: Record<string, { title: string; message: string }> = {
    processing: {
      title: "Your Order is Being Prepared",
      message: "We're now preparing your order. You'll receive another update when it's ready.",
    },
    packed: {
      title: "Your Order is Packed",
      message: "Your order has been packed and is ready for " + getFulfillmentLabel(order.fulfillment_type).toLowerCase() + ".",
    },
    shipped: {
      title: order.fulfillment_type === "shipping" ? "Your Order Has Shipped" : "Your Order is Out for Delivery",
      message: order.fulfillment_type === "shipping"
        ? "Your order is on its way! Track your package using the information below."
        : "Your order is out for delivery and should arrive today.",
    },
    delivered: {
      title: "Your Order Has Been Delivered",
      message: "Your order has been delivered. We hope you enjoy your fresh farm products!",
    },
  };

  const { title, message } = statusMessages[newStatus] || {
    title: `Order Update - ${getStatusLabel(newStatus)}`,
    message: `Your order status has been updated to: ${getStatusLabel(newStatus)}`,
  };

  const subject = `${title} - Order #${order.order_number}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>Hi ${getFirstName(order)},</p>
          <p>${message}</p>

          <div class="section" style="text-align: center;">
            <div class="section-title">Order Status</div>
            <span class="status-badge status-${newStatus}">${getStatusLabel(newStatus)}</span>
          </div>

          <div class="section">
            <div class="section-title">Order Number</div>
            <div class="order-number">#${order.order_number}</div>
          </div>

          ${order.tracking_number ? `
          <div class="tracking-box">
            <div class="section-title">Tracking Information</div>
            <div class="tracking-number">${order.tracking_number}</div>
            ${order.tracking_url ? `
              <a href="${order.tracking_url}" style="color: #2D5A3D; text-decoration: none; font-weight: 500;">
                Track Your Package →
              </a>
            ` : ""}
          </div>
          ` : ""}

          ${order.scheduled_date ? `
          <div class="section">
            <div class="section-title">${getFulfillmentLabel(order.fulfillment_type)} Date</div>
            <div style="font-size: 16px; color: #1a1a1a;">
              ${format(parseLocalDate(order.scheduled_date), "EEEE, MMMM d, yyyy")}
            </div>
          </div>
          ` : ""}

          <div style="text-align: center; margin-top: 32px;">
            <a href="${baseUrl}/account/orders/${order.order_number}" class="button">
              View Order Details
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for supporting our farm!</p>
          <p>Amos Miller Farm<br>amosmillerfarm.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${title}

Hi ${getFirstName(order)},

${message}

Order Number: #${order.order_number}
Status: ${getStatusLabel(newStatus)}
${order.tracking_number ? `Tracking: ${order.tracking_number}` : ""}
${order.tracking_url ? `Track: ${order.tracking_url}` : ""}

View your order: ${baseUrl}/account/orders/${order.order_number}

Thank you for supporting our farm!
Amos Miller Farm
  `;

  return { subject, html, text };
}

export function trackingAddedEmail(order: Order, baseUrl: string): { subject: string; html: string; text: string } {
  const subject = `Tracking Added - Order #${order.order_number}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order is On Its Way!</h1>
        </div>
        <div class="content">
          <p>Hi ${getFirstName(order)},</p>
          <p>Great news! Your order has been shipped and tracking information is now available.</p>

          <div class="section">
            <div class="section-title">Order Number</div>
            <div class="order-number">#${order.order_number}</div>
          </div>

          <div class="tracking-box">
            <div class="section-title">Tracking Number</div>
            <div class="tracking-number">${order.tracking_number}</div>
            ${order.tracking_url ? `
              <div style="margin-top: 12px;">
                <a href="${order.tracking_url}" class="button" style="display: inline-block;">
                  Track Your Package
                </a>
              </div>
            ` : ""}
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${baseUrl}/account/orders/${order.order_number}" style="color: #2D5A3D; text-decoration: none; font-weight: 500;">
              View Order Details →
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for supporting our farm!</p>
          <p>Amos Miller Farm<br>amosmillerfarm.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Your Order is On Its Way!

Hi ${getFirstName(order)},

Great news! Your order has been shipped and tracking information is now available.

Order Number: #${order.order_number}
Tracking Number: ${order.tracking_number}
${order.tracking_url ? `Track: ${order.tracking_url}` : ""}

View your order: ${baseUrl}/account/orders/${order.order_number}

Thank you for supporting our farm!
Amos Miller Farm
  `;

  return { subject, html, text };
}

export function paymentCapturedEmail(order: Order, baseUrl: string): { subject: string; html: string; text: string } {
  const subject = `Payment Processed - Order #${order.order_number}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Processed</h1>
        </div>
        <div class="content">
          <p>Hi ${getFirstName(order)},</p>
          <p>Your payment has been processed for order #${order.order_number}.</p>

          <div class="section">
            <div class="section-title">Amount Charged</div>
            <div class="order-number">${formatCurrency(order.total)}</div>
          </div>

          <div class="section">
            <div class="section-title">Order Summary</div>
            ${renderOrderItems(order.order_items || [])}
            ${renderTotals(order)}
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${baseUrl}/account/orders/${order.order_number}" class="button">
              View Order Details
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for supporting our farm!</p>
          <p>Amos Miller Farm<br>amosmillerfarm.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Payment Processed - Order #${order.order_number}

Hi ${getFirstName(order)},

Your payment has been processed for order #${order.order_number}.

Amount Charged: ${formatCurrency(order.total)}

View your order: ${baseUrl}/account/orders/${order.order_number}

Thank you for supporting our farm!
Amos Miller Farm
  `;

  return { subject, html, text };
}
