import { ReactNode } from "react";
import { OSShell } from "../OSShell";

export {
  OpsCard as MktgCard,
  HealthPill,
  MetricTile,
  EmptyRow,
  AIPrompt,
  ActionPill,
  type HealthTone,
} from "../operations/_shared";

export function MktgPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <OSShell>
      <div className="space-y-6 pb-12">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Marketing Team
            </div>
            <h1 className="mt-1 text-2xl md:text-[28px] font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-[13.5px] text-muted-foreground max-w-2xl">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        {children}
      </div>
    </OSShell>
  );
}

/** Horizontal bar showing a share value 0-100. Calm, semantic colors only. */
export function ShareBar({ value, tone = "neutral" }: { value: number; tone?: "primary" | "accent" | "muted" | "neutral" }) {
  const pct = Math.max(0, Math.min(100, value));
  const fillClass =
    tone === "primary"
      ? "bg-primary/70"
      : tone === "accent"
      ? "bg-emerald-500/70"
      : tone === "muted"
      ? "bg-muted-foreground/40"
      : "bg-foreground/30";
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${fillClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}