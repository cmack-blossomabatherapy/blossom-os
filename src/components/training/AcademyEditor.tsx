import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil, Save, X, BookOpen, Layers, FileText, Users } from "lucide-react";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StaffAssignDialog } from "./StaffAssignDialog";

type Track = { id: string; name: string; description: string | null; is_active: boolean };
type Phase = { id: string; track_id: string; name: string; tagline: string | null; position: number; color_token: string };
type Week = { id: string; phase_id: string; week_number: number; title: string; objective: string | null; outcomes: string[] };
type Module = {
  id: string; week_id: string; title: string; description: string | null;
  module_type: "training" | "shadowing" | "meeting" | "video" | "sop" | "quiz" | "reflection" | "task";
  position: number; is_required: boolean; leader_name: string | null; duration_label: string | null;
  applies_to: "new_state" | "existing_state" | "either"; applies_to_new_state_only: boolean;
  department: string | null; quiz: any;
};
type Resource = { id: string; module_id: string; label: string; url: string | null; kind: string };

const MODULE_TYPES: Module["module_type"][] = ["training","shadowing","meeting","video","sop","quiz","reflection","task"];
const APPLIES_TO: Module["applies_to"][] = ["either","new_state","existing_state"];

export function AcademyEditor() {
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState<string | null>(null);
  const [assignTrack, setAssignTrack] = useState<Track | null>(null);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [t, p, w, m, r, e] = await Promise.all([
      supabase.from("academy_tracks").select("*").order("name"),
      supabase.from("academy_phases").select("*").order("position"),
      supabase.from("academy_weeks").select("*").order("week_number"),
      supabase.from("academy_modules").select("*").order("position"),
      supabase.from("academy_module_resources").select("*"),
      supabase.from("academy_enrollments").select("track_id"),
    ]);
    setTracks((t.data ?? []) as Track[]);
    setPhases((p.data ?? []) as Phase[]);
    setWeeks((w.data ?? []) as Week[]);
    setModules((m.data ?? []) as Module[]);
    setResources((r.data ?? []) as Resource[]);
    const counts: Record<string, number> = {};
    (e.data ?? []).forEach((row: any) => { counts[row.track_id] = (counts[row.track_id] ?? 0) + 1; });
    setEnrollmentCounts(counts);
    if (!activeTrack && (t.data ?? []).length > 0) setActiveTrack((t.data as Track[])[0].id);
    setLoading(false);
  }

  const trackPhases = useMemo(() => phases.filter((p) => p.track_id === activeTrack), [phases, activeTrack]);
  const phaseWeeks = (phaseId: string) => weeks.filter((w) => w.phase_id === phaseId);
  const weekModules = (weekId: string) => modules.filter((m) => m.week_id === weekId);
  const moduleResources = (moduleId: string) => resources.filter((r) => r.module_id === moduleId);

  // ── CRUD: tracks
  async function createTrack() {
    const name = prompt("New track name?")?.trim();
    if (!name) return;
    const { data, error } = await supabase.from("academy_tracks").insert({ name }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Track created.");
    await load();
    setActiveTrack(data.id);
  }
  async function renameTrack(t: Track) {
    const name = prompt("Rename track:", t.name)?.trim();
    if (!name || name === t.name) return;
    const { error } = await supabase.from("academy_tracks").update({ name }).eq("id", t.id);
    if (error) return toast.error(error.message);
    await load();
  }
  async function archiveTrack(t: Track) {
    if (!confirm(`Archive "${t.name}"? Enrollments are preserved but it disappears from staff views.`)) return;
    const { error } = await supabase.from("academy_tracks").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) return toast.error(error.message);
    await load();
  }

  // ── CRUD: phases
  async function addPhase() {
    if (!activeTrack) return;
    const name = prompt("Phase name?")?.trim();
    if (!name) return;
    const max = Math.max(0, ...trackPhases.map((p) => p.position));
    const { error } = await supabase.from("academy_phases").insert({ track_id: activeTrack, name, position: max + 1, color_token: "primary" });
    if (error) return toast.error(error.message);
    await load();
  }
  async function editPhase(ph: Phase) {
    const name = prompt("Phase name:", ph.name)?.trim();
    if (!name) return;
    const tagline = prompt("Tagline (optional):", ph.tagline ?? "");
    const { error } = await supabase.from("academy_phases").update({ name, tagline: tagline ?? null }).eq("id", ph.id);
    if (error) return toast.error(error.message);
    await load();
  }
  async function deletePhase(ph: Phase) {
    if (!confirm(`Delete phase "${ph.name}" and all its weeks/modules?`)) return;
    const { error } = await supabase.from("academy_phases").delete().eq("id", ph.id);
    if (error) return toast.error(error.message);
    await load();
  }
  async function movePhase(ph: Phase, dir: -1 | 1) {
    const sorted = [...trackPhases].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((x) => x.id === ph.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await supabase.from("academy_phases").update({ position: swap.position }).eq("id", ph.id);
    await supabase.from("academy_phases").update({ position: ph.position }).eq("id", swap.id);
    await load();
  }

  // ── CRUD: weeks
  async function addWeek(phaseId: string) {
    const title = prompt("Week title?")?.trim();
    if (!title) return;
    const existing = phaseWeeks(phaseId);
    const max = Math.max(0, ...existing.map((w) => w.week_number));
    const { error } = await supabase.from("academy_weeks").insert({ phase_id: phaseId, title, week_number: max + 1, outcomes: [] });
    if (error) return toast.error(error.message);
    await load();
  }
  async function editWeek(w: Week) {
    const title = prompt("Week title:", w.title)?.trim();
    if (!title) return;
    const objective = prompt("Objective:", w.objective ?? "");
    const outcomesStr = prompt("Outcomes (one per line):", (w.outcomes ?? []).join("\n"));
    const outcomes = outcomesStr ? outcomesStr.split("\n").map((s) => s.trim()).filter(Boolean) : [];
    const { error } = await supabase.from("academy_weeks").update({ title, objective: objective ?? null, outcomes }).eq("id", w.id);
    if (error) return toast.error(error.message);
    await load();
  }
  async function deleteWeek(w: Week) {
    if (!confirm(`Delete week "${w.title}" and its modules?`)) return;
    const { error } = await supabase.from("academy_weeks").delete().eq("id", w.id);
    if (error) return toast.error(error.message);
    if (activeWeek === w.id) setActiveWeek(null);
    await load();
  }

  // ── CRUD: modules
  async function addModule(weekId: string) {
    const title = prompt("Module title?")?.trim();
    if (!title) return;
    const existing = weekModules(weekId);
    const max = Math.max(0, ...existing.map((m) => m.position));
    const { error } = await supabase.from("academy_modules").insert({
      week_id: weekId, title, module_type: "training", position: max + 1, is_required: true,
      applies_to: "either",
    } as any);
    if (error) return toast.error(error.message);
    await load();
  }
  async function deleteModule(m: Module) {
    if (!confirm(`Delete module "${m.title}"?`)) return;
    const { error } = await supabase.from("academy_modules").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    await load();
  }
  async function moveModule(m: Module, dir: -1 | 1) {
    const sorted = weekModules(m.week_id).sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((x) => x.id === m.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await supabase.from("academy_modules").update({ position: swap.position }).eq("id", m.id);
    await supabase.from("academy_modules").update({ position: m.position }).eq("id", swap.id);
    await load();
  }
  async function patchModule(m: Module, patch: Partial<Module>) {
    const { error } = await supabase.from("academy_modules").update(patch as any).eq("id", m.id);
    if (error) return toast.error(error.message);
    await load();
  }

  // ── CRUD: resources
  async function addResource(moduleId: string) {
    const label = prompt("Resource label?")?.trim();
    if (!label) return;
    const url = prompt("URL (optional):") ?? null;
    const { error } = await supabase.from("academy_module_resources").insert({ module_id: moduleId, label, url, kind: "link" });
    if (error) return toast.error(error.message);
    await load();
  }
  async function deleteResource(id: string) {
    const { error } = await supabase.from("academy_module_resources").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await load();
  }

  if (loading) return <Skeleton className="h-96" />;

  const currentTrack = tracks.find((t) => t.id === activeTrack);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[260px,1fr]">
        {/* Track rail */}
        <GlassPanel bodyClassName="p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academy tracks</p>
            <Button size="sm" variant="ghost" onClick={createTrack}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="space-y-1">
            {tracks.map((t) => (
              <button key={t.id} onClick={() => { setActiveTrack(t.id); setActiveWeek(null); }}
                className={cn("group block w-full rounded-lg border px-3 py-2 text-left transition-colors",
                  activeTrack === t.id ? "border-primary/50 bg-primary/5" : "border-border/50 hover:bg-muted/30",
                  !t.is_active && "opacity-60")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  {!t.is_active && <Badge variant="secondary" className="text-[10px]">Archived</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {phases.filter((p) => p.track_id === t.id).length} phases · {enrollmentCounts[t.id] ?? 0} enrolled
                </p>
              </button>
            ))}
            {tracks.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No tracks yet.</p>}
          </div>
        </GlassPanel>

        {/* Editor */}
        <div className="space-y-4">
          {currentTrack ? (
            <>
              <GlassPanel bodyClassName="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <h3 className="text-lg font-bold">{currentTrack.name}</h3>
                      {!currentTrack.is_active && <Badge variant="secondary">Archived</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{currentTrack.description ?? "Multi-week curriculum with phases and modules."}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setAssignTrack(currentTrack)}><Users className="h-3.5 w-3.5 mr-1" /> Assign staff</Button>
                    <Button size="sm" variant="ghost" onClick={() => renameTrack(currentTrack)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => archiveTrack(currentTrack)}>{currentTrack.is_active ? "Archive" : "Restore"}</Button>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel bodyClassName="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Phases & weeks</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addPhase}><Plus className="h-3.5 w-3.5 mr-1" /> Phase</Button>
                </div>

                <div className="space-y-3">
                  {trackPhases.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No phases yet. Add one to get started.</p>}
                  {trackPhases.sort((a, b) => a.position - b.position).map((ph) => (
                    <div key={ph.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold">{ph.position}. {ph.name}</p>
                          {ph.tagline && <p className="text-[11px] text-muted-foreground">{ph.tagline}</p>}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button size="sm" variant="ghost" onClick={() => movePhase(ph, -1)}><ChevronUp className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => movePhase(ph, 1)}><ChevronDown className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => editPhase(ph)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => deletePhase(ph)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-border/40">
                        {phaseWeeks(ph.id).sort((a,b)=>a.week_number-b.week_number).map((w) => (
                          <div key={w.id}>
                            <div className={cn("flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-muted/30",
                              activeWeek === w.id && "bg-primary/5 border border-primary/30")}
                              onClick={() => setActiveWeek(activeWeek === w.id ? null : w.id)}>
                              <div className="min-w-0 flex items-center gap-2">
                                <Badge variant="outline" className="h-5 text-[10px]">W{w.week_number}</Badge>
                                <p className="text-sm truncate">{w.title}</p>
                                <span className="text-[11px] text-muted-foreground">· {weekModules(w.id).length} modules</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); editWeek(w); }}><Pencil className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteWeek(w); }} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>

                            {activeWeek === w.id && (
                              <div className="ml-6 mt-2 space-y-2">
                                {w.objective && <p className="text-[11px] text-muted-foreground italic">Objective: {w.objective}</p>}
                                {(w.outcomes ?? []).length > 0 && (
                                  <div className="text-[11px] text-muted-foreground">
                                    Outcomes: {w.outcomes.join(" · ")}
                                  </div>
                                )}
                                {weekModules(w.id).sort((a,b)=>a.position-b.position).map((m) => (
                                  <ModuleEditor key={m.id} m={m} resources={moduleResources(m.id)}
                                    onPatch={(p) => patchModule(m, p)} onDelete={() => deleteModule(m)}
                                    onMove={(d) => moveModule(m, d)} onAddResource={() => addResource(m.id)}
                                    onDeleteResource={deleteResource} />
                                ))}
                                <Button size="sm" variant="outline" onClick={() => addModule(w.id)}>
                                  <Plus className="h-3.5 w-3.5 mr-1" /> Module
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                        <Button size="sm" variant="ghost" onClick={() => addWeek(ph.id)} className="text-xs">
                          <Plus className="h-3 w-3 mr-1" /> Add week
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </>
          ) : (
            <GlassPanel bodyClassName="p-12 text-center text-sm text-muted-foreground">Select or create a track.</GlassPanel>
          )}
        </div>
      </div>

      <StaffAssignDialog
        open={!!assignTrack}
        onClose={() => setAssignTrack(null)}
        trackId={assignTrack?.id ?? null}
        trackName={assignTrack?.name ?? ""}
        kind="academy"
        onAssigned={load}
      />
    </>
  );
}

function ModuleEditor({ m, resources, onPatch, onDelete, onMove, onAddResource, onDeleteResource }: {
  m: Module; resources: Resource[];
  onPatch: (p: Partial<Module>) => void; onDelete: () => void; onMove: (d: -1 | 1) => void;
  onAddResource: () => void; onDeleteResource: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m);

  function save() {
    onPatch({
      title: draft.title, description: draft.description, module_type: draft.module_type,
      is_required: draft.is_required, leader_name: draft.leader_name, duration_label: draft.duration_label,
      applies_to: draft.applies_to, department: draft.department,
    });
    setEditing(false);
  }

  return (
    <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
      {!editing ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-medium">{m.title}</p>
                <Badge variant="outline" className="h-4 text-[10px]">{m.module_type}</Badge>
                {m.is_required && <Badge variant="default" className="h-4 text-[10px]">Required</Badge>}
                {m.duration_label && <span className="text-[10px] text-muted-foreground">{m.duration_label}</span>}
              </div>
              {m.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{m.description}</p>}
              {m.leader_name && <p className="text-[10px] text-muted-foreground mt-0.5">Leader: {m.leader_name}</p>}
            </div>
            <div className="flex items-center gap-0.5">
              <Button size="sm" variant="ghost" onClick={() => onMove(-1)}><ChevronUp className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => onMove(1)}><ChevronDown className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { setDraft(m); setEditing(true); }}><Pencil className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
          {resources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {resources.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1 rounded-md border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  <FileText className="h-2.5 w-2.5" />
                  {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="hover:text-foreground">{r.label}</a> : r.label}
                  <button onClick={() => onDeleteResource(r.id)} className="text-destructive hover:opacity-70">×</button>
                </span>
              ))}
            </div>
          )}
          <Button size="sm" variant="ghost" onClick={onAddResource} className="text-[10px] h-6 mt-1">
            <Plus className="h-2.5 w-2.5 mr-0.5" /> resource
          </Button>
        </>
      ) : (
        <div className="space-y-2">
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" />
          <Textarea rows={2} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Type</Label>
              <Select value={draft.module_type} onValueChange={(v: any) => setDraft({ ...draft, module_type: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{MODULE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Applies to</Label>
              <Select value={draft.applies_to} onValueChange={(v: any) => setDraft({ ...draft, applies_to: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{APPLIES_TO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Leader</Label>
              <Input className="h-8" value={draft.leader_name ?? ""} onChange={(e) => setDraft({ ...draft, leader_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-[10px]">Duration</Label>
              <Input className="h-8" value={draft.duration_label ?? ""} onChange={(e) => setDraft({ ...draft, duration_label: e.target.value })} placeholder="e.g. 30 min" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1">
            <Label className="text-xs">Required</Label>
            <Switch checked={draft.is_required} onCheckedChange={(v) => setDraft({ ...draft, is_required: v })} />
          </div>
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-3 w-3 mr-1" /> Cancel</Button>
            <Button size="sm" onClick={save}><Save className="h-3 w-3 mr-1" /> Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}
