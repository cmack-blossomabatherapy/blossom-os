import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, Settings2, Pencil, X,
  RotateCcw, Sparkles, GripVertical,
} from "lucide-react";
import {
  useAcademy, ICONS, TONES,
  updateJourney, addModuleToJourney, removeModuleFromJourney, reorderJourneyModule,
  createTraining, upsertTraining, deleteTraining, resetAcademy,
  type RoleJourney, type Training, type TrainingType, type JourneyTone, type IconKey,
  type TrainingChecklistItem, type TrainingResource,
} from "@/lib/training/academyData";

const TYPES: TrainingType[] = ["SOP", "Workflow", "Tango", "Video", "Checklist", "Quick Guide"];
const ICON_KEYS = Object.keys(ICONS) as IconKey[];

export default function OSTrainingManage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { journeys, trainings } = useAcademy();

  const initialId = params.get("journey") || journeys[0]?.id;
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(initialId);

  useEffect(() => {
    if (selectedJourneyId && params.get("journey") !== selectedJourneyId) {
      setParams({ journey: selectedJourneyId }, { replace: true });
    }
  }, [selectedJourneyId]); // eslint-disable-line

  const journey = journeys.find((j) => j.id === selectedJourneyId) ?? journeys[0];
  const journeyModules = useMemo(
    () => (journey?.moduleIds ?? []).map((id) => trainings.find((t) => t.id === id)).filter(Boolean) as Training[],
    [journey, trainings],
  );
  const availableModules = useMemo(
    () => trainings.filter((t) => !journey?.moduleIds.includes(t.id)),
    [journey, trainings],
  );

  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const editingTraining = trainings.find((t) => t.id === editingTrainingId) ?? null;

  if (!journey) {
    return (
      <OSShell>
        <p className="text-muted-foreground">No journeys configured.</p>
      </OSShell>
    );
  }

  return (
    <OSShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/training")}
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Academy
          </button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              if (confirm("Reset all journeys and modules to the seeded defaults? Custom edits will be lost.")) {
                resetAcademy();
                toast.success("Academy reset to defaults");
              }
            }}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset to defaults
          </Button>
        </div>

        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Training Academy
          </p>
          <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
            Manage Role Journeys
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
            Edit the learning journey for each role. Add, remove, reorder, and deeply edit every module.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Role list */}
          <aside className="rounded-2xl border border-border/70 bg-card p-3 lg:sticky lg:top-6 lg:self-start">
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Roles</p>
            <div className="space-y-0.5">
              {journeys.map((j) => {
                const Icon = ICONS[j.icon];
                const active = j.id === journey.id;
                return (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJourneyId(j.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                      active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md os-tone-${j.tone}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{j.title}</span>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{j.moduleIds.length}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Editor */}
          <div className="space-y-6">
            <JourneyMetaEditor journey={journey} />

            <ModulesEditor
              journey={journey}
              journeyModules={journeyModules}
              availableModules={availableModules}
              onEdit={(id) => setEditingTrainingId(id)}
            />
          </div>
        </div>
      </div>

      {editingTraining && (
        <ModuleEditDialog
          training={editingTraining}
          onClose={() => setEditingTrainingId(null)}
        />
      )}
    </OSShell>
  );
}

/* ---------------- Journey meta ---------------- */

function JourneyMetaEditor({ journey }: { journey: RoleJourney }) {
  const [title, setTitle] = useState(journey.title);
  const [tagline, setTagline] = useState(journey.tagline);
  const [tone, setTone] = useState<JourneyTone>(journey.tone);
  const [icon, setIcon] = useState<IconKey>(journey.icon);

  useEffect(() => {
    setTitle(journey.title); setTagline(journey.tagline); setTone(journey.tone); setIcon(journey.icon);
  }, [journey.id]); // eslint-disable-line

  const dirty = title !== journey.title || tagline !== journey.tagline || tone !== journey.tone || icon !== journey.icon;
  const Icon = ICONS[icon];

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Journey Settings
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_180px]">
        <div>
          <Label className="text-[11.5px]">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-[11.5px]">Icon</Label>
          <Select value={icon} onValueChange={(v) => setIcon(v as IconKey)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ICON_KEYS.map((k) => {
                const I = ICONS[k];
                return (
                  <SelectItem key={k} value={k}>
                    <span className="inline-flex items-center gap-2"><I className="h-3.5 w-3.5" /> {k}</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11.5px]">Tone</Label>
          <Select value={tone} onValueChange={(v) => setTone(v as JourneyTone)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TONES.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="inline-flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full os-tone-${t}`} /> {t}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4">
        <Label className="text-[11.5px]">Tagline</Label>
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="mt-1" />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className={`grid h-9 w-9 place-items-center rounded-xl os-tone-${tone}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span>Preview · role: <span className="font-mono text-foreground">{journey.role}</span></span>
        </div>
        <Button
          size="sm"
          disabled={!dirty}
          onClick={() => {
            updateJourney(journey.id, { title, tagline, tone, icon });
            toast.success("Journey updated");
          }}
        >
          Save changes
        </Button>
      </div>
    </section>
  );
}

/* ---------------- Modules editor ---------------- */

function ModulesEditor({
  journey, journeyModules, availableModules, onEdit,
}: {
  journey: RoleJourney;
  journeyModules: Training[];
  availableModules: Training[];
  onEdit: (id: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Modules in this journey</h2>
          <p className="text-[12px] text-muted-foreground">Drag-free reorder, deep-edit any module, or add a new one.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-full">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add existing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add existing module</DialogTitle></DialogHeader>
              <div className="max-h-[50vh] overflow-auto space-y-1">
                {availableModules.length === 0 && (
                  <p className="py-6 text-center text-[12.5px] text-muted-foreground">
                    No other modules available. Create a new one instead.
                  </p>
                )}
                {availableModules.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { addModuleToJourney(journey.id, m.id); setAddOpen(false); toast.success("Module added"); }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-left hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{m.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{m.type} · {m.estimatedMinutes} min</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <NewModuleButton journeyId={journey.id} />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {journeyModules.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-muted-foreground/70" />
            <p className="mt-2 text-[13px] font-medium">No modules yet</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Use “New module” to build the first one for this role.
            </p>
          </div>
        )}
        {journeyModules.map((m, idx) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{m.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {m.type} · {m.estimatedMinutes} min {m.required && "· required"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon" variant="ghost" className="h-7 w-7"
                disabled={idx === 0}
                onClick={() => reorderJourneyModule(journey.id, idx, idx - 1)}
              ><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button
                size="icon" variant="ghost" className="h-7 w-7"
                disabled={idx === journeyModules.length - 1}
                onClick={() => reorderJourneyModule(journey.id, idx, idx + 1)}
              ><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(m.id)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon" variant="ghost" className="h-7 w-7"
                onClick={() => { removeModuleFromJourney(journey.id, m.id); toast.success("Removed from journey"); }}
                title="Remove from journey"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700"
                onClick={() => {
                  if (confirm(`Delete module "${m.title}" everywhere?`)) {
                    deleteTraining(m.id);
                    toast.success("Module deleted");
                  }
                }}
                title="Delete module"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NewModuleButton({ journeyId }: { journeyId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TrainingType>("SOP");
  const [minutes, setMinutes] = useState(10);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New module
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New module</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[11.5px]">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pairing RBTs with Clients" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11.5px]">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TrainingType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11.5px]">Estimated minutes</Label>
              <Input type="number" min={1} value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 1)} className="mt-1" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              const t = createTraining({ title: title.trim(), type, estimatedMinutes: minutes });
              addModuleToJourney(journeyId, t.id);
              setOpen(false);
              setTitle(""); setMinutes(10); setType("SOP");
              toast.success("Module created");
            }}
          >Create & add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Deep module editor ---------------- */

function ModuleEditDialog({ training, onClose }: { training: Training; onClose: () => void }) {
  const [draft, setDraft] = useState<Training>(training);
  useEffect(() => setDraft(training), [training.id]); // eslint-disable-line

  const update = <K extends keyof Training>(k: K, v: Training[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const addChecklist = () => update("checklist", [
    ...(draft.checklist ?? []),
    { id: `c-${Math.random().toString(36).slice(2, 6)}`, item: "", required: false },
  ] as TrainingChecklistItem[]);

  const addResource = () => update("resources", [
    ...(draft.resources ?? []),
    { id: `r-${Math.random().toString(36).slice(2, 6)}`, type: "Link", title: "", url: "" },
  ] as TrainingResource[]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto">
        <DialogHeader><DialogTitle>Edit module · {training.title}</DialogTitle></DialogHeader>

        <div className="space-y-5">
          {/* Basics */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label className="text-[11.5px]">Title</Label>
              <Input value={draft.title} onChange={(e) => update("title", e.target.value)} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[11.5px]">Short description</Label>
              <Textarea value={draft.description} onChange={(e) => update("description", e.target.value)} className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-[11.5px]">Type</Label>
              <Select value={draft.type} onValueChange={(v) => update("type", v as TrainingType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11.5px]">Estimated minutes</Label>
              <Input type="number" min={1} value={draft.estimatedMinutes}
                onChange={(e) => update("estimatedMinutes", Number(e.target.value) || 1)} className="mt-1" />
            </div>
            <div>
              <Label className="text-[11.5px]">Department</Label>
              <Input value={draft.department ?? ""} onChange={(e) => update("department", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-[11.5px]">Owner</Label>
              <Input value={draft.owner ?? ""} onChange={(e) => update("owner", e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={!!draft.required} onCheckedChange={(v) => update("required", v)} />
              <Label className="text-[12.5px]">Required training</Label>
            </div>
          </div>

          {/* Content */}
          <div>
            <Label className="text-[11.5px]">Overview</Label>
            <Textarea value={draft.overview ?? ""} onChange={(e) => update("overview", e.target.value)} className="mt-1" rows={3}
              placeholder="Why this module matters and how it connects to the role." />
          </div>
          <div>
            <Label className="text-[11.5px]">SOP content (Markdown)</Label>
            <Textarea value={draft.sopMarkdown ?? ""} onChange={(e) => update("sopMarkdown", e.target.value)} className="mt-1 font-mono text-[12px]" rows={8}
              placeholder="## SOP\nStep 1…" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label className="text-[11.5px]">Tango URL</Label>
              <Input value={draft.tangoUrl ?? ""} onChange={(e) => update("tangoUrl", e.target.value)} placeholder="https://app.tango.us/..." className="mt-1" />
            </div>
            <div>
              <Label className="text-[11.5px]">Video URL</Label>
              <Input value={draft.videoUrl ?? ""} onChange={(e) => update("videoUrl", e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-[12.5px] font-semibold">Checklist</Label>
              <Button size="sm" variant="outline" onClick={addChecklist}>
                <Plus className="mr-1 h-3 w-3" /> Add item
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {(draft.checklist ?? []).map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <Input value={c.item} onChange={(e) => {
                    const next = [...(draft.checklist ?? [])];
                    next[i] = { ...c, item: e.target.value };
                    update("checklist", next);
                  }} placeholder="Checklist item" />
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Switch checked={c.required} onCheckedChange={(v) => {
                      const next = [...(draft.checklist ?? [])];
                      next[i] = { ...c, required: v };
                      update("checklist", next);
                    }} />
                    Req
                  </label>
                  <Button size="icon" variant="ghost" className="h-8 w-8"
                    onClick={() => update("checklist", (draft.checklist ?? []).filter((x) => x.id !== c.id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {(draft.checklist ?? []).length === 0 && (
                <p className="text-[12px] text-muted-foreground">No checklist items.</p>
              )}
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-[12.5px] font-semibold">Resources</Label>
              <Button size="sm" variant="outline" onClick={addResource}>
                <Plus className="mr-1 h-3 w-3" /> Add resource
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {(draft.resources ?? []).map((r, i) => (
                <div key={r.id} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-2">
                  <Select value={r.type} onValueChange={(v) => {
                    const next = [...(draft.resources ?? [])];
                    next[i] = { ...r, type: v as TrainingResource["type"] };
                    update("resources", next);
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["PDF", "Link", "Tango", "Video", "Template"] as const).map((t) =>
                        <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input value={r.title} placeholder="Title" onChange={(e) => {
                    const next = [...(draft.resources ?? [])];
                    next[i] = { ...r, title: e.target.value };
                    update("resources", next);
                  }} />
                  <Input value={r.url} placeholder="URL" onChange={(e) => {
                    const next = [...(draft.resources ?? [])];
                    next[i] = { ...r, url: e.target.value };
                    update("resources", next);
                  }} />
                  <Button size="icon" variant="ghost" className="h-8 w-8"
                    onClick={() => update("resources", (draft.resources ?? []).filter((x) => x.id !== r.id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {(draft.resources ?? []).length === 0 && (
                <p className="text-[12px] text-muted-foreground">No resources.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            upsertTraining({ ...draft, lastUpdated: new Date().toISOString().slice(0, 10) });
            toast.success("Module saved");
            onClose();
          }}>Save module</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
