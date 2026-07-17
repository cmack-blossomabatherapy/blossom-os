import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import OSShellPage from "@/components/os/OSShellPage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreboarding, type PreboardingRow } from "@/pages/rbt/app/preboarding/usePreboarding";
import PreboardingItemSheet from "@/pages/rbt/app/preboarding/PreboardingItemSheet";
import { STATUS_META, isDone } from "@/pages/rbt/app/preboarding/types";
import { AlertTriangle, CheckCircle2, Circle, Clock, ChevronRight, Users, Settings } from "lucide-react";

interface EmployeeRow {
  employee_id: string;
  full_name: string | null;
  email: string | null;
  stage: string | null;
  total: number;
  complete: number;
  overdue: number;
}

export default function RbtPreboardingConsole() {
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeRow[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: states } = await supabase.from("rbt_lifecycle_state" as any)
        .select("employee_id,stage")
        .in("stage", ["offer_accepted", "preboarding", "orientation_scheduled"]);
      const ids = (states ?? []).map((s: any) => s.employee_id);
      if (ids.length === 0) return setEmployees([]);

      const [{ data: emps }, { data: items }] = await Promise.all([
        supabase.from("employees" as any).select("id,full_name,email").in("id", ids),
        supabase.from("rbt_preboarding_items" as any).select("employee_id,status,due_at").in("employee_id", ids),
      ]);
      const now = new Date();
      const map = new Map<string, EmployeeRow>();
      (states ?? []).forEach((s: any) => {
        const e = (emps ?? []).find((x: any) => x.id === s.employee_id);
        map.set(s.employee_id, {
          employee_id: s.employee_id,
          full_name: e?.full_name ?? null,
          email: e?.email ?? null,
          stage: s.stage,
          total: 0, complete: 0, overdue: 0,
        });
      });
      (items ?? []).forEach((i: any) => {
        const row = map.get(i.employee_id);
        if (!row) return;
        row.total += 1;
        if (isDone(i.status)) row.complete += 1;
        else if (i.due_at && new Date(i.due_at) < now) row.overdue += 1;
      });
      setEmployees(Array.from(map.values()));
    })();
  }, [selected]); // refresh when returning from detail

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (employees ?? []).filter((e) =>
      !q || e.full_name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q)
    );
  }, [employees, query]);

  return (
    <OSShellPage title="RBT Preboarding" description="Track new-hire preboarding across HR, Recruiting, and Training.">
      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees"><Users className="h-4 w-4 mr-1.5" />Employees</TabsTrigger>
          <TabsTrigger value="requirements"><Settings className="h-4 w-4 mr-1.5" />Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          {selected ? (
            <EmployeeDetail employeeId={selected} onBack={() => setSelected(null)} />
          ) : (
            <>
              <Input placeholder="Search employees…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
              {employees === null ? (
                <div className="h-40 rounded-2xl bg-muted animate-pulse" />
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No employees in preboarding.</p>
              ) : (
                <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
                  {filtered.map((e) => {
                    const pct = e.total ? Math.round((e.complete / e.total) * 100) : 0;
                    return (
                      <li key={e.employee_id}>
                        <button onClick={() => setSelected(e.employee_id)} className="w-full text-left flex items-center gap-4 p-4 hover:bg-muted/50 transition">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{e.full_name ?? "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground truncate">{e.email} · {e.stage}</p>
                          </div>
                          <div className="w-40 space-y-1">
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                            <p className="text-xs text-muted-foreground tabular-nums">{e.complete}/{e.total} · {pct}%</p>
                          </div>
                          {e.overdue > 0 && <span className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />{e.overdue}</span>}
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

        <TabsContent value="requirements">
          <RequirementsAdmin />
        </TabsContent>
      </Tabs>
    </OSShellPage>
  );
}

function EmployeeDetail({ employeeId, onBack }: { employeeId: string; onBack: () => void }) {
  const { rows, stats, reload } = usePreboarding(employeeId);
  const [selected, setSelected] = useState<PreboardingRow | null>(null);
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>← Back to employees</Button>
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Progress</p>
        <p className="text-2xl font-semibold tracking-tight mt-1">{stats.complete} of {stats.total} required</p>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${stats.percent}%` }} /></div>
        {stats.overdue.length > 0 && <p className="mt-3 text-sm text-destructive flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> {stats.overdue.length} overdue</p>}
      </div>

      <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
        {(rows ?? []).map((r) => {
          const done = isDone(r.item.status);
          const overdue = !done && r.item.due_at && new Date(r.item.due_at) < new Date();
          const Icon = done ? CheckCircle2 : overdue ? AlertTriangle : r.item.status !== "not_started" ? Clock : Circle;
          return (
            <li key={r.item.id}>
              <button onClick={() => setSelected(r)} className="w-full text-left flex items-center gap-3 p-4 hover:bg-muted/50 transition">
                <Icon className={`h-5 w-5 shrink-0 ${done ? "text-primary" : overdue ? "text-destructive" : "text-muted-foreground"}`} strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.requirement.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    <span className={STATUS_META[r.item.status].tone}>{STATUS_META[r.item.status].label}</span>
                    {" · "}Owner: {r.requirement.owner_role.toUpperCase()}
                    {r.item.due_at && <> · Due {new Date(r.item.due_at).toLocaleDateString()}</>}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ul>

      <PreboardingItemSheet
        row={selected}
        internal={true}
        onClose={() => setSelected(null)}
        onChanged={() => { void reload(); setSelected(null); }}
      />
    </div>
  );
}

function RequirementsAdmin() {
  const [reqs, setReqs] = useState<any[] | null>(null);
  useEffect(() => {
    supabase.from("rbt_preboarding_requirements" as any).select("*").order("sort_order")
      .then(({ data }) => setReqs((data as any) ?? []));
  }, []);

  async function toggle(id: string, is_active: boolean) {
    await supabase.from("rbt_preboarding_requirements" as any).update({ is_active }).eq("id", id);
    setReqs((prev) => (prev ?? []).map((r) => r.id === id ? { ...r, is_active } : r));
  }

  if (!reqs) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;

  return (
    <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
      {reqs.map((r) => (
        <li key={r.id} className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium tracking-tight">{r.label}</p>
            <p className="text-xs text-muted-foreground">
              Owner: {r.owner_role} · {r.is_required ? "Required" : "Optional"}
              {r.requires_approval && " · Needs approval"}{r.requires_file && " · File upload"}
              {r.external_system && ` · External: ${r.external_system}`}
            </p>
          </div>
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            <input type="checkbox" checked={r.is_active} onChange={(e) => toggle(r.id, e.target.checked)} />
            Active
          </label>
        </li>
      ))}
    </ul>
  );
}