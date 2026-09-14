export default function StreamRouteLoading() {
  return (
    <div className="page-bends-bg fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-zinc-900">
      <div
        className="h-14 w-14 animate-spin rounded-full border-2 border-brand-to/30 border-t-brand-from border-r-brand-via/70"
        aria-hidden
      />
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-brand-from/90">
          Braindance
        </p>
        <p className="bg-gradient-to-r from-brand-from via-brand-via to-brand-to bg-clip-text text-lg font-semibold text-transparent">
          Loading stream…
        </p>
        <p className="mx-auto max-w-xs text-sm text-[#7a7a7a]">
          Hang tight while we prepare your player.
        </p>
      </div>
    </div>
  );
}
