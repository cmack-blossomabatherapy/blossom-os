import { useMemo, useState } from "react";
import type { EvaluationsData } from "../useEvaluationsData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { fmtDate } from "../statusBadges";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">{value} / {total} · {pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Kpi({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "warn" | "crit" | "ok" }) {
  const color = tone === "crit" ? "text-destructive" : tone === "warn" ? "text-amber-700 dark:text-amber-400" : tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsTab({ data }: { data: EvaluationsData }) {
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const staffById = useMemo(() => Object.fromEntries(data.staff.map((s) => [s.id, s])), [data.staff]);

  const filteredEvals = useMemo(() => {
    return data.evaluations.filter((e) => {
      const s = staffById[e.staff_id];
      if (!s) return false;
      if (stateFilter !== "all" && (s.state ?? "") !== stateFilter) return false;
      if (roleFilter !== "all" && s.role !== roleFilter) return false;
      if (typeFilter !== "all" && e.evaluation_type !== typeFilter) return false;
      if (cycleFilter !== "all" && (e.cycle_id ?? "") !== cycleFilter) return false;
      if (statusFilter !== "all" && e.final_status !== statusFilter) return false;
      if (from && (!e.created_at || new Date(e.created_at) < new Date(from))) return false;
      if (to && (!e.created_at || new Date(e.created_at) > new Date(to))) return false;
      return true;
    });
  }, [data.evaluations, staffById, stateFilter, roleFilter, typeFilter, cycleFilter, statusFilter, from, to]);

  const today = new Date();
  const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);

  const kpis = useMemo(() => {
    const activeStaff = data.staff.filter((s) => s.active_status).length;
    const dueQ = filteredEvals.filter((e) => e.next_review_date && new Date(e.next_review_date) >= quarterStart).length;
    const completedQ = filteredEvals.filter((e) => e.completed_at && new Date(e.completed_at) >= quarterStart).length;
    const overdue = filteredEvals.filter((e) => e.final_status !== "Complete" && e.next_review_date && new Date(e.next_review_date) < today).length;
    const selfPending = filteredEvals.filter((e) => e.self_status !== "Completed" && e.final_status !== "Complete").length;
    const leaderPending = filteredEvals.filter((e) => e.leadership_status !== "Completed" && e.final_status !== "Complete").length;
    const meetingsPending = filteredEvals.filter((e) => e.meeting_status !== "Completed" && e.final_status !== "Complete").length;
    const completionRate = filteredEvals.length ? Math.round((filteredEvals.filter((e) => e.final_status === "Complete").length / filteredEvals.length) * 100) : 0;
    return { activeStaff, dueQ, completedQ, overdue, selfPending, leaderPending, meetingsPending, completionRate };
  }, [data.staff, filteredEvals, quarterStart, today]);

  const byRole = useMemo(() => {
    const groups: Record<string, { total: number; complete: number }> = {};
    filteredEvals.forEach((e) => {
      const s = staffById[e.staff_id];
      if (!s) return;
      groups[s.role] ||= { total: 0, complete: 0 };
      groups[s.role].total++;
      if (e.final_status === "Complete") groups[s.role].complete++;
    });
    return groups;
  }, [filteredEvals, staffById]);

  const byState = useMemo(() => {
    const groups: Record<string, { total: number; complete: number }> = {};
    filteredEvals.forEach((e) => {
      const s = staffById[e.staff_id];
      if (!s) return;
      const key = s.state ?? "Unassigned";
      groups[key] ||= { total: 0, complete: 0 };
      groups[key].total++;
      if (e.final_status === "Complete") groups[key].complete++;
    });
    return groups;
  }, [filteredEvals, staffById]);

  const byReviewer = useMemo(() => {
    const groups: Record<string, { name: string; assigned: number; completed: number; pending: number; overdue: number }> = {};
    filteredEvals.forEach((e) => {
      const s = staffById[e.staff_id];
      const reviewerId = s?.supervisor_id ?? "unassigned";
      const reviewerName = s?.supervisor_name ?? "Unassigned";
      groups[reviewerId] ||= { name: reviewerName, assigned: 0, completed: 0, pending: 0, overdue: 0 };
      groups[reviewerId].assigned++;
      if (e.final_status === "Complete") groups[reviewerId].completed++;
      else if (e.next_review_date && new Date(e.next_review_date) < today) groups[reviewerId].overdue++;
      else groups[reviewerId].pending++;
    });
    return Object.values(groups);
  }, [filteredEvals, staffById, today]);

  const statusBreakdown = useMemo(() => {
    const groups: Record<string, number> = {
      "Not Started": 0, "Self Sent": 0, "Self Complete": 0, "Leadership Pending": 0,
      "Needs Meeting": 0, "Ready to Finalize": 0, "Complete": 0, "Overdue": 0,
    };
    filteredEvals.forEach((e) => {
      if (e.final_status === "Complete") groups["Complete"]++;
      else if (e.next_review_date && new Date(e.next_review_date) < today) groups["Overdue"]++;
      else if (e.self_status === "Not Sent") groups["Not Started"]++;
      else if (e.self_status !== "Completed") groups["Self Sent"]++;
      else if (e.leadership_status !== "Completed") groups["Leadership Pending"]++;
      else if (e.meeting_status !== "Completed") groups["Needs Meeting"]++;
      else groups["Ready to Finalize"]++;
    });
    return groups;
  }, [filteredEvals, today]);

  const upcoming = useMemo(() => {
    const in90 = new Date(); in90.setDate(today.getDate() + 90);
    return filteredEvals
      .filter((e) => e.final_status !== "Complete" && e.next_review_date && new Date(e.next_review_date) >= today && new Date(e.next_review_date) <= in90)
      .sort((a, b) => +new Date(a.next_review_date!) - +new Date(b.next_review_date!));
  }, [filteredEvals, today]);

  const overdueList = useMemo(() => filteredEvals
    .filter((e) => e.final_status !== "Complete" && e.next_review_date && new Date(e.next_review_date) < today)
    .map((e) => {
      const s = staffById[e.staff_id];
      const daysOver = Math.floor((+today - +new Date(e.next_review_date!)) / 86400000);
      const step = e.self_status !== "Completed" ? "Self Eval" : e.leadership_status !== "Completed" ? "Leadership" : e.meeting_status !== "Completed" ? "Meeting" : "Finalize";
      return { id: e.id, name: s ? `${s.first_name} ${s.last_name}` : "—", role: s?.role ?? "—", reviewer: s?.supervisor_name ?? "—", step, daysOver };
    }), [filteredEvals, staffById, today]);

  function exportOverdue() {
    exportCsv("evaluations-overdue.csv", overdueList.map((o) => ({ Staff: o.name, Role: o.role, Reviewer: o.reviewer, Step: o.step, "Days Overdue": o.daysOver })));
  }

  const states = Array.from(new Set(data.staff.map((s) => s.state).filter(Boolean))) as string[];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="rounded-2xl border border-border/70 bg-card p-3 flex flex-wrap gap-2 items-center">
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All States</SelectItem>{states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="BCBA">BCBA</SelectItem><SelectItem value="RBT">RBT</SelectItem></SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="Annual">Annual</SelectItem></SelectContent>
        </Select>
        <Select value={cycleFilter} onValueChange={setCycleFilter}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Cycle" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Cycles</SelectItem>{data.cycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Needs Meeting">Needs Meeting</SelectItem>
            <SelectItem value="Complete">Complete</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-36 text-xs" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-36 text-xs" />
        <div className="ml-auto">
          <Button size="sm" variant="outline" onClick={exportOverdue}><Download className="h-3.5 w-3.5 mr-1" />Export Overdue</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Kpi label="Active Staff" value={kpis.activeStaff} />
        <Kpi label="Due This Quarter" value={kpis.dueQ} />
        <Kpi label="Completed Quarter" value={kpis.completedQ} tone="ok" />
        <Kpi label="Overdue" value={kpis.overdue} tone={kpis.overdue ? "crit" : "ok"} />
        <Kpi label="Self Pending" value={kpis.selfPending} />
        <Kpi label="Leadership Pending" value={kpis.leaderPending} />
        <Kpi label="Meetings Pending" value={kpis.meetingsPending} tone={kpis.meetingsPending ? "warn" : "muted" as any} />
        <Kpi label="Completion Rate" value={`${kpis.completionRate}%`} tone={kpis.completionRate > 75 ? "ok" : "warn"} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Completion by Role">
          <div className="space-y-3">
            {Object.entries(byRole).length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
            {Object.entries(byRole).map(([k, v]) => <Row key={k} label={k} value={v.complete} total={v.total} />)}
          </div>
        </Card>
        <Card title="Completion by State">
          <div className="space-y-3">
            {Object.entries(byState).length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
            {Object.entries(byState).map(([k, v]) => <Row key={k} label={k} value={v.complete} total={v.total} />)}
          </div>
        </Card>
        <Card title="Evaluation Status Breakdown">
          <div className="space-y-2">
            {Object.entries(statusBreakdown).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-xs">
                <span>{k}</span><span className="tabular-nums text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Completion by Reviewer">
          {byReviewer.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-muted-foreground"><tr><th className="text-left font-medium pb-2">Reviewer</th><th className="font-medium pb-2">Asn</th><th className="font-medium pb-2">Done</th><th className="font-medium pb-2">Pend</th><th className="font-medium pb-2">Over</th></tr></thead>
              <tbody>
                {byReviewer.map((r) => (
                  <tr key={r.name} className="border-t border-border/50"><td className="py-1.5">{r.name}</td><td className="text-center tabular-nums">{r.assigned}</td><td className="text-center tabular-nums text-emerald-700 dark:text-emerald-400">{r.completed}</td><td className="text-center tabular-nums">{r.pending}</td><td className="text-center tabular-nums text-destructive">{r.overdue}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Upcoming + Overdue lists */}
      <Card title={`Upcoming Evaluations (next 90 days) — ${upcoming.length}`}>
        {upcoming.length === 0 ? <p className="text-xs text-muted-foreground">Nothing on the horizon.</p> : (
          <ul className="divide-y divide-border/70 text-xs">
            {upcoming.slice(0, 25).map((e) => {
              const s = staffById[e.staff_id];
              return (
                <li key={e.id} className="py-2 flex items-center justify-between">
                  <span>{s ? `${s.first_name} ${s.last_name}` : "—"} · <span className="text-muted-foreground">{s?.role} · {s?.state ?? "—"}</span></span>
                  <span className="text-muted-foreground">{fmtDate(e.next_review_date)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title={`Overdue Evaluations — ${overdueList.length}`}>
        {overdueList.length === 0 ? <p className="text-xs text-muted-foreground">Nothing overdue. </p> : (
          <table className="w-full text-xs">
            <thead className="text-muted-foreground"><tr><th className="text-left font-medium pb-2">Staff</th><th className="text-left font-medium pb-2">Role</th><th className="text-left font-medium pb-2">Reviewer</th><th className="text-left font-medium pb-2">Step</th><th className="text-right font-medium pb-2">Days</th></tr></thead>
            <tbody>
              {overdueList.map((o) => (
                <tr key={o.id} className="border-t border-border/50"><td className="py-1.5">{o.name}</td><td>{o.role}</td><td>{o.reviewer}</td><td>{o.step}</td><td className="text-right text-destructive tabular-nums">{o.daysOver}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}