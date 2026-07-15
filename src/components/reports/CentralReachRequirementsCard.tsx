import { FileSpreadsheet, ExternalLink, Database } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Prominent, always-visible instruction card at the top of every
 * approved report so users know exactly which CentralReach export
 * to run and which columns must be present.
 *
 * Reports that also pull from the Admin Data Uploads pipeline can
 * pass `adminUploadsHref` and `adminSourceLabel` — a small pill
 * appears indicating that the report auto-loads from that dataset
 * when data is available.
 */
export interface CentralReachRequirementsCardProps {
  exportName: string;
  requiredColumns: string[];
  filterNote?: string;
  adminUploadsHref?: string;
  adminSourceLabel?: string;
}

export function CentralReachRequirementsCard({
  exportName,
  requiredColumns,
  filterNote,
  adminUploadsHref,
  adminSourceLabel,
}: CentralReachRequirementsCardProps) {
  return (
    <section
      aria-label="Required CentralReach export"
      className="mt-4 rounded-2xl border border-border/60 bg-gradient-to-br from-[hsl(215_90%_98%)] to-[hsl(230_90%_98%)] p-4"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[hsl(215_80%_45%)] shadow-sm">
          <FileSpreadsheet className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(215_80%_45%)]">
              Required CentralReach export
            </p>
            {adminUploadsHref && (
              <Link
                to={adminUploadsHref}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 hover:bg-emerald-100"
              >
                <Database className="h-3 w-3" />
                {adminSourceLabel ?? "Auto-loads from Admin Uploads"}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
          <p className="text-[13px] font-medium text-foreground">{exportName}</p>
          <div className="flex flex-wrap gap-1.5">
            {requiredColumns.map((c) => (
              <span
                key={c}
                className="rounded-md border border-border/60 bg-white/70 px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
          {filterNote && (
            <p className="text-[11.5px] text-muted-foreground">{filterNote}</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default CentralReachRequirementsCard;