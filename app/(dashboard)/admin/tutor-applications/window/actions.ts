'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Forbidden');
  }
  return user;
}

export async function createWindowAction(formData: FormData) {
  await requireAdmin();

  const opensAt = formData.get('opensAt') as string;
  const closesAt = formData.get('closesAt') as string;
  const publicMessage = formData.get('publicMessage') as string;
  const isOpen = formData.get('isOpen') === 'on';

  await prisma.applicationWindow.create({
    data: {
      opensAt: opensAt ? new Date(opensAt) : null,
      closesAt: closesAt ? new Date(closesAt) : null,
      publicMessage: publicMessage || null,
      isOpen,
    },
  });

  revalidatePath('/admin/tutor-applications/window');
}

export async function updateWindowAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get('id') as string;
  const opensAt = formData.get('opensAt') as string;
  const closesAt = formData.get('closesAt') as string;
  const publicMessage = formData.get('publicMessage') as string;
  const isOpen = formData.get('isOpen') === 'on';

  await prisma.applicationWindow.update({
    where: { id },
    data: {
      opensAt: opensAt ? new Date(opensAt) : null,
      closesAt: closesAt ? new Date(closesAt) : null,
      publicMessage: publicMessage || null,
      isOpen,
    },
  });

  revalidatePath('/admin/tutor-applications/window');
}

export async function toggleWindowAction(id: string) {
  await requireAdmin();

  const window = await prisma.applicationWindow.findUnique({ where: { id } });
  if (!window) throw new Error('Window not found');

  await prisma.applicationWindow.update({
    where: { id },
    data: { isOpen: !window.isOpen },
  });

  revalidatePath('/admin/tutor-applications/window');
}

export async function deleteWindowAction(id: string) {
  await requireAdmin();

  await prisma.applicationWindow.delete({ where: { id } });

  revalidatePath('/admin/tutor-applications/window');
}
