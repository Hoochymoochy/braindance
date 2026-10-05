import Link from "next/link";
import { BrainLogo } from "@/app/components/Brain-logo";
import { cn } from "@/lib/utils";

type BraindanceBrandLinkProps = {
  className?: string;
};

export default function BraindanceBrandLink({ className }: BraindanceBrandLinkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center space-x-2 transition-opacity duration-bends-fast ease-bends hover:opacity-90",
        className
      )}
    >
      <BrainLogo withText={false} className="h-6 w-6 text-brand-from" />
      <span className="text-gradient-bends text-sm font-semibold uppercase tracking-wide">
        Braindance
      </span>
    </Link>
  );
}
