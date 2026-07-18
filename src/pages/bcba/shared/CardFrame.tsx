import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock3 } from "lucide-react";

export type CardState = "loading" | "empty" | "success" | "stale" | "error";

export type CardPriority = "urgent" | "high" | "normal" | "low";

const priorityRing: Record<CardPriority, string> = {
  urgent: "ring-1 ring-destructive/40",
  high:   "ring-1 ring-primary/30",
  normal: "",
  low:    "",
};

/**
 * Reusable BCBA dashboard card frame.
 *
 * Supports every required visual state (loading / empty / stale / error / success),
 * shows a freshness/data-source line, exposes an action slot, and stays fully
 * responsive so it never forces horizontal scroll on mobile.
 */
export function BcbaCardFrame({
  title,
  subtitle,
  state,
  priority = "normal",
  dataSource,
  freshness,
  emptyLabel,
  errorLabel,
  staleLabel,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string | null;
  state: CardState;
  priority?: CardPriority;
  dataSource?: string | null;
  freshness?: string | null;
  emptyLabel?: string;
  errorLabel?: string;
  staleLabel?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-card text-card-foreground border border-border/70 p-5",
        "shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_20%/0.08)]",
        "transition-shadow",
        priorityRing[priority],
        className,
      )}
      aria-busy={state === "loading"}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 text-muted-foreground shrink-0" aria-hidden="true">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {state === "stale" && (
          <span
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground shrink-0"
            title={freshness ?? undefined}
          >
            <Clock3 className="h-3 w-3" strokeWidth={1.75} />
            {staleLabel ?? "Stale"}
          </span>
        )}
      </header>

      <div className="mt-3 min-w-0">
        {state === "loading" && (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-3 rounded bg-muted animate-pulse w-3/4" />
            <div className="h-3 rounded bg-muted animate-pulse w-1/2" />
          </div>
        )}

        {state === "error" && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.75} />
            <p>{errorLabel ?? "We could not load this right now."}</p>
          </div>
        )}

        {state === "empty" && (
          <p className="text-sm text-muted-foreground">
            {emptyLabel ?? "You're all caught up."}
          </p>
        )}

        {(state === "success" || state === "stale") && (
          <div className="text-sm text-foreground">{children}</div>
        )}
      </div>

      {(dataSource || freshness) && state !== "loading" && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {dataSource ? `Source · ${dataSource}` : null}
          {dataSource && freshness ? " · " : null}
          {freshness}
        </p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}