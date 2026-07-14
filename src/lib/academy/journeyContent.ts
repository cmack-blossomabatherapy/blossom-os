/**
 * Journey content adapter — turns the existing academyData training catalog
 * into a structured Journey → Phase → Week → Day → Module shape that the new
 * /academy/path/:slug LMS pages can render without changing any underlying
 * curriculum data.
 *
 * This is intentionally NOT a new persisted model. It is a read adapter so
 * the learner UI stops feeling like a stub while State Director, RBT, and
 * BCBA content stay sourced from their existing files.
 */
import {
  getTrainings, getProgress, type Training, type TrainingProgress, type TrainingType,
} from "@/lib/training/academyData";
import { getTrainingPath, type TrainingPath } from "@/lib/academy/trainingPaths";
import { RBT_PATHS, type RBTPathId, type RBTModule, type ModuleType as RbtModuleType } from "@/lib/training/rbtAcademy";
import { BCBA_MODULES, type BCBAModule } from "@/lib/training/bcbaAcademy";
import { getRuntimeStatus } from "@/lib/academy/runtimeStore";
import { INTAKE_DAYS, INTAKE_WEEKS, type IntakeDayModule } from "@/lib/training/intakeAcademy";
import { RECRUITING_DAYS, RECRUITING_WEEKS, type RecruitingDayModule } from "@/lib/training/recruitingAcademy";
import { AUTHORIZATIONS_DAYS, AUTHORIZATIONS_WEEKS, type AuthorizationsDayModule } from "@/lib/training/authorizationsAcademy";
import { SCHEDULING_DAYS, SCHEDULING_WEEKS, type SchedulingDayModule } from "@/lib/training/schedulingAcademy";
import { STAFFING_DAYS, STAFFING_WEEKS, type StaffingDayModule } from "@/lib/training/staffingAcademy";
import { HR_DAYS, HR_WEEKS, type HrDayModule } from "@/lib/training/hrAcademy";
import { CREDENTIALING_DAYS, CREDENTIALING_WEEKS, type CredentialingDayModule } from "@/lib/training/credentialingAcademy";
import { QA_DAYS, QA_WEEKS, type QaDayModule } from "@/lib/training/qaAcademy";
import { CASE_MANAGER_DAYS, CASE_MANAGER_WEEKS, type CaseManagerDayModule } from "@/lib/training/caseManagerAcademy";

export type AcademyModuleSource = "academyData" | "rbt" | "bcba" | "intake" | "recruiting" | "authorizations" | "scheduling" | "staffing" | "hr" | "credentialing" | "qa" | "case-manager";

/** Training-shaped record that carries the original source for routing & resource lookup. */
export type AcademyJourneyModule = Training & {
  /** Origin curriculum. Set to "academyData" for academy/department modules. */
  sourceKind?: AcademyModuleSource;
  /** Original module id inside the source curriculum (e.g. "nc-c1", "m1"). */
  sourceModuleId?: string;
  /** For RBT only: the originating track id. */
  sourceTrackId?: RBTPathId;
};

export interface JourneyDay {
  id: string;            // path-slug:w{week}:d{day}
  weekNumber: number;
  dayNumber: number;
  dayInJourney: number;  // 1-based across the whole journey
  title: string;
  objective: string;
  modules: AcademyJourneyModule[];
  estimatedMinutes: number;
  requiredCount: number;
  completedCount: number;
  inProgressCount: number;
}

export interface JourneyWeek {
  weekNumber: number;
  title: string;
  days: JourneyDay[];
  estimatedMinutes: number;
  completedCount: number;
  moduleCount: number;
}

export interface PathJourney {
  path: TrainingPath;
  /** True when this slug has a real curriculum mapped, false when nothing was found. */
  hasContent: boolean;
  /** Live route to open the runtime for a given module id. */
  runtimeRouteFor: (moduleId: string) => string;
  weeks: JourneyWeek[];
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  estimatedMinutes: number;
  nextModule?: AcademyJourneyModule;
  nextDay?: JourneyDay;
  currentWeek?: JourneyWeek;
  /** Source curriculum this journey is built from. */
  source: AcademyModuleSource;
  /** Optional RBT track tabs (only set for slug "rbt"). */
  rbtTracks?: { id: RBTPathId; label: string }[];
  /** Active RBT track id for this build. */
  rbtActiveTrackId?: RBTPathId;
}

/** How many modules group into a "day" inside the academy-data timeline. */
const MODULES_PER_DAY = 4;
/** How many days group into a "week" in the timeline. */
const DAYS_PER_WEEK = 5;

/**
 * Map every academy training-path slug to a strategy for sourcing its
 * underlying Training[] from academyData. Slugs not listed here render
 * the honest "curriculum coming online" state.
 */
function sourceTrainingsForSlug(slug: string, all: Training[]): Training[] {
  const byDept = (...names: string[]) =>
    all.filter(
      (t) =>
        (t.department ?? "").toLowerCase() &&
        names.includes((t.department ?? "").toLowerCase()),
    );

  switch (slug) {
    case "intake":               return []; // sourced from intakeAcademy.ts
    case "recruiting":           return []; // sourced from recruitingAcademy.ts
    case "authorizations":       return []; // sourced from authorizationsAcademy.ts
    case "scheduling":           return []; // sourced from schedulingAcademy.ts
    case "staffing":             return []; // sourced from staffingAcademy.ts
    case "qa":                   return []; // sourced from qaAcademy.ts
    case "case-manager":         return []; // sourced from caseManagerAcademy.ts
    case "hr":                   return []; // sourced from hrAcademy.ts
    case "credentialing":        return []; // sourced from credentialingAcademy.ts
    case "marketing":            return byDept("marketing");
    case "business-development": return byDept("business_development");
    case "clinical-director":   return byDept("clinical_director");
    case "behavioral-support":   return byDept("behavioral_support");
    case "state-director":       return byDept("state_director", "state_operations", "leadership_state");
    case "finance":              return byDept("finance", "billing", "payroll", "rcm");
    case "operations":           return byDept("operations");
    case "executive":            return byDept("executive");
    case "systems":              return byDept("systems", "admin");
    case "clinic-operations":    return byDept("clinic", "clinic_operations", "office");
    case "blossom-os-basics":    return all.filter((t) => t.category === "systems");
    default:                     return [];
  }
}

/** Build the live runtime route for a module id, source-aware. */
function runtimeRouteForSlug(slug: string): (moduleId: string) => string {
  return (id: string) => {
    if (id.startsWith("rbt::") || id.startsWith("bcba::") || id.startsWith("intake::") || id.startsWith("recruiting::") || id.startsWith("authorizations::") || id.startsWith("scheduling::") || id.startsWith("staffing::") || id.startsWith("hr::") || id.startsWith("credentialing::") || id.startsWith("qa::") || id.startsWith("case-manager::")) {
      return `/academy/path/${slug}/module/${encodeURIComponent(id)}`;
    }
    return `/training/${id}`;
  };
}

/** Unified per-module status: runtime store for rbt/bcba, academyData for everything else. */
function unifiedStatus(id: string): "completed" | "in_progress" | "overdue" | "not_started" {
  if (id.startsWith("rbt::") || id.startsWith("bcba::") || id.startsWith("intake::") || id.startsWith("recruiting::") || id.startsWith("authorizations::") || id.startsWith("scheduling::") || id.startsWith("staffing::") || id.startsWith("hr::") || id.startsWith("credentialing::") || id.startsWith("qa::") || id.startsWith("case-manager::")) {
    const s = getRuntimeStatus(id);
    return s === "completed" ? "completed" : s === "in_progress" ? "in_progress" : "not_started";
  }
  return getProgress(id).status;
}

/** Group an array into chunks of `size`. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function dayObjective(modules: AcademyJourneyModule[], weekNumber: number, dayNumber: number): string {
  const required = modules.filter((m) => m.required).length;
  const types = Array.from(new Set(modules.map((m) => m.type))).slice(0, 3).join(" · ");
  return `Week ${weekNumber} · Day ${dayNumber} focuses on ${modules.length} ${
    modules.length === 1 ? "module" : "modules"
  }${required ? ` (${required} required)` : ""}${types ? ` — ${types}` : ""}.`;
}

function dayTitle(modules: AcademyJourneyModule[]): string {
  return modules[0]?.title ?? "Operational learning";
}

/* ------------------- RBT source adapter ------------------- */

function mapRbtType(t: RbtModuleType): TrainingType {
  switch (t) {
    case "SOP": return "SOP";
    case "Video": return "Video";
    case "Walkthrough": return "Workflow";
    case "Checklist": return "Checklist";
    case "Shadowing": return "Shadowing";
    case "Assessment": return "Quiz";
    case "Role Play": return "Workflow";
    case "Evaluation": return "Workflow";
    case "Signoff": return "Checklist";
    case "Overview":
    default: return "Training";
  }
}

function synthesizeRbtModule(m: RBTModule, trackId: RBTPathId): AcademyJourneyModule {
  return {
    id: `rbt::${m.id}`,
    title: m.title,
    description: m.summary,
    type: mapRbtType(m.type),
    estimatedMinutes: m.minutes,
    required: !!m.required,
    category: "role",
    department: "rbt",
    sourceKind: "rbt",
    sourceModuleId: m.id,
    sourceTrackId: trackId,
    resources: [],
  };
}

function buildRbtJourney(slug: string, path: TrainingPath, trackId: RBTPathId): PathJourney {
  const track = RBT_PATHS.find((p) => p.id === trackId) ?? RBT_PATHS[0];
  // Each phase = one day. Group DAYS_PER_WEEK phases per week.
  const dayGroups: AcademyJourneyModule[][] = track.phases.map((phase) =>
    phase.modules.map((m) => synthesizeRbtModule(m, track.id)),
  );
  const phaseTitles = track.phases.map((p) => p.title);
  const weekGroups = chunk(dayGroups, DAYS_PER_WEEK);
  return assembleJourney({
    slug, path, weekGroups, dayTitles: phaseTitles,
    source: "rbt",
    rbtTracks: RBT_PATHS.map((p) => ({ id: p.id, label: p.label })),
    rbtActiveTrackId: track.id,
  });
}

/* ------------------- BCBA source adapter ------------------- */

function synthesizeBcbaModule(m: BCBAModule): AcademyJourneyModule {
  const minutes = m.lessons.reduce((s, l) => s + l.minutes, 0);
  return {
    id: `bcba::${m.id}`,
    title: m.title,
    description: m.subtitle,
    type: "Training",
    estimatedMinutes: minutes,
    required: true,
    category: "role",
    department: "bcba",
    sourceKind: "bcba",
    sourceModuleId: m.id,
    resources: [],
  };
}

function buildBcbaJourney(slug: string, path: TrainingPath): PathJourney {
  // One module per "day". 4 days per week.
  const dayGroups: AcademyJourneyModule[][] = BCBA_MODULES.map((m) => [synthesizeBcbaModule(m)]);
  const dayTitles = BCBA_MODULES.map((m) => m.title);
  const weekGroups = chunk(dayGroups, 4);
  return assembleJourney({
    slug, path, weekGroups, dayTitles, source: "bcba",
  });
}

/* ------------------- Intake source adapter ------------------- */

function synthesizeIntakeModule(d: IntakeDayModule): AcademyJourneyModule {
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  return {
    id: `intake::${d.id}`,
    title: d.title,
    description: d.description,
    type: "Workflow",
    estimatedMinutes: minutes,
    required: true,
    category: "role",
    department: "intake",
    sourceKind: "intake",
    sourceModuleId: d.id,
    resources: [],
  };
}

function buildIntakeJourney(slug: string, path: TrainingPath): PathJourney {
  // 1 runtime module per day, grouped into 4 weeks × 5 days.
  const dayGroups: AcademyJourneyModule[][] = INTAKE_DAYS.map((d) => [synthesizeIntakeModule(d)]);
  const weekGroups = chunk(dayGroups, 5);
  // Day titles = the actual day titles; week titles handled by assembler default.
  const dayTitles = INTAKE_DAYS.map((d) => `Day ${d.dayInJourney} · ${d.title}`);
  const journey = assembleJourney({
    slug, path, weekGroups, dayTitles, source: "intake",
  });
  // Overlay branded week titles from the curriculum spec.
  journey.weeks = journey.weeks.map((w) => ({
    ...w,
    title: INTAKE_WEEKS.find((iw) => iw.weekNumber === w.weekNumber)?.title ?? w.title,
  }));
  return journey;
}

/* ------------------- Recruiting source adapter ------------------- */

function synthesizeRecruitingModule(d: RecruitingDayModule): AcademyJourneyModule {
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  return {
    id: `recruiting::${d.id}`,
    title: d.title,
    description: d.description,
    type: "Workflow",
    estimatedMinutes: minutes,
    required: true,
    category: "role",
    department: "recruiting",
    sourceKind: "recruiting",
    sourceModuleId: d.id,
    resources: [],
  };
}

function buildRecruitingJourney(slug: string, path: TrainingPath): PathJourney {
  const dayGroups: AcademyJourneyModule[][] = RECRUITING_DAYS.map((d) => [synthesizeRecruitingModule(d)]);
  const weekGroups = chunk(dayGroups, 5);
  const dayTitles = RECRUITING_DAYS.map((d) => `Day ${d.dayInJourney} · ${d.title}`);
  const journey = assembleJourney({
    slug, path, weekGroups, dayTitles, source: "recruiting",
  });
  journey.weeks = journey.weeks.map((w) => ({
    ...w,
    title: RECRUITING_WEEKS.find((rw) => rw.weekNumber === w.weekNumber)?.title ?? w.title,
  }));
  return journey;
}

/* ------------------- Authorizations source adapter ------------------- */

function synthesizeAuthorizationsModule(d: AuthorizationsDayModule): AcademyJourneyModule {
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  return {
    id: `authorizations::${d.id}`,
    title: d.title,
    description: d.description,
    type: "Workflow",
    estimatedMinutes: minutes,
    required: true,
    category: "role",
    department: "authorizations",
    sourceKind: "authorizations",
    sourceModuleId: d.id,
    resources: [],
  };
}

function buildAuthorizationsJourney(slug: string, path: TrainingPath): PathJourney {
  const dayGroups: AcademyJourneyModule[][] = AUTHORIZATIONS_DAYS.map((d) => [synthesizeAuthorizationsModule(d)]);
  const weekGroups = chunk(dayGroups, 5);
  const dayTitles = AUTHORIZATIONS_DAYS.map((d) => `Day ${d.dayInJourney} · ${d.title}`);
  const journey = assembleJourney({
    slug, path, weekGroups, dayTitles, source: "authorizations",
  });
  journey.weeks = journey.weeks.map((w) => ({
    ...w,
    title: AUTHORIZATIONS_WEEKS.find((aw) => aw.weekNumber === w.weekNumber)?.title ?? w.title,
  }));
  return journey;
}

/* ------------------- Shared assembler ------------------- */

/* ------------------- Scheduling source adapter ------------------- */

function synthesizeSchedulingModule(d: SchedulingDayModule): AcademyJourneyModule {
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  return {
    id: `scheduling::${d.id}`,
    title: d.title,
    description: d.description,
    type: "Workflow",
    estimatedMinutes: minutes,
    required: true,
    category: "role",
    department: "scheduling",
    sourceKind: "scheduling",
    sourceModuleId: d.id,
    resources: [],
  };
}

function buildSchedulingJourney(slug: string, path: TrainingPath): PathJourney {
  const dayGroups: AcademyJourneyModule[][] = SCHEDULING_DAYS.map((d) => [synthesizeSchedulingModule(d)]);
  const weekGroups = chunk(dayGroups, 5);
  const dayTitles = SCHEDULING_DAYS.map((d) => `Day ${d.dayInJourney} · ${d.title}`);
  const journey = assembleJourney({
    slug, path, weekGroups, dayTitles, source: "scheduling",
  });
  journey.weeks = journey.weeks.map((w) => ({
    ...w,
    title: SCHEDULING_WEEKS.find((sw) => sw.weekNumber === w.weekNumber)?.title ?? w.title,
  }));
  return journey;
}

/* ------------------- Staffing source adapter ------------------- */

function synthesizeStaffingModule(d: StaffingDayModule): AcademyJourneyModule {
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  return {
    id: `staffing::${d.id}`,
    title: d.title,
    description: d.description,
    type: "Workflow",
    estimatedMinutes: minutes,
    required: true,
    category: "role",
    department: "staffing",
    sourceKind: "staffing",
    sourceModuleId: d.id,
    resources: [],
  };
}

function buildStaffingJourney(slug: string, path: TrainingPath): PathJourney {
  const dayGroups: AcademyJourneyModule[][] = STAFFING_DAYS.map((d) => [synthesizeStaffingModule(d)]);
  const weekGroups = chunk(dayGroups, 5);
  const dayTitles = STAFFING_DAYS.map((d) => `Day ${d.dayInJourney} · ${d.title}`);
  const journey = assembleJourney({
    slug, path, weekGroups, dayTitles, source: "staffing",
  });
  journey.weeks = journey.weeks.map((w) => ({
    ...w,
    title: STAFFING_WEEKS.find((sw) => sw.weekNumber === w.weekNumber)?.title ?? w.title,
  }));
  return journey;
}

/* ------------------- HR source adapter ------------------- */

function synthesizeHrModule(d: HrDayModule): AcademyJourneyModule {
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  return {
    id: `hr::${d.id}`,
    title: d.title,
    description: d.description,
    type: "Workflow",
    estimatedMinutes: minutes,
    required: true,
    category: "role",
    department: "hr",
    sourceKind: "hr",
    sourceModuleId: d.id,
    resources: [],
  };
}

function buildHrJourney(slug: string, path: TrainingPath): PathJourney {
  const dayGroups: AcademyJourneyModule[][] = HR_DAYS.map((d) => [synthesizeHrModule(d)]);
  const weekGroups = chunk(dayGroups, 5);
  const dayTitles = HR_DAYS.map((d) => `Day ${d.dayInJourney} · ${d.title}`);
  const journey = assembleJourney({
    slug, path, weekGroups, dayTitles, source: "hr",
  });
  journey.weeks = journey.weeks.map((w) => ({
    ...w,
    title: HR_WEEKS.find((hw) => hw.weekNumber === w.weekNumber)?.title ?? w.title,
  }));
  return journey;
}

/* ------------------- Credentialing source adapter ------------------- */

function synthesizeCredentialingModule(d: CredentialingDayModule): AcademyJourneyModule {
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  return {
    id: `credentialing::${d.id}`,
    title: d.title,
    description: d.description,
    type: "Workflow",
    estimatedMinutes: minutes,
    required: true,
    category: "role",
    department: "credentialing",
    sourceKind: "credentialing",
    sourceModuleId: d.id,
    resources: [],
  };
}

function buildCredentialingJourney(slug: string, path: TrainingPath): PathJourney {
  const dayGroups: AcademyJourneyModule[][] = CREDENTIALING_DAYS.map((d) => [synthesizeCredentialingModule(d)]);
  const weekGroups = chunk(dayGroups, 5);
  const dayTitles = CREDENTIALING_DAYS.map((d) => `Day ${d.dayInJourney} · ${d.title}`);
  const journey = assembleJourney({
    slug, path, weekGroups, dayTitles, source: "credentialing",
  });
  journey.weeks = journey.weeks.map((w) => ({
    ...w,
    title: CREDENTIALING_WEEKS.find((cw) => cw.weekNumber === w.weekNumber)?.title ?? w.title,
  }));
  return journey;
}

/* ------------------- QA source adapter ------------------- */

function synthesizeQaModule(d: QaDayModule): AcademyJourneyModule {
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  return {
    id: `qa::${d.id}`,
    title: d.title,
    description: d.description,
    type: "Workflow",
    estimatedMinutes: minutes,
    required: true,
    category: "role",
    department: "qa",
    sourceKind: "qa",
    sourceModuleId: d.id,
    resources: [],
  };
}

function buildQaJourney(slug: string, path: TrainingPath): PathJourney {
  const dayGroups: AcademyJourneyModule[][] = QA_DAYS.map((d) => [synthesizeQaModule(d)]);
  const weekGroups = chunk(dayGroups, 5);
  const dayTitles = QA_DAYS.map((d) => `Day ${d.dayInJourney} · ${d.title}`);
  const journey = assembleJourney({
    slug, path, weekGroups, dayTitles, source: "qa",
  });
  journey.weeks = journey.weeks.map((w) => ({
    ...w,
    title: QA_WEEKS.find((qw) => qw.weekNumber === w.weekNumber)?.title ?? w.title,
  }));
  return journey;
}

/* ------------------- Case Manager source adapter ------------------- */

function synthesizeCaseManagerModule(d: CaseManagerDayModule): AcademyJourneyModule {
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  return {
    id: `case-manager::${d.id}`,
    title: d.title,
    description: d.description,
    type: "Workflow",
    estimatedMinutes: minutes,
    required: true,
    category: "role",
    department: "case_management",
    sourceKind: "case-manager",
    sourceModuleId: d.id,
    resources: [],
  };
}

function buildCaseManagerJourney(slug: string, path: TrainingPath): PathJourney {
  const dayGroups: AcademyJourneyModule[][] = CASE_MANAGER_DAYS.map((d) => [synthesizeCaseManagerModule(d)]);
  const weekGroups = chunk(dayGroups, 5);
  const dayTitles = CASE_MANAGER_DAYS.map((d) => `Day ${d.dayInJourney} · ${d.title}`);
  const journey = assembleJourney({
    slug, path, weekGroups, dayTitles, source: "case-manager",
  });
  journey.weeks = journey.weeks.map((w) => ({
    ...w,
    title: CASE_MANAGER_WEEKS.find((cw) => cw.weekNumber === w.weekNumber)?.title ?? w.title,
  }));
  return journey;
}

function assembleJourney(opts: {
  slug: string;
  path: TrainingPath;
  weekGroups: AcademyJourneyModule[][][];
  dayTitles: string[];
  source: AcademyModuleSource;
  rbtTracks?: { id: RBTPathId; label: string }[];
  rbtActiveTrackId?: RBTPathId;
}): PathJourney {
  const { slug, path, weekGroups, dayTitles, source } = opts;

  let runningDay = 0;
  let totalModules = 0;
  let totalCompleted = 0;
  let totalInProgress = 0;
  let totalMinutes = 0;
  let nextModule: AcademyJourneyModule | undefined;
  let nextDay: JourneyDay | undefined;
  let currentWeek: JourneyWeek | undefined;

  const weeks: JourneyWeek[] = weekGroups.map((daysInWeek, wi) => {
    const weekNumber = wi + 1;
    let weekMinutes = 0;
    let weekCompleted = 0;
    let weekModules = 0;

    const days: JourneyDay[] = daysInWeek.map((mods, di) => {
      runningDay += 1;
      const dayNumber = di + 1;
      const minutes = mods.reduce((s, m) => s + (m.estimatedMinutes || 0), 0);
      let completedCount = 0;
      let inProgressCount = 0;
      for (const m of mods) {
        const st = unifiedStatus(m.id);
        if (st === "completed") completedCount += 1;
        else if (st === "in_progress" || st === "overdue") inProgressCount += 1;
        if (!nextModule && st !== "completed") nextModule = m;
      }
      totalCompleted += completedCount;
      totalInProgress += inProgressCount;
      totalMinutes += minutes;
      totalModules += mods.length;
      weekMinutes += minutes;
      weekCompleted += completedCount;
      weekModules += mods.length;

      const titleIdx = (wi * 1000) + di; // unused — keep separate dayTitles list
      const title = dayTitles[runningDay - 1] ?? dayTitle(mods);

      const day: JourneyDay = {
        id: `${slug}:w${weekNumber}:d${dayNumber}`,
        weekNumber,
        dayNumber,
        dayInJourney: runningDay,
        title,
        objective: dayObjective(mods, weekNumber, dayNumber),
        modules: mods,
        estimatedMinutes: minutes,
        requiredCount: mods.filter((m) => m.required).length,
        completedCount,
        inProgressCount,
      };
      if (!nextDay && completedCount < mods.length) nextDay = day;
      void titleIdx;
      return day;
    });

    const week: JourneyWeek = {
      weekNumber,
      title: `Week ${weekNumber}`,
      days,
      estimatedMinutes: weekMinutes,
      completedCount: weekCompleted,
      moduleCount: weekModules,
    };
    if (!currentWeek && week.completedCount < week.moduleCount) currentWeek = week;
    return week;
  });

  return {
    path,
    hasContent: totalModules > 0,
    runtimeRouteFor: runtimeRouteForSlug(slug),
    weeks,
    totalModules,
    completedModules: totalCompleted,
    inProgressModules: totalInProgress,
    estimatedMinutes: totalMinutes,
    nextModule,
    nextDay,
    currentWeek: currentWeek ?? weeks[0],
    source,
    rbtTracks: opts.rbtTracks,
    rbtActiveTrackId: opts.rbtActiveTrackId,
  };
}

export function buildPathJourney(slug: string, opts?: { rbtTrackId?: RBTPathId }): PathJourney | null {
  const path = getTrainingPath(slug);
  if (!path) return null;

  if (slug === "rbt") {
    return buildRbtJourney(slug, path, opts?.rbtTrackId ?? "not_certified");
  }
  if (slug === "bcba") {
    return buildBcbaJourney(slug, path);
  }
  if (slug === "intake") {
    return buildIntakeJourney(slug, path);
  }
  if (slug === "recruiting") {
    return buildRecruitingJourney(slug, path);
  }
  if (slug === "authorizations") {
    return buildAuthorizationsJourney(slug, path);
  }
  if (slug === "scheduling") {
    return buildSchedulingJourney(slug, path);
  }
  if (slug === "staffing") {
    return buildStaffingJourney(slug, path);
  }
  if (slug === "hr") {
    return buildHrJourney(slug, path);
  }
  if (slug === "credentialing") {
    return buildCredentialingJourney(slug, path);
  }
  if (slug === "qa") {
    return buildQaJourney(slug, path);
  }
  if (slug === "case-manager") {
    return buildCaseManagerJourney(slug, path);
  }

  const all = getTrainings();
  const trainings = sourceTrainingsForSlug(slug, all);
  const academyDayGroups: AcademyJourneyModule[][] = chunk(trainings, MODULES_PER_DAY)
    .map((day) => day.map((t) => ({ ...t, sourceKind: "academyData" as const, sourceModuleId: t.id })));
  return assembleJourney({
    slug, path,
    weekGroups: chunk(academyDayGroups, DAYS_PER_WEEK),
    dayTitles: academyDayGroups.map((day) => day[0]?.title ?? "Operational learning"),
    source: "academyData",
  });
}

export function findDay(j: PathJourney, dayId: string): JourneyDay | undefined {
  for (const w of j.weeks) for (const d of w.days) if (d.id === dayId) return d;
  return undefined;
}

export function journeyProgressPct(j: PathJourney): number {
  return pct(j.completedModules, j.totalModules);
}

export function firstIncompleteModule(day: JourneyDay): AcademyJourneyModule | undefined {
  for (const m of day.modules) {
    if (unifiedStatus(m.id) !== "completed") return m;
  }
  return day.modules[0];
}

/** Display helper for module status badge colors. */
export function moduleStatus(moduleId: string): "completed" | "in_progress" | "overdue" | "not_started" {
  return unifiedStatus(moduleId);
}

/** Parse a synthesized module id like "rbt::nc-c1" → { kind, sourceModuleId }. */
export function parseAcademyModuleId(id: string): {
  kind: AcademyModuleSource;
  sourceModuleId: string;
} {
  if (id.startsWith("rbt::")) return { kind: "rbt", sourceModuleId: id.slice("rbt::".length) };
  if (id.startsWith("bcba::")) return { kind: "bcba", sourceModuleId: id.slice("bcba::".length) };
  if (id.startsWith("intake::")) return { kind: "intake", sourceModuleId: id.slice("intake::".length) };
  if (id.startsWith("recruiting::")) return { kind: "recruiting", sourceModuleId: id.slice("recruiting::".length) };
  if (id.startsWith("authorizations::")) return { kind: "authorizations", sourceModuleId: id.slice("authorizations::".length) };
  if (id.startsWith("scheduling::")) return { kind: "scheduling", sourceModuleId: id.slice("scheduling::".length) };
  if (id.startsWith("staffing::")) return { kind: "staffing", sourceModuleId: id.slice("staffing::".length) };
  if (id.startsWith("hr::")) return { kind: "hr", sourceModuleId: id.slice("hr::".length) };
  if (id.startsWith("credentialing::")) return { kind: "credentialing", sourceModuleId: id.slice("credentialing::".length) };
  if (id.startsWith("qa::")) return { kind: "qa", sourceModuleId: id.slice("qa::".length) };
  if (id.startsWith("case-manager::")) return { kind: "case-manager", sourceModuleId: id.slice("case-manager::".length) };
  return { kind: "academyData", sourceModuleId: id };
}