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

export const LAB_PATHWAY_KEYS = [
  "new_rbt_certification",
  "under_2_years",
  "experienced_rbt",
] as const;
export type LabPathwayKey = (typeof LAB_PATHWAY_KEYS)[number];

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
  new_rbt_certification: "Certification Track",
  under_2_years:         "Developing RBT (< 2 years)",
  experienced_rbt:       "Experienced RBT (2+ years)",
};

const STORAGE_PREFIX = "rbt.experienceLab.v1";
const ELIGIBLE_ROLES = new Set(["admin", "super_admin", "systems_admin"]);

export interface LabState {
  pathway: LabPathwayKey;
  preset: LabPreset;
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
    if (!LAB_PATHWAY_KEYS.includes(parsed.pathway)) return null;
    if (!LAB_PRESETS.includes(parsed.preset)) return null;
    return { pathway: parsed.pathway, preset: parsed.preset };
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
  new_rbt_certification: {
    name: "Certification Track",
    description: "Full RBT certification: 15-minute explainer → role-play → in-person competency → BCBA sign-off → 40-hour → exam → staffed with Lead RBT.",
    steps: [
      makeStep("new_rbt_certification", 1, "cert_explainer", "15-minute RBT explainer", "Understand the RBT role, expectations, and pathway ahead.", 1, "self_paced"),
      makeStep("new_rbt_certification", 2, "cert_roleplay", "Paired role-play & competency", "Practice the RBT skill assessment with a Lead RBT partner.", 2, "in_person"),
      makeStep("new_rbt_certification", 3, "cert_inperson_1", "In-person competency (session 1)", "First of three Lead RBT client-competency sessions.", 1, "in_person"),
      makeStep("new_rbt_certification", 4, "cert_inperson_2", "In-person competency (session 2)", "Second Lead RBT client-competency session.", 1, "in_person"),
      makeStep("new_rbt_certification", 5, "cert_inperson_3", "In-person competency (session 3)", "Third Lead RBT client-competency session.", 1, "in_person"),
      makeStep("new_rbt_certification", 6, "cert_bcba_signoff", "BCBA competency sign-off", "BCBA reviews evidence and signs off the RBT skill assessment.", 1, "in_person"),
      makeStep("new_rbt_certification", 7, "cert_40_hour", "40-hour training", "Complete the required 40-hour RBT training.", 10, "self_paced"),
      makeStep("new_rbt_certification", 8, "cert_exam", "RBT exam", "Sit and pass the RBT certification exam.", 1, "exam"),
      makeStep("new_rbt_certification", 9, "cert_shadow_eval", "Lead RBT shadow + evaluation", "Shadow a Lead RBT and complete a reviewed session note.", 1, "in_person"),
      makeStep("new_rbt_certification", 10, "cert_staffed", "Staffed case with Lead RBT", "First staffed case: Lead RBT joins for the full first session; BCBA joins the second.", 2, "in_person"),
    ],
  },
  under_2_years: {
    name: "Developing RBT (< 2 years)",
    description: "Zoom learning (no ABA basics) → orientation → Lead RBT + client session → evaluation with band placement.",
    steps: [
      makeStep("under_2_years", 1, "dev_zoom_intake", "Zoom learning intro", "Live Zoom learning session — Blossom systems and expectations.", 1, "zoom"),
      makeStep("under_2_years", 2, "dev_orientation", "Orientation", "Attend Blossom orientation with the recruiting team.", 1, "in_person"),
      makeStep("under_2_years", 3, "dev_zoom_datanotes", "Zoom: data & session notes", "Learn Blossom's data collection and session-note standards.", 1, "zoom"),
      makeStep("under_2_years", 4, "dev_lead_session", "Lead RBT + client session", "First supervised session paired with a Lead RBT.", 1, "in_person"),
      makeStep("under_2_years", 5, "dev_evaluation", "Skill evaluation", "Score 0–60. ≤36 repeat · 37–47 additional coaching · ≥48 ready.", 1, "in_person"),
      makeStep("under_2_years", 6, "dev_staffed", "Staffed case", "Placed onto a case with the appropriate support level based on evaluation.", 2, "in_person"),
    ],
  },
  experienced_rbt: {
    name: "Experienced RBT (2+ years)",
    description: "Streamlined onboarding: orientation → staffed. Prior experience is honored.",
    steps: [
      makeStep("experienced_rbt", 1, "exp_orientation", "Orientation", "Blossom orientation and systems overview.", 1, "in_person"),
      makeStep("experienced_rbt", 2, "exp_staffed", "Staffed case", "Assigned to a case immediately.", 1, "in_person"),
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

export function projectProgram(state: LabState): LabProgramProjection {
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

export function projectSkillPassport(state: LabState): { defs: LabSkillDef[]; status: Record<string, LabSkillStatus> } {
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
  enable: (init?: Partial<LabState>) => void;
  exit: () => void;
  reset: () => void;
}

const DEFAULT_STATE: LabState = { pathway: "new_rbt_certification", preset: "midway" };

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

  const enable = useCallback((init?: Partial<LabState>) => {
    commit({ ...(state ?? DEFAULT_STATE), ...(init ?? {}) });
  }, [state, commit]);

  const exit = useCallback(() => commit(null), [commit]);
  const reset = useCallback(() => commit(DEFAULT_STATE), [commit]);

  return {
    eligible,
    active: eligible && state !== null,
    state: eligible ? state : null,
    setPathway, setPreset, enable, exit, reset,
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