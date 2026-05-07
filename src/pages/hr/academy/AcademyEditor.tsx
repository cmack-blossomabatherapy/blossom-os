import { useEffect, useMemo, useState } from "react";
import { Compass, Plus, Pencil, Trash2, Save, ChevronDown, ChevronRight, GripVertical, ExternalLink, Loader2, Pin, PinOff, Archive, ArchiveRestore, Sparkles, Wand2 } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type {
  AcademyTrack, AcademyPhase, AcademyWeek, AcademyModule, AcademyModuleType, AcademyPath,
} from "@/lib/academy/types";
import { MODULE_TYPE_META } from "@/lib/academy/types";

type Flags = { is_pinned?: boolean; is_archived?: boolean; pinned_at?: string | null; archived_at?: string | null };
type ModuleResource = { id: string; module_id: string; label: string; url: string | null; kind: string } & Flags;
type ModuleFull = AcademyModule & Flags & { resources: ModuleResource[]; content_markdown?: string | null; key_points?: string[] | null; activities?: string[] | null; objectives?: string[] | null };
type WeekFull = AcademyWeek & Flags & { modules: ModuleFull[] };
type PhaseFull = AcademyPhase & Flags & { weeks: WeekFull[] };
type Tree = { track: AcademyTrack & Flags; phases: PhaseFull[] } | null;

const MODULE_TYPES: AcademyModuleType[] = ["training", "shadowing", "meeting", "video", "sop", "quiz", "reflection", "task"];
const PATHS: AcademyPath[] = ["either", "new_state", "existing_state"];
const PHASE_COLOR_TOKENS = ["primary", "teal", "amber", "violet", "rose", "emerald", "sky", "slate"];

export default function AcademyEditor() {
  const { hasPerm } = useAuth();
  const canEdit = hasPerm("hr.training.assign");
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<Tree>(null);
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({});
  const [openWeeks, setOpenWeeks] = useState<Record<string, boolean>>({});
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [showArchived, setShowArchived] = useState(false);

  // edit dialog state
  type EditTarget =
    | { kind: "track"; data: AcademyTrack }
    | { kind: "phase"; data: Partial<AcademyPhase> & { track_id: string } }
    | { kind: "week"; data: Partial<AcademyWeek> & { phase_id: string } }
    | { kind: "module"; data: Partial<AcademyModule> & { week_id: string } }
    | { kind: "resource"; data: Partial<ModuleResource> & { module_id: string } };
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: string; id: string; name: string; table: string } | null>(null);
  const [aiTarget, setAiTarget] = useState<{ kind: "module"; data: any } | { kind: "week"; data: any } | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data: tracks } = await supabase.from("academy_tracks").select("*").order("created_at").limit(1);
    const track = (tracks?.[0] as AcademyTrack | undefined) ?? null;
    if (!track) { setTree(null); setLoading(false); return; }
    const [{ data: phases }, { data: weeks }, { data: modules }, { data: resources }] = await Promise.all([
      supabase.from("academy_phases").select("*").eq("track_id", track.id).order("position"),
      supabase.from("academy_weeks").select("*, phase:academy_phases!inner(track_id)").eq("phase.track_id", track.id).order("week_number"),
      supabase.from("academy_modules").select("*").order("position"),
      supabase.from("academy_module_resources").select("*").order("created_at"),
    ]);

    const resByModule = new Map<string, ModuleResource[]>();
    for (const r of (resources ?? []) as ModuleResource[]) {
      const a = resByModule.get(r.module_id) ?? [];
      a.push(r); resByModule.set(r.module_id, a);
    }
    const modsByWeek = new Map<string, (AcademyModule & { resources: ModuleResource[] })[]>();
    for (const m of (modules ?? []) as AcademyModule[]) {
      const a = modsByWeek.get(m.week_id) ?? [];
      a.push({ ...m, resources: resByModule.get(m.id) ?? [] });
      modsByWeek.set(m.week_id, a);
    }
    const weeksByPhase = new Map<string, WeekFull[]>();
    for (const w of (weeks ?? []) as any[]) {
      const a = weeksByPhase.get(w.phase_id) ?? [];
      a.push({ ...(w as AcademyWeek), modules: modsByWeek.get(w.id) ?? [] });
      weeksByPhase.set(w.phase_id, a);
    }
    const phasesFull: PhaseFull[] = (phases ?? []).map((p) => ({
      ...(p as AcademyPhase),
      weeks: weeksByPhase.get(p.id) ?? [],
    }));
    setTree({ track, phases: phasesFull });
    setLoading(false);
  }

  // ---------- mutations ----------
  async function save() {
    if (!edit) return;
    let res;
    if (edit.kind === "track") {
      const d = edit.data;
      res = await supabase.from("academy_tracks").upsert({
        id: d.id || undefined,
        name: d.name || "Untitled track",
        description: d.description ?? null,
        is_active: d.is_active ?? true,
      }).select("*").single();
    } else if (edit.kind === "phase") {
      const d = edit.data;
      const nextPos = d.position ?? ((tree?.phases.length ?? 0) + 1);
      res = await supabase.from("academy_phases").upsert({
        id: d.id || undefined,
        track_id: d.track_id,
        name: d.name || "New Phase",
        tagline: d.tagline ?? null,
        position: nextPos,
        color_token: d.color_token || "primary",
      }).select("*").single();
    } else if (edit.kind === "week") {
      const d = edit.data;
      const phaseWeeks = tree?.phases.find((p) => p.id === d.phase_id)?.weeks ?? [];
      const nextNum = d.week_number ?? (Math.max(0, ...phaseWeeks.map((w) => w.week_number)) + 1);
      res = await supabase.from("academy_weeks").upsert({
        id: d.id || undefined,
        phase_id: d.phase_id,
        title: d.title || "New Week",
        objective: d.objective ?? null,
        outcomes: (d.outcomes ?? []) as string[],
        week_number: nextNum,
      }).select("*").single();
    } else if (edit.kind === "module") {
      const d = edit.data;
      const wkMods = tree?.phases.flatMap((p) => p.weeks).find((w) => w.id === d.week_id)?.modules ?? [];
      const nextPos = d.position ?? wkMods.length;
      res = await supabase.from("academy_modules").upsert({
        id: d.id || undefined,
        week_id: d.week_id,
        title: d.title || "New Module",
        description: d.description ?? null,
        module_type: (d.module_type ?? "training") as AcademyModuleType,
        duration_label: d.duration_label ?? null,
        leader_name: d.leader_name ?? null,
        department: d.department ?? null,
        is_required: d.is_required ?? true,
        applies_to: (d.applies_to ?? "either") as AcademyPath,
        applies_to_new_state_only: d.applies_to_new_state_only ?? false,
        position: nextPos,
      }).select("*").single();
    } else if (edit.kind === "resource") {
      const d = edit.data;
      res = await supabase.from("academy_module_resources").upsert({
        id: d.id || undefined,
        module_id: d.module_id,
        label: d.label || "Resource",
        url: d.url ?? null,
        kind: d.kind || "link",
      }).select("*").single();
    }
    if (res?.error) { toast.error(res.error.message); return; }
    toast.success("Saved");
    setEdit(null);
    await load();
  }

  async function doDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase.from(confirmDelete.table as any).delete().eq("id", confirmDelete.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${confirmDelete.kind} deleted`);
    setConfirmDelete(null);
    await load();
  }

  async function togglePin(table: string, id: string, current: boolean) {
    const { error } = await supabase.from(table as any).update({
      is_pinned: !current,
      pinned_at: !current ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? "Pinned" : "Unpinned");
    await load();
  }

  async function toggleArchive(table: string, id: string, current: boolean) {
    const { error } = await supabase.from(table as any).update({
      is_archived: !current,
      archived_at: !current ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? "Archived" : "Restored");
    await load();
  }

  async function reorder(table: string, id: string, field: "position" | "week_number", delta: number) {
    // simple: bump value by delta and resave neighbors will follow ordering by load
    if (!tree) return;
    let current: number | undefined;
    if (table === "academy_phases") current = tree.phases.find((p) => p.id === id)?.position;
    if (table === "academy_weeks") current = tree.phases.flatMap((p) => p.weeks).find((w) => w.id === id)?.week_number;
    if (table === "academy_modules") current = tree.phases.flatMap((p) => p.weeks).flatMap((w) => w.modules).find((m) => m.id === id)?.position;
    if (current === undefined) return;
    const { error } = await supabase.from(table as any).update({ [field]: current + delta }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await load();
  }

  async function createTrack() {
    const { data, error } = await supabase.from("academy_tracks").insert({
      name: "Operations Academy", description: "Onboarding curriculum for office operations.", is_active: true,
    }).select("*").single();
    if (error) { toast.error(error.message); return; }
    toast.success("Track created");
    await load();
    setEdit({ kind: "track", data: data as AcademyTrack });
  }

  if (!canEdit) {
    return (
      <PageShell title="Operations Academy Editor" description="Edit the curriculum tree." icon={Compass}>
        <Card className="p-6 text-sm text-muted-foreground">You need <code>hr.training.assign</code> permission to edit the academy.</Card>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell title="Operations Academy Editor" description="Edit tracks, phases, weeks, and modules." icon={Compass}>
        <Skeleton className="h-96" />
      </PageShell>
    );
  }

  if (!tree) {
    return (
      <PageShell title="Operations Academy Editor" description="No track exists yet." icon={Compass}>
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">Create the first academy track to get started.</p>
          <Button onClick={createTrack}><Plus className="h-4 w-4" /> Create track</Button>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Operations Academy Editor"
      description="Curriculum tree — tracks, phases, weeks, modules, and resources."
      icon={Compass}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowArchived((s) => !s)}>
            {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
          <Button variant="outline" onClick={() => setEdit({ kind: "track", data: tree.track })}>
            <Pencil className="h-4 w-4" /> Edit track
          </Button>
        </div>
      }
    >
      {/* Track header */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{tree.track.name}</h3>
              <Badge variant={tree.track.is_active ? "default" : "secondary"}>{tree.track.is_active ? "Active" : "Inactive"}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tree.track.description || "No description."}</p>
          </div>
          <Button size="sm" onClick={() => setEdit({ kind: "phase", data: { track_id: tree.track.id, color_token: "primary" } })}>
            <Plus className="h-4 w-4" /> Add phase
          </Button>
        </div>
      </Card>

      {/* Phases */}
      <div className="space-y-3">
        {tree.phases.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">No phases yet. Add your first phase above.</Card>
        )}
        {sortPinned(tree.phases).filter((p) => showArchived || !p.is_archived).map((phase) => {
          const open = openPhases[phase.id] ?? true;
          return (
            <Card key={phase.id} className={cn("overflow-hidden", phase.is_archived && "opacity-60", phase.is_pinned && "ring-1 ring-primary/40")}>
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30">
                <button className="flex items-center gap-2 flex-1 text-left" onClick={() => setOpenPhases((s) => ({ ...s, [phase.id]: !open }))}>
                  {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <Badge variant="outline" className="font-mono">P{phase.position}</Badge>
                  <span className="text-sm font-semibold text-foreground">{phase.name}</span>
                  {phase.tagline && <span className="text-xs text-muted-foreground">— {phase.tagline}</span>}
                  <Badge variant="secondary" className="ml-2 text-[10px]">{phase.weeks.length} weeks</Badge>
                  {phase.is_pinned && <Badge variant="default" className="text-[10px]"><Pin className="h-3 w-3" /> Pinned</Badge>}
                  {phase.is_archived && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
                </button>
                <div className="flex items-center gap-1">
                  <IconBtn title="Move up" onClick={() => reorder("academy_phases", phase.id, "position", -1)}><GripVertical className="h-3.5 w-3.5 rotate-90" /></IconBtn>
                  <IconBtn title="Edit" onClick={() => setEdit({ kind: "phase", data: phase })}><Pencil className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn title={phase.is_pinned ? "Unpin" : "Pin"} onClick={() => togglePin("academy_phases", phase.id, !!phase.is_pinned)}>
                    {phase.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </IconBtn>
                  <IconBtn title={phase.is_archived ? "Restore" : "Archive"} onClick={() => toggleArchive("academy_phases", phase.id, !!phase.is_archived)}>
                    {phase.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                  </IconBtn>
                  <IconBtn title="Delete" destructive onClick={() => setConfirmDelete({ kind: "Phase", id: phase.id, name: phase.name, table: "academy_phases" })}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                  <Button size="sm" variant="ghost" onClick={() => setEdit({ kind: "week", data: { phase_id: phase.id, outcomes: [] } })}>
                    <Plus className="h-3.5 w-3.5" /> Week
                  </Button>
                </div>
              </div>

              {open && (
                <div className="p-4 space-y-3">
                  {phase.weeks.length === 0 && (
                    <p className="text-xs text-muted-foreground italic px-2">No weeks in this phase yet.</p>
                  )}
                  {sortPinned(phase.weeks).filter((w) => showArchived || !w.is_archived).map((week) => {
                    const wOpen = openWeeks[week.id] ?? false;
                    return (
                      <div key={week.id} className={cn("rounded-lg border border-border/60 bg-background", week.is_archived && "opacity-60", week.is_pinned && "ring-1 ring-primary/30")}>
                        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                          <button className="flex items-center gap-2 flex-1 text-left" onClick={() => setOpenWeeks((s) => ({ ...s, [week.id]: !wOpen }))}>
                            {wOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                            <Badge variant="outline" className="font-mono text-[10px]">W{week.week_number}</Badge>
                            <span className="text-sm font-medium text-foreground">{week.title}</span>
                            <Badge variant="secondary" className="text-[10px]">{week.modules.length} modules</Badge>
                            {week.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                            {week.is_archived && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
                          </button>
                          <div className="flex items-center gap-1">
                            <IconBtn title="Edit" onClick={() => setEdit({ kind: "week", data: week })}><Pencil className="h-3.5 w-3.5" /></IconBtn>
                            <IconBtn title={week.is_pinned ? "Unpin" : "Pin"} onClick={() => togglePin("academy_weeks", week.id, !!week.is_pinned)}>
                              {week.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                            </IconBtn>
                            <IconBtn title={week.is_archived ? "Restore" : "Archive"} onClick={() => toggleArchive("academy_weeks", week.id, !!week.is_archived)}>
                              {week.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                            </IconBtn>
                            <IconBtn title="Delete" destructive onClick={() => setConfirmDelete({ kind: "Week", id: week.id, name: week.title, table: "academy_weeks" })}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                            <Button size="sm" variant="ghost" onClick={() => setEdit({ kind: "module", data: { week_id: week.id, module_type: "training", applies_to: "either", is_required: true } })}>
                              <Plus className="h-3.5 w-3.5" /> Module
                            </Button>
                          </div>
                        </div>

                        {wOpen && (
                          <div className="border-t border-border/60 px-3 py-3 space-y-2">
                            {week.objective && <p className="text-xs text-muted-foreground italic">Objective: {week.objective}</p>}
                            {week.outcomes.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Outcomes: {week.outcomes.map((o, i) => <Badge key={i} variant="secondary" className="mr-1 text-[10px]">{o}</Badge>)}
                              </div>
                            )}
                            {week.modules.length === 0 && <p className="text-xs text-muted-foreground italic">No modules in this week.</p>}
                            {sortPinned(week.modules).filter((m) => showArchived || !m.is_archived).map((m) => {
                              const mOpen = openModules[m.id] ?? false;
                              const meta = MODULE_TYPE_META[m.module_type];
                              return (
                                <div key={m.id} className={cn("rounded-md border border-border/50 bg-card", m.is_archived && "opacity-60", m.is_pinned && "ring-1 ring-primary/30")}>
                                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                                    <button className="flex items-center gap-2 flex-1 text-left min-w-0" onClick={() => setOpenModules((s) => ({ ...s, [m.id]: !mOpen }))}>
                                      {mOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", meta.tone)}>{meta.label}</span>
                                      <span className="text-sm text-foreground truncate">{m.title}</span>
                                      {!m.is_required && <Badge variant="outline" className="text-[10px]">Optional</Badge>}
                                      {m.applies_to !== "either" && <Badge variant="outline" className="text-[10px]">{m.applies_to.replace("_", " ")}</Badge>}
                                      {m.duration_label && <span className="text-xs text-muted-foreground">· {m.duration_label}</span>}
                                      {m.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                                      {m.is_archived && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
                                    </button>
                                    <div className="flex items-center gap-1">
                                      <IconBtn title="Edit" onClick={() => setEdit({ kind: "module", data: m })}><Pencil className="h-3.5 w-3.5" /></IconBtn>
                                      <IconBtn title={m.is_pinned ? "Unpin" : "Pin"} onClick={() => togglePin("academy_modules", m.id, !!m.is_pinned)}>
                                        {m.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                                      </IconBtn>
                                      <IconBtn title={m.is_archived ? "Restore" : "Archive"} onClick={() => toggleArchive("academy_modules", m.id, !!m.is_archived)}>
                                        {m.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                                      </IconBtn>
                                      <IconBtn title="Delete" destructive onClick={() => setConfirmDelete({ kind: "Module", id: m.id, name: m.title, table: "academy_modules" })}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                                    </div>
                                  </div>
                                  {mOpen && (
                                    <div className="border-t border-border/50 px-3 py-3 space-y-2 bg-muted/20">
                                      {m.description && <p className="text-xs text-foreground/80">{m.description}</p>}
                                      <div className="text-xs text-muted-foreground space-x-3">
                                        {m.leader_name && <span>Leader: {m.leader_name}</span>}
                                        {m.department && <span>Dept: {m.department}</span>}
                                      </div>
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <Label className="text-xs text-muted-foreground">Resources ({m.resources.length})</Label>
                                          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setEdit({ kind: "resource", data: { module_id: m.id, kind: "link" } })}>
                                            <Plus className="h-3 w-3" /> Add
                                          </Button>
                                        </div>
                                        {m.resources.length === 0 && <p className="text-xs text-muted-foreground italic">No resources.</p>}
                                        {sortPinned(m.resources).filter((r) => showArchived || !r.is_archived).map((r) => (
                                          <div key={r.id} className={cn("flex items-center justify-between gap-2 py-1 text-xs", r.is_archived && "opacity-60")}>
                                            <div className="flex items-center gap-2 min-w-0">
                                              <Badge variant="outline" className="text-[10px]">{r.kind}</Badge>
                                              <span className="truncate text-foreground">{r.label}</span>
                                              {r.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                                              {r.url && (
                                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                                  <ExternalLink className="h-3 w-3" />
                                                </a>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <IconBtn title="Edit" onClick={() => setEdit({ kind: "resource", data: r })}><Pencil className="h-3 w-3" /></IconBtn>
                                              <IconBtn title={r.is_pinned ? "Unpin" : "Pin"} onClick={() => togglePin("academy_module_resources", r.id, !!r.is_pinned)}>
                                                {r.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                                              </IconBtn>
                                              <IconBtn title={r.is_archived ? "Restore" : "Archive"} onClick={() => toggleArchive("academy_module_resources", r.id, !!r.is_archived)}>
                                                {r.is_archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                                              </IconBtn>
                                              <IconBtn title="Delete" destructive onClick={() => setConfirmDelete({ kind: "Resource", id: r.id, name: r.label, table: "academy_module_resources" })}><Trash2 className="h-3 w-3" /></IconBtn>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {edit?.kind === "track" && "Edit Track"}
              {edit?.kind === "phase" && (edit.data.id ? "Edit Phase" : "New Phase")}
              {edit?.kind === "week" && (edit.data.id ? "Edit Week" : "New Week")}
              {edit?.kind === "module" && (edit.data.id ? "Edit Module" : "New Module")}
              {edit?.kind === "resource" && (edit.data.id ? "Edit Resource" : "New Resource")}
            </DialogTitle>
          </DialogHeader>
          {edit && <EditForm edit={edit} setEdit={setEdit} />}
          <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
            <div>
              {(edit?.kind === "module" || edit?.kind === "week") && (
                <Button variant="ghost" size="sm" onClick={() => setAiTarget({ kind: edit.kind, data: edit.data } as any)}>
                  <Sparkles className="h-4 w-4" /> Generate with AI
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
              <Button onClick={save}><Save className="h-4 w-4" /> Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIGenerateDialog
        target={aiTarget}
        onClose={() => setAiTarget(null)}
        onApply={(generated) => {
          if (!aiTarget || !edit) return;
          if (edit.kind === "module") {
            const newDesc = generated.description || edit.data.description || "";
            const composed = [
              newDesc,
              generated.key_points?.length ? "\n\n**Key points:**\n" + generated.key_points.map((k: string) => `- ${k}`).join("\n") : "",
              generated.activities?.length ? "\n\n**Activities:**\n" + generated.activities.map((a: string) => `- ${a}`).join("\n") : "",
              generated.content_markdown ? "\n\n" + generated.content_markdown : "",
            ].join("").trim();
            setEdit({
              ...edit,
              data: {
                ...edit.data,
                title: edit.data.title || generated.title,
                description: composed,
                duration_label: edit.data.duration_label || generated.duration_label,
                quiz: generated.quiz?.length ? generated.quiz : (edit.data as any).quiz,
              },
            });
          } else if (edit.kind === "week") {
            setEdit({
              ...edit,
              data: {
                ...edit.data,
                title: edit.data.title || generated.title,
                objective: edit.data.objective || generated.description,
                outcomes: (edit.data.outcomes && edit.data.outcomes.length ? edit.data.outcomes : generated.objectives) ?? [],
              },
            });
          }
          setAiTarget(null);
          toast.success("AI content applied — review and save");
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.kind.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{confirmDelete?.name}</strong> and all child records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function IconBtn({ children, onClick, title, destructive }: { children: React.ReactNode; onClick: () => void; title: string; destructive?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-md hover:bg-muted text-muted-foreground transition",
        destructive && "hover:bg-destructive/10 hover:text-destructive"
      )}
    >
      {children}
    </button>
  );
}

function EditForm({ edit, setEdit }: { edit: any; setEdit: (e: any) => void }) {
  const update = (patch: Record<string, unknown>) => setEdit({ ...edit, data: { ...edit.data, ...patch } });
  const d = edit.data;

  if (edit.kind === "track") {
    return (
      <div className="space-y-3">
        <Field label="Name"><Input value={d.name ?? ""} onChange={(e) => update({ name: e.target.value })} /></Field>
        <Field label="Description"><Textarea rows={3} value={d.description ?? ""} onChange={(e) => update({ description: e.target.value })} /></Field>
        <div className="flex items-center gap-2">
          <Switch checked={d.is_active ?? true} onCheckedChange={(v) => update({ is_active: v })} />
          <Label className="text-sm">Active</Label>
        </div>
      </div>
    );
  }
  if (edit.kind === "phase") {
    return (
      <div className="space-y-3">
        <Field label="Name"><Input value={d.name ?? ""} onChange={(e) => update({ name: e.target.value })} /></Field>
        <Field label="Tagline"><Input value={d.tagline ?? ""} onChange={(e) => update({ tagline: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Position"><Input type="number" value={d.position ?? ""} onChange={(e) => update({ position: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Color">
            <Select value={d.color_token ?? "primary"} onValueChange={(v) => update({ color_token: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PHASE_COLOR_TOKENS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    );
  }
  if (edit.kind === "week") {
    const outcomesText = (d.outcomes ?? []).join("\n");
    return (
      <div className="space-y-3">
        <Field label="Title"><Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} /></Field>
        <Field label="Week number"><Input type="number" value={d.week_number ?? ""} onChange={(e) => update({ week_number: parseInt(e.target.value) || 0 })} /></Field>
        <Field label="Objective"><Textarea rows={2} value={d.objective ?? ""} onChange={(e) => update({ objective: e.target.value })} /></Field>
        <Field label="Outcomes (one per line)">
          <Textarea rows={4} value={outcomesText} onChange={(e) => update({ outcomes: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
        </Field>
      </div>
    );
  }
  if (edit.kind === "module") {
    return (
      <div className="space-y-3">
        <Field label="Title"><Input value={d.title ?? ""} onChange={(e) => update({ title: e.target.value })} /></Field>
        <Field label="Description"><Textarea rows={3} value={d.description ?? ""} onChange={(e) => update({ description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={d.module_type ?? "training"} onValueChange={(v) => update({ module_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODULE_TYPES.map((t) => <SelectItem key={t} value={t}>{MODULE_TYPE_META[t].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Applies to">
            <Select value={d.applies_to ?? "either"} onValueChange={(v) => update({ applies_to: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PATHS.map((p) => <SelectItem key={p} value={p}>{p.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Duration label"><Input placeholder="e.g. 30 min" value={d.duration_label ?? ""} onChange={(e) => update({ duration_label: e.target.value })} /></Field>
          <Field label="Position"><Input type="number" value={d.position ?? 0} onChange={(e) => update({ position: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Leader name"><Input value={d.leader_name ?? ""} onChange={(e) => update({ leader_name: e.target.value })} /></Field>
          <Field label="Department"><Input value={d.department ?? ""} onChange={(e) => update({ department: e.target.value })} /></Field>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={d.is_required ?? true} onCheckedChange={(v) => update({ is_required: v })} />
          <Label className="text-sm">Required</Label>
        </div>
      </div>
    );
  }
  if (edit.kind === "resource") {
    return (
      <div className="space-y-3">
        <Field label="Label"><Input value={d.label ?? ""} onChange={(e) => update({ label: e.target.value })} /></Field>
        <Field label="URL"><Input value={d.url ?? ""} onChange={(e) => update({ url: e.target.value })} /></Field>
        <Field label="Kind">
          <Select value={d.kind ?? "link"} onValueChange={(v) => update({ kind: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["link", "video", "sop", "doc", "tango", "form"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
    );
  }
  return null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function sortPinned<T extends { is_pinned?: boolean; pinned_at?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!!a.is_pinned !== !!b.is_pinned) return a.is_pinned ? -1 : 1;
    return 0;
  });
}

function AIGenerateDialog({
  target,
  onClose,
  onApply,
}: {
  target: { kind: "module" | "week"; data: any } | null;
  onClose: () => void;
  onApply: (generated: any) => void;
}) {
  const [mode, setMode] = useState<"both" | "module" | "quiz">("both");
  const [tone, setTone] = useState<"Simple" | "Detailed" | "Technical">("Detailed");
  const [complexity, setComplexity] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);

  useEffect(() => {
    if (!target) { setPreview(null); setExtra(""); }
  }, [target]);

  if (!target) return null;
  const isWeek = target.kind === "week";

  async function generate() {
    setLoading(true);
    setPreview(null);
    try {
      const payload: any = {
        mode: isWeek ? "module" : mode,
        tone,
        quizComplexity: complexity,
        quizQuestionCount: count,
        extraInstructions: extra || undefined,
      };
      if (isWeek) {
        payload.weekId = target.data.id;
        payload.weekTitle = target.data.title;
        payload.weekObjective = target.data.objective;
        payload.weekOutcomes = target.data.outcomes;
      } else {
        payload.moduleId = target.data.id;
        payload.weekId = target.data.week_id;
        payload.moduleTitle = target.data.title;
        payload.moduleType = target.data.module_type;
        payload.moduleDescriptionSeed = target.data.description;
        payload.leaderName = target.data.leader_name;
        payload.department = target.data.department;
      }
      const { data, error } = await supabase.functions.invoke("generate-academy-module-content", { body: payload });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setPreview((data as any).draft);
    } catch (e: any) {
      toast.error(e?.message || "AI generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate {isWeek ? "week module content" : "module content & quiz"} with AI
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!isWeek && (
            <Field label="What to generate">
              <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Module content + quiz</SelectItem>
                  <SelectItem value="module">Module content only</SelectItem>
                  <SelectItem value="quiz">Quiz only</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tone">
              <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simple">Simple</SelectItem>
                  <SelectItem value="Detailed">Detailed</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quiz difficulty">
              <Select value={complexity} onValueChange={(v) => setComplexity(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="# Questions">
              <Input type="number" min={3} max={10} value={count} onChange={(e) => setCount(Math.max(3, Math.min(10, parseInt(e.target.value) || 5)))} />
            </Field>
          </div>
          <Field label="Extra instructions (optional)">
            <Textarea rows={2} placeholder="e.g. Focus on CentralReach intake workflow" value={extra} onChange={(e) => setExtra(e.target.value)} />
          </Field>
          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? "Generating…" : "Generate"}
          </Button>

          {preview && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground">Preview</p>
              {preview.title && <p className="text-sm font-medium">{preview.title}</p>}
              {preview.description && <p className="text-xs text-muted-foreground">{preview.description}</p>}
              {preview.key_points?.length > 0 && (
                <div className="text-xs">
                  <span className="font-medium">Key points:</span>
                  <ul className="list-disc pl-4 text-muted-foreground">
                    {preview.key_points.map((k: string, i: number) => <li key={i}>{k}</li>)}
                  </ul>
                </div>
              )}
              {preview.activities?.length > 0 && (
                <div className="text-xs">
                  <span className="font-medium">Activities:</span>
                  <ul className="list-disc pl-4 text-muted-foreground">
                    {preview.activities.map((a: string, i: number) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
              {preview.content_markdown && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Module content ({preview.content_markdown.length} chars)</summary>
                  <pre className="whitespace-pre-wrap text-muted-foreground mt-1 max-h-48 overflow-y-auto">{preview.content_markdown}</pre>
                </details>
              )}
              {preview.quiz?.length > 0 && (
                <details className="text-xs" open>
                  <summary className="cursor-pointer font-medium">Quiz ({preview.quiz.length} questions)</summary>
                  <ol className="list-decimal pl-4 space-y-1 mt-1 text-muted-foreground">
                    {preview.quiz.map((q: any, i: number) => (
                      <li key={i}>
                        <div className="text-foreground">{q.question}</div>
                        {q.options?.length > 0 && (
                          <ul className="list-disc pl-4">
                            {q.options.map((o: string, j: number) => (
                              <li key={j} className={o === q.answer ? "text-primary font-medium" : ""}>{o}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => preview && onApply(preview)} disabled={!preview}>
            <Save className="h-4 w-4" /> Apply to form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}