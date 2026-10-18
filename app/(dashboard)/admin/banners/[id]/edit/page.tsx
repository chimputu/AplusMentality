import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BannerForm from '@/components/banner-form';

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  const { id } = await params;

  const banner = await prisma.banner.findUnique({
    where: { id },
    include: {
      targets: {
        select: {
          institutionId: true,
        },
      },
    },
  });
  if (!banner) {
    notFound();
  }
  const b = banner!;

  const institutionIds = b.targets.map((t) => t.institutionId);

  const initialData = {
    title: b.title,
    message: b.message,
    ctaLabel: b.ctaLabel || '',
    ctaUrl: b.ctaUrl || '',
    imageUrl: b.imageUrl || '',
    variant: b.variant,
    placement: b.placement,
    startsAt: b.startsAt.toISOString().slice(0, 16),
    endsAt: b.endsAt ? b.endsAt.toISOString().slice(0, 16) : '',
    isActive: b.isActive,
    priority: b.priority,
    scope: b.scope,
    institutionIds,
  };

  return <BannerForm bannerId={id} initialData={initialData} />;
}
