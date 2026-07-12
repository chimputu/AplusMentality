import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.text();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;
  
  try {
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }

  const { type, data } = evt;

  if (type === 'user.created' || type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = data;

    const email = email_addresses[0]?.email_address;
    if (!email) {
      return new Response('No email found', { status: 400 });
    }

    try {
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          name: `${first_name || ''} ${last_name || ''}`.trim(),
        },
        create: {
          clerkId: id,
          email,
          name: `${first_name || ''} ${last_name || ''}`.trim(),
          role: 'STUDENT',
        },
      });

      console.log(`✅ User ${id} synced to database`);
    } catch (error) {
      console.error('Error processing user:', error);
      return new Response('Error processing user', { status: 500 });
    }
  }

  return new Response('Webhook received', { status: 200 });
}