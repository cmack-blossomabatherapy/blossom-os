import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarIcon, CheckCircle2, ClipboardList, Clock, Loader2, Search, Send, UserPlus, Users, Inbox } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { GlassStat } from "@/components/shared/GlassStat";
import { StateView } from "@/components/shared/StateView";

type RoleFilter = "all" | "rbt" | "bcba";
type AssignmentStatus = "assigned" | "in_progress" | "completed" | "overdue" | "expired";

interface CourseRow { id: string; title: string | null; name: string | null; category: string | null; }
interface EmployeeRow { id: string; user_id: string | null; first_name: string; last_name: string; job_title: string | null; clinic: string | null; }
interface AssignmentRow { id: string; employee_id: string; course_id: string; status: AssignmentStatus; due_date: string | null; completed_at: string | null; assigned_at: string | null; }

const statusMeta: Record<AssignmentStatus, { label: string; tone: string }> = {
  assigned: { label: "Assigned", tone: "bg-muted text-muted-foreground" },
  in_progress: { label: "In progress", tone: "bg-info/15 text-info" },
  completed: { label: "Completed", tone: "bg-success/15 text-success" },
  overdue: { label: "Overdue", tone: "bg-destructive/15 text-destructive" },
  expired: { label: "Expired", tone: "bg-warning/15 text-warning" },
};

const formatDate = (v: string | null) => v ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(v)) : "—";

const computeStatus = (a: AssignmentRow): AssignmentStatus => {
  if (a.status === "completed") return "completed";
  if (a.due_date && new Date(a.due_date).getTime() < Date.now()) return "overdue";
  return a.status;
};

export default function TrainingAssign() {
  const { user, hasPerm } = useAuth();
  const canAssign = hasPerm("hr.training.assign") || hasPerm("hr.training.manage");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<Record<string, string[]>>({}); // employee.id -> roles[]
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    const [c, e, ur, a] = await Promise.all([
      supabase.from("training_courses").select("id,title,name,category").eq("status", "active").order("title"),
      supabase.from("employees").select("id,user_id,first_name,last_name,job_title,clinic").eq("status", "active"),
      supabase.from("user_roles").select("user_id,role").in("role", ["rbt", "bcba"]),
      supabase.from("employee_trainings").select("id,employee_id,course_id,status,due_date,completed_at,assigned_at"),
    ]);
    const firstError = c.error || e.error || ur.error || a.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }
    const empList = (e.data as EmployeeRow[]) ?? [];
    const userIdToRoles = new Map<string, string[]>();
    ((ur.data as { user_id: string; role: string }[]) ?? []).forEach((r) => {
      const arr = userIdToRoles.get(r.user_id) ?? [];
      arr.push(r.role);
      userIdToRoles.set(r.user_id, arr);
    });
    const empRoles: Record<string, string[]> = {};
    empList.forEach((emp) => { if (emp.user_id) empRoles[emp.id] = userIdToRoles.get(emp.user_id) ?? []; });
    setCourses((c.data as CourseRow[]) ?? []);
    setEmployees(empList);
    setEmployeeRoles(empRoles);
    setAssignments((a.data as AssignmentRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // Only show employees who are RBT or BCBA
  const eligibleEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const roles = employeeRoles[emp.id] ?? [];
      return roles.includes("rbt") || roles.includes("bcba");
    });
  }, [employees, employeeRoles]);

  const filteredEmployees = useMemo(() => {
    return eligibleEmployees.filter((emp) => {
      const roles = employeeRoles[emp.id] ?? [];
      if (roleFilter === "rbt" && !roles.includes("rbt")) return false;
      if (roleFilter === "bcba" && !roles.includes("bcba")) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${emp.first_name} ${emp.last_name} ${emp.job_title ?? ""} ${emp.clinic ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
  }, [eligibleEmployees, employeeRoles, roleFilter, search]);

  const courseAssignmentsByEmployee = useMemo(() => {
    const map = new Map<string, AssignmentRow>();
    if (!selectedCourse) return map;
    assignments.filter((a) => a.course_id === selectedCourse).forEach((a) => map.set(a.employee_id, a));
    return map;
  }, [assignments, selectedCourse]);

  const courseStats = useMemo(() => {
    if (!selectedCourse) return null;
    const rows = Array.from(courseAssignmentsByEmployee.values());
    const total = rows.length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const overdue = rows.filter((r) => computeStatus(r) === "overdue").length;
    const inProgress = rows.filter((r) => r.status === "in_progress").length;
    return { total, completed, overdue, inProgress, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [selectedCourse, courseAssignmentsByEmployee]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const unassigned = filteredEmployees.filter((e) => !courseAssignmentsByEmployee.has(e.id));
    if (unassigned.every((e) => selected.has(e.id)) && unassigned.length > 0) {
      setSelected((prev) => { const next = new Set(prev); unassigned.forEach((e) => next.delete(e.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); unassigned.forEach((e) => next.add(e.id)); return next; });
    }
  };

  const handleAssign = async () => {
    if (!selectedCourse) { toast.error("Pick a training course first."); return; }
    if (selected.size === 0) { toast.error("Select at least one employee."); return; }
    setSubmitting(true);
    const rows = Array.from(selected).map((employee_id) => ({
      employee_id,
      course_id: selectedCourse,
      status: "assigned" as const,
      assigned_by: user?.id ?? null,
      due_date: dueDate || null,
    }));
    const { error } = await supabase.from("employee_trainings").insert(rows);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Assigned to ${rows.length} ${rows.length === 1 ? "person" : "people"}.`);
    setSelected(new Set());
    loadAll();
  };

  if (loading) {
    return (
      <GlassPageShell eyebrow="Training Admin" eyebrowIcon={ClipboardList} title="Assign Trainings" description="Loading training assignment data…">
        <GlassPanel><StateView variant="loading" title="Loading assignments" description="Pulling courses, learners, and existing assignments." /></GlassPanel>
      </GlassPageShell>
    );
  }

  if (error) {
    return (
      <GlassPageShell eyebrow="Training Admin" eyebrowIcon={ClipboardList} title="Assign Trainings" description="We hit a snag loading this view.">
        <GlassPanel><StateView variant="error" title="Couldn't load assignment data" description={error} onRetry={loadAll} /></GlassPanel>
      </GlassPageShell>
    );
  }

  return (
    <GlassPageShell
      eyebrow="Training Admin"
      eyebrowIcon={ClipboardList}
      title="Assign Trainings"
      description="Assign courses to RBTs and BCBAs and track per-user completion status."
      stats={selectedCourse && courseStats ? (
        <div className="grid grid-cols-2 gap-2 md:gap-3 md:grid-cols-4">
          <GlassStat icon={Users} tone="primary" label="Assigned" value={courseStats.total} />
          <GlassStat icon={CheckCircle2} tone="success" label="Completed" value={courseStats.completed} hint={`${courseStats.rate}% rate`} />
          <GlassStat icon={Clock} tone="primary" label="In progress" value={courseStats.inProgress} />
          <GlassStat icon={AlertTriangle} tone="destructive" label="Overdue" value={courseStats.overdue} />
        </div>
      ) : undefined}
    >
      <GlassPanel title="Pick a course & due date" description="Choose what to assign — then select the people below." icon={Send} iconTone="primary">
        <div className="grid gap-3 md:grid-cols-[1fr_240px_auto] md:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Training course</Label>
            <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelected(new Set()); }}>
              <SelectTrigger><SelectValue placeholder="Select a training…" /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title || c.name || "Untitled"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Due date (optional)</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Button onClick={handleAssign} disabled={!canAssign || submitting || !selectedCourse || selected.size === 0} className="w-full md:w-auto">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Assign to {selected.size || 0}
          </Button>
        </div>
      </GlassPanel>

      <Card className="glass-surface border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Eligible learners</CardTitle>
              <CardDescription>{filteredEmployees.length} of {eligibleEmployees.length} RBTs & BCBAs</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="rbt">RBT</TabsTrigger>
                  <TabsTrigger value="bcba">BCBA</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full md:w-[240px]" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {eligibleEmployees.length === 0 ? (
            <StateView
              variant="empty"
              icon={UserPlus}
              title="No eligible learners yet"
              description="No employees have the RBT or BCBA role. Assign roles in Team or an employee profile to enable training assignments."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={
                        filteredEmployees.filter((e) => !courseAssignmentsByEmployee.has(e.id)).length > 0 &&
                        filteredEmployees.filter((e) => !courseAssignmentsByEmployee.has(e.id)).every((e) => selected.has(e.id))
                      }
                      onCheckedChange={toggleAll}
                      disabled={!selectedCourse}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>{selectedCourse ? "Status for selected course" : "Select a course to see status"}</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => {
                  const roles = employeeRoles[emp.id] ?? [];
                  const existing = courseAssignmentsByEmployee.get(emp.id);
                  const status = existing ? computeStatus(existing) : null;
                  const isAssigned = !!existing;
                  return (
                    <TableRow key={emp.id} className={cn(isAssigned && selectedCourse && "opacity-70")}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(emp.id)}
                          onCheckedChange={() => toggle(emp.id)}
                          disabled={!selectedCourse || isAssigned}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{emp.first_name} {emp.last_name}</div>
                        <div className="text-xs text-muted-foreground">{emp.job_title || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {roles.includes("rbt") && <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">RBT</Badge>}
                          {roles.includes("bcba") && <Badge variant="outline" className="border-transparent bg-info/15 text-info">BCBA</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.clinic || "—"}</TableCell>
                      <TableCell>
                        {!selectedCourse ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : status ? (
                          <Badge variant="outline" className={cn("border-transparent", statusMeta[status].tone)}>
                            {status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {statusMeta[status].label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className={cn("text-sm", status === "overdue" && "text-destructive font-medium")}>
                        {existing ? formatDate(existing.due_date) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="p-0"><StateView variant="empty" compact icon={Search} title="No matches" description="No employees match your search and role filters." /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </GlassPageShell>
  );
}