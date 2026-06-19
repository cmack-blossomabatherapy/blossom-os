import { useMemo, useState } from "react";
import {
  Library, Plus, Trash2, Search, FileText, FolderOpen, Layers, Globe2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useResourceAttachments, addAttachment, removeAttachment,
  type AttachmentScope, type AttachmentRequiredness,
} from "@/lib/academy/resourceAttachments";
import { TRAINING_PATHS } from "@/lib/academy/trainingPaths";
import { buildPathJourney } from "@/lib/academy/journeyContent";
import { useAdminResources } from "@/hooks/useAdminResources";
import { RBT_PATHS, type RBTPathId } from "@/lib/training/rbtAcademy";

/**
 * Admin panel: attach Resource Library items to a journey, day, or module.
 * Learner pages consume these via getAcademyResourcesForScope().
 */
export function ResourceAttachmentManager() {
  const attachments = useResourceAttachments();
  const { resources: libraryResources = [] } = useAdminResources();

  const [journeySlug, setJourneySlug] = useState<string>(TRAINING_PATHS[0]?.slug ?? "");
  const [rbtTrackId, setRbtTrackId] = useState<RBTPathId>("not_certified");
  const [scope, setScope] = useState<AttachmentScope>("journey");
  const [dayId, setDayId] = useState<string>("");
  const [moduleId, setModuleId] = useState<string>("");
  const [requiredness, setRequiredness] = useState<AttachmentRequiredness>("recommended");
  const [instructions, setInstructions] = useState("");
  const [query, setQuery] = useState("");

  const journey = useMemo(
    () => buildPathJourney(journeySlug, journeySlug === "rbt" ? { rbtTrackId } : undefined),
    [journeySlug, rbtTrackId],
  );
  const days = journey?.weeks.flatMap((w) => w.days) ?? [];
  const modules = days.flatMap((d) => d.modules);

  const filteredLibrary = useMemo(() => {
    const q = query.trim().toLowerCase();
    return libraryResources.filter((r) =>
      !q || r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q),
    ).slice(0, 30);
  }, [libraryResources, query]);

  const journeyAttachments = attachments.filter((a) => a.journeySlug === journeySlug);

  const attach = (resource: { id: string; title?: string; type?: string; url?: string }) => {
    if (scope === "day" && !dayId) return;
    if (scope === "module" && !moduleId) return;
    addAttachment({
      resourceId: resource.id,
      resourceTitle: resource.title ?? "Untitled resource",
      resourceType: resource.type ?? "Resource",
      resourceUrl: resource.url,
      scope,
      journeySlug,
      dayId: scope === "day" ? dayId : scope === "module" ? days.find((d) => d.modules.some((m) => m.id === moduleId))?.id : undefined,
      moduleId: scope === "module" ? moduleId : undefined,
      rbtTrackId: journeySlug === "rbt" && !attachGlobalRbt ? rbtTrackId : undefined,
      requiredness,
      instructions: instructions.trim() || undefined,
      source: "resource-library",
    });
    setInstructions("");
  };

  // When true, RBT attachments are saved without a track id and therefore
  // appear on every RBT track. Defaults to track-scoped (false).
  const [attachGlobalRbt, setAttachGlobalRbt] = useState(false);

  // Group RBT attachments by track scope so admins can clearly see what
  // applies to the currently selected track vs. other tracks vs. global.
  const isRbt = journeySlug === "rbt";
  const trackScopedAttachments = isRbt
    ? journeyAttachments.filter((a) => a.rbtTrackId === rbtTrackId)
    : journeyAttachments;
  const globalRbtAttachments = isRbt ? journeyAttachments.filter((a) => !a.rbtTrackId) : [];
  const otherTrackAttachments = isRbt
    ? journeyAttachments.filter((a) => a.rbtTrackId && a.rbtTrackId !== rbtTrackId)
    : [];

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-2">
        <Library className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">Resource attachments</h2>
        <Badge variant="outline" className="text-[10px]">Code-defined curriculum supported</Badge>
      </header>
      <p className="-mt-4 text-[13px] text-muted-foreground">
        Attach Resource Library items to a journey, day, or specific module. Learners see these on the matching academy pages.
      </p>

      {/* Target picker */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Journey</label>
          <Select value={journeySlug} onValueChange={setJourneySlug}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRAINING_PATHS.map((p) => (<SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        {journeySlug === "rbt" && (
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">RBT track</label>
            <Select value={rbtTrackId} onValueChange={(v) => { setRbtTrackId(v as RBTPathId); setDayId(""); setModuleId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RBT_PATHS.map((p) => (<SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <label className="mt-2 flex items-center gap-2 text-[11.5px] text-muted-foreground">
              <input
                type="checkbox"
                checked={attachGlobalRbt}
                onChange={(e) => setAttachGlobalRbt(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              Apply to all RBT tracks (global)
            </label>
          </div>
        )}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scope</label>
          <Select value={scope} onValueChange={(v) => setScope(v as AttachmentScope)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="journey">Entire journey</SelectItem>
              <SelectItem value="day">Specific day</SelectItem>
              <SelectItem value="module">Specific module</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {scope === "day" && (
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Day</label>
            <Select value={dayId} onValueChange={setDayId}>
              <SelectTrigger><SelectValue placeholder="Pick a day" /></SelectTrigger>
              <SelectContent>
                {days.map((d) => (<SelectItem key={d.id} value={d.id}>D{d.dayInJourney} · {d.title}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )}
        {scope === "module" && (
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Module</label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger><SelectValue placeholder="Pick a module" /></SelectTrigger>
              <SelectContent>
                {modules.map((m) => (<SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Requiredness</label>
          <Select value={requiredness} onValueChange={(v) => setRequiredness(v as AttachmentRequiredness)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="required">Required</SelectItem>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-4">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Instructions (optional)</label>
          <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Review before client-based competency session." />
        </div>
      </div>

      {/* Library picker */}
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Resource Library…" className="h-9" />
        </div>
        {filteredLibrary.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">
            <FolderOpen className="mx-auto mb-2 h-5 w-5" />
            No matching library resources.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filteredLibrary.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{r.title ?? "Untitled"}</p>
                  {r.description && <p className="truncate text-[11.5px] text-muted-foreground">{r.description}</p>}
                </div>
                <Badge variant="outline" className="text-[10px]">{r.type ?? "Resource"}</Badge>
                <Button size="sm" variant="outline" onClick={() => attach(r)} disabled={(scope === "day" && !dayId) || (scope === "module" && !moduleId)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Attach
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Existing attachments */}
      <div className="space-y-4">
        <AttachmentGroup
          title={
            isRbt
              ? `For ${RBT_PATHS.find((p) => p.id === rbtTrackId)?.label}`
              : `Existing attachments · ${journey?.path.title ?? journeySlug}`
          }
          icon={Layers}
          attachments={trackScopedAttachments}
          emptyText="Nothing attached to this track yet."
          onRemove={removeAttachment}
        />
        {isRbt && (
          <AttachmentGroup
            title="Global RBT attachments (all tracks)"
            icon={Globe2}
            attachments={globalRbtAttachments}
            emptyText="No global RBT attachments."
            onRemove={removeAttachment}
            muted
          />
        )}
        {isRbt && otherTrackAttachments.length > 0 && (
          <AttachmentGroup
            title="On other RBT tracks"
            icon={Layers}
            attachments={otherTrackAttachments}
            emptyText=""
            onRemove={removeAttachment}
            muted
            showTrack
          />
        )}
      </div>
    </section>
  );
}

function AttachmentGroup({
  title, icon: Icon, attachments, emptyText, onRemove, muted, showTrack,
}: {
  title: string;
  icon: typeof Layers;
  attachments: ReturnType<typeof useResourceAttachments>;
  emptyText: string;
  onRemove: (id: string) => void;
  muted?: boolean;
  showTrack?: boolean;
}) {
  if (attachments.length === 0 && !emptyText) return null;
  return (
    <div className={`rounded-2xl border border-border/70 ${muted ? "bg-muted/30" : "bg-card"} p-4`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <Badge variant="outline" className="text-[10px]">{attachments.length}</Badge>
      </div>
      {attachments.length === 0 ? (
        <p className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {attachments.map((a) => {
            const trackLabel = a.rbtTrackId ? RBT_PATHS.find((p) => p.id === a.rbtTrackId)?.label : "All tracks";
            return (
              <li key={a.id} className="flex items-center gap-3 py-2">
                <Badge variant="outline" className="text-[10px] capitalize">{a.scope}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{a.resourceTitle}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {a.resourceType} · {a.requiredness}
                    {a.moduleId ? ` · module ${a.moduleId}` : ""}
                    {a.dayId ? ` · day ${a.dayId}` : ""}
                    {showTrack && a.journeySlug === "rbt" ? ` · ${trackLabel}` : ""}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onRemove(a.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}