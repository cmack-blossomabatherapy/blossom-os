import type { ReactNode } from "react";
import { AlertTriangle, Clock, Download, Info, RefreshCw } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/os/reports/crPrimary/format";

export interface FreshnessInfo {
  latestUpload: string | null;
  coverageStart: string | null;
  coverageEnd: string | null;
  rowCount: number;
  batchCount: number;
  fileName: string | null;
}

export interface PrimaryReportShellProps {
  title: string;
  subtitle: string;
  freshness: FreshnessInfo;
  loading: boolean;
  /** True when no source rows are available at all. */
  empty: boolean;
  errorMessage?: string | null;
  /** Plain-language data-quality notes shown above the report body. */
  dataQualityWarnings?: string[];
  onRefresh: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
  filters?: ReactNode;
  children: ReactNode;
}

/**
 * Shared chrome for the staff-facing CentralReach reports: title, a compact
 * freshness line, refresh, CSV export, a filter slot, data-quality warnings,
 * and an honest empty state.
 *
 * These pages are staff surfaces for **every** role — including super admin.
 * There is deliberately no Data Hub link, no import/batch diagnostics, and no
 * "required export" copy anywhere in this shell: import plumbing lives only in
 * the admin Data Hub, and nothing here should ever tell a reader to go upload
 * a file.
 */
export function PrimaryReportShell({
  title,
  subtitle,
  freshness,
  loading,
  empty,
  errorMessage,
  dataQualityWarnings,
  onRefresh,
  onExport,
  exportDisabled,
  filters,
  children,
}: PrimaryReportShellProps) {
  const warnings = (dataQualityWarnings ?? []).filter(Boolean);
  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] space-y-5 p-4 md:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
            <p
              data-testid="data-freshness"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <Clock className="h-3.5 w-3.5" />
              Data current as of{" "}
              <strong className="font-medium text-foreground">
                {freshness.latestUpload ? fmtDate(freshness.latestUpload) : "unknown"}
              </strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onRefresh}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={onExport}
              disabled={exportDisabled}
              data-testid="report-export"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </header>

        {filters}

        {errorMessage && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        {warnings.length > 0 && (
          <section
            data-testid="report-data-quality"
            className="space-y-1 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400"
          >
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" /> Data quality
            </span>
            <ul className="ml-5 list-disc space-y-0.5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        {loading ? (
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
              />
            ))}
          </div>
        ) : empty ? (
          <div
            data-testid="report-empty-state"
            className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center"
          >
            <Info className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">Report data is unavailable right now</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              The data behind this report is missing or out of date, so there is nothing to show
              yet. Nothing is broken on your side. Try refreshing, and let your operations lead know
              if it stays empty.
            </p>
            <Button variant="outline" size="sm" className="mt-4 h-8 gap-1.5 text-xs" onClick={onRefresh}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        ) : (
          children
        )}
      </div>
    </OSShell>
  );
}
