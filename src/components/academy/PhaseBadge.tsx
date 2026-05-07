import { PHASE_COLORS } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

export function PhaseBadge({ name, colorToken, className }: { name: string; colorToken: string; className?: string }) {
  const c = PHASE_COLORS[colorToken] ?? PHASE_COLORS.primary;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider", c.chip, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.bar)} />
      {name}
    </span>
  );
}