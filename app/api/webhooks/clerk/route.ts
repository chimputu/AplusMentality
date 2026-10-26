import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { CLERK_TO_APP_ROLE } from '@/lib/clerk-org';

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
    }) as unknown as WebhookEvent;
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

    // Normalize: strip leading @, lowercase; fall back to email if username is not set
    const normalizedUsername = username
      ? username.replace(/^@/, '').toLowerCase()
      : primaryEmail;

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

  // 6. Handle organization.created — link org to institution by slug
  if (type === 'organization.created') {
    const { id, name, slug } = data;
    const institution = await prisma.institution.findUnique({
      where: { slug },
    });
    if (institution) {
      await prisma.institution.update({
        where: { id: institution.id },
        data: { clerkOrgId: id, clerkOrgSlug: slug },
      });
      console.log(`✅ Organization linked to institution: ${slug}`);
    } else {
      console.warn(`⚠️ Organization created without matching institution: ${slug}`);
    }
  }

  // 7. Handle organization.updated — update slug
  if (type === 'organization.updated') {
    const { id, slug } = data;
    await prisma.institution.updateMany({
      where: { clerkOrgId: id },
      data: { clerkOrgSlug: slug },
    });
  }

  // 8. Handle organization.deleted — nullify links, revoke memberships
  if (type === 'organization.deleted') {
    const { id } = data;
    await prisma.institution.updateMany({
      where: { clerkOrgId: id },
      data: { clerkOrgId: null, clerkOrgSlug: null },
    });
    await prisma.organizationMembership.updateMany({
      where: { clerkOrgId: id, status: 'active' },
      data: { status: 'revoked', revokedAt: new Date() },
    });
    console.log(`🗑️  Organization ${id} deleted — links nullified, memberships revoked`);
  }

  // 9. Handle organizationMembership.created — upsert membership record
  if (type === 'organizationMembership.created') {
    const { organization, public_user_data, role } = data;
    const clerkUserId = public_user_data.user_id;
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });
    if (!user) {
      console.warn(`⚠️ Membership for unknown user: ${clerkUserId}`);
    } else {
      await prisma.organizationMembership.upsert({
        where: {
          userId_clerkOrgId: {
            userId: user.id,
            clerkOrgId: organization.id,
          },
        },
        update: {
          role,
          status: 'active',
          revokedAt: null,
        },
        create: {
          userId: user.id,
          clerkOrgId: organization.id,
          clerkOrgSlug: organization.slug,
          role,
          status: 'active',
        },
      });
      // Sync user's active org fields AND the main role enum from Clerk → DB
      const appRole = CLERK_TO_APP_ROLE[role ?? ''] || user.role;
      await prisma.user.update({
        where: { id: user.id },
        data: { clerkOrgId: organization.id, clerkOrgRole: role, role: appRole },
      });
      console.log(`✅ Membership created: ${user.email} → ${organization.slug} (${role}, app role: ${appRole})`);
    }
  }

  // 10. Handle organizationMembership.updated — update role in membership, user clerkOrgRole, AND user role enum
  if (type === 'organizationMembership.updated') {
    const { organization, public_user_data, role } = data;
    const clerkUserId = public_user_data.user_id;
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });
    if (!user) return;
    await prisma.organizationMembership.updateMany({
      where: {
        userId: user.id,
        clerkOrgId: organization.id,
      },
      data: { role },
    });
    // Sync BOTH clerkOrgRole AND the main role enum from Clerk → DB
    // This ensures changing a role in Clerk dashboard automatically updates the DB
    const appRole = CLERK_TO_APP_ROLE[role ?? ''] || user.role;
    await prisma.user.update({
      where: { id: user.id },
      data: { clerkOrgRole: role, role: appRole },
    });
    console.log(`✅ Membership updated: ${user.email} → ${role} (app role: ${appRole}) in ${organization.slug}`);
  }

  // 11. Handle organizationMembership.deleted — revoke membership
  if (type === 'organizationMembership.deleted') {
    const { organization, public_user_data } = data;
    const clerkUserId = public_user_data.user_id;
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });
    if (!user) return;
    await prisma.organizationMembership.updateMany({
      where: {
        userId: user.id,
        clerkOrgId: organization.id,
      },
      data: { status: 'revoked', revokedAt: new Date() },
    });
  }

  return new Response('Webhook received', { status: 200 });
}