import { useEffect, useMemo, useState } from "react";
import { Users, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { listEnrollments, loadCurriculum, listProgress, listShadowSessions, listCheckins, computeReadiness } from "@/lib/academy/api";
import type { AcademyCurriculum } from "@/lib/academy/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PhaseBadge } from "@/components/academy/PhaseBadge";

interface Row {
  enrollment: any;
  readiness: number;
  weekNumber: number;
  phaseName: string;
  phaseColor: string;
  modulesCompleted: number;
  modulesTotal: number;
}

export default function LeadershipDashboard() {
  const [loading, setLoading] = useState(true);
  const [curriculum, setCurriculum] = useState<AcademyCurriculum | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [cur, enrollments] = await Promise.all([loadCurriculum(), listEnrollments()]);
    setCurriculum(cur);
    if (!cur) { setLoading(false); return; }
    const flatWeeks = cur.phases.flatMap((p) => p.weeks.map((w) => ({ ...w, phaseColor: p.color_token, phaseName: p.name })));
    const allModules = flatWeeks.flatMap((w) => w.modules);
    const built: Row[] = [];
    for (const e of enrollments) {
      const [p, s, c] = await Promise.all([listProgress(e.id), listShadowSessions(e.id), listCheckins(e.id)]);
      const totalShadowHrs = s.reduce((a, x) => a + Number(x.hours || 0), 0);
      const r = computeReadiness({
        modules: allModules, progress: p, shadowHours: totalShadowHrs, checkins: c,
        path: e.path === "either" ? "existing_state" : e.path,
      });
      const completedSet = new Set(p.filter((x) => x.status === "completed").map((x) => x.module_id));
      const currentWeek = flatWeeks.find((w) => w.modules.some((m) => m.is_required && !completedSet.has(m.id))) ?? flatWeeks[flatWeeks.length - 1];
      const phase = cur.phases.find((ph) => ph.weeks.some((w) => w.id === currentWeek.id))!;
      built.push({
        enrollment: e,
        readiness: r.overall,
        weekNumber: currentWeek.week_number,
        phaseName: phase.name,
        phaseColor: phase.color_token,
        modulesCompleted: p.filter((x) => x.status === "completed").length,
        modulesTotal: allModules.length,
      });
    }
    setRows(built);
    setLoading(false);
  }

  const stats = useMemo(() => {
    const active = rows.length;
    const avg = active === 0 ? 0 : Math.round(rows.reduce((a, r) => a + r.readiness, 0) / active);
    const onTrack = rows.filter((r) => r.readiness >= 70).length;
    const atRisk = rows.filter((r) => r.readiness < 50).length;
    return { active, avg, onTrack, atRisk };
  }, [rows]);

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operations Academy — Leadership</h1>
        <p className="text-sm text-muted-foreground">Cohort progress, readiness, and risk across all trainees.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4">
        <KPI icon={Users} label="Active trainees" value={stats.active} />
        <KPI icon={TrendingUp} label="Avg readiness" value={`${stats.avg}%`} />
        <KPI icon={CheckCircle2} label="On track (≥70%)" value={stats.onTrack} tone="emerald" />
        <KPI icon={AlertTriangle} label="At risk (<50%)" value={stats.atRisk} tone="rose" />
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Trainee</th>
              <th className="text-left px-4 py-2">Role</th>
              <th className="text-left px-4 py-2">State</th>
              <th className="text-left px-4 py-2">Phase / Week</th>
              <th className="text-left px-4 py-2">Path</th>
              <th className="text-right px-4 py-2">Modules</th>
              <th className="text-right px-4 py-2">Readiness</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No active trainees yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.enrollment.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-2.5 font-medium">{r.enrollment.employee?.first_name} {r.enrollment.employee?.last_name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.enrollment.employee?.job_title}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.enrollment.assigned_state ?? r.enrollment.employee?.state}</td>
                <td className="px-4 py-2.5"><div className="flex items-center gap-2"><PhaseBadge name={r.phaseName} colorToken={r.phaseColor} /><span className="text-xs text-muted-foreground">Wk {r.weekNumber}</span></div></td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.enrollment.path === "new_state" ? "New State" : "Existing State"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.modulesCompleted} / {r.modulesTotal}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`inline-block min-w-[44px] rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${r.readiness >= 70 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : r.readiness >= 50 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-rose-500/10 text-rose-700 dark:text-rose-400"}`}>
                    {r.readiness}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone?: "emerald" | "rose" }) {
  const toneClass = tone === "emerald" ? "text-emerald-600 dark:text-emerald-400" : tone === "rose" ? "text-rose-600 dark:text-rose-400" : "text-primary";
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`h-3.5 w-3.5 ${toneClass}`} />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}