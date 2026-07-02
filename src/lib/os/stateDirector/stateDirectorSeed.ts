import type { StateDirectorSnapshot, StateProfile, StateMetrics, Escalation, OpsTask, ActivityEvent } from "./types";

/**
 * Seed data — used only on first load and as a fallback in Lovable preview.
 * Once the user creates/edits records they are persisted through the adapter
 * and this seed is not applied again.
 */

const nowIso = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

const profiles: StateProfile[] = [
  { code: "GA", name: "Georgia",         active: true, stateDirector: "Ashley Tran",  assistantStateDirector: "Elena Ruiz",   stateVa: "Mia Alvarez",   bdRep: "Rob Duran",    regions: ["Atlanta", "Athens"] },
  { code: "NC", name: "North Carolina",  active: true, stateDirector: "Marcus Hill",  assistantStateDirector: "Priya Shah",   stateVa: "Deja Wells",    bdRep: "Sam Cole",     regions: ["Charlotte", "Raleigh", "Durham"] },
  { code: "TN", name: "Tennessee",       active: true, stateDirector: "Sasha Long",   assistantStateDirector: "Kenji Park",   stateVa: "Ivy Chen",      bdRep: "Nadia West",   regions: ["Nashville", "Memphis"] },
  { code: "VA", name: "Virginia",        active: true, stateDirector: "Priya Patel",  assistantStateDirector: "Marc Vega",    stateVa: "Zora Bell",     bdRep: "Ben Torres",   regions: ["Richmond", "Norfolk", "Fairfax"] },
  { code: "MD", name: "Maryland",        active: true, stateDirector: "Devon Ross",   assistantStateDirector: "Ariel Kim",    stateVa: "Lena Ortiz",    bdRep: "Kai Nguyen",   regions: ["Baltimore", "Rockville"] },
];

const metrics: Record<string, StateMetrics> = {
  GA: { code: "GA", healthScore: 88, healthLabel: "Healthy", activeClients: 142, authorizedHours: 4200, scheduledHours: 3980, deliveredHours: 3720, staffingGaps: 3,  intakePipeline: 12, authsExpiring30d: 3, clinicalRisks: 1, recruitingNeeds: 4, cancellationRisk: 6,  openEscalations: 1, openTasks: 4, agingBlockers: 1, updatedAt: nowIso() },
  NC: { code: "NC", healthScore: 78, healthLabel: "Watch",   activeClients: 184, authorizedHours: 5400, scheduledHours: 4980, deliveredHours: 4520, staffingGaps: 7,  intakePipeline: 9,  authsExpiring30d: 5, clinicalRisks: 2, recruitingNeeds: 6, cancellationRisk: 9,  openEscalations: 2, openTasks: 6, agingBlockers: 2, updatedAt: nowIso() },
  TN: { code: "TN", healthScore: 91, healthLabel: "Healthy", activeClients: 96,  authorizedHours: 2600, scheduledHours: 2510, deliveredHours: 2420, staffingGaps: 1,  intakePipeline: 4,  authsExpiring30d: 1, clinicalRisks: 0, recruitingNeeds: 2, cancellationRisk: 4,  openEscalations: 0, openTasks: 2, agingBlockers: 0, updatedAt: nowIso() },
  VA: { code: "VA", healthScore: 68, healthLabel: "Risk",    activeClients: 118, authorizedHours: 3400, scheduledHours: 2860, deliveredHours: 2540, staffingGaps: 9,  intakePipeline: 7,  authsExpiring30d: 8, clinicalRisks: 3, recruitingNeeds: 7, cancellationRisk: 12, openEscalations: 3, openTasks: 8, agingBlockers: 3, updatedAt: nowIso() },
  MD: { code: "MD", healthScore: 82, healthLabel: "Stable",  activeClients: 88,  authorizedHours: 2400, scheduledHours: 2260, deliveredHours: 2080, staffingGaps: 2,  intakePipeline: 5,  authsExpiring30d: 2, clinicalRisks: 1, recruitingNeeds: 3, cancellationRisk: 7,  openEscalations: 1, openTasks: 3, agingBlockers: 1, updatedAt: nowIso() },
};

const escalations: Escalation[] = [
  { id: "esc-va-01", state: "VA", title: "Hard-to-staff Richmond client", description: "3+ RBT declines. Family requests bilingual match.", department: "Staffing",      assignedTo: "Devon Ross",  priority: "high",   status: "escalated", dueAt: daysAhead(2),  createdBy: "Priya Patel",  createdAt: daysAgo(3), updatedAt: daysAgo(1), notes: [{ id: "n1", author: "Priya Patel", body: "Escalated to staffing lead.", createdAt: daysAgo(1) }] },
  { id: "esc-nc-01", state: "NC", title: "BCBS pediatric ABA denial",      description: "Medical necessity appeal in progress.",              department: "Authorizations", assignedTo: "Briana Diaz", priority: "high",   status: "in_review",  dueAt: daysAhead(4),  createdBy: "Marcus Hill",  createdAt: daysAgo(5), updatedAt: daysAgo(2), notes: [] },
  { id: "esc-va-02", state: "VA", title: "Family preference conflict",     description: "Continuity vs schedule conflict on Reyes case.",     department: "Clinical",       assignedTo: "Marc Vega",   priority: "medium", status: "open",       dueAt: daysAhead(1),  createdBy: "Priya Patel",  createdAt: daysAgo(1), updatedAt: daysAgo(1), notes: [] },
  { id: "esc-nc-02", state: "NC", title: "PR overdue — 2 clients",         description: "BCBA out on leave; QA reassigning reviewer.",        department: "QA",             assignedTo: "Ashley Tran", priority: "medium", status: "waiting",    dueAt: daysAhead(7),  createdBy: "Marcus Hill",  createdAt: daysAgo(6), updatedAt: daysAgo(3), notes: [] },
  { id: "esc-md-01", state: "MD", title: "Auth expiring — Baltimore",      description: "Reauth packet incomplete; missing recent assessment.", department: "Authorizations", assignedTo: "Briana Diaz", priority: "urgent", status: "open",       dueAt: daysAhead(3),  createdBy: "Devon Ross",   createdAt: daysAgo(2), updatedAt: daysAgo(2), notes: [] },
];

const tasks: OpsTask[] = [
  { id: "task-01", state: "VA", title: "Follow up with payer rep — Aetna",       description: "Confirm continuation of Reyes case.",  department: "Authorizations", owner: "Briana Diaz", priority: "high",   status: "in_progress", dueAt: daysAhead(0),  relatedEscalationId: "esc-va-01", createdBy: "Priya Patel", createdAt: daysAgo(2), updatedAt: daysAgo(1), notes: [] },
  { id: "task-02", state: "VA", title: "Match RBT to Sophia Reyes",              description: "Bilingual ES/EN, afternoons.",         department: "Staffing",       owner: "Devon Ross",  priority: "high",   status: "escalated",    dueAt: daysAhead(1),  relatedEscalationId: "esc-va-01", createdBy: "Priya Patel", createdAt: daysAgo(2), updatedAt: daysAgo(1), notes: [] },
  { id: "task-03", state: "NC", title: "Update SOP — VOB intake handoff",         description: "Reflect Solum new fields.",            department: "Operations",     owner: "Sasha Long",  priority: "medium", status: "in_progress", dueAt: daysAhead(4),  createdBy: "Marcus Hill",  createdAt: daysAgo(4), updatedAt: daysAgo(2), notes: [] },
  { id: "task-04", state: "NC", title: "Resubmit denial TRK-99205",               description: "Include updated PR + assessment.",     department: "Authorizations", owner: "Marcus Hill", priority: "high",   status: "open",         dueAt: daysAhead(3),  createdBy: "Marcus Hill",  createdAt: daysAgo(3), updatedAt: daysAgo(3), notes: [] },
  { id: "task-05", state: "GA", title: "Verify Aetna docs — Mia Carter",         description: "Missing signed intake page 2.",         department: "Intake",         owner: "Ashley Tran", priority: "medium", status: "waiting",      dueAt: daysAhead(2),  createdBy: "Ashley Tran",  createdAt: daysAgo(2), updatedAt: daysAgo(1), notes: [] },
];

const activity: ActivityEvent[] = [
  { id: "act-1", state: "VA", kind: "escalation_created", message: "Escalation opened — Hard-to-staff Richmond client",  actor: "Priya Patel", createdAt: daysAgo(3), relatedId: "esc-va-01" },
  { id: "act-2", state: "NC", kind: "escalation_created", message: "Escalation opened — BCBS pediatric ABA denial",      actor: "Marcus Hill", createdAt: daysAgo(5), relatedId: "esc-nc-01" },
  { id: "act-3", state: "VA", kind: "task_created",       message: "Task created — Match RBT to Sophia Reyes",           actor: "Priya Patel", createdAt: daysAgo(2), relatedId: "task-02" },
  { id: "act-4", state: "NC", kind: "task_created",       message: "Task created — Update SOP — VOB intake handoff",     actor: "Marcus Hill", createdAt: daysAgo(4), relatedId: "task-03" },
  { id: "act-5", state: "MD", kind: "escalation_created", message: "Escalation opened — Auth expiring — Baltimore",      actor: "Devon Ross",  createdAt: daysAgo(2), relatedId: "esc-md-01" },
];

export const STATE_DIRECTOR_SEED: StateDirectorSnapshot = {
  profiles,
  metrics,
  escalations,
  tasks,
  activity,
};