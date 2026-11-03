// lib/email.ts — Email utility for tutor application notifications
// Uses Brevo (Sendinblue) for server-side email delivery
// Free plan: 300 emails/day, sender: kafiswegchimputu@gmail.com

import { sendEmail } from '@/lib/email/send';

export interface TutorApplicationEmail {
  to: string;
  subject: string;
  fullName: string;
  body: string;
  type: 'submitted' | 'approved' | 'rejected';
}

/**
 * Send a tutor application email notification via Brevo.
 * Actually delivers the email to the recipient's inbox.
 * Falls back to console logging if BREVO_API_KEY is not configured.
 */
export async function sendTutorApplicationEmail(email: TutorApplicationEmail) {
  const { to, subject, body, type } = email;

  // Send via Brevo
  const result = await sendEmail({ to, subject, html: body });

  if (!result.success) {
    console.error(`[Email] ${type.toUpperCase()} failed:`, result.error);
  }

  return result;
}

/**
 * Generate email content for tutor application submitted
 */
export function createSubmittedEmail(to: string, fullName: string, applicantEmail: string) {
  return {
    to,
    subject: 'New Tutor Application Submitted — A+ Mentality',
    fullName: 'A+ Mentality System',
    body: `
      <h2>New Tutor Application</h2>
      <p><strong>Applicant:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${applicantEmail}</p>
      <p>Please review the application in the admin dashboard.</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/tutor-applications">View Applications</a></p>
    `,
    type: 'submitted' as const,
  };
}

/**
 * Generate email content for tutor application approved
 */
export function createApprovedEmail(to: string, fullName: string, institutionName?: string) {
  const inst = institutionName ? ` at ${institutionName}` : '';
  return {
    to,
    subject: '🎉 Your Tutor Application Has Been Approved — A+ Mentality',
    fullName,
    body: `
      <h2>Congratulations, ${fullName}!</h2>
      <p>Your tutor application has been approved${inst}.</p>
      <p>You now have access to the tutor features on A+ Mentality.</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/apply-as-tutor/status">View Your Status</a></p>
    `,
    type: 'approved' as const,
  };
}

/**
 * Generate email content for tutor application rejected
 */
export function createRejectedEmail(to: string, fullName: string, reason: string) {
  return {
    to,
    subject: 'Tutor Application Update — A+ Mentality',
    fullName,
    body: `
      <h2>Tutor Application Update</h2>
      <p>Dear ${fullName},</p>
      <p>Thank you for your interest in becoming a tutor on A+ Mentality.</p>
      <p>After careful review, we regret to inform you that your application was not approved at this time.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>You may re-apply after addressing the feedback.</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/apply-as-tutor/status">View Your Application</a></p>
    `,
    type: 'rejected' as const,
  };
}
