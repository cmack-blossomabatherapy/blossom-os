import type { ReactNode } from "react";
import { Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Staff-facing provenance line: what the numbers on this report are computed
 * from, and where the source data is incomplete. This is deliberately plain
 * language — no batch ids, file names, or import plumbing.
 */
export function ReportProvenance({
  children,
  tone = "info",
  className,
}: {
  children: ReactNode;
  tone?: "info" | "warn";
  className?: string;
}) {
  const Icon = tone === "warn" ? TriangleAlert : Info;
  return (
    <p
      data-testid="report-provenance"
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px] leading-relaxed",
        tone === "warn"
          ? "border-amber-500/40 bg-amber-500/[0.05] text-amber-700 dark:text-amber-400"
          : "border-border/60 bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      <Icon className="mt-[1px] h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Explicit "we cannot compute this yet" panel used instead of showing zeros. */
export function ReportInsufficientData({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div
      data-testid="report-insufficient-data"
      className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center"
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xl text-xs text-muted-foreground">{detail}</p>
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}
