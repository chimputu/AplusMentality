import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BannerForm from '@/components/banner-form';

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth(['ADMIN']);

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

  const institutionIds = banner.targets.map((t) => t.institutionId);

  const initialData = {
    title: banner.title,
    message: banner.message,
    ctaLabel: banner.ctaLabel || '',
    ctaUrl: banner.ctaUrl || '',
    imageUrl: banner.imageUrl || '',
    variant: banner.variant,
    placement: banner.placement,
    startsAt: banner.startsAt.toISOString().slice(0, 16),
    endsAt: banner.endsAt ? banner.endsAt.toISOString().slice(0, 16) : '',
    isActive: banner.isActive,
    priority: banner.priority,
    scope: banner.scope,
    institutionIds,
  };

  return <BannerForm bannerId={id} initialData={initialData} />;
}
