// Loading skeleton for /student/courses — matches the card grid layout
export default function CoursesLoading() {
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

      {/* Filter bar skeleton */}
      <div className="h-10 w-full max-w-md rounded-lg bg-gray-100 animate-pulse" />

      {/* Enrolled courses section */}
      <div>
        <div className="h-6 w-40 rounded-lg bg-gray-200 animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="h-40 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-5 w-3/4 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-4 w-full rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-4 w-1/2 rounded-lg bg-gray-100 animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="h-8 flex-1 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available courses section */}
      <div>
        <div className="h-6 w-48 rounded-lg bg-gray-200 animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="h-40 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-5 w-3/4 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-4 w-full rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-4 w-1/2 rounded-lg bg-gray-100 animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="h-8 flex-1 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
