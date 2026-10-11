// scripts/test-email.ts — Test Brevo email delivery
// Run: npx tsx scripts/test-email.ts
// Sends a test email to the address specified (defaults to kafiswegchimputu@gmail.com)

import 'dotenv/config';
import { sendEmail } from '@/lib/email/send';

async function main() {
  const testEmail = process.env.EMAIL_FROM ?? 'kafiswegchimputu@gmail.com';

  console.log('Testing Brevo email delivery...');
  console.log('BREVO_API_KEY set:', !!process.env.BREVO_API_KEY ? '✅' : '❌');
  console.log('Sending to:', testEmail);
  console.log('---');

  const result = await sendEmail({
    to: testEmail,
    subject: '🧪 Brevo Email Test — A+ Mentality',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Brevo Test</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">A+ Mentality</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email System Test</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="margin-top: 0; color: #333;">✅ Email System Working!</h2>
            <p>If you're reading this, the Brevo email integration is working correctly.</p>
            <p><strong>Sender:</strong> kafiswegchimputu@gmail.com</p>
            <p><strong>Service:</strong> Brevo (Sendinblue) Free Plan</p>
            <p><strong>Quota:</strong> 300 emails/day</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">This is an automated test email from A+ Mentality.</p>
          </div>
        </body>
      </html>
    `,
  });

  console.log('---');
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ Test email sent successfully!');
    console.log('Check your inbox (and spam folder) for the test email.');
    console.log('Also check Brevo dashboard → Transactional → Logs');
  } else {
    console.log('\n❌ Test email failed to send.');
    console.log('Error:', result.error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure BREVO_API_KEY is set in .env');
    console.log('2. Verify kafiswegchimputu@gmail.com is verified in Brevo dashboard');
    console.log('3. Check Brevo dashboard for any sender issues');
  }
}

main().catch(console.error);
