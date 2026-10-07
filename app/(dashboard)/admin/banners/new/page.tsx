import { requireAuth } from '@/lib/auth';
import BannerForm from '@/components/banner-form';

export default async function NewBannerPage() {
  await requireAuth(['ADMIN']);
  return <BannerForm />;
}
