import { AlertTriangle, CheckCircle2, Clock, Database, FileWarning, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReportSourceCoverage } from "@/hooks/useReportSourceCoverage";
import {
  CANONICAL_REPORT_LABELS,
  type CanonicalReportKey,
  type ReportSourceCoverage,
} from "@/lib/os/reporting/canonicalSource";

export interface SourceCoverageBannerProps {
  reportKey: CanonicalReportKey | CanonicalReportKey[];
  className?: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtNum(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function statusPill(status: ReportSourceCoverage["status"]) {
  switch (status) {
    case "ready":
      return {
        icon: <CheckCircle2 className="h-3 w-3" />,
        label: "Ready",
        cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "stale":
      return {
        icon: <Clock className="h-3 w-3" />,
        label: "Stale",
        cls: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "missing":
      return {
        icon: <FileWarning className="h-3 w-3" />,
        label: "No source uploaded",
        cls: "border-rose-200 bg-rose-50 text-rose-700",
      };
    default:
      return {
        icon: <AlertTriangle className="h-3 w-3" />,
        label: "Error",
        cls: "border-rose-200 bg-rose-50 text-rose-700",
      };
  }
}

/**
 * Truthful source-coverage banner for canonical /reports pages.
 *
 * Renders loading / error / empty / ready / stale states with the actual
 * uploaded file name, upload time, date range, row count, and unmapped
 * provider count from the `report_source_coverage()` RPC. No PHI.
 */
export function SourceCoverageBanner({ reportKey, className }: SourceCoverageBannerProps) {
  const { data, loading, error } = useReportSourceCoverage(reportKey);

  if (loading) {
    return (
      <section
        aria-label="Report source coverage"
        className={cn(
          "mt-4 flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-[12px] text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking source coverage…
      </section>
    );
  }

  if (error) {
    return (
      <section
        aria-label="Report source coverage error"
        className={cn(
          "mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700",
          className,
        )}
      >
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
        <div>
          <div className="font-semibold">Source coverage unavailable</div>
          <div>{error}</div>
        </div>
      </section>
    );
  }

  const rows = data ?? [];
  const keys = Array.isArray(reportKey) ? reportKey : [reportKey];

  if (rows.length === 0) {
    return (
      <section
        aria-label="Report source coverage empty"
        className={cn(
          "mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800",
          className,
        )}
      >
        <div className="flex items-center gap-2 font-semibold">
          <FileWarning className="h-3.5 w-3.5" /> No source data found
        </div>
        <div className="mt-1 text-amber-700">
          {keys.map((k) => CANONICAL_REPORT_LABELS[k]).join(", ")} has no active
          upload yet. Ask an admin to upload the required CentralReach export.
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Report source coverage"
      className={cn(
        "mt-4 space-y-2 rounded-2xl border border-border/60 bg-gradient-to-br from-[hsl(215_90%_98%)] to-[hsl(230_90%_98%)] p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[hsl(215_80%_45%)] shadow-sm">
          <Database className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(215_80%_45%)]">
          Source coverage
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const pill = statusPill(row.status);
          return (
            <div
              key={row.reportKey}
              className="rounded-xl border border-border/50 bg-white/70 p-3 text-[12px]"
              data-testid={`source-coverage-${row.reportKey}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  {CANONICAL_REPORT_LABELS[row.reportKey] ?? row.reportKey}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                    pill.cls,
                  )}
                >
                  {pill.icon}
                  {pill.label}
                </span>
              </div>
              <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                <dt>Source file</dt>
                <dd className="truncate text-right font-mono text-foreground" title={row.sourceFileName ?? ""}>
                  {row.sourceFileName ?? "—"}
                </dd>
                <dt>Uploaded</dt>
                <dd className="text-right text-foreground">
                  {fmtDate(row.uploadedAt)}
                  {row.ageDays != null && <span className="ml-1 text-muted-foreground">({row.ageDays}d)</span>}
                </dd>
                {row.serviceDateMin && (
                  <>
                    <dt>Date range</dt>
                    <dd className="text-right text-foreground">
                      {fmtDate(row.serviceDateMin)} → {fmtDate(row.serviceDateMax)}
                    </dd>
                  </>
                )}
                {row.rowCount != null && (
                  <>
                    <dt>Rows</dt>
                    <dd className="text-right text-foreground">{fmtNum(row.rowCount)}</dd>
                  </>
                )}
                {row.unmappedProviders != null && row.distinctProviders != null && (
                  <>
                    <dt>Providers mapped</dt>
                    <dd className="text-right text-foreground">
                      {fmtNum(row.distinctProviders - row.unmappedProviders)} / {fmtNum(row.distinctProviders)}
                    </dd>
                  </>
                )}
              </dl>
              {row.unmappedProviders != null && row.unmappedProviders > 0 && (
                <p className="mt-1.5 text-[11px] text-amber-700">
                  {fmtNum(row.unmappedProviders)} provider{row.unmappedProviders === 1 ? "" : "s"} not yet
                  reconciled to an employee.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default SourceCoverageBanner;