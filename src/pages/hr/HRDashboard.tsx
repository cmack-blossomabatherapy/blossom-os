import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HeartHandshake, Users, MapPin, Building2, AlertTriangle, FileWarning,
  Clock, GraduationCap, FileText, TrendingUp, UserPlus, UserMinus,
} from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EmployeeStatusBadge } from "@/components/hr/HRStatusBadge";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { employeeFullName, type Employee } from "@/lib/hr/types";
import { useAuth } from "@/contexts/AuthContext";

interface Kpi {
  label: string;
  value: number | string;
  hint?: string;
  icon: typeof Users;
  tone?: "default" | "warning" | "success" | "danger";
}

const TONE: Record<string, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  danger:  "bg-destructive/10 text-destructive",
};

export default function HRDashboard() {
  const { hasPerm } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activity, setActivity] = useState<{ id: string; description: string; created_at: string; event_type: string }[]>([]);
  const [openCases, setOpenCases] = useState(0);
  const [missingDocs, setMissingDocs] = useState(0);
  const [overdueOnboardingTasks, setOverdueOnboardingTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const [emp, act, cases, docs, tasks] = await Promise.all([
      supabase.from("employees").select("*").order("last_name"),
      supabase.from("employee_timeline").select("id, description, created_at, event_type").order("created_at", { ascending: false }).limit(15),
      supabase.from("employee_cases").select("id", { count: "exact", head: true }).in("status", ["new","open","waiting_employee","waiting_manager","waiting_payroll","waiting_hr"]),
      supabase.from("employee_documents_hr").select("id", { count: "exact", head: true }).in("status", ["missing","requested","expired"]),
      supabase.from("employee_onboarding_tasks").select("id", { count: "exact", head: true }).eq("completed", false).lt("due_date", new Date().toISOString().slice(0, 10)),
    ]);
    setEmployees((emp.data ?? []) as Employee[]);
    setActivity(act.data ?? []);
    setOpenCases(cases.count ?? 0);
    setMissingDocs(docs.count ?? 0);
    setOverdueOnboardingTasks(tasks.count ?? 0);
    setLoading(false);
  }

  const active = employees.filter((e) => e.status === "active").length;
  const pending = employees.filter((e) => e.status === "pending_start").length;
  const newThisMonth = employees.filter((e) => {
    if (!e.start_date) return false;
    const d = new Date(e.start_date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const offboardedThisMonth = employees.filter((e) => {
    if (!e.termination_date) return false;
    const d = new Date(e.termination_date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const byState = employees.reduce<Record<string, number>>((acc, e) => {
    acc[e.state] = (acc[e.state] ?? 0) + 1;
    return acc;
  }, {});

  const kpis: Kpi[] = [
    { label: "Active employees", value: active, icon: Users, tone: "success" },
    { label: "Pending start",    value: pending, icon: UserPlus, tone: "warning" },
    { label: "New this month",   value: newThisMonth, icon: TrendingUp, tone: "default" },
    { label: "Offboarded MTD",   value: offboardedThisMonth, icon: UserMinus, tone: "default" },
    { label: "Open HR cases",    value: openCases, icon: AlertTriangle, tone: openCases > 0 ? "warning" : "default" },
    { label: "Missing documents",value: missingDocs, icon: FileWarning, tone: missingDocs > 0 ? "danger" : "default" },
    { label: "Overdue onboarding", value: overdueOnboardingTasks, icon: Clock, tone: overdueOnboardingTasks > 0 ? "warning" : "default" },
    { label: "Training due",     value: "—", hint: "Phase 3", icon: GraduationCap },
  ];

  return (
    <PageShell
      title="HR Dashboard"
      description="People operations command center for the HR team."
      icon={HeartHandshake}
    >
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map((k) => (
              <Card key={k.label} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{k.label}</p>
                    <p className="text-2xl font-semibold text-foreground mt-1.5 tabular-nums">{k.value}</p>
                    {k.hint && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{k.hint}</p>}
                  </div>
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", TONE[k.tone ?? "default"])}>
                    <k.icon className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">By state</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(byState).sort((a, b) => b[1] - a[1]).map(([state, count]) => (
                  <div key={state} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{state}</span>
                    <div className="flex items-center gap-2 flex-1 ml-3">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(count / employees.length) * 100}%` }} />
                      </div>
                      <span className="tabular-nums text-muted-foreground w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Recent activity</h3>
                </div>
              </div>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No activity yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {activity.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 text-sm py-1.5 border-b border-border/30 last:border-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate">{a.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(a.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Recently added employees</h3>
              {hasPerm("hr.employees.view") && (
                <Link to="/hr/directory" className="text-xs text-primary hover:underline">View all →</Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {employees.slice(0, 6).map((e) => (
                <Link
                  key={e.id}
                  to={`/hr/employees/${e.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <EmployeeAvatar employee={e} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{employeeFullName(e)}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{e.job_title} · {e.state}</p>
                  </div>
                  <EmployeeStatusBadge status={e.status} />
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </PageShell>
  );
}