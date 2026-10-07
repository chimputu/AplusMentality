'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { uploadTutorPhoto, deleteTutorPhoto } from '@/lib/cloudinary';

// ============================================
// Internal Helpers
// ============================================

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}

// ============================================
// Server Actions
// ============================================

export async function uploadTutorImage(formData: FormData) {
  await requireAdmin();

  const file = formData.get('file') as File | null;
  const tutorId = formData.get('tutorId') as string | null;

  if (!tutorId) {
    throw new Error('Tutor ID is required');
  }

  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, or WebP images are allowed');
  }

  // Validate file size (5 MB max)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be under 5 MB');
  }

  // Check tutor exists
  const tutor = await prisma.tutor.findUnique({ where: { id: tutorId } });
  if (!tutor) {
    throw new Error('Tutor not found');
  }

  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Generate public ID
  const publicId = `tutor-${tutorId}-${Date.now()}`;

  // Upload to Cloudinary
  const result = await uploadTutorPhoto(buffer, publicId);

  // Delete previous Cloudinary asset if exists
  if (tutor.profileImagePublicId) {
    await deleteTutorPhoto(tutor.profileImagePublicId);
  }

  // Update tutor record
  await prisma.tutor.update({
    where: { id: tutorId },
    data: {
      avatarUrl: result.secure_url,
      profileImagePublicId: result.public_id,
    },
  });

  revalidatePath('/admin/tutors');
  revalidatePath(`/admin/tutors/${tutorId}`);
  revalidatePath('/student/tutors');

  return {
    success: true,
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function deleteTutorImage(tutorId: string) {
  await requireAdmin();

  const tutor = await prisma.tutor.findUnique({ where: { id: tutorId } });
  if (!tutor) {
    throw new Error('Tutor not found');
  }

  // Delete Cloudinary asset if exists
  if (tutor.profileImagePublicId) {
    await deleteTutorPhoto(tutor.profileImagePublicId);
  }

  // Clear fields in database
  await prisma.tutor.update({
    where: { id: tutorId },
    data: {
      avatarUrl: null,
      profileImagePublicId: null,
    },
  });

  revalidatePath('/admin/tutors');
  revalidatePath(`/admin/tutors/${tutorId}`);
  revalidatePath('/student/tutors');

  return { success: true };
}
