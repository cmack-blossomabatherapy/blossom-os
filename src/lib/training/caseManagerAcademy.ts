/**
 * Case Manager Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new Clinical Services Case Manager on today's Blossom case-management
 * process using current tools (CentralReach, current case/client trackers,
 * clinical documents, Outlook/Teams) with clean boundaries to BCBA/Clinical,
 * QA, Authorizations, Scheduling, Staffing, and State Ops.
 *
 * Mirrors `qaAcademy.ts` so it plugs into the same academy adapter without
 * touching other role/department curricula.
 */

export type CaseManagerLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface CaseManagerLesson {
  id: string;
  title: string;
  summary: string;
  kind: CaseManagerLessonKind;
  minutes: number;
}

export interface CaseManagerResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface CaseManagerDayModule {
  /** Source module id — becomes `case-manager::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: CaseManagerLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: CaseManagerResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface CaseManagerWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const CASE_MANAGER_WEEKS: CaseManagerWeek[] = [
  { weekNumber: 1, title: "Week 1 · Case Management Foundations, Welcome, Current Systems, Client Lifecycle, and Role Boundaries",
    goal: "Understand Blossom, the Case Manager's purpose, today's clinical systems, client lifecycle, family communication expectations, and the difference between Case Management, BCBA clinical ownership, QA, State Ops, Scheduling, Staffing, and Authorizations." },
  { weekNumber: 2, title: "Week 2 · Assessments, Treatment Plans, Parent Training, Progress Reports, and Clinical Documentation Awareness",
    goal: "Move from observation into supervised review and coordination of common case-management visibility tasks." },
  { weekNumber: 3, title: "Week 3 · Session Expectations, RBT Support, Services on Pause, Discharges, Escalations, and Cross-Department Handoffs",
    goal: "Start owning more work with review, learn case-health judgment points, and practice escalation and handoffs." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Communication Quality, Simulation, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real case-management work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1CmSop: { label: "L1 Clinical Services / Case Manager Role SOP", href: "/resource-library", pending: true },
  binder: { label: "Clinical Services and Case Management Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "Clinical Services Case Manager Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "Clinical Services Case Manager Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l1BcbaSup: { label: "L1 BCBA Clinical Supervisor Role SOP", href: "/resource-library", pending: true },
  l1Rbt: { label: "L1 RBT Field Team Member Role SOP", href: "/resource-library", pending: true },
  l1AuthMgr: { label: "L1 Authorizations / Utilization Manager Role SOP", href: "/resource-library", pending: true },
  l2Case: { label: "L2 Case Management Current Operations", href: "/resource-library", pending: true },
  l2Lifecycle: { label: "L2 Client Lifecycle Current Operations", href: "/resource-library", pending: true },
  l2FamilyComm: { label: "L2 Family Clinical Communication Process SOP", href: "/resource-library", pending: true },
  l2Escalation: { label: "L2 Clinical Escalation and Case Review Process SOP", href: "/resource-library", pending: true },
  l2EvalCoord: { label: "L2 Evaluation Coordination Process SOP", href: "/resource-library", pending: true },
  l2Assess: { label: "L2 Assessment Current Operations", href: "/resource-library", pending: true },
  l2TP: { label: "L2 Treatment Plans Current Operations", href: "/resource-library", pending: true },
  l2BP: { label: "L2 Behavior Plans Current Operations", href: "/resource-library", pending: true },
  l2TpQa: { label: "L2 Treatment Plan QA Current Operations", href: "/resource-library", pending: true },
  l2ParentTraining: { label: "L2 Parent Training Current Operations", href: "/resource-library", pending: true },
  l2Progress: { label: "L2 Progress Reports Current Operations", href: "/resource-library", pending: true },
  l2ClinicalDocs: { label: "L2 Clinical Documentation Current Operations", href: "/resource-library", pending: true },
  l2Sessions: { label: "L2 Session Expectations Current Operations", href: "/resource-library", pending: true },
  l2RbtSupport: { label: "L2 RBT Support and Retention Process SOP", href: "/resource-library", pending: true },
  l2Pause: { label: "L2 Services on Pause Current Operations", href: "/resource-library", pending: true },
  l2Discharge: { label: "L2 Discharges Current Operations", href: "/resource-library", pending: true },
  l2Transition: { label: "L2 Transition to Client Current Operations", href: "/resource-library", pending: true },
  l2Sched: { label: "L2 Client Scheduling Current Operations (boundary awareness)", href: "/resource-library", pending: true },
  l2StaffMatch: { label: "L2 Case Staffing Match Process SOP (boundary awareness)", href: "/resource-library", pending: true },
  l2BcbaAssign: { label: "L2 BCBA Assignment Confirmation Process SOP (boundary awareness)", href: "/resource-library", pending: true },
  l2ReportQa: { label: "L2 Clinical Report QA Review Process SOP", href: "/resource-library", pending: true },
  l2IntakeFamily: { label: "L2 Family Contact and Follow-Up Process SOP (Intake — boundary awareness)", href: "/resource-library", pending: true },
  crGuide: { label: "CentralReach Case Visibility Guide", href: "/resource-library", pending: true },
  trackerGuide: { label: "Current Case Tracker Field Guide", href: "/resource-library", pending: true },
  lifecycleMap: { label: "Client Lifecycle Map", href: "/resource-library", pending: true },
  familyTemplates: { label: "Family Communication Templates", href: "/resource-library", pending: true },
  escTemplate: { label: "Clinical Escalation Template", href: "/resource-library", pending: true },
  pauseTracker: { label: "Services on Pause Tracker", href: "/resource-library", pending: true },
  dischargeChecklist: { label: "Discharge Checklist", href: "/resource-library", pending: true },
  ptChecklist: { label: "Parent Training Visibility Checklist", href: "/resource-library", pending: true },
  reportTimeline: { label: "Progress Report Timeline Guide", href: "/resource-library", pending: true },
  handoffTemplates: { label: "Cross-Department Handoff Templates", href: "/resource-library", pending: true },
  hipaa: { label: "Confidentiality / HIPAA Guidance", href: "/resource-library", pending: true },
  clinOverview: { label: "Clinical Services Overview", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<CaseManagerDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): CaseManagerDayModule {
  return {
    id: `cm-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: CaseManagerDayModule[] = [
  day(1, 1, 1, {
    title: "Case Manager Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what Case Management does and why it matters. Case Managers help families and cases stay guided after a client enters services — keeping visibility on blockers, family needs, clinical coordination, services on pause, parent training visibility, discharge readiness, and cross-department follow-up. Strong case management makes families feel supported and helps clinical and operations leaders see what needs attention.",
    objectives: [
      "Explain what Case Management owns and does not own today",
      "Describe the current client lifecycle end-to-end",
      "Explain the owner / status / next action / follow-up date rule",
      "Explain confidentiality and clinical sensitivity",
    ],
    lessons: [
      { id: "w1d1-l1", title: "What Case Management owns today", kind: "Overview", minutes: 10, summary: "Coordination, visibility, family communication support, blocker tracking, escalation routing, parent-training/pause/discharge visibility." },
      { id: "w1d1-l2", title: "What Case Management does not own", kind: "Overview", minutes: 8, summary: "Not clinical supervision, not writing plans for BCBAs, not intake, not auths, not scheduling, not staffing, not billing/payroll." },
      { id: "w1d1-l3", title: "Current client lifecycle", kind: "Workflow", minutes: 10, summary: "Transition to client → assessment → treatment plan → parent training → ongoing sessions → documentation → progress reports → pause/escalation → discharge → follow-up." },
      { id: "w1d1-l4", title: "Clinical boundary and confidentiality", kind: "SOP", minutes: 10, summary: "Case information is sensitive; share on a need-to-know basis and stay respectful in every note." },
    ],
    checklist: [
      "Can explain what Case Management owns",
      "Can explain what Case Management does not own",
      "Can explain the basic client lifecycle",
      "Can explain why role boundaries matter",
    ],
    shadowing: ["Sit with Clinical Services lead, Case Manager mentor, BCBA/Clinical leader, or assigned manager for 30–60 minutes and watch how they review active case needs."],
    livePractice: ["No live case ownership yet — observe only."],
    resources: [R.l1CmSop, R.binder, R.roleDeepDive, R.l2Case, R.l2Lifecycle, R.hipaa, R.clinOverview],
    knowledgeCheck: {
      q: "What four things should every case-management item have before you leave it?",
      a: "Owner, status, next action, follow-up date. Case Management does not replace BCBA clinical supervision.",
    },
    reflectionPrompt: "In your own words, why does Case Management matter to families and clinical operations?",
  }),
  day(1, 2, 2, {
    title: "Current Case Management Systems Tour — CentralReach, Current Trackers, Outlook, Teams, Clinical Documents",
    description:
      "Learn today's systems: CentralReach for client/schedule/documentation visibility, current case/client trackers or Monday boards where used, clinical documents, and Outlook/Teams for family, BCBA, and cross-department communication.",
    objectives: [
      "Identify today's main case-management tools",
      "Find key case status fields",
      "Explain what CentralReach is used for in case management",
      "Explain where communication and follow-up should be documented",
    ],
    lessons: [
      { id: "w1d2-l1", title: "CentralReach basics for case visibility", kind: "SOP", minutes: 12, summary: "Where client, schedule, documentation, and clinical information may be viewed by role." },
      { id: "w1d2-l2", title: "Current case / client tracker basics", kind: "SOP", minutes: 10, summary: "Client, state, BCBA, RBT/staff, family contact, service status, schedule/staffing/auth awareness, parent training, clinical/doc blockers, pause, next action, notes." },
      { id: "w1d2-l3", title: "Outlook / email basics", kind: "SOP", minutes: 8, summary: "Professional, documented family and internal communication." },
      { id: "w1d2-l4", title: "Teams / internal communication basics", kind: "SOP", minutes: 8, summary: "Quick coordination without losing the paper trail." },
      { id: "w1d2-l5", title: "Clinical documents and QA awareness", kind: "Overview", minutes: 10, summary: "Where clinical documents, QA notes, and follow-up information live today." },
    ],
    checklist: [
      "Identified main current case-management tools",
      "Explained what CentralReach is used for today",
      "Found key case status fields",
      "Explained where communication and follow-up should be documented",
    ],
    shadowing: ["Watch mentor review one active case across CentralReach / current tracker and communication notes."],
    livePractice: ["In training/sandbox or with mentor supervision, locate 3 sample case items and point out owner / status / next action / follow-up date."],
    resources: [R.l2Case, R.l2Lifecycle, R.l2ClinicalDocs, R.crGuide, R.trackerGuide],
    knowledgeCheck: {
      q: "Is CentralReach part of today's case-management reality, and should case notes identify owner and next action?",
      a: "Yes to both — CentralReach is central to visibility, and every note names an owner and next action.",
    },
    reflectionPrompt: "Which case-management system or tracker is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "Client Lifecycle and Transition to Client",
    description:
      "Learn how a lead becomes an active client and what Case Management needs to understand at the transition point.",
    objectives: [
      "Explain transition-to-client basics",
      "Identify what Case Management needs to monitor at handoff",
      "Do not take over Intake / Auth / Scheduling tasks — track their status",
    ],
    lessons: [
      { id: "w1d3-l1", title: "Transition to client overview", kind: "Overview", minutes: 8, summary: "What happens when a family becomes an active client." },
      { id: "w1d3-l2", title: "Client lifecycle stages", kind: "Workflow", minutes: 12, summary: "Stages Case Management touches vs stages other departments own." },
      { id: "w1d3-l3", title: "Handoff information", kind: "SOP", minutes: 10, summary: "Client/family, state, BCBA, service model, auth status awareness, scheduling/staffing status, family needs, clinical next step, known blockers." },
      { id: "w1d3-l4", title: "First case visibility check", kind: "Workflow", minutes: 10, summary: "Document what Case Management needs to monitor." },
    ],
    checklist: [
      "Can explain transition-to-client basics",
      "Reviewed 3 client lifecycle examples",
      "Identified case-management watch items",
    ],
    shadowing: ["Watch mentor review a recently transitioned client."],
    livePractice: ["Under mentor supervision, review 3 transition/client lifecycle examples and identify case-management watch items."],
    resources: [R.l2Transition, R.l2Lifecycle, R.l2Case, R.lifecycleMap],
    knowledgeCheck: {
      q: "Does Case Management own intake conversion, and should Case Management understand client lifecycle stage?",
      a: "No to intake conversion; yes — Case Management must always know the client's lifecycle stage.",
    },
    reflectionPrompt: "What information does Case Management need when a family becomes an active client?",
  }),
  day(1, 4, 4, {
    title: "Family Clinical Communication Basics",
    description:
      "Learn how Case Managers communicate with families in a warm, clear, documented way while staying inside clinical boundaries.",
    objectives: [
      "Use plain, warm, specific family language",
      "Distinguish operational vs clinical vs scheduling vs auth vs billing vs urgent questions",
      "Document contact attempt, outcome, owner, next action, and follow-up date",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Family communication standard", kind: "SOP", minutes: 10, summary: "Warm, specific, documented — never casual about clinical information." },
      { id: "w1d4-l2", title: "Clinical boundary in family communication", kind: "SOP", minutes: 10, summary: "Route clinical questions to BCBA / Clinical leadership." },
      { id: "w1d4-l3", title: "Documenting family contact", kind: "Workflow", minutes: 10, summary: "Attempt, outcome, owner, next action, follow-up date." },
      { id: "w1d4-l4", title: "Escalating family concerns", kind: "Workflow", minutes: 10, summary: "When to loop in BCBA, Clinical leadership, State Ops, or manager." },
    ],
    checklist: [
      "Drafted approved family communication",
      "Identified clinical vs operational questions",
      "Documented next action / follow-up",
    ],
    shadowing: ["Listen to mentor handle or review family clinical communication."],
    livePractice: ["Draft 3 family communication messages and 2 routing/escalation notes for mentor review."],
    resources: [R.l2FamilyComm, R.l2IntakeFamily, R.familyTemplates],
    knowledgeCheck: {
      q: "Should Case Management make clinical decisions for the BCBA, and should family concerns be documented with next action?",
      a: "No to clinical decisions; yes — every family concern gets a documented next action.",
    },
    reflectionPrompt: "What makes a family feel guided without Case Management overstepping clinical ownership?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1 and confirm you understand Case Manager role boundaries, current systems, client lifecycle, transition-to-client awareness, and family communication.",
    objectives: [
      "Review 3 sample case-management items with mentor",
      "Explain status, next action, owner, family/clinical context, and whether escalation is needed",
      "Identify anything still unclear",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering client lifecycle, CentralReach/current trackers, family communication, owner/status/next action, and clinical boundaries." },
      { id: "w1d5-l2", title: "Case Manager role boundary check", kind: "Overview", minutes: 8, summary: "Case Management vs BCBA/Clinical vs QA vs Auth vs Scheduling vs Staffing vs State Ops." },
      { id: "w1d5-l3", title: "Client lifecycle walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 items end-to-end with mentor." },
      { id: "w1d5-l4", title: "Mentor feedback", kind: "Shadowing", minutes: 10, summary: "Strengths and coaching areas for Week 2." },
    ],
    checklist: [
      "Completed Week 1 quiz",
      "Reviewed 3 case-management items with mentor",
      "Can explain current systems and role boundaries",
      "Manager / mentor signoff completed",
    ],
    shadowing: ["Watch end-of-day case queue review."],
    livePractice: ["Complete supervised case-management review checklist for 3 items."],
    resources: [R.l1CmSop, R.l2Case, R.binder],
    knowledgeCheck: {
      q: "What must always be true before you close out a case-management item for the day?",
      a: "Owner, status, next action, and follow-up date are set; sensitive clinical info stays need-to-know.",
    },
    reflectionPrompt: "What part of Case Management still feels confusing?",
    signoffRequired: "Week 1 manager / mentor signoff required before moving to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: CaseManagerDayModule[] = [
  day(2, 1, 6, {
    title: "Assessment Current Operations Awareness",
    description: "Learn how assessments fit into the client lifecycle and what Case Management may need to monitor.",
    objectives: [
      "Review assessment status for a client",
      "Identify family / BCBA / scheduling / documentation blockers",
      "Document case-management follow-up and escalate delays",
    ],
    lessons: [
      { id: "w2d1-l1", title: "Assessment purpose", kind: "Overview", minutes: 8, summary: "Why assessments matter for treatment planning and family experience." },
      { id: "w2d1-l2", title: "Assessment status awareness", kind: "SOP", minutes: 10, summary: "Where to find status without doing the assessment." },
      { id: "w2d1-l3", title: "Family / BCBA coordination points", kind: "Workflow", minutes: 12, summary: "Coordinate visibility without owning the clinical work." },
      { id: "w2d1-l4", title: "Escalation for delays", kind: "Workflow", minutes: 10, summary: "Route delays to the correct owner with next action + follow-up." },
    ],
    checklist: [
      "Reviewed 3 assessment scenarios",
      "Identified blocker and owner",
      "Drafted next-action note",
    ],
    shadowing: ["Watch mentor review assessment status."],
    livePractice: ["Review 3 assessment status scenarios and recommend case-management next action."],
    resources: [R.l2Assess, R.l2EvalCoord, R.l2Escalation, R.l1BcbaSup],
    knowledgeCheck: {
      q: "Does Case Management perform clinical assessments by default, and should assessment delays have owner and follow-up?",
      a: "No to performing assessments; yes — every delay has owner and follow-up.",
    },
    reflectionPrompt: "How can assessment delays affect the family experience?",
  }),
  day(2, 2, 7, {
    title: "Treatment Plans and Behavior Plans Awareness",
    description: "Learn how treatment plans and behavior plans fit into case visibility without becoming the clinical author.",
    objectives: [
      "Track plan status and blockers",
      "Route BCBA / QA / Clinical follow-ups appropriately",
      "Never rewrite clinical plan content",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Treatment plan purpose", kind: "Overview", minutes: 8, summary: "What plans do for the family and clinical program." },
      { id: "w2d2-l2", title: "Behavior plan purpose", kind: "Overview", minutes: 8, summary: "Behavior plan role in ongoing services." },
      { id: "w2d2-l3", title: "BCBA ownership", kind: "SOP", minutes: 10, summary: "The BCBA authors clinical content; Case Management tracks visibility." },
      { id: "w2d2-l4", title: "Tracking blockers and follow-up", kind: "Workflow", minutes: 12, summary: "Missing sections, QA delays, family sign-off, next action." },
    ],
    checklist: [
      "Can explain treatment/behavior plan ownership",
      "Reviewed 3 scenarios",
      "Drafted blocker/follow-up notes",
    ],
    shadowing: ["Watch mentor review treatment plan / behavior plan status."],
    livePractice: ["Review 3 treatment/behavior plan scenarios and identify next action."],
    resources: [R.l2TP, R.l2BP, R.l2TpQa, R.l1BcbaSup],
    knowledgeCheck: {
      q: "Does Case Management write treatment plans for the BCBA, and should plan blockers be tracked?",
      a: "No to writing plans; yes — plan blockers must be tracked with owner and follow-up.",
    },
    reflectionPrompt: "How can Case Management support plan visibility without becoming the clinical author?",
  }),
  day(2, 3, 8, {
    title: "Parent Training Visibility",
    description: "Learn how parent training fits into ongoing case health and family support.",
    objectives: [
      "Identify whether parent training is scheduled / happening / delayed / missing",
      "Route clinical content questions to the BCBA",
      "Document family communication and next action",
    ],
    lessons: [
      { id: "w2d3-l1", title: "Parent training purpose", kind: "Overview", minutes: 8, summary: "Why parent training matters to outcomes." },
      { id: "w2d3-l2", title: "Parent training status awareness", kind: "SOP", minutes: 10, summary: "Where and how to see status today." },
      { id: "w2d3-l3", title: "Family follow-up", kind: "Workflow", minutes: 10, summary: "Warm, specific, boundaried follow-up." },
      { id: "w2d3-l4", title: "Escalation to BCBA / Clinical leadership", kind: "SOP", minutes: 10, summary: "When to escalate a parent-training gap." },
    ],
    checklist: [
      "Reviewed 3 parent-training scenarios",
      "Identified owner and next action",
      "Drafted family/BCBA follow-up note",
    ],
    shadowing: ["Watch mentor review parent training status."],
    livePractice: ["Review 3 parent-training scenarios and recommend next action."],
    resources: [R.l2ParentTraining, R.l2FamilyComm, R.l1BcbaSup, R.ptChecklist],
    knowledgeCheck: {
      q: "Should Case Management answer clinical parent-training content questions without BCBA guidance, and should parent training gaps be visible?",
      a: "No — route clinical content to BCBA; yes — gaps must be visible and tracked.",
    },
    reflectionPrompt: "Why does parent training visibility matter for case health?",
  }),
  day(2, 4, 9, {
    title: "Progress Reports and Clinical Documentation Awareness",
    description: "Learn how progress reports and clinical documentation affect case visibility and downstream workflows (QA, Auth, care continuity).",
    objectives: [
      "Track report and documentation status",
      "Route missing/delayed items to correct owner (BCBA/QA/Auth)",
      "Document next action and follow-up date",
    ],
    lessons: [
      { id: "w2d4-l1", title: "Progress report purpose", kind: "Overview", minutes: 8, summary: "Why reports matter for families, clinical program, and authorizations." },
      { id: "w2d4-l2", title: "Clinical documentation awareness", kind: "SOP", minutes: 10, summary: "What Case Management may need to see without owning documentation quality." },
      { id: "w2d4-l3", title: "QA / Auth connection", kind: "Workflow", minutes: 12, summary: "How report/documentation delays cascade." },
      { id: "w2d4-l4", title: "Follow-up and escalation", kind: "SOP", minutes: 10, summary: "Correct owner + follow-up date, always." },
    ],
    checklist: [
      "Reviewed 4 report / documentation scenarios",
      "Identified correct owner",
      "Drafted follow-up note",
    ],
    shadowing: ["Watch mentor review report / documentation status."],
    livePractice: ["Review 4 progress report / documentation scenarios and recommend next action."],
    resources: [R.l2Progress, R.l2ClinicalDocs, R.l2ReportQa, R.l1AuthMgr, R.reportTimeline],
    knowledgeCheck: {
      q: "Does Case Management own clinical documentation quality review, and should delayed reports have owner and follow-up?",
      a: "No — QA/Clinical owns quality review, Case Management tracks visibility; yes — delays always have owner and follow-up.",
    },
    reflectionPrompt: "How can report/documentation delays affect authorizations and care continuity?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description: "Complete a supervised mini-shift using current case-management visibility tasks.",
    objectives: [
      "Run 5–8 low-risk case-management tasks with mentor review",
      "Keep every item's next step visible",
      "Maintain confidentiality end-to-end",
    ],
    lessons: [
      { id: "w2d5-l1", title: "Assessment status review", kind: "Live Practice", minutes: 10, summary: "Move assessment visibility forward accurately." },
      { id: "w2d5-l2", title: "Treatment / behavior plan status review", kind: "Live Practice", minutes: 10, summary: "Track plan status without editing clinical content." },
      { id: "w2d5-l3", title: "Parent training status review", kind: "Live Practice", minutes: 10, summary: "Draft and route parent-training follow-up." },
      { id: "w2d5-l4", title: "Progress report / documentation status review", kind: "Reflection", minutes: 10, summary: "Mentor reviews notes for clarity and boundary." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No case-management item left without next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list."],
    resources: [R.l2Case, R.l2Assess, R.l2TP, R.l2ParentTraining, R.l2Progress],
    knowledgeCheck: {
      q: "What must always be true at the end of a mini-shift?",
      a: "Every item has owner, status, next action, and follow-up date; clinical info stays need-to-know.",
    },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 manager / mentor signoff required before moving to Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: CaseManagerDayModule[] = [
  day(3, 1, 11, {
    title: "Session Expectations and RBT Support Awareness",
    description: "Learn how session expectations and RBT support affect ongoing case health.",
    objectives: [
      "Identify which department owns each concern (BCBA/Clinical, Scheduling, Staffing, HR, Training, State Ops)",
      "Document facts and next action",
      "Avoid supervising RBTs clinically unless assigned/qualified",
    ],
    lessons: [
      { id: "w3d1-l1", title: "Session expectations basics", kind: "Overview", minutes: 8, summary: "What healthy sessions look like from a case-management view." },
      { id: "w3d1-l2", title: "RBT support / retention awareness", kind: "SOP", minutes: 10, summary: "How RBT support affects case health." },
      { id: "w3d1-l3", title: "Identifying support needs", kind: "Workflow", minutes: 12, summary: "Spot signals without overstepping." },
      { id: "w3d1-l4", title: "Routing concerns", kind: "SOP", minutes: 10, summary: "Send to correct owner with a clear note." },
    ],
    checklist: [
      "Reviewed 4 scenarios",
      "Identified correct owner",
      "Drafted clear routing note",
    ],
    shadowing: ["Watch mentor review a session / RBT support concern."],
    livePractice: ["Review 4 session / RBT support scenarios and choose correct owner and next action."],
    resources: [R.l2Sessions, R.l2RbtSupport, R.l1Rbt, R.l1BcbaSup],
    knowledgeCheck: {
      q: "Should Case Management clinically supervise RBTs by default, and should RBT support concerns be routed to the right owner?",
      a: "No to clinical supervision; yes — always route to the correct owner.",
    },
    reflectionPrompt: "How can Case Management spot case-health concerns without taking over clinical supervision?",
  }),
  day(3, 2, 12, {
    title: "Services on Pause",
    description: "Track and follow up on cases where services are paused.",
    objectives: [
      "Identify pause reason (family, staffing, auth, clinical, scheduling, doc, financial, other)",
      "Identify owner and what must happen to restart",
      "Escalate high-risk pauses",
    ],
    lessons: [
      { id: "w3d2-l1", title: "What services on pause means", kind: "Overview", minutes: 8, summary: "Why paused services need active ownership." },
      { id: "w3d2-l2", title: "Pause reason identification", kind: "SOP", minutes: 10, summary: "Use the current categories consistently." },
      { id: "w3d2-l3", title: "Owner and re-start plan", kind: "Workflow", minutes: 12, summary: "Every pause has an owner and a restart plan." },
      { id: "w3d2-l4", title: "Family / department follow-up", kind: "SOP", minutes: 10, summary: "Warm family contact + department handoffs." },
    ],
    checklist: [
      "Reviewed 5 pause scenarios",
      "Identified pause reason and owner",
      "Drafted restart / follow-up note",
    ],
    shadowing: ["Watch mentor review services-on-pause cases."],
    livePractice: ["Review 5 services-on-pause scenarios and recommend next action."],
    resources: [R.l2Pause, R.l2Lifecycle, R.l2Escalation, R.pauseTracker],
    knowledgeCheck: {
      q: "Should paused services sit without a restart plan or follow-up, and should the pause reason be clearly documented?",
      a: "No to unowned pauses; yes — reason, owner, restart plan, and follow-up are always documented.",
    },
    reflectionPrompt: "Why do paused services need active ownership?",
  }),
  day(3, 3, 13, {
    title: "Discharges Current Operations",
    description: "Learn how discharge workflows fit into case management and why they must be organized and respectful.",
    objectives: [
      "Identify discharge reason, clinical owner, family communication status, doc needs, scheduling/staffing impact, auth/billing visibility, next action",
      "Do not make clinical discharge decisions unless assigned/qualified",
      "Document discharge coordination and owner/follow-up",
    ],
    lessons: [
      { id: "w3d3-l1", title: "Discharge purpose", kind: "Overview", minutes: 8, summary: "Why respectful, organized discharge matters." },
      { id: "w3d3-l2", title: "Discharge reason awareness", kind: "SOP", minutes: 10, summary: "Common reasons and how they change the workflow." },
      { id: "w3d3-l3", title: "Cross-department coordination", kind: "Workflow", minutes: 12, summary: "BCBA / QA / Scheduling / Staffing / Auth / Billing visibility." },
      { id: "w3d3-l4", title: "Documentation and follow-up", kind: "SOP", minutes: 10, summary: "What must be documented, and by whom." },
    ],
    checklist: [
      "Reviewed 3 discharge scenarios",
      "Identified correct owner / next action",
      "Drafted clear discharge coordination note",
    ],
    shadowing: ["Watch mentor review a discharge scenario."],
    livePractice: ["Review 3 discharge scenarios and draft coordination notes."],
    resources: [R.l2Discharge, R.l2FamilyComm, R.l2Escalation, R.dischargeChecklist],
    knowledgeCheck: {
      q: "Does Case Management make clinical discharge decisions by default, and should discharge steps be coordinated and documented?",
      a: "No to clinical decisions; yes — every discharge is coordinated and documented.",
    },
    reflectionPrompt: "What makes a discharge process respectful and organized?",
  }),
  day(3, 4, 14, {
    title: "Clinical Escalation and Case Review",
    description: "Learn when and how case concerns should be escalated.",
    objectives: [
      "Identify escalation trigger and correct owner",
      "Write escalation notes with issue, impact, attempted actions, owner, requested decision, follow-up",
      "Avoid sending everything to State Director without context",
    ],
    lessons: [
      { id: "w3d4-l1", title: "Escalation criteria", kind: "SOP", minutes: 10, summary: "Family concerns, clinical risk, service pauses, repeated cancellations, staffing/scheduling blockers, doc delays, RBT concerns, BCBA delays, parent training gaps, discharge concerns, urgent state issues." },
      { id: "w3d4-l2", title: "Clinical vs operational escalations", kind: "Workflow", minutes: 10, summary: "Route to the right owner (Clinical, BCBA, QA, State Ops, Scheduling, Staffing, Auth, manager)." },
      { id: "w3d4-l3", title: "Case review notes", kind: "SOP", minutes: 12, summary: "Facts, impact, requested decision, follow-up date." },
      { id: "w3d4-l4", title: "Leadership / manager handoff", kind: "Workflow", minutes: 10, summary: "Handoff cleanly with the correct owner named." },
    ],
    checklist: [
      "Reviewed 5 escalation scenarios",
      "Identified correct owner / path",
      "Drafted escalation note",
    ],
    shadowing: ["Watch mentor escalate a case concern."],
    livePractice: ["Review 5 escalation scenarios and choose correct owner / path."],
    resources: [R.l2Escalation, R.l2FamilyComm, R.escTemplate],
    knowledgeCheck: {
      q: "Should escalations include issue, impact, owner, and requested next step, and should all issues automatically go to State Director without context?",
      a: "Yes to structured escalations; no — never send everything to State Director without context.",
    },
    reflectionPrompt: "What makes a case escalation actionable instead of vague?",
  }),
  day(3, 5, 15, {
    title: "Cross-Department Handoffs and End-of-Day Case Cleanup",
    description: "Close the day with clean case-management visibility.",
    objectives: [
      "Confirm every assigned item has status, owner, next action, follow-up date",
      "Identify urgent items and route clearly",
      "Prepare tomorrow's priority list",
    ],
    lessons: [
      { id: "w3d5-l1", title: "Clinical handoff", kind: "SOP", minutes: 10, summary: "Handoffs to BCBA / Clinical / QA." },
      { id: "w3d5-l2", title: "Scheduling / Staffing / Auth / QA handoff", kind: "SOP", minutes: 10, summary: "Handoffs to operational owners." },
      { id: "w3d5-l3", title: "End-of-day case review", kind: "Workflow", minutes: 12, summary: "Nothing left silently pending." },
      { id: "w3d5-l4", title: "Tomorrow's priority list", kind: "Workflow", minutes: 10, summary: "Set up tomorrow before you leave." },
    ],
    checklist: [
      "Completed queue cleanup",
      "No assigned item left without next action",
      "Created tomorrow priority list",
    ],
    shadowing: ["Watch mentor complete end-of-day case cleanup."],
    livePractice: ["Clean up 8–10 assigned / simulated case-management items with mentor review."],
    resources: [R.l2Case, R.l2Escalation, R.l2FamilyComm, R.handoffTemplates, R.l2Sched, R.l2StaffMatch, R.l2BcbaAssign],
    knowledgeCheck: {
      q: "Should case-management items be left without next action, and should handoffs identify the correct department owner?",
      a: "No to unowned items; yes — handoffs always name the correct department owner.",
    },
    reflectionPrompt: "What makes a case-management queue feel controlled instead of chaotic?",
    signoffRequired: "Week 3 manager / mentor signoff required before moving to Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: CaseManagerDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled Case Queue Ownership — Part 1",
    description: "Own a small set of real case-management tasks with mentor review.",
    objectives: [
      "Prioritize case-management work",
      "Complete assigned work accurately",
      "End day with no assigned item lacking next action",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning case queue review", kind: "Workflow", minutes: 10, summary: "Set the day's priorities." },
      { id: "w4d1-l2", title: "Prioritizing case-management work", kind: "SOP", minutes: 10, summary: "Family concerns, pauses, blockers, parent-training gaps, staffing/scheduling blockers, escalations, discharges." },
      { id: "w4d1-l3", title: "Updating current trackers / notes", kind: "SOP", minutes: 10, summary: "Keep systems accurate as you work." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "Workflow", minutes: 10, summary: "Nothing left silently pending." },
    ],
    checklist: [
      "Completed assigned queue",
      "Updated current systems accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned case-management tasks with mentor review."],
    resources: [R.l1CmSop, R.l2Case, R.l2Lifecycle, R.l2FamilyComm],
    knowledgeCheck: {
      q: "What should be true at end of day about your assigned case-management queue?",
      a: "Every item has current status, owner, next action, and follow-up date; clinical info stays need-to-know.",
    },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled Case Queue Ownership — Part 2",
    description: "Repeat controlled ownership with more independence.",
    objectives: [
      "Own more with less oversight",
      "Escalate blockers clearly to correct owners",
      "Keep queue clean and follow-ups on time",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "SOP", minutes: 10, summary: "Follow-up dates land, don't drift." },
      { id: "w4d2-l2", title: "Family communication", kind: "Workflow", minutes: 10, summary: "Warm, specific, dated." },
      { id: "w4d2-l3", title: "Clinical boundary", kind: "SOP", minutes: 10, summary: "Route clinical decisions to Clinical leadership / BCBA owner." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Facts, impact, requested next step." },
    ],
    checklist: [
      "Completed queue work",
      "Escalated blockers correctly",
      "No stale / unowned assigned case-management item",
    ],
    shadowing: ["Minimal — learner performs while mentor reviews."],
    livePractice: ["Own 10–15 assigned case-management tasks."],
    resources: [R.l2Escalation, R.l2Pause, R.l2Discharge, R.l2FamilyComm],
    knowledgeCheck: {
      q: "Where should family concerns, clinical risks, service pauses, delayed reports, staffing/scheduling blockers, and discharge concerns be routed?",
      a: "To the correct owner (Clinical, BCBA, QA, Scheduling, Staffing, Auth, State Ops, or manager) with facts, impact, and requested next step.",
    },
    reflectionPrompt: "What did you escalate today and why?",
  }),
  day(4, 3, 18, {
    title: "Case Management Communication Quality Day",
    description: "Clear, warm, clinically appropriate communication with families, BCBAs, Clinical leadership, State Ops, Scheduling, Staffing, Authorizations, QA, and managers.",
    objectives: [
      "Write clear case notes and handoffs",
      "Keep family communication warm, specific, and boundaried",
      "Communicate urgency when care continuity, family trust, or service delivery are at risk",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Clear case notes", kind: "SOP", minutes: 12, summary: "What happened, family need, clinical/operational issue, owner, impact, follow-up date." },
      { id: "w4d3-l2", title: "Family communication tone", kind: "Workflow", minutes: 10, summary: "Warm, specific, boundaried." },
      { id: "w4d3-l3", title: "BCBA / Clinical handoff quality", kind: "SOP", minutes: 10, summary: "Specific, dated, respectful — no clinical overreach." },
      { id: "w4d3-l4", title: "Cross-department escalation quality", kind: "SOP", minutes: 10, summary: "Impact + examples + requested decision." },
    ],
    checklist: [
      "Drafted 5 clear notes / handoffs",
      "Mentor approved tone and specificity",
      "Clinical boundary handled correctly",
    ],
    shadowing: ["Mentor reviews written case notes and family/handoff communication."],
    livePractice: ["Draft 5 case notes / family messages / handoffs for mentor review."],
    resources: [R.l2FamilyComm, R.l2Escalation, R.handoffTemplates, R.familyTemplates],
    knowledgeCheck: {
      q: "What kind of case-management communication makes families feel supported and teams able to act?",
      a: "Warm, specific, dated, boundaried — clear about issue, owner, next action, and follow-up.",
    },
    reflectionPrompt: "What kind of case-management communication makes families feel supported and teams able to act?",
  }),
  day(4, 4, 19, {
    title: "End-to-End Case Management Simulation",
    description: "Complete a full case-management simulation from client lifecycle review through family communication, blocker identification, escalation/handoff, and follow-up plan.",
    objectives: [
      "Run one case scenario end-to-end",
      "Pass mentor review",
      "Complete a real task set alongside the simulation",
    ],
    lessons: [
      { id: "w4d4-l1", title: "Client lifecycle review simulation", kind: "Live Practice", minutes: 10, summary: "Confirm stage, owner, next step." },
      { id: "w4d4-l2", title: "Family concern simulation", kind: "Live Practice", minutes: 10, summary: "Draft warm, boundaried family communication." },
      { id: "w4d4-l3", title: "Clinical / documentation blocker simulation", kind: "Live Practice", minutes: 12, summary: "Identify blocker, route to correct owner." },
      { id: "w4d4-l4", title: "Services on pause / discharge simulation", kind: "Live Practice", minutes: 10, summary: "Coordinate pause / discharge cleanly." },
      { id: "w4d4-l5", title: "Escalation / handoff simulation", kind: "Live Practice", minutes: 12, summary: "Escalate with the correct trail and follow-up plan." },
    ],
    checklist: [
      "Completed full simulation",
      "Passed mentor review",
      "Completed real task set",
    ],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1CmSop, R.l2Case, R.l2Lifecycle, R.l2FamilyComm, R.l2Escalation, R.l2Pause, R.l2Discharge],
    knowledgeCheck: {
      q: "What part of the full case-management process do you still need more repetitions on?",
      a: "Any step the learner cannot execute end-to-end without prompting — schedule reps.",
    },
    reflectionPrompt: "What part of the full case-management process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description: "Complete final review; manager determines readiness for ongoing case-management ownership and sets a 30-day plan.",
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
    livePractice: ["Learner runs a short case-management queue review while manager observes."],
    resources: [R.l1CmSop, R.role306090, R.roleDeepDive, R.l2Case, R.l2Lifecycle, R.l2FamilyComm, R.l2Escalation],
    knowledgeCheck: {
      q: "Final: name any 3 of — client lifecycle, current systems (CentralReach / trackers / clinical docs / Outlook / Teams), owner/status/next action/follow-up, transition to client, family clinical communication, assessment / evaluation coordination awareness, treatment/behavior plan awareness, parent training visibility, progress reports / clinical documentation awareness, session expectations / RBT support awareness, services on pause, discharges, clinical escalation and case review, cross-department handoffs, clinical boundary and confidentiality.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about Case Management that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into independent ownership with a 30-day plan.",
  }),
];

export const CASE_MANAGER_DAYS: CaseManagerDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getCaseManagerDay(sourceModuleId: string): CaseManagerDayModule | undefined {
  return CASE_MANAGER_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalCaseManagerMinutes(): number {
  return CASE_MANAGER_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}