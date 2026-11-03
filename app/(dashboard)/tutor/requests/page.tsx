import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { MessageSquare, CheckCircle, XCircle, Clock, Users, Search } from 'lucide-react';

export default async function TutorRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { userId } = await requireAuth(['TUTOR', 'LECTURER']);

  // Fetch tutor profile
  let tutorProfile: any = null;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (dbUser) {
      tutorProfile = await prisma.tutor.findFirst({
        where: { userId: dbUser.id },
      });
    }
  } catch (err) {
    console.error('[TutorRequests] Failed to fetch tutor profile:', err);
  }

  if (!tutorProfile) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No tutor profile found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Your tutor profile is not yet set up. Complete your application to start receiving requests.
          </p>
          <Link
            href="/apply-as-tutor/status"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            View Application Status
          </Link>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const statusFilter = params.status || '';
  const searchQuery = params.search || '';

  // Build where clause
  const where: any = { tutorId: tutorProfile.id };
  if (statusFilter) {
    where.status = statusFilter;
  }

  // Fetch requests
  let requestsData: any[] = [];
  try {
    requestsData = await prisma.tutorRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch (err) {
    console.error('[TutorRequests] Failed to fetch requests:', err);
  }

  // Filter by search query
  let requests = (Array.isArray(requestsData) ? requestsData : []).map((r: any) => ({
    ...r,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    requests = requests.filter(
      (r: any) =>
        (r.studentName?.toLowerCase().includes(q)) ||
        (r.courseNeeded?.toLowerCase().includes(q)) ||
        (r.message?.toLowerCase().includes(q))
    );
  }

  // Calculate stats
  const allRequests = (Array.isArray(requestsData) ? requestsData : []);
  const pendingCount = allRequests.filter((r: any) => r.status === 'PENDING').length;
  const acceptedCount = allRequests.filter((r: any) => r.status === 'ACCEPTED').length;
  const rejectedCount = allRequests.filter((r: any) => r.status === 'REJECTED').length;
  const completedCount = allRequests.filter((r: any) => r.status === 'COMPLETED').length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tutoring Requests</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Manage student tutoring requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={pendingCount} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Accepted" value={acceptedCount} color="text-green-600" bgColor="bg-green-50 dark:bg-green-900/20" />
        <StatCard icon={<XCircle className="w-5 h-5" />} label="Rejected" value={rejectedCount} color="text-red-600" bgColor="bg-red-50 dark:bg-red-900/20" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Completed" value={completedCount} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-900/20" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <form action="/tutor/requests" method="GET" className="flex gap-2">
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search by student name or course..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-800 dark:text-gray-100"
              />
              <select
                name="status"
                defaultValue={statusFilter}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-800 dark:text-gray-100"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Filter
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              No requests found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {searchQuery || statusFilter
                ? 'Try adjusting your filters'
                : 'Students will appear here when they request your help'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {requests.map((request: any) => (
              <div
                key={request.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {request.studentName || 'Unknown Student'}
                      </h3>
                      {request.courseNeeded && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Course: {request.courseNeeded}
                        </p>
                      )}
                      {request.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                          {request.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 ${bgColor} ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'ACCEPTED':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'REJECTED':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'COMPLETED':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  }
}
