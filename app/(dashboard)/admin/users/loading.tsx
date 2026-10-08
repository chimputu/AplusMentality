// Loading skeleton for /admin/users — matches the tabs + table layout
export default function UsersLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-4 w-64 rounded-lg bg-gray-100 animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-gray-200 animate-pulse" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 border-b border-gray-200">
        {['Students', 'Tutors', 'Admins', 'Pending'].map((tab) => (
          <div key={tab} className="h-10 w-24 rounded-t-lg bg-gray-100 animate-pulse" />
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-10 w-40 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-10 w-40 rounded-lg bg-gray-100 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-7 gap-4 p-4 border-b border-gray-200">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-gray-200 animate-pulse" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-4 p-4 border-b border-gray-100">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="h-4 rounded bg-gray-100 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
