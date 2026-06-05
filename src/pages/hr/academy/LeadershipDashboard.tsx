import { useEffect, useMemo, useState } from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Clock,
  CircleDashed,
  Sparkles,
} from "lucide-react";
import {
  listEnrollments,
  loadCurriculum,
  listProgress,
  listShadowSessions,
  listCheckins,
  computeReadiness,
} from "@/lib/academy/api";
import type { AcademyCurriculum } from "@/lib/academy/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PhaseBadge } from "@/components/academy/PhaseBadge";
import {
  computeSDReadinessCategories,
  computeLaunchChecklist,
  computeRiskSignals,
  buildReadinessSummaryText,
  RISK_LABEL,
  type ReadinessCategory,
  type LaunchChecklistItem,
  type RiskSignal,
  type ReadinessStatus,
} from "@/lib/academy/leadershipReadiness";
import {
  computeLaunchSetup,
  computeWelcomeAssetStatus,
  computePendingSops,
  type LaunchSetupCheck,
  type LaunchSetupStatus,
  type LaunchAsset,
  type PendingSop,
  type AssetStatus,
} from "@/lib/academy/launchAssets";
import { toast } from "sonner";

interface Row {
  enrollment: any;
  readiness: number;
  weekNumber: number;
  phaseName: string;
  phaseColor: string;
  modulesCompleted: number;
  modulesTotal: number;
  // SD-specific fields
  traineeName: string;
  state: string;
  mentor: string;
  currentFocus: string;
  nextAction: string;
  shadowingStatus: ReadinessStatus;
  mentorCheckinStatus: ReadinessStatus;
  signoffStatus: ReadinessStatus;
  certificationStatus: ReadinessStatus;
  cats: ReadinessCategory[];
  checklist: LaunchChecklistItem[];
  risks: RiskSignal[];
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
    const weeksByModuleId = new Map<string, number>();
    for (const w of flatWeeks) for (const m of w.modules) weeksByModuleId.set(m.id, w.week_number);

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

      const cats = computeSDReadinessCategories({
        modules: allModules,
        progress: p,
        shadowSessions: s,
        checkins: c,
        weeksByModuleId,
      });
      const welcomeModule = allModules.find((m) =>
        /welcome to blossom/i.test(m.title),
      );
      const welcomeComplete = welcomeModule
        ? completedSet.has(welcomeModule.id)
        : false;
      const checklist = computeLaunchChecklist(cats, {
        welcomeComplete,
        readinessPct: r.overall,
        checkinCount: c.length,
      });
      const risks = computeRiskSignals({
        progress: p,
        shadowSessions: s,
        checkins: c,
        cats,
        readinessPct: r.overall,
        enrollment: e,
        weeksByModuleId,
        expectedWeekNumber: currentWeek.week_number,
      });
      const nextRequired = currentWeek.modules.find(
        (m) => m.is_required && !completedSet.has(m.id),
      );
      const employee = (e as any).employee ?? {};
      built.push({
        enrollment: e,
        readiness: r.overall,
        weekNumber: currentWeek.week_number,
        phaseName: phase.name,
        phaseColor: phase.color_token,
        modulesCompleted: p.filter((x) => x.status === "completed").length,
        modulesTotal: allModules.length,
        traineeName: `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unnamed trainee",
        state: (e as any).assigned_state ?? employee.state ?? "",
        mentor: (e as any).mentor_employee_id ? "Assigned" : "Unassigned",
        currentFocus: currentWeek.title,
        nextAction: nextRequired?.title ?? "Schedule readiness review with leadership.",
        shadowingStatus: cats.find((x) => x.key === "shadowing")?.status ?? "not_started",
        mentorCheckinStatus: cats.find((x) => x.key === "mentor_checkins")?.status ?? "not_started",
        signoffStatus: cats.find((x) => x.key === "final_signoff")?.status ?? "not_started",
        certificationStatus: checklist.find((x) => x.key === "certification")?.status ?? "not_started",
        cats,
        checklist,
        risks,
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
        <h1 className="text-2xl font-semibold tracking-tight">State Director Readiness — Leadership</h1>
        <p className="text-sm text-muted-foreground">
          Mentor &amp; admin review of every State Director trainee — readiness, launch checklist, and at-risk signals.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4">
        <KPI icon={Users} label="Active trainees" value={stats.active} />
        <KPI icon={TrendingUp} label="Avg readiness" value={`${stats.avg}%`} />
        <KPI icon={CheckCircle2} label="On track (≥70%)" value={stats.onTrack} tone="emerald" />
        <KPI icon={AlertTriangle} label="At risk (<50%)" value={stats.atRisk} tone="rose" />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Sparkles className="mx-auto h-5 w-5 text-violet-500" />
          <p className="mt-3 text-sm font-medium">No State Director trainees enrolled yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Once you enroll a trainee, their readiness, shadowing, mentor check-ins, and launch checklist will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <TraineeCard key={r.enrollment.id} row={r} curriculum={curriculum} />
          ))}
        </div>
      )}
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

function StatusChip({ status }: { status: ReadinessStatus }) {
  const map: Record<ReadinessStatus, { label: string; cls: string; Icon: any }> = {
    complete:    { label: "Complete",    cls: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",       Icon: CheckCircle2 },
    in_progress: { label: "In progress", cls: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20", Icon: Clock },
    missing:     { label: "Missing",     cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",    Icon: AlertTriangle },
    blocked:     { label: "Blocked",     cls: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",        Icon: AlertTriangle },
    not_started: { label: "Not started", cls: "bg-muted text-muted-foreground border-border",                              Icon: CircleDashed },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function RiskChip({ risk }: { risk: RiskSignal }) {
  const tone = risk === "low_readiness" || risk === "required_modules_incomplete"
    ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      <AlertTriangle className="h-3 w-3" /> {RISK_LABEL[risk]}
    </span>
  );
}

function ReadinessBar({ value }: { value: number }) {
  const tone = value >= 70 ? "bg-teal-500" : value >= 50 ? "bg-violet-500" : "bg-amber-500";
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function TraineeCard({ row }: { row: Row }) {
  function copySummary() {
    const text = buildReadinessSummaryText({
      traineeName: row.traineeName,
      state: row.state,
      readinessPct: row.readiness,
      cats: row.cats,
      checklist: row.checklist,
      risks: row.risks,
      nextAction: row.nextAction,
    });
    navigator.clipboard.writeText(text).then(
      () => toast.success("Readiness summary copied"),
      () => toast.error("Could not copy summary"),
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{row.traineeName}</h2>
            <PhaseBadge name={row.phaseName} colorToken={row.phaseColor} />
            <span className="text-xs text-muted-foreground">Wk {row.weekNumber}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            State: <span className="text-foreground">{row.state || "TBD"}</span> ·
            Mentor: <span className="text-foreground">{row.mentor}</span> ·
            Path: {row.enrollment.path === "new_state" ? "New state" : "Existing state"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Readiness</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{row.readiness}%</p>
          </div>
          <button
            type="button"
            onClick={copySummary}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 h-9 text-xs font-medium hover:bg-muted transition"
          >
            <Copy className="h-3.5 w-3.5" /> Copy readiness summary
          </button>
        </div>
      </div>

      {/* Focus + Next action */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border bg-muted/40 p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Current focus</p>
          <p className="mt-0.5 text-sm font-medium">{row.currentFocus}</p>
        </div>
        <div className="rounded-xl border bg-muted/40 p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Next action</p>
          <p className="mt-0.5 text-sm font-medium">{row.nextAction}</p>
        </div>
      </div>

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="text-muted-foreground">Modules:</span>
        <span className="tabular-nums">{row.modulesCompleted} / {row.modulesTotal}</span>
        <span className="text-muted-foreground">Shadowing:</span><StatusChip status={row.shadowingStatus} />
        <span className="text-muted-foreground">Mentor check-ins:</span><StatusChip status={row.mentorCheckinStatus} />
        <span className="text-muted-foreground">Final sign-off:</span><StatusChip status={row.signoffStatus} />
        <span className="text-muted-foreground">Certification:</span><StatusChip status={row.certificationStatus} />
      </div>

      {/* Risk signals */}
      {row.risks.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">At-risk signals</p>
          <div className="flex flex-wrap gap-1.5">
            {row.risks.map((r) => <RiskChip key={r} risk={r} />)}
          </div>
        </div>
      )}

      {/* Category readiness */}
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Readiness categories</p>
        <div className="grid gap-2 md:grid-cols-2">
          {row.cats.map((c) => (
            <div key={c.key} className="rounded-xl border bg-card p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{c.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{c.completion}%</span>
              </div>
              <ReadinessBar value={c.completion} />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground truncate">{c.explanation}</span>
                <StatusChip status={c.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Launch readiness checklist */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-500" />
          <p className="text-sm font-medium">Launch Readiness checklist</p>
        </div>
        <ul className="divide-y rounded-xl border bg-card">
          {row.checklist.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm">{c.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {c.explanation} <span className="opacity-60">· source: {c.source}</span>
                </p>
              </div>
              <StatusChip status={c.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}