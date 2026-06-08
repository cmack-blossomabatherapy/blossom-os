import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  TrendingUp,
  Award,
  Activity,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  enrollment_id: string;
  employee_id: string;
  employee_name: string;
  track_id: string;
  track_name: string;
  status: string;
  start_date: string;
  total_modules: number;
  completed_modules: number;
  in_progress_modules: number;
  last_activity: string | null;
  current_module: string | null;
};

type TrackRollup = {
  track_id: string;
  track_name: string;
  learners: number;
  active: number;
  completed: number;
  avg_pct: number;
};

function relTime(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function ControlRoomActivityDashboard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [recentCompletions, setRecentCompletions] = useState<
    { name: string; module: string; at: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [enrollRes, modCountRes, certRes, recentRes] = await Promise.all([
        supabase
          .from("academy_enrollments")
          .select(
            "id, employee_id, status, start_date, track_id, employees(first_name, last_name), academy_tracks(name)",
          ),
        supabase
          .from("academy_modules")
          .select("id, title, week_id, academy_weeks!inner(phase_id, academy_phases!inner(track_id))"),
        supabase
          .from("academy_user_certificates")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("academy_progress")
          .select(
            "completed_at, started_at, status, enrollment_id, academy_modules(title), academy_enrollments(employees(first_name, last_name))",
          )
          .order("completed_at", { ascending: false, nullsFirst: false })
          .limit(8),
      ]);

      if (cancelled) return;

      const enrollments = (enrollRes.data ?? []) as any[];
      const modules = (modCountRes.data ?? []) as any[];

      // total modules per track
      const modsByTrack = new Map<string, number>();
      for (const m of modules) {
        const tid = m?.academy_weeks?.academy_phases?.track_id;
        if (!tid) continue;
        modsByTrack.set(tid, (modsByTrack.get(tid) ?? 0) + 1);
      }

      // progress per enrollment
      const enrollIds = enrollments.map((e) => e.id);
      const progRes = enrollIds.length
        ? await supabase
            .from("academy_progress")
            .select("enrollment_id, status, updated_at, completed_at, academy_modules(title)")
            .in("enrollment_id", enrollIds)
        : { data: [] as any[] };

      const progByEnroll = new Map<string, any[]>();
      for (const p of (progRes.data ?? []) as any[]) {
        const arr = progByEnroll.get(p.enrollment_id) ?? [];
        arr.push(p);
        progByEnroll.set(p.enrollment_id, arr);
      }

      const built: Row[] = enrollments.map((e) => {
        const prog = progByEnroll.get(e.id) ?? [];
        const completed = prog.filter((p) => p.status === "completed").length;
        const inProg = prog.filter((p) => p.status === "in_progress").length;
        const last = prog
          .map((p) => p.updated_at)
          .filter(Boolean)
          .sort()
          .reverse()[0] ?? null;
        const currentMod = prog.find((p) => p.status === "in_progress")?.academy_modules?.title ?? null;
        const empName =
          [e.employees?.first_name, e.employees?.last_name].filter(Boolean).join(" ") || "Unknown";
        return {
          enrollment_id: e.id,
          employee_id: e.employee_id,
          employee_name: empName,
          track_id: e.track_id,
          track_name: e.academy_tracks?.name ?? "Journey",
          status: e.status,
          start_date: e.start_date,
          total_modules: modsByTrack.get(e.track_id) ?? 0,
          completed_modules: completed,
          in_progress_modules: inProg,
          last_activity: last,
          current_module: currentMod,
        };
      });

      setRows(built);
      setCertCount(certRes.count ?? 0);
      setRecentCompletions(
        ((recentRes.data ?? []) as any[])
          .filter((r) => r.completed_at)
          .slice(0, 6)
          .map((r) => ({
            name:
              [
                r.academy_enrollments?.employees?.first_name,
                r.academy_enrollments?.employees?.last_name,
              ]
                .filter(Boolean)
                .join(" ") || "Learner",
            module: r.academy_modules?.title ?? "Module",
            at: r.completed_at,
          })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    const totalCompleted = rows.reduce((s, r) => s + r.completed_modules, 0);
    const totalModules = rows.reduce((s, r) => s + r.total_modules, 0);
    const avg = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0;
    const inProgress = rows.reduce((s, r) => s + r.in_progress_modules, 0);
    return { active, avg, inProgress, certs: certCount };
  }, [rows, certCount]);

  const trackRollups: TrackRollup[] = useMemo(() => {
    const map = new Map<string, TrackRollup & { sumPct: number }>();
    for (const r of rows) {
      const pct = r.total_modules > 0 ? (r.completed_modules / r.total_modules) * 100 : 0;
      const cur = map.get(r.track_id) ?? {
        track_id: r.track_id,
        track_name: r.track_name,
        learners: 0,
        active: 0,
        completed: 0,
        avg_pct: 0,
        sumPct: 0,
      };
      cur.learners += 1;
      if (r.status === "active") cur.active += 1;
      if (r.status === "completed") cur.completed += 1;
      cur.sumPct += pct;
      map.set(r.track_id, cur);
    }
    return Array.from(map.values()).map((t) => ({
      ...t,
      avg_pct: t.learners > 0 ? Math.round(t.sumPct / t.learners) : 0,
    }));
  }, [rows]);

  const insights = useMemo(() => {
    const out: { tone: "good" | "warn" | "info"; text: string }[] = [];
    const stale = rows.filter(
      (r) =>
        r.status === "active" &&
        r.last_activity &&
        Date.now() - new Date(r.last_activity).getTime() > 7 * 86400000,
    );
    if (stale.length) out.push({ tone: "warn", text: `${stale.length} active learner${stale.length === 1 ? "" : "s"} inactive over 7 days.` });
    const notStarted = rows.filter((r) => r.status === "active" && r.completed_modules === 0 && r.in_progress_modules === 0);
    if (notStarted.length) out.push({ tone: "warn", text: `${notStarted.length} learner${notStarted.length === 1 ? "" : "s"} assigned but haven't started.` });
    if (kpis.avg >= 75) out.push({ tone: "good", text: `Strong momentum — average journey completion at ${kpis.avg}%.` });
    if (recentCompletions.length) out.push({ tone: "info", text: `${recentCompletions.length} module${recentCompletions.length === 1 ? "" : "s"} completed recently.` });
    if (!out.length) out.push({ tone: "info", text: "Training Academy is calm. No risks detected." });
    return out;
  }, [rows, kpis.avg, recentCompletions.length]);

  return (
    <section
      data-testid="tmc-activity-dashboard"
      className="space-y-5 rounded-2xl border border-border/60 bg-card p-5 md:p-6"
    >
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Training Academy
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight">Control Room</h2>
          <p className="mt-1 max-w-3xl text-[12.5px] text-muted-foreground">
            What's happening across every journey, learner, and certification — live.
          </p>
        </div>
        {loading && <span className="text-[11px] text-muted-foreground">Loading…</span>}
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={Users} label="Active learners" value={kpis.active} tone="text-foreground" />
        <KpiCard icon={Activity} label="Modules in progress" value={kpis.inProgress} tone="text-blue-600" />
        <KpiCard icon={TrendingUp} label="Avg completion" value={`${kpis.avg}%`} tone="text-emerald-600" />
        <KpiCard icon={Award} label="Certifications" value={kpis.certs} tone="text-amber-600" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Active learners */}
        <div className="lg:col-span-2 rounded-xl border border-border/60 bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13.5px] font-semibold tracking-tight">Active learners</h3>
            <span className="text-[11px] text-muted-foreground">{rows.length} total</span>
          </div>
          {rows.length === 0 ? (
            <EmptyState text="No assigned learners yet. Assign a journey from a user profile." />
          ) : (
            <ul className="divide-y divide-border/60">
              {rows.slice(0, 8).map((r) => {
                const pct =
                  r.total_modules > 0
                    ? Math.round((r.completed_modules / r.total_modules) * 100)
                    : 0;
                return (
                  <li key={r.enrollment_id} className="grid grid-cols-12 items-center gap-3 py-2.5">
                    <div className="col-span-4">
                      <p className="text-[13px] font-medium">{r.employee_name}</p>
                      <p className="truncate text-[11.5px] text-muted-foreground">{r.track_name}</p>
                    </div>
                    <div className="col-span-4">
                      <p className="truncate text-[12px] text-foreground">
                        {r.current_module ?? <span className="text-muted-foreground">— not started</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Last active {relTime(r.last_activity)}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="w-9 text-right text-[11px] font-medium tabular-nums">{pct}%</span>
                      </div>
                      <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                        {r.completed_modules}/{r.total_modules} modules
                      </p>
                    </div>
                    <div className="col-span-1 text-right">
                      <StatusBadge status={r.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* AI insights */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-[13.5px] font-semibold tracking-tight">AI insights</h3>
          </div>
          <ul className="space-y-2.5">
            {insights.map((i, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[12.5px]">
                {i.tone === "warn" ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                ) : i.tone === "good" ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="text-foreground">{i.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* By journey */}
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <h3 className="mb-3 text-[13.5px] font-semibold tracking-tight">By journey</h3>
          {trackRollups.length === 0 ? (
            <EmptyState text="No journey enrollments yet." />
          ) : (
            <ul className="space-y-3">
              {trackRollups.map((t) => (
                <li key={t.track_id} className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium">{t.track_name}</p>
                    <span className="text-[11px] text-muted-foreground">
                      {t.learners} learner{t.learners === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={t.avg_pct} className="h-1.5 flex-1" />
                    <span className="w-9 text-right text-[11px] font-medium tabular-nums">{t.avg_pct}%</span>
                  </div>
                  <div className="mt-1.5 flex gap-3 text-[11px] text-muted-foreground">
                    <span>{t.active} active</span>
                    <span>{t.completed} completed</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent completions */}
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <h3 className="mb-3 text-[13.5px] font-semibold tracking-tight">Recent completions</h3>
          {recentCompletions.length === 0 ? (
            <EmptyState text="No module completions yet." />
          ) : (
            <ul className="space-y-2.5">
              {recentCompletions.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px]">
                      <span className="font-medium">{c.name}</span>{" "}
                      <span className="text-muted-foreground">completed</span>{" "}
                      <span className="font-medium">{c.module}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">{relTime(c.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className={cn("mt-1 text-[22px] font-semibold tracking-tight", tone)}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    completed: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    not_started: "bg-muted text-muted-foreground border-border",
    withdrawn: "bg-red-500/10 text-red-700 border-red-500/20",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] capitalize", map[status] ?? map.not_started)}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-[12px] text-muted-foreground">
      {text}
    </div>
  );
}

export default ControlRoomActivityDashboard;