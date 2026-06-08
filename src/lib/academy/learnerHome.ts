/**
 * Shared learner Academy view-model.
 *
 * Normalizes the DB-backed academy data (academy_* tables) into a single
 * shape consumed by both the learner Training Academy (`/training`) and the
 * Training Management Center / Leadership Dashboard, so progress logged in
 * one place shows up everywhere.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  loadCurriculum, getMyEnrollment, listProgress, listShadowSessions, listCheckins,
  computeReadiness, upsertProgress, type AcademyCurriculum, type ReadinessBreakdown,
} from "./api";
import type {
  AcademyEnrollment, AcademyProgress, AcademyShadowSession, AcademyCheckin,
  AcademyModule, AcademyWeek, AcademyPath,
} from "./types";

export type LearnerSetupGap =
  | "no_employee_link"
  | "no_curriculum"
  | "no_enrollment";

export interface LearnerEmployee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  state: string | null;
}

export interface LearnerMentor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  email: string | null;
}

export interface LearnerWeek {
  id: string;
  week_number: number;
  title: string;
  objective: string | null;
  modules: AcademyModule[];
  required: AcademyModule[];
  completedRequired: number;
  pct: number;
  isCurrent: boolean;
  isComplete: boolean;
  phaseColor: string;
  phaseName: string;
}

export interface LearnerNextAction {
  module: AcademyModule;
  week: LearnerWeek;
}

export interface LaunchScopedProgress {
  /** required modules scoped to the active launch path (e.g. SD new_state) */
  requiredTotal: number;
  requiredCompleted: number;
  pct: number;
}

export interface LearnerHome {
  loading: boolean;
  setupGaps: LearnerSetupGap[];
  employee: LearnerEmployee | null;
  mentor: LearnerMentor | null;
  curriculum: AcademyCurriculum | null;
  enrollment: AcademyEnrollment | null;
  path: Exclude<AcademyPath, "either">;
  weeks: LearnerWeek[];
  currentWeek: LearnerWeek | null;
  welcomeComplete: boolean;
  welcomeModuleId: string | null;
  nextAction: LearnerNextAction | null;
  launchProgress: LaunchScopedProgress;
  readiness: ReadinessBreakdown | null;
  shadowHours: number;
  shadowSignoffs: number;
  checkinCount: number;
  rawProgress: AcademyProgress[];
  shadows: AcademyShadowSession[];
  checkins: AcademyCheckin[];
}

export const emptyLearnerHome = (gaps: LearnerSetupGap[] = []): LearnerHome => ({
  loading: false,
  setupGaps: gaps,
  employee: null,
  mentor: null,
  curriculum: null,
  enrollment: null,
  path: "new_state",
  weeks: [],
  currentWeek: null,
  welcomeComplete: false,
  welcomeModuleId: null,
  nextAction: null,
  launchProgress: { requiredTotal: 0, requiredCompleted: 0, pct: 0 },
  readiness: null,
  shadowHours: 0,
  shadowSignoffs: 0,
  checkinCount: 0,
  rawProgress: [],
  shadows: [],
  checkins: [],
});

function isWelcomeModule(m: AcademyModule): boolean {
  const t = (m.title ?? "").toLowerCase();
  return t.includes("welcome to blossom") || t === "welcome" || t.startsWith("welcome video");
}

/** Build a normalized learner home from raw academy data. Pure, easy to test. */
export function buildLearnerHome(input: {
  employee: LearnerEmployee | null;
  mentor?: LearnerMentor | null;
  curriculum: AcademyCurriculum | null;
  enrollment: AcademyEnrollment | null;
  progress: AcademyProgress[];
  shadows: AcademyShadowSession[];
  checkins: AcademyCheckin[];
}): LearnerHome {
  const { employee, curriculum, enrollment, progress, shadows, checkins } = input;
  const mentor = input.mentor ?? null;
  const gaps: LearnerSetupGap[] = [];
  if (!employee) gaps.push("no_employee_link");
  if (!curriculum) gaps.push("no_curriculum");
  if (!enrollment) gaps.push("no_enrollment");

  const path: Exclude<AcademyPath, "either"> =
    enrollment?.path === "existing_state" ? "existing_state" : "new_state";

  const completedSet = new Set(
    progress.filter((p) => p.status === "completed").map((p) => p.module_id),
  );

  const flatWeeksRaw = curriculum
    ? curriculum.phases.flatMap((p) =>
        p.weeks.map((w) => ({
          ...w,
          phaseColor: p.color_token,
          phaseName: p.name,
        })),
      )
    : [];

  // Which weeks apply to this learner's path?
  const applies = (m: AcademyModule) =>
    m.applies_to === "either" || m.applies_to === path;

  const weeks: LearnerWeek[] = flatWeeksRaw.map((w) => {
    const mods = (w as AcademyWeek & { modules: AcademyModule[] }).modules.filter(applies);
    const required = mods.filter((m) => m.is_required);
    const completedRequired = required.filter((m) => completedSet.has(m.id)).length;
    const pct = required.length === 0 ? 0 : Math.round((completedRequired / required.length) * 100);
    return {
      id: w.id,
      week_number: w.week_number,
      title: w.title,
      objective: w.objective,
      modules: mods,
      required,
      completedRequired,
      pct,
      isCurrent: false,
      isComplete: required.length > 0 && completedRequired === required.length,
      phaseColor: w.phaseColor,
      phaseName: w.phaseName,
    };
  });

  let currentWeek: LearnerWeek | null = null;
  if (enrollment?.current_week_id) {
    currentWeek = weeks.find((w) => w.id === enrollment.current_week_id) ?? null;
  }
  if (!currentWeek) currentWeek = weeks.find((w) => !w.isComplete) ?? weeks[0] ?? null;
  if (currentWeek) currentWeek.isCurrent = true;

  // Welcome
  const welcomeModule =
    weeks.flatMap((w) => w.modules).find(isWelcomeModule) ?? null;
  const welcomeModuleId = welcomeModule?.id ?? null;
  const welcomeComplete = welcomeModuleId ? completedSet.has(welcomeModuleId) : false;

  // Next action: first not-completed required module in current week, then any week
  let nextAction: LearnerNextAction | null = null;
  const findNextIn = (w: LearnerWeek) =>
    w.modules.find((m) => !completedSet.has(m.id));
  if (currentWeek) {
    const m = findNextIn(currentWeek);
    if (m) nextAction = { module: m, week: currentWeek };
  }
  if (!nextAction) {
    for (const w of weeks) {
      const m = findNextIn(w);
      if (m) { nextAction = { module: m, week: w }; break; }
    }
  }

  // Launch-scoped progress: only modules that apply to this path
  const launchModules = weeks.flatMap((w) => w.modules);
  const launchRequired = launchModules.filter((m) => m.is_required);
  const launchDone = launchRequired.filter((m) => completedSet.has(m.id)).length;
  const launchProgress: LaunchScopedProgress = {
    requiredTotal: launchRequired.length,
    requiredCompleted: launchDone,
    pct: launchRequired.length === 0
      ? 0
      : Math.round((launchDone / launchRequired.length) * 100),
  };

  // Readiness
  const shadowHours = shadows.reduce((a, s) => a + Number(s.hours || 0), 0);
  const readiness = enrollment
    ? computeReadiness({
        modules: launchModules,
        progress,
        shadowHours,
        checkins,
        path,
      })
    : null;

  return {
    loading: false,
    setupGaps: gaps,
    employee,
    mentor,
    curriculum,
    enrollment,
    path,
    weeks,
    currentWeek,
    welcomeComplete,
    welcomeModuleId,
    nextAction,
    launchProgress,
    readiness,
    shadowHours,
    shadowSignoffs: shadows.filter((s) => s.mentor_signoff).length,
    checkinCount: checkins.length,
    rawProgress: progress,
    shadows,
    checkins,
  };
}

/** Load and normalize the learner home for the currently authenticated user. */
export async function loadLearnerHome(userId: string | null | undefined): Promise<LearnerHome> {
  if (!userId) return emptyLearnerHome(["no_employee_link"]);
  const curriculum = await loadCurriculum();
  const { data: emp } = await (supabase
    .from("employees")
    .select("id, first_name, last_name, job_title, state, mentor_id") as any)
    .eq("user_id", userId)
    .maybeSingle();
  const employeeRow = emp as (LearnerEmployee & { mentor_id?: string | null }) | null;
  const employee: LearnerEmployee | null = employeeRow
    ? { id: employeeRow.id, first_name: employeeRow.first_name, last_name: employeeRow.last_name, job_title: employeeRow.job_title, state: employeeRow.state }
    : null;
  if (!employee) return emptyLearnerHome(curriculum ? ["no_employee_link"] : ["no_employee_link", "no_curriculum"]);
  let mentor: LearnerMentor | null = null;
  if (employeeRow?.mentor_id) {
    const { data: mentorRow } = await supabase
      .from("employees")
      .select("id, first_name, last_name, job_title, email")
      .eq("id", employeeRow.mentor_id)
      .maybeSingle();
    if (mentorRow) mentor = mentorRow as LearnerMentor;
  }
  const enrollment = await getMyEnrollment(employee.id);
  if (!enrollment) {
    return buildLearnerHome({
      employee, mentor, curriculum, enrollment: null,
      progress: [], shadows: [], checkins: [],
    });
  }
  const [progress, shadows, checkins] = await Promise.all([
    listProgress(enrollment.id),
    listShadowSessions(enrollment.id),
    listCheckins(enrollment.id),
  ]);
  return buildLearnerHome({ employee, mentor, curriculum, enrollment, progress, shadows, checkins });
}

/** Mark a module as started; visible immediately in Training Management. */
export async function startLearnerModule(enrollmentId: string, moduleId: string) {
  return upsertProgress(enrollmentId, moduleId, {
    status: "in_progress",
    started_at: new Date().toISOString(),
  });
}

/** Mark a module as completed; visible immediately in Training Management. */
export async function completeLearnerModule(enrollmentId: string, moduleId: string) {
  const now = new Date().toISOString();
  return upsertProgress(enrollmentId, moduleId, {
    status: "completed",
    started_at: now,
    completed_at: now,
  });
}
