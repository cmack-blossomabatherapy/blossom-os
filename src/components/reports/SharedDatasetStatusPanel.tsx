/**
 * SharedDatasetStatusPanel — one truthful status card used by every
 * shared-dataset report engine (Authorization Analysis / Hour-Based
 * Utilization / Cancellation Command Center).
 *
 * Renders exact loading / ready / missing / invalid / stale / error
 * states with filename, upload date, row count, date range, size, an
 * Admin Uploads link and a "Reload from shared source" control.
 *
 * When the caller reports `sourceMode="manual-override"`, the panel
 * shows a visible "Reset to shared source" action so the shared file is
 * never silently replaced by a user upload.
 *
 * No PHI is rendered — only file metadata.
 */
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileWarning,
  Loader2,
  RefreshCw,
  Undo2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  SharedDatasetLoadResult,
  SharedDatasetStatus,
} from "@/lib/os/reporting/sharedDatasetLoader";

export type SharedSourceMode = "shared" | "manual-override" | "none";

export interface SharedDatasetStatusPanelProps {
  title: string;
  result: SharedDatasetLoadResult;
  loading: boolean;
  sourceMode: SharedSourceMode;
  adminUploadsHref: string;
  onReload: () => void;
  onResetToShared?: () => void;
  required?: boolean;
  className?: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function statusPill(status: SharedDatasetStatus, stale: boolean) {
  if (status === "loading" || status === "idle") {
    return {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: "Loading shared source…",
      cls: "border-slate-200 bg-slate-50 text-slate-600",
    };
  }
  if (status === "error") {
    return {
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "Shared source error",
      cls: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  if (status === "missing") {
    return {
      icon: <FileWarning className="h-3 w-3" />,
      label: "No shared source uploaded",
      cls: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  if (status === "invalid") {
    return {
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "Shared source invalid",
      cls: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  if (stale) {
    return {
      icon: <Clock className="h-3 w-3" />,
      label: "Shared source stale",
      cls: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  return {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Shared source ready",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export function SharedDatasetStatusPanel(
  props: SharedDatasetStatusPanelProps,
) {
  const {
    title,
    result,
    loading,
    sourceMode,
    adminUploadsHref,
    onReload,
    onResetToShared,
    required,
    className,
  } = props;
  const status: SharedDatasetStatus = loading ? "loading" : result.status;
  const pill = statusPill(status, result.stale);
  const rowCount = result.parsed?.rowCount ?? null;
  const dateRange = result.parsed?.dateRange ?? null;

  return (
    <section
      aria-label={`${title} shared source status`}
      className={cn(
        "mt-4 rounded-2xl border border-border/60 bg-card px-4 py-3 text-[12px]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]",
                pill.cls,
              )}
            >
              {pill.icon}
              {pill.label}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {title}
            </span>
            {required && status !== "ready" && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-rose-700">
                Required
              </span>
            )}
            {sourceMode === "manual-override" && (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-700">
                Manual override
              </span>
            )}
          </div>

          {result.dataset ? (
            <div className="min-w-0 truncate text-[12.5px] font-medium text-foreground">
              {result.dataset.fileName}
            </div>
          ) : (
            <div className="text-[12.5px] text-muted-foreground">
              {status === "missing"
                ? "An admin has not uploaded this dataset yet."
                : status === "loading"
                  ? "Fetching the active shared file…"
                  : status === "error"
                    ? "Could not reach the shared source."
                    : "No shared file loaded."}
            </div>
          )}

          {result.dataset && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
              <span>Uploaded {fmtDate(result.dataset.uploadedAt)}</span>
              {result.dataset.fileSize != null && (
                <span>· {fmtSize(result.dataset.fileSize)}</span>
              )}
              {rowCount != null && (
                <span>· {rowCount.toLocaleString()} row{rowCount === 1 ? "" : "s"}</span>
              )}
              {dateRange && (
                <span>
                  · {dateRange.min} → {dateRange.max}
                </span>
              )}
              {result.ageDays != null && (
                <span>· {result.ageDays}d old</span>
              )}
            </div>
          )}

          {result.errorMessage && status !== "ready" && (
            <div className="mt-1 text-[11.5px] text-rose-600">
              {result.errorMessage}
            </div>
          )}

          {sourceMode === "manual-override" && (
            <div className="mt-1 text-[11.5px] text-indigo-700">
              A one-off upload is active. It never replaces the company shared
              source — press <em>Reset to shared source</em> to return.
            </div>
          )}

          {status === "ready" && result.stale && (
            <div className="mt-1 text-[11.5px] text-amber-700">
              This shared source has not been re-uploaded in over{" "}
              {result.ageDays ?? "?"} days. Ask an admin to refresh it.
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReload}
            disabled={loading}
            className="h-8 text-[12px]"
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Reload
          </Button>
          {sourceMode === "manual-override" && onResetToShared && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetToShared}
              disabled={loading}
              className="h-8 text-[12px]"
            >
              <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              Reset to shared source
            </Button>
          )}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-[12px]"
          >
            <Link to={adminUploadsHref}>
              {status === "missing" || status === "invalid" ? (
                <Upload className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Database className="mr-1.5 h-3.5 w-3.5" />
              )}
              Admin Uploads
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default SharedDatasetStatusPanel;