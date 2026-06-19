// RBT readiness gates — used by the Readiness Board and consumed by Scheduling.
// Mock/static for now; the shape is what a backend would populate.

import { useSyncExternalStore } from "react";
import {
  RBT_PATHS,
  type RBTPath,
  type RBTPathId,
  type SignoffItem,
  type SignoffOwner,
} from "./rbtAcademy";
import { getCompetencyRecord, validateCompetency } from "./rbtCompetency";

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

export type CertificationStatus = "Not Certified" | "In Progress" | "Certified";
export type ExperienceBucket =
  | "Not Certified"
  | "Certified · No experience"
  | "Certified · Under 2 years"
  | "Certified · 2+ years";

export interface CoachingNote {
  id: string;
  author: string;
  authorRole: SignoffOwner | "Clinical Leadership";
  text: string;
  createdAt: string;   // ISO
}

export interface QuizResult {
  id: string;
  title: string;
  score: number;       // 0-100
  passed: boolean;
  takenAt: string;     // ISO
}

export interface ShadowRecord {
  id: string;
  title: string;
  observer: string;
  date: string;        // ISO
  status: "scheduled" | "completed" | "needs-rework";
  notes?: string;
}

export interface MockNoteReview {
  id: string;
  reviewer: string;    // Documentation Reviewer
  date: string;        // ISO
  status: "pending" | "approved" | "revise";
  feedback?: string;
}

export interface RBTTrainee {
  id: string;
  name: string;
  state: string;
  clinic?: string;
  certification: CertificationStatus;
  experienceBucket: ExperienceBucket;
  startDate: string;          // ISO
  pathId: RBTPathId;
  /** True when an admin manually overrode the path (vs auto-assigned). */
  pathOverridden?: boolean;
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
  /** Per-module completion + progress. */
  moduleProgress?: Record<string, { status: "completed" | "in_progress" | "not_started"; progress?: number }>;
  quizResults?: QuizResult[];
  shadowRecords?: ShadowRecord[];
  mockNoteReviews?: MockNoteReview[];
  coachingNotes?: CoachingNote[];
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

  // Per-track gating: the Not Certified path additionally requires the
  // Initial Competency Assessment record to validate per the 2026 BACB rules.
  let extraBlocker: string | null = null;
  if (t.pathId === "not_certified") {
    const rec = getCompetencyRecord(t.id, t.pathId);
    const v = validateCompetency(rec);
    if (!v.ok) {
      extraBlocker = `Initial Competency Assessment incomplete (${v.completedTaskCount}/${v.totalTaskCount} tasks competent, ${v.withClientCount} With-Client in 6–14).`;
      missing.push(extraBlocker);
    }
  }

  const independentReady =
    requiredCount > 0 &&
    signedCount === requiredCount &&
    !t.flags?.blocked &&
    !extraBlocker;

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

export const EXPERIENCE_BUCKETS: ExperienceBucket[] = [
  "Not Certified",
  "Certified · No experience",
  "Certified · Under 2 years",
  "Certified · 2+ years",
];

export const CERTIFICATION_STATUSES: CertificationStatus[] = [
  "Not Certified",
  "In Progress",
  "Certified",
];

export function bucketFromPath(pathId: RBTPathId): ExperienceBucket {
  switch (pathId) {
    case "not_certified":            return "Not Certified";
    case "certified_no_experience":  return "Certified · No experience";
    case "certified_under_2yrs":     return "Certified · Under 2 years";
    case "certified_2yrs_plus":      return "Certified · 2+ years";
  }
}

export function pathFromBucket(b: ExperienceBucket): RBTPathId {
  switch (b) {
    case "Not Certified":              return "not_certified";
    case "Certified · No experience":  return "certified_no_experience";
    case "Certified · Under 2 years":  return "certified_under_2yrs";
    case "Certified · 2+ years":       return "certified_2yrs_plus";
  }
}

// ---------- Mock trainees ----------

function signed(...ids: string[]): Record<string, SignoffItem["status"]> {
  return ids.reduce<Record<string, SignoffItem["status"]>>((acc, id) => {
    acc[id] = "signed";
    return acc;
  }, {});
}

const SEED_TRAINEES: RBTTrainee[] = [
  {
    id: "t-1", name: "Aaliyah Brooks", state: "GA", clinic: "Atlanta · Buckhead",
    certification: "In Progress", experienceBucket: "Not Certified",
    startDate: "2026-06-02", pathId: "not_certified",
    currentPhaseIndex: 2, currentModuleId: "nc-c4",
    leadRbtTrainer: "Jamie Park", bcba: "Dr. Lin Chen",
    trainingAdmin: "Operations · Mara", documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2"),
    quizResults: [{ id: "q1", title: "RBT Role & Ethics", score: 92, passed: true, takenAt: "2026-06-05" }],
    shadowRecords: [],
    mockNoteReviews: [],
    coachingNotes: [{ id: "c1", author: "Jamie Park", authorRole: "Lead RBT Trainer", text: "Strong with reinforcement timing; revisit prompting hierarchy.", createdAt: "2026-06-08" }],
  },
  {
    id: "t-2", name: "Marcus Reed", state: "NC", clinic: "Charlotte · South",
    certification: "Certified", experienceBucket: "Certified · No experience",
    startDate: "2026-05-20", pathId: "certified_no_experience",
    currentPhaseIndex: 6, currentModuleId: "ne-fs1",
    leadRbtTrainer: "Devon Hayes", bcba: "Dr. Rosa Alvarez",
    trainingAdmin: "Operations · Mara", documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2", "so-3", "so-6"),
    quizResults: [{ id: "q1", title: "Session Flow Check", score: 88, passed: true, takenAt: "2026-05-28" }],
    shadowRecords: [{ id: "s1", title: "Lead RBT shadow #1", observer: "Devon Hayes", date: "2026-06-02", status: "completed" }],
    mockNoteReviews: [{ id: "m1", reviewer: "QA · Priya", date: "2026-06-04", status: "approved", feedback: "Clear, billable." }],
  },
  {
    id: "t-3", name: "Sophie Tran", state: "TN", clinic: "Nashville · East",
    certification: "Certified", experienceBucket: "Certified · Under 2 years",
    startDate: "2026-06-09", pathId: "certified_under_2yrs",
    currentPhaseIndex: 2, currentModuleId: "u2-g1",
    leadRbtTrainer: "Jamie Park", bcba: "Dr. Lin Chen",
    trainingAdmin: "Operations · Mara", documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2"),
    flags: { needsCoaching: true },
    quizResults: [{ id: "q1", title: "ABA Concept Check", score: 62, passed: false, takenAt: "2026-06-11" }],
    coachingNotes: [{ id: "c1", author: "Jamie Park", authorRole: "Lead RBT Trainer", text: "Implementation evaluation flagged prompting gaps. Assigned coaching session.", createdAt: "2026-06-12" }],
  },
  {
    id: "t-4", name: "Elena Cruz", state: "VA", clinic: "Richmond · West",
    certification: "Certified", experienceBucket: "Certified · 2+ years",
    startDate: "2026-06-10", pathId: "certified_2yrs_plus",
    currentPhaseIndex: 4, currentModuleId: "ex-r1",
    leadRbtTrainer: "Jamie Park", bcba: "Dr. Rosa Alvarez",
    trainingAdmin: "Operations · Mara", documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2", "so-3", "so-4", "so-6"),
  },
  {
    id: "t-5", name: "Noah Patel", state: "GA", clinic: "Atlanta · Buckhead",
    certification: "Certified", experienceBucket: "Certified · No experience",
    startDate: "2026-04-15", pathId: "certified_no_experience",
    currentPhaseIndex: 7, currentModuleId: "ne-b1",
    leadRbtTrainer: "Devon Hayes", bcba: "Dr. Lin Chen",
    trainingAdmin: "Operations · Mara", documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2", "so-3", "so-4", "so-5", "so-6"),
    shadowRecords: [{ id: "s1", title: "Final shadow", observer: "Devon Hayes", date: "2026-05-30", status: "completed" }],
    mockNoteReviews: [{ id: "m1", reviewer: "QA · Priya", date: "2026-06-01", status: "approved" }],
  },
  {
    id: "t-6", name: "Jordan Wells", state: "MD", clinic: "Bethesda · North",
    certification: "In Progress", experienceBucket: "Not Certified",
    startDate: "2026-05-01", pathId: "not_certified",
    currentPhaseIndex: 4, currentModuleId: "nc-k3",
    leadRbtTrainer: "Jamie Park", bcba: "Dr. Rosa Alvarez",
    trainingAdmin: "Operations · Mara", documentationReviewer: "QA · Priya",
    signoffs: signed("so-1", "so-2"),
    flags: { blocked: { reason: "Background check pending" } },
  },
];

// ---------- Mutation store ----------

const STORAGE_KEY = "blossom.rbt.trainees.v1";
type Overrides = Record<string, Partial<RBTTrainee>>;

function readOverrides(): Overrides {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

function writeOverrides(next: Overrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) cb(); };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function mergedTrainees(): RBTTrainee[] {
  const o = readOverrides();
  return SEED_TRAINEES.map((t) => {
    const patch = o[t.id];
    if (!patch) return t;
    return {
      ...t,
      ...patch,
      signoffs: { ...t.signoffs, ...(patch.signoffs ?? {}) },
      flags: { ...(t.flags ?? {}), ...(patch.flags ?? {}) },
      quizResults: patch.quizResults ?? t.quizResults,
      shadowRecords: patch.shadowRecords ?? t.shadowRecords,
      mockNoteReviews: patch.mockNoteReviews ?? t.mockNoteReviews,
      coachingNotes: patch.coachingNotes ?? t.coachingNotes,
      moduleProgress: patch.moduleProgress ?? t.moduleProgress,
    };
  });
}

let cachedSig = "";
let cached: RBTTrainee[] = mergedTrainees();
function getSnapshot(): RBTTrainee[] {
  const o = readOverrides();
  const sig = JSON.stringify(o);
  if (sig !== cachedSig) { cachedSig = sig; cached = mergedTrainees(); }
  return cached;
}

/** Hook — reactive trainee list shared across the app. */
export function useTrainees(): RBTTrainee[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => SEED_TRAINEES);
}

/** Read-only snapshot for non-React consumers. */
export function getTrainees(): RBTTrainee[] { return mergedTrainees(); }

/** Backwards-compatible export (now reflects overrides). */
export const RBT_TRAINEES: RBTTrainee[] = new Proxy([] as RBTTrainee[], {
  get(_t, prop) {
    const list = mergedTrainees();
    return (list as unknown as Record<PropertyKey, unknown>)[prop];
  },
}) as RBTTrainee[];

function patchTrainee(id: string, patch: Partial<RBTTrainee>) {
  const o = readOverrides();
  const seed = SEED_TRAINEES.find((t) => t.id === id);
  if (!seed) return;
  const merged = { ...(o[id] ?? {}), ...patch };
  if (patch.signoffs) merged.signoffs = { ...(o[id]?.signoffs ?? {}), ...patch.signoffs };
  if (patch.flags)    merged.flags    = { ...(o[id]?.flags ?? {}),    ...patch.flags };
  writeOverrides({ ...o, [id]: merged });
}

// ---------- Admin mutations ----------

export function assignPath(id: string, pathId: RBTPathId, opts?: { override?: boolean }) {
  patchTrainee(id, {
    pathId,
    pathOverridden: opts?.override ?? true,
    currentPhaseIndex: 0,
    signoffs: {},
  });
}

export function recordSignoff(
  id: string,
  signoffId: string,
  status: SignoffItem["status"],
) {
  patchTrainee(id, { signoffs: { [signoffId]: status } });
}

export function markBlocked(id: string, reason: string | null) {
  patchTrainee(id, { flags: { blocked: reason ? { reason } : null } });
}

export function setNeedsCoaching(id: string, value: boolean) {
  patchTrainee(id, { flags: { needsCoaching: value } });
}

export function addCoachingNote(
  id: string,
  note: Omit<CoachingNote, "id" | "createdAt">,
) {
  const t = mergedTrainees().find((x) => x.id === id);
  if (!t) return;
  const nextNote: CoachingNote = {
    ...note,
    id: `cn-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  patchTrainee(id, { coachingNotes: [...(t.coachingNotes ?? []), nextNote] });
}

export function updateAssignment(
  id: string,
  who: "leadRbtTrainer" | "bcba" | "trainingAdmin" | "documentationReviewer",
  value: string | null,
) {
  patchTrainee(id, { [who]: value } as Partial<RBTTrainee>);
}