/**
 * Resend Email Test Script
 *
 * Tests your Resend API configuration by sending a test email.
 *
 * Usage:
 *   npx tsx scripts/test-resend-email.ts your-email@example.com
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Amos Miller Farm';

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set in .env.local');
  process.exit(1);
}

// Get recipient email from command line argument
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('❌ Please provide a recipient email address');
  console.error('   Usage: npx tsx scripts/test-resend-email.ts your-email@example.com');
  process.exit(1);
}

async function testEmail() {
  console.log('🧪 Testing Resend Email Configuration...\n');
  console.log('Configuration:');
  console.log(`  API Key: ${RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`  From: ${EMAIL_FROM_NAME} <${EMAIL_FROM}>`);
  console.log(`  To: ${recipientEmail}\n`);

  try {
    const resend = new Resend(RESEND_API_KEY);

    const result = await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: [recipientEmail],
      subject: '🧪 Test Email from Amos Miller Farm',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2d5a3d;">✅ Email Configuration Working!</h1>
          <p>Congratulations! Your Resend email integration is configured correctly.</p>

          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Configuration Details:</strong><br>
            <code>From: ${EMAIL_FROM_NAME} &lt;${EMAIL_FROM}&gt;</code><br>
            <code>API Key: ${RESEND_API_KEY.substring(0, 10)}...</code>
          </div>

          <p>You can now send emails from your Amos Miller Farm application!</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This is a test email sent from your development environment.
          </p>
        </div>
      `,
      text: `✅ Email Configuration Working!\n\nCongratulations! Your Resend email integration is configured correctly.\n\nFrom: ${EMAIL_FROM_NAME} <${EMAIL_FROM}>\nAPI Key: ${RESEND_API_KEY.substring(0, 10)}...\n\nYou can now send emails from your Amos Miller Farm application!`,
    });

    console.log('✅ Email sent successfully!');
    console.log('\nResponse:');
    console.log(`  Message ID: ${result.data?.id}`);
    console.log(`\n📧 Check your inbox at: ${recipientEmail}`);
    console.log('\n💡 Next Steps:');
    console.log('  1. Restart your Next.js dev server');
    console.log('  2. Try sending an order confirmation from the admin panel');

  } catch (error: any) {
    console.error('\n❌ Failed to send email:');
    console.error(`   ${error.message}`);

    if (error.message?.includes('Invalid API key')) {
      console.error('\n💡 Your API key appears to be invalid.');
      console.error('   1. Go to https://resend.com/api-keys');
      console.error('   2. Generate a new API key');
      console.error('   3. Update RESEND_API_KEY in .env.local');
    } else if (error.message?.includes('domain')) {
      console.error('\n💡 Domain verification issue.');
      console.error('   Try using: EMAIL_FROM=onboarding@resend.dev');
    }

    process.exit(1);
  }
}

testEmail();
