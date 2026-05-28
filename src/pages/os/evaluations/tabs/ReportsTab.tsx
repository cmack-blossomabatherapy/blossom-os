import { useMemo } from "react";
import type { EvaluationsData } from "../useEvaluationsData";

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

export default function ReportsTab({ data }: { data: EvaluationsData }) {
  const byRole = useMemo(() => {
    const groups: Record<string, { total: number; complete: number }> = {};
    data.staff.forEach((s) => {
      groups[s.role] ||= { total: 0, complete: 0 };
      groups[s.role].total++;
      const completed = data.evaluations.some((e) => e.staff_id === s.id && e.final_status === "Complete");
      if (completed) groups[s.role].complete++;
    });
    return groups;
  }, [data]);

  const byState = useMemo(() => {
    const groups: Record<string, { total: number; complete: number }> = {};
    data.staff.forEach((s) => {
      const key = s.state ?? "Unassigned";
      groups[key] ||= { total: 0, complete: 0 };
      groups[key].total++;
      const completed = data.evaluations.some((e) => e.staff_id === s.id && e.final_status === "Complete");
      if (completed) groups[key].complete++;
    });
    return groups;
  }, [data]);

  const overdue = data.evaluations.filter((e) => e.final_status !== "Complete" && e.next_review_date && new Date(e.next_review_date) < new Date());
  const upcoming = data.evaluations.filter((e) => {
    if (e.final_status === "Complete" || !e.next_review_date) return false;
    const d = new Date(e.next_review_date);
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    return d >= new Date() && d <= in30;
  });

  return (
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
      <Card title="Overdue Evaluations">
        <p className="text-3xl font-semibold tabular-nums">{overdue.length}</p>
        <p className="text-xs text-muted-foreground mt-1">Past next review date</p>
      </Card>
      <Card title="Upcoming (Next 30 Days)">
        <p className="text-3xl font-semibold tabular-nums">{upcoming.length}</p>
        <p className="text-xs text-muted-foreground mt-1">Scheduled review windows</p>
      </Card>
    </div>
  );
}