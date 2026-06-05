import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Rocket,
  Compass,
  Library,
  Wrench,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  listEnrollments,
  loadCurriculum,
  listProgress,
  listShadowSessions,
  listCheckins,
  computeReadiness,
  type AcademyCurriculum,
} from "@/lib/academy/api";
import {
  computeSDReadinessCategories,
  computeLaunchChecklist,
  computeRiskSignals,
  RISK_LABEL,
  type RiskSignal,
  type LaunchChecklistItem,
} from "@/lib/academy/leadershipReadiness";
import {
  computeLaunchSetup,
  computeWelcomeAssetStatus,
  computePendingSops,
  type LaunchSetupCheck,
  type LaunchAsset,
  type PendingSop,
} from "@/lib/academy/launchAssets";
import { useAcademy } from "@/lib/training/academyData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AssignTrainingModal } from "@/components/training/AssignTrainingModal";

interface TraineeRow {
  enrollment: any;
  traineeName: string;
  state: string;
  mentor: string;
  weekNumber: number;
  phaseName: string;
  readiness: number;
  nextAction: string;
  risks: RiskSignal[];
  setup: LaunchSetupCheck[];
  checklist: LaunchChecklistItem[];
}

/**
 * Training Management — Control Room
 *
 * Calm operational landing for the Training Management workspace.
 * Surfaces six sections an admin / mentor needs to act on:
 *   1. Active Trainees
 *   2. Setup Needed
 *   3. Launch Readiness
 *   4. Resource / SOP Gaps
 *   5. Paths & Journeys
 *   6. Admin Actions
 *
 * Pure presentation over existing academy/launch-asset/readiness helpers —
 * no DB schema, RBAC, or journey-structure changes.
 */
export default function TrainingControlRoom() {
  const { journeys } = useAcademy();
  const [loading, setLoading] = useState(true);
  const [curriculum, setCurriculum] = useState<AcademyCurriculum | null>(null);
  const [rows, setRows] = useState<TraineeRow[]>([]);
  const [welcomeAssets, setWelcomeAssets] = useState<LaunchAsset[]>([]);
  const [pendingSops, setPendingSops] = useState<PendingSop[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [cur, enrollments] = await Promise.all([loadCurriculum(), listEnrollments()]);
    setCurriculum(cur);
    setWelcomeAssets(computeWelcomeAssetStatus(cur));
    setPendingSops(computePendingSops(cur));

    if (!cur) { setRows([]); setLoading(false); return; }

    const flatWeeks = cur.phases.flatMap((p) =>
      p.weeks.map((w) => ({ ...w, phaseName: p.name })),
    );
    const allModules = flatWeeks.flatMap((w) => w.modules);
    const weeksByModuleId = new Map<string, number>();
    for (const w of flatWeeks) for (const m of w.modules) weeksByModuleId.set(m.id, w.week_number);

    const built: TraineeRow[] = [];
    for (const e of enrollments) {
      const [p, s, c] = await Promise.all([
        listProgress(e.id),
        listShadowSessions(e.id),
        listCheckins(e.id),
      ]);
      const totalShadowHrs = s.reduce((a, x) => a + Number(x.hours || 0), 0);
      const r = computeReadiness({
        modules: allModules,
        progress: p,
        shadowHours: totalShadowHrs,
        checkins: c,
        path: e.path === "either" ? "existing_state" : e.path,
      });
      const completedSet = new Set(p.filter((x) => x.status === "completed").map((x) => x.module_id));
      const currentWeek =
        flatWeeks.find((w) => w.modules.some((m) => m.is_required && !completedSet.has(m.id))) ??
        flatWeeks[flatWeeks.length - 1];
      const phase = cur.phases.find((ph) => ph.weeks.some((w) => w.id === currentWeek.id))!;

      const cats = computeSDReadinessCategories({
        modules: allModules,
        progress: p,
        shadowSessions: s,
        checkins: c,
        weeksByModuleId,
      });
      const welcomeModule = allModules.find((m) => /welcome to blossom/i.test(m.title));
      const welcomeComplete = welcomeModule ? completedSet.has(welcomeModule.id) : false;
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
      const setup = computeLaunchSetup({
        enrollment: e,
        curriculum: cur,
        hasLeadershipVisibility: true,
      });
      const nextRequired = currentWeek.modules.find(
        (m) => m.is_required && !completedSet.has(m.id),
      );
      const employee = (e as any).employee ?? {};
      built.push({
        enrollment: e,
        traineeName:
          `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() ||
          "Unnamed trainee",
        state: (e as any).assigned_state ?? employee.state ?? "—",
        mentor: (e as any).mentor_employee_id ? "Mentor assigned" : "Mentor unassigned",
        weekNumber: currentWeek.week_number,
        phaseName: phase.name,
        readiness: r.overall,
        nextAction: nextRequired?.title ?? "Schedule readiness review",
        risks,
        setup,
        checklist,
      });
    }
    setRows(built);
    setLoading(false);
  }

  const totals = useMemo(() => {
    const active = rows.length;
    const atRisk = rows.filter((r) => r.readiness < 50 || r.risks.length > 0).length;
    const avg = active === 0 ? 0 : Math.round(rows.reduce((a, r) => a + r.readiness, 0) / active);
    const setupGaps = rows.reduce(
      (a, r) => a + r.setup.filter((c) => c.status !== "ready").length,
      0,
    );
    return { active, atRisk, avg, setupGaps };
  }, [rows]);

  const pendingWelcome = welcomeAssets.filter((a) => a.status !== "linked");

  if (loading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-8" data-testid="training-control-room">
      {/* KPI strip */}
      <section
        aria-label="Training overview"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <Kpi icon={Users} label="Active trainees" value={totals.active} />
        <Kpi icon={CheckCircle2} label="Avg readiness" value={`${totals.avg}%`} tone="emerald" />
        <Kpi icon={AlertTriangle} label="At risk" value={totals.atRisk} tone={totals.atRisk > 0 ? "rose" : undefined} />
        <Kpi icon={Wrench} label="Setup gaps" value={totals.setupGaps} tone={totals.setupGaps > 0 ? "amber" : undefined} />
      </section>

      {/* Active Trainees */}
      <Section
        title="Active Trainees"
        subtitle="Who is in training and what they're working on right now."
        icon={Users}
      >
        {rows.length === 0 ? (
          <EmptyState
            message="No trainees enrolled yet."
            hint="Use Assign to enroll an employee into a journey."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((r) => (
              <article
                key={r.enrollment.id}
                className="rounded-2xl border border-border/70 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-semibold tracking-tight">
                      {r.traineeName}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {r.state} · {r.mentor}
                    </p>
                  </div>
                  <ReadinessChip pct={r.readiness} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Week {r.weekNumber} · {r.phaseName}
                </div>
                <p className="mt-2 text-[12.5px] text-foreground/85">
                  <span className="text-muted-foreground">Next: </span>
                  {r.nextAction}
                </p>
                {r.risks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.risks.map((risk) => (
                      <span
                        key={risk}
                        className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-700 dark:text-rose-300"
                      >
                        {RISK_LABEL[risk]}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Section>

      {/* Setup Needed */}
      <Section
        title="Setup Needed"
        subtitle="Trainees missing employee linking, mentor, state, or path."
        icon={Wrench}
      >
        {rows.length === 0 ? (
          <EmptyState message="No trainees yet — setup will appear once enrolled." />
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const gaps = r.setup.filter((c) => c.status !== "ready");
              if (gaps.length === 0) {
                return (
                  <CalmRow
                    key={r.enrollment.id}
                    label={r.traineeName}
                    detail="All setup complete."
                    tone="ready"
                  />
                );
              }
              return (
                <div
                  key={r.enrollment.id}
                  className="rounded-xl border border-border/70 bg-card p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium">{r.traineeName}</p>
                    <span className="text-[11px] text-muted-foreground">
                      {gaps.length} pending
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {gaps.map((g) => (
                      <li
                        key={g.key}
                        className="flex items-start gap-2 text-[12px] text-foreground/80"
                      >
                        <StatusDot status={g.status} />
                        <span>
                          <span className="font-medium text-foreground">{g.label}</span>
                          <span className="text-muted-foreground"> — {g.note}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Launch Readiness */}
      <Section
        title="Launch Readiness"
        subtitle="Welcome assets and per-trainee launch checklist."
        icon={Rocket}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-[13px] font-semibold tracking-tight">Welcome assets</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Pending videos do not block trainees — written guidance still works.
            </p>
            <ul className="mt-3 space-y-1.5">
              {welcomeAssets.map((a) => (
                <li key={a.key} className="flex items-start gap-2 text-[12px]">
                  <StatusDot status={a.status === "linked" ? "ready" : "pending"} />
                  <span className="flex-1">
                    <span className="font-medium text-foreground">{a.label}</span>
                    <span className="text-muted-foreground"> — {a.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-[13px] font-semibold tracking-tight">Trainee checklist</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Per-trainee launch checklist drawn from progress, shadowing, and check-ins.
            </p>
            <ul className="mt-3 space-y-1.5">
              {rows.length === 0 && (
                <li className="text-[12px] text-muted-foreground">
                  No trainees yet.
                </li>
              )}
              {rows.map((r) => {
                const complete = r.checklist.filter((c) => c.status === "complete").length;
                return (
                  <li
                    key={r.enrollment.id}
                    className="flex items-center justify-between text-[12.5px]"
                  >
                    <span className="font-medium">{r.traineeName}</span>
                    <span className="text-muted-foreground">
                      {complete} / {r.checklist.length} ready
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Section>

      {/* Resource / SOP Gaps */}
      <Section
        title="Resource / SOP Gaps"
        subtitle="SOP modules waiting on a Resource Library link."
        icon={Library}
      >
        {pendingSops.length === 0 && pendingWelcome.length === 0 ? (
          <EmptyState message="No pending SOP or resource links." />
        ) : (
          <div className="space-y-2">
            {pendingSops.map((sop) => (
              <CalmRow
                key={sop.key}
                label={sop.label}
                detail={sop.note}
                tone="pending"
              />
            ))}
            {pendingWelcome.map((a) => (
              <CalmRow
                key={a.key}
                label={a.label}
                detail={a.note}
                tone={a.status === "needs_admin" ? "missing" : "pending"}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Paths & Journeys */}
      <Section
        title="Paths & Journeys"
        subtitle="Role-based journeys configured in the academy."
        icon={Compass}
      >
        <div className="grid gap-2 md:grid-cols-2">
          {journeys.map((j) => (
            <div
              key={j.id}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium">{j.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {j.moduleIds.length} modules
                </p>
              </div>
              <Link
                to={`/training/manage?journey=${j.id}`}
                className="inline-flex shrink-0 items-center gap-1 text-[12px] text-primary hover:underline"
              >
                Open <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Admin Actions */}
      <Section
        title="Admin Actions"
        subtitle="Common next steps for managers and mentors."
        icon={ClipboardList}
      >
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            to="/training/academy/leadership"
            title="Open Leadership Dashboard"
            detail="Per-trainee readiness, checklist, and risk signals."
          />
          <ActionCard
            to="/training/academy/editor"
            title="Edit Academy curriculum"
            detail="Adjust phases, weeks, and modules."
          />
          <ActionCard
            to="/training/manage"
            title="Open Journey Editor"
            detail="Add, reorder, or remove modules in any journey."
          />
          <ActionCard
            to="/training/academy"
            title="Preview learner Academy"
            detail="See the experience a trainee gets."
          />
          <ActionCard
            to="/resource-library"
            title="Open Resource Library"
            detail="Link SOPs and resources to pending modules."
          />
          <ActionCardButton
            onClick={() => setAssignOpen(true)}
            title="Assign training"
            detail="Enroll an employee into a journey — opens the Assign Training modal."
            testId="assign-training-action"
          />
        </div>
      </Section>
      <AssignTrainingModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        welcomeAssets={welcomeAssets}
        pendingSops={pendingSops}
      />
    </div>
  );
}

/* ---------------- atoms ---------------- */

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="space-y-3">
      <header className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          <p className="text-[12px] text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: number | string;
  tone?: "emerald" | "rose" | "amber";
}) {
  const toneCls =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "rose"
        ? "text-rose-600 dark:text-rose-400"
        : tone === "amber"
          ? "text-amber-600 dark:text-amber-400"
          : "text-primary";
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={cn("h-3.5 w-3.5", toneCls)} />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function ReadinessChip({ pct }: { pct: number }) {
  const tone =
    pct >= 70
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      : pct >= 50
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
        : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums",
        tone,
      )}
    >
      {pct}% ready
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const tone =
    status === "ready" || status === "linked"
      ? "bg-emerald-500"
      : status === "missing" || status === "needs_admin"
        ? "bg-rose-500"
        : "bg-amber-500";
  return <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", tone)} />;
}

function CalmRow({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: "ready" | "pending" | "missing";
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-card px-3 py-2">
      <StatusDot status={tone} />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium">{label}</p>
        <p className="text-[11.5px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
      <p className="text-[13px] font-medium">{message}</p>
      {hint && <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ActionCard({ to, title, detail }: { to: string; title: string; detail: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] font-semibold tracking-tight">{title}</p>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">{detail}</p>
    </Link>
  );
}

function ActionCardButton({
  onClick,
  title,
  detail,
  testId,
}: {
  onClick: () => void;
  title: string;
  detail: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="group flex w-full flex-col rounded-2xl border border-border/70 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] font-semibold tracking-tight">{title}</p>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">{detail}</p>
    </button>
  );
}