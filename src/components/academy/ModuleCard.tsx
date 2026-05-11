import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, BookOpen, Eye, Users, PlayCircle, FileText, ClipboardCheck, Pencil, CheckSquare, Loader2, ExternalLink, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULE_TYPE_META, type AcademyModule, type AcademyProgress } from "@/lib/academy/types";
import { upsertProgress } from "@/lib/academy/api";
import { toast } from "sonner";

const ICON: Record<string, any> = { BookOpen, Eye, Users, PlayCircle, FileText, ClipboardCheck, Pencil, CheckSquare };

export interface ModuleResource { id: string; label: string; url: string | null; kind: string }

export function ModuleCard({
  module, progress, enrollmentId, onShadow, onCheckin, onChange, readOnly, resources,
}: {
  module: AcademyModule;
  progress?: AcademyProgress;
  enrollmentId: string;
  onShadow: () => void;
  onCheckin: () => void;
  onChange: () => void;
  readOnly?: boolean;
  resources?: ModuleResource[];
}) {
  const meta = MODULE_TYPE_META[module.module_type];
  const Icon = ICON[meta.icon] ?? BookOpen;
  const [busy, setBusy] = useState(false);
  const [reflection, setReflection] = useState(progress?.reflection ?? "");

  const isComplete = progress?.status === "completed";

  async function markComplete() {
    setBusy(true);
    const { error } = await upsertProgress(enrollmentId, module.id, {
      status: "completed", completed_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Marked complete"); onChange(); }
  }

  async function submitReflection() {
    setBusy(true);
    const { error } = await upsertProgress(enrollmentId, module.id, {
      status: "submitted", reflection, started_at: progress?.started_at ?? new Date().toISOString(),
    });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Reflection submitted"); onChange(); }
  }

  return (
    <div className={cn("rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md", isComplete && "border-emerald-500/30 bg-emerald-500/[0.02]")}>
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", meta.tone)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", meta.tone)}>{meta.label}</span>
            {module.duration_label && <span className="text-[11px] text-muted-foreground">{module.duration_label}</span>}
            {module.applies_to !== "either" && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {module.applies_to === "new_state" ? "New State" : "Existing State"}
              </span>
            )}
            {!module.is_required && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Optional</span>}
          </div>
          <h4 className="mt-1.5 text-sm font-semibold leading-tight">{module.title}</h4>
          {module.description && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{module.description}</p>}
          {(module.leader_name || module.department) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {module.leader_name && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {module.leader_name}</span>}
              {module.department && <span>· {module.department}</span>}
            </div>
          )}

          {module.cover_image_url && (
            <img
              src={module.cover_image_url}
              alt=""
              loading="lazy"
              className="mt-3 w-full rounded-xl border border-border/60 object-cover"
            />
          )}

          {module.video_url && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-black/5">
              {/youtube\.com|youtu\.be|loom\.com|vimeo\.com/.test(module.video_url) ? (
                <iframe
                  src={toEmbedUrl(module.video_url)}
                  title={module.title}
                  className="aspect-video w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={module.video_url} controls className="aspect-video w-full" />
              )}
            </div>
          )}

          {module.link_url && (
            <a
              href={module.link_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open module
            </a>
          )}

          {resources && resources.length > 0 && (
            <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-2.5">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {module.module_type === "video" ? "Watch" : module.module_type === "sop" ? "Read" : "Resources"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {resources.map((r) => {
                  const RIcon = module.module_type === "video" ? PlayCircle : module.module_type === "sop" ? FileText : Link2;
                  return r.url ? (
                    <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                      <RIcon className="h-3.5 w-3.5" />
                      <span>{r.label}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  ) : (
                    <span key={r.id} className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground">
                      <RIcon className="h-3.5 w-3.5" />{r.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {(module.module_type === "video" || module.module_type === "sop") && (!resources || resources.length === 0) && (
            <p className="mt-3 rounded-xl border border-dashed border-border/60 bg-muted/10 p-2.5 text-[11px] text-muted-foreground">
              {module.module_type === "video" ? "No video link added yet." : "No document attached yet."} An admin can add one in Training Admin → Operations Academy.
            </p>
          )}

          {module.module_type === "reflection" && !isComplete && !readOnly && (
            <div className="mt-3 space-y-2">
              <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="What did you learn? What's still unclear?" rows={3} className="text-xs" />
              <Button size="sm" disabled={busy || !reflection.trim()} onClick={submitReflection}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit reflection"}
              </Button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isComplete ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <Check className="h-3 w-3" /> Completed
              </span>
            ) : readOnly ? null : (
              <>
                {module.module_type === "shadowing" && (
                  <Button size="sm" variant="outline" onClick={onShadow}>Log shadow session</Button>
                )}
                {module.module_type === "meeting" && (
                  <Button size="sm" variant="outline" onClick={onCheckin}>Log meeting</Button>
                )}
                {module.module_type !== "reflection" && (
                  <Button size="sm" variant={module.module_type === "shadowing" || module.module_type === "meeting" ? "ghost" : "default"} onClick={markComplete} disabled={busy}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Mark complete"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}