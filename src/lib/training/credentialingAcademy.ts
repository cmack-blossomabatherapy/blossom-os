/**
 * Credentialing Team Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new Credentialing team member on today's Blossom credentialing
 * process using current tools (Monday/current trackers, Excel/current
 * credentialing trackers, payer portals, Outlook/email, CentralReach-related
 * visibility, TMS/billing trackers) and clean cross-department handoffs to
 * Authorizations, Billing/RCM, HR, Clinical, State Ops, and Finance.
 *
 * Mirrors `hrAcademy.ts` so it plugs into the same academy adapter without
 * touching other role/department curricula.
 */

export type CredentialingLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface CredentialingLesson {
  id: string;
  title: string;
  summary: string;
  kind: CredentialingLessonKind;
  minutes: number;
}

export interface CredentialingResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface CredentialingDayModule {
  /** Source module id — becomes `credentialing::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: CredentialingLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: CredentialingResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface CredentialingWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const CREDENTIALING_WEEKS: CredentialingWeek[] = [
  { weekNumber: 1, title: "Week 1 · Credentialing Foundations, Welcome, Current Systems, and Role Boundaries",
    goal: "Understand Blossom, what Credentialing owns today, current systems, confidentiality, provider/payer readiness, and how credentialing impacts authorizations, billing, RCM, and state growth." },
  { weekNumber: 2, title: "Week 2 · Status Tracking, Missing Items, Payer Follow-Up, and Billing/Auth Visibility",
    goal: "Move from observation into supervised execution of common credentialing tracking and follow-up tasks." },
  { weekNumber: 3, title: "Week 3 · State/Payer Variation, Authorizations Impact, HR/Clinical Handoffs, Renewals, and Escalations",
    goal: "Own more work with review, learn judgment points, and practice clean cross-department handoffs." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Communication Quality, Simulation, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real credentialing work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1CredSop: { label: "L1 Credentialing Specialist Role SOP", href: "/resource-library", pending: true },
  binder: { label: "Finance RCM Billing and Credentialing Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "Credentialing Specialist Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "Credentialing Specialist Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l2StatusTracking: { label: "L2 Credentialing Status Tracking Process SOP", href: "/resource-library", pending: true },
  l1RcmDir: { label: "L1 Director of RCM Role SOP", href: "/resource-library", pending: true },
  l1FinCtrl: { label: "L1 Finance Controller Role SOP", href: "/resource-library", pending: true },
  l2Billing: { label: "L2 Billing Current Operations", href: "/resource-library", pending: true },
  l2Collections: { label: "L2 RCM Collections Review Process SOP", href: "/resource-library", pending: true },
  l2FinCase: { label: "L2 Financial Case Approval and VOB Process SOP", href: "/resource-library", pending: true },
  l2InsBenefits: { label: "L2 Insurance and Benefits Handoff Process SOP", href: "/resource-library", pending: true },
  l2LeadBenefits: { label: "L2 Lead Benefits Cheat Sheet Match Process SOP", href: "/resource-library", pending: true },
  l2BcbaAssign: { label: "L2 BCBA Assignment Confirmation Process SOP", href: "/resource-library", pending: true },
  l2PrimaryIns: { label: "L2 Primary Insurance Current Operations", href: "/resource-library", pending: true },
  l2SecondaryIns: { label: "L2 Secondary Insurance Current Operations", href: "/resource-library", pending: true },
  l2GaIns: { label: "L2 Georgia Insurance Current State Operations", href: "/resource-library", pending: true },
  l2MdIns: { label: "L2 Maryland Insurance Current State Operations", href: "/resource-library", pending: true },
  l2NcIns: { label: "L2 North Carolina Insurance Current State Operations", href: "/resource-library", pending: true },
  l2TnIns: { label: "L2 Tennessee Insurance Current State Operations", href: "/resource-library", pending: true },
  l2VaIns: { label: "L2 Virginia Insurance Current State Operations", href: "/resource-library", pending: true },
  l1AuthMgr: { label: "L1 Authorizations / Utilization Manager Role SOP", href: "/resource-library", pending: true },
  l2InitialAuth: { label: "L2 Initial Authorization Current Operations", href: "/resource-library", pending: true },
  l1HrSop: { label: "L1 HR / People Operations Role SOP", href: "/resource-library", pending: true },
  l1BcbaSup: { label: "L1 BCBA Clinical Supervisor Role SOP", href: "/resource-library", pending: true },
  trackerGuide: { label: "Current Credentialing Tracker Guide", href: "/resource-library", pending: true },
  payerGuide: { label: "Payer Portal Guide", href: "/resource-library", pending: true },
  providerChecklist: { label: "Provider/BCBA Credentialing Checklist", href: "/resource-library", pending: true },
  payerEnrollChecklist: { label: "Payer Enrollment Checklist", href: "/resource-library", pending: true },
  caqhRef: { label: "CAQH / NPI / License Reference", href: "/resource-library", pending: true },
  tmsGuide: { label: "TMS / Billing Tracker Guide", href: "/resource-library", pending: true },
  rcmTemplate: { label: "RCM / Billing Handoff Template", href: "/resource-library", pending: true },
  authTemplate: { label: "Authorizations Handoff Template", href: "/resource-library", pending: true },
  hrClinTemplate: { label: "HR / Clinical Missing-Info Request Template", href: "/resource-library", pending: true },
  stateReqGuide: { label: "State/Payer Credentialing Requirements Guide", href: "/resource-library", pending: true },
  maintTracker: { label: "Credentialing Maintenance / Expiration Tracker", href: "/resource-library", pending: true },
  orgChart: { label: "Company Org Chart / Hierarchy", href: "/resource-library", pending: true },
  hipaa: { label: "Confidentiality / HIPAA Guidance", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<CredentialingDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): CredentialingDayModule {
  return {
    id: `cred-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: CredentialingDayModule[] = [
  day(1, 1, 1, {
    title: "Credentialing Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what Credentialing does and why it matters. Credentialing makes sure Blossom can bill properly and use the right providers with the right payers/states. If credentialing status is unclear, authorizations get stuck, claims deny, collections slow down, and leaders cannot confidently grow a state or assign providers.",
    objectives: [
      "Explain what Credentialing owns and does not own today",
      "Describe the credentialing lifecycle end-to-end",
      "Explain the owner / status / next action / follow-up date rule",
      "Explain the confidentiality and accuracy standards",
    ],
    lessons: [
      { id: "w1d1-l1", title: "What Credentialing owns today", kind: "Overview", minutes: 10, summary: "Provider/BCBA info collection, payer enrollment/status tracking, missing item follow-up, payer portal review, effective date confirmation, billing/RCM visibility, auth impact, renewals." },
      { id: "w1d1-l2", title: "What Credentialing does not own", kind: "Overview", minutes: 8, summary: "Not clinical supervision, auth submission, billing collections, payroll, HR onboarding compliance, or payer contract decisions." },
      { id: "w1d1-l3", title: "Credentialing lifecycle overview", kind: "Workflow", minutes: 10, summary: "Provider info → payer enrollment → status tracking → missing-item follow-up → effective date/status → billing/auth visibility → renewals." },
      { id: "w1d1-l4", title: "Confidentiality and accuracy standards", kind: "SOP", minutes: 10, summary: "Provider/payer information is sensitive; nothing should sit without owner, status, next action, and follow-up date." },
    ],
    checklist: [
      "Can explain what Credentialing owns",
      "Can explain what Credentialing does not own",
      "Can explain why credentialing affects authorizations, billing, and collections",
      "Can describe the basic credentialing lifecycle",
    ],
    shadowing: ["Sit with Credentialing lead, Devorah/credentialing oversight owner, RCM leader, or assigned mentor for 30–60 minutes and watch how they review credentialing status items."],
    livePractice: ["No live credentialing ownership yet — observe only."],
    resources: [R.l1CredSop, R.binder, R.roleDeepDive, R.l2StatusTracking, R.hipaa],
    knowledgeCheck: {
      q: "What four things should every credentialing item have before you leave it?",
      a: "Owner, status, next action, follow-up date. Credentialing does not own clinical supervision or auth submission.",
    },
    reflectionPrompt: "In your own words, why does Credentialing matter to Blossom's ability to bill cleanly and grow states?",
  }),
  day(1, 2, 2, {
    title: "Current Credentialing Systems Tour — Trackers, Payer Portals, Outlook, TMS/Billing, CentralReach Awareness",
    description:
      "Learn today's systems: Monday/Excel credentialing trackers, payer portals, Outlook/email, TMS/billing tracker visibility, and CentralReach provider/client awareness.",
    objectives: [
      "Identify today's main credentialing tools",
      "Locate key credentialing status fields",
      "Explain what payer portals are used for",
      "Explain why credentialing / billing / auth visibility must stay aligned",
    ],
    lessons: [
      { id: "w1d2-l1", title: "Current credentialing tracker basics", kind: "SOP", minutes: 12, summary: "Provider/BCBA, state, payer, status, effective date, missing items, follow-up, owner, notes, billing/auth impact." },
      { id: "w1d2-l2", title: "Payer portal basics", kind: "Overview", minutes: 10, summary: "Each payer uses different status language and workflows." },
      { id: "w1d2-l3", title: "Outlook / email communication basics", kind: "SOP", minutes: 8, summary: "Professional payer / cross-department communication norms." },
      { id: "w1d2-l4", title: "TMS / billing tracker visibility", kind: "Workflow", minutes: 10, summary: "Where credentialing status affects billing or claim issues." },
      { id: "w1d2-l5", title: "CentralReach provider/client awareness", kind: "Overview", minutes: 8, summary: "CentralReach is for provider/client visibility only — not a replacement credentialing system." },
    ],
    checklist: [
      "Identified main current credentialing tools",
      "Found key credentialing status fields",
      "Explained what payer portals are used for",
      "Explained why credentialing/billing/auth visibility must stay aligned",
    ],
    shadowing: ["Watch mentor review one credentialing item across current tracker, payer/email information, and billing/RCM visibility."],
    livePractice: ["In training/sandbox or with mentor supervision, locate 3 sample credentialing items and point out owner/status/next action/follow-up date."],
    resources: [R.l2StatusTracking, R.l1CredSop, R.l2Billing, R.l1RcmDir, R.trackerGuide, R.payerGuide, R.tmsGuide],
    knowledgeCheck: {
      q: "Are payer portals part of today's credentialing reality, and can credentialing status affect billing/RCM?",
      a: "Yes to both. Payer status must never be left undocumented after a follow-up.",
    },
    reflectionPrompt: "Which credentialing system or tracker is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "Provider / BCBA Credentialing Basics",
    description:
      "Learn what provider/BCBA credentialing means and what information commonly matters — license, NPI, CAQH if used, state/payer requirements, effective dates, and payer-specific forms.",
    objectives: [
      "Explain provider/BCBA credentialing basics",
      "Identify common data/document categories",
      "Mark and route missing information to the correct owner",
    ],
    lessons: [
      { id: "w1d3-l1", title: "Provider profile basics", kind: "Overview", minutes: 8, summary: "What a provider/BCBA credentialing profile contains." },
      { id: "w1d3-l2", title: "BCBA credentialing awareness", kind: "SOP", minutes: 10, summary: "Credentialing tracks readiness — Clinical owns supervision and clinical quality." },
      { id: "w1d3-l3", title: "Common credentialing data points", kind: "SOP", minutes: 12, summary: "License/credential, NPI, CAQH, malpractice, state/payer requirements, contact info, effective dates, payer forms." },
      { id: "w1d3-l4", title: "Missing information follow-up", kind: "Workflow", minutes: 10, summary: "Route missing items to HR, Clinical, provider/BCBA, manager, or RCM/Billing." },
    ],
    checklist: [
      "Can explain provider/BCBA credentialing basics",
      "Reviewed 3 sample provider profiles",
      "Correctly identified missing/unclear credentialing information",
    ],
    shadowing: ["Watch mentor review a provider/BCBA credentialing profile."],
    livePractice: ["Under mentor supervision, review 3 sample provider/BCBA credentialing profiles and identify missing or unclear items."],
    resources: [R.l1CredSop, R.l2StatusTracking, R.l1BcbaSup, R.providerChecklist, R.caqhRef],
    knowledgeCheck: {
      q: "Does Credentialing own clinical supervision of the BCBA?",
      a: "No. Credentialing tracks readiness; Clinical owns supervision and clinical quality requirements.",
    },
    reflectionPrompt: "What can go wrong if a provider's payer credentialing status is unclear?",
  }),
  day(1, 4, 4, {
    title: "Payer Enrollment / Panel Status Basics",
    description:
      "Learn how payer enrollment or panel status affects whether services can be billed and how status must be tracked.",
    objectives: [
      "Identify common payer status terms",
      "Capture effective dates and limitations when available",
      "Document payer follow-up attempts, outcomes, and next follow-up dates",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Payer enrollment basics", kind: "Overview", minutes: 8, summary: "Why enrollment/panel status matters for billing." },
      { id: "w1d4-l2", title: "Panel status terms", kind: "SOP", minutes: 12, summary: "Not started, info needed, submitted, pending, approved/active, denied, terminated, revalidation, manager review." },
      { id: "w1d4-l3", title: "Effective date awareness", kind: "SOP", minutes: 8, summary: "Effective dates determine when billing can occur." },
      { id: "w1d4-l4", title: "Payer follow-up documentation", kind: "Workflow", minutes: 12, summary: "Capture attempt, outcome, next action, next follow-up date." },
    ],
    checklist: [
      "Can explain common payer status terms",
      "Reviewed 5 payer status examples",
      "Documented next action/follow-up correctly",
    ],
    shadowing: ["Watch mentor review payer status and update current tracker."],
    livePractice: ["Review 5 payer status examples and recommend next action."],
    resources: [R.l2StatusTracking, R.l2PrimaryIns, R.l2SecondaryIns, R.l2Collections, R.payerEnrollChecklist],
    knowledgeCheck: {
      q: "Should approved/active status include the effective date when available, and should pending items have follow-up dates?",
      a: "Yes to both.",
    },
    reflectionPrompt: "Why do effective dates and payer status wording matter so much?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1: Credentialing role, systems, provider/payer basics, confidentiality, and role boundaries.",
    objectives: [
      "Review 3 sample credentialing items with mentor",
      "Explain status, next action, owner, missing info, and payer/provider impact",
      "Identify anything unclear",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering provider/payer status, owner/status/next action, confidentiality, systems, billing/auth impact, role boundaries." },
      { id: "w1d5-l2", title: "Credentialing role boundary check", kind: "Overview", minutes: 8, summary: "Credentialing vs Auth vs Billing/RCM vs HR vs Clinical vs State Ops." },
      { id: "w1d5-l3", title: "Provider/payer status walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 items end-to-end with mentor." },
      { id: "w1d5-l4", title: "Mentor feedback", kind: "Shadowing", minutes: 10, summary: "Strengths and coaching areas for Week 2." },
    ],
    checklist: [
      "Completed Week 1 quiz",
      "Reviewed 3 credentialing items with mentor",
      "Can explain current systems and role boundaries",
      "Manager / mentor signoff completed",
    ],
    shadowing: ["Watch end-of-day credentialing status review."],
    livePractice: ["Complete supervised credentialing review checklist for 3 items."],
    resources: [R.l1CredSop, R.l2StatusTracking, R.binder],
    knowledgeCheck: {
      q: "What must always be true before you close out a credentialing item for the day?",
      a: "Owner, status, next action, and follow-up date are set; sensitive info stays need-to-know.",
    },
    reflectionPrompt: "What part of Credentialing still feels confusing?",
    signoffRequired: "Week 1 manager / mentor signoff required before moving to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: CredentialingDayModule[] = [
  day(2, 1, 6, {
    title: "Credentialing Status Tracking Process",
    description: "Learn the exact discipline of keeping credentialing statuses current and useful.",
    objectives: [
      "Confirm required status fields on every item",
      "Write clear notes with what happened, what's needed, owner, and follow-up",
      "Avoid vague notes like 'checking' or 'pending' without details",
    ],
    lessons: [
      { id: "w2d1-l1", title: "Status tracking purpose", kind: "Overview", minutes: 6, summary: "Why current status is Credentialing's most important output." },
      { id: "w2d1-l2", title: "Required status fields", kind: "SOP", minutes: 12, summary: "Provider/BCBA, payer, state, status, last update, next follow-up, missing items, effective date, impact." },
      { id: "w2d1-l3", title: "Follow-up cadence", kind: "Workflow", minutes: 10, summary: "How often to follow up based on status and urgency." },
      { id: "w2d1-l4", title: "Status note quality", kind: "SOP", minutes: 12, summary: "Specific, dated, actionable notes." },
    ],
    checklist: [
      "Reviewed 5 credentialing status items",
      "Drafted clear status notes",
      "Added owner/status/next action/follow-up date",
    ],
    shadowing: ["Watch mentor update credentialing status items."],
    livePractice: ["Under supervision, update or draft updates for 5 credentialing items."],
    resources: [R.l2StatusTracking, R.trackerGuide, R.l1CredSop],
    knowledgeCheck: {
      q: "Should status notes say only 'pending' without a next action?",
      a: "No. Every pending item needs specific next action and follow-up date.",
    },
    reflectionPrompt: "What makes a credentialing note actually useful?",
  }),
  day(2, 2, 7, {
    title: "Missing Information Workflow",
    description: "Identify and follow up on missing credentialing information cleanly.",
    objectives: [
      "Identify exact missing items",
      "Determine correct owner: provider, HR, Clinical, manager, RCM, or payer",
      "Draft clear requests with follow-up dates",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Missing item types", kind: "Overview", minutes: 8, summary: "License, NPI, CAQH, forms, attestations, contact info, payer-specific." },
      { id: "w2d2-l2", title: "Owner identification", kind: "SOP", minutes: 10, summary: "Who owns each type of missing item." },
      { id: "w2d2-l3", title: "Requesting missing information", kind: "SOP", minutes: 12, summary: "Approved wording, tone, and specifics." },
      { id: "w2d2-l4", title: "Escalation for delays", kind: "Workflow", minutes: 10, summary: "When and how to escalate stalled requests." },
    ],
    checklist: [
      "Identified exact missing items",
      "Assigned correct owner",
      "Drafted clear follow-up requests",
    ],
    shadowing: ["Watch mentor handle missing credentialing information."],
    livePractice: ["Review 5 missing-item scenarios and draft follow-up requests."],
    resources: [R.l2StatusTracking, R.hrClinTemplate, R.providerChecklist],
    knowledgeCheck: {
      q: "Should missing information be written as 'need docs' only, and should each missing item have an owner?",
      a: "No to vague notes; yes — every missing item must have an owner.",
    },
    reflectionPrompt: "How can vague missing-item tracking slow down authorizations or billing?",
  }),
  day(2, 3, 8, {
    title: "Payer Portal and Email Follow-Up",
    description: "Learn today's payer follow-up process and how to document it.",
    objectives: [
      "Complete payer portal / email follow-up",
      "Capture exact payer status wording and reference numbers",
      "Escalate unclear payer responses",
    ],
    lessons: [
      { id: "w2d3-l1", title: "Payer portal follow-up", kind: "SOP", minutes: 12, summary: "Where to look and what to capture." },
      { id: "w2d3-l2", title: "Email / Outlook follow-up", kind: "SOP", minutes: 10, summary: "Professional payer email norms and cadence." },
      { id: "w2d3-l3", title: "Phone follow-up if used", kind: "SOP", minutes: 8, summary: "Documenting call outcomes and reference numbers." },
      { id: "w2d3-l4", title: "Follow-up outcome documentation", kind: "Workflow", minutes: 10, summary: "Exact wording, next action, next follow-up date." },
    ],
    checklist: [
      "Completed 3 payer follow-up examples",
      "Captured exact payer status/outcome",
      "Set next follow-up",
    ],
    shadowing: ["Watch mentor complete payer portal/email follow-up."],
    livePractice: ["Process 3 payer follow-up examples under supervision."],
    resources: [R.l2StatusTracking, R.payerGuide],
    knowledgeCheck: {
      q: "Should payer follow-up outcomes be documented the same day, and should unclear responses be escalated?",
      a: "Yes to both.",
    },
    reflectionPrompt: "Why is exact payer wording better than summarizing too loosely?",
  }),
  day(2, 4, 9, {
    title: "Billing / RCM Visibility",
    description: "Learn how credentialing status affects billing, collections, denials, and RCM visibility.",
    objectives: [
      "Identify when credentialing may cause or contribute to a billing issue",
      "Gather exact payer/provider/status details before escalating",
      "Send clean handoffs to RCM/Billing/Finance",
    ],
    lessons: [
      { id: "w2d4-l1", title: "Credentialing impact on billing", kind: "Overview", minutes: 8, summary: "Enrollment/status gaps cause denials and collection delays." },
      { id: "w2d4-l2", title: "TMS / billing tracker awareness", kind: "SOP", minutes: 10, summary: "Where credentialing intersects billing visibility." },
      { id: "w2d4-l3", title: "RCM escalation criteria", kind: "SOP", minutes: 12, summary: "What warrants escalation to Director of RCM / Controller / Finance." },
      { id: "w2d4-l4", title: "Clean handoff to Billing/RCM", kind: "Workflow", minutes: 10, summary: "Specific, dated, actionable handoff notes." },
    ],
    checklist: [
      "Reviewed 3 billing/RCM visibility scenarios",
      "Identified whether credentialing was involved",
      "Drafted clear RCM handoff",
    ],
    shadowing: ["Watch mentor review a credentialing-related billing visibility issue."],
    livePractice: ["Review 3 credentialing-to-billing scenarios and recommend next action."],
    resources: [R.l1RcmDir, R.l2Billing, R.l2Collections, R.l2StatusTracking, R.rcmTemplate],
    knowledgeCheck: {
      q: "Can credentialing status affect claims and collections, and should Billing/RCM receive vague handoffs?",
      a: "Yes it can; no — handoffs must be specific and dated.",
    },
    reflectionPrompt: "How can credentialing tracking help Billing/RCM act faster?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description: "Complete a supervised mini-shift using current credentialing tasks.",
    objectives: [
      "Run 5–8 low-risk credentialing tasks with mentor review",
      "Confirm every item has next step, owner, and follow-up",
      "Keep confidentiality end-to-end",
    ],
    lessons: [
      { id: "w2d5-l1", title: "Status tracking review", kind: "Live Practice", minutes: 12, summary: "Move status items forward accurately." },
      { id: "w2d5-l2", title: "Missing information review", kind: "Live Practice", minutes: 10, summary: "Draft and route missing-info requests." },
      { id: "w2d5-l3", title: "Payer follow-up review", kind: "Live Practice", minutes: 10, summary: "Document payer outcomes cleanly." },
      { id: "w2d5-l4", title: "Billing/RCM visibility review", kind: "Reflection", minutes: 10, summary: "Mentor reviews written handoffs." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No credentialing item left without next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list."],
    resources: [R.l2StatusTracking, R.l2Billing, R.l1RcmDir],
    knowledgeCheck: {
      q: "What must always be true at the end of a mini-shift?",
      a: "Every item has owner, status, next action, and follow-up date; sensitive info stays need-to-know.",
    },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 manager / mentor signoff required before moving to Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: CredentialingDayModule[] = [
  day(3, 1, 11, {
    title: "State and Payer Variation",
    description: "Learn why credentialing varies by state and payer and why assumptions create risk.",
    objectives: [
      "Identify state/payer variation points",
      "Avoid one-size-fits-all assumptions",
      "Escalate unclear requirements to manager / oversight",
    ],
    lessons: [
      { id: "w3d1-l1", title: "State-specific credentialing awareness", kind: "SOP", minutes: 10, summary: "State-specific insurance/payer notes and requirements." },
      { id: "w3d1-l2", title: "Payer-specific differences", kind: "Overview", minutes: 10, summary: "Each payer has different forms, panels, and status wording." },
      { id: "w3d1-l3", title: "Insurance / state operations references", kind: "SOP", minutes: 12, summary: "Where to look up state/payer specifics." },
      { id: "w3d1-l4", title: "When to ask for manager review", kind: "Workflow", minutes: 8, summary: "Escalate rather than guess on state/payer requirements." },
    ],
    checklist: [
      "Reviewed 5 state/payer examples",
      "Identified state/payer variation",
      "Escalated uncertain items appropriately",
    ],
    shadowing: ["Watch mentor compare credentialing items from two states/payers."],
    livePractice: ["Review 5 state/payer examples and identify variation points."],
    resources: [R.l2GaIns, R.l2MdIns, R.l2NcIns, R.l2TnIns, R.l2VaIns, R.l2StatusTracking, R.stateReqGuide],
    knowledgeCheck: {
      q: "Should payer/state requirements be assumed identical, and should variation be documented?",
      a: "No to assumptions; yes — always document state/payer variation.",
    },
    reflectionPrompt: "Why can credentialing not be handled as one identical process for every state and payer?",
  }),
  day(3, 2, 12, {
    title: "Authorizations Impact and Provider Readiness",
    description: "Learn how credentialing status can affect authorizations and provider assignment visibility.",
    objectives: [
      "Identify credentialing impact on auth/provider assignment",
      "Communicate status to Authorizations clearly",
      "Do not take over auth submission — provide status and blockers",
    ],
    lessons: [
      { id: "w3d2-l1", title: "Credentialing and authorization connection", kind: "Overview", minutes: 8, summary: "Auth work depends on provider/payer readiness." },
      { id: "w3d2-l2", title: "BCBA assignment awareness", kind: "SOP", minutes: 10, summary: "Which provider can be assigned depends on credentialing status." },
      { id: "w3d2-l3", title: "Provider readiness for auth", kind: "Workflow", minutes: 12, summary: "What Auth needs from Credentialing to move forward." },
      { id: "w3d2-l4", title: "Authorizations handoff", kind: "SOP", minutes: 10, summary: "Clean, specific credentialing status handoff." },
    ],
    checklist: [
      "Reviewed 4 auth/provider readiness scenarios",
      "Identified credentialing impact",
      "Drafted clear Authorizations handoff",
    ],
    shadowing: ["Watch mentor review a credentialing/auth impact scenario."],
    livePractice: ["Review 4 auth/provider-readiness scenarios and draft Authorizations handoff notes."],
    resources: [R.l2BcbaAssign, R.l1AuthMgr, R.l2InitialAuth, R.l2StatusTracking, R.authTemplate],
    knowledgeCheck: {
      q: "Does Credentialing submit authorizations by default, and should Authorizations receive exact credentialing blocker/status when relevant?",
      a: "No to submission; yes — Authorizations always needs the exact blocker/status.",
    },
    reflectionPrompt: "What does Authorizations need to know from Credentialing?",
  }),
  day(3, 3, 13, {
    title: "HR and Clinical Handoffs",
    description: "Coordinate with HR and Clinical when provider/employee information is missing or unclear.",
    objectives: [
      "Identify correct owner: HR, Clinical, provider, or Credentialing",
      "Draft clear, professional, confidential requests",
      "Track follow-up and escalation",
    ],
    lessons: [
      { id: "w3d3-l1", title: "HR handoff for employee/provider info", kind: "SOP", minutes: 10, summary: "What HR owns vs what Credentialing needs." },
      { id: "w3d3-l2", title: "Clinical handoff for BCBA/provider info", kind: "SOP", minutes: 10, summary: "How to request info from Clinical without overreach." },
      { id: "w3d3-l3", title: "Confidentiality in cross-department requests", kind: "SOP", minutes: 10, summary: "Share only what's needed to move the item forward." },
      { id: "w3d3-l4", title: "Follow-up and escalation", kind: "Workflow", minutes: 10, summary: "Track follow-ups and escalate stalls." },
    ],
    checklist: [
      "Drafted 5 clear handoff requests",
      "Identified correct owner",
      "Included due date / context / follow-up",
    ],
    shadowing: ["Watch mentor request missing provider/employee information."],
    livePractice: ["Draft 5 HR/Clinical credentialing requests for mentor review."],
    resources: [R.l1HrSop, R.l1BcbaSup, R.l2StatusTracking, R.hrClinTemplate],
    knowledgeCheck: {
      q: "Should credentialing requests include the exact missing item, and should sensitive info be overshared?",
      a: "Yes to specifics; no to oversharing — need-to-know only.",
    },
    reflectionPrompt: "How can Credentialing ask for information clearly without exposing unnecessary sensitive details?",
  }),
  day(3, 4, 14, {
    title: "Credentialing Maintenance, Expirations, and Revalidations",
    description: "Ongoing credentialing maintenance prevents future problems.",
    objectives: [
      "Track expiration and revalidation dates",
      "Set proactive follow-up before deadlines",
      "Escalate late or high-risk items",
    ],
    lessons: [
      { id: "w3d4-l1", title: "Maintenance basics", kind: "Overview", minutes: 8, summary: "Credentialing is ongoing, not one-time." },
      { id: "w3d4-l2", title: "Expiration tracking", kind: "SOP", minutes: 10, summary: "License, malpractice, panel expirations." },
      { id: "w3d4-l3", title: "Revalidation / renewal awareness", kind: "SOP", minutes: 10, summary: "Payer-specific revalidation windows." },
      { id: "w3d4-l4", title: "Proactive follow-up", kind: "Workflow", minutes: 10, summary: "Set follow-ups well before deadlines." },
    ],
    checklist: [
      "Reviewed 5 maintenance/expiration examples",
      "Identified high-risk deadlines",
      "Set proactive follow-up",
    ],
    shadowing: ["Watch mentor review credentialing maintenance/expiration items."],
    livePractice: ["Review 5 maintenance/expiration examples and recommend next action."],
    resources: [R.l2StatusTracking, R.maintTracker],
    knowledgeCheck: {
      q: "Should credentialing expirations be handled only after they expire, and should revalidation dates have proactive follow-up?",
      a: "No to reactive; yes to proactive follow-up.",
    },
    reflectionPrompt: "Why is credentialing maintenance not just a one-time setup task?",
  }),
  day(3, 5, 15, {
    title: "Escalation and End-of-Day Credentialing Cleanup",
    description: "End the day with a clean credentialing queue and escalate appropriately.",
    objectives: [
      "Confirm every item has status, owner, next action, follow-up",
      "Identify and escalate urgent items",
      "Build tomorrow's priority list",
    ],
    lessons: [
      { id: "w3d5-l1", title: "Escalation criteria", kind: "SOP", minutes: 10, summary: "Billing risk, auth blocker, payer deadline, missing provider info, state growth blocker, stale follow-up." },
      { id: "w3d5-l2", title: "Queue cleanup", kind: "Workflow", minutes: 10, summary: "Nothing left silently pending." },
      { id: "w3d5-l3", title: "Stale follow-up review", kind: "SOP", minutes: 10, summary: "Catch drifting items before they harden into blockers." },
      { id: "w3d5-l4", title: "Tomorrow's priority list", kind: "Workflow", minutes: 10, summary: "Set a focused start for the next day." },
    ],
    checklist: [
      "Completed queue cleanup",
      "No assigned item left without next action",
      "Created tomorrow's priority list",
    ],
    shadowing: ["Watch mentor complete end-of-day credentialing cleanup."],
    livePractice: ["Clean up 8–10 assigned/simulated credentialing items with mentor review."],
    resources: [R.l2StatusTracking, R.l1RcmDir, R.l1FinCtrl],
    knowledgeCheck: {
      q: "Should stale credentialing items be left untouched, and should urgent billing/auth blockers be escalated?",
      a: "No to stale; yes — always escalate urgent blockers.",
    },
    reflectionPrompt: "What makes a credentialing queue feel controlled instead of messy?",
    signoffRequired: "Week 3 manager / mentor signoff required before moving to Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: CredentialingDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled Credentialing Queue Ownership — Part 1",
    description: "Own a small set of real credentialing tasks with mentor review.",
    objectives: [
      "Prioritize the credentialing queue",
      "Complete assigned work accurately",
      "End day with no item lacking next action",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning credentialing queue review", kind: "Workflow", minutes: 10, summary: "Set the day's priorities." },
      { id: "w4d1-l2", title: "Prioritizing credentialing work", kind: "SOP", minutes: 10, summary: "Billing/auth blockers, payer follow-ups, missing info, deadlines, stale items." },
      { id: "w4d1-l3", title: "Updating current trackers", kind: "SOP", minutes: 10, summary: "Keep systems accurate as you work." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "Workflow", minutes: 10, summary: "Nothing left silently pending." },
    ],
    checklist: [
      "Completed assigned queue",
      "Updated current systems accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned credentialing tasks with mentor review."],
    resources: [R.l1CredSop, R.l2StatusTracking, R.l2Billing, R.l1RcmDir],
    knowledgeCheck: {
      q: "What should be true at end of day about your assigned credentialing queue?",
      a: "Every item has current status, owner, next action, and follow-up date; sensitive info stays need-to-know.",
    },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled Credentialing Queue Ownership — Part 2",
    description: "Repeat controlled ownership with more independence.",
    objectives: [
      "Own more with less oversight",
      "Escalate blockers clearly to correct owners",
      "Keep queue clean and follow-ups on time",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "SOP", minutes: 10, summary: "Follow-up dates land, don't drift." },
      { id: "w4d2-l2", title: "Payer status accuracy", kind: "Workflow", minutes: 12, summary: "Capture exact payer wording, don't summarize loosely." },
      { id: "w4d2-l3", title: "Missing item follow-up", kind: "Workflow", minutes: 10, summary: "Own follow-through on missing info requests." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Escalate to right owner with facts, impact, requested next step." },
    ],
    checklist: [
      "Completed queue work",
      "Escalated blockers correctly",
      "No stale / unowned assigned credentialing item",
    ],
    shadowing: ["Minimal — learner performs while mentor reviews."],
    livePractice: ["Own 10–15 assigned credentialing tasks."],
    resources: [R.l2StatusTracking, R.l2Collections, R.l2BcbaAssign],
    knowledgeCheck: {
      q: "Where should unclear payer responses, billing/auth blockers, and expired items be routed?",
      a: "To the correct owner (Credentialing lead / Devorah / RCM / Auth / State Ops) with facts, impact, and requested next step.",
    },
    reflectionPrompt: "What did you escalate today and why?",
  }),
  day(4, 3, 18, {
    title: "Credentialing Communication Quality Day",
    description: "Focus on clear communication with providers/BCBAs, HR, Clinical, Authorizations, Billing/RCM, State Ops, and managers.",
    objectives: [
      "Write clear credentialing notes",
      "Communicate urgency when billing/auth/state growth are at risk",
      "Keep sensitive info need-to-know",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Clear credentialing notes", kind: "SOP", minutes: 12, summary: "Provider, payer, state, status, what happened, what's missing, owner, impact, follow-up." },
      { id: "w4d3-l2", title: "Payer follow-up note quality", kind: "Workflow", minutes: 10, summary: "Exact wording + next action." },
      { id: "w4d3-l3", title: "Missing item request quality", kind: "SOP", minutes: 10, summary: "Specific, dated, professional." },
      { id: "w4d3-l4", title: "RCM/Auth handoff quality", kind: "SOP", minutes: 10, summary: "Actionable, specific, dated." },
    ],
    checklist: [
      "Drafted 5 clear notes/handoffs",
      "Mentor approved tone and specificity",
      "Confidentiality handled correctly",
    ],
    shadowing: ["Mentor reviews written updates and handoffs."],
    livePractice: ["Draft 5 credentialing update/handoff notes for mentor review."],
    resources: [R.l2StatusTracking, R.l2Billing, R.l1AuthMgr, R.rcmTemplate, R.authTemplate],
    knowledgeCheck: {
      q: "What kind of credentialing note makes Billing/RCM or Authorizations able to act immediately?",
      a: "One with specifics: provider, payer, state, status, blocker, owner, impact, and follow-up date.",
    },
    reflectionPrompt: "What kind of credentialing note makes Billing/RCM or Authorizations able to act immediately?",
  }),
  day(4, 4, 19, {
    title: "End-to-End Credentialing Simulation",
    description: "Complete a full simulation from provider/payer status through missing-item follow-up, payer status check, billing/auth impact review, and escalation.",
    objectives: [
      "Run one credentialing scenario end-to-end",
      "Pass mentor review",
      "Complete a real task set alongside the simulation",
    ],
    lessons: [
      { id: "w4d4-l1", title: "Provider profile review simulation", kind: "Live Practice", minutes: 10, summary: "Fresh provider profile review." },
      { id: "w4d4-l2", title: "Payer status review simulation", kind: "Live Practice", minutes: 10, summary: "Payer status + effective date confirmation." },
      { id: "w4d4-l3", title: "Missing information simulation", kind: "Live Practice", minutes: 10, summary: "Route and follow-up missing items." },
      { id: "w4d4-l4", title: "Billing/auth impact simulation", kind: "Live Practice", minutes: 12, summary: "Communicate impact to RCM/Auth." },
      { id: "w4d4-l5", title: "Escalation / handoff simulation", kind: "Live Practice", minutes: 10, summary: "Escalate to correct owner with facts and impact." },
    ],
    checklist: [
      "Completed full simulation",
      "Passed mentor review",
      "Completed real task set",
    ],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1CredSop, R.l2StatusTracking, R.rcmTemplate, R.authTemplate, R.hrClinTemplate],
    knowledgeCheck: {
      q: "What part of the credentialing process do you still need more repetitions on?",
      a: "Any step the learner cannot execute end-to-end without prompting — schedule reps.",
    },
    reflectionPrompt: "What part of the full credentialing process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description: "Complete final review; manager determines readiness for ongoing credentialing ownership and sets a 30-day plan.",
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
    livePractice: ["Learner runs a short credentialing queue review while manager observes."],
    resources: [R.l1CredSop, R.role306090, R.roleDeepDive, R.l2StatusTracking, R.l1RcmDir, R.l2Billing],
    knowledgeCheck: {
      q: "Final: name any 3 of — credentialing lifecycle, current systems, owner/status/next action/follow-up, provider basics, payer status, missing-info workflow, payer follow-up docs, billing/RCM impact, auth impact, HR/Clinical handoffs, state/payer variation, maintenance/expiration, escalation, confidentiality, role boundaries.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about Credentialing that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into independent ownership with a 30-day plan.",
  }),
];

export const CREDENTIALING_DAYS: CredentialingDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getCredentialingDay(sourceModuleId: string): CredentialingDayModule | undefined {
  return CREDENTIALING_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalCredentialingMinutes(): number {
  return CREDENTIALING_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}