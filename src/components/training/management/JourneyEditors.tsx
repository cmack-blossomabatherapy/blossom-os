import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Settings2, Trash2 } from "lucide-react";
import {
  ICONS, TONES,
  updateJourney, createJourney, deleteJourney, addModuleToJourney,
  createTraining, upsertTraining, deleteTraining,
  type RoleJourney, type Training, type TrainingType, type JourneyTone, type IconKey,
  type TrainingChecklistItem, type TrainingResource,
} from "@/lib/training/academyData";

const TYPES: TrainingType[] = ["SOP", "Workflow", "Tango", "Video", "Letter", "Checklist", "Quick Guide", "Training", "Task", "Meeting", "Shadowing", "Quiz", "Reflection"];
const ICON_KEYS = Object.keys(ICONS) as IconKey[];

const ROLE_OPTIONS = [
  { value: "shared", label: "Shared / All roles" },
  { value: "intake", label: "Intake" },
  { value: "scheduling", label: "Scheduling" },
  { value: "authorizations", label: "Authorizations" },
  { value: "qa_team", label: "QA" },
  { value: "recruiting_team", label: "Recruiting" },
  { value: "hr_team", label: "HR" },
  { value: "billing_finance", label: "Billing & Finance" },
  { value: "bcba", label: "BCBA" },
  { value: "rbt", label: "RBT" },
  { value: "state_director", label: "State Director" },
  { value: "operations_leadership", label: "Operations Leadership" },
  { value: "executive_leadership", label: "Executive Leadership" },
];

function roleLabel(value: string): string {
  return ROLE_OPTIONS.find((r) => r.value === value)?.label ?? value;
}

/* ---------------- Journey meta editor (inline) ---------------- */
export function JourneyMetaEditor({ journey }: { journey: RoleJourney }) {
  const [title, setTitle] = useState(journey.title);
  const [tagline, setTagline] = useState(journey.tagline);
  const [tone, setTone] = useState<JourneyTone>(journey.tone);
  const [icon, setIcon] = useState<IconKey>(journey.icon);
  const [role, setRole] = useState<string>(journey.role);

  useEffect(() => {
    setTitle(journey.title); setTagline(journey.tagline);
    setTone(journey.tone); setIcon(journey.icon); setRole(journey.role);
  }, [journey.id]); // eslint-disable-line

  const dirty =
    title !== journey.title ||
    tagline !== journey.tagline ||
    tone !== journey.tone ||
    icon !== journey.icon ||
    role !== journey.role;
  const Icon = ICONS[icon];

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Journey settings
        </h2>
        {dirty && (
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-amber-600">
            unsaved
          </span>
        )}
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
        <Label className="text-[11.5px]">Tagline / description</Label>
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="mt-1" />
      </div>

      <div className="mt-4">
        <Label className="text-[11.5px]">Role / audience</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className={`grid h-9 w-9 place-items-center rounded-xl os-tone-${tone}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span>
            Role:{" "}
            <span className="font-medium text-foreground">{roleLabel(role)}</span>
            <span className="ml-2 font-mono text-[11px] text-muted-foreground">({role})</span>
          </span>
        </div>
        <Button
          size="sm"
          disabled={!dirty}
          onClick={() => {
            updateJourney(journey.id, { title, tagline, role, tone, icon });
            toast.success("Journey updated");
          }}
        >
          Save changes
        </Button>
      </div>
    </section>
  );
}

/* ---------------- Deep module edit dialog ---------------- */
export function ModuleEditDialog({
  training,
  onClose,
}: {
  training: Training;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Training>(training);
  useEffect(() => setDraft(training), [training.id]); // eslint-disable-line

  const update = <K extends keyof Training>(k: K, v: Training[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const addChecklist = () =>
    update("checklist", [
      ...(draft.checklist ?? []),
      { id: `c-${Math.random().toString(36).slice(2, 6)}`, item: "", required: false },
    ] as TrainingChecklistItem[]);

  const addResource = () =>
    update("resources", [
      ...(draft.resources ?? []),
      { id: `r-${Math.random().toString(36).slice(2, 6)}`, type: "Link", title: "", url: "" },
    ] as TrainingResource[]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit module · {training.title}</DialogTitle>
          <DialogDescription>Deep edit module content. Saves persist immediately to the academy store.</DialogDescription>
        </DialogHeader>

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
              <Input
                type="number" min={1} value={draft.estimatedMinutes}
                onChange={(e) => update("estimatedMinutes", Number(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-[11.5px]">Category</Label>
              <Select value={draft.category} onValueChange={(v) => update("category", v as Training["category"])}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="systems">Systems</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                </SelectContent>
              </Select>
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
            <Textarea value={draft.sopMarkdown ?? ""} onChange={(e) => update("sopMarkdown", e.target.value)}
              className="mt-1 font-mono text-[12px]" rows={8} placeholder="## SOP\nStep 1…" />
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
              <Label className="text-[12.5px] font-semibold">Resource links</Label>
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

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => {
              if (confirm(`Delete module "${draft.title}" everywhere? This removes it from any journey it's in.`)) {
                deleteTraining(draft.id);
                toast.success("Module deleted");
                onClose();
              }
            }}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete module
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                upsertTraining({ ...draft, lastUpdated: new Date().toISOString().slice(0, 10) });
                toast.success("Module saved");
                onClose();
              }}
            >
              Save module
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Real create-module dialog ---------------- */

export function CreateModuleDialogReal({
  open,
  onOpenChange,
  journeyId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** If provided, the new module is also added to this journey on create. */
  journeyId?: string | null;
  onCreated?: (t: Training) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TrainingType>("SOP");
  const [minutes, setMinutes] = useState(10);
  const [required, setRequired] = useState(false);
  const [category, setCategory] = useState<Training["category"]>("role");
  const [department, setDepartment] = useState("");

  const reset = () => {
    setTitle(""); setDescription(""); setType("SOP"); setMinutes(10);
    setRequired(false); setCategory("role"); setDepartment("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create training module</DialogTitle>
          <DialogDescription>
            Creates a real module in the academy store. You can deep-edit content right after.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[11.5px]">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Running a Clean VOB" className="mt-1" />
          </div>
          <div>
            <Label className="text-[11.5px]">Short description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1" />
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
              <Input type="number" min={1} value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 1)} className="mt-1" />
            </div>
            <div>
              <Label className="text-[11.5px]">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Training["category"])}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="systems">Systems</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11.5px]">Department / audience</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Intake" className="mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={required} onCheckedChange={setRequired} />
            <Label className="text-[12.5px]">Required training</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              const t = createTraining({
                title: title.trim(),
                description: description.trim(),
                type,
                estimatedMinutes: minutes,
                required,
                category,
                department: department.trim() || undefined,
              });
              if (journeyId) {
                // Defer to avoid double-emit before reset.
                import("@/lib/training/academyData").then((m) => m.addModuleToJourney(journeyId, t.id));
              }
              toast.success(`Created "${t.title}"`);
              onCreated?.(t);
              reset();
              onOpenChange(false);
            }}
          >
            Create module
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Real create-journey dialog ---------------- */

export function CreateJourneyDialogReal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (j: RoleJourney) => void;
}) {
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [role, setRole] = useState("shared");
  const [tone, setTone] = useState<JourneyTone>("violet");
  const [icon, setIcon] = useState<IconKey>("BookOpen");

  const reset = () => {
    setTitle(""); setTagline(""); setRole("shared"); setTone("violet"); setIcon("BookOpen");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create role journey</DialogTitle>
          <DialogDescription>Groups modules into a learning path for one role.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[11.5px]">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Authorizations Journey" className="mt-1" />
          </div>
          <div>
            <Label className="text-[11.5px]">Tagline / description</Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line summary." className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11.5px]">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
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
            <div className="col-span-2">
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
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              const j = createJourney({
                title: title.trim(),
                tagline: tagline.trim(),
                role,
                tone,
                icon,
              });
              toast.success(`Created journey "${j.title}"`);
              onCreated?.(j);
              reset();
              onOpenChange(false);
            }}
          >
            Create journey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { deleteJourney };