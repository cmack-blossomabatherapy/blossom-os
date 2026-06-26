import { Link } from "react-router-dom";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Shared visual kit for Intake pages. Matches the Intake Dashboard
 * benchmark: tinted surfaces, icon chips, gradient mini-bars, and
 * generous Apple-style spacing.
 */

export type IntakeTone =
  | "primary"
  | "sky"
  | "amber"
  | "rose"
  | "violet"
  | "indigo"
  | "emerald";

export const INTAKE_TONE: Record<
  IntakeTone,
  { bg: string; ring: string; icon: string; number: string; bar: string; soft: string }
> = {
  primary: { bg: "bg-primary/[0.06]",     ring: "ring-primary/30",     icon: "bg-primary/15 text-primary",                                  number: "text-primary",                          bar: "bg-primary",      soft: "from-primary/10 via-primary/5 to-transparent" },
  sky:     { bg: "bg-sky-500/[0.06]",     ring: "ring-sky-500/30",     icon: "bg-sky-500/15 text-sky-600 dark:text-sky-400",                number: "text-sky-700 dark:text-sky-300",        bar: "bg-sky-500",      soft: "from-sky-500/10 via-sky-500/5 to-transparent" },
  amber:   { bg: "bg-amber-500/[0.06]",   ring: "ring-amber-500/30",   icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",          number: "text-amber-700 dark:text-amber-300",    bar: "bg-amber-500",    soft: "from-amber-500/10 via-amber-500/5 to-transparent" },
  rose:    { bg: "bg-rose-500/[0.06]",    ring: "ring-rose-500/30",    icon: "bg-rose-500/15 text-rose-600 dark:text-rose-400",             number: "text-rose-700 dark:text-rose-300",      bar: "bg-rose-500",     soft: "from-rose-500/10 via-rose-500/5 to-transparent" },
  violet:  { bg: "bg-violet-500/[0.06]",  ring: "ring-violet-500/30",  icon: "bg-violet-500/15 text-violet-600 dark:text-violet-400",       number: "text-violet-700 dark:text-violet-300",  bar: "bg-violet-500",   soft: "from-violet-500/10 via-violet-500/5 to-transparent" },
  indigo:  { bg: "bg-indigo-500/[0.06]",  ring: "ring-indigo-500/30",  icon: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",       number: "text-indigo-700 dark:text-indigo-300", bar: "bg-indigo-500",   soft: "from-indigo-500/10 via-indigo-500/5 to-transparent" },
  emerald: { bg: "bg-emerald-500/[0.06]", ring: "ring-emerald-500/30", icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",    number: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500", soft: "from-emerald-500/10 via-emerald-500/5 to-transparent" },
};

export function IntakeSectionHeader({
  icon: Icon,
  tone = "primary",
  title,
  subtitle,
  right,
}: {
  icon: LucideIcon;
  tone?: IntakeTone;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("grid place-items-center h-9 w-9 rounded-xl shrink-0", INTAKE_TONE[tone].icon)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export interface PulseTileSpec {
  key: string;
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  tone: IntakeTone;
  to?: string;
  onClick?: () => void;
}

export function IntakePulseStrip({
  tiles,
  loading,
}: {
  tiles: PulseTileSpec[];
  loading?: boolean;
}) {
  const total = tiles.reduce((s, t) => s + (t.value || 0), 0) || 1;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {tiles.map((p) => {
        const t = INTAKE_TONE[p.tone];
        const pct = Math.round(((p.value || 0) / total) * 100);
        const inner = (
          <>
            <div className="flex items-center justify-between">
              <div className={cn("grid place-items-center h-8 w-8 rounded-xl", t.icon)}>
                <p.icon className="h-4 w-4" />
              </div>
              {(p.to || p.onClick) && (
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition" />
              )}
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">{p.label}</p>
            <p className={cn("mt-1 text-2xl font-semibold tabular-nums", t.number)}>
              {loading ? "…" : (p.value || 0).toLocaleString()}
            </p>
            {p.hint && <p className="mt-0.5 text-[11px] text-muted-foreground/80 line-clamp-1">{p.hint}</p>}
            <div className="mt-2 h-1 rounded-full bg-muted/60 overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", t.bar)} style={{ width: `${Math.max(pct, 4)}%` }} />
            </div>
          </>
        );
        const className = cn(
          "group text-left rounded-2xl border border-border/70 p-4 transition-all duration-300",
          t.bg,
          (p.to || p.onClick) && "hover:-translate-y-0.5 hover:shadow-sm cursor-pointer",
        );
        if (p.to) {
          return (
            <Link key={p.key} to={p.to} className={className}>
              {inner}
            </Link>
          );
        }
        if (p.onClick) {
          return (
            <button key={p.key} type="button" onClick={p.onClick} className={className}>
              {inner}
            </button>
          );
        }
        return (
          <div key={p.key} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

/** Lightweight gradient card surface for grouped content blocks. */
export function IntakeToneCard({
  tone = "primary",
  className,
  children,
}: {
  tone?: IntakeTone;
  className?: string;
  children: ReactNode;
}) {
  const t = INTAKE_TONE[tone];
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-gradient-to-br p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm",
        t.soft,
        className,
      )}
    >
      {children}
    </div>
  );
}