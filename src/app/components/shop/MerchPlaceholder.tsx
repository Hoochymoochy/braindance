import { cn } from "@/lib/utils";

type MerchPlaceholderProps = {
  name: string;
  accentFrom: string;
  accentTo: string;
  className?: string;
  /** Larger wordmark treatment for PDP */
  featured?: boolean;
};

/** Temporary product visual until real photos / print files land. */
export function MerchPlaceholder({
  name,
  accentFrom,
  accentTo,
  className,
  featured = false,
}: MerchPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-zinc-950",
        featured ? "aspect-[4/5] min-h-[320px]" : "aspect-[4/5]",
        className
      )}
      style={{
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 20% 10%, ${accentFrom}33, transparent 55%),
          radial-gradient(ellipse 70% 50% at 85% 90%, ${accentTo}40, transparent 50%),
          linear-gradient(160deg, #0a0a0a 0%, #18181b 55%, #09090b 100%)
        `,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span
          className={cn(
            "font-bold uppercase tracking-[0.22em] text-white/90",
            featured ? "text-sm sm:text-base" : "text-[10px] sm:text-xs"
          )}
        >
          Braindance
        </span>
        <span
          className={cn(
            "max-w-[14ch] font-semibold leading-tight tracking-tight text-white",
            featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
          )}
        >
          {name}
        </span>
        <span
          className="mt-2 h-px w-16"
          style={{
            backgroundImage: `linear-gradient(to right, ${accentFrom}, ${accentTo})`,
          }}
        />
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] uppercase tracking-[0.18em] text-white/40">
        <span>Merch</span>
        <span>Preview</span>
      </div>
    </div>
  );
}
