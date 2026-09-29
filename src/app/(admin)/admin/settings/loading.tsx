export default function SettingsLoading() {
  return (
    <div role="status" aria-label="Loading settings" className="max-w-[1088px] space-y-5 p-6">
      <span className="sr-only">Loading settings</span>
      <div aria-hidden className="h-72 animate-pulse rounded-card bg-bg-surface" />
      <div aria-hidden className="h-28 animate-pulse rounded-card bg-bg-surface" />
    </div>
  );
}
