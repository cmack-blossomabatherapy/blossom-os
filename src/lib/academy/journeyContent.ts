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

export type AcademyModuleSource = "academyData" | "rbt" | "bcba";

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
    case "intake":               return byDept("intake");
    case "qa":                   return byDept("qa");
    case "case-manager":         return byDept("case_management");
    case "scheduling":           return byDept("scheduling");
    case "recruiting":           return byDept("recruiting");
    case "hr":                   return byDept("hr");
    case "authorizations":       return byDept("authorizations");
    case "credentialing":        return byDept("credentialing");
    case "staffing":             return byDept("staffing");
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
    if (id.startsWith("rbt::") || id.startsWith("bcba::")) {
      return `/academy/path/${slug}/module/${encodeURIComponent(id)}`;
    }
    return `/training/${id}`;
  };
}

/** Unified per-module status: runtime store for rbt/bcba, academyData for everything else. */
function unifiedStatus(id: string): "completed" | "in_progress" | "overdue" | "not_started" {
  if (id.startsWith("rbt::") || id.startsWith("bcba::")) {
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

/* ------------------- Shared assembler ------------------- */

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
  return { kind: "academyData", sourceModuleId: id };
}