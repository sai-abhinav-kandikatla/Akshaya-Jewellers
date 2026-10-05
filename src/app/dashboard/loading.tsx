export default function DashboardLoading() {
  return (
    <div className="dashboard-page" aria-label="Loading dashboard">
      <div className="page-header mb-8">
        <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}
