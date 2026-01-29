import { sendEmail } from "./resend";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

interface GiftCardEmailParams {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  amount: number;
  code: string;
  personalMessage?: string | null;
}

function giftCardEmailTemplate(params: GiftCardEmailParams): string {
  const formattedCode = params.code.replace(/-/g, "").match(/.{1,4}/g)?.join("-") || params.code;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f0e6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #2D5A3D; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 32px 24px; }
    .gift-card { background: linear-gradient(135deg, #2D5A3D, #3d7a54); border-radius: 16px; padding: 32px; text-align: center; margin: 24px 0; color: #ffffff; }
    .gift-card .amount { font-size: 48px; font-weight: bold; margin: 16px 0; }
    .gift-card .code { font-family: 'Courier New', monospace; font-size: 24px; letter-spacing: 3px; background: rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 8px; display: inline-block; margin-top: 8px; }
    .message-box { background-color: #f9f7f4; border-left: 4px solid #2D5A3D; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .message-box .from { font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
    .message-box .text { color: #555555; font-style: italic; }
    .instructions { background-color: #f0f7f2; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .instructions h3 { margin: 0 0 12px; color: #1a1a1a; font-size: 16px; }
    .instructions ol { margin: 0; padding-left: 20px; color: #555555; }
    .instructions li { margin-bottom: 8px; }
    .cta-button { display: inline-block; background-color: #2D5A3D; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0; }
    .footer { padding: 24px; text-align: center; color: #999999; font-size: 12px; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Amos Miller Farm</h1>
    </div>
    <div class="content">
      <p style="font-size: 18px; color: #1a1a1a; margin-bottom: 8px;">
        You've received a gift card!
      </p>
      <p style="color: #555555;">
        Hi ${params.recipientName}, ${params.senderName} sent you a gift card to Amos Miller Farm.
      </p>

      <div class="gift-card">
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Gift Card Value</p>
        <div class="amount">${formatCurrency(params.amount)}</div>
        <p style="margin: 0 0 8px; font-size: 14px; opacity: 0.9;">Your Code</p>
        <div class="code">${formattedCode}</div>
      </div>

      ${params.personalMessage ? `
      <div class="message-box">
        <p class="from">From ${params.senderName}:</p>
        <p class="text">"${params.personalMessage}"</p>
      </div>
      ` : ""}

      <div class="instructions">
        <h3>How to Use Your Gift Card</h3>
        <ol>
          <li>Browse our shop at amosmillerfarm.com</li>
          <li>Add items to your cart and proceed to checkout</li>
          <li>Enter your gift card code in the Gift Card field</li>
          <li>The balance will be applied to your order</li>
        </ol>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://amosmillerfarm.com"}/shop" class="cta-button">
          Start Shopping
        </a>
      </div>

      <p style="color: #999999; font-size: 13px; margin-top: 24px;">
        Your gift card never expires. You can check your balance anytime at
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://amosmillerfarm.com"}/gift-cards/check-balance" style="color: #2D5A3D;">
          amosmillerfarm.com/gift-cards/check-balance
        </a>
      </p>
    </div>
    <div class="footer">
      <p>Amos Miller Farm &mdash; Farm Fresh, Direct to You</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendGiftCardEmail(params: GiftCardEmailParams) {
  const html = giftCardEmailTemplate(params);

  return sendEmail({
    to: params.recipientEmail,
    subject: `${params.senderName} sent you a gift card from Amos Miller Farm!`,
    html,
    text: `Hi ${params.recipientName}! ${params.senderName} sent you a ${formatCurrency(params.amount)} gift card to Amos Miller Farm. Your code: ${params.code}. Use it at checkout on amosmillerfarm.com.`,
  });
}
