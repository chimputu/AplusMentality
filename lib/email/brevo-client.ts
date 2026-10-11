// lib/email/brevo-client.ts — Brevo (Sendinblue) API client configuration
// Migrated from Resend/EmailJS to Brevo free plan (300 emails/day)
// Sender: kafiswegchimputu@gmail.com (must be verified in Brevo dashboard)
// Uses @getbrevo/brevo v6 SDK with BrevoClient API

import { BrevoClient } from '@getbrevo/brevo';

/**
 * Get a configured BrevoClient instance.
 * Uses the BREVO_API_KEY environment variable.
 * The client is cached so it's only created once.
 */
let brevoClient: BrevoClient | null = null;

export function getBrevoClient() {
  if (brevoClient) return brevoClient;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[Brevo] BREVO_API_KEY not set — email sends will fail');
  }

  brevoClient = new BrevoClient({
    apiKey: apiKey ?? '',
  });

  return brevoClient;
}

/**
 * Default sender email address.
 * Must be verified in Brevo dashboard → Transactional → Senders.
 */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? 'kafiswegchimputu@gmail.com';

/**
 * Default sender name displayed in email "From" field.
 */
export const EMAIL_FROM_NAME =
  process.env.EMAIL_FROM_NAME ?? 'A+ Mentality';

/**
 * Default reply-to address for received replies.
 */
export const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO ?? 'kafiswegchimputu@gmail.com';
