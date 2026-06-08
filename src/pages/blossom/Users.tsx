import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users as UsersIcon, Search, Award, GraduationCap, Activity, Download, Loader2, AlertTriangle } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { AssignTrainingModal } from "@/components/training/AssignTrainingModal";

type LiveUser = {
  id: string; // employee_id
  name: string;
  email: string;
  role: string;
  department: string;
  location: string;
  state: string;
  status: "Active" | "Inactive" | "On Leave";
  user_id: string | null;
  assignedTracks: number;
  assignedCourses: number;
  completedCourses: number;
  overdueCourses: number;
  certifications: number;
  trainingStatus: "On Track" | "Behind" | "Complete";
};

export default function BlossomUsers() {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<LiveUser | null>(null);
  const [users, setUsers] = useState<LiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [emp, depts, ur, enr, et, certs] = await Promise.all([
      supabase
        .from("employees")
        .select("id,first_name,last_name,email,job_title,state,user_id,department_id,status,clinic")
        .neq("status", "terminated"),
      supabase.from("hr_departments").select("id,name"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("academy_enrollments").select("employee_id,status"),
      supabase.from("employee_trainings").select("employee_id,status,due_date,completed_at"),
      supabase.from("academy_user_certificates").select("user_id"),
    ]);
    const firstErr = emp.error || depts.error || ur.error || enr.error || et.error || certs.error;
    if (firstErr) { setError(firstErr.message); setLoading(false); return; }
    const deptName = new Map<string, string>((depts.data ?? []).map((d: any) => [d.id, d.name]));
    const rolesByUser = new Map<string, string[]>();
    (ur.data ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    const enrCount = new Map<string, number>();
    (enr.data ?? []).forEach((r: any) => enrCount.set(r.employee_id, (enrCount.get(r.employee_id) ?? 0) + 1));
    const courseStats = new Map<string, { total: number; completed: number; overdue: number }>();
    (et.data ?? []).forEach((r: any) => {
      const s = courseStats.get(r.employee_id) ?? { total: 0, completed: 0, overdue: 0 };
      s.total += 1;
      if (r.status === "completed") s.completed += 1;
      else if (r.due_date && new Date(r.due_date).getTime() < Date.now()) s.overdue += 1;
      courseStats.set(r.employee_id, s);
    });
    const certCount = new Map<string, number>();
    (certs.data ?? []).forEach((r: any) => {
      if (!r.user_id) return;
      certCount.set(r.user_id, (certCount.get(r.user_id) ?? 0) + 1);
    });
    const rows: LiveUser[] = (emp.data ?? []).map((e: any) => {
      const stats = courseStats.get(e.id) ?? { total: 0, completed: 0, overdue: 0 };
      const tracks = enrCount.get(e.id) ?? 0;
      const status: LiveUser["status"] = e.status === "active" || e.status === "onboarding" ? "Active" : (e.status === "leave" ? "On Leave" : "Inactive");
      const trainingStatus: LiveUser["trainingStatus"] =
        stats.overdue > 0 ? "Behind" : (stats.total > 0 && stats.completed === stats.total && tracks > 0 ? "Complete" : "On Track");
      const roleKey = e.user_id ? (rolesByUser.get(e.user_id)?.[0] ?? "") : "";
      return {
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        email: e.email ?? "—",
        role: roleKey || (e.job_title ?? "—"),
        department: deptName.get(e.department_id) ?? "—",
        location: e.clinic ?? "—",
        state: e.state ?? "—",
        status,
        user_id: e.user_id,
        assignedTracks: tracks,
        assignedCourses: stats.total,
        completedCourses: stats.completed,
        overdueCourses: stats.overdue,
        certifications: e.user_id ? (certCount.get(e.user_id) ?? 0) : 0,
        trainingStatus,
      };
    });
    setUsers(rows);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => users.filter((u) =>
    !q || [u.name, u.email, u.role, u.department, u.location, u.state].some((f) => (f ?? "").toLowerCase().includes(q.toLowerCase()))
  ), [users, q]);

  const statusTone = (s: LiveUser["trainingStatus"]) =>
    s === "Complete" ? "bg-success/15 text-success" : s === "Behind" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary";

  return (
    <GlassPageShell
      eyebrow="Users"
      eyebrowIcon={UsersIcon}
      title="People & training records"
      description="Every Blossom team member with their assignments, certifications, competencies, and training status."
      actions={isAdmin ? <Button size="sm" variant="outline"><Download className="h-4 w-4" /> Export Report</Button> : null}
    >
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute z-10 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, role, department…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <span className="text-xs text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} of ${users.length} users`}
          </span>
        </div>
      </Card>

      {error && (
        <Card className="mt-4 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </Card>
      )}

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="text-center">Tracks</TableHead>
                <TableHead className="text-center">Courses</TableHead>
                <TableHead className="text-center">Certs</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading employees…</TableCell></TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No employees match.</TableCell></TableRow>
              )}
              {filtered.map((u) => (
                <TableRow key={u.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(u)}>
                  <TableCell>
                    <div className="font-medium text-foreground">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{u.role}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{u.department}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{u.location}</TableCell>
                  <TableCell className="text-center text-sm">{u.assignedTracks}</TableCell>
                  <TableCell className="text-center text-sm">{u.completedCourses}/{u.assignedCourses}</TableCell>
                  <TableCell className="text-center text-sm">{u.certifications}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone(u.trainingStatus)}`}>
                      {u.trainingStatus}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{selected.email} · {selected.role}</p>
              </SheetHeader>
              {!selected.user_id && (
                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[11.5px] text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-amber-600" />
                  Not linked to a Blossom login — assignments will save but they won't appear in this person's training until linked.
                </div>
              )}
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Field label="Department" value={selected.department} />
                  <Field label="State" value={selected.state} />
                  <Field label="Location" value={selected.location} />
                  <Field label="Status" value={selected.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat icon={GraduationCap} label="Tracks" value={selected.assignedTracks} />
                  <Stat icon={Activity} label="Courses" value={`${selected.completedCourses}/${selected.assignedCourses}`} />
                  <Stat icon={Award} label="Certs" value={selected.certifications} />
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>Assign Track</Button>
                    <Button asChild size="sm" variant="outline"><Link to="/hr/training-assign">Assign Course</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link to="/training/certificates">View Certificates</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link to="/training/statistics">Course Activity</Link></Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AssignTrainingModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        presetEmployeeId={selected?.id ?? null}
        onAssigned={() => { setAssignOpen(false); void load(); }}
      />
    </GlassPageShell>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
      <div className="text-base font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
