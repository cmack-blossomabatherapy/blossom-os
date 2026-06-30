import { ReactNode } from "react";
import { Database, Inbox, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pass 5b primary-render surface for live Recruiting workflow tables.
 *
 * Each operational page (Escalations / Follow-Ups / Messages / Staffing Needs)
 * renders this section above any legacy candidate-derived suggestions. The
 * `items` prop MUST be the array returned by the corresponding live hook
 * (`useRecruitingEscalations`, `useRecruitingFollowups`,
 * `useRecruitingMessages`, `useRecruitingStaffingNeeds`) so the page's
 * rendered source of truth is the database row, not a synthetic builder.
 *
 * When the live table is empty we show an honest empty state instead of
 * falling back to synthetic data — that is the entire point of Pass 5.
 */

export interface LiveRowRender<TRow> {
  row: TRow;
  // Render hook gives the page full control over the row markup so each page
  // keeps its own visual language.
  render: (row: TRow) => ReactNode;
}

export interface LiveRecruitingSectionProps<TRow> {
  /** Visible section title, e.g. "Live escalations". */
  title: string;
  /** Sub-label describing what is being rendered, e.g. "From recruiting_escalations". */
  subtitle: string;
  /** The live rows. This MUST come straight from a Recruiting live hook. */
  items: TRow[];
  loading?: boolean;
  /** Render each live row. */
  renderRow: (row: TRow, index: number) => ReactNode;
  /** Optional table identifier — surfaced as data-source for tests/observability. */
  tableName: string;
  /** Empty-state copy override. */
  emptyTitle?: string;
  emptyBody?: string;
  /** Optional bulk action slot rendered in the header. */
  headerAction?: ReactNode;
  className?: string;
}

export function LiveRecruitingSection<TRow>({
  title,
  subtitle,
  items,
  loading,
  renderRow,
  tableName,
  emptyTitle,
  emptyBody,
  headerAction,
  className,
}: LiveRecruitingSectionProps<TRow>) {
  return (
    <section
      data-recruiting-live-source={tableName}
      className={cn("rounded-2xl bg-card border border-border/70 p-4", className)}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-primary/10 text-primary border-primary/20">
            <CheckCircle2 className="size-3" />
            {loading ? "Loading…" : `${items.length} live`}
          </span>
          {headerAction}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-muted/40 border border-border/60 p-6 text-center">
          <p className="text-xs text-muted-foreground">Loading live records…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-muted/40 border border-border/60 p-8 text-center">
          <Inbox className="size-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">{emptyTitle ?? "No live records yet"}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            {emptyBody ?? (
              <>
                When Recruiting starts persisting rows to <code className="font-mono">{tableName}</code>,
                they will appear here. Suggestions below are computed from the candidate pipeline
                and are not stored.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((row, idx) => (
            <div key={idx}>{renderRow(row, idx)}</div>
          ))}
        </div>
      )}
    </section>
  );
}

export function LiveRowCard({
  title,
  meta,
  badges,
  actions,
  tone = "info",
}: {
  title: string;
  meta?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  tone?: "info" | "warn" | "crit" | "ok" | "muted";
}) {
  const toneClass =
    tone === "crit" ? "bg-destructive/10 text-destructive border-destructive/20"
    : tone === "warn" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
    : tone === "ok" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
    : tone === "muted" ? "bg-muted text-muted-foreground border-border/60"
    : "bg-primary/10 text-primary border-primary/20";
  return (
    <div className="rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center gap-3">
      <div className={cn("size-9 rounded-full grid place-items-center border", toneClass)}>
        <AlertTriangle className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{title}</span>
          {badges}
        </div>
        {meta && <div className="text-[11px] text-muted-foreground truncate mt-0.5">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
}
