import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/resources/resourceData";

export interface BatchSummaryCounts {
  ready_to_upload: number;
  published: number;
  privacy_review: number;
  business_review: number;
  needs_conversion: number;
  vault_only: number;
  excluded: number;
  failed: number;
}

/**
 * Pure helper — counts published items in the persisted catalog and pulls
 * candidate/error counts from the bulk upload panel.
 */
export function computeBatchSummary(
  resources: Resource[],
  candidateCounts: Partial<Record<string, number>>,
  failedCount: number,
): BatchSummaryCounts {
  const publishedFromCatalog = resources.filter(
    (r) =>
      (r.uploadStatus ?? "published") === "published" &&
      r.status === "Published",
  ).length;
  return {
    ready_to_upload:  candidateCounts.ready_to_upload  ?? 0,
    published:        publishedFromCatalog,
    privacy_review:   candidateCounts.privacy_review   ?? 0,
    business_review:  candidateCounts.business_review  ?? 0,
    needs_conversion: candidateCounts.needs_conversion ?? 0,
    vault_only:       candidateCounts.vault_only       ?? 0,
    excluded:         candidateCounts.excluded         ?? 0,
    failed:           failedCount,
  };
}

const CARDS: { key: keyof BatchSummaryCounts; label: string; tone: string }[] = [
  { key: "ready_to_upload",  label: "Ready to upload",  tone: "text-foreground" },
  { key: "published",        label: "Published",        tone: "text-emerald-700" },
  { key: "privacy_review",   label: "Privacy review",   tone: "text-amber-700" },
  { key: "business_review",  label: "Business review",  tone: "text-amber-700" },
  { key: "needs_conversion", label: "Needs conversion", tone: "text-slate-600" },
  { key: "vault_only",       label: "Vault only",       tone: "text-slate-600" },
  { key: "excluded",         label: "Excluded",         tone: "text-rose-700" },
  { key: "failed",           label: "Failed upload",    tone: "text-rose-700" },
];

export function UploadBatchSummary({ counts }: { counts: BatchSummaryCounts }) {
  return (
    <section
      data-testid="upload-batch-summary"
      aria-label="Upload batch summary"
      className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8"
    >
      {CARDS.map((c) => (
        <div
          key={c.key}
          data-testid={`batch-summary-${c.key}`}
          className="rounded-2xl border border-border/60 bg-card p-3"
        >
          <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {c.label}
          </div>
          <div className={cn("mt-1 text-[20px] font-semibold tracking-tight", c.tone)}>
            {counts[c.key]}
          </div>
        </div>
      ))}
    </section>
  );
}

export default UploadBatchSummary;