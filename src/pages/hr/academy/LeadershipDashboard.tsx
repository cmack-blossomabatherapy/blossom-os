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
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  UserPlus, MapPin, ExternalLink, MessageSquarePlus,
  Eye, Award, FileCheck,
} from "lucide-react";
import {
  listEnrollments,
  loadCurriculum,
  listProgress,
  listShadowSessions,
  listCheckins,
  computeReadiness,
  logShadowSession,
  logCheckin,
  upsertProgress,
} from "@/lib/academy/api";
import type { AcademyCurriculum } from "@/lib/academy/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PhaseBadge } from "@/components/academy/PhaseBadge";
import {
  computeSDReadinessCategories,
  computeLaunchChecklist,
  computeRiskSignals,
  buildReadinessSummaryText,
  computeReadinessBlockers,
  isCertificationReady,
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
  dayNumber: number;
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
  shadowHours: number;
  checkinCount: number;
  quizAvg: number | null;
  quizCount: number;
  sopCompleted: number;
  sopTotal: number;
  videosWatched: number;
  videosTotal: number;
  certificationModuleId: string | null;
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
      // Strict gating signals
      const requiredShadowMods = allModules.filter(
        (m) => m.module_type === "shadowing" && m.is_required,
      );
      const shadowSignoffComplete =
        requiredShadowMods.length > 0 &&
        requiredShadowMods.every((m) => {
          const prog = p.find((x) => x.module_id === m.id);
          if (prog?.verified_at) return true;
          // fall back: any shadow session with mentor_signoff covering required count
          return s.some((sess) => sess.mentor_signoff);
        });

      const finalReviewModule = allModules.find((m) =>
        /final knowledge (review|assessment)/i.test(m.title),
      );
      const readinessAssessmentModule = allModules.find((m) =>
        /readiness assessment|readiness evaluation/i.test(m.title),
      );
      const leadershipSignoffModule = allModules.find((m) =>
        /leadership sign[- ]?off/i.test(m.title),
      );
      const certificationModule = allModules.find((m) =>
        /state director certification|^certification$/i.test(m.title),
      );

      const quizModsAll = allModules.filter((m) => m.module_type === "quiz");
      const requiredQuizMods = quizModsAll.filter((m) => m.is_required);
      const quizScoresAll = p
        .filter((x) => quizModsAll.some((q) => q.id === x.module_id))
        .map((x) => x.score)
        .filter((x): x is number => typeof x === "number");

      const checklist = computeLaunchChecklist(cats, {
        welcomeComplete,
        readinessPct: r.overall,
        checkinCount: c.length,
        quizScores: quizScoresAll,
        requiredQuizCount: requiredQuizMods.length || quizScoresAll.length,
        quizPassThreshold: 80,
        requiredCheckinCount: 3,
        shadowSignoffComplete,
        finalKnowledgeReviewComplete: finalReviewModule
          ? completedSet.has(finalReviewModule.id)
          : undefined,
        readinessAssessmentComplete: readinessAssessmentModule
          ? completedSet.has(readinessAssessmentModule.id)
          : undefined,
        leadershipSignoffComplete: leadershipSignoffModule
          ? completedSet.has(leadershipSignoffModule.id)
          : s.some((sess) => sess.mentor_signoff),
        certificationModuleComplete: certificationModule
          ? completedSet.has(certificationModule.id)
          : false,
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
      // Derive day number: weeks * 5 + completed required in current week (cap 5)
      const completedInWeek = currentWeek.modules.filter(
        (m) => m.is_required && completedSet.has(m.id),
      ).length;
      const dayNumber = Math.min(
        25,
        Math.max(1, (currentWeek.week_number - 1) * 5 + Math.min(5, completedInWeek + 1)),
      );
      // Quiz / SOP / Video metrics
      const quizMods = allModules.filter((m) => m.module_type === "quiz");
      const quizScores = p
        .filter((x) => quizMods.some((q) => q.id === x.module_id))
        .map((x) => x.score)
        .filter((x): x is number => typeof x === "number");
      const quizAvg = quizScores.length === 0 ? null : Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length);
      const sopMods = allModules.filter((m) => m.module_type === "sop");
      const sopCompleted = sopMods.filter((m) => completedSet.has(m.id)).length;
      const videoMods = allModules.filter((m) => m.module_type === "video");
      const videosWatched = videoMods.filter((m) => completedSet.has(m.id)).length;
      built.push({
        enrollment: e,
        readiness: r.overall,
        weekNumber: currentWeek.week_number,
        dayNumber,
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
        shadowHours: Math.round(totalShadowHrs * 10) / 10,
        checkinCount: c.length,
        quizAvg,
        quizCount: quizScores.length,
        sopCompleted,
        sopTotal: sopMods.length,
        videosWatched,
        videosTotal: videoMods.length,
        certificationModuleId: certificationModule?.id ?? null,
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
            <TraineeCard key={r.enrollment.id} row={r} curriculum={curriculum} onMutate={load} />
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

function SetupStatusChip({ status }: { status: LaunchSetupStatus }) {
  const map: Record<LaunchSetupStatus, { label: string; cls: string; Icon: any }> = {
    ready:   { label: "Ready",   cls: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",       Icon: CheckCircle2 },
    pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",   Icon: Clock },
    missing: { label: "Missing", cls: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",       Icon: AlertTriangle },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function AssetStatusChip({ status }: { status: AssetStatus }) {
  const map: Record<AssetStatus, { label: string; cls: string }> = {
    linked:      { label: "Linked",      cls: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20" },
    pending:     { label: "Pending",     cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
    optional:    { label: "Optional",    cls: "bg-muted text-muted-foreground border-border" },
    needs_admin: { label: "Needs admin", cls: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
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

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ActionButton({
  icon: Icon, label, onClick,
}: { icon: any; label: string; onClick: () => void | Promise<void> }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 h-8 text-[12px] font-medium hover:bg-muted transition"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function TraineeCard({ row, curriculum, onMutate }: { row: Row; curriculum: AcademyCurriculum | null; onMutate: () => void }) {
  const launchSetup = computeLaunchSetup({
    enrollment: row.enrollment,
    curriculum,
    hasLeadershipVisibility: true,
  });
  const welcomeAssets = computeWelcomeAssetStatus(curriculum);
  const pendingSops = computePendingSops(curriculum);
  const setupGapLabels = launchSetup
    .filter((c) => c.status !== "ready")
    .map((c) => c.label);
  const blockers = computeReadinessBlockers(row.checklist);
  const certReady = isCertificationReady(row.checklist);

  function copySummary() {
    const text = buildReadinessSummaryText({
      traineeName: row.traineeName,
      state: row.state,
      readinessPct: row.readiness,
      cats: row.cats,
      checklist: row.checklist,
      risks: row.risks,
      nextAction: row.nextAction,
      weekNumber: row.weekNumber,
      dayNumber: row.dayNumber,
      shadowHours: row.shadowHours,
      checkinCount: row.checkinCount,
      certificationStatus: row.certificationStatus,
      setupGaps: setupGapLabels,
    });
    navigator.clipboard.writeText(text).then(
      () => toast.success("Readiness summary copied"),
      () => toast.error("Could not copy summary"),
    );
  }

  async function assignMentor() {
    const id = window.prompt("Mentor employee ID (UUID):", row.enrollment.mentor_employee_id ?? "");
    if (!id) return;
    const { error } = await supabase.from("academy_enrollments")
      .update({ mentor_employee_id: id }).eq("id", row.enrollment.id);
    if (error) toast.error("Could not assign mentor");
    else { toast.success("Mentor assigned"); onMutate(); }
  }
  async function assignState() {
    const state = window.prompt("Assigned state code (e.g. NC):", row.enrollment.assigned_state ?? "");
    if (!state) return;
    const { error } = await supabase.from("academy_enrollments")
      .update({ assigned_state: state.toUpperCase() }).eq("id", row.enrollment.id);
    if (error) toast.error("Could not assign state");
    else { toast.success("State assigned"); onMutate(); }
  }
  async function logShadow() {
    const hoursStr = window.prompt("Shadow hours logged:", "1");
    if (!hoursStr) return;
    const hours = Number(hoursStr);
    if (!Number.isFinite(hours) || hours <= 0) return;
    const { error } = await logShadowSession({
      enrollment_id: row.enrollment.id,
      session_date: new Date().toISOString().slice(0, 10),
      hours,
      department: null,
      shadowed_name: null,
      mentor_signoff: false,
      notes: null,
    } as any);
    if (error) toast.error("Could not log shadow session");
    else { toast.success("Shadow session logged"); onMutate(); }
  }
  async function logCheckinAction() {
    const notes = window.prompt("Check-in notes (optional):", "");
    const { error } = await logCheckin({
      enrollment_id: row.enrollment.id,
      meeting_date: new Date().toISOString().slice(0, 10),
      agenda: null,
      notes: notes ?? null,
      action_items: null,
      leader_rating: null,
    } as any);
    if (error) toast.error("Could not log check-in");
    else { toast.success("Check-in logged"); onMutate(); }
  }
  async function requestSignoff() {
    const { error } = await logShadowSession({
      enrollment_id: row.enrollment.id,
      session_date: new Date().toISOString().slice(0, 10),
      hours: 0,
      mentor_signoff: true,
      signoff_by_name: "Leadership",
      signoff_at: new Date().toISOString(),
      notes: "Leadership sign-off recorded",
    } as any);
    if (error) toast.error("Could not record sign-off");
    else { toast.success("Sign-off recorded"); onMutate(); }
  }
  async function markCertification() {
    if (!row.certificationModuleId) {
      toast.error("No certification module found in curriculum");
      return;
    }
    const now = new Date().toISOString();
    const { error } = await upsertProgress(row.enrollment.id, row.certificationModuleId, {
      status: "completed",
      started_at: now,
      completed_at: now,
    });
    if (error) toast.error("Could not mark certification complete");
    else { toast.success("Certification marked complete"); onMutate(); }
  }

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{row.traineeName}</h2>
            <PhaseBadge name={row.phaseName} colorToken={row.phaseColor} />
            <span className="text-xs text-muted-foreground">Wk {row.weekNumber} · Day {row.dayNumber}</span>
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

      {/* Evidence row */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Metric label="Quiz avg" value={row.quizAvg == null ? "—" : `${row.quizAvg}%`} sub={`${row.quizCount} taken`} />
        <Metric label="SOPs done" value={`${row.sopCompleted}/${row.sopTotal}`} />
        <Metric label="Videos watched" value={`${row.videosWatched}/${row.videosTotal}`} />
        <Metric label="Shadow hours" value={`${row.shadowHours}h`} sub="target 8h" />
        <Metric label="Check-ins" value={`${row.checkinCount}`} sub="target 3" />
      </div>

      {/* Management actions */}
      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="sd-management-actions"
      >
        <ActionButton icon={UserPlus} label="Assign mentor" onClick={assignMentor} />
        <ActionButton icon={MapPin} label="Assign state" onClick={assignState} />
        <Link
          to={`/hr/employees/${row.enrollment.employee_id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 h-8 text-[12px] font-medium hover:bg-muted transition"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open learner profile
        </Link>
        <ActionButton icon={MessageSquarePlus} label="Log check-in" onClick={logCheckinAction} />
        <ActionButton icon={Eye} label="Log shadow session" onClick={logShadow} />
        <ActionButton icon={FileCheck} label="Request sign-off" onClick={requestSignoff} />
        <ActionButton icon={Award} label="Mark certification complete" onClick={markCertification} />
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

      {/* Launch Setup */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          <p className="text-sm font-medium">Launch Setup</p>
          <span className="text-[11px] text-muted-foreground">
            Day-one readiness for this trainee.
          </span>
        </div>
        <ul className="divide-y rounded-xl border bg-card">
          {launchSetup.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm">{c.label}</p>
                <p className="text-[11px] text-muted-foreground">{c.note}</p>
              </div>
              <SetupStatusChip status={c.status} />
            </li>
          ))}
        </ul>
      </div>

      {/* Welcome assets */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Welcome to Blossom — assets</p>
        <ul className="divide-y rounded-xl border bg-card">
          {welcomeAssets.map((a) => (
            <li key={a.key} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm">{a.label}</p>
                <p className="text-[11px] text-muted-foreground">{a.note}</p>
              </div>
              <AssetStatusChip status={a.status} />
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-muted-foreground">
          Pending videos do not block training — the learner can continue with written guidance and mentor review.
        </p>
      </div>

      {/* Pending SOP resources */}
      {pendingSops.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">SOP resources pending</p>
          <ul className="divide-y rounded-xl border bg-card">
            {pendingSops.slice(0, 8).map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.note}</p>
                </div>
                <AssetStatusChip status={s.status} />
              </li>
            ))}
          </ul>
          {pendingSops.length > 8 && (
            <p className="text-[11px] text-muted-foreground">
              +{pendingSops.length - 8} more SOP resources pending.
            </p>
          )}
        </div>
      )}

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