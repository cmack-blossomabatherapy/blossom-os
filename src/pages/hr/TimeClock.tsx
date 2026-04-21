import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, AlertTriangle, CheckCircle2, ExternalLink, Lock, Filter, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { PunchKindBadge, ExceptionKindBadge } from "@/components/hr/HoursStatusBadge";
import {
  employeeFullName, PUNCH_KIND_META,
  type Employee, type TimeClockPunch, type AttendanceException, type PunchKind,
} from "@/lib/hr/types";

type PunchWithEmp = TimeClockPunch & { employee?: Employee };
type ExceptionWithEmp = AttendanceException & { employee?: Employee };

export default function TimeClock() {
  const { hasPerm } = useAuth();
  const canApprove = hasPerm("hr.timeclock.approve");
  const canLock    = hasPerm("hr.timeclock.lock");

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [punches, setPunches] = useState<PunchWithEmp[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionWithEmp[]>([]);
  const [search, setSearch] = useState("");
  const [clinicFilter, setClinicFilter] = useState<string>("all");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const since = new Date(); since.setDate(since.getDate() - 7);
    const [emp, p, ex] = await Promise.all([
      supabase.from("employees").select("*"),
      supabase.from("time_clock_punches").select("*").gte("punch_at", since.toISOString()).order("punch_at", { ascending: false }).limit(500),
      supabase.from("attendance_exceptions").select("*").order("occurred_on", { ascending: false }).limit(200),
    ]);
    const employeesList = (emp.data ?? []) as Employee[];
    const empMap = new Map(employeesList.map((e) => [e.id, e]));
    setEmployees(employeesList);
    setPunches(((p.data ?? []) as TimeClockPunch[]).map((x) => ({ ...x, employee: empMap.get(x.employee_id) })));
    setExceptions(((ex.data ?? []) as AttendanceException[]).map((x) => ({ ...x, employee: empMap.get(x.employee_id) })));
    setLoading(false);
  }

  // --- Derived: who's currently in / on break / out ---
  const presence = useMemo(() => {
    // Latest punch per employee today
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    const latestByEmp = new Map<string, PunchWithEmp>();
    for (const p of punches) {
      if (p.punch_at < todayIso) continue;
      const prev = latestByEmp.get(p.employee_id);
      if (!prev || prev.punch_at < p.punch_at) latestByEmp.set(p.employee_id, p);
    }
    const rows = Array.from(latestByEmp.values()).map((p) => {
      const state =
        p.kind === "clock_in" || p.kind === "break_end" ? "in" :
        p.kind === "break_start" ? "break" : "out";
      return { punch: p, state };
    });
    return {
      in: rows.filter((r) => r.state === "in"),
      onBreak: rows.filter((r) => r.state === "break"),
      out: rows.filter((r) => r.state === "out"),
    };
  }, [punches]);

  const clinics = useMemo(
    () => Array.from(new Set(employees.map((e) => e.clinic).filter(Boolean) as string[])).sort(),
    [employees],
  );

  function matchesFilters<T extends { employee?: Employee; clinic?: string | null }>(row: T) {
    if (clinicFilter !== "all" && (row.employee?.clinic ?? row.clinic) !== clinicFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = row.employee ? employeeFullName(row.employee).toLowerCase() : "";
    return name.includes(q) || (row.employee?.email ?? "").toLowerCase().includes(q);
  }

  async function approvePunch(id: string) {
    const { error } = await supabase.from("time_clock_punches").update({ status: "approved" }).eq("id", id);
    if (error) { toast.error("Could not approve punch."); return; }
    toast.success("Punch approved.");
    void load();
  }
  async function lockPunch(id: string) {
    const { error } = await supabase.from("time_clock_punches").update({ status: "locked" }).eq("id", id);
    if (error) { toast.error("Could not lock punch."); return; }
    toast.success("Punch locked into payroll.");
    void load();
  }
  async function resolveException(id: string) {
    const { error } = await supabase.from("attendance_exceptions").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Could not resolve."); return; }
    toast.success("Exception resolved.");
    void load();
  }
  async function dismissException(id: string) {
    const { error } = await supabase.from("attendance_exceptions").update({ status: "dismissed" }).eq("id", id);
    if (error) { toast.error("Could not dismiss."); return; }
    void load();
  }

  const openExceptions = exceptions.filter((e) => e.status === "open" || e.status === "acknowledged");

  return (
    <PageShell
      title="Time Clock"
      description="Live clinic attendance, punch history, and the manager review queue."
      icon={Clock}
      actions={
        hasPerm("hr.timeclock.kiosk") && (
          <Button asChild size="sm">
            <Link to="/hr/kiosk"><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open kiosk mode</Link>
          </Button>
        )
      }
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Currently in" value={presence.in.length} icon={Users} tone="success" loading={loading} />
        <KpiCard label="On break"     value={presence.onBreak.length} icon={Clock} tone="warning" loading={loading} />
        <KpiCard label="Open exceptions" value={openExceptions.length} icon={AlertTriangle} tone={openExceptions.length > 0 ? "danger" : "default"} loading={loading} />
        <KpiCard label="Punches (7d)" value={punches.length} icon={CheckCircle2} tone="default" loading={loading} />
      </div>

      {/* Filters */}
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <Input placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 max-w-xs" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Clinic
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={clinicFilter}
          onChange={(e) => setClinicFilter(e.target.value)}
        >
          <option value="all">All clinics</option>
          {clinics.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Card>

      <Tabs defaultValue="live" className="space-y-3">
        <TabsList>
          <TabsTrigger value="live">Live presence</TabsTrigger>
          <TabsTrigger value="exceptions">
            Exceptions {openExceptions.length > 0 && <Badge variant="outline" className="ml-1.5 bg-destructive/10 text-destructive border-destructive/30">{openExceptions.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="punches">Punch history</TabsTrigger>
        </TabsList>

        {/* LIVE PRESENCE */}
        <TabsContent value="live" className="space-y-3">
          <PresenceColumn title="On the clock"  rows={presence.in.filter((r) => matchesFilters(r.punch))} tone="success" loading={loading} />
          <PresenceColumn title="On break"      rows={presence.onBreak.filter((r) => matchesFilters(r.punch))} tone="warning" loading={loading} />
          <PresenceColumn title="Clocked out today" rows={presence.out.filter((r) => matchesFilters(r.punch))} tone="muted" loading={loading} />
        </TabsContent>

        {/* EXCEPTIONS */}
        <TabsContent value="exceptions" className="space-y-2">
          {loading ? (
            <Skeleton className="h-40" />
          ) : openExceptions.filter(matchesFilters).length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">No open exceptions. ✨</Card>
          ) : openExceptions.filter(matchesFilters).map((e) => (
            <Card key={e.id} className="p-3 flex items-center gap-3">
              {e.employee && <EmployeeAvatar employee={e.employee} size="md" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {e.employee && (
                    <Link to={`/hr/employees/${e.employee.id}`} className="text-sm font-medium text-foreground hover:underline truncate">
                      {employeeFullName(e.employee)}
                    </Link>
                  )}
                  <ExceptionKindBadge kind={e.kind} />
                  <span className="text-[11px] text-muted-foreground">{new Date(e.occurred_on).toLocaleDateString()}</span>
                  {e.clinic && <span className="text-[11px] text-muted-foreground">· {e.clinic}</span>}
                </div>
                {e.detail && <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.detail}</p>}
              </div>
              {canApprove && (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => dismissException(e.id)}>Dismiss</Button>
                  <Button size="sm" onClick={() => resolveException(e.id)}>Resolve</Button>
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* PUNCH HISTORY */}
        <TabsContent value="punches">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Employee</th>
                    <th className="text-left font-medium px-3 py-2">Type</th>
                    <th className="text-left font-medium px-3 py-2">Time</th>
                    <th className="text-left font-medium px-3 py-2">Clinic</th>
                    <th className="text-left font-medium px-3 py-2">Source</th>
                    <th className="text-left font-medium px-3 py-2">Status</th>
                    {(canApprove || canLock) && <th className="px-3 py-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="p-4"><Skeleton className="h-32" /></td></tr>
                  ) : punches.filter(matchesFilters).slice(0, 100).map((p) => (
                    <tr key={p.id} className="border-t border-border/40 hover:bg-muted/20">
                      <td className="px-3 py-2">
                        {p.employee && (
                          <Link to={`/hr/employees/${p.employee.id}`} className="hover:underline text-foreground font-medium">
                            {employeeFullName(p.employee)}
                          </Link>
                        )}
                      </td>
                      <td className="px-3 py-2"><PunchKindBadge kind={p.kind} /></td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{new Date(p.punch_at).toLocaleString()}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.clinic ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground capitalize">{p.source.replace("_"," ")}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          p.status === "approved" && "bg-success/15 text-success border-success/30",
                          p.status === "pending"  && "bg-warning/15 text-warning border-warning/30",
                          p.status === "rejected" && "bg-destructive/15 text-destructive border-destructive/30",
                          p.status === "locked"   && "bg-primary/15 text-primary border-primary/30",
                        )}>{p.status}</Badge>
                      </td>
                      {(canApprove || canLock) && (
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {canApprove && p.status === "pending" && (
                            <Button size="sm" variant="outline" className="h-7 mr-1" onClick={() => approvePunch(p.id)}>Approve</Button>
                          )}
                          {canLock && p.status === "approved" && (
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => lockPunch(p.id)}>
                              <Lock className="h-3 w-3 mr-1" /> Lock
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function KpiCard({ label, value, icon: Icon, tone, loading }: { label: string; value: number; icon: typeof Clock; tone: "success"|"warning"|"danger"|"default"; loading: boolean }) {
  const tones: Record<string, string> = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger:  "bg-destructive/10 text-destructive",
    default: "bg-primary/10 text-primary",
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          {loading ? <Skeleton className="h-7 w-12 mt-1.5" /> : <p className="text-2xl font-semibold mt-1.5 tabular-nums">{value}</p>}
        </div>
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

function PresenceColumn({ title, rows, tone, loading }: { title: string; rows: { punch: PunchWithEmp }[]; tone: "success"|"warning"|"muted"; loading: boolean }) {
  const dot = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-muted-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">({rows.length})</span>
      </div>
      {loading ? (
        <Skeleton className="h-24" />
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Nobody yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {rows.map(({ punch }) => (
            <Link
              key={punch.id}
              to={punch.employee ? `/hr/employees/${punch.employee.id}` : "#"}
              className="flex items-center gap-2.5 p-2 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
            >
              {punch.employee && <EmployeeAvatar employee={punch.employee} size="sm" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{punch.employee ? employeeFullName(punch.employee) : "Unknown"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {PUNCH_KIND_META[punch.kind].label} · {new Date(punch.punch_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {punch.clinic && ` · ${punch.clinic}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}