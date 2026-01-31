/**
 * Creates the "Privacy Policy" CMS page with content.
 *
 * Usage: npx tsx scripts/create-privacy-policy-page.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SLUG = "privacy-policy";

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Creating Privacy Policy Page ===\n");

  // Step 1: Check if page already exists
  console.log("Step 1: Checking if page exists...");
  const { data: existing } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    console.log("  Page already exists. Deleting to re-create...");
    await supabase.from("pages").delete().eq("id", existing.id);
  }

  // Step 2: Build content blocks
  console.log("\nStep 2: Building page content...");

  const blocks = [
    // ── Hero ──
    {
      id: randomUUID(),
      type: "hero",
      data: {
        title: "Privacy Policy",
        subtitle:
          "How we collect, use, and protect your personal information.",
      },
    },

    // ── Personal Information ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Sharing of Personal Information</h2>

<p>We do not share, sell, or disclose your personal information or mobile opt-in data to third parties without your explicit consent, except where required by law.</p>

<p>Your information remains confidential and is used only for the purposes you have agreed to. Text messaging opt-in data and consent are never shared with third parties for marketing or promotional purposes.</p>`,
      },
    },

    // ── Information We Collect ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Information We Collect</h2>

<p>When you create an account, place an order, or interact with our website, we may collect the following information:</p>

<ul>
<li><strong>Account information</strong> \u2013 Name, email address, phone number, and password</li>
<li><strong>Order information</strong> \u2013 Shipping and billing addresses, order history, and payment details</li>
<li><strong>Communication preferences</strong> \u2013 Email and SMS opt-in status</li>
</ul>

<p>We collect this information to fulfill your orders, manage your membership, and communicate with you about your account and our products.</p>`,
      },
    },

    // ── How We Use Your Information ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>How We Use Your Information</h2>

<p>Your personal information is used for the following purposes:</p>

<ul>
<li>Processing and fulfilling your orders</li>
<li>Managing your Private Member Association membership</li>
<li>Communicating order updates, shipping notifications, and tracking information</li>
<li>Sending product availability updates and farm news (with your consent)</li>
<li>Responding to your questions and customer service requests</li>
<li>Improving our website and services</li>
</ul>`,
      },
    },

    // ── Payment Security ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Payment Security</h2>

<p>All payment transactions are processed through <strong>Stripe</strong>, a PCI-compliant payment processor. We do not store your full credit card number on our servers. Stripe handles all sensitive payment data securely in accordance with industry standards.</p>`,
      },
    },

    // ── Text Messaging ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Text Messaging (SMS)</h2>

<p>By providing your phone number and opting in to text messaging, you agree to receive SMS communications from Amos Miller Farm. These may include order confirmations, shipping updates, and promotional messages.</p>

<p><strong>Opting out:</strong> You may opt out of text messages at any time by replying <strong>STOP</strong> to any message received from us. After opting out, you will no longer receive SMS communications.</p>

<p>Standard message and data rates may apply. Message frequency varies based on your account activity.</p>`,
      },
    },

    // ── Cookies ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Cookies &amp; Local Storage</h2>

<p>Our website uses cookies and local storage to:</p>

<ul>
<li>Keep you logged in to your account</li>
<li>Remember your shopping cart contents</li>
<li>Improve website performance and your browsing experience</li>
</ul>

<p>These are essential for the website to function properly. We do not use tracking cookies for advertising purposes.</p>`,
      },
    },

    // ── Third Parties ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Third-Party Services</h2>

<p>We use the following third-party services to operate our website and fulfill orders:</p>

<ul>
<li><strong>Stripe</strong> \u2013 Payment processing</li>
<li><strong>FedEx / UPS</strong> \u2013 Order shipping and tracking</li>
<li><strong>Supabase</strong> \u2013 Secure data storage</li>
<li><strong>Resend</strong> \u2013 Transactional email delivery</li>
</ul>

<p>These services have access only to the information necessary to perform their functions and are obligated to protect your data.</p>`,
      },
    },

    // ── Your Rights ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Your Rights</h2>

<p>You have the right to:</p>

<ul>
<li><strong>Access</strong> the personal information we hold about you</li>
<li><strong>Update</strong> your account information at any time through your account settings</li>
<li><strong>Request deletion</strong> of your personal data by contacting us</li>
<li><strong>Opt out</strong> of marketing communications at any time</li>
</ul>

<p>To exercise any of these rights, please contact us using the information below.</p>`,
      },
    },

    // ── Changes ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Changes to This Policy</h2>

<p>We may update this privacy policy from time to time. Any changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically.</p>`,
      },
    },

    // ── Contact ──
    {
      id: randomUUID(),
      type: "richtext",
      data: {
        html: `<h2>Contact Us</h2>

<p>If you have any questions about this privacy policy or how we handle your personal information, please contact us:</p>

<ul>
<li><strong>Email:</strong> info@amosmillerorganicfarm.com</li>
<li><strong>Phone:</strong> (717) 556-0672</li>
<li><strong>Address:</strong> 648 Mill Creek School Rd, Bird in Hand, PA 17505</li>
</ul>`,
      },
    },
  ];

  // Step 3: Insert page
  console.log("\nStep 3: Inserting page...");
  const { error: insertError } = await supabase.from("pages").insert({
    title: "Privacy Policy",
    slug: SLUG,
    content: blocks,
    meta_title: "Privacy Policy | Amos Miller Farm",
    meta_description:
      "Learn how Amos Miller Farm collects, uses, and protects your personal information. We never share or sell your data to third parties.",
    is_published: true,
    show_in_nav: false,
    sort_order: 10,
  });

  if (insertError) {
    console.error(`Failed to insert page: ${insertError.message}`);
    process.exit(1);
  }

  console.log("\n=== Page Created Successfully ===");
  console.log(`  Title: Privacy Policy`);
  console.log(`  Slug: ${SLUG}`);
  console.log(`  URL: /privacy-policy`);
  console.log(`  Content blocks: ${blocks.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
