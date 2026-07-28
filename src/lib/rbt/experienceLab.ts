/**
 * RBT Experience Lab — superadmin-only, read-only preview harness.
 *
 * Purpose
 * -------
 * Lets Super Admins / Systems Admins preview the RBT experience against a
 * chosen training pathway and progress preset WITHOUT touching real employee
 * assignments or progress. All data is synthesised in memory; nothing is
 * written to Supabase.
 *
 * Security model
 * --------------
 * - Eligibility is derived from the *underlying* auth roles, not from the
 *   OSRoleProvider view-as override. An RBT who edits sessionStorage or the
 *   URL cannot activate the lab because their roles never include
 *   super_admin/systems_admin.
 * - Persistence is per-tab (sessionStorage). Storage is namespaced by the
 *   admin's auth user id so that if a lower-privilege user later signs in on
 *   the same tab their data cannot collide with an admin session.
 * - When a non-eligible user is detected, any stored lab state is purged.
 * - The lab NEVER calls INSERT/UPDATE/DELETE against Supabase. Consumers
 *   check `active` and short-circuit their DB reads.
 */
import { useCallback, useEffect, useState } from "react";
import type { AppRole } from "@/lib/roles";
import type { PathwayStep, PathwayStepStatus, StepProgress, StepRow } from "@/pages/rbt/app/training/types";

// ---------------------------------------------------------------- constants

/**
 * Canonical Blossom RBT program pathways (exactly four, matching the
 * approved program and `RBTPathId` in @/lib/training/rbtAcademy).
 */
export const LAB_PATHWAY_KEYS = [
  "not_certified",
  "certified_no_experience",
  "certified_under_2yrs",
  "certified_2yrs_plus",
] as const;
export type LabPathwayKey = (typeof LAB_PATHWAY_KEYS)[number];

/** Historical keys that may still live in a tab's sessionStorage. */
export const LEGACY_LAB_PATHWAY_ALIASES: Record<string, LabPathwayKey> = {
  new_rbt_certification: "not_certified",
  under_2_years: "certified_under_2yrs",
  experienced_rbt: "certified_2yrs_plus",
  certified_2plus_years: "certified_2yrs_plus",
  certified_under_2_years: "certified_under_2yrs",
};

export function normalizeLabPathwayKey(key: unknown): LabPathwayKey | null {
  if (typeof key !== "string") return null;
  if ((LAB_PATHWAY_KEYS as readonly string[]).includes(key)) return key as LabPathwayKey;
  return LEGACY_LAB_PATHWAY_ALIASES[key] ?? null;
}

export const LAB_PRESETS = [
  "starting",
  "midway",
  "nearly_done",
  "needs_support",
] as const;
export type LabPreset = (typeof LAB_PRESETS)[number];

export const LAB_PRESET_LABEL: Record<LabPreset, string> = {
  starting:      "Just starting",
  midway:        "Midway through",
  nearly_done:   "Nearly done",
  needs_support: "Needs support",
};

export const LAB_PATHWAY_LABEL: Record<LabPathwayKey, string> = {
  not_certified:           "Not Certified",
  certified_no_experience: "Certified — No Experience",
  certified_under_2yrs:    "Certified — Under 2 Years",
  certified_2yrs_plus:     "Certified — 2+ Years",
};

// ---------------------------------------------------------------- lifecycle stages

export const LAB_STAGES = [
  "brand_new",
  "onboarding",
  "training",
  "competency",
  "cr_setup",
  "first_client",
  "first_two_weeks",
  "growth",
] as const;
export type LabStage = (typeof LAB_STAGES)[number];

export interface LabStageMeta {
  key: LabStage;
  label: string;
  blurb: string;
  /** Best matching existing RBT page for this stage. */
  route: string;
  /** Progress projection preset this stage implies. */
  preset: LabPreset;
}

export const LAB_STAGE_META: Record<LabStage, LabStageMeta> = {
  brand_new: {
    key: "brand_new", label: "Brand-new sign-in",
    blurb: "Very first login — welcome tour and nothing completed yet.",
    route: "/rbt/app/welcome", preset: "starting",
  },
  onboarding: {
    key: "onboarding", label: "HR onboarding",
    blurb: "Paperwork, credentials and preboarding tasks in flight.",
    route: "/rbt/app/preboarding", preset: "starting",
  },
  training: {
    key: "training", label: "Training / Academy",
    blurb: "Working the assigned pathway modules.",
    route: "/rbt/app/program", preset: "midway",
  },
  competency: {
    key: "competency", label: "Competency & readiness",
    blurb: "Role-play, competency checks and BCBA sign-off gates.",
    route: "/rbt/app/readiness", preset: "needs_support",
  },
  cr_setup: {
    key: "cr_setup", label: "CentralReach setup & field readiness",
    blurb: "Systems access, scheduling setup and field clearance.",
    route: "/rbt/app/staffing", preset: "nearly_done",
  },
  first_client: {
    key: "first_client", label: "First client",
    blurb: "First pairing, first session, and the check-in that follows.",
    route: "/rbt/app/first-case", preset: "nearly_done",
  },
  first_two_weeks: {
    key: "first_two_weeks", label: "First two weeks",
    blurb: "Early journey checkpoints and supervision cadence.",
    route: "/rbt/app/journey", preset: "nearly_done",
  },
  growth: {
    key: "growth", label: "30 / 60 / 90 growth",
    blurb: "Fully active RBT — performance, growth and fellowship.",
    route: "/rbt/app/growth", preset: "nearly_done",
  },
};

export function stageRoute(stage: LabStage): string {
  return LAB_STAGE_META[stage].route;
}

export function presetForStage(stage: LabStage): LabPreset {
  return LAB_STAGE_META[stage].preset;
}

const STORAGE_PREFIX = "rbt.experienceLab.v1";
/** Per-tab marker so the demo tour auto-opens once per Lab activation. */
export const LAB_TOUR_STORAGE_KEY = "rbt.experienceLab.demoTour.v1";
const ELIGIBLE_ROLES = new Set(["admin", "super_admin", "systems_admin"]);

export interface LabState {
  pathway: LabPathwayKey;
  preset: LabPreset;
  /** Lifecycle stage being demonstrated. Absent on legacy payloads. */
  stage?: LabStage;
}

// ---------------------------------------------------------------- helpers

export function isLabEligible(roles: readonly (AppRole | string)[] | null | undefined): boolean {
  if (!roles) return false;
  return roles.some((r) => ELIGIBLE_ROLES.has(String(r)));
}

function storageKey(adminUserId: string | null | undefined): string {
  return `${STORAGE_PREFIX}:${adminUserId ?? "anon"}`;
}

function readSession(key: string): LabState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const pathway = normalizeLabPathwayKey(parsed.pathway);
    if (!pathway) return null;
    const stage: LabStage | undefined = (LAB_STAGES as readonly string[]).includes(parsed.stage)
      ? (parsed.stage as LabStage)
      : undefined;
    const preset: LabPreset = (LAB_PRESETS as readonly string[]).includes(parsed.preset)
      ? (parsed.preset as LabPreset)
      : presetForStage(stage ?? "brand_new");
    return stage ? { pathway, preset, stage } : { pathway, preset };
  } catch {
    return null;
  }
}

function writeSession(key: string, state: LabState | null): void {
  if (typeof window === "undefined") return;
  try {
    if (state) window.sessionStorage.setItem(key, JSON.stringify(state));
    else window.sessionStorage.removeItem(key);
  } catch { /* ignore */ }
}

/**
 * Purge every experienceLab storage entry across ALL admin scopes on the
 * current tab. Called when a non-eligible user is detected so that a
 * previous admin's tampered state cannot survive.
 */
export function purgeAllLabStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------- fixtures

const NOW = "2026-01-01T00:00:00.000Z";

function makeStep(
  pathway: LabPathwayKey,
  index: number,
  key: string,
  title: string,
  description: string,
  days: number,
  delivery: string,
): PathwayStep {
  return {
    id: `lab-${pathway}-step-${index}`,
    pathway_id: `lab-${pathway}`,
    key,
    title,
    description,
    kind: "milestone",
    order_index: index,
    component_type: null,
    estimated_days: days,
    delivery_mode: delivery,
    capabilities: [],
    required: true,
  };
}

const FIXTURES: Record<LabPathwayKey, { name: string; description: string; steps: PathwayStep[] }> = {
  not_certified: {
    name: "Not Certified",
    description: "Full certification runway: welcome → classroom & role play → client competency → knowledge assessment → shadowing → full session participation → BCBA final readiness.",
    steps: [
      makeStep("not_certified", 1, "nc_welcome", "Welcome to Blossom", "Meet Blossom, your pathway, and what the first 90 days look like.", 1, "self_paced"),
      makeStep("not_certified", 2, "nc_classroom_roleplay", "Classroom & role play", "Instructor-led ABA foundations paired with structured role play.", 3, "in_person"),
      makeStep("not_certified", 3, "nc_client_competency", "Client competency", "Complete the RBT client competency assessment with a Lead RBT.", 2, "in_person"),
      makeStep("not_certified", 4, "nc_knowledge_assessment", "Knowledge assessment", "Pass the Blossom knowledge assessment covering ethics, safety and ABA basics.", 1, "exam"),
      makeStep("not_certified", 5, "nc_shadowing_docs", "Shadowing & documentation review", "Shadow live sessions and review documentation standards with your supervisor.", 2, "in_person"),
      makeStep("not_certified", 6, "nc_full_session", "Full session participation", "Run a full session end to end with a Lead RBT present.", 2, "in_person"),
      makeStep("not_certified", 7, "nc_bcba_final", "BCBA oversight & final readiness", "BCBA observes, signs off competencies, and clears you for staffing.", 1, "in_person"),
    ],
  },
  certified_no_experience: {
    name: "Certified — No Experience",
    description: "Certified but new to the field: welcome → ABA foundations refresh → documentation & data → role play competency → shadowing → supported session → BCBA supervision.",
    steps: [
      makeStep("certified_no_experience", 1, "cne_welcome", "Welcome to Blossom", "Orientation to Blossom systems, culture and expectations.", 1, "self_paced"),
      makeStep("certified_no_experience", 2, "cne_aba_refresh", "ABA foundations refresh", "Refresh core ABA principles as Blossom applies them in the field.", 2, "self_paced"),
      makeStep("certified_no_experience", 3, "cne_documentation", "Documentation & data", "Blossom session notes, data collection standards and CentralReach basics.", 2, "zoom"),
      makeStep("certified_no_experience", 4, "cne_roleplay", "Role play & competency", "Structured role play plus the Blossom competency checkpoint.", 2, "in_person"),
      makeStep("certified_no_experience", 5, "cne_shadowing", "Shadowing", "Shadow an experienced RBT across at least two client sessions.", 2, "in_person"),
      makeStep("certified_no_experience", 6, "cne_supported_session", "Supported session", "Lead a session with in-room support and immediate feedback.", 1, "in_person"),
      makeStep("certified_no_experience", 7, "cne_bcba_supervision", "BCBA supervision", "BCBA supervision session and readiness sign-off.", 1, "in_person"),
    ],
  },
  certified_under_2yrs: {
    name: "Certified — Under 2 Years",
    description: "Developing clinician: welcome → initial evaluation → targeted coaching → ABA Explained when needed → Day 2 BCBA supervision.",
    steps: [
      makeStep("certified_under_2yrs", 1, "cu2_welcome", "Welcome to Blossom", "Fast orientation to Blossom systems and support structure.", 1, "self_paced"),
      makeStep("certified_under_2yrs", 2, "cu2_initial_eval", "Initial evaluation", "Skills evaluation that places you into the right coaching band.", 1, "in_person"),
      makeStep("certified_under_2yrs", 3, "cu2_targeted_coaching", "Targeted coaching", "Coaching focused only on the gaps your evaluation surfaced.", 2, "in_person"),
      makeStep("certified_under_2yrs", 4, "cu2_aba_explained", "ABA Explained (as needed)", "Assigned only when the evaluation flags foundational gaps.", 1, "self_paced"),
      makeStep("certified_under_2yrs", 5, "cu2_day2_supervision", "Day 2 BCBA supervision", "BCBA joins your second day in the field to confirm readiness.", 1, "in_person"),
    ],
  },
  certified_2yrs_plus: {
    name: "Certified — 2+ Years",
    description: "Experienced clinician: welcome → expedited readiness → documentation calibration → BCBA observation.",
    steps: [
      makeStep("certified_2yrs_plus", 1, "c2p_welcome", "Welcome to Blossom", "Short welcome covering Blossom systems, escalation and support.", 1, "self_paced"),
      makeStep("certified_2yrs_plus", 2, "c2p_expedited_readiness", "Expedited readiness", "Condensed readiness checklist honoring your prior experience.", 1, "self_paced"),
      makeStep("certified_2yrs_plus", 3, "c2p_doc_calibration", "Documentation calibration", "Calibrate session notes and data to Blossom + CentralReach standards.", 1, "zoom"),
      makeStep("certified_2yrs_plus", 4, "c2p_bcba_observation", "BCBA observation", "One BCBA field observation, then straight to staffing.", 1, "in_person"),
    ],
  },
};

// ---------------------------------------------------------------- projection

function progressFor(step: PathwayStep, status: PathwayStepStatus): StepProgress {
  return {
    id: `lab-progress-${step.id}`,
    pathway_step_id: step.id,
    employee_id: "lab-preview",
    status,
    notes: null,
    evidence_url: null,
    completed_at: status === "complete" ? NOW : null,
    updated_at: NOW,
  };
}

/**
 * Deterministic status assignment for each preset. Kept as a pure function so
 * tests can lock the projection down.
 */
export function statusForIndex(total: number, index: number, preset: LabPreset): PathwayStepStatus {
  if (total <= 0) return "not_started";
  const ratio = (index + 1) / total;
  switch (preset) {
    case "starting":
      if (index === 0) return "in_progress";
      return "not_started";
    case "midway": {
      const midCutoff = Math.max(1, Math.floor(total / 2));
      if (index < midCutoff) return "complete";
      if (index === midCutoff) return "in_progress";
      return "not_started";
    }
    case "nearly_done": {
      if (ratio <= 0.8) return "complete";
      if (ratio <= 0.9) return "in_progress";
      return "not_started";
    }
    case "needs_support": {
      const supportCutoff = Math.max(1, Math.floor(total * 0.4));
      if (index < supportCutoff) return "complete";
      if (index === supportCutoff) return "needs_support";
      return "not_started";
    }
  }
}

export interface LabProgramProjection {
  pathway: { id: string; key: LabPathwayKey; name: string; description: string };
  rows: StepRow[];
  stats: {
    total: number;
    complete: number;
    current: StepRow | null;
    blocked: StepRow | null;
    percent: number;
    totalDays: number;
  };
}

/** Projection input — `stage` is optional so callers may pass a partial state. */
export type LabProjectionInput = { pathway: LabPathwayKey; preset: LabPreset; stage?: LabStage };

export function projectProgram(state: LabProjectionInput): LabProgramProjection {
  const fixture = FIXTURES[state.pathway];
  const steps = fixture.steps;
  const rows: StepRow[] = steps.map((step, i) => ({
    step,
    progress: progressFor(step, statusForIndex(steps.length, i, state.preset)),
  }));
  const complete = rows.filter((r) => r.progress.status === "complete").length;
  const current = rows.find((r) => r.progress.status !== "complete") ?? null;
  const blocked = rows.find((r) => r.progress.status === "blocked" || r.progress.status === "needs_support") ?? null;
  const total = rows.length;
  const percent = total ? Math.round((complete / total) * 100) : 0;
  const totalDays = rows.reduce((n, r) => n + (r.step.estimated_days ?? 0), 0);
  return {
    pathway: {
      id: `lab-${state.pathway}`,
      key: state.pathway,
      name: fixture.name,
      description: fixture.description,
    },
    rows,
    stats: { total, complete, current, blocked, percent, totalDays },
  };
}

// ---------------------------------------------------------------- skill passport

export interface LabSkillDef { key: string; label: string; category: string; sort_order: number; }
export interface LabSkillStatus { skill_key: string; state: import("@/pages/rbt/app/training/types").SkillState; last_updated_at: string; last_evaluator_id: string | null; last_evaluation_id: string | null; }

const SKILL_DEFS: LabSkillDef[] = [
  { key: "session_note_quality",  label: "Session notes",          category: "documentation", sort_order: 10 },
  { key: "data_collection",       label: "Data collection",         category: "clinical",      sort_order: 20 },
  { key: "behavior_reduction",    label: "Behavior reduction",      category: "clinical",      sort_order: 30 },
  { key: "skill_acquisition",     label: "Skill acquisition",       category: "clinical",      sort_order: 40 },
  { key: "professional_conduct",  label: "Professional conduct",    category: "professionalism", sort_order: 50 },
  { key: "family_communication",  label: "Family communication",    category: "professionalism", sort_order: 60 },
];

export function projectSkillPassport(state: LabProjectionInput): { defs: LabSkillDef[]; status: Record<string, LabSkillStatus> } {
  const map: Record<string, LabSkillStatus> = {};
  const bank: import("@/pages/rbt/app/training/types").SkillState[] = (() => {
    switch (state.preset) {
      case "starting":      return ["introduced", "introduced", "introduced", "practiced", "introduced", "introduced"];
      case "midway":        return ["practiced", "observed", "practiced", "demonstrated", "observed", "practiced"];
      case "nearly_done":   return ["competent", "competent", "demonstrated", "competent", "competent", "demonstrated"];
      case "needs_support": return ["needs_reinforcement", "practiced", "needs_reinforcement", "observed", "practiced", "introduced"];
    }
  })();
  SKILL_DEFS.forEach((d, i) => {
    map[d.key] = {
      skill_key: d.key,
      state: bank[i] ?? "introduced",
      last_updated_at: NOW,
      last_evaluator_id: null,
      last_evaluation_id: null,
    };
  });
  return { defs: SKILL_DEFS, status: map };
}

// ---------------------------------------------------------------- hook

export interface UseExperienceLab {
  /** True when the underlying auth user is a super/systems admin. */
  eligible: boolean;
  /** True when a lab state is present AND user remains eligible. */
  active: boolean;
  state: LabState | null;
  setPathway: (p: LabPathwayKey) => void;
  setPreset: (p: LabPreset) => void;
  /** Set the lifecycle stage; also re-derives the progress preset. */
  setStage: (s: LabStage) => void;
  enable: (init?: Partial<LabState>) => void;
  exit: () => void;
  reset: () => void;
}

const DEFAULT_STATE: LabState = {
  pathway: "not_certified",
  stage: "brand_new",
  preset: presetForStage("brand_new"),
};

/**
 * React hook. `authRoles` and `authUserId` are passed in from the caller
 * (typically via useAuth) so the module stays independently testable.
 */
export function useExperienceLabController(
  authRoles: readonly (AppRole | string)[] | null | undefined,
  authUserId: string | null | undefined,
): UseExperienceLab {
  const eligible = isLabEligible(authRoles);
  const key = storageKey(authUserId);
  const [state, setState] = useState<LabState | null>(() => (eligible ? readSession(key) : null));

  // Purge storage the moment the user becomes ineligible.
  useEffect(() => {
    if (!eligible) {
      purgeAllLabStorage();
      setState(null);
    } else {
      const persisted = readSession(key);
      setState(persisted);
    }
  }, [eligible, key]);

  const commit = useCallback((next: LabState | null) => {
    if (!eligible) return;
    setState(next);
    writeSession(key, next);
  }, [eligible, key]);

  const setPathway = useCallback((pathway: LabPathwayKey) => {
    commit({ ...(state ?? DEFAULT_STATE), pathway });
  }, [state, commit]);

  const setPreset = useCallback((preset: LabPreset) => {
    commit({ ...(state ?? DEFAULT_STATE), preset });
  }, [state, commit]);

  const setStage = useCallback((stage: LabStage) => {
    commit({ ...(state ?? DEFAULT_STATE), stage, preset: presetForStage(stage) });
  }, [state, commit]);

  const enable = useCallback((init?: Partial<LabState>) => {
    commit({ ...(state ?? DEFAULT_STATE), ...(init ?? {}) });
  }, [state, commit]);

  const exit = useCallback(() => commit(null), [commit]);
  const reset = useCallback(() => commit(DEFAULT_STATE), [commit]);

  return {
    eligible,
    active: eligible && state !== null,
    state: eligible ? state : null,
    setPathway, setPreset, setStage, enable, exit, reset,
  };
}

/** Non-hook helpers used by tests and by data hooks that need read-only access. */
export const __lab_internal = {
  storageKey,
  readSession,
  writeSession,
  FIXTURES,
  DEFAULT_STATE,
};