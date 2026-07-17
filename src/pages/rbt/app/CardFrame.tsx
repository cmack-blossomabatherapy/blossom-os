import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type State = "loading" | "empty" | "success" | "stale" | "error";

export function CardFrame({
  title, subtitle, state, staleLabel, errorLabel, emptyLabel, children, action, className,
}: {
  title: string;
  subtitle?: string | null;
  state: State;
  staleLabel?: string;
  errorLabel?: string;
  emptyLabel?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-card text-card-foreground border border-border/70 p-5",
        "shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_20%/0.08)]",
        className,
      )}
      aria-busy={state === "loading"}
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight truncate">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
        {state === "stale" && (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {staleLabel ?? "Stale"}
          </span>
        )}
      </header>

      {state === "loading" && (
        <div className="space-y-2" aria-hidden="true">
          <div className="h-3 rounded bg-muted animate-pulse w-3/4" />
          <div className="h-3 rounded bg-muted animate-pulse w-1/2" />
        </div>
      )}
      {state === "error" && (
        <p className="text-sm text-destructive">{errorLabel ?? "We could not load this right now."}</p>
      )}
      {state === "empty" && (
        <p className="text-sm text-muted-foreground">{emptyLabel ?? "Nothing to show yet."}</p>
      )}
      {(state === "success" || state === "stale") && children}

      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}