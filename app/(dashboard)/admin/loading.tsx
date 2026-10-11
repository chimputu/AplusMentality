// Loading skeleton for the admin page — shows while data is being fetched
export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="h-10 bg-gray-200 rounded-lg w-64 animate-pulse" />

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 rounded-xl animate-pulse"
          />
        ))}
      </div>

      {/* Main content area skeleton */}
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
    </div>
  );
}
