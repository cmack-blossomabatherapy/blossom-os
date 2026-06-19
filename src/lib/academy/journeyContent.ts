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
  getTrainings, getProgress, type Training, type TrainingProgress,
} from "@/lib/training/academyData";
import { getTrainingPath, type TrainingPath } from "@/lib/academy/trainingPaths";

export interface JourneyDay {
  id: string;            // path-slug:w{week}:d{day}
  weekNumber: number;
  dayNumber: number;
  dayInJourney: number;  // 1-based across the whole journey
  title: string;
  objective: string;
  modules: Training[];
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
  nextModule?: Training;
  nextDay?: JourneyDay;
  currentWeek?: JourneyWeek;
}

/** How many modules group into a "day" inside the day-based timeline. */
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
    case "bcba":                 return byDept("bcba");
    case "clinical-director":   return byDept("clinical_director");
    case "behavioral-support":   return byDept("behavioral_support");
    case "blossom-os-basics":    return all.filter((t) => t.category === "systems");
    default:                     return [];
  }
}

/** Live runtime route per slug. RBT and BCBA use their existing role academy
 *  surfaces; everything else opens /training/:id. */
function runtimeRouteForSlug(slug: string): (moduleId: string) => string {
  return (id: string) => `/training/${id}`;
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

function dayObjective(modules: Training[], weekNumber: number, dayNumber: number): string {
  const required = modules.filter((m) => m.required).length;
  const types = Array.from(new Set(modules.map((m) => m.type))).slice(0, 3).join(" · ");
  return `Week ${weekNumber} · Day ${dayNumber} focuses on ${modules.length} ${
    modules.length === 1 ? "module" : "modules"
  }${required ? ` (${required} required)` : ""}${types ? ` — ${types}` : ""}.`;
}

function dayTitle(modules: Training[]): string {
  return modules[0]?.title ?? "Operational learning";
}

export function buildPathJourney(slug: string): PathJourney | null {
  const path = getTrainingPath(slug);
  if (!path) return null;

  const all = getTrainings();
  const trainings = sourceTrainingsForSlug(slug, all);

  const dayGroups = chunk(trainings, MODULES_PER_DAY);
  const weekGroups = chunk(dayGroups, DAYS_PER_WEEK);

  let runningDay = 0;
  let totalCompleted = 0;
  let totalInProgress = 0;
  let totalMinutes = 0;
  let nextModule: Training | undefined;
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
        const p = getProgress(m.id);
        if (p.status === "completed") completedCount += 1;
        else if (p.status === "in_progress" || p.status === "overdue") inProgressCount += 1;
        if (!nextModule && p.status !== "completed") {
          nextModule = m;
        }
      }
      totalCompleted += completedCount;
      totalInProgress += inProgressCount;
      totalMinutes += minutes;
      weekMinutes += minutes;
      weekCompleted += completedCount;
      weekModules += mods.length;

      const day: JourneyDay = {
        id: `${slug}:w${weekNumber}:d${dayNumber}`,
        weekNumber,
        dayNumber,
        dayInJourney: runningDay,
        title: dayTitle(mods),
        objective: dayObjective(mods, weekNumber, dayNumber),
        modules: mods,
        estimatedMinutes: minutes,
        requiredCount: mods.filter((m) => m.required).length,
        completedCount,
        inProgressCount,
      };
      if (!nextDay && completedCount < mods.length) {
        nextDay = day;
      }
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
    hasContent: trainings.length > 0,
    runtimeRouteFor: runtimeRouteForSlug(slug),
    weeks,
    totalModules: trainings.length,
    completedModules: totalCompleted,
    inProgressModules: totalInProgress,
    estimatedMinutes: totalMinutes,
    nextModule,
    nextDay,
    currentWeek: currentWeek ?? weeks[0],
  };
}

export function findDay(j: PathJourney, dayId: string): JourneyDay | undefined {
  for (const w of j.weeks) for (const d of w.days) if (d.id === dayId) return d;
  return undefined;
}

export function journeyProgressPct(j: PathJourney): number {
  return pct(j.completedModules, j.totalModules);
}

export function firstIncompleteModule(day: JourneyDay): Training | undefined {
  for (const m of day.modules) {
    const p: TrainingProgress = getProgress(m.id);
    if (p.status !== "completed") return m;
  }
  return day.modules[0];
}

/** Display helper for module status badge colors. */
export function moduleStatus(moduleId: string): "completed" | "in_progress" | "overdue" | "not_started" {
  return getProgress(moduleId).status;
}