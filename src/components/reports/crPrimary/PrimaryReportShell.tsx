import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Database, Download, RefreshCw, Clock, Rows3, CalendarRange } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtCount, fmtDate } from "@/lib/os/reports/crPrimary/format";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";

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
  /** Short list of CentralReach exports this report consumes. */
  requiredExports: string[];
  freshness: FreshnessInfo;
  loading: boolean;
  /** True when no source rows are available at all. */
  empty: boolean;
  errorMessage?: string | null;
  onRefresh: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
  filters?: ReactNode;
  children: ReactNode;
}

/**
 * Shared chrome for the 8 primary CentralReach-backed reports: title,
 * data-freshness indicator, refresh, CSV export, filter slot, and the exact
 * empty state that points operators at the CentralReach Data Hub.
 *
 * There are intentionally NO upload controls here — all CentralReach files
 * are uploaded once in the Data Hub.
 */
export function PrimaryReportShell({
  title,
  subtitle,
  requiredExports,
  freshness,
  loading,
  empty,
  errorMessage,
  onRefresh,
  onExport,
  exportDisabled,
  filters,
  children,
}: PrimaryReportShellProps) {
  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] space-y-5 p-4 md:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
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

        <section
          data-testid="data-freshness"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-xs"
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Database className="h-3.5 w-3.5 text-primary" /> CentralReach Data Freshness
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Latest upload:{" "}
            <strong className="text-foreground">{fmtDate(freshness.latestUpload)}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" /> Coverage:{" "}
            <strong className="text-foreground">
              {freshness.coverageStart || freshness.coverageEnd
                ? `${fmtDate(freshness.coverageStart)} – ${fmtDate(freshness.coverageEnd)}`
                : "Not reported"}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Rows3 className="h-3.5 w-3.5" /> Rows:{" "}
            <strong className="text-foreground">{fmtCount(freshness.rowCount)}</strong>
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {fmtCount(freshness.batchCount)} import batch{freshness.batchCount === 1 ? "" : "es"}
          </Badge>
          <Link
            to="/system/centralreach-data-hub"
            className="ml-auto text-[11px] font-medium text-primary hover:underline"
          >
            Open CentralReach Data Hub →
          </Link>
        </section>

        {filters}

        {errorMessage && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-border/60 bg-muted/40" />
            ))}
          </div>
        ) : empty ? (
          <div
            data-testid="report-empty-state"
            className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center"
          >
            <Database className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">No CentralReach data available yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              This report reads normalized CentralReach data. Required export
              {requiredExports.length === 1 ? "" : "s"}:{" "}
              <strong className="text-foreground">{requiredExports.join(", ")}</strong>. Upload
              {requiredExports.length === 1 ? " it" : " them"} once in the CentralReach Data Hub and
              every report updates automatically.
            </p>
            <Button asChild size="sm" className="mt-4 h-8 text-xs">
              <Link to="/system/centralreach-data-hub">Go to CentralReach Data Hub</Link>
            </Button>
          </div>
        ) : (
          children
        )}
      </div>
    </OSShell>
  );
}