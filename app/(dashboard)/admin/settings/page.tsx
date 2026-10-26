import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import AdminSettingsClient from './settings-client';

export default async function AdminSettingsPage() {
  const { userId } = await auth();
  let institutionSlug: string | undefined;
  let institutionId: string | undefined;
  let universityJoinSlug: string | undefined;
  let universityId: string | undefined;

  if (userId) {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (user?.institutionId) {
      const inst = await prisma.institution.findUnique({ where: { id: user.institutionId } });
      if (inst) {
        institutionSlug = inst.slug;
        institutionId = inst.id;
      }
    }
    if (user?.universityId) {
      const uni = await prisma.university.findUnique({ where: { id: user.universityId } });
      if (uni) {
        universityJoinSlug = uni.joinSlug ?? undefined;
        universityId = uni.id;
      }
    }
  }

  return (
    <AdminSettingsClient
      institutionSlug={institutionSlug}
      institutionId={institutionId}
      universityJoinSlug={universityJoinSlug}
      universityId={universityId}
    />
  );
}
