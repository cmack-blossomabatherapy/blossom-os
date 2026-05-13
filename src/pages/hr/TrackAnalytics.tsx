import { useEffect, useMemo, useState } from "react";
import { Activity, Award, BarChart3, CalendarClock, GraduationCap, Loader2, Timer, TrendingUp, Users } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Track { id: string; name: string; is_active: boolean }
interface Phase { id: string; track_id: string; position: number; name: string; color_token: string }
interface Week { id: string; phase_id: string; week_number: number; title: string; is_archived: boolean }
interface Module { id: string; week_id: string; title: string; is_required: boolean; is_archived: boolean }
interface Competency { id: string; track_id: string; name: string; code: string }
interface Enrollment {
  id: string; employee_id: string; track_id: string; status: string;
  start_date: string; created_at: string;
  employee?: { first_name: string; last_name: string; job_title: string | null };
}
interface Progress {
  enrollment_id: string; module_id: string; status: string;
  started_at: string | null; completed_at: string | null;
}
interface CompScore { enrollment_id: string; competency_id: string; score: number }

const fmtDays = (n: number) => (Number.isFinite(n) ? `${n.toFixed(1)}d` : "—");
const fmtDate = (d: Date | null) =>
  d && !isNaN(d.getTime()) ? d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function TrackAnalytics() {
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackId, setTrackId] = useState<string>("");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [scores, setScores] = useState<CompScore[]>([]);

  // Load tracks once
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("academy_tracks").select("id, name, is_active").order("name");
      const list = (data ?? []) as Track[];
      setTracks(list);
      if (list.length && !trackId) setTrackId(list[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load track-scoped data
  useEffect(() => {
    if (!trackId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [phasesRes, compsRes, enrollRes] = await Promise.all([
        supabase.from("academy_phases").select("id, track_id, position, name, color_token")
          .eq("track_id", trackId).order("position"),
        supabase.from("academy_competencies").select("id, track_id, name, code")
          .eq("track_id", trackId).order("position"),
        supabase.from("academy_enrollments")
          .select("id, employee_id, track_id, status, start_date, created_at, employee:employees!academy_enrollments_employee_id_fkey(first_name, last_name, job_title)")
          .eq("track_id", trackId),
      ]);
      const ph = (phasesRes.data ?? []) as Phase[];
      const phaseIds = ph.map((p) => p.id);
      const weeksRes = phaseIds.length
        ? await supabase.from("academy_weeks")
            .select("id, phase_id, week_number, title, is_archived")
            .in("phase_id", phaseIds).order("week_number")
        : { data: [] as Week[] };
      const wk = (weeksRes.data ?? []) as Week[];
      const weekIds = wk.map((w) => w.id);
      const modsRes = weekIds.length
        ? await supabase.from("academy_modules")
            .select("id, week_id, title, is_required, is_archived")
            .in("week_id", weekIds)
        : { data: [] as Module[] };
      const mods = (modsRes.data ?? []) as Module[];
      const enrollIds = ((enrollRes.data ?? []) as unknown as Enrollment[]).map((e) => e.id);
      const [progRes, scoresRes] = enrollIds.length
        ? await Promise.all([
            supabase.from("academy_progress")
              .select("enrollment_id, module_id, status, started_at, completed_at")
              .in("enrollment_id", enrollIds),
            supabase.from("academy_competency_scores")
              .select("enrollment_id, competency_id, score")
              .in("enrollment_id", enrollIds),
          ])
        : [{ data: [] as Progress[] }, { data: [] as CompScore[] }];

      if (cancelled) return;
      setPhases(ph);
      setWeeks(wk);
      setModules(mods);
      setCompetencies((compsRes.data ?? []) as Competency[]);
      setEnrollments((enrollRes.data ?? []) as unknown as Enrollment[]);
      setProgress((progRes.data ?? []) as Progress[]);
      setScores((scoresRes.data ?? []) as CompScore[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [trackId]);

  const requiredModules = useMemo(
    () => modules.filter((m) => m.is_required && !m.is_archived),
    [modules],
  );
  const requiredModuleIds = useMemo(() => new Set(requiredModules.map((m) => m.id)), [requiredModules]);
  const completedSet = useMemo(
    () => new Set(progress.filter((p) => p.status === "completed" || p.status === "waived").map((p) => `${p.enrollment_id}:${p.module_id}`)),
    [progress],
  );

  // Per-trainee completion rate (required modules)
  const traineeRates = useMemo(() => {
    const total = requiredModules.length || 1;
    return enrollments.map((e) => {
      const done = requiredModules.filter((m) => completedSet.has(`${e.id}:${m.id}`)).length;
      return { enrollment: e, done, total, pct: Math.round((done / total) * 100) };
    });
  }, [enrollments, requiredModules, completedSet]);

  // KPIs
  const kpis = useMemo(() => {
    const active = enrollments.filter((e) => e.status === "active").length;
    const completed = enrollments.filter((e) => e.status === "completed").length;
    const totalEnroll = enrollments.length;
    const avgPct = traineeRates.length
      ? Math.round(traineeRates.reduce((a, t) => a + t.pct, 0) / traineeRates.length)
      : 0;

    // Avg time-on-module across all completions
    const durations: number[] = [];
    for (const p of progress) {
      if (p.status !== "completed" || !p.started_at || !p.completed_at) continue;
      const ms = new Date(p.completed_at).getTime() - new Date(p.started_at).getTime();
      if (ms > 0) durations.push(ms / (1000 * 60 * 60 * 24));
    }
    const avgDays = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : NaN;

    return { active, completed, totalEnroll, avgPct, avgDays };
  }, [enrollments, traineeRates, progress]);

  // Phase progress: average % of trainees who completed each module in the phase
  const phaseProgress = useMemo(() => {
    return phases.map((p) => {
      const phaseWeekIds = new Set(weeks.filter((w) => w.phase_id === p.id && !w.is_archived).map((w) => w.id));
      const phaseModules = requiredModules.filter((m) => phaseWeekIds.has(m.week_id));
      const denom = phaseModules.length * Math.max(enrollments.length, 1);
      let num = 0;
      for (const e of enrollments) {
        for (const m of phaseModules) if (completedSet.has(`${e.id}:${m.id}`)) num++;
      }
      const pct = denom === 0 ? 0 : Math.round((num / denom) * 100);
      return { name: p.name, pct, modules: phaseModules.length };
    });
  }, [phases, weeks, requiredModules, enrollments, completedSet]);

  // Competency completion rate: % of trainees scored >= 4 (out of 5)
  const competencyRates = useMemo(() => {
    const denom = Math.max(enrollments.length, 1);
    return competencies.map((c) => {
      const passing = scores.filter((s) => s.competency_id === c.id && Number(s.score) >= 4).length;
      const avg = (() => {
        const list = scores.filter((s) => s.competency_id === c.id).map((s) => Number(s.score));
        return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
      })();
      return { name: c.name, code: c.code, pct: Math.round((passing / denom) * 100), avg: Number(avg.toFixed(2)) };
    });
  }, [competencies, scores, enrollments]);

  // Time on module: avg days per module title (completed only)
  const moduleTime = useMemo(() => {
    const byModule = new Map<string, number[]>();
    for (const p of progress) {
      if (p.status !== "completed" || !p.started_at || !p.completed_at) continue;
      if (!requiredModuleIds.has(p.module_id)) continue;
      const ms = new Date(p.completed_at).getTime() - new Date(p.started_at).getTime();
      if (ms <= 0) continue;
      const arr = byModule.get(p.module_id) ?? [];
      arr.push(ms / (1000 * 60 * 60 * 24));
      byModule.set(p.module_id, arr);
    }
    const rows = Array.from(byModule.entries()).map(([moduleId, days]) => {
      const m = modules.find((x) => x.id === moduleId);
      return {
        title: m?.title ?? "Module",
        avgDays: Number((days.reduce((a, b) => a + b, 0) / days.length).toFixed(2)),
        n: days.length,
      };
    });
    return rows.sort((a, b) => b.avgDays - a.avgDays).slice(0, 8);
  }, [progress, modules, requiredModuleIds]);

  // Completion forecast: per-trainee ETA based on individual pace
  const forecast = useMemo(() => {
    const today = Date.now();
    const rows = traineeRates.map((t) => {
      if (t.pct >= 100) {
        return { name: nameOf(t.enrollment), pct: 100, etaDate: null as Date | null, daysOut: 0 };
      }
      const startedMs = t.enrollment.start_date
        ? new Date(t.enrollment.start_date).getTime()
        : new Date(t.enrollment.created_at).getTime();
      const elapsedDays = Math.max(1, (today - startedMs) / (1000 * 60 * 60 * 24));
      const pace = t.done / elapsedDays; // modules/day
      const remaining = t.total - t.done;
      const daysOut = pace > 0 ? Math.ceil(remaining / pace) : NaN;
      const eta = Number.isFinite(daysOut) ? new Date(today + daysOut * 24 * 60 * 60 * 1000) : null;
      return { name: nameOf(t.enrollment), pct: t.pct, etaDate: eta, daysOut };
    });
    return rows.sort((a, b) => (b.pct - a.pct));
  }, [traineeRates]);

  // Cohort projected graduation = median ETA among in-progress trainees
  const cohortEta = useMemo(() => {
    const days = forecast
      .filter((f) => f.pct < 100 && Number.isFinite(f.daysOut))
      .map((f) => f.daysOut as number)
      .sort((a, b) => a - b);
    if (!days.length) return null;
    const median = days[Math.floor(days.length / 2)];
    return new Date(Date.now() + median * 24 * 60 * 60 * 1000);
  }, [forecast]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <BarChart3 className="h-5 w-5 text-primary" /> Track Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Phase progress, competency mastery, time-on-module, and graduation forecasts.
          </p>
        </div>
        <div className="w-64">
          <Select value={trackId} onValueChange={setTrackId}>
            <SelectTrigger><SelectValue placeholder="Select track" /></SelectTrigger>
            <SelectContent>
              {tracks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}{!t.is_active ? " (inactive)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <KPI icon={Users} label="Active trainees" value={kpis.active} sub={`${kpis.totalEnroll} total`} />
            <KPI icon={GraduationCap} label="Graduated" value={kpis.completed} tone="emerald" />
            <KPI icon={TrendingUp} label="Avg completion" value={`${kpis.avgPct}%`} />
            <KPI icon={Timer} label="Avg time / module" value={fmtDays(kpis.avgDays)} />
            <KPI icon={CalendarClock} label="Cohort ETA" value={cohortEta ? fmtDate(cohortEta) : "—"} tone="violet" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" /> Progress by phase
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {phaseProgress.length === 0 ? (
                  <Empty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={phaseProgress} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis domain={[0, 100]} unit="%" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        formatter={(v: number) => [`${v}%`, "Completion"]}
                      />
                      <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                        {phaseProgress.map((_, i) => (
                          <Cell key={i} fill={`hsl(var(--primary) / ${0.55 + i * 0.12})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-4 w-4 text-primary" /> Competency mastery
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {competencyRates.length === 0 ? (
                  <Empty label="No competencies defined for this track." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={competencyRates} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} unit="%" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis type="category" dataKey="name" width={140} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        formatter={(v: number, _n, p: any) => [`${v}% (avg ${p.payload.avg}/5)`, "Mastery"]}
                      />
                      <Bar dataKey="pct" radius={[0, 6, 6, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Timer className="h-4 w-4 text-primary" /> Time-on-module (longest 8)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {moduleTime.length === 0 ? (
                  <Empty label="No completed modules with timing data yet." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleTime} margin={{ top: 8, right: 8, left: -16, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-18} textAnchor="end" interval={0} />
                      <YAxis unit="d" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        formatter={(v: number, _n, p: any) => [`${v}d (n=${p.payload.n})`, "Avg"]}
                      />
                      <Bar dataKey="avgDays" radius={[6, 6, 0, 0]} fill="hsl(var(--accent))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-4 w-4 text-primary" /> Completion forecast
                </CardTitle>
                {cohortEta && (
                  <Badge variant="secondary" className="font-medium">Cohort median: {fmtDate(cohortEta)}</Badge>
                )}
              </CardHeader>
              <CardContent className="overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Trainee</th>
                      <th className="px-4 py-2 text-right">Progress</th>
                      <th className="px-4 py-2 text-right">Days remaining</th>
                      <th className="px-4 py-2 text-right">Projected finish</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No enrollments yet.</td></tr>
                    )}
                    {forecast.map((f, i) => (
                      <tr key={i} className="border-t hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{f.name}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          <div className="inline-flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-primary" style={{ width: `${f.pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{f.pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {f.pct >= 100 ? "—" : Number.isFinite(f.daysOut) ? `${f.daysOut}d` : "n/a"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {f.pct >= 100 ? <span className="text-emerald-600 dark:text-emerald-400">Complete</span> : fmtDate(f.etaDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function nameOf(e: Enrollment) {
  const n = `${e.employee?.first_name ?? ""} ${e.employee?.last_name ?? ""}`.trim();
  return n || "Trainee";
}

function KPI({
  icon: Icon, label, value, sub, tone,
}: { icon: any; label: string; value: number | string; sub?: string; tone?: "emerald" | "violet" }) {
  const toneClass =
    tone === "emerald" ? "text-emerald-600 dark:text-emerald-400"
    : tone === "violet" ? "text-violet-600 dark:text-violet-400"
    : "text-primary";
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`h-3.5 w-3.5 ${toneClass}`} />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Empty({ label = "No data yet." }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-3.5 w-3.5 opacity-0" />{label}
    </div>
  );
}