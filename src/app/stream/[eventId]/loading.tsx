export default function StreamRouteLoading() {
  return (
    <div className="fixed inset-0 z-[100] min-h-screen bg-black thermal-background text-white flex flex-col items-center justify-center gap-8 px-6">
      <div
        className="h-14 w-14 rounded-full border-2 border-purple-500/25 border-t-pink-400 border-r-purple-400/60 animate-spin"
        aria-hidden
      />
      <div className="text-center space-y-2">
        <p className="text-xs font-medium tracking-[0.35em] uppercase text-purple-300/90">
          Braindance
        </p>
        <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Loading stream…
        </p>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Hang tight while we prepare your player.
        </p>
      </div>
    </div>
  );
}
