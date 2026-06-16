// RBT readiness gates — used by the Readiness Board and consumed by Scheduling.
// Mock/static for now; the shape is what a backend would populate.

import {
  RBT_PATHS,
  type RBTPath,
  type RBTPathId,
  type SignoffItem,
  type SignoffOwner,
} from "./rbtAcademy";

export const REQUIRED_SIGNOFF_ROLES: SignoffOwner[] = [
  "Lead RBT Trainer",
  "BCBA",
  "Training Admin",
  "Documentation Reviewer",
];

export type ReadinessStatus =
  | "Not Started"
  | "In Training"
  | "Needs Coaching"
  | "Awaiting Lead RBT Signoff"
  | "Awaiting BCBA Signoff"
  | "Ready for Independent Assignment"
  | "Blocked";

export interface RBTTrainee {
  id: string;
  name: string;
  state: string;
  startDate: string;          // ISO
  pathId: RBTPathId;
  /** Phase index inside the path (0 = Welcome). */
  currentPhaseIndex: number;
  /** Module id of the module the trainee is on. */
  currentModuleId: string;
  /** Trainer & supervisor assignments. */
  leadRbtTrainer: string | null;
  bcba: string | null;
  trainingAdmin: string | null;
  documentationReviewer: string | null;
  /** Per-trainee signoff state, keyed by the path's signoff id. */
  signoffs: Record<string, SignoffItem["status"]>;
  /** Optional override / coaching flags. */
  flags?: {
    needsCoaching?: boolean;
    blocked?: { reason: string } | null;
  };
}

export interface ReadinessSummary {
  status: ReadinessStatus;
  path: RBTPath;
  currentPhaseTitle: string;
  currentModuleTitle: string;
  missing: string[];
  requiredSignoffs: {
    item: SignoffItem;
    status: SignoffItem["status"];
  }[];
  pendingByOwner: Record<SignoffOwner, number>;
  signedCount: number;
  requiredCount: number;
  /** True only when every required signoff is signed and nothing blocks. */
  independentReady: boolean;
}

/** Used by Scheduling — a single source of truth. */
export function isIndependentReady(t: RBTTrainee): boolean {
  return summarize(t).independentReady;
}

export function summarize(t: RBTTrainee): ReadinessSummary {
  const path = RBT_PATHS.find((p) => p.id === t.pathId) ?? RBT_PATHS[0];
  const phase = path.phases[Math.min(t.currentPhaseIndex, path.phases.length - 1)];
  const module =
    phase.modules.find((m) => m.id === t.currentModuleId) ?? phase.modules[0];

  const requiredSignoffs = path.signoffs
    .filter((s) => s.required)
    .map((item) => ({ item, status: t.signoffs[item.id] ?? item.status }));

  const signedCount = requiredSignoffs.filter((s) => s.status === "signed").length;
  const requiredCount = requiredSignoffs.length;

  const missing = requiredSignoffs
    .filter((s) => s.status !== "signed")
    .map((s) => `${s.item.label} · ${s.item.owner}`);

  const pendingByOwner = REQUIRED_SIGNOFF_ROLES.reduce(
    (acc, role) => {
      acc[role] = requiredSignoffs.filter(
        (s) => s.item.owner === role && s.status !== "signed",
      ).length;
      return acc;
    },
    {} as Record<SignoffOwner, number>,
  );
  pendingByOwner["Operations"] = requiredSignoffs.filter(
    (s) => s.item.owner === "Operations" && s.status !== "signed",
  ).length;

  const independentReady = requiredCount > 0 && signedCount === requiredCount && !t.flags?.blocked;

  let status: ReadinessStatus;
  if (t.flags?.blocked) status = "Blocked";
  else if (independentReady) status = "Ready for Independent Assignment";
  else if (t.flags?.needsCoaching) status = "Needs Coaching";
  else if (signedCount === 0 && t.currentPhaseIndex === 0) status = "Not Started";
  else if (pendingByOwner["BCBA"] > 0 && pendingByOwner["Lead RBT Trainer"] === 0)
    status = "Awaiting BCBA Signoff";
  else if (pendingByOwner["Lead RBT Trainer"] > 0 && requiredCount - signedCount <= 2)
    status = "Awaiting Lead RBT Signoff";
  else status = "In Training";

  return {
    status,
    path,
    currentPhaseTitle: phase.title,
    currentModuleTitle: module?.title ?? "—",
    missing,
    requiredSignoffs,
    pendingByOwner,
    signedCount,
    requiredCount,
    independentReady,
  };
}

export const READINESS_TONE: Record<ReadinessStatus, "good" | "warn" | "bad" | "neutral"> = {
  "Not Started": "neutral",
  "In Training": "neutral",
  "Needs Coaching": "warn",
  "Awaiting Lead RBT Signoff": "warn",
  "Awaiting BCBA Signoff": "warn",
  "Ready for Independent Assignment": "good",
  Blocked: "bad",
};

// ---------- Mock trainees ----------

function signed(...ids: string[]): Record<string, SignoffItem["status"]> {
  return ids.reduce<Record<string, SignoffItem["status"]>>((acc, id) => {
    acc[id] = "signed";
    return acc;
  }, {});
}

export const RBT_TRAINEES: RBTTrainee[] = [
  {
    id: "t-1",
    name: "Aaliyah Brooks",
    state: "GA",
    startDate: "2026-06-02",
    pathId: "not_certified",
    currentPhaseIndex: 2,
    currentModuleId: "nc-c4",
    leadRbtTrainer: "Jamie Park",
    bcba: "Dr. Lin Chen",
    trainingAdmin: "Operations · Mara",
    documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2"),
  },
  {
    id: "t-2",
    name: "Marcus Reed",
    state: "NC",
    startDate: "2026-05-20",
    pathId: "certified_no_experience",
    currentPhaseIndex: 6,
    currentModuleId: "ne-fs1",
    leadRbtTrainer: "Devon Hayes",
    bcba: "Dr. Rosa Alvarez",
    trainingAdmin: "Operations · Mara",
    documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2", "so-3", "so-6"),
  },
  {
    id: "t-3",
    name: "Sophie Tran",
    state: "TN",
    startDate: "2026-06-09",
    pathId: "certified_under_2yrs",
    currentPhaseIndex: 2,
    currentModuleId: "u2-g1",
    leadRbtTrainer: "Jamie Park",
    bcba: "Dr. Lin Chen",
    trainingAdmin: "Operations · Mara",
    documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2"),
    flags: { needsCoaching: true },
  },
  {
    id: "t-4",
    name: "Elena Cruz",
    state: "VA",
    startDate: "2026-06-10",
    pathId: "certified_2yrs_plus",
    currentPhaseIndex: 4,
    currentModuleId: "ex-r1",
    leadRbtTrainer: "Jamie Park",
    bcba: "Dr. Rosa Alvarez",
    trainingAdmin: "Operations · Mara",
    documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2", "so-3", "so-4", "so-6"),
  },
  {
    id: "t-5",
    name: "Noah Patel",
    state: "GA",
    startDate: "2026-04-15",
    pathId: "certified_no_experience",
    currentPhaseIndex: 7,
    currentModuleId: "ne-b1",
    leadRbtTrainer: "Devon Hayes",
    bcba: "Dr. Lin Chen",
    trainingAdmin: "Operations · Mara",
    documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2", "so-3", "so-4", "so-5", "so-6"),
  },
  {
    id: "t-6",
    name: "Jordan Wells",
    state: "MD",
    startDate: "2026-05-01",
    pathId: "not_certified",
    currentPhaseIndex: 4,
    currentModuleId: "nc-k3",
    leadRbtTrainer: "Jamie Park",
    bcba: "Dr. Rosa Alvarez",
    trainingAdmin: "Operations · Mara",
    documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2"),
    flags: { blocked: { reason: "Background check pending" } },
  },
];