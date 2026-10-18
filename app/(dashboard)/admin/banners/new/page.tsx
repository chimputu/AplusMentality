import { requireAuth } from '@/lib/auth';
import BannerForm from '@/components/banner-form';

export default async function NewBannerPage() {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  return <BannerForm />;
}
