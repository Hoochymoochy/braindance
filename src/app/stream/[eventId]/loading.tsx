export default function StreamRouteLoading() {
  return (
    <div
      className="page-bends-bg fixed inset-0 z-[100] flex h-dvh flex-col items-center justify-center gap-5 px-6"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div
        className="h-14 w-14 animate-spin rounded-full border-2 border-brand-to/30 border-t-brand-from border-r-brand-via/70"
        aria-hidden
      />
      <p className="text-lg font-medium tracking-wide text-zinc-900 dark:text-zinc-100">
        Loading
        <span
          className="inline-block animate-[loading-dots_1.2s_steps(4,end)_infinite] overflow-hidden whitespace-nowrap align-bottom"
          aria-hidden
        >
          ...
        </span>
      </p>
    </div>
  );
}
