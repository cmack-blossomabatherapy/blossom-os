import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Plus, Sparkles, Search, Pin, PinOff, Trash2, Pencil, Users, AlertTriangle, CheckCircle2, ListChecks, Wand2, Send, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { GlassStat } from "@/components/shared/GlassStat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { AcademyEditor } from "@/components/training/AcademyEditor";
import { StaffAssignDialog } from "@/components/training/StaffAssignDialog";
import { TrackCoursesSortable } from "@/components/training/TrackCoursesSortable";

type Course = {
  id: string; title: string; name: string; description: string | null;
  category: string | null; training_type: string; difficulty: string;
  estimated_minutes: number; renewal_months: number | null;
  role_visibility: string[]; required_default: boolean;
  is_active: boolean; status: string; is_pinned: boolean; external_url: string | null;
};
type Track = { id: string; name: string; description: string | null; role_targets: string[]; auto_assign_on_hire: boolean; is_active: boolean };
type TrackCourse = { id: string; track_id: string; course_id: string; sort_order: number; required: boolean; due_after_days: number | null };
type Assignment = { id: string; course_id: string; assigned_to_user_id: string | null; assigned_to_role: string | null; due_date: string | null; required: boolean; created_at: string };

const ROLE_OPTIONS = ["rbt", "bcba", "hr", "hr_admin", "ops_manager", "intake", "scheduling", "staffing", "qa", "finance", "clinic", "admin"];
const TYPE_OPTIONS = ["SOP", "Compliance", "Clinical", "Onboarding", "Soft Skills", "Policy"];
const DIFFICULTY = ["Beginner", "Intermediate", "Advanced"];

export default function Training() {
  const { hasPerm, isAdmin } = useAuth();
  const canManage = hasPerm("hr.training.assign") || isAdmin;
  const [tab, setTab] = useState("catalog");
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackCourses, setTrackCourses] = useState<TrackCourse[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState("");

  // dialogs
  const [editor, setEditor] = useState<Partial<Course> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<Course | null>(null);
  const [trackEditor, setTrackEditor] = useState<Partial<Track> | null>(null);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [staffAssignTrack, setStaffAssignTrack] = useState<Track | null>(null);
  const [trackRoleFilter, setTrackRoleFilter] = useState<"all" | "rbt" | "bcba">("all");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [c, t, tc, a] = await Promise.all([
      supabase.from("training_courses").select("*").order("is_pinned", { ascending: false }).order("title"),
      supabase.from("training_tracks").select("*").order("name"),
      supabase.from("training_track_courses").select("*").order("sort_order"),
      supabase.from("training_assignments").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (c.error) toast.error(c.error.message);
    setCourses((c.data ?? []) as Course[]);
    setTracks((t.data ?? []) as Track[]);
    setTrackCourses((tc.data ?? []) as TrackCourse[]);
    setAssignments((a.data ?? []) as Assignment[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return courses;
    return courses.filter((c) => `${c.title} ${c.name} ${c.category ?? ""} ${c.training_type}`.toLowerCase().includes(q));
  }, [courses, search]);

  const stats = useMemo(() => ({
    active: courses.filter((c) => c.is_active).length,
    pinned: courses.filter((c) => c.is_pinned).length,
    assignments: assignments.length,
    overdue: assignments.filter((a) => a.due_date && a.due_date < new Date().toISOString().slice(0, 10)).length,
  }), [courses, assignments]);

  // ── Course CRUD
  async function saveCourse(c: Partial<Course>) {
    const payload: any = {
      title: c.title, name: c.title, description: c.description ?? null,
      category: c.category ?? null, training_type: c.training_type ?? "SOP",
      difficulty: c.difficulty ?? "Beginner",
      estimated_minutes: c.estimated_minutes ?? 30,
      renewal_months: c.renewal_months ?? null,
      role_visibility: c.role_visibility ?? [], required_default: c.required_default ?? false,
      external_url: c.external_url ?? null, is_active: c.is_active ?? true,
      status: c.is_active === false ? "archived" : "active",
    };
    const res = c.id
      ? await supabase.from("training_courses").update(payload).eq("id", c.id)
      : await supabase.from("training_courses").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(c.id ? "Course updated." : "Course created.");
    setEditor(null);
    // ingest into knowledge base
    if (payload.description) {
      void ingest({ source_type: "training_course", source_id: c.id, source_title: payload.title, content: `${payload.title}\n\n${payload.description}` });
    }
    await load();
  }

  async function togglePin(c: Course) {
    const { error } = await supabase.from("training_courses").update({ is_pinned: !c.is_pinned, pinned_at: !c.is_pinned ? new Date().toISOString() : null }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    await load();
  }
  async function toggleArchive(c: Course) {
    const next = !c.is_active;
    const { error } = await supabase.from("training_courses").update({ is_active: next, status: next ? "active" : "archived" }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? "Course restored." : "Course archived.");
    await load();
  }
  async function duplicateCourse(c: Course) {
    const { error } = await supabase.from("training_courses").insert({
      title: `${c.title} (copy)`, name: `${c.name} (copy)`, description: c.description,
      category: c.category, training_type: c.training_type, difficulty: c.difficulty,
      estimated_minutes: c.estimated_minutes, renewal_months: c.renewal_months,
      role_visibility: c.role_visibility, required_default: c.required_default,
      external_url: c.external_url, is_active: false, status: "draft",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Duplicated as draft.");
    await load();
  }
  async function deleteCourse(c: Course) {
    const { error } = await supabase.from("training_courses").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Course deleted.");
    setConfirmDelete(null);
    await load();
  }

  // ── Tracks
  async function saveTrack(t: Partial<Track>) {
    const payload: any = { name: t.name, description: t.description ?? null, role_targets: t.role_targets ?? [], auto_assign_on_hire: t.auto_assign_on_hire ?? false, is_active: t.is_active ?? true };
    const res = t.id ? await supabase.from("training_tracks").update(payload).eq("id", t.id) : await supabase.from("training_tracks").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(t.id ? "Track updated." : "Track created.");
    setTrackEditor(null);
    await load();
  }
  async function addCourseToTrack(trackId: string, courseId: string) {
    const max = Math.max(0, ...trackCourses.filter((x) => x.track_id === trackId).map((x) => x.sort_order));
    const { error } = await supabase.from("training_track_courses").insert({ track_id: trackId, course_id: courseId, sort_order: max + 1, required: true });
    if (error) { toast.error(error.message); return; }
    await load();
  }
  async function removeFromTrack(id: string) {
    const { error } = await supabase.from("training_track_courses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await load();
  }
  async function reorderTrackCourses(trackId: string, orderedIds: string[]) {
    // Optimistic update
    setTrackCourses((prev) => prev.map((tc) => {
      if (tc.track_id !== trackId) return tc;
      const idx = orderedIds.indexOf(tc.id);
      return idx >= 0 ? { ...tc, sort_order: idx + 1 } : tc;
    }));
    const updates = orderedIds.map((id, i) =>
      supabase.from("training_track_courses").update({ sort_order: i + 1 }).eq("id", id)
    );
    const results = await Promise.all(updates);
    const err = results.find((r) => r.error)?.error;
    if (err) { toast.error(err.message); await load(); return; }
    toast.success("Order saved");
  }
  async function updateTrackCourse(id: string, patch: Partial<TrackCourse>) {
    setTrackCourses((prev) => prev.map((tc) => (tc.id === id ? { ...tc, ...patch } : tc)));
    const { error } = await supabase.from("training_track_courses").update(patch).eq("id", id);
    if (error) { toast.error(error.message); await load(); }
  }

  // ── Assignment
  async function quickAssign(course: Course, target: { role?: string; user_id?: string }, dueDate: string | null, required: boolean) {
    const payload: any = { course_id: course.id, required, due_date: dueDate || null };
    if (target.user_id) payload.assigned_to_user_id = target.user_id;
    if (target.role) payload.assigned_to_role = target.role;
    const { error } = await supabase.from("training_assignments").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Assignment created.");
    setAssignOpen(null);
    await load();
  }

  // ── Knowledge ingest helper
  async function ingest(body: any) {
    try {
      const { data: sess } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
        body: JSON.stringify(body),
      });
    } catch { /* non-blocking */ }
  }

  if (!canManage) {
    return <GlassPageShell eyebrow="Training Admin" eyebrowIcon={GraduationCap} title="Access required" description="You need Training Admin permissions to manage the catalog."><GlassPanel bodyClassName="p-6">Contact an HR Admin.</GlassPanel></GlassPageShell>;
  }

  return (
    <GlassPageShell
      eyebrow="HR · Training Command"
      eyebrowIcon={GraduationCap}
      title="Training Admin"
      description="Build, edit, pin, assign, and AI-generate trainings for every role."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}><Wand2 className="h-3.5 w-3.5 mr-1.5" /> Generate with AI</Button>
          <Button size="sm" onClick={() => setEditor({ training_type: "SOP", difficulty: "Beginner", estimated_minutes: 30, role_visibility: [], is_active: true })}><Plus className="h-3.5 w-3.5 mr-1.5" /> New course</Button>
        </div>
      }
      stats={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <GlassStat icon={ListChecks} tone="primary" label="Active courses" value={stats.active} />
          <GlassStat icon={Pin} tone="warning" label="Pinned" value={stats.pinned} />
          <GlassStat icon={Users} tone="success" label="Assignments" value={stats.assignments} />
          <GlassStat icon={AlertTriangle} tone="destructive" label="Overdue" value={stats.overdue} />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="catalog">Catalog ({courses.length})</TabsTrigger>
          <TabsTrigger value="tracks">Tracks ({tracks.length})</TabsTrigger>
          <TabsTrigger value="academy">Operations Academy</TabsTrigger>
          <TabsTrigger value="assignments">Assignments ({assignments.length})</TabsTrigger>
        </TabsList>

        {/* CATALOG */}
        <TabsContent value="catalog">
          <GlassPanel bodyClassName="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…" className="pl-9 h-9" />
              </div>
            </div>

            {loading ? <Skeleton className="h-40" /> : (
              <div className="space-y-2">
                {filtered.map((c) => (
                  <div key={c.id} className={cn("flex flex-wrap items-start gap-3 rounded-xl border p-3 transition-colors", c.is_pinned ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card/40")}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{c.title}</p>
                        {c.is_pinned && <Badge variant="default" className="h-5 gap-1"><Pin className="h-3 w-3" /> Pinned</Badge>}
                        <Badge variant="outline" className="h-5">{c.training_type}</Badge>
                        <Badge variant="outline" className="h-5">{c.difficulty}</Badge>
                        {!c.is_active && <Badge variant="secondary" className="h-5">Archived</Badge>}
                        {c.role_visibility?.map((r) => <Badge key={r} variant="secondary" className="h-5 text-[10px]">{r}</Badge>)}
                      </div>
                      {c.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground">{c.estimated_minutes} min{c.renewal_months ? ` · renews every ${c.renewal_months} mo` : ""}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => togglePin(c)} title={c.is_pinned ? "Unpin" : "Pin"}>{c.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setAssignOpen(c)}><Send className="h-3.5 w-3.5 mr-1" /> Assign</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditor(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => duplicateCourse(c)} title="Duplicate">⧉</Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleArchive(c)} title={c.is_active ? "Archive" : "Restore"}>{c.is_active ? <Archive className="h-3.5 w-3.5" /> : <ArchiveRestore className="h-3.5 w-3.5" />}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(c)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No courses match.</p>}
              </div>
            )}
          </GlassPanel>
        </TabsContent>

        {/* TRACKS */}
        <TabsContent value="tracks">
          <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
            <GlassPanel bodyClassName="p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tracks</p>
                <Button size="sm" variant="ghost" onClick={() => setTrackEditor({ role_targets: [], auto_assign_on_hire: false, is_active: true })}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="mb-2 grid grid-cols-3 gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
                {(["all", "rbt", "bcba"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTrackRoleFilter(k)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors",
                      trackRoleFilter === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {k === "all" ? "All" : k.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                {tracks
                  .filter((t) => trackRoleFilter === "all" || (t.role_targets ?? []).includes(trackRoleFilter))
                  .map((t) => (
                  <button key={t.id} onClick={() => setActiveTrack(t)} className={cn("block w-full rounded-lg border px-3 py-2 text-left transition-colors", activeTrack?.id === t.id ? "border-primary/50 bg-primary/5" : "border-border/50 hover:bg-muted/30")}>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{(t.role_targets ?? []).join(", ") || "All roles"} · {trackCourses.filter((x) => x.track_id === t.id).length} courses</p>
                  </button>
                ))}
                {tracks.filter((t) => trackRoleFilter === "all" || (t.role_targets ?? []).includes(trackRoleFilter)).length === 0 && (
                  <p className="py-4 text-center text-[11px] text-muted-foreground">
                    No tracks for {trackRoleFilter.toUpperCase()}.
                  </p>
                )}
              </div>
            </GlassPanel>

            <GlassPanel bodyClassName="p-4">
              {!activeTrack ? <p className="py-12 text-center text-sm text-muted-foreground">Select a track to manage its courses.</p> : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{activeTrack.name}</h3>
                      <p className="text-xs text-muted-foreground">{activeTrack.description}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setStaffAssignTrack(activeTrack)}><Users className="h-3.5 w-3.5 mr-1" /> Assign staff</Button>
                      <Button size="sm" variant="outline" onClick={() => setTrackEditor(activeTrack)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Courses in track</p>
                    <TrackCoursesSortable
                      rows={trackCourses
                        .filter((x) => x.track_id === activeTrack.id)
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((tc) => {
                          const c = courses.find((x) => x.id === tc.course_id);
                          return {
                            id: tc.id,
                            course_id: tc.course_id,
                            sort_order: tc.sort_order,
                            required: tc.required,
                            due_after_days: tc.due_after_days,
                            title: c?.title ?? "(missing course)",
                            minutes: c?.estimated_minutes ?? 0,
                          };
                        })}
                      onReorder={(ids) => reorderTrackCourses(activeTrack.id, ids)}
                      onToggleRequired={(id, v) => updateTrackCourse(id, { required: v })}
                      onDueChange={(id, v) => updateTrackCourse(id, { due_after_days: v })}
                      onRemove={removeFromTrack}
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add a course</p>
                    <Select onValueChange={(v) => addCourseToTrack(activeTrack.id, v)}>
                      <SelectTrigger><SelectValue placeholder="Choose a course…" /></SelectTrigger>
                      <SelectContent>
                        {courses.filter((c) => !trackCourses.some((x) => x.track_id === activeTrack.id && x.course_id === c.id)).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </GlassPanel>
          </div>
        </TabsContent>

        {/* ASSIGNMENTS */}
        <TabsContent value="assignments">
          <GlassPanel bodyClassName="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3">Course</th><th className="py-2 pr-3">Target</th><th className="py-2 pr-3">Due</th><th className="py-2 pr-3">Required</th><th className="py-2 pr-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => {
                    const c = courses.find((x) => x.id === a.course_id);
                    return (
                      <tr key={a.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-2 pr-3 font-medium">{c?.title ?? "—"}</td>
                        <td className="py-2 pr-3">{a.assigned_to_user_id ? "User" : a.assigned_to_role ? `Role: ${a.assigned_to_role}` : "All"}</td>
                        <td className="py-2 pr-3 tabular-nums">{a.due_date ?? "—"}</td>
                        <td className="py-2 pr-3">{a.required ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : "—"}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {assignments.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No assignments yet. Use the Assign button on any course.</p>}
            </div>
          </GlassPanel>
        </TabsContent>

        {/* ACADEMY EDITOR */}
        <TabsContent value="academy">
          <AcademyEditor />
        </TabsContent>
      </Tabs>
      <StaffAssignDialog
        open={!!staffAssignTrack}
        onClose={() => setStaffAssignTrack(null)}
        trackId={staffAssignTrack?.id ?? null}
        trackName={staffAssignTrack?.name ?? ""}
        kind="training"
        onAssigned={load}
      />

      {/* COURSE EDITOR */}
      <Dialog open={!!editor} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editor?.id ? "Edit course" : "New course"}</DialogTitle></DialogHeader>
          {editor && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={editor.title ?? ""} onChange={(e) => setEditor({ ...editor, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={3} value={editor.description ?? ""} onChange={(e) => setEditor({ ...editor, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Type</Label><Select value={editor.training_type ?? "SOP"} onValueChange={(v) => setEditor({ ...editor, training_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Difficulty</Label><Select value={editor.difficulty ?? "Beginner"} onValueChange={(v) => setEditor({ ...editor, difficulty: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DIFFICULTY.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Minutes</Label><Input type="number" value={editor.estimated_minutes ?? 30} onChange={(e) => setEditor({ ...editor, estimated_minutes: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label><Input value={editor.category ?? ""} onChange={(e) => setEditor({ ...editor, category: e.target.value })} /></div>
                <div><Label>Renewal months (optional)</Label><Input type="number" value={editor.renewal_months ?? ""} onChange={(e) => setEditor({ ...editor, renewal_months: e.target.value ? parseInt(e.target.value) : null })} /></div>
              </div>
              <div>
                <Label>Visible to roles</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ROLE_OPTIONS.map((r) => {
                    const checked = (editor.role_visibility ?? []).includes(r);
                    return (
                      <label key={r} className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs cursor-pointer", checked ? "border-primary bg-primary/10" : "border-border/60")}>
                        <Checkbox checked={checked} onCheckedChange={(v) => {
                          const cur = editor.role_visibility ?? [];
                          setEditor({ ...editor, role_visibility: v ? [...cur, r] : cur.filter((x) => x !== r) });
                        }} />{r}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <Label>Active</Label>
                <Switch checked={editor.is_active ?? true} onCheckedChange={(v) => setEditor({ ...editor, is_active: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditor(null)}>Cancel</Button>
            <Button onClick={() => editor && saveCourse(editor)} disabled={!editor?.title?.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGN DIALOG */}
      <AssignDialog course={assignOpen} onClose={() => setAssignOpen(null)} onAssign={quickAssign} />

      {/* TRACK EDITOR */}
      <Dialog open={!!trackEditor} onOpenChange={(o) => !o && setTrackEditor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{trackEditor?.id ? "Edit track" : "New track"}</DialogTitle></DialogHeader>
          {trackEditor && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={trackEditor.name ?? ""} onChange={(e) => setTrackEditor({ ...trackEditor, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={2} value={trackEditor.description ?? ""} onChange={(e) => setTrackEditor({ ...trackEditor, description: e.target.value })} /></div>
              <div>
                <Label>Target roles</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ROLE_OPTIONS.map((r) => {
                    const checked = (trackEditor.role_targets ?? []).includes(r);
                    return (
                      <label key={r} className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs cursor-pointer", checked ? "border-primary bg-primary/10" : "border-border/60")}>
                        <Checkbox checked={checked} onCheckedChange={(v) => {
                          const cur = trackEditor.role_targets ?? [];
                          setTrackEditor({ ...trackEditor, role_targets: v ? [...cur, r] : cur.filter((x) => x !== r) });
                        }} />{r}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <Label>Auto-assign on hire</Label>
                <Switch checked={trackEditor.auto_assign_on_hire ?? false} onCheckedChange={(v) => setTrackEditor({ ...trackEditor, auto_assign_on_hire: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTrackEditor(null)}>Cancel</Button>
            <Button onClick={() => trackEditor && saveTrack(trackEditor)} disabled={!trackEditor?.name?.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI GENERATOR */}
      <AIGenerator open={aiOpen} onClose={() => setAiOpen(false)} onCreated={load} />

      {/* DELETE CONFIRM */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>"{confirmDelete?.title}" will be permanently removed along with its lessons, quizzes, and assignments.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && deleteCourse(confirmDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassPageShell>
  );
}

function AssignDialog({ course, onClose, onAssign }: { course: Course | null; onClose: () => void; onAssign: (c: Course, t: { role?: string; user_id?: string }, due: string | null, req: boolean) => void }) {
  const [role, setRole] = useState<string>("rbt");
  const [due, setDue] = useState<string>("");
  const [required, setRequired] = useState(true);
  return (
    <Dialog open={!!course} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign training</DialogTitle><DialogDescription>{course?.title}</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><Label>Assign to role</Label><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Due date</Label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"><Label>Required</Label><Switch checked={required} onCheckedChange={setRequired} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => course && onAssign(course, { role }, due || null, required)}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AIGenerator({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<any>(null);

  async function generate() {
    if (!prompt.trim()) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-training-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
        body: JSON.stringify({ sourceType: "paste", sopText: prompt, tone: "Detailed", quizComplexity: "medium", quizQuestionCount: 5, sectionMode: "full" }),
      });
      const json = await resp.json();
      if (!resp.ok) { toast.error(json.error || "Generation failed"); return; }
      setDraft(json.draft);
    } finally { setBusy(false); }
  }

  async function saveDraft() {
    if (!draft) return;
    const { error } = await supabase.from("training_courses").insert({
      title: draft.title, name: draft.title, description: draft.description,
      training_type: draft.type ?? "SOP", difficulty: draft.difficulty ?? "Beginner",
      estimated_minutes: draft.minutes ?? 30, role_visibility: [], required_default: false,
      is_active: false, status: "draft",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Draft saved! Edit it in the catalog.");
    setDraft(null); setPrompt(""); onClose(); onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Generate training with AI</DialogTitle><DialogDescription>Describe the training you want. AI will draft a full course, lessons, and a quiz.</DialogDescription></DialogHeader>
        {!draft ? (
          <div className="space-y-3">
            <Textarea rows={6} placeholder="e.g. A 4-lesson onboarding for new RBTs covering parent escalations, session note basics, and clock-in procedures…" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-sm font-bold">{draft.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{draft.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline">{draft.type}</Badge><Badge variant="outline">{draft.difficulty}</Badge><Badge variant="outline">{draft.minutes} min</Badge>
              </div>
            </div>
            {draft.sop && <div className="rounded-lg border border-border/60 p-3"><p className="text-xs font-semibold mb-1">SOP</p><p className="text-xs text-muted-foreground whitespace-pre-wrap">{String(draft.sop.content ?? "").slice(0, 400)}…</p></div>}
            {Array.isArray(draft.steps) && draft.steps.length > 0 && <div className="rounded-lg border border-border/60 p-3"><p className="text-xs font-semibold mb-2">{draft.steps.length} steps</p><ul className="text-xs text-muted-foreground space-y-1">{draft.steps.slice(0, 6).map((s: any, i: number) => <li key={i}>• {s.title}</li>)}</ul></div>}
            {Array.isArray(draft.quiz) && <div className="rounded-lg border border-border/60 p-3"><p className="text-xs font-semibold mb-1">{draft.quiz.length}-question quiz</p></div>}
          </div>
        )}
        <DialogFooter>
          {!draft ? (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={generate} disabled={busy || !prompt.trim()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Wand2 className="h-3.5 w-3.5 mr-1.5" /> Generate</>}</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setDraft(null)}>Try again</Button>
              <Button onClick={saveDraft}>Save as draft</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
