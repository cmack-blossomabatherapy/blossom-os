import { useMemo } from "react";
import { fmtDate, StatusPill } from "../statusBadges";
import type { EvaluationsData } from "../useEvaluationsData";

export default function ReviewerPerformanceTab({ data }: { data: EvaluationsData }) {
  const rows = useMemo(() => {
    const map = new Map<string, { name: string; assigned: number; completed: number; overdue: number; turnarounds: number[] }>();
    for (const s of data.staff) {
      if (!s.supervisor_id || !s.supervisor_name) continue;
      const myEvals = data.evaluations.filter((e) => e.staff_id === s.id);
      const r = map.get(s.supervisor_id) ?? { name: s.supervisor_name, assigned: 0, completed: 0, overdue: 0, turnarounds: [] };
      for (const e of myEvals) {
        r.assigned++;
        if (e.leadership_status === "Completed") {
          r.completed++;
          if (e.completed_at && e.created_at) {
            const days = (+new Date(e.completed_at) - +new Date(e.created_at)) / 86400000;
            if (days >= 0) r.turnarounds.push(days);
          }
        } else if (e.next_review_date && new Date(e.next_review_date) < new Date()) {
          r.overdue++;
        }
      }
      map.set(s.supervisor_id, r);
    }
    return Array.from(map.values()).sort((a, b) => b.assigned - a.assigned);
  }, [data.staff, data.evaluations]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <h3 className="text-sm font-semibold">Reviewer accountability</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Track which reviewers are keeping up with their leadership evaluations.</p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No reviewers assigned yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Reviewer</th>
                <th className="text-left font-medium px-3 py-3">Assigned</th>
                <th className="text-left font-medium px-3 py-3">Completed</th>
                <th className="text-left font-medium px-3 py-3">Overdue</th>
                <th className="text-left font-medium px-3 py-3">Avg turnaround</th>
                <th className="text-left font-medium px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {rows.map((r) => {
                const avg = r.turnarounds.length > 0 ? Math.round(r.turnarounds.reduce((a, b) => a + b, 0) / r.turnarounds.length) : null;
                const rate = r.assigned > 0 ? Math.round((r.completed / r.assigned) * 100) : 0;
                const tone = r.overdue > 2 ? "crit" : r.overdue > 0 ? "warn" : "ok";
                const label = r.overdue > 2 ? "Bottleneck" : r.overdue > 0 ? "Behind" : "On track";
                return (
                  <tr key={r.name} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{r.name}</td>
                    <td className="px-3 py-2.5 text-sm">{r.assigned}</td>
                    <td className="px-3 py-2.5 text-sm">{r.completed} <span className="text-[11px] text-muted-foreground">({rate}%)</span></td>
                    <td className="px-3 py-2.5 text-sm">{r.overdue}</td>
                    <td className="px-3 py-2.5 text-sm">{avg !== null ? `${avg} days` : "—"}</td>
                    <td className="px-3 py-2.5"><StatusPill tone={tone as any}>{label}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}