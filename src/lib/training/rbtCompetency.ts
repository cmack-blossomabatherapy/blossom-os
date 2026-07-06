/**
 * RBT Initial Competency Assessment — 2026 BACB packet, modeled.
 *
 * This is the structured workflow that lives next to the official packet
 * (which is still the source of truth — see resources). The 19 tasks, the
 * assessor rules, the validation, and the 90-day window are all expressed
 * here as pure data + pure functions so the same rules can drive the
 * learner banner, the admin panel, and readiness gating.
 *
 * Storage: source of truth is public.rbt_competency_records. localStorage
 * is used only as a fast local cache and offline fallback until the
 * Supabase snapshot resolves. Reads and writes hit Supabase and refresh
 * the cache on success. Consumers keep the useCompetencyRecord API.
 *
 * CentralReach integration contract: rows carry centralreach_id,
 * source_system, source_updated_at, sync_status, and sync_error so a
 * future CentralReach sync can upsert without any consumer changes.
 */

import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────── Tasks ───────────────────────────

export type CompetencyAssessmentType = "With Client" | "Role-Play" | "Interview";
export type CompetencyTaskStatus =
  | "Not Started"
  | "Scheduled"
  | "Competent"
  | "Not Yet Competent"
  | "Reassessment Needed"
  | "Complete";

export interface CompetencyTaskDef {
  number: number;
  title: string;
  category:
    | "Measurement"
    | "Skill Acquisition"
    | "Behavior Reduction"
    | "Documentation"
    | "Professional Conduct";
  allowed: CompetencyAssessmentType[];
  /** Tasks 6–14 require at least three to be demonstrated With Client. */
  inWithClientRule: boolean;
}

export const COMPETENCY_TASKS: CompetencyTaskDef[] = [
  { number: 1,  title: "Continuous Measurement",                              category: "Measurement",          allowed: ["With Client", "Role-Play"],              inWithClientRule: false },
  { number: 2,  title: "Discontinuous Measurement",                           category: "Measurement",          allowed: ["With Client", "Role-Play"],              inWithClientRule: false },
  { number: 3,  title: "Data and Graphs",                                     category: "Measurement",          allowed: ["With Client", "Role-Play"],              inWithClientRule: false },
  { number: 4,  title: "Preference Assessments",                              category: "Measurement",          allowed: ["With Client", "Role-Play"],              inWithClientRule: false },
  { number: 5,  title: "ABC Data",                                            category: "Measurement",          allowed: ["With Client", "Role-Play"],              inWithClientRule: false },
  { number: 6,  title: "Discrete-Trial Teaching",                             category: "Skill Acquisition",    allowed: ["With Client", "Role-Play"],              inWithClientRule: true  },
  { number: 7,  title: "Naturalistic Teaching",                               category: "Skill Acquisition",    allowed: ["With Client", "Role-Play"],              inWithClientRule: true  },
  { number: 8,  title: "Chaining",                                            category: "Skill Acquisition",    allowed: ["With Client", "Role-Play"],              inWithClientRule: true  },
  { number: 9,  title: "Shaping",                                             category: "Skill Acquisition",    allowed: ["With Client", "Role-Play"],              inWithClientRule: true  },
  { number: 10, title: "Discrimination Training",                             category: "Skill Acquisition",    allowed: ["With Client", "Role-Play"],              inWithClientRule: true  },
  { number: 11, title: "Prompting",                                           category: "Skill Acquisition",    allowed: ["With Client", "Role-Play"],              inWithClientRule: true  },
  { number: 12, title: "Token Systems",                                       category: "Skill Acquisition",    allowed: ["With Client", "Role-Play"],              inWithClientRule: true  },
  { number: 13, title: "Crisis / Emergency",                                  category: "Behavior Reduction",   allowed: ["With Client", "Role-Play", "Interview"], inWithClientRule: true  },
  { number: 14, title: "Behavior Reduction Procedure (antecedent / DR / extinction)", category: "Behavior Reduction", allowed: ["With Client", "Role-Play"],        inWithClientRule: true  },
  { number: 15, title: "Session Notes",                                       category: "Documentation",        allowed: ["With Client", "Role-Play", "Interview"], inWithClientRule: false },
  { number: 16, title: "Client Dignity",                                      category: "Professional Conduct", allowed: ["Interview"],                              inWithClientRule: false },
  { number: 17, title: "Professional Boundaries",                             category: "Professional Conduct", allowed: ["Interview"],                              inWithClientRule: false },
  { number: 18, title: "Supervision Requirements",                            category: "Professional Conduct", allowed: ["Interview"],                              inWithClientRule: false },
  { number: 19, title: "Clinical Direction",                                  category: "Professional Conduct", allowed: ["Interview"],                              inWithClientRule: false },
];

export const WITH_CLIENT_RULE = {
  /** At least this many of items 6–14 must be demonstrated With Client. */
  minimum: 3,
  taskNumbers: [6, 7, 8, 9, 10, 11, 12, 13, 14] as const,
};

export const ASSESSMENT_WINDOW_DAYS = 90;

// ─────────────────────────── Record shape ───────────────────────────

export interface CompetencyTaskRecord {
  number: number;
  status: CompetencyTaskStatus;
  /** Which assessment type was used. */
  assessmentType?: CompetencyAssessmentType;
  /** ISO date the task was assessed. */
  dateAssessed?: string;
  /** Assessor initials. */
  assessorInitials?: string;
  /** Evidence url or filename placeholder. */
  evidence?: string;
  /** Corrective feedback notes (cannot be delivered on the final assessment). */
  feedback?: string;
  /** Scheduled reassessment date when not-yet-competent. */
  reassessmentDate?: string;
}

export interface CompetencyAssessor {
  name: string;
  credential: "BCBA" | "BCaBA" | "RBT" | "Other" | "";
  supervisionTrainingComplete: boolean;
  organizationRelationship:
    | ""
    | "Direct employer / supervisor"
    | "Contracted by employer"
    | "Other approved relationship";
  /** Signature recorded (placeholder for e-sig). */
  signedAt?: string;
}

export interface CompetencyAssistantAssessor {
  name: string;
  credential: "RBT" | "BCaBA" | "BCBA" | "Other" | "";
  /** Free-text notes confirming the eligibility rules. */
  eligibilityNotes?: string;
  /** Task numbers this assistant supported. */
  taskNumbers: number[];
}

export interface RBTCompetencyRecord {
  traineeId: string;
  trackId: string; // RBTPathId, kept loose to avoid circular type imports.
  /** ISO. Date the 40-hour training is recorded complete. Empty until done. */
  fortyHourCompletedAt?: string;
  /** ISO. Target certification application date — drives the 90-day window. */
  certificationApplicationTargetDate?: string;
  /** ISO. Date the final attestation is signed. */
  finalAttestationAt?: string;
  responsible: CompetencyAssessor;
  assistant?: CompetencyAssistantAssessor;
  tasks: CompetencyTaskRecord[];
  updatedAt?: string;
}

// ─────────────────────────── Pure helpers ───────────────────────────

function emptyResponsible(): CompetencyAssessor {
  return { name: "", credential: "", supervisionTrainingComplete: false, organizationRelationship: "" };
}

export function emptyCompetencyRecord(traineeId: string, trackId: string): RBTCompetencyRecord {
  return {
    traineeId,
    trackId,
    responsible: emptyResponsible(),
    tasks: COMPETENCY_TASKS.map((t) => ({ number: t.number, status: "Not Started" })),
  };
}

export interface CompetencyValidation {
  ok: boolean;
  blockers: string[];
  warnings: string[];
  withClientCount: number;
  completedTaskCount: number;
  totalTaskCount: number;
  inWindow: boolean;
}

const COMPETENT_STATES: CompetencyTaskStatus[] = ["Competent", "Complete"];
const TASK_COUNT = COMPETENCY_TASKS.length;

export function validateCompetency(r: RBTCompetencyRecord): CompetencyValidation {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // 40-hour training prerequisite.
  if (!r.fortyHourCompletedAt) {
    blockers.push("40-hour RBT training must be recorded complete before the competency can be finalized.");
  }

  // Responsible assessor rules.
  if (!r.responsible.name) blockers.push("Responsible assessor name is required.");
  if (!["BCBA", "BCaBA"].includes(r.responsible.credential)) {
    blockers.push("Responsible assessor must be a BCBA or BCaBA.");
  }
  if (!r.responsible.supervisionTrainingComplete) {
    blockers.push("Responsible assessor must have completed the 8-hour supervision training.");
  }
  if (!r.responsible.organizationRelationship) {
    blockers.push("Responsible assessor must have the required organizational/contractual relationship.");
  }

  // Assistant assessor eligibility (only when one is present).
  if (r.assistant?.name) {
    if (!["RBT", "BCaBA", "BCBA"].includes(r.assistant.credential)) {
      blockers.push("Assistant assessor must be an active RBT or higher.");
    }
    if (!r.assistant.eligibilityNotes) {
      warnings.push("Confirm assistant assessor is not related to, subordinate to, or employed by the applicant.");
    }
  }

  // Per-task validation.
  const completedTaskCount = r.tasks.filter((t) => COMPETENT_STATES.includes(t.status)).length;
  if (completedTaskCount < TASK_COUNT) {
    blockers.push(`All ${TASK_COUNT} competency tasks must be Competent or Complete (currently ${completedTaskCount}/${TASK_COUNT}).`);
  }

  // Items 6–14: at least 3 demonstrated With Client.
  const withClientCount = r.tasks
    .filter((t) => WITH_CLIENT_RULE.taskNumbers.includes(t.number as 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14))
    .filter((t) => t.assessmentType === "With Client" && COMPETENT_STATES.includes(t.status))
    .length;
  if (withClientCount < WITH_CLIENT_RULE.minimum) {
    blockers.push(`At least ${WITH_CLIENT_RULE.minimum} of items 6–14 must be demonstrated With Client (currently ${withClientCount}).`);
  }

  // 90-day window: every assessed date must fall within the 90-day window
  // *before* the certification application target.
  const inWindow = isInsideAssessmentWindow(r);
  if (!inWindow) {
    blockers.push(`Assessment dates must be within ${ASSESSMENT_WINDOW_DAYS} days before the certification application target.`);
  }

  return {
    ok: blockers.length === 0,
    blockers,
    warnings,
    withClientCount,
    completedTaskCount,
    totalTaskCount: TASK_COUNT,
    inWindow,
  };
}

export function isInsideAssessmentWindow(r: RBTCompetencyRecord): boolean {
  if (!r.certificationApplicationTargetDate) return false;
  const target = new Date(r.certificationApplicationTargetDate).getTime();
  if (!isFinite(target)) return false;
  const earliest = target - ASSESSMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  for (const t of r.tasks) {
    if (!t.dateAssessed) continue;
    const d = new Date(t.dateAssessed).getTime();
    if (!isFinite(d)) continue;
    if (d < earliest || d > target) return false;
  }
  return true;
}

// ─────────────────────────── Local store ───────────────────────────

const STORAGE_KEY = "blossom.rbt.competency.v1";
type Store = Record<string, RBTCompetencyRecord>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) cb(); };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}
function writeStore(next: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

function getSnapshotStore(): Store { return readStore(); }
function serverSnapshot(): Store { return {}; }

/** Reactive hook — returns the record for a trainee, or a fresh empty record. */
export function useCompetencyRecord(traineeId: string, trackId: string): RBTCompetencyRecord {
  const store = useSyncExternalStore(subscribe, getSnapshotStore, serverSnapshot);
  useEffect(() => { void hydrateCompetencyFromSupabase(traineeId, trackId); }, [traineeId, trackId]);
  return store[traineeId] ?? emptyCompetencyRecord(traineeId, trackId);
}

export function getCompetencyRecord(traineeId: string, trackId: string): RBTCompetencyRecord {
  return readStore()[traineeId] ?? emptyCompetencyRecord(traineeId, trackId);
}

function patch(traineeId: string, trackId: string, fn: (r: RBTCompetencyRecord) => RBTCompetencyRecord) {
  const store = readStore();
  const current = store[traineeId] ?? emptyCompetencyRecord(traineeId, trackId);
  const next = { ...fn(current), updatedAt: new Date().toISOString() };
  writeStore({ ...store, [traineeId]: next });
  // Fire-and-forget Supabase persistence — cache is authoritative for UI.
  void persistCompetencyRecord(next);
}

// ─────────────────────────── Supabase persistence ───────────────────────────

async function currentUserId(): Promise<string | null> {
  try { const { data } = await supabase.auth.getUser(); return data.user?.id ?? null; }
  catch { return null; }
}

function recordToRow(r: RBTCompetencyRecord, userId: string | null) {
  const withClientTaskIds = r.tasks
    .filter((t) => t.assessmentType === "With Client")
    .map((t) => String(t.number));
  return {
    trainee_id: r.traineeId,
    user_id: userId,
    track_id: r.trackId,
    task_status: r.tasks as unknown as Record<string, unknown>,
    with_client_task_ids: withClientTaskIds,
    responsible_assessor: r.responsible as unknown as Record<string, unknown>,
    assistant_assessor: (r.assistant ?? null) as unknown as Record<string, unknown> | null,
    forty_hour_completed_at: r.fortyHourCompletedAt ?? null,
    certification_target_date: r.certificationApplicationTargetDate ?? null,
    final_attestation_at: r.finalAttestationAt ?? null,
    assessor_name: r.responsible.name || null,
    assessor_role: r.responsible.credential || null,
    completed_at: r.finalAttestationAt ?? null,
  };
}

function rowToRecord(row: Record<string, unknown>): RBTCompetencyRecord {
  const tasks = Array.isArray(row.task_status)
    ? (row.task_status as CompetencyTaskRecord[])
    : COMPETENCY_TASKS.map((t) => ({ number: t.number, status: "Not Started" as CompetencyTaskStatus }));
  return {
    traineeId: String(row.trainee_id),
    trackId: String(row.track_id),
    fortyHourCompletedAt: (row.forty_hour_completed_at as string | null) ?? undefined,
    certificationApplicationTargetDate: (row.certification_target_date as string | null) ?? undefined,
    finalAttestationAt: (row.final_attestation_at as string | null) ?? undefined,
    responsible: (row.responsible_assessor as unknown as CompetencyAssessor) ?? emptyResponsible(),
    assistant: (row.assistant_assessor as unknown as CompetencyAssistantAssessor | null) ?? undefined,
    tasks,
    updatedAt: (row.updated_at as string | null) ?? undefined,
  };
}

const hydrated = new Set<string>();
export async function hydrateCompetencyFromSupabase(traineeId: string, trackId: string): Promise<void> {
  const key = `${traineeId}::${trackId}`;
  if (hydrated.has(key)) return;
  hydrated.add(key);
  try {
    const { data, error } = await supabase
      .from("rbt_competency_records")
      .select("*")
      .eq("trainee_id", traineeId)
      .eq("track_id", trackId)
      .maybeSingle();
    if (error || !data) return;
    const record = rowToRecord(data as unknown as Record<string, unknown>);
    const store = readStore();
    writeStore({ ...store, [traineeId]: record });
  } catch { /* offline — cache remains */ }
}

async function persistCompetencyRecord(r: RBTCompetencyRecord): Promise<void> {
  try {
    const uid = await currentUserId();
    await supabase
      .from("rbt_competency_records")
      .upsert(recordToRow(r, uid) as never, { onConflict: "trainee_id,track_id" });
  } catch { /* offline — cache is authoritative for now */ }
}

export function updateCompetencyTask(
  traineeId: string,
  trackId: string,
  taskNumber: number,
  patchTask: Partial<CompetencyTaskRecord>,
) {
  patch(traineeId, trackId, (r) => ({
    ...r,
    tasks: r.tasks.map((t) => (t.number === taskNumber ? { ...t, ...patchTask } : t)),
  }));
}

export function updateCompetencyMeta(
  traineeId: string,
  trackId: string,
  patchMeta: Partial<Pick<
    RBTCompetencyRecord,
    "fortyHourCompletedAt" | "certificationApplicationTargetDate" | "finalAttestationAt"
  >>,
) {
  patch(traineeId, trackId, (r) => ({ ...r, ...patchMeta }));
}

export function updateResponsibleAssessor(
  traineeId: string,
  trackId: string,
  patchAssessor: Partial<CompetencyAssessor>,
) {
  patch(traineeId, trackId, (r) => ({ ...r, responsible: { ...r.responsible, ...patchAssessor } }));
}

export function updateAssistantAssessor(
  traineeId: string,
  trackId: string,
  patchAssessor: Partial<CompetencyAssistantAssessor> | null,
) {
  patch(traineeId, trackId, (r) => ({
    ...r,
    assistant: patchAssessor === null
      ? undefined
      : { name: "", credential: "", taskNumbers: [], ...(r.assistant ?? {}), ...patchAssessor },
  }));
}

export function attestFinalCompetency(traineeId: string, trackId: string): { ok: boolean; blockers: string[] } {
  const r = getCompetencyRecord(traineeId, trackId);
  const v = validateCompetency(r);
  if (!v.ok) return { ok: false, blockers: v.blockers };
  patch(traineeId, trackId, (curr) => ({
    ...curr,
    finalAttestationAt: new Date().toISOString(),
    responsible: { ...curr.responsible, signedAt: new Date().toISOString() },
  }));
  return { ok: true, blockers: [] };
}