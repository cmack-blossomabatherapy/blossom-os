import { useMemo, useRef, useState } from "react";
import { Upload, ShieldAlert, FileWarning, ScanLine, Lock, Ban, CheckCircle2, Send, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  candidateToResource,
  classifyUploadCandidate,
  inferRolesForUpload,
  summarizeUploadQueue,
  UPLOAD_STATUS_LABEL,
  type Resource,
  type ResourceCategoryId,
  type ResourceUploadStatus,
  type UploadCandidate,
} from "@/lib/resources/resourceData";
import { resourceCategories, roleLabel } from "@/lib/resources/resourceData";

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
 * Mock-safe: candidates are held in component state. Publishing a candidate
 * promotes it into the parent's resource list with `attachmentStatus:
 * "pending_upload"` — no fake URLs are created. Once Supabase Storage is
 * wired up, swap the publish handler for the real upload.
 */
export function ResourceBulkUploadPanel({
  onPublish,
}: {
  onPublish?: (added: Resource[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [candidates, setCandidates] = useState<UploadCandidate[]>([]);
  const [activeQueue, setActiveQueue] = useState<ResourceUploadStatus | "all">("ready_to_upload");

  const counts = useMemo(() => summarizeUploadQueue(candidates), [candidates]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: UploadCandidate[] = [];
    for (const f of Array.from(files)) {
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
    }
    setCandidates((prev) => [...next, ...prev]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function patch(index: number, p: Partial<UploadCandidate>) {
    setCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, ...p } : c)));
  }

  function publishReady() {
    const ready = candidates.filter((c) => c.uploadStatus === "ready_to_upload");
    if (ready.length === 0) return;
    const added = ready.map((c) => candidateToResource({ ...c, uploadStatus: "published" }));
    onPublish?.(added);
    setCandidates((prev) => prev.filter((c) => c.uploadStatus !== "ready_to_upload"));
  }

  const filtered = candidates.filter((c) =>
    activeQueue === "all" ? true : c.uploadStatus === activeQueue,
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
            Drop multiple files at once. Each candidate is auto-classified, routed
            to the right review queue, and held until you publish or vault it.
            Persistence is pending storage — publishing marks the resource as
            attachment pending, no fake URLs are created.
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
          <Button onClick={publishReady} disabled={counts.ready_to_upload === 0}>
            <Send className="mr-2 h-4 w-4" /> Publish ready resources
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