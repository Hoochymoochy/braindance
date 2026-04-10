export default function StreamRouteLoading() {
  return (
    <div className="page-bends-bg fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-white">
      <div
        className="h-14 w-14 animate-spin rounded-full border-2 border-[#3700ff]/30 border-t-[#00ccff] border-r-[#ff00f7]/70"
        aria-hidden
      />
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#00ccff]/90">
          Braindance
        </p>
        <p className="bg-gradient-to-r from-[#00ccff] via-[#ff00f7] to-[#3700ff] bg-clip-text text-lg font-semibold text-transparent">
          Loading stream…
        </p>
        <p className="mx-auto max-w-xs text-sm text-[#7a7a7a]">
          Hang tight while we prepare your player.
        </p>
      </div>
    </div>
  );
}
