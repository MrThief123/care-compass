export default function StaffLoading() {
  return (
    <div
      role="status"
      aria-label="Loading staff"
      className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_360px]"
    >
      <span className="sr-only">Loading staff</span>
      <div aria-hidden className="h-[520px] animate-pulse rounded-card bg-bg-surface" />
      <div aria-hidden className="h-[520px] animate-pulse rounded-card bg-bg-surface" />
    </div>
  );
}
