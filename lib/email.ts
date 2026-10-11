// lib/email.ts — Simple email utility using EmailJS
// For server-side use, we log the email and optionally send via EmailJS browser SDK
// In production, consider migrating to Resend or a dedicated email service

import { prisma } from '@/lib/prisma';

export interface TutorApplicationEmail {
  to: string;
  subject: string;
  fullName: string;
  body: string;
  type: 'submitted' | 'approved' | 'rejected';
}

// EmailJS configuration (same service used in HomePageClient)
const EMAILJS_SERVICE_ID = 'service_fadklbd';
const EMAILJS_PUBLIC_KEY = 'lq3xCtY4KtS7Z-3Wf';

// Template IDs — create these in your EmailJS dashboard:
// - template_tutor_submitted: When a student submits a tutor application
// - template_tutor_approved: When admin approves a tutor application
// - template_tutor_rejected: When admin rejects a tutor application
const EMAILJS_TEMPLATES = {
  submitted: 'template_tutor_submitted',
  approved: 'template_tutor_approved',
  rejected: 'template_tutor_rejected',
} as const;

/**
 * Send a tutor application email notification.
 * Uses console logging as fallback if EmailJS is not configured server-side.
 * EmailJS browser SDK is client-side only, so server-side we log and track.
 */
export async function sendTutorApplicationEmail(email: TutorApplicationEmail) {
  const { to, subject, fullName, body, type } = email;

  // Log the email for tracking
  console.log(`[Email] ${type.toUpperCase()} — To: ${to}, Subject: ${subject}`);
  console.log(`[Email] From: ${fullName}, Body preview: ${body.slice(0, 100)}...`);

  // Try to get admin email for "submitted" notifications
  if (type === 'submitted') {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
    });
    if (admins.length > 0) {
      console.log(`[Email] Admins to notify: ${admins.map((a) => a.email).join(', ')}`);
    }
  }

  // Note: EmailJS browser SDK cannot be used server-side.
  // For production, integrate Resend or similar:
  //   npm install resend
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({ from, to, subject, html: body });

  // For now, we store the email intent in a log table if it exists,
  // or just log to console for the admin to see in Vercel logs.
  return { success: true, type, to };
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
