import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import { getActiveGlobalAnnouncement } from '@/lib/actions/banner';
import DashboardLayout from '@/components/DashboardLayout';
import { AIAssistantLazy } from '@/components/ai/ai-assistant-lazy';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // ✅ Protect ALL admin routes — requireAuth handles redirect on failure
  const { role, user } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);

  // Defensive guard: requireAuth redirects on failure, but defend against edge cases
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Unable to load admin dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Please log in again.</p>
        </div>
      </div>
    );
  }
  const u = user;

  // Handle missing institution gracefully
  const institutionName = u.institution?.shortName ?? u.institution?.name ?? null;

  // Fetch active global announcement for StickyBanner — wrap in try/catch so a Prisma
  // schema mismatch in the Banner table doesn't crash the entire layout
  let announcement = null;
  try {
    announcement = await getActiveGlobalAnnouncement();
  } catch (err) {
    console.error('[AdminLayout] Failed to fetch global announcement:', err);
  }

  return (
    <DashboardLayout role={role} announcement={announcement}>
      <div className="w-full">
        {children}
      </div>
      {/* AI assistant is dynamically loaded to avoid blocking initial page render (~500KB AI SDK) */}
      <AIAssistantLazy
        userFirstName={u.firstName ?? null}
        userRole={u.role ?? null}
        userInstitution={institutionName}
      />
    </DashboardLayout>
  );
}