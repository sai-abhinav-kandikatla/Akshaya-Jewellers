export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F5]" aria-label="Loading page">
      <div className="flex flex-col items-center gap-3 text-[#3E2723]">
        <div className="loading-spinner" />
        <span className="text-sm">Loading…</span>
      </div>
    </main>
  );
}
