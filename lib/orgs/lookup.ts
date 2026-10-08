import { prisma } from '@/lib/prisma';

export async function getInstitutionByClerkOrgId(clerkOrgId: string) {
  return prisma.institution.findUnique({
    where: { clerkOrgId },
    select: {
      id: true,
      name: true,
      slug: true,
      clerkOrgId: true,
      clerkOrgSlug: true,
    },
  });
}

export async function getUserOrganizations(userId: string) {
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId, status: 'active' },
    orderBy: { joinedAt: 'desc' },
  });

  if (memberships.length === 0) return [];

  const orgIds = memberships.map((m) => m.clerkOrgId);
  const institutions = await prisma.institution.findMany({
    where: { clerkOrgId: { in: orgIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      clerkOrgId: true,
      clerkOrgSlug: true,
      logoUrl: true,
      type: true,
    },
  });

  const map = Object.fromEntries(
    institutions.map((i) => [i.clerkOrgId, i])
  );

  return memberships
    .map((m) => ({
      membership: m,
      institution: map[m.clerkOrgId] ?? null,
    }))
    .filter((x) => x.institution !== null);
}

export async function isUserMemberOfOrg(
  userId: string,
  clerkOrgId: string
): Promise<boolean> {
  const m = await prisma.organizationMembership.findUnique({
    where: { userId_clerkOrgId: { userId, clerkOrgId } },
    select: { status: true },
  });
  return m?.status === 'active';
}

export async function getUserOrgRole(
  userId: string,
  clerkOrgId: string
): Promise<string | null> {
  const m = await prisma.organizationMembership.findUnique({
    where: { userId_clerkOrgId: { userId, clerkOrgId } },
    select: { role: true, status: true },
  });
  if (m?.status !== 'active') return null;
  return m.role;
}
