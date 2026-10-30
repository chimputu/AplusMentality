import { NextRequest, NextResponse } from 'next/server';
import { sendTextEmail } from '@/lib/email/send';

/**
 * POST /api/subscribe
 * Newsletter subscription endpoint using Brevo server-side email.
 * Replaces the client-side EmailJS integration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const result = await sendTextEmail({
      to: 'kafiswegchimputu@gmail.com',
      subject: 'New A+ Mentality Subscriber!',
      text: `A new student has subscribed to the A+ Mentality newsletter.\n\nEmail: ${email}\nDate: ${new Date().toLocaleString()}`,
    });

    if (result.success) {
      return NextResponse.json(
        { success: true, message: 'Subscription successful' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to process subscription' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Subscribe API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
