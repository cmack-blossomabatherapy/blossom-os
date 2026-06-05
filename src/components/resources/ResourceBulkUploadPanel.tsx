import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload, ShieldAlert, FileWarning, ScanLine, Lock, Ban,
  CheckCircle2, Send, RefreshCcw, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  classifyUploadCandidate,
  inferRolesForUpload,
  summarizeUploadQueue,
  UPLOAD_STATUS_LABEL,
  isDuplicateCandidate,
  type Resource,
  type ResourceCategoryId,
  type ResourceUploadStatus,
  type UploadCandidate,
} from "@/lib/resources/resourceData";
import { resourceCategories, roleLabel } from "@/lib/resources/resourceData";
import {
  uploadAndPublishResource,
  isUploadable,
} from "@/lib/resources/resourceStorage";

const QUEUES: { id: ResourceUploadStatus | "all"; label: string; icon: any }[] = [
  { id: "ready_to_upload",  label: "Ready to publish",  icon: CheckCircle2 },
  { id: "privacy_review",   label: "Needs privacy review", icon: ShieldAlert },
  { id: "business_review",  label: "Needs business review", icon: ScanLine },
  { id: "needs_conversion", label: "Needs conversion",  icon: FileWarning },
  { id: "pending_review",   label: "Pending review",    icon: RefreshCcw },
  { id: "vault_only",       label: "Vault only",        icon: Lock },
  { id: "excluded",         label: "Excluded",          icon: Ban },
];

function titleFromFile(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function guessCategory(name: string): ResourceCategoryId {
  const n = name.toLowerCase();
  if (/handbook|policy|policies|pto|benefit/.test(n)) return "hr";
  if (/sop\b/.test(n)) return "sops";
  if (/template|letter|form/.test(n)) return "templates";
  if (/workflow|process|pipeline/.test(n)) return "workflows";
  if (/payer|insurance|vob|eob/.test(n)) return "insurance";
  if (/centralreach|central reach|retell|phone|portal|tango|system/.test(n)) return "systems";
  if (/training|academy|module|onboarding/.test(n)) return "training";
  if (/playbook|leadership|state director|okr/.test(n)) return "leadership";
  if (/script|message|email|sms|comm/.test(n)) return "communication";
  return "operational";
}

/**
 * Calm bulk upload + review panel for the Resource Library.
 *
 * Pass 3: real Supabase Storage upload + metadata persistence. Held statuses
 * (vault_only, privacy_review, business_review, needs_conversion, excluded,
 * pending_review) are never uploaded. Upload failures keep the candidate in
 * the queue with a calm error chip — no broken resource records are created.
 */
export function ResourceBulkUploadPanel({
  onPublish,
  existingResources = [],
  onCountsChange,
}: {
  onPublish?: (added: Resource[]) => void;
  existingResources?: Resource[];
  onCountsChange?: (info: {
    counts: Record<ResourceUploadStatus, number>;
    failed: number;
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [candidates, setCandidates] = useState<UploadCandidate[]>([]);
  const [fileMap, setFileMap] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [activeQueue, setActiveQueue] = useState<ResourceUploadStatus | "all">("ready_to_upload");

  const counts = useMemo(() => summarizeUploadQueue(candidates), [candidates]);

  useEffect(() => {
    onCountsChange?.({ counts, failed: Object.keys(errors).length });
  }, [counts, errors, onCountsChange]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: UploadCandidate[] = [];
    const added: Record<string, File> = {};
    for (const f of Array.from(list)) {
      const title = titleFromFile(f.name);
      const category = guessCategory(f.name);
      const tags = title.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
      const classified = classifyUploadCandidate({ fileName: f.name, title, tags });
      const roles =
        classified.uploadStatus === "vault_only" || classified.uploadStatus === "excluded"
          ? ["super_admin" as const]
          : inferRolesForUpload({ category, title, tags });
      next.push({
        fileName: f.name,
        title,
        description: classified.reason,
        resourceType:
          category === "hr" ? "handbook" :
          category === "templates" ? "template" :
          category === "workflows" ? "workflow" :
          category === "training" ? "training" :
          category === "leadership" ? "guide" :
          category === "communication" ? "template" :
          category === "insurance" ? "reference" :
          category === "systems" ? "guide" :
          "sop",
        category,
        type: /\.pdf$/i.test(f.name) ? "PDF" : /\.docx?$/i.test(f.name) ? "DOCX" : /\.xlsx?$/i.test(f.name) ? "XLSX" : "PDF",
        roles,
        departments: [],
        states: [],
        tags,
        sensitivity: classified.sensitivity,
        uploadStatus: classified.uploadStatus,
        reviewNote: classified.reason,
      });
      added[f.name] = f;
    }
    setCandidates((prev) => [...next, ...prev]);
    setFileMap((prev) => ({ ...added, ...prev }));
    if (inputRef.current) inputRef.current.value = "";
  }

  function patch(index: number, p: Partial<UploadCandidate>) {
    setCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, ...p } : c)));
  }

  async function publishReady() {
    if (uploading) return;
    const ready = candidates.filter(isUploadable);
    if (ready.length === 0) return;
    setUploading(true);
    const added: Resource[] = [];
    const newErrors: Record<string, string> = {};
    const successFiles = new Set<string>();
    for (const c of ready) {
      const f = fileMap[c.fileName];
      if (!f) {
        newErrors[c.fileName] = "File handle missing — re-add the file and retry.";
        continue;
      }
      const res = await uploadAndPublishResource(c, f);
      if (res.ok && res.resource) {
        added.push(res.resource);
        successFiles.add(c.fileName);
      } else {
        newErrors[c.fileName] = res.error ?? "Upload failed.";
      }
    }
    if (added.length > 0) onPublish?.(added);
    setCandidates((prev) =>
      prev.filter((c) => !(isUploadable(c) && successFiles.has(c.fileName))),
    );
    setErrors((prev) => ({ ...prev, ...newErrors }));
    setUploading(false);
  }

  const filtered = candidates.filter((c) =>
    activeQueue === "all" ? true : c.uploadStatus === activeQueue,
  );

  const duplicateNames = new Set(
    candidates
      .filter((c) => isDuplicateCandidate(c, existingResources))
      .map((c) => c.fileName),
  );

  return (
    <section
      data-testid="resource-bulk-upload-panel"
      aria-label="Bulk upload Resource Library"
      className="space-y-4 rounded-2xl border border-border/60 bg-card p-5"
    >
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Bulk upload &amp; import</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Drop multiple files at once. Each candidate is auto-classified and
            routed to the right review queue. Ready resources upload to the
            Resource Library bucket and persist with role, state, and
            sensitivity metadata. Held items stay in their queue until you
            promote or vault them.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            data-testid="bulk-upload-file-input"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Choose files
          </Button>
          <Button onClick={publishReady} disabled={counts.ready_to_upload === 0 || uploading}>
            <Send className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : "Publish ready resources"}
            {counts.ready_to_upload > 0 && (
              <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 text-[11px]">
                {counts.ready_to_upload}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Review queue chips */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Review queues">
        {QUEUES.map((q) => {
          const Icon = q.icon;
          const count = counts[q.id as ResourceUploadStatus] ?? 0;
          const active = activeQueue === q.id;
          return (
            <button
              key={q.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`queue-tab-${q.id}`}
              onClick={() => setActiveQueue(q.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-card text-foreground hover:bg-muted/40",
              )}
            >
              <Icon className="h-3 w-3" />
              {q.label}
              <span className="text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Candidate rows */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-[12.5px] text-muted-foreground">
            No items in this queue. Use <strong>Choose files</strong> to add candidates.
          </div>
        )}
        {filtered.map((c) => {
          const idx = candidates.indexOf(c);
          const err = errors[c.fileName];
          const isDup = duplicateNames.has(c.fileName);
          return (
            <article
              key={`${c.fileName}-${idx}`}
              data-testid="upload-candidate-row"
              className="rounded-xl border border-border/60 bg-card p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{c.title}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {resourceCategories.find((cat) => cat.id === c.category)?.name} · {c.fileName}
                  </p>
                  <p className="mt-1.5 text-[12px] text-muted-foreground">{c.reviewNote}</p>
                  {isDup && (
                    <div
                      data-testid="upload-candidate-duplicate"
                      className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11.5px] text-amber-800"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Possible duplicate — a published resource with this title already exists in this category. Review before publishing.
                    </div>
                  )}
                  {err && (
                    <div
                      data-testid="upload-candidate-error"
                      className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11.5px] text-rose-700"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Upload failed — {err}
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="rounded-full text-[10.5px]">
                  {UPLOAD_STATUS_LABEL[c.uploadStatus]}
                </Badge>
              </div>

              {/* Role + state chips */}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {c.roles.length === 0 ? (
                  <Badge variant="secondary" className="rounded-full text-[10px]">All roles</Badge>
                ) : (
                  c.roles.slice(0, 6).map((r) => (
                    <Badge key={r} variant="secondary" className="rounded-full text-[10px] font-normal">
                      {roleLabel(r)}
                    </Badge>
                  ))
                )}
                {c.states.length > 0 && c.states.map((s) => (
                  <Badge key={s} variant="outline" className="rounded-full text-[10px]">{s}</Badge>
                ))}
              </div>

              {/* Inline title + description edit */}
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <Input
                  value={c.title}
                  onChange={(e) => patch(idx, { title: e.target.value })}
                  className="h-8 text-[12px]"
                  aria-label={`Title for ${c.fileName}`}
                />
                <Input
                  value={c.description}
                  onChange={(e) => patch(idx, { description: e.target.value })}
                  className="h-8 text-[12px]"
                  aria-label={`Description for ${c.fileName}`}
                />
              </div>

              {/* Per-row actions */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11.5px]"
                  onClick={() => patch(idx, { uploadStatus: "ready_to_upload" })}
                  disabled={c.uploadStatus === "vault_only" || c.uploadStatus === "excluded"}
                  data-testid="action-mark-ready"
                >
                  Mark ready
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11.5px]"
                  onClick={() => patch(idx, { uploadStatus: "privacy_review" })}
                  data-testid="action-hold-review"
                >
                  Hold for privacy review
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11.5px]"
                  onClick={() => patch(idx, { uploadStatus: "business_review" })}
                >
                  Hold for business review
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11.5px]"
                  onClick={() => patch(idx, { uploadStatus: "vault_only", sensitivity: "admin_only" })}
                  data-testid="action-vault-only"
                >
                  Vault only
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11.5px] text-rose-600 hover:text-rose-700"
                  onClick={() => patch(idx, { uploadStatus: "excluded", sensitivity: "excluded" })}
                  data-testid="action-exclude"
                >
                  Exclude
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ResourceBulkUploadPanel;