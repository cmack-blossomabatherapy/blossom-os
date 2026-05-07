import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BarChart3, BookOpen, CheckCircle2, Clock, GraduationCap, Loader2, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { GlassStat } from "@/components/shared/GlassStat";
import { StateView } from "@/components/shared/StateView";

type TrainingStatus = "assigned" | "in_progress" | "completed" | "overdue" | "expired";

interface AssignmentRow {
  id: string;
  employee_id: string;
  course_id: string;
  status: TrainingStatus;
  assigned_at: string | null;
  due_date: string | null;
  completed_at: string | null;
}

interface CourseRow {
  id: string;
  title: string | null;
  name: string | null;
  category: string | null;
  training_type: string | null;
}

interface EmployeeRow {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  clinic: string | null;
}

const statusTone: Record<TrainingStatus, string> = {
  assigned: "bg-muted text-muted-foreground",
  in_progress: "bg-info/15 text-info",
  completed: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
  expired: "bg-warning/15 text-warning",
};

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "—";

const isOverdue = (a: AssignmentRow) => {
  if (a.status === "completed") return false;
  if (a.status === "overdue") return true;
  if (!a.due_date) return false;
  return new Date(a.due_date).getTime() < Date.now();
};

export default function TrainingStatistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [search, setSearch] = useState("");
  const [clinicFilter, setClinicFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    const [a, c, e] = await Promise.all([
      supabase.from("employee_trainings").select("id,employee_id,course_id,status,assigned_at,due_date,completed_at"),
      supabase.from("training_courses").select("id,title,name,category,training_type"),
      supabase.from("employees").select("id,first_name,last_name,job_title,clinic"),
    ]);
    const firstError = a.error || c.error || e.error;
    if (firstError) { setError(firstError.message); setLoading(false); return; }
    setAssignments((a.data as AssignmentRow[]) ?? []);
    setCourses((c.data as CourseRow[]) ?? []);
    setEmployees((e.data as EmployeeRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const clinics = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => { if (e.clinic) set.add(e.clinic); });
    return Array.from(set).sort();
  }, [employees]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const emp = employeeMap.get(a.employee_id);
      if (clinicFilter !== "all" && emp?.clinic !== clinicFilter) return false;
      return true;
    });
  }, [assignments, employeeMap, clinicFilter]);

  const stats = useMemo(() => {
    const total = filteredAssignments.length;
    const completed = filteredAssignments.filter((a) => a.status === "completed").length;
    const overdueList = filteredAssignments.filter(isOverdue);
    const inProgress = filteredAssignments.filter((a) => a.status === "in_progress").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const learners = new Set(filteredAssignments.map((a) => a.employee_id)).size;
    return { total, completed, overdue: overdueList.length, inProgress, completionRate, learners };
  }, [filteredAssignments]);

  const overdueRows = useMemo(() => {
    return filteredAssignments
      .filter(isOverdue)
      .map((a) => ({
        ...a,
        course: courseMap.get(a.course_id),
        employee: employeeMap.get(a.employee_id),
      }))
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const name = `${r.employee?.first_name ?? ""} ${r.employee?.last_name ?? ""}`.toLowerCase();
        const title = (r.course?.title || r.course?.name || "").toLowerCase();
        return name.includes(q) || title.includes(q);
      })
      .sort((a, b) => (new Date(a.due_date ?? 0).getTime()) - (new Date(b.due_date ?? 0).getTime()));
  }, [filteredAssignments, courseMap, employeeMap, search]);

  const courseStats = useMemo(() => {
    const map = new Map<string, { course: CourseRow; total: number; completed: number; overdue: number; inProgress: number }>();
    filteredAssignments.forEach((a) => {
      const course = courseMap.get(a.course_id);
      if (!course) return;
      const entry = map.get(a.course_id) ?? { course, total: 0, completed: 0, overdue: 0, inProgress: 0 };
      entry.total += 1;
      if (a.status === "completed") entry.completed += 1;
      if (isOverdue(a)) entry.overdue += 1;
      if (a.status === "in_progress") entry.inProgress += 1;
      map.set(a.course_id, entry);
    });
    return Array.from(map.values())
      .filter((row) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (row.course.title || row.course.name || "").toLowerCase().includes(q);
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredAssignments, courseMap, search]);

  const employeeStats = useMemo(() => {
    const map = new Map<string, { employee: EmployeeRow; total: number; completed: number; overdue: number }>();
    filteredAssignments.forEach((a) => {
      const employee = employeeMap.get(a.employee_id);
      if (!employee) return;
      const entry = map.get(a.employee_id) ?? { employee, total: 0, completed: 0, overdue: 0 };
      entry.total += 1;
      if (a.status === "completed") entry.completed += 1;
      if (isOverdue(a)) entry.overdue += 1;
      map.set(a.employee_id, entry);
    });
    return Array.from(map.values())
      .filter((row) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${row.employee.first_name} ${row.employee.last_name}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.overdue - a.overdue || b.total - a.total);
  }, [filteredAssignments, employeeMap, search]);

  if (loading) {
    return (
      <GlassPageShell eyebrow="Training Admin" eyebrowIcon={BarChart3} title="Training Statistics" description="Loading training statistics…">
        <GlassPanel><StateView variant="loading" title="Loading statistics" description="Crunching completion data across the team." /></GlassPanel>
      </GlassPageShell>
    );
  }

  if (error) {
    return (
      <GlassPageShell eyebrow="Training Admin" eyebrowIcon={BarChart3} title="Training Statistics" description="We hit a snag loading this view.">
        <GlassPanel><StateView variant="error" title="Couldn't load training stats" description={error} onRetry={load} /></GlassPanel>
      </GlassPageShell>
    );
  }

  return (
    <GlassPageShell
      eyebrow="Training Admin"
      eyebrowIcon={BarChart3}
      title="Training Statistics"
      description="Completion rates, assignment volume, and overdue trainings across the team."
      actions={
        <>
          <Select value={clinicFilter} onValueChange={setClinicFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-background/70 backdrop-blur"><SelectValue placeholder="All clinics" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clinics</SelectItem>
              {clinics.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/training-dashboard">Open admin</Link>
          </Button>
        </>
      }
      stats={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <GlassStat icon={BookOpen} tone="primary" label="Assignments" value={stats.total} hint={`${stats.learners} learners`} />
          <GlassStat icon={CheckCircle2} tone="success" label="Completed" value={stats.completed} hint={`${stats.completionRate}% rate`} />
          <GlassStat icon={Clock} tone="primary" label="In progress" value={stats.inProgress} />
          <GlassStat icon={AlertTriangle} tone="destructive" label="Overdue" value={stats.overdue} hint={stats.overdue > 0 ? "Action needed" : "All clear"} />
          <GlassStat icon={TrendingUp} tone="primary" label="Completion" value={`${stats.completionRate}%`} />
        </div>
      }
    >
      <GlassPanel icon={GraduationCap} iconTone="primary" title="Overall completion" description={`${stats.completed} of ${stats.total} assignments completed`}>
        <Progress value={stats.completionRate} className="h-3" />
      </GlassPanel>

      <Tabs defaultValue="overdue" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
            <TabsTrigger value="courses">By course ({courseStats.length})</TabsTrigger>
            <TabsTrigger value="employees">By employee ({employeeStats.length})</TabsTrigger>
          </TabsList>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="md:w-[280px] bg-background/70 backdrop-blur" />
        </div>

        <TabsContent value="overdue">
          <Card className="glass-surface border-0">
            <CardContent className="p-0">
              {overdueRows.length === 0 ? (
                <StateView variant="empty" icon={CheckCircle2} title="All caught up" description="No overdue trainings right now. Great work." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Training</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">{r.employee?.first_name} {r.employee?.last_name}</div>
                          <div className="text-xs text-muted-foreground">{r.employee?.job_title || "—"} · {r.employee?.clinic || "—"}</div>
                        </TableCell>
                        <TableCell>{r.course?.title || r.course?.name || "Untitled"}</TableCell>
                        <TableCell className="text-destructive font-medium">{formatDate(r.due_date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("border-transparent", statusTone.overdue)}>Overdue</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card className="glass-surface border-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="w-[220px]">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseStats.map((row) => {
                    const rate = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
                    return (
                      <TableRow key={row.course.id}>
                        <TableCell>
                          <div className="font-medium">{row.course.title || row.course.name || "Untitled"}</div>
                          <div className="text-xs text-muted-foreground">{row.course.category || row.course.training_type || "—"}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                        <TableCell className="text-right tabular-nums text-success">{row.completed}</TableCell>
                        <TableCell className={cn("text-right tabular-nums", row.overdue > 0 && "text-destructive font-medium")}>{row.overdue}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={rate} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-10 text-right">{rate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {courseStats.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="p-0"><StateView variant="empty" compact title="No courses match" description="Try clearing the search or clinic filter." /></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card className="glass-surface border-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="w-[220px]">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeStats.map((row) => {
                    const rate = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
                    return (
                      <TableRow key={row.employee.id}>
                        <TableCell>
                          <div className="font-medium">{row.employee.first_name} {row.employee.last_name}</div>
                          <div className="text-xs text-muted-foreground">{row.employee.job_title || "—"} · {row.employee.clinic || "—"}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                        <TableCell className="text-right tabular-nums text-success">{row.completed}</TableCell>
                        <TableCell className={cn("text-right tabular-nums", row.overdue > 0 && "text-destructive font-medium")}>{row.overdue}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={rate} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-10 text-right">{rate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {employeeStats.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="p-0"><StateView variant="empty" compact title="No employees match" description="Try clearing the search or clinic filter." /></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" /> {stats.learners} unique learners across {courses.length} active courses
      </div>
    </GlassPageShell>
  );
}