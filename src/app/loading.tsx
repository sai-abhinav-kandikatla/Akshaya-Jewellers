export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-[#111111]" aria-label="Loading page">
      <div className="flex flex-col items-center gap-3 text-[#111111]">
        <div className="loading-spinner" />
        <span className="text-sm">Loading…</span>
      </div>
    </main>
  );
}
