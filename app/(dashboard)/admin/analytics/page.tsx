export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth';
import AnalyticsClientWrapper from './AnalyticsClientWrapper';

export default async function AnalyticsPage() {
  await requireAuth(['ADMIN', 'SUPER_ADMIN']);
  return <AnalyticsClientWrapper />;
}
