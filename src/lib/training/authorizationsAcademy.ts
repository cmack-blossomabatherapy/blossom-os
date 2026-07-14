/**
 * Authorizations Department Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new Authorization Coordinator on today's Blossom auth process
 * using today's tools (Monday / current tracker, CentralReach, payer portals,
 * Outlook / email, Excel / manual trackers) and clean cross-department
 * handoffs (Intake, Clinical/QA, Scheduling, Billing/RCM).
 *
 * Mirrors `recruitingAcademy.ts` so it plugs into the same academy adapter
 * without touching State Director / RBT / BCBA / Intake / Recruiting curricula.
 */

export type AuthLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface AuthLesson {
  id: string;
  title: string;
  summary: string;
  kind: AuthLessonKind;
  minutes: number;
}

export interface AuthResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface AuthorizationsDayModule {
  /** Source module id — becomes `authorizations::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: AuthLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: AuthResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface AuthorizationsWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const AUTHORIZATIONS_WEEKS: AuthorizationsWeek[] = [
  { weekNumber: 1, title: "Week 1 · Authorization Foundations, Welcome, Systems, and Role Boundaries",
    goal: "Understand Blossom, the Authorizations Department's purpose, today's systems, the authorization lifecycle, and basic queue discipline before touching live auth work independently." },
  { weekNumber: 2, title: "Week 2 · Initial / Treatment Auths, Submission, Pending Follow-Up, and Approved Updates",
    goal: "Move from observation into supervised execution of common authorization tasks." },
  { weekNumber: 3, title: "Week 3 · Renewals, Reassessments, Expiring Auths, Denials, Missing Docs, QA, and State Variations",
    goal: "Own more work with review, learn judgment points, and practice escalation and cross-department handoffs." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Queue Quality, Communication, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real authorization work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1Overview: { label: "L1 Overview — Authorizations Current Operations", href: "/resource-library", pending: true },
  l1RoleSop: { label: "L1 Authorizations / Utilization Manager Role SOP", href: "/resource-library", pending: true },
  binder: { label: "Authorizations Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "Authorizations Utilization Manager Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "Authorizations Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l2Initial: { label: "L2 Initial Authorization — Current Operations", href: "/resource-library", pending: true },
  l2InitialSubmit: { label: "L2 Initial Authorization Submission Process SOP", href: "/resource-library", pending: true },
  l2Treatment: { label: "L2 Treatment Authorization — Current Operations", href: "/resource-library", pending: true },
  l2Reassessment: { label: "L2 Reassessment — Current Operations", href: "/resource-library", pending: true },
  l2Renewals: { label: "L2 Renewals — Current Operations", href: "/resource-library", pending: true },
  l2Expiring: { label: "L2 Expiring Authorizations — Current Operations", href: "/resource-library", pending: true },
  l2Denials: { label: "L2 Denials — Current Operations", href: "/resource-library", pending: true },
  l2DenialEsc: { label: "L2 Denial Review and Escalation Process SOP", href: "/resource-library", pending: true },
  l2MissingDocs: { label: "L2 Missing Documentation — Current Operations", href: "/resource-library", pending: true },
  l2QaSubmission: { label: "L2 QA Submission — Current Operations", href: "/resource-library", pending: true },
  l2Pending: { label: "L2 Pending Authorization Follow-Up Process SOP", href: "/resource-library", pending: true },
  l2Approved: { label: "L2 Approved Authorization Update Process SOP", href: "/resource-library", pending: true },
  l2BcbaAssign: { label: "L2 BCBA Assignment Confirmation Process SOP", href: "/resource-library", pending: true },
  l2Primary: { label: "L2 Primary Insurance — Current Operations", href: "/resource-library", pending: true },
  l2Secondary: { label: "L2 Secondary Insurance — Current Operations", href: "/resource-library", pending: true },
  l2Georgia: { label: "L2 Georgia Process — Current Operations", href: "/resource-library", pending: true },
  l2MultiState: { label: "L2 Multi-State Process — Current Operations", href: "/resource-library", pending: true },
  crRef: { label: "CentralReach Authorization Reference", href: "/resource-library", pending: true },
  mondayGuide: { label: "Monday / Auth Tracker Field Guide", href: "/resource-library", pending: true },
  payerPortalGuide: { label: "Payer Portal Guide", href: "/resource-library", pending: true },
  payerChecklist: { label: "Payer-Specific Checklist", href: "/resource-library", pending: true },
  stateReqGuide: { label: "State Authorization Requirements Guide", href: "/resource-library", pending: true },
  qaChecklist: { label: "QA Submission Checklist", href: "/resource-library", pending: true },
  denialTemplate: { label: "Denial Escalation Template", href: "/resource-library", pending: true },
  approvedChecklist: { label: "Approved Authorization Update Checklist", href: "/resource-library", pending: true },
  schedBillHandoff: { label: "Scheduling / Billing Handoff Reference", href: "/resource-library", pending: true },
  commsTemplates: { label: "Cross-Department Communication Templates", href: "/resource-library", pending: true },
  clinicalQaHandoff: { label: "Clinical / QA Handoff Reference", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<AuthorizationsDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): AuthorizationsDayModule {
  return {
    id: `auth-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: AuthorizationsDayModule[] = [
  day(1, 1, 1, {
    title: "Authorizations Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what Authorizations does and why it matters. Authorizations bridges intake, clinical documentation, payer approval, scheduling, and billing. If auths are late, denied, or not updated, families wait and teams lose trust.",
    objectives: [
      "Explain what Authorizations owns and does not own today",
      "Describe the authorization lifecycle end to end",
      "Explain the owner / status / next action / follow-up date rule",
    ],
    lessons: [
      { id: "w1d1-l1", title: "What Authorizations owns today", kind: "Overview", minutes: 10, summary: "Auth readiness, submission, pending follow-up, approval updates, expirations, denials, and status accuracy." },
      { id: "w1d1-l2", title: "What Authorizations does not own", kind: "Overview", minutes: 8, summary: "Not intake conversion, final clinical quality, payroll, recruiting, scheduling execution, staffing execution, or payer contract decisions." },
      { id: "w1d1-l3", title: "The authorization lifecycle", kind: "Workflow", minutes: 12, summary: "Intake / VOB readiness → initial auth → assessment / treatment auth → renewals / reassessments → approval updates → scheduling / billing visibility → denial / escalation if needed." },
    ],
    checklist: [
      "Can explain what Authorizations owns",
      "Can explain what Authorizations does not own",
      "Can describe the basic authorization lifecycle",
      "Can explain the owner / status / next action / follow-up date rule",
    ],
    shadowing: ["Sit with Authorizations Manager, Coordinator, or assigned mentor for 30–60 minutes and watch how they start their auth queue review."],
    livePractice: ["No live authorization ownership yet — observe only."],
    resources: [R.l1Overview, R.l1RoleSop, R.binder, R.roleDeepDive],
    knowledgeCheck: {
      q: "What four things should every auth item have before you leave it?",
      a: "Owner, status, next action, follow-up date. Authorizations does not own clinical quality or contract decisions.",
    },
    reflectionPrompt: "In your own words, why does Authorizations matter to families, clinical teams, scheduling, and billing?",
  }),
  day(1, 2, 2, {
    title: "Current Authorizations Systems Tour — Monday, CentralReach, Payer Portals, Email, Trackers",
    description:
      "Learn every system Authorizations touches today and what each is used for: Monday / current auth tracker, CentralReach, payer portals, Outlook / email, and Excel / manual trackers.",
    objectives: [
      "Identify today's main authorization tools",
      "Locate core auth fields in the current tracker",
      "Explain how CentralReach data is used by Authorizations today",
      "Explain why duplicate or disconnected tracking creates risk",
    ],
    lessons: [
      { id: "w1d2-l1", title: "Monday / Auth tracker basics", kind: "Workflow", minutes: 15, summary: "Client, state, payer, auth type, BCBA, status, submission date, pending date, follow-up date, approval details, missing docs, denial reason, QA status, notes." },
      { id: "w1d2-l2", title: "CentralReach basics for Authorizations", kind: "SOP", minutes: 12, summary: "What auth-related information may need to be verified in CR today." },
      { id: "w1d2-l3", title: "Payer portal basics", kind: "SOP", minutes: 10, summary: "Portals vary by state / payer. Where status is checked today." },
      { id: "w1d2-l4", title: "Outlook / email + Excel manual tracker reality", kind: "SOP", minutes: 8, summary: "Where email communication and manual updates happen and how to avoid drift." },
    ],
    checklist: [
      "Identified main current authorization tools",
      "Located key auth fields in current tracker",
      "Explained each system's purpose",
      "Explained duplicate / disconnected tracking risk",
    ],
    shadowing: ["Watch mentor update one authorization record using CR / payer portal / email information."],
    livePractice: ["Locate 3 sample auth items and point out owner, status, next action, and follow-up date."],
    resources: [R.l1Overview, R.mondayGuide, R.crRef, R.payerPortalGuide, R.l2Pending, R.l2Approved],
    knowledgeCheck: {
      q: "Should an approval be updated only in email and not the current tracker?",
      a: "No. Updates must land in the tracker (and any required CR field) so scheduling / billing / clinical have one source of truth.",
    },
    reflectionPrompt: "Which tracker is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "Authorization Types and Basic Readiness",
    description:
      "Learn the main authorization types and what must be ready before work moves forward.",
    objectives: [
      "Name and distinguish initial, treatment, reassessment, and renewal auths",
      "Run a readiness check against payer, client, BCBA, docs, insurance, and state rules",
      "Identify blockers and route to the correct owner",
    ],
    lessons: [
      { id: "w1d3-l1", title: "Initial authorization", kind: "Overview", minutes: 8, summary: "Purpose and typical readiness inputs." },
      { id: "w1d3-l2", title: "Treatment authorization", kind: "Overview", minutes: 8, summary: "Clinical dependency and typical readiness inputs." },
      { id: "w1d3-l3", title: "Reassessment and renewal / reauthorization", kind: "Overview", minutes: 10, summary: "Ongoing work that keeps services from lapsing." },
      { id: "w1d3-l4", title: "Readiness checklist", kind: "SOP", minutes: 12, summary: "Payer, client details, BCBA assignment, clinical docs, diagnosis / required docs, primary / secondary insurance, and state-specific rules." },
    ],
    checklist: [
      "Explained the major auth types",
      "Completed a supervised readiness review",
      "Identified blockers with correct owner",
    ],
    shadowing: ["Watch mentor review 3 auth items and decide ready / blocked / needs follow-up."],
    livePractice: ["Under mentor supervision, complete readiness review on 3 sample auth items."],
    resources: [R.l2Initial, R.l2Treatment, R.l2Reassessment, R.l2Renewals, R.l2MissingDocs, R.stateReqGuide],
    knowledgeCheck: {
      q: "Should blocked auths have a clear owner and next action?",
      a: "Yes. Blocked auths still keep owner, status, next action, and follow-up date until unblocked.",
    },
    reflectionPrompt: "What can go wrong if an authorization is submitted before it is actually ready?",
  }),
  day(1, 4, 4, {
    title: "BCBA Assignment and Clinical Documentation Dependency",
    description:
      "Learn how BCBA assignment and clinical documentation drive authorization readiness — and how to follow up without owning clinical work.",
    objectives: [
      "Confirm BCBA assignment against the current source of truth",
      "Identify readiness state of clinical documentation",
      "Route missing items to the correct clinical / QA owner",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Why BCBA assignment matters", kind: "Overview", minutes: 8, summary: "Assignment drives clinical accountability, documentation, and payer submission." },
      { id: "w1d4-l2", title: "Confirming BCBA assignment", kind: "SOP", minutes: 10, summary: "Where to verify and how to confirm the assigned BCBA is correct." },
      { id: "w1d4-l3", title: "Progress report / treatment plan dependency", kind: "Workflow", minutes: 12, summary: "What documentation is needed and when." },
      { id: "w1d4-l4", title: "Following up without owning clinical work", kind: "Workflow", minutes: 10, summary: "Drive readiness while keeping ownership with clinical / QA." },
    ],
    checklist: [
      "Confirmed BCBA assignment on sample items",
      "Identified documentation blockers",
      "Routed blocker to correct owner with mentor approval",
    ],
    shadowing: ["Watch mentor confirm BCBA assignment and identify documentation blockers."],
    livePractice: ["Under supervision, review 3 auth items for BCBA assignment and documentation readiness."],
    resources: [R.l2BcbaAssign, R.l2QaSubmission, R.l2MissingDocs, R.clinicalQaHandoff],
    knowledgeCheck: {
      q: "Does Authorizations write the clinical treatment plan?",
      a: "No. Authorizations tracks whether required clinical documentation is ready and routes gaps to clinical / QA.",
    },
    reflectionPrompt: "How can Authorizations follow up on clinical documentation without becoming the clinical owner?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1: Authorizations role, systems, basic auth types, readiness, and role boundaries.",
    objectives: [
      "Review 3 sample auth items with mentor",
      "Explain each item's status and next action",
      "Identify anything still unclear",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering systems, auth type, owner/status/next action, BCBA, docs, and role boundaries." },
      { id: "w1d5-l2", title: "Role boundary check", kind: "Overview", minutes: 8, summary: "Authorizations vs Intake vs Clinical / QA vs Scheduling vs Billing / RCM." },
      { id: "w1d5-l3", title: "Auth queue walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 auth items end to end with mentor." },
      { id: "w1d5-l4", title: "Mentor feedback", kind: "Shadowing", minutes: 10, summary: "What went well, what to sharpen next week." },
    ],
    checklist: [
      "Completed Week 1 quiz",
      "Reviewed 3 auth items with mentor",
      "Can explain current systems and role boundaries",
      "Manager / mentor signoff completed",
    ],
    shadowing: ["Watch end-of-day authorization queue review."],
    livePractice: ["Complete supervised authorization review checklist for 3 auth items."],
    resources: [R.l1Overview, R.l1RoleSop, R.binder],
    knowledgeCheck: {
      q: "What must always be true before you close out an auth item for the day?",
      a: "Owner, status, next action, and follow-up date are set. Nothing is left silently pending.",
    },
    reflectionPrompt: "What part of Authorizations still feels confusing?",
    signoffRequired: "Week 1 manager / mentor signoff required before moving to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: AuthorizationsDayModule[] = [
  day(2, 1, 6, {
    title: "Initial Authorization — Current Process",
    description:
      "Learn how initial authorizations are prepared, submitted, and tracked today.",
    objectives: [
      "Complete an initial-auth readiness check",
      "Understand submission steps through today's payer process",
      "Update the tracker with submission date, status, and follow-up",
    ],
    lessons: [
      { id: "w2d1-l1", title: "Initial authorization purpose", kind: "Overview", minutes: 6, summary: "Why initial auths matter and what they unlock." },
      { id: "w2d1-l2", title: "Initial auth readiness checklist", kind: "SOP", minutes: 12, summary: "Payer, state, client, docs, BCBA, primary / secondary insurance." },
      { id: "w2d1-l3", title: "Initial auth submission steps", kind: "Workflow", minutes: 15, summary: "Observe or perform submission through today's payer portal / process." },
      { id: "w2d1-l4", title: "Initial auth status update", kind: "SOP", minutes: 10, summary: "Update Monday / tracker with submission date, status, next follow-up, notes, owner." },
    ],
    checklist: [
      "Explained initial auth readiness",
      "Completed supervised readiness check",
      "Drafted accurate status / update notes",
    ],
    shadowing: ["Watch mentor prepare and submit or status-check an initial authorization."],
    livePractice: ["Under supervision, complete readiness and draft tracker updates for 2 initial auth items."],
    resources: [R.l2Initial, R.l2InitialSubmit, R.l2Primary, R.l2Secondary, R.payerPortalGuide],
    knowledgeCheck: {
      q: "Should initial-auth submission be tracked with a follow-up date?",
      a: "Yes. Every submission carries a next follow-up date so nothing goes silent.",
    },
    reflectionPrompt: "What information must be correct before an initial authorization is submitted?",
  }),
  day(2, 2, 7, {
    title: "Treatment Authorization — Current Process",
    description:
      "Learn how treatment authorizations are prepared, submitted, and tracked.",
    objectives: [
      "Confirm treatment plan / report readiness",
      "Confirm payer requirements and BCBA assignment",
      "Update tracker with pending / follow-up dates and notes",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Treatment authorization purpose", kind: "Overview", minutes: 6, summary: "Where treatment auths sit in the lifecycle." },
      { id: "w2d2-l2", title: "Required clinical documentation", kind: "SOP", minutes: 12, summary: "Treatment plan / report, supporting docs, payer requirements." },
      { id: "w2d2-l3", title: "Treatment auth submission steps", kind: "Workflow", minutes: 15, summary: "Submit or observe submission through current process." },
      { id: "w2d2-l4", title: "Handoff impact", kind: "Workflow", minutes: 10, summary: "How treatment auth accuracy affects scheduling and services." },
    ],
    checklist: [
      "Explained treatment auth readiness",
      "Identified required documentation",
      "Drafted current-tracker notes with mentor review",
    ],
    shadowing: ["Watch mentor prepare or follow up on a treatment authorization."],
    livePractice: ["Under supervision, complete readiness review on 2 treatment auth items."],
    resources: [R.l2Treatment, R.l2InitialSubmit, R.l2QaSubmission, R.l2MissingDocs],
    knowledgeCheck: {
      q: "Can a treatment auth be clean if clinical documentation is missing?",
      a: "No. Missing clinical items must be routed to the correct owner before or alongside submission.",
    },
    reflectionPrompt: "Why does treatment authorization accuracy matter before scheduling / services move forward?",
  }),
  day(2, 3, 8, {
    title: "Pending Authorization Follow-Up",
    description:
      "Learn how to follow up on pending authorizations without letting items sit or expire.",
    objectives: [
      "Review the pending auth queue with cadence",
      "Check payer portal / call / email for status",
      "Record follow-up attempt, outcome, and next follow-up date",
    ],
    lessons: [
      { id: "w2d3-l1", title: "What pending status means", kind: "Overview", minutes: 6, summary: "Submitted but not yet approved / denied." },
      { id: "w2d3-l2", title: "Follow-up cadence", kind: "SOP", minutes: 10, summary: "Expected payer timing and follow-up rhythm." },
      { id: "w2d3-l3", title: "Payer portal / call / email follow-up", kind: "Workflow", minutes: 15, summary: "Confirm status through today's channels." },
      { id: "w2d3-l4", title: "Updating the tracker", kind: "SOP", minutes: 10, summary: "Log attempt, outcome, next follow-up, and escalation trigger." },
    ],
    checklist: [
      "Reviewed pending auth items",
      "Documented follow-up attempt and outcome",
      "Set next follow-up dates",
    ],
    shadowing: ["Watch mentor process pending auth follow-ups."],
    livePractice: ["Process 3 pending auth follow-up checks under supervision."],
    resources: [R.l2Pending, R.l2Approved, R.payerPortalGuide],
    knowledgeCheck: {
      q: "Should pending status include a next follow-up date?",
      a: "Yes. Pending status without a follow-up date is silent risk.",
    },
    reflectionPrompt: "What happens when pending authorizations do not have reliable follow-up?",
  }),
  day(2, 4, 9, {
    title: "Approved Authorization Updates",
    description:
      "Learn what to do when an authorization is approved and how that impacts scheduling, billing, and service readiness.",
    objectives: [
      "Capture approval details accurately",
      "Update Monday / current tracker and required CR fields",
      "Notify or hand off to scheduling / billing / manager",
    ],
    lessons: [
      { id: "w2d4-l1", title: "What approval means", kind: "Overview", minutes: 6, summary: "Approval unlocks services and billing visibility." },
      { id: "w2d4-l2", title: "Approval details to capture", kind: "SOP", minutes: 12, summary: "Payer, auth number, approved dates, units / hours / services, provider / BCBA, limitations, effective dates." },
      { id: "w2d4-l3", title: "Updating current systems", kind: "Workflow", minutes: 12, summary: "Tracker + CR fields per current process; attach documentation if required." },
      { id: "w2d4-l4", title: "Handoff to scheduling / billing visibility", kind: "Workflow", minutes: 10, summary: "Notify or route to correct owner." },
    ],
    checklist: [
      "Listed approval details to capture",
      "Drafted accurate approved-auth update",
      "Identified correct handoff / notification owner",
    ],
    shadowing: ["Watch mentor process an approved authorization."],
    livePractice: ["Under supervision, review 2 sample approvals and draft update / handoff notes."],
    resources: [R.l2Approved, R.approvedChecklist, R.schedBillHandoff],
    knowledgeCheck: {
      q: "Should approved dates and units / hours be checked carefully?",
      a: "Yes. Approval details drive scheduling and billing — a wrong unit count causes real service and revenue risk.",
    },
    reflectionPrompt: "Why is an approval update not finished until the right systems and people are updated?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description:
      "Complete a supervised mini-shift using current authorization tasks.",
    objectives: [
      "Complete assigned initial / treatment / pending / approved work",
      "Keep every auth item with a next step",
      "Pass mentor quality review",
    ],
    lessons: [
      { id: "w2d5-l1", title: "Initial authorization review", kind: "Workflow", minutes: 15, summary: "Assigned initial-auth tasks under review." },
      { id: "w2d5-l2", title: "Treatment authorization review", kind: "Workflow", minutes: 15, summary: "Assigned treatment-auth tasks under review." },
      { id: "w2d5-l3", title: "Pending follow-up review", kind: "Workflow", minutes: 15, summary: "Follow-up cadence discipline." },
      { id: "w2d5-l4", title: "Approved update review", kind: "Workflow", minutes: 15, summary: "Approval accuracy and handoff quality." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No auth item left without next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list of 5–8 low-risk items."],
    resources: [R.l2Initial, R.l2Treatment, R.l2Pending, R.l2Approved],
    knowledgeCheck: {
      q: "What is the sign your work is ready for review?",
      a: "Every touched auth item has owner, status, next action, and follow-up date — with clean notes.",
    },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 mentor signoff required before moving to Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: AuthorizationsDayModule[] = [
  day(3, 1, 11, {
    title: "Renewals and Reauthorizations",
    description:
      "Learn how renewals / reauths are tracked and prepared so services are not disrupted.",
    objectives: [
      "Review renewal / reauth queue with lead time",
      "Confirm auth end date, required docs, BCBA, and payer requirements",
      "Update tracker with owner, next action, follow-up, and escalation",
    ],
    lessons: [
      { id: "w3d1-l1", title: "Renewal purpose", kind: "Overview", minutes: 6, summary: "Why renewals prevent service interruptions." },
      { id: "w3d1-l2", title: "Renewal timing", kind: "SOP", minutes: 10, summary: "How far in advance renewals must be worked." },
      { id: "w3d1-l3", title: "Required documentation", kind: "SOP", minutes: 10, summary: "Progress / report readiness and payer requirements." },
      { id: "w3d1-l4", title: "Renewal tracker updates", kind: "Workflow", minutes: 12, summary: "Status, owner, next action, follow-up, escalation." },
    ],
    checklist: [
      "Explained renewal timing risk",
      "Reviewed 3 renewal items",
      "Identified missing / delayed documentation",
    ],
    shadowing: ["Watch mentor review renewal / reauth items."],
    livePractice: ["Review 3 renewal items with mentor and recommend next action."],
    resources: [R.l2Renewals, R.l2Expiring, R.l2MissingDocs, R.l2QaSubmission],
    knowledgeCheck: {
      q: "Should renewal work wait until the auth is already expired?",
      a: "No. Renewals are worked with enough lead time to avoid service gaps.",
    },
    reflectionPrompt: "How can late renewals affect families and service continuity?",
  }),
  day(3, 2, 12, {
    title: "Reassessment — Current Process",
    description:
      "Learn how reassessments connect to authorization readiness and ongoing care.",
    objectives: [
      "Identify required reassessment documentation",
      "Follow up on missing documents with the correct owner",
      "Escalate delays threatening authorization timeline",
    ],
    lessons: [
      { id: "w3d2-l1", title: "Reassessment purpose", kind: "Overview", minutes: 6, summary: "Why reassessments drive ongoing auth." },
      { id: "w3d2-l2", title: "Reassessment documentation", kind: "SOP", minutes: 10, summary: "What documentation is required and when." },
      { id: "w3d2-l3", title: "Reassessment → auth workflow", kind: "Workflow", minutes: 12, summary: "How reassessment feeds submission." },
      { id: "w3d2-l4", title: "Escalation for delays", kind: "SOP", minutes: 10, summary: "When and how to escalate documentation delays." },
    ],
    checklist: [
      "Explained reassessment connection to authorization",
      "Identified missing documents",
      "Drafted escalation / follow-up note with mentor approval",
    ],
    shadowing: ["Watch mentor review reassessment items and documentation status."],
    livePractice: ["Review 2 reassessment items and draft next-action notes."],
    resources: [R.l2Reassessment, R.l2MissingDocs, R.l2QaSubmission, R.clinicalQaHandoff],
    knowledgeCheck: {
      q: "Does Authorizations own reassessment clinical content?",
      a: "No. Authorizations tracks whether reassessment documents are ready for auth purposes and routes gaps.",
    },
    reflectionPrompt: "Why does reassessment tracking need strong communication with Clinical / QA?",
  }),
  day(3, 3, 13, {
    title: "Expiring Authorizations and Service-Risk Awareness",
    description:
      "Identify expiring authorizations and prevent preventable service or billing risk.",
    objectives: [
      "Prioritize expiring items by service and billing risk",
      "Confirm renewal / reassessment is already in motion",
      "Escalate urgent risks the same day",
    ],
    lessons: [
      { id: "w3d3-l1", title: "Expiring auth queue", kind: "Workflow", minutes: 12, summary: "Sort and prioritize expiring items." },
      { id: "w3d3-l2", title: "Service and billing risk", kind: "Overview", minutes: 8, summary: "Why expirations threaten families and revenue." },
      { id: "w3d3-l3", title: "Prioritization", kind: "SOP", minutes: 10, summary: "Closest to expiration, missing docs, active services." },
      { id: "w3d3-l4", title: "Same-day escalation", kind: "SOP", minutes: 10, summary: "Escalate urgent risks to manager / clinical / state / scheduling." },
    ],
    checklist: [
      "Audited 5 expiring auth items",
      "Correctly prioritized urgent items",
      "Identified escalation needs",
    ],
    shadowing: ["Watch mentor review the expiring auth queue."],
    livePractice: ["Audit 5 expiring auth items and recommend priority / next action."],
    resources: [R.l2Expiring, R.l2Renewals, R.l2Pending],
    knowledgeCheck: {
      q: "Should expiring auths only be reviewed after services stop?",
      a: "No. Urgent expiring auth risks are worked and escalated the same day.",
    },
    reflectionPrompt: "What makes an expiring authorization urgent?",
  }),
  day(3, 4, 14, {
    title: "Denials, Missing Documentation, and Escalation",
    description:
      "Handle denied authorizations and missing documentation clearly and calmly.",
    objectives: [
      "Document denial reason specifically",
      "Identify next action: appeal, resubmit, missing docs, clinical / QA follow-up, or manager review",
      "Name the exact missing item and owner for documentation gaps",
    ],
    lessons: [
      { id: "w3d4-l1", title: "Denial review basics", kind: "SOP", minutes: 10, summary: "Read the payer response carefully." },
      { id: "w3d4-l2", title: "Denial reason documentation", kind: "SOP", minutes: 10, summary: "Vague 'denied' is not acceptable — capture the reason." },
      { id: "w3d4-l3", title: "Missing documentation workflow", kind: "Workflow", minutes: 12, summary: "Exact missing item + owner + next follow-up." },
      { id: "w3d4-l4", title: "Escalation and follow-up", kind: "SOP", minutes: 10, summary: "When to escalate and to whom." },
    ],
    checklist: [
      "Identified denial reason",
      "Identified missing documentation owner",
      "Drafted clear next-action note",
    ],
    shadowing: ["Watch mentor review a denial or missing-documentation item."],
    livePractice: ["Review 3 denial / missing-doc scenarios and recommend next action."],
    resources: [R.l2Denials, R.l2DenialEsc, R.l2MissingDocs, R.l2QaSubmission, R.denialTemplate],
    knowledgeCheck: {
      q: "Should denial reasons be documented vaguely as 'denied'?",
      a: "No. Denials must include the specific payer reason and the next action / owner.",
    },
    reflectionPrompt: "What makes a denial note useful instead of confusing?",
  }),
  day(3, 5, 15, {
    title: "QA Submission, Georgia Process, Multi-State, and Insurance Variations",
    description:
      "Learn how QA submission, Georgia-specific process, multi-state workflow, and primary / secondary insurance variations affect authorizations.",
    objectives: [
      "Recognize when QA is involved before / after submission",
      "Identify Georgia and multi-state process differences",
      "Confirm primary vs secondary insurance handling",
    ],
    lessons: [
      { id: "w3d5-l1", title: "QA submission awareness", kind: "SOP", minutes: 10, summary: "When QA reviews are part of readiness." },
      { id: "w3d5-l2", title: "Georgia process awareness", kind: "Overview", minutes: 10, summary: "Where GA differs today." },
      { id: "w3d5-l3", title: "Multi-state process awareness", kind: "Overview", minutes: 10, summary: "NC / TN / VA / MD / GA payer / portal variations." },
      { id: "w3d5-l4", title: "Primary / secondary insurance awareness", kind: "SOP", minutes: 10, summary: "When both apply and how it changes readiness." },
    ],
    checklist: [
      "Explained why state / payer differences matter",
      "Identified Georgia / multi-state considerations",
      "Explained when to ask for manager help",
    ],
    shadowing: ["Watch mentor compare two auth workflows from different states / payers."],
    livePractice: ["Review 4 sample auth items and identify state / payer / insurance variation points."],
    resources: [R.l2QaSubmission, R.l2Georgia, R.l2MultiState, R.l2Primary, R.l2Secondary, R.qaChecklist, R.stateReqGuide, R.payerChecklist],
    knowledgeCheck: {
      q: "Should state / payer rules be assumed identical?",
      a: "No. Every state / payer combination may have different portal or documentation logic.",
    },
    reflectionPrompt: "Why can one authorization process not be blindly copied across every payer and state?",
    signoffRequired: "Week 3 mentor signoff required before moving to Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: AuthorizationsDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled Authorization Queue Ownership — Part 1",
    description:
      "Own a small set of real authorization tasks with mentor review.",
    objectives: [
      "Run a morning auth queue review",
      "Prioritize expiring, pending, missing docs, denials, and approvals",
      "End the day with no assigned item lacking a next action",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning auth queue review", kind: "Workflow", minutes: 15, summary: "Structured start-of-day queue check." },
      { id: "w4d1-l2", title: "Prioritizing authorization work", kind: "SOP", minutes: 12, summary: "Risk-based prioritization." },
      { id: "w4d1-l3", title: "Updating current systems", kind: "Workflow", minutes: 15, summary: "Clean tracker + CR updates." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "SOP", minutes: 10, summary: "No stale items, all follow-ups dated." },
    ],
    checklist: [
      "Completed assigned queue",
      "Updated current systems accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned authorization tasks with mentor review."],
    resources: [R.l1Overview, R.l1RoleSop, R.l2Pending, R.l2Expiring],
    knowledgeCheck: {
      q: "How should you end the day on a controlled ownership shift?",
      a: "Every assigned auth item has next action and follow-up date. No silent pending items.",
    },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled Authorization Queue Ownership — Part 2",
    description:
      "Repeat controlled ownership with more independence — midpoint and end-of-day mentor checks only.",
    objectives: [
      "Maintain follow-up discipline without prompting",
      "Document blockers and escalations clearly",
      "Escalate correctly to the right owner",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "Workflow", minutes: 15, summary: "Own the cadence." },
      { id: "w4d2-l2", title: "Documentation accuracy", kind: "SOP", minutes: 12, summary: "Notes that another department can trust." },
      { id: "w4d2-l3", title: "Payer / portal status checks", kind: "Workflow", minutes: 15, summary: "Efficient status confirmation." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Clean escalation to correct owner." },
    ],
    checklist: [
      "Completed queue work",
      "Escalated blockers correctly",
      "No stale / unowned assigned auth item",
    ],
    shadowing: ["Minimal — mentor reviews at midpoint and end of day."],
    livePractice: ["Own 10–15 assigned authorization tasks."],
    resources: [R.l2Pending, R.l2DenialEsc, R.l2MissingDocs, R.l2Approved],
    knowledgeCheck: {
      q: "When you escalate a blocker, what must the note contain?",
      a: "What happened, what is missing, who owns it, and when follow-up is due.",
    },
    reflectionPrompt: "What did you escalate and why?",
  }),
  day(4, 3, 18, {
    title: "Cross-Department Communication Quality Day",
    description:
      "Focus on clear communication with Intake, Clinical / QA, State Ops, Scheduling, Billing / RCM, and managers.",
    objectives: [
      "Write clear status notes with owner, date, and next action",
      "Avoid vague notes like 'checking' or 'waiting'",
      "Communicate urgency when services or billing are at risk",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Clear auth notes", kind: "SOP", minutes: 10, summary: "Specific, actionable, dated." },
      { id: "w4d3-l2", title: "Handoff to Clinical / QA", kind: "Workflow", minutes: 12, summary: "Route documentation gaps cleanly." },
      { id: "w4d3-l3", title: "Handoff to Scheduling / Billing visibility", kind: "Workflow", minutes: 12, summary: "Close the loop after approval." },
      { id: "w4d3-l4", title: "Escalation tone and urgency", kind: "SOP", minutes: 10, summary: "Calm, specific, actionable." },
    ],
    checklist: [
      "Drafted 5 clear notes / handoffs",
      "Mentor approved tone and specificity",
      "Correct owner / date / next action included",
    ],
    shadowing: ["Mentor reviews written updates and handoffs."],
    livePractice: ["Draft 5 auth update / handoff notes for mentor review."],
    resources: [R.l2Approved, R.l2MissingDocs, R.l2QaSubmission, R.commsTemplates, R.schedBillHandoff],
    knowledgeCheck: {
      q: "What makes another department trust the information in your auth note?",
      a: "Specificity: what happened, what is missing, who owns it, when follow-up is due.",
    },
    reflectionPrompt: "What kind of auth note makes another department trust the information?",
  }),
  day(4, 4, 19, {
    title: "End-to-End Authorization Simulation",
    description:
      "Complete a full authorization simulation from readiness through submission / follow-up / approval or escalation.",
    objectives: [
      "Complete readiness → submission → follow-up → approval / denial → handoff",
      "Apply payer / state considerations",
      "Pass mentor review against checklist",
    ],
    lessons: [
      { id: "w4d4-l1", title: "Readiness simulation", kind: "Workflow", minutes: 15, summary: "Confirm all inputs." },
      { id: "w4d4-l2", title: "Initial / treatment submission simulation", kind: "Workflow", minutes: 15, summary: "Submit through current process." },
      { id: "w4d4-l3", title: "Pending follow-up simulation", kind: "Workflow", minutes: 12, summary: "Follow-up cadence." },
      { id: "w4d4-l4", title: "Approval / denial + handoff simulation", kind: "Workflow", minutes: 15, summary: "Close the loop." },
    ],
    checklist: [
      "Completed full simulation",
      "Passed mentor review",
      "Completed real task set",
    ],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1RoleSop, R.l2Initial, R.l2Treatment, R.l2Pending, R.l2Approved, R.l2Denials, R.payerPortalGuide, R.stateReqGuide],
    knowledgeCheck: {
      q: "What part of the full auth process should you still practice?",
      a: "Any step the learner cannot execute end-to-end without prompting — call it out and schedule reps.",
    },
    reflectionPrompt: "What part of the full auth process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description:
      "Complete final review; manager determines readiness for ongoing authorization ownership and sets a 30-day plan.",
    objectives: [
      "Complete final knowledge review",
      "Have a readiness conversation with manager",
      "Create a 30-day growth plan",
    ],
    lessons: [
      { id: "w4d5-l1", title: "Final knowledge review", kind: "Quiz", minutes: 20, summary: "10–15 questions covering the full journey." },
      { id: "w4d5-l2", title: "Readiness conversation", kind: "Workflow", minutes: 15, summary: "What can be owned independently vs still reviewed." },
      { id: "w4d5-l3", title: "Strengths and coaching areas", kind: "Overview", minutes: 10, summary: "Name 2 strengths and 2 coaching areas." },
      { id: "w4d5-l4", title: "Next 30-day growth plan", kind: "Workflow", minutes: 15, summary: "Concrete targets for the first month of independent work." },
    ],
    checklist: [
      "Completed all modules",
      "Completed final quiz",
      "Manager signoff completed",
      "Next 30-day plan created",
    ],
    shadowing: ["End-of-journey manager review."],
    livePractice: ["Learner runs a short auth queue review while manager observes."],
    resources: [R.l1RoleSop, R.role306090, R.roleDeepDive, R.l2Initial, R.l2Treatment, R.l2Renewals, R.l2Denials, R.l2Approved],
    knowledgeCheck: {
      q: "Final: name any 3 of — auth lifecycle, current systems, owner/status/next action/follow-up, initial auth, treatment auth, BCBA assignment, missing docs, pending follow-up, approved update, renewals, expiring, reassessment, denials, QA submission, state / payer awareness, handoffs.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about Authorizations that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into independent ownership with a 30-day plan.",
  }),
];

export const AUTHORIZATIONS_DAYS: AuthorizationsDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getAuthorizationsDay(sourceModuleId: string): AuthorizationsDayModule | undefined {
  return AUTHORIZATIONS_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalAuthorizationsMinutes(): number {
  return AUTHORIZATIONS_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}