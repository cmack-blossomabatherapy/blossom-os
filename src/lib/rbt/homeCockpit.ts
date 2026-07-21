/**
 * Slice 4B — Pure derivation logic for the RBT Home cockpit.
 *
 * Given a program pathway + step rows (real Supabase-backed OR lab-projected),
 * returns a deterministic "next best action" descriptor and the ordered
 * milestone timeline entries the cockpit renders. Pure so we can unit-test
 * every Experience Lab combination and every real journey shape without
 * touching React or Supabase.
 */
import type { StepRow, PathwayStepStatus } from "@/pages/rbt/app/training/types";

export type CockpitStageKey =
  | "kickoff"
  | "in_flight"
  | "final_stretch"
  | "needs_support"
  | "complete"
  | "awaiting_setup";

export interface CockpitNextAction {
  /** Short eyebrow shown above the CTA copy. */
  eyebrow: string;
  /** Bold action headline. */
  title: string;
  /** Supporting sentence, always employee-facing (no ops/integration language). */
  body: string;
  /** Router path the primary CTA navigates to. Always a real /rbt/app route. */
  to: string;
  /** Label rendered on the primary CTA button. */
  ctaLabel: string;
  /** Stage key used for the header pill + analytics. */
  stage: CockpitStageKey;
}

export interface CockpitTimelineItem {
  id: string;
  index: number;
  title: string;
  status: PathwayStepStatus;
  /** True when this row is the current focus step. */
  isCurrent: boolean;
  /** Path the pill navigates to (always /rbt/app/program for now). */
  to: string;
}

export interface CockpitStats {
  total: number;
  complete: number;
  percent: number;
  currentIndex: number | null;
}

export interface DerivedCockpit {
  stats: CockpitStats;
  nextAction: CockpitNextAction;
  timeline: CockpitTimelineItem[];
}

const PROGRAM_ROUTE = "/rbt/app/program";
const WELCOME_ROUTE = "/rbt/app/welcome";
const SUPPORT_ROUTE = "/rbt/app/support";

function findCurrent(rows: StepRow[]): { row: StepRow; index: number } | null {
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.progress.status !== "complete") return { row: r, index: i };
  }
  return null;
}

function findBlocked(rows: StepRow[]): { row: StepRow; index: number } | null {
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.progress.status === "blocked" || r.progress.status === "needs_support") {
      return { row: r, index: i };
    }
  }
  return null;
}

export function deriveCockpit(
  pathwayName: string | null,
  rows: StepRow[] | null | undefined,
): DerivedCockpit {
  const safeRows = rows ?? [];
  const total = safeRows.length;
  const complete = safeRows.filter((r) => r.progress.status === "complete").length;
  const percent = total ? Math.round((complete / total) * 100) : 0;
  const current = findCurrent(safeRows);
  const blocked = findBlocked(safeRows);

  const timeline: CockpitTimelineItem[] = safeRows.map((r, i) => ({
    id: r.step.id,
    index: i,
    title: r.step.title,
    status: r.progress.status,
    isCurrent: current?.index === i,
    to: PROGRAM_ROUTE,
  }));

  const stats: CockpitStats = {
    total,
    complete,
    percent,
    currentIndex: current?.index ?? null,
  };

  // No pathway assigned yet — friendly setup nudge.
  if (!pathwayName || total === 0) {
    return {
      stats,
      timeline,
      nextAction: {
        eyebrow: "Getting you set up",
        title: "Start with Welcome to Blossom",
        body:
          "Your personalized training path is being prepared. Meet the team and get comfortable with your new home in the meantime.",
        to: WELCOME_ROUTE,
        ctaLabel: "Open Welcome",
        stage: "awaiting_setup",
      },
    };
  }

  // A blocked / needs-support step outweighs everything else.
  if (blocked) {
    return {
      stats,
      timeline,
      nextAction: {
        eyebrow: "We've got your back",
        title: `Get support on "${blocked.row.step.title}"`,
        body:
          "You flagged this step for extra help. Message your team and we'll pair you with the right person quickly.",
        to: SUPPORT_ROUTE,
        ctaLabel: "Open Support",
        stage: "needs_support",
      },
    };
  }

  // All complete.
  if (!current) {
    return {
      stats,
      timeline,
      nextAction: {
        eyebrow: "You did it",
        title: `${pathwayName} is complete`,
        body:
          "Every training milestone is checked off. Keep momentum by exploring growth opportunities or the BCBA Fellowship path.",
        to: "/rbt/app/growth",
        ctaLabel: "Explore Growth",
        stage: "complete",
      },
    };
  }

  // Early — just starting.
  if (percent < 15) {
    return {
      stats,
      timeline,
      nextAction: {
        eyebrow: "You're just getting started",
        title: `Begin "${current.row.step.title}"`,
        body:
          "This is your first milestone. Take it one step at a time — we'll guide you through what to do next.",
        to: PROGRAM_ROUTE,
        ctaLabel: "Start Milestone",
        stage: "kickoff",
      },
    };
  }

  // Final stretch.
  if (percent >= 80) {
    return {
      stats,
      timeline,
      nextAction: {
        eyebrow: "Final stretch",
        title: `Finish "${current.row.step.title}"`,
        body:
          "You're almost there. One more focused push and you'll wrap up your training path.",
        to: PROGRAM_ROUTE,
        ctaLabel: "Continue Milestone",
        stage: "final_stretch",
      },
    };
  }

  // In flight.
  return {
    stats,
    timeline,
    nextAction: {
      eyebrow: "Keep going",
      title: `Continue "${current.row.step.title}"`,
      body:
        "You're making steady progress. Jump back into your current milestone to keep the momentum.",
      to: PROGRAM_ROUTE,
      ctaLabel: "Continue Milestone",
      stage: "in_flight",
    },
  };
}

/** All routes the cockpit can navigate to. Exported for contract tests. */
export const COCKPIT_ROUTES = {
  program: PROGRAM_ROUTE,
  welcome: WELCOME_ROUTE,
  support: SUPPORT_ROUTE,
  learn: "/rbt/app/learn",
  passport: "/rbt/app/passport",
  schedule: "/rbt/app/schedule",
  supervision: "/rbt/app/supervision",
  clients: "/rbt/app/clients",
  performance: "/rbt/app/performance",
  credentials: "/rbt/app/credentials",
  growth: "/rbt/app/growth",
  fellowship: "/rbt/app/growth/fellowship",
} as const;