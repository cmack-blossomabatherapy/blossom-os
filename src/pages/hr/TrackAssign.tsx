import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Search, Send, Users, CalendarIcon, Loader2, CheckCircle2, AlertTriangle, Compass, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { GlassStat } from "@/components/shared/GlassStat";
import { StateView } from "@/components/shared/StateView";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Mode = "training" | "academy";

interface EmployeeRow {
  id: string; user_id: string | null;
  first_name: string; last_name: string;
  job_title: string | null; clinic: string | null; status: string;
}
interface TrainingTrack { id: string; name: string; description: string | null; role_targets: string[]; is_active: boolean; }
interface AcademyTrack { id: string; name: string; description: string | null; is_active: boolean; }
interface TrainingEnrollment { id: string; track_id: string; employee_id: string; status: string; due_date: string | null; completed_at: string | null; }
interface AcademyEnrollment { id: string; track_id: string; employee_id: string; status: string; path: string; start_date: string; }

const trainingStatusMeta: Record<string, { label: string; tone: string }> = {
  assigned: { label: "Assigned", tone: "bg-muted text-muted-foreground" },
  in_progress: { label: "In progress", tone: "bg-info/15 text-info" },
  completed: { label: "Completed", tone: "bg-success/15 text-success" },
  overdue: { label: "Overdue", tone: "bg-destructive/15 text-destructive" },
};
const academyStatusMeta: Record<string, { label: string; tone: string }> = {
  not_started: { label: "Not started", tone: "bg-muted text-muted-foreground" },
  active: { label: "Active", tone: "bg-info/15 text-info" },
  paused: { label: "Paused", tone: "bg-warning/15 text-warning" },
  completed: { label: "Completed", tone: "bg-success/15 text-success" },
  withdrawn: { label: "Withdrawn", tone: "bg-destructive/15 text-destructive" },
};

const formatDate = (v: string | null) => v ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(v)) : "—";
const computeTrainingStatus = (e: TrainingEnrollment): string => {
  if (e.status === "completed") return "completed";
  if (e.due_date && new Date(e.due_date).getTime() < Date.now()) return "overdue";
  return e.status;
};

export default function TrackAssign() {
  const { user, hasPerm } = useAuth();
  const canAssign = hasPerm("hr.training.assign");

  const [mode, setMode] = useState<Mode>("training");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<Record<string, string[]>>({});
  const [trainingTracks, setTrainingTracks] = useState<TrainingTrack[]>([]);
  const [academyTracks, setAcademyTracks] = useState<AcademyTrack[]>([]);
  const [trainingEnrollments, setTrainingEnrollments] = useState<TrainingEnrollment[]>([]);
  const [academyEnrollments, setAcademyEnrollments] = useState<AcademyEnrollment[]>([]);

  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [academyPath, setAcademyPath] = useState<string>("existing_state");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string; table: "training_track_enrollments" | "academy_enrollments" } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    const [e, ur, tt, at, te, ae] = await Promise.all([
      supabase.from("employees").select("id,user_id,first_name,last_name,job_title,clinic,status").eq("status", "active").order("last_name"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("training_tracks").select("*").eq("is_active", true).order("name"),
      supabase.from("academy_tracks").select("*").eq("is_active", true).order("name"),
      supabase.from("training_track_enrollments").select("id,track_id,employee_id,status,due_date,completed_at"),
      supabase.from("academy_enrollments").select("id,track_id,employee_id,status,path,start_date"),
    ]);
    const firstError = e.error || ur.error || tt.error || at.error || te.error || ae.error;
    if (firstError) { setError(firstError.message); setLoading(false); return; }

    const empList = (e.data as EmployeeRow[]) ?? [];
    const userIdToRoles = new Map<string, string[]>();
    ((ur.data as { user_id: string; role: string }[]) ?? []).forEach((r) => {
      const arr = userIdToRoles.get(r.user_id) ?? [];
      arr.push(r.role);
      userIdToRoles.set(r.user_id, arr);
    });
    const empRoles: Record<string, string[]> = {};
    empList.forEach((emp) => { if (emp.user_id) empRoles[emp.id] = userIdToRoles.get(emp.user_id) ?? []; });
    setEmployees(empList);
    setEmployeeRoles(empRoles);
    setTrainingTracks((tt.data as TrainingTrack[]) ?? []);
    setAcademyTracks((at.data as AcademyTrack[]) ?? []);
    setTrainingEnrollments((te.data as TrainingEnrollment[]) ?? []);
    setAcademyEnrollments((ae.data as AcademyEnrollment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void loadAll(); }, []);
  useEffect(() => { setSelected(new Set()); setSelectedTrack(""); }, [mode]);

  const tracks = mode === "training" ? trainingTracks : academyTracks;
  const currentTrack = tracks.find((t) => t.id === selectedTrack) ?? null;

  const enrolledMap = useMemo(() => {
    const map = new Map<string, TrainingEnrollment | AcademyEnrollment>();
    if (!selectedTrack) return map;
    if (mode === "training") {
      trainingEnrollments.filter((e) => e.track_id === selectedTrack).forEach((e) => map.set(e.employee_id, e));
    } else {
      academyEnrollments.filter((e) => e.track_id === selectedTrack).forEach((e) => map.set(e.employee_id, e));
    }
    return map;
  }, [mode, selectedTrack, trainingEnrollments, academyEnrollments]);

  const eligibleEmployees = useMemo(() => {
    // For Training Tracks with role_targets, restrict; for Academy, allow all employees
    if (mode === "academy") return employees;
    const tt = currentTrack as TrainingTrack | null;
    if (!tt || !tt.role_targets || tt.role_targets.length === 0) return employees;
    return employees.filter((emp) => {
      const roles = employeeRoles[emp.id] ?? [];
      return tt.role_targets.some((r) => roles.includes(r));
    });
  }, [mode, employees, employeeRoles, currentTrack]);

  const filteredEmployees = useMemo(() => {
    return eligibleEmployees.filter((emp) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const hay = `${emp.first_name} ${emp.last_name} ${emp.job_title ?? ""} ${emp.clinic ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [eligibleEmployees, search]);

  const stats = useMemo(() => {
    if (!selectedTrack) return null;
    const rows = Array.from(enrolledMap.values());
    const total = rows.length;
    const completed = rows.filter((r: any) => r.status === "completed").length;
    if (mode === "training") {
      const overdue = rows.filter((r: any) => computeTrainingStatus(r) === "overdue").length;
      const inProgress = rows.filter((r: any) => r.status === "in_progress").length;
      return { total, completed, overdue, inProgress, rate: total ? Math.round((completed / total) * 100) : 0 };
    }
    const active = rows.filter((r: any) => r.status === "active").length;
    const paused = rows.filter((r: any) => r.status === "paused").length;
    return { total, completed, overdue: 0, inProgress: active, paused, rate: total ? Math.round((completed / total) * 100) : 0 };
  }, [enrolledMap, selectedTrack, mode]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const unassigned = filteredEmployees.filter((e) => !enrolledMap.has(e.id));
    if (unassigned.every((e) => selected.has(e.id)) && unassigned.length > 0) {
      setSelected((prev) => { const next = new Set(prev); unassigned.forEach((e) => next.delete(e.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); unassigned.forEach((e) => next.add(e.id)); return next; });
    }
  };

  const handleAssign = async () => {
    if (!selectedTrack) { toast.error("Pick a track first."); return; }
    if (selected.size === 0) { toast.error("Select at least one employee."); return; }
    setSubmitting(true);
    if (mode === "training") {
      const rows = Array.from(selected).map((employee_id) => ({
        employee_id, track_id: selectedTrack, status: "assigned" as const,
        assigned_by: user?.id ?? null, due_date: dueDate || null,
      }));
      const { error } = await supabase.from("training_track_enrollments").insert(rows);
      setSubmitting(false);
      if (error) { toast.error(error.message); return; }
    } else {
      const rows = Array.from(selected).map((employee_id) => ({
        employee_id, track_id: selectedTrack, status: "active" as const, path: academyPath as any,
      }));
      const { error } = await supabase.from("academy_enrollments").insert(rows);
      setSubmitting(false);
      if (error) { toast.error(error.message); return; }
    }
    toast.success(`Enrolled ${selected.size} ${selected.size === 1 ? "person" : "people"} in ${currentTrack?.name}.`);
    setSelected(new Set());
    void loadAll();
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    const { error } = await supabase.from(confirmRemove.table).delete().eq("id", confirmRemove.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Enrollment removed.");
    setConfirmRemove(null);
    void loadAll();
  };

  if (loading) {
    return (
      <GlassPageShell eyebrow="Training Admin" eyebrowIcon={GraduationCap} title="Track Assignments" description="Loading tracks and employees…">
        <GlassPanel><StateView variant="loading" title="Loading" description="Pulling tracks, employees, and enrollments." /></GlassPanel>
      </GlassPageShell>
    );
  }
  if (error) {
    return (
      <GlassPageShell eyebrow="Training Admin" eyebrowIcon={GraduationCap} title="Track Assignments" description="Could not load data.">
        <GlassPanel><StateView variant="error" title="Couldn't load track data" description={error} onRetry={loadAll} /></GlassPanel>
      </GlassPageShell>
    );
  }

  return (
    <GlassPageShell
      eyebrow="Training Admin"
      eyebrowIcon={GraduationCap}
      title="Track Assignments"
      description="Assign Training Tracks (multi-course paths) or Operations Academy tracks to specific staff."
      stats={selectedTrack && stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <GlassStat icon={Users} tone="primary" label="Enrolled" value={stats.total} />
          <GlassStat icon={CheckCircle2} tone="success" label="Completed" value={stats.completed} hint={`${stats.rate}% rate`} />
          <GlassStat icon={mode === "training" ? AlertTriangle : Compass} tone={mode === "training" ? "destructive" : "primary"} label={mode === "training" ? "Overdue" : "Active"} value={mode === "training" ? stats.overdue : stats.inProgress} />
          <GlassStat icon={GraduationCap} tone="primary" label="In progress" value={mode === "training" ? stats.inProgress : (stats as any).paused ?? 0} hint={mode === "academy" ? "Paused" : undefined} />
        </div>
      ) : undefined}
    >
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList>
          <TabsTrigger value="training"><GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Training Tracks</TabsTrigger>
          <TabsTrigger value="academy"><Compass className="h-3.5 w-3.5 mr-1.5" /> Operations Academy</TabsTrigger>
        </TabsList>

        <TabsContent value={mode} className="mt-4 space-y-4">
          <GlassPanel
            title={mode === "training" ? "Pick a Training Track" : "Pick an Academy Track"}
            description={mode === "training" ? "Multi-course tracks (e.g. RBT, BCBA) — choose a track and due date." : "Operations Academy enrollment — choose a track and starting path."}
            icon={Send}
            iconTone="primary"
          >
            <div className={cn("grid gap-3 items-end", mode === "training" ? "md:grid-cols-[1fr_240px_auto]" : "md:grid-cols-[1fr_240px_auto]")}>
              <div className="space-y-1.5">
                <Label className="text-xs">Track</Label>
                <Select value={selectedTrack} onValueChange={(v) => { setSelectedTrack(v); setSelected(new Set()); }}>
                  <SelectTrigger><SelectValue placeholder="Select a track…" /></SelectTrigger>
                  <SelectContent>
                    {tracks.length === 0 && <SelectItem value="__none__" disabled>No tracks available</SelectItem>}
                    {tracks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        {mode === "training" && (t as TrainingTrack).role_targets?.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">— for {(t as TrainingTrack).role_targets.join(", ").toUpperCase()}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {mode === "training" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">Due date (optional)</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="pl-9" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs">Starting path</Label>
                  <Select value={academyPath} onValueChange={setAcademyPath}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="existing_state">Existing State</SelectItem>
                      <SelectItem value="new_state">New State</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleAssign} disabled={!canAssign || submitting || !selectedTrack || selected.size === 0}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Enroll {selected.size || 0}
              </Button>
            </div>
            {currentTrack?.description && (
              <p className="text-xs text-muted-foreground mt-3">{currentTrack.description}</p>
            )}
          </GlassPanel>

          <Card className="glass-surface border-0">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Employees</CardTitle>
                  <CardDescription>{filteredEmployees.length} of {eligibleEmployees.length} {mode === "training" && currentTrack && (currentTrack as TrainingTrack).role_targets?.length ? "eligible employees" : "employees"}</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-[260px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {employees.length === 0 ? (
                <StateView variant="empty" icon={Users} title="No active employees" description="No active employees found." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={
                            filteredEmployees.filter((e) => !enrolledMap.has(e.id)).length > 0 &&
                            filteredEmployees.filter((e) => !enrolledMap.has(e.id)).every((e) => selected.has(e.id))
                          }
                          onCheckedChange={toggleAll}
                          disabled={!selectedTrack}
                        />
                      </TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Clinic</TableHead>
                      <TableHead>{selectedTrack ? "Status" : "Pick a track"}</TableHead>
                      <TableHead className="text-right w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((emp) => {
                      const roles = employeeRoles[emp.id] ?? [];
                      const existing = enrolledMap.get(emp.id) as any;
                      const isAssigned = !!existing;
                      const status = existing
                        ? (mode === "training" ? computeTrainingStatus(existing) : existing.status)
                        : null;
                      const meta = status ? (mode === "training" ? trainingStatusMeta[status] : academyStatusMeta[status]) : null;
                      return (
                        <TableRow key={emp.id} className={cn(isAssigned && selectedTrack && "opacity-80")}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(emp.id)}
                              onCheckedChange={() => toggle(emp.id)}
                              disabled={!selectedTrack || isAssigned}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{emp.first_name} {emp.last_name}</div>
                            <div className="text-xs text-muted-foreground">{emp.job_title || "—"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                              {roles.slice(0, 4).map((r) => (
                                <Badge key={r} variant="outline" className="border-transparent bg-secondary text-muted-foreground text-[10px]">{r}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{emp.clinic || "—"}</TableCell>
                          <TableCell>
                            {!selectedTrack ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : meta ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("border-transparent", meta.tone)}>{meta.label}</Badge>
                                {mode === "training" && existing.due_date && (
                                  <span className="text-xs text-muted-foreground">due {formatDate(existing.due_date)}</span>
                                )}
                                {mode === "academy" && (
                                  <span className="text-xs text-muted-foreground">{existing.path?.replace("_", " ")}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not enrolled</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isAssigned && canAssign && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmRemove({
                                  id: existing.id,
                                  name: `${emp.first_name} ${emp.last_name}`,
                                  table: mode === "training" ? "training_track_enrollments" : "academy_enrollments",
                                })}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 p-0"
                                title="Remove enrollment"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredEmployees.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="p-0">
                        <StateView variant="empty" compact icon={Search} title="No matches" description="No employees match your search." />
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove enrollment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{confirmRemove?.name}</strong> from <strong>{currentTrack?.name}</strong>. Their progress on this track will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassPageShell>
  );
}