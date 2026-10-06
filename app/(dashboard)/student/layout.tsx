// app/(dashboard)/student/layout.tsx
import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { StudentChatbot } from '@/components/ai/StudentChatbot';
import { redirect } from 'next/navigation';

interface StudentLayoutProps {
  children: ReactNode;
}

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const { role, user } = await requireAuth(['STUDENT']);

  // Force onboarding if profile incomplete (check both new institution and legacy university fields)
  const hasInstitutionProfile = user.institutionId && user.programmeId && user.year;
  const hasUniversityProfile = user.universityId && user.programmeId && user.year;
  if (!hasInstitutionProfile && !hasUniversityProfile && !user.onboarded) {
    redirect('/onboarding');
  }

  return (
    <DashboardLayout role={role}>
      {children}
      <StudentChatbot />
    </DashboardLayout>
  );
}