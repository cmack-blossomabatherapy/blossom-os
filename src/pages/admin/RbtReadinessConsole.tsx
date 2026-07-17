import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OSShell } from "@/pages/os/OSShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ChevronRight, Circle, Clock, Users, ShieldAlert, PhoneCall, Settings } from "lucide-react";
import { useReadiness } from "@/pages/rbt/app/readiness/useReadiness";
import { READINESS_META, OWNER_LABEL, STAFFING_META, isReadinessDone, type ReadinessRow, type StaffingStatus } from "@/pages/rbt/app/readiness/types";

interface EmployeeRow {
  employee_id: string;
  full_name: string | null;
  email: string | null;
  total: number;
  complete: number;
  overdue: number;
  staffing_status: string | null;
  days_waiting: number | null;
}

const STAFFING_OPTIONS: StaffingStatus[] = [
  "not_ready","ready_for_matching","potential_case","schedule_confirmation",
  "awaiting_family","case_confirmed","start_date_scheduled","active","on_hold",
];

export default function RbtReadinessConsole() {
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeRow[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    (async () => {
      const [statesRes, staffingRes] = await Promise.all([
        supabase.from("rbt_readiness_gate_state" as any).select("employee_id,status,due_at"),
        supabase.from("rbt_staffing_status" as any).select("employee_id,status,became_ready_at"),
      ]);
      const states = (statesRes.data as any[]) ?? [];
      const staffing = (staffingRes.data as any[]) ?? [];
      const ids = Array.from(new Set([...states.map((s) => s.employee_id), ...staffing.map((s) => s.employee_id)]));
      if (!ids.length) return setEmployees([]);
      const { data: emps } = await supabase.from("employees" as any).select("id,full_name,email").in("id", ids);

      const now = new Date();
      const map = new Map<string, EmployeeRow>();
      ids.forEach((id) => {
        const e = (emps as any[])?.find((x) => x.id === id);
        const st = staffing.find((s) => s.employee_id === id);
        const daysWaiting = st?.status === "ready_for_matching" && st?.became_ready_at
          ? Math.floor((now.getTime() - new Date(st.became_ready_at).getTime()) / 86400000)
          : null;
        map.set(id, {
          employee_id: id, full_name: e?.full_name ?? null, email: e?.email ?? null,
          total: 0, complete: 0, overdue: 0,
          staffing_status: st?.status ?? "not_ready",
          days_waiting: daysWaiting,
        });
      });
      states.forEach((s: any) => {
        const row = map.get(s.employee_id);
        if (!row) return;
        row.total += 1;
        if (s.status === "approved" || s.status === "waived") row.complete += 1;
        else if (s.due_at && new Date(s.due_at) < now) row.overdue += 1;
      });
      setEmployees(Array.from(map.values()));
    })();
  }, [refreshTick, selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (employees ?? []).filter((e) =>
      !q || e.full_name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q)
    );
  }, [employees, query]);

  return (
    <OSShell>
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">RBT Readiness & Staffing</h1>
          <p className="text-sm text-muted-foreground">Track every RBT from onboarding through staffing.</p>
        </header>

        <Tabs defaultValue="employees">
          <TabsList>
            <TabsTrigger value="employees"><Users className="h-4 w-4 mr-1.5" />Employees</TabsTrigger>
            <TabsTrigger value="alerts"><ShieldAlert className="h-4 w-4 mr-1.5" />Unstaffed alerts</TabsTrigger>
            <TabsTrigger value="outreach"><PhoneCall className="h-4 w-4 mr-1.5" />Outreach</TabsTrigger>
            <TabsTrigger value="gates"><Settings className="h-4 w-4 mr-1.5" />Gates</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            {selected ? (
              <EmployeeDetail employeeId={selected} onBack={() => { setSelected(null); setRefreshTick((t) => t + 1); }} />
            ) : (
              <>
                <Input placeholder="Search employees…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
                {employees === null ? (
                  <div className="h-40 rounded-2xl bg-muted animate-pulse" />
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No RBTs in readiness or staffing yet.</p>
                ) : (
                  <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
                    {filtered.map((e) => {
                      const pct = e.total ? Math.round((e.complete / e.total) * 100) : 0;
                      const staffLabel = STAFFING_META[(e.staffing_status ?? "not_ready") as StaffingStatus]?.label ?? e.staffing_status;
                      return (
                        <li key={e.employee_id}>
                          <button onClick={() => setSelected(e.employee_id)} className="w-full text-left flex items-center gap-4 p-4 hover:bg-muted/50 transition">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{e.full_name ?? "Unnamed"}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {e.email} · {staffLabel}
                                {e.days_waiting !== null && <> · waiting {e.days_waiting}d</>}
                              </p>
                            </div>
                            <div className="w-40 space-y-1">
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-xs text-muted-foreground tabular-nums">{e.complete}/{e.total} · {pct}%</p>
                            </div>
                            {e.overdue > 0 && (
                              <span className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5" />{e.overdue}
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="alerts"><UnstaffedAlerts /></TabsContent>
          <TabsContent value="outreach"><OutreachTasks /></TabsContent>
          <TabsContent value="gates"><GatesAdmin /></TabsContent>
        </Tabs>
      </div>
    </OSShell>
  );
}

function EmployeeDetail({ employeeId, onBack }: { employeeId: string; onBack: () => void }) {
  const { rows, stats, reload } = useReadiness(employeeId);
  const [selected, setSelected] = useState<ReadinessRow | null>(null);
  const [staffing, setStaffing] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [s, h] = await Promise.all([
        supabase.from("rbt_staffing_status" as any).select("*").eq("employee_id", employeeId).maybeSingle(),
        supabase.from("rbt_readiness_events" as any).select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }).limit(30),
      ]);
      setStaffing(s.data);
      setHistory((h.data as any[]) ?? []);
    })();
  }, [employeeId, selected]);

  async function updateGate(row: ReadinessRow, patch: any): Promise<void> {
    const { error } = await supabase.from("rbt_readiness_gate_state" as any)
      .update({ ...patch, approved_at: patch.status === "approved" ? new Date().toISOString() : row.state.approved_at })
      .eq("id", row.state.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    void reload();
  }

  async function updateStaffing(status: string) {
    const { error } = await supabase.from("rbt_staffing_status" as any)
      .upsert({ employee_id: employeeId, status }, { onConflict: "employee_id" });
    if (error) return toast.error(error.message);
    setStaffing((prev: any) => ({ ...(prev ?? { employee_id: employeeId }), status }));
    toast.success("Staffing status updated");
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>← Back to employees</Button>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Readiness progress</p>
          <p className="text-2xl font-semibold tracking-tight mt-1">{stats.complete} of {stats.total}</p>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${stats.percent}%` }} /></div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Staffing status</p>
          <div className="mt-2">
            <Select value={staffing?.status ?? "not_ready"} onValueChange={updateStaffing}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAFFING_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STAFFING_META[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {staffing?.became_ready_at && (
            <p className="mt-2 text-xs text-muted-foreground">Ready since {new Date(staffing.became_ready_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
        {(rows ?? []).map((r) => {
          const done = isReadinessDone(r.state.status);
          const overdue = !done && r.state.due_at && new Date(r.state.due_at) < new Date();
          const Icon = done ? CheckCircle2 : overdue ? AlertTriangle : r.state.status !== "not_started" ? Clock : Circle;
          return (
            <li key={r.state.id}>
              <button onClick={() => setSelected(r)} className="w-full text-left flex items-center gap-3 p-4 hover:bg-muted/50 transition">
                <Icon className={`h-5 w-5 shrink-0 ${done ? "text-primary" : overdue ? "text-destructive" : "text-muted-foreground"}`} strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.gate.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    <span className={READINESS_META[r.state.status].tone}>{READINESS_META[r.state.status].label}</span>
                    {" · "}Owner: {OWNER_LABEL[r.gate.owner_role] ?? r.gate.owner_role}
                    {r.state.due_at && <> · Due {new Date(r.state.due_at).toLocaleDateString()}</>}
                    {r.state.risk_flag && <> · <span className="text-destructive">{r.state.risk_flag}</span></>}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ul>

      {history.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Readiness history</p>
          <ul className="space-y-2 text-sm">
            {history.slice(0, 15).map((h) => (
              <li key={h.id} className="text-muted-foreground">
                <span className="text-foreground">{h.gate_key ?? "—"}</span>: {h.event_type}
                {h.from_value && h.to_value && <> · {h.from_value} → {h.to_value}</>}
                <span className="ml-2 text-xs">{new Date(h.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && <GateEditor row={selected} onClose={() => setSelected(null)} onSave={updateGate} />}
    </div>
  );
}

function GateEditor({ row, onClose, onSave }: { row: ReadinessRow; onClose: () => void; onSave: (row: ReadinessRow, patch: any) => Promise<void> }) {
  const [status, setStatus] = useState(row.state.status);
  const [note, setNote] = useState(row.state.blocker_note ?? "");
  const [due, setDue] = useState(row.state.due_at ? row.state.due_at.slice(0, 10) : "");
  const [risk, setRisk] = useState<string>(row.state.risk_flag ?? "");

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-card border border-border/70 p-6 shadow-xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Gate</p>
        <p className="text-lg font-semibold tracking-tight">{row.gate.label}</p>

        <div className="mt-5 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["not_started","in_progress","submitted","approved","blocked","waived"] as const).map((s) =>
                  <SelectItem key={s} value={s}>{READINESS_META[s].label}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Due date</p>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Risk flag</p>
              <Select value={risk || "none"} onValueChange={(v) => setRisk(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="attention">Attention</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="escalation">Escalation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Blocker / note</p>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's blocking?" />
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={async () => {
            await onSave(row, {
              status, blocker_note: note.trim() || null,
              due_at: due ? new Date(due).toISOString() : null,
              risk_flag: risk || null,
            });
            onClose();
          }}>Save</Button>
        </div>
      </div>
    </div>
  );
}

function UnstaffedAlerts() {
  const [alerts, setAlerts] = useState<any[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await supabase.from("rbt_unstaffed_alerts" as any)
      .select("*").is("resolved_at", null).order("triggered_at", { ascending: false });
    const rows = (data as any[]) ?? [];
    setAlerts(rows);
    if (rows.length) {
      const ids = Array.from(new Set(rows.map((r) => r.employee_id)));
      const { data: emps } = await supabase.from("employees" as any).select("id,full_name").in("id", ids);
      const map: Record<string, string> = {};
      ((emps as any[]) ?? []).forEach((e) => { map[e.id] = e.full_name ?? "Unnamed"; });
      setNames(map);
    }
  }
  useEffect(() => { void load(); }, []);

  async function acknowledge(id: string) {
    await supabase.from("rbt_unstaffed_alerts" as any).update({ acknowledged_at: new Date().toISOString() }).eq("id", id);
    void load();
  }
  async function resolve(id: string) {
    await supabase.from("rbt_unstaffed_alerts" as any).update({ resolved_at: new Date().toISOString() }).eq("id", id);
    void load();
  }

  if (!alerts) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  if (alerts.length === 0) return <p className="text-sm text-muted-foreground">No open unstaffed alerts. Nice work.</p>;

  return (
    <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
      {alerts.map((a) => (
        <li key={a.id} className="p-4 flex items-center gap-3">
          <ShieldAlert className={`h-5 w-5 ${a.severity === "escalation" ? "text-destructive" : "text-primary"}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{names[a.employee_id] ?? a.employee_id}</p>
            <p className="text-xs text-muted-foreground truncate">{a.message}</p>
          </div>
          <span className="text-xs text-muted-foreground">{new Date(a.triggered_at).toLocaleDateString()}</span>
          {!a.acknowledged_at && <Button variant="outline" size="sm" onClick={() => acknowledge(a.id)}>Ack</Button>}
          <Button variant="ghost" size="sm" onClick={() => resolve(a.id)}>Resolve</Button>
        </li>
      ))}
    </ul>
  );
}

function OutreachTasks() {
  const [tasks, setTasks] = useState<any[] | null>(null);
  useEffect(() => {
    supabase.from("rbt_outreach_tasks" as any).select("*").neq("status", "done").order("due_at", { nullsFirst: false })
      .then(({ data }) => setTasks((data as any[]) ?? []));
  }, []);
  if (!tasks) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  if (tasks.length === 0) return <p className="text-sm text-muted-foreground">No open outreach tasks.</p>;
  return (
    <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
      {tasks.map((t) => (
        <li key={t.id} className="p-4">
          <p className="text-sm font-medium">{t.title}</p>
          <p className="text-xs text-muted-foreground">{t.task_type} · {t.status}{t.due_at && <> · due {new Date(t.due_at).toLocaleDateString()}</>}</p>
          {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
        </li>
      ))}
    </ul>
  );
}

function GatesAdmin() {
  const [gates, setGates] = useState<any[] | null>(null);
  useEffect(() => {
    supabase.from("rbt_readiness_gates" as any).select("*").order("sort_order")
      .then(({ data }) => setGates((data as any[]) ?? []));
  }, []);
  async function toggle(id: string, is_active: boolean) {
    await supabase.from("rbt_readiness_gates" as any).update({ is_active }).eq("id", id);
    setGates((prev) => (prev ?? []).map((g) => g.id === id ? { ...g, is_active } : g));
  }
  if (!gates) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  return (
    <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
      {gates.map((g) => (
        <li key={g.id} className="p-4 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{g.label}</p>
            <p className="text-xs text-muted-foreground">
              Owner: {OWNER_LABEL[g.owner_role] ?? g.owner_role}
              {g.advances_stage_key && <> · advances → {g.advances_stage_key}</>}
            </p>
          </div>
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            <input type="checkbox" checked={g.is_active} onChange={(e) => toggle(g.id, e.target.checked)} />
            Active
          </label>
        </li>
      ))}
    </ul>
  );
}