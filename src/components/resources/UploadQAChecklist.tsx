import { useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** The exact item labels the Pass 4 runbook and tests rely on. */
export const UPLOAD_QA_ITEMS = [
  "Files classified before upload",
  "Only ready files selected",
  "No held files included",
  "Role assignments reviewed",
  "State scope reviewed",
  "Sensitive keywords checked",
  "Upload completed",
  "Open/download tested",
  "Normal user visibility checked",
  "Admin queue reviewed",
  "Failed uploads retried or removed",
] as const;

/**
 * Calm, local-state QA checklist for Resource Library batch uploads.
 * No persistence — admins use it as a per-batch checklist while uploading.
 */
export function UploadQAChecklist() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (item: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  const completed = done.size;
  const total = UPLOAD_QA_ITEMS.length;

  return (
    <section
      data-testid="upload-qa-checklist"
      aria-label="Upload QA checklist"
      className="space-y-3 rounded-2xl border border-border/60 bg-card p-5"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">Upload QA checklist</h2>
            <p className="text-[11.5px] text-muted-foreground">
              Run through this once per batch before walking away.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
          {completed}/{total}
        </span>
      </header>

      <ul className="grid gap-1.5 md:grid-cols-2">
        {UPLOAD_QA_ITEMS.map((item) => {
          const isDone = done.has(item);
          return (
            <li key={item}>
              <button
                type="button"
                data-testid="upload-qa-item"
                onClick={() => toggle(item)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[12.5px] transition-colors",
                  isDone
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-border/60 bg-card hover:bg-muted/40",
                )}
                aria-pressed={isDone}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn(isDone && "line-through")}>{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default UploadQAChecklist;