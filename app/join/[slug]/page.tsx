import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import JoinForm from './join-form';

export default async function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { userId: clerkUserId } = await auth();

  // Check Institution first (via its slug field)
  const institution = await prisma.institution.findUnique({
    where: { slug },
    include: {
      programmes: {
        include: {
          faculty: true,
          branches: true,
        },
      },
      levels: true,
    },
  });

  if (institution) {
    // If user is authenticated, show the join form for auto-enrollment
    if (clerkUserId) {
      return (
        <JoinForm
          slug={slug}
          orgName={institution.name}
          programmes={institution.programmes}
          levels={institution.levels}
          hasBranches={institution.hasBranches}
        />
      );
    }
    redirect(`/onboarding?slug=${encodeURIComponent(slug)}&type=institution`);
  }

  // Then check University (via its joinSlug field)
  const university = await prisma.university.findUnique({
    where: { joinSlug: slug },
    include: {
      programmes: {
        include: {
          faculty: true,
          branches: true,
        },
      },
    },
  });

  if (university) {
    // If user is authenticated, show the join form for auto-enrollment
    if (clerkUserId) {
      return (
        <JoinForm
          slug={slug}
          orgName={university.name}
          programmes={university.programmes}
        />
      );
    }
    redirect(`/onboarding?slug=${encodeURIComponent(slug)}&type=university`);
  }

  // Not found
  notFound();
}
