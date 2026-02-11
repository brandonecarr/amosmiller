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

// Modern, clean email styles inspired by best practices
const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f7f7f7;
    line-height: 1.6;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
  }
  .content {
    padding: 48px 40px;
    text-align: center;
  }
  .brand {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 32px;
    color: #000000;
  }
  .highlight {
    background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
    color: #ffffff;
    padding: 2px 8px;
    border-radius: 4px;
  }
  .order-id {
    font-size: 14px;
    color: #666666;
    margin-bottom: 24px;
    letter-spacing: 0.5px;
  }
  .order-id .highlight-text {
    color: #f97316;
    font-weight: 600;
  }
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #000000;
    margin: 0 0 16px 0;
    line-height: 1.2;
  }
  .subtitle {
    font-size: 16px;
    color: #666666;
    margin: 0 0 32px 0;
  }
  .button {
    display: inline-block;
    background-color: #0891b2;
    color: #ffffff !important;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 16px;
    margin: 8px 0;
  }
  .button:hover {
    background-color: #0e7490;
  }
  .link {
    color: #0891b2;
    text-decoration: none;
    font-size: 16px;
  }
  .link:hover {
    text-decoration: underline;
  }
  .divider {
    margin: 32px 0;
    color: #666666;
    font-size: 14px;
  }
  .tracking-section {
    background-color: #f9fafb;
    padding: 24px;
    border-radius: 6px;
    margin: 32px 0;
    text-align: center;
  }
  .tracking-label {
    font-size: 14px;
    color: #666666;
    margin-bottom: 8px;
  }
  .tracking-number {
    font-family: 'Courier New', monospace;
    font-size: 18px;
    font-weight: 600;
    color: #0891b2;
    letter-spacing: 1px;
  }
  .items-section {
    margin: 40px 0;
    text-align: left;
  }
  .items-title {
    font-size: 20px;
    font-weight: 600;
    color: #000000;
    margin-bottom: 24px;
    text-align: center;
  }
  .item {
    display: flex;
    align-items: flex-start;
    padding: 20px 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .item:last-child {
    border-bottom: none;
  }
  .item-image {
    width: 80px;
    height: 80px;
    background-color: #f3f4f6;
    border-radius: 8px;
    margin-right: 16px;
    flex-shrink: 0;
  }
  .item-details {
    flex: 1;
  }
  .item-name {
    font-size: 16px;
    font-weight: 600;
    color: #000000;
    margin-bottom: 4px;
  }
  .item-meta {
    font-size: 14px;
    color: #666666;
    margin-bottom: 8px;
  }
  .item-price {
    font-size: 15px;
    color: #000000;
    font-weight: 500;
  }
  .totals {
    margin: 32px 0;
    padding: 24px;
    background-color: #f9fafb;
    border-radius: 6px;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 15px;
  }
  .total-row.final {
    border-top: 2px solid #e5e7eb;
    margin-top: 12px;
    padding-top: 16px;
    font-size: 18px;
    font-weight: 700;
  }
  .footer {
    padding: 32px 40px;
    text-align: center;
    font-size: 14px;
    color: #666666;
    border-top: 1px solid #e5e7eb;
  }
  .footer-link {
    color: #0891b2;
    text-decoration: none;
  }
`;

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

function renderOrderItems(items: OrderItem[]): string {
  return items
    .map((item) => {
      const weight = item.actual_weight || item.estimated_weight;
      const price =
        item.pricing_type === "weight"
          ? item.unit_price * (weight || 1) * item.quantity
          : item.unit_price * item.quantity;

      const meta = item.pricing_type === "weight" && weight
        ? `Qty: ${item.quantity} × ${weight} lbs`
        : `Qty: ${item.quantity}`;

      return `
        <div class="item">
          <div class="item-image"></div>
          <div class="item-details">
            <div class="item-name">${item.product_name}</div>
            <div class="item-meta">${meta}</div>
            <div class="item-price">${formatCurrency(price)}</div>
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
        <span>Membership Fee</span>
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
      <div class="total-row" style="color: #16a34a;">
        <span>Discount</span>
        <span>-${formatCurrency(order.discount_amount)}</span>
      </div>
    `;
  }

  html += `
      <div class="total-row final">
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
        <div class="content">
          <div class="brand">
            <span class="highlight">Amos</span> Miller Farm
          </div>

          <div class="order-id">
            ORDER #<span class="highlight-text">AMOS-${order.order_number}</span>
          </div>

          <h1>Thank you for your order!</h1>
          <p class="subtitle">We've received your order and will notify you when it's ready.</p>

          <a href="${baseUrl}/account/orders/${order.order_number}" class="button">
            View your order
          </a>
          <div class="divider">or <a href="${baseUrl}/shop" class="link">Continue shopping</a></div>

          ${order.scheduled_date ? `
          <div style="margin: 32px 0; padding: 20px; background-color: #f9fafb; border-radius: 6px;">
            <div style="font-size: 14px; color: #666666; margin-bottom: 4px;">
              ${getFulfillmentLabel(order.fulfillment_type)} Date
            </div>
            <div style="font-size: 18px; font-weight: 600; color: #000000;">
              ${format(parseLocalDate(order.scheduled_date), "EEEE, MMMM d, yyyy")}
            </div>
            ${order.fulfillment_type === "pickup" && order.fulfillment_locations ? `
              <div style="font-size: 14px; color: #666666; margin-top: 8px;">
                ${order.fulfillment_locations.name}
              </div>
            ` : ""}
          </div>
          ` : ""}

          <div class="items-section">
            <div class="items-title">Items in your order</div>
            ${renderOrderItems(order.order_items || [])}
          </div>

          ${renderTotals(order)}
        </div>

        <div class="footer">
          <p>If you have any questions, reply to this email or contact us at<br>
          <a href="mailto:orders@amosmillerfarm.com" class="footer-link">orders@amosmillerfarm.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Amos Miller Farm
Order Confirmed - #${order.order_number}

Thank you for your order!

We've received your order and will notify you when it's ready.

View your order: ${baseUrl}/account/orders/${order.order_number}

Total: ${formatCurrency(order.total)}

If you have any questions, contact us at orders@amosmillerfarm.com
  `.trim();

  return { subject, html, text };
}

export function orderStatusUpdateEmail(
  order: Order,
  newStatus: string,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const statusMessages: Record<string, { title: string; message: string }> = {
    processing: {
      title: "Your order is being prepared",
      message: "We're now preparing your order. You'll receive another update when it's ready.",
    },
    packed: {
      title: "Your order is packed and ready",
      message: "Your order has been packed and is ready for " + getFulfillmentLabel(order.fulfillment_type).toLowerCase() + ".",
    },
    shipped: {
      title: "Your order is on the way",
      message: order.fulfillment_type === "shipping"
        ? "Your order is on the way. Track your shipment to see the delivery status."
        : "Your order is out for delivery and should arrive today.",
    },
    delivered: {
      title: "Your order has been delivered",
      message: "Your order has been delivered. We hope you enjoy your fresh farm products!",
    },
  };

  const { title, message } = statusMessages[newStatus] || {
    title: "Order Update",
    message: `Your order status has been updated.`,
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
        <div class="content">
          <div class="brand">
            <span class="highlight">Amos</span> Miller Farm
          </div>

          <div class="order-id">
            ORDER #<span class="highlight-text">AMOS-${order.order_number}</span>
          </div>

          <h1>${title}</h1>
          <p class="subtitle">${message}</p>

          ${order.tracking_number ? `
          <div class="tracking-section">
            <div class="tracking-label">Tracking number</div>
            <div class="tracking-number">${order.tracking_number}</div>
          </div>
          ` : ""}

          <a href="${baseUrl}/account/orders/${order.order_number}" class="button">
            View your order
          </a>
          ${order.tracking_url ? `
          <div class="divider">or <a href="${order.tracking_url}" class="link">Track your package</a></div>
          ` : `
          <div class="divider">or <a href="${baseUrl}/shop" class="link">Visit our store</a></div>
          `}

          ${newStatus === "shipped" && order.order_items ? `
          <div class="items-section">
            <div class="items-title">Items in this shipment</div>
            ${renderOrderItems(order.order_items)}
          </div>
          ` : ""}
        </div>

        <div class="footer">
          <p>If you have any questions, reply to this email or contact us at<br>
          <a href="mailto:orders@amosmillerfarm.com" class="footer-link">orders@amosmillerfarm.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Amos Miller Farm
${title}

Order #${order.order_number}

${message}

${order.tracking_number ? `Tracking: ${order.tracking_number}` : ""}
${order.tracking_url ? `Track: ${order.tracking_url}` : ""}

View your order: ${baseUrl}/account/orders/${order.order_number}

If you have any questions, contact us at orders@amosmillerfarm.com
  `.trim();

  return { subject, html, text };
}

export function trackingAddedEmail(order: Order, baseUrl: string): { subject: string; html: string; text: string } {
  const subject = `Your order is on the way - #${order.order_number}`;

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
        <div class="content">
          <div class="brand">
            <span class="highlight">Amos</span> Miller Farm
          </div>

          <div class="order-id">
            ORDER #<span class="highlight-text">AMOS-${order.order_number}</span>
          </div>

          <h1>Your order is on the way</h1>
          <p class="subtitle">Track your shipment to see the delivery status.</p>

          <div class="tracking-section">
            <div class="tracking-label">Tracking number</div>
            <div class="tracking-number">${order.tracking_number}</div>
          </div>

          ${order.tracking_url ? `
          <a href="${order.tracking_url}" class="button">
            Track your package
          </a>
          ` : ""}

          <div class="divider">or <a href="${baseUrl}/account/orders/${order.order_number}" class="link">View your order</a></div>
        </div>

        <div class="footer">
          <p>If you have any questions, reply to this email or contact us at<br>
          <a href="mailto:orders@amosmillerfarm.com" class="footer-link">orders@amosmillerfarm.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Amos Miller Farm
Your order is on the way

Order #${order.order_number}
Tracking: ${order.tracking_number}
${order.tracking_url ? `Track: ${order.tracking_url}` : ""}

View your order: ${baseUrl}/account/orders/${order.order_number}

If you have any questions, contact us at orders@amosmillerfarm.com
  `.trim();

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
        <div class="content">
          <div class="brand">
            <span class="highlight">Amos</span> Miller Farm
          </div>

          <div class="order-id">
            ORDER #<span class="highlight-text">AMOS-${order.order_number}</span>
          </div>

          <h1>Payment Processed</h1>
          <p class="subtitle">Your payment has been processed for ${formatCurrency(order.total)}.</p>

          <a href="${baseUrl}/account/orders/${order.order_number}" class="button">
            View your order
          </a>
          <div class="divider">or <a href="${baseUrl}/shop" class="link">Visit our store</a></div>

          <div class="items-section">
            <div class="items-title">Order summary</div>
            ${renderOrderItems(order.order_items || [])}
          </div>

          ${renderTotals(order)}
        </div>

        <div class="footer">
          <p>If you have any questions, reply to this email or contact us at<br>
          <a href="mailto:orders@amosmillerfarm.com" class="footer-link">orders@amosmillerfarm.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Amos Miller Farm
Payment Processed

Order #${order.order_number}
Amount: ${formatCurrency(order.total)}

View your order: ${baseUrl}/account/orders/${order.order_number}

If you have any questions, contact us at orders@amosmillerfarm.com
  `.trim();

  return { subject, html, text };
}
