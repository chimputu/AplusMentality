// lib/email/send.ts — Server-side email sending via Brevo
// Migrated from EmailJS (client-side only) to Brevo for reliable server-side delivery
// Free plan: 300 emails/day, no custom domain required

'use server';

import * as brevo from '@getbrevo/brevo';
import * as Sentry from '@sentry/nextjs';
import {
  getBrevoClient,
  EMAIL_FROM,
  EMAIL_FROM_NAME,
  EMAIL_REPLY_TO,
} from './brevo-client';

/**
 * Options for sending an email via Brevo.
 */
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  // HTML body content (rendered from React email templates or plain HTML strings)
  html: string;
  replyTo?: string;
}

/**
 * Send an email via Brevo transactional API.
 * Renders HTML content and sends to the specified recipient(s).
 * Falls back to console logging if BREVO_API_KEY is not configured.
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailOptions) {
  // If no API key, log and return gracefully — never crash the caller
  if (!process.env.BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY missing. Skipping send to:', to);
    console.log('[email] Subject:', subject);
    console.log('[email] HTML preview:', html.slice(0, 200) + '...');
    return { success: false, error: 'BREVO_API_KEY missing' };
  }

  try {
    const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({
      email,
    }));

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: EMAIL_FROM_NAME,
      email: EMAIL_FROM,
    };
    sendSmtpEmail.to = recipients;
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.replyTo = {
      email: replyTo ?? EMAIL_REPLY_TO,
      name: EMAIL_FROM_NAME,
    };

    const apiInstance = getBrevoClient();
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log(
      '[email] Sent via Brevo:',
      result.body?.messageId,
      'to:',
      Array.isArray(to) ? to.join(', ') : to
    );

    return { success: true, id: result.body?.messageId };
  } catch (err: any) {
    const errorMsg =
      err?.response?.body?.message ||
      err?.message ||
      'Unknown Brevo error';

    console.error('[email] Brevo send failed:', errorMsg);
    Sentry.captureException(err);

    return { success: false, error: errorMsg };
  }
}

/**
 * Send an email with a plain text body (converted to simple HTML).
 * Useful for quick notifications without React templates.
 */
export async function sendTextEmail({
  to,
  subject,
  text,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
}) {
  // Convert plain text to simple HTML
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        ${text.replace(/\n/g, '<br>')}
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html, replyTo });
}
