import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  // 1. Pull svix headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // 2. Read raw payload
  const payload = await req.text();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // 3. Verify signature
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

  // 4. Handle user.created / user.updated
  if (type === 'user.created' || type === 'user.updated') {
    const {
      id,
      email_addresses,
      primary_email_address_id,
      username,
      first_name,
      last_name,
      image_url,
    } = data;

    // Prefer the primary email; fall back to the first one
    const primaryEmail =
      email_addresses.find(
        (e) => e.id === primary_email_address_id
      )?.email_address ?? email_addresses[0]?.email_address;

    if (!primaryEmail) {
      return new Response('No email found', { status: 400 });
    }

    const fullName =
      `${first_name || ''} ${last_name || ''}`.trim() || null;

    // Normalize: strip leading @, lowercase
    const normalizedUsername = username
      ? username.replace(/^@/, '').toLowerCase()
      : null;

    try {
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email: primaryEmail,
          username: normalizedUsername,
          firstName: first_name || null,
          lastName: last_name || null,
          name: fullName,
          imageUrl: image_url || null,
        },
        create: {
          clerkId: id,
          email: primaryEmail,
          username: normalizedUsername,
          firstName: first_name || null,
          lastName: last_name || null,
          name: fullName,
          imageUrl: image_url || null,
          role: 'STUDENT',
        },
      });

      console.log(
        `✅ User ${id} synced (username: ${normalizedUsername ?? 'none'})`
      );
    } catch (error) {
      console.error('Error processing user:', error);
      return new Response('Error processing user', { status: 500 });
    }
  }

  // 5. Handle user.deleted (optional but recommended)
  if (type === 'user.deleted' && data.id) {
    try {
      await prisma.user.delete({
        where: { clerkId: data.id },
      });
      console.log(`🗑️  User ${data.id} deleted from database`);
    } catch (error) {
      // Ignore "not found" — user may never have been synced
      console.warn(`Could not delete user ${data.id}:`, error);
    }
  }

  return new Response('Webhook received', { status: 200 });
}