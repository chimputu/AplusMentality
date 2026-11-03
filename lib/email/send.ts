// lib/email/send.ts — Server-side email sending via Brevo
// Migrated from EmailJS (client-side only) to Brevo for reliable server-side delivery
// Free plan: 300 emails/day, no custom domain required
// Uses @getbrevo/brevo v6 SDK with BrevoClient API

'use server';

import * as Sentry from '@sentry/nextjs';
import { BrevoClient } from '@getbrevo/brevo';

let brevoClient: BrevoClient | null = null;

function getBrevoClient() {
  if (brevoClient) return brevoClient;
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[Brevo] BREVO_API_KEY not set — email sends will fail');
  }
  brevoClient = new BrevoClient({ apiKey: apiKey ?? '' });
  return brevoClient;
}

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'kafiswegchimputu@gmail.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'A+ Mentality';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO ?? 'kafiswegchimputu@gmail.com';

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
 * Uses BrevoClient v6 SDK: client.transactionalEmails.sendTransacEmail({ ... })
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
    console.warn('[email] BREVO_API_KEY missing. Skipping send.');
    return { success: false, error: 'BREVO_API_KEY missing' };
  }

  try {
    const client = getBrevoClient();

    const result = await client.transactionalEmails.sendTransacEmail({
      sender: {
        name: EMAIL_FROM_NAME,
        email: EMAIL_FROM,
      },
      to: (Array.isArray(to) ? to : [to]).map((email) => ({ email })),
      subject,
      htmlContent: html,
      replyTo: {
        email: replyTo ?? EMAIL_REPLY_TO,
        name: EMAIL_FROM_NAME,
      },
    });

    // Email sent successfully — no need to log recipient addresses in production

    return { success: true, id: result.messageId };
  } catch (err: any) {
    const errorMsg =
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
