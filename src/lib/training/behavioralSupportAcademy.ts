/**
 * Behavioral Support Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new Behavioral Support team member on today's Blossom process
 * using current tools (CentralReach, current clinical documents/trackers,
 * behavior plans, treatment plans, Outlook/Teams) with clean boundaries
 * to BCBA/Clinical, QA, Case Management, Scheduling, Staffing, and State Ops.
 *
 * Mirrors `caseManagerAcademy.ts` so it plugs into the same academy adapter
 * without touching other role/department curricula.
 */

export type BehavioralSupportLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface BehavioralSupportLesson {
  id: string;
  title: string;
  summary: string;
  kind: BehavioralSupportLessonKind;
  minutes: number;
}

export interface BehavioralSupportResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface BehavioralSupportDayModule {
  /** Source module id — becomes `behavioral-support::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: BehavioralSupportLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: BehavioralSupportResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface BehavioralSupportWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const BEHAVIORAL_SUPPORT_WEEKS: BehavioralSupportWeek[] = [
  { weekNumber: 1, title: "Week 1 · Behavioral Support Foundations, Welcome, Current Systems, and Clinical Boundaries",
    goal: "Understand Blossom, the Behavioral Support role, today's clinical systems, behavior support boundaries, RBT/family support standards, and the difference between Behavioral Support, BCBA ownership, QA, Case Management, and State Ops." },
  { weekNumber: 2, title: "Week 2 · Family Support, Parent Training, Treatment Plan Awareness, and Clinical Documentation",
    goal: "Move from observation into supervised behavioral-support visibility tasks while staying inside clinical boundaries." },
  { weekNumber: 3, title: "Week 3 · Behavioral Escalations, Case Review, Services on Pause, Discharge Awareness, and Cross-Department Handoffs",
    goal: "Own more work with review, learn behavioral-support judgment points, and practice escalation and handoffs." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Communication Quality, Simulation, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real behavioral support work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1BcbaSup: { label: "L1 BCBA Clinical Supervisor Role SOP", href: "/resource-library", pending: true },
  l1CmSop: { label: "L1 Clinical Services / Case Manager Role SOP", href: "/resource-library", pending: true },
  l1Rbt: { label: "L1 RBT Field Team Member Role SOP", href: "/resource-library", pending: true },
  binder: { label: "Clinical Services and Case Management Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "Behavioral Support Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "Behavioral Support Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l2BP: { label: "L2 Behavior Plans Current Operations", href: "/resource-library", pending: true },
  l2TP: { label: "L2 Treatment Plans Current Operations", href: "/resource-library", pending: true },
  l2TpQa: { label: "L2 Treatment Plan QA Current Operations", href: "/resource-library", pending: true },
  l2ParentTraining: { label: "L2 Parent Training Current Operations", href: "/resource-library", pending: true },
  l2Sessions: { label: "L2 Session Expectations Current Operations", href: "/resource-library", pending: true },
  l2RbtSupport: { label: "L2 RBT Support and Retention Process SOP", href: "/resource-library", pending: true },
  l2FamilyComm: { label: "L2 Family Clinical Communication Process SOP", href: "/resource-library", pending: true },
  l2Escalation: { label: "L2 Clinical Escalation and Case Review Process SOP", href: "/resource-library", pending: true },
  l2ClinicalDocs: { label: "L2 Clinical Documentation Current Operations", href: "/resource-library", pending: true },
  l2DocStd: { label: "L2 Documentation Standards Current Operations", href: "/resource-library", pending: true },
  l2MissingItem: { label: "L2 Documentation Missing Item Follow-Up Process SOP", href: "/resource-library", pending: true },
  l2Case: { label: "L2 Case Management Current Operations", href: "/resource-library", pending: true },
  l2Lifecycle: { label: "L2 Client Lifecycle Current Operations", href: "/resource-library", pending: true },
  l2Pause: { label: "L2 Services on Pause Current Operations", href: "/resource-library", pending: true },
  l2Discharge: { label: "L2 Discharges Current Operations", href: "/resource-library", pending: true },
  l2QaEsc: { label: "L2 QA Escalation Review Process SOP", href: "/resource-library", pending: true },
  l2Metrics: { label: "L2 Clinical Quality Metrics Current Operations", href: "/resource-library", pending: true },
  crGuide: { label: "CentralReach Clinical Visibility Guide", href: "/resource-library", pending: true },
  bpRefGuide: { label: "Behavior Plan Reference Guide", href: "/resource-library", pending: true },
  tpRefGuide: { label: "Treatment Plan Reference Guide", href: "/resource-library", pending: true },
  rbtChecklist: { label: "RBT Support Checklist", href: "/resource-library", pending: true },
  familyTemplates: { label: "Family Communication Templates", href: "/resource-library", pending: true },
  escTemplate: { label: "Clinical Escalation Template", href: "/resource-library", pending: true },
  pauseTracker: { label: "Services on Pause Tracker", href: "/resource-library", pending: true },
  ptChecklist: { label: "Parent Training Visibility Checklist", href: "/resource-library", pending: true },
  handoffTemplates: { label: "Cross-Department Handoff Templates", href: "/resource-library", pending: true },
  bsTracker: { label: "Current Behavioral Support Tracker", href: "/resource-library", pending: true },
  hipaa: { label: "Confidentiality / HIPAA Guidance", href: "/resource-library", pending: true },
  clinOverview: { label: "Clinical Services Overview", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<BehavioralSupportDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): BehavioralSupportDayModule {
  return {
    id: `bs-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: BehavioralSupportDayModule[] = [
  day(1, 1, 1, {
    title: "Behavioral Support Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what Behavioral Support does and why it matters. Behavioral Support helps the clinical team keep behavior-related needs visible, organized, and supported — helping RBTs feel guided, families feel heard, BCBAs see support needs sooner, and clinical leadership catch patterns before they grow.",
    objectives: [
      "Explain what Behavioral Support owns and does not own today",
      "Explain BCBA clinical ownership and why it matters",
      "Describe the current behavioral support lifecycle",
      "Explain the owner / status / next action / follow-up date rule",
    ],
    lessons: [
      { id: "w1d1-l1", title: "What Behavioral Support owns today", kind: "Overview", minutes: 10, summary: "Support-need visibility, RBT support routing, family support (bounded), behavior/treatment plan awareness, escalation routing, follow-up." },
      { id: "w1d1-l2", title: "What Behavioral Support does not own", kind: "Overview", minutes: 8, summary: "Not clinical supervision, not writing plans, not final clinical decisions, not intake, not auths, not scheduling, not staffing, not billing/payroll." },
      { id: "w1d1-l3", title: "BCBA clinical ownership boundary", kind: "SOP", minutes: 10, summary: "The BCBA owns clinical direction; Behavioral Support reinforces approved guidance and routes questions." },
      { id: "w1d1-l4", title: "Behavioral support lifecycle", kind: "Workflow", minutes: 10, summary: "Concern identified → context reviewed → BCBA/clinical owner confirmed → action documented → RBT/family/team follow-up → escalation when needed." },
    ],
    checklist: [
      "Can explain what Behavioral Support owns",
      "Can explain what Behavioral Support does not own",
      "Can explain why BCBA clinical ownership matters",
      "Can describe the basic behavioral support lifecycle",
    ],
    shadowing: ["Sit with BCBA/Clinical leader, Behavioral Support mentor, Case Manager, or assigned manager for 30–60 minutes and watch how they review behavior-related support needs."],
    livePractice: ["No live behavioral support ownership yet — observe only."],
    resources: [R.l1BcbaSup, R.l1CmSop, R.l2BP, R.l2Escalation, R.l2RbtSupport, R.hipaa, R.clinOverview],
    knowledgeCheck: {
      q: "What four things should every behavioral support item have before you leave it?",
      a: "Owner, status, next action, follow-up date. Behavioral Support does not replace BCBA supervision.",
    },
    reflectionPrompt: "In your own words, how can Behavioral Support help without taking over BCBA clinical ownership?",
  }),
  day(1, 2, 2, {
    title: "Current Behavioral Support Systems Tour — CentralReach, Clinical Documents, Outlook, Teams, and Trackers",
    description:
      "Learn today's systems: CentralReach for client / session / documentation visibility, behavior plans and treatment plans, current clinical / case trackers, Outlook/Teams for family, BCBA, and cross-department communication, and where clinical documentation lives.",
    objectives: [
      "Identify today's main behavioral support tools",
      "Explain what CentralReach is used for in behavioral support",
      "Find support need, owner, status, and next action in sample items",
      "Explain confidentiality expectations",
    ],
    lessons: [
      { id: "w1d2-l1", title: "CentralReach basics for clinical visibility", kind: "SOP", minutes: 12, summary: "Where client, session, documentation, and clinical information may be viewed by role." },
      { id: "w1d2-l2", title: "Behavior plan / treatment plan document awareness", kind: "Overview", minutes: 10, summary: "Where plans live and how to reference — not edit." },
      { id: "w1d2-l3", title: "Current clinical / case trackers", kind: "SOP", minutes: 10, summary: "Client, state, BCBA, RBT/staff, family contact, concern/support need, plan status, owner, next action, notes." },
      { id: "w1d2-l4", title: "Outlook / Teams communication basics", kind: "SOP", minutes: 8, summary: "Documented, professional family and internal communication." },
      { id: "w1d2-l5", title: "Documentation and confidentiality", kind: "SOP", minutes: 10, summary: "Behavior/clinical info is sensitive; share on a need-to-know basis." },
    ],
    checklist: [
      "Identified main current clinical tools",
      "Explained what CentralReach is used for today",
      "Found support need / owner / status / next action in samples",
      "Explained confidentiality expectations",
    ],
    shadowing: ["Watch mentor review one behavior-support item across CentralReach / current documents and communication notes."],
    livePractice: ["In training/sandbox or with mentor supervision, locate 3 sample behavior-support items and point out owner / status / next action / follow-up date."],
    resources: [R.l2BP, R.l2TP, R.l2ClinicalDocs, R.l2FamilyComm, R.crGuide, R.bsTracker],
    knowledgeCheck: {
      q: "Is CentralReach part of today's clinical visibility, and should support notes include owner and next action?",
      a: "Yes to both — CentralReach is central; every support note names an owner and next action.",
    },
    reflectionPrompt: "Which behavioral support system or tracker is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "Behavior Plan Awareness",
    description:
      "Learn what behavior plans are, why they matter, and how Behavioral Support may support visibility without writing plans independently.",
    objectives: [
      "Explain behavior plan purpose",
      "Explain BCBA ownership of behavior plans",
      "Identify support needs and route plan-content questions to BCBA",
    ],
    lessons: [
      { id: "w1d3-l1", title: "Behavior plan purpose", kind: "Overview", minutes: 8, summary: "What behavior plans do for clients, families, and the clinical program." },
      { id: "w1d3-l2", title: "BCBA ownership of behavior plans", kind: "SOP", minutes: 10, summary: "Only the BCBA authors and changes clinical plan content." },
      { id: "w1d3-l3", title: "Support need identification", kind: "Workflow", minutes: 12, summary: "Understanding, implementation, missing/unclear info, family/RBT question, escalation." },
      { id: "w1d3-l4", title: "Routing questions and concerns", kind: "SOP", minutes: 10, summary: "Route plan content questions to assigned BCBA/Clinical leadership." },
    ],
    checklist: [
      "Can explain behavior plan purpose",
      "Can explain BCBA ownership",
      "Reviewed 3 behavior-plan support scenarios",
      "Drafted support / routing notes",
    ],
    shadowing: ["Watch mentor review behavior plan support needs."],
    livePractice: ["Under mentor supervision, review 3 behavior-plan scenarios and identify next action."],
    resources: [R.l2BP, R.l1BcbaSup, R.l2Escalation, R.bpRefGuide],
    knowledgeCheck: {
      q: "Does Behavioral Support independently write behavior plans, and should behavior plan questions be routed to BCBA/Clinical leadership?",
      a: "No to writing plans; yes — plan questions always go to BCBA/Clinical.",
    },
    reflectionPrompt: "What can go wrong if Behavioral Support changes behavior guidance without BCBA direction?",
  }),
  day(1, 4, 4, {
    title: "Session Expectations and RBT Support Basics",
    description:
      "Learn how session expectations and RBT support connect to behavior support and client care.",
    objectives: [
      "Identify whether an RBT support concern is training, clinical, doc, schedule/staffing, HR, family, or urgent",
      "Route clinical questions to BCBA/Clinical leadership",
      "Document facts, owner, next action, follow-up",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Session expectations basics", kind: "Overview", minutes: 8, summary: "What healthy sessions look like from a behavioral support view." },
      { id: "w1d4-l2", title: "RBT support and retention purpose", kind: "SOP", minutes: 10, summary: "How RBT support affects client care and case health." },
      { id: "w1d4-l3", title: "Identifying RBT support needs", kind: "Workflow", minutes: 12, summary: "Spot signals without overstepping supervision." },
      { id: "w1d4-l4", title: "Routing concerns", kind: "SOP", minutes: 10, summary: "Send to correct owner with a clear note." },
    ],
    checklist: [
      "Reviewed 4 RBT / session support scenarios",
      "Identified correct owner / path",
      "Drafted clear support notes",
    ],
    shadowing: ["Watch mentor review an RBT support concern."],
    livePractice: ["Review 4 RBT / session support scenarios and choose correct owner / next action."],
    resources: [R.l2Sessions, R.l2RbtSupport, R.l1Rbt, R.rbtChecklist],
    knowledgeCheck: {
      q: "Should RBT clinical questions be routed to the BCBA when clinical direction is needed, and should RBT support concerns be documented?",
      a: "Yes to both.",
    },
    reflectionPrompt: "How can Behavioral Support help RBTs feel supported without taking over clinical supervision?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1 and confirm you understand Behavioral Support role boundaries, current systems, behavior plan awareness, session expectations, and RBT support.",
    objectives: [
      "Review 3 sample behavioral support items with mentor",
      "Explain status, next action, owner, clinical boundary, and whether escalation is needed",
      "Identify anything still unclear",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering behavior plans, BCBA ownership, CentralReach / current documents, RBT support, owner/status/next action, and confidentiality." },
      { id: "w1d5-l2", title: "Behavioral Support role boundary check", kind: "Overview", minutes: 8, summary: "Behavioral Support vs BCBA/Clinical vs QA vs Case Management vs State Ops." },
      { id: "w1d5-l3", title: "Support item walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 items end-to-end with mentor." },
      { id: "w1d5-l4", title: "Mentor feedback", kind: "Shadowing", minutes: 10, summary: "Strengths and coaching areas for Week 2." },
    ],
    checklist: [
      "Completed Week 1 quiz",
      "Reviewed 3 support items with mentor",
      "Can explain current systems and role boundaries",
      "Manager / mentor signoff completed",
    ],
    shadowing: ["Watch end-of-day behavioral support review."],
    livePractice: ["Complete supervised behavioral support review checklist for 3 items."],
    resources: [R.l2BP, R.l2RbtSupport, R.binder, R.roleDeepDive],
    knowledgeCheck: {
      q: "What must always be true before you close out a behavioral support item for the day?",
      a: "Owner, status, next action, and follow-up date are set; clinical info stays need-to-know.",
    },
    reflectionPrompt: "What part of Behavioral Support still feels confusing?",
    signoffRequired: "Week 1 manager / mentor signoff required before moving to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: BehavioralSupportDayModule[] = [
  day(2, 1, 6, {
    title: "Family Clinical Communication for Behavioral Support",
    description: "Learn how Behavioral Support communicates with or about families in a warm, clear, documented, clinically appropriate way.",
    objectives: [
      "Distinguish behavioral vs clinical vs scheduling vs auth vs billing vs urgent concerns",
      "Use plain, calm, respectful language",
      "Never provide new clinical direction without BCBA/Clinical approval",
    ],
    lessons: [
      { id: "w2d1-l1", title: "Family communication standard", kind: "SOP", minutes: 10, summary: "Warm, specific, documented — never casual about clinical information." },
      { id: "w2d1-l2", title: "Behavioral concern intake", kind: "Workflow", minutes: 12, summary: "Capture concern, context, family need, and clinical relevance." },
      { id: "w2d1-l3", title: "Clinical boundary in family communication", kind: "SOP", minutes: 10, summary: "Route clinical questions to BCBA / Clinical leadership." },
      { id: "w2d1-l4", title: "Documentation and escalation", kind: "Workflow", minutes: 10, summary: "Family concern, owner, next action, follow-up date." },
    ],
    checklist: [
      "Drafted approved family support messages",
      "Identified clinical vs operational questions",
      "Documented next action / follow-up",
    ],
    shadowing: ["Listen to mentor handle or review family behavior-support communication."],
    livePractice: ["Draft 3 family support messages and 2 escalation / routing notes for mentor review."],
    resources: [R.l2FamilyComm, R.l2Escalation, R.familyTemplates],
    knowledgeCheck: {
      q: "Should Behavioral Support give new clinical advice without BCBA approval, and should family concerns have documented next actions?",
      a: "No to unapproved clinical advice; yes — every family concern has a documented next action.",
    },
    reflectionPrompt: "How can families feel supported even when the BCBA must answer the clinical question?",
  }),
  day(2, 2, 7, {
    title: "Parent Training Visibility",
    description: "Learn how parent training connects to behavior support and family confidence.",
    objectives: [
      "Identify whether parent training is scheduled / happening / delayed / missing",
      "Route clinical content questions to BCBA",
      "Document status and next action",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Parent training purpose", kind: "Overview", minutes: 8, summary: "Why parent training matters to outcomes." },
      { id: "w2d2-l2", title: "Parent training status awareness", kind: "SOP", minutes: 10, summary: "Where and how to see status today." },
      { id: "w2d2-l3", title: "Behavior support connection", kind: "Workflow", minutes: 10, summary: "How parent training supports behavior plans in the home." },
      { id: "w2d2-l4", title: "BCBA follow-up", kind: "SOP", minutes: 10, summary: "Route clinical content and delays to BCBA/Clinical." },
    ],
    checklist: [
      "Reviewed 3 parent-training scenarios",
      "Identified owner and next action",
      "Drafted family / BCBA follow-up note",
    ],
    shadowing: ["Watch mentor review parent training status or family support need."],
    livePractice: ["Review 3 parent-training scenarios and recommend next action."],
    resources: [R.l2ParentTraining, R.l2FamilyComm, R.l1BcbaSup, R.ptChecklist],
    knowledgeCheck: {
      q: "Does Behavioral Support own clinical parent-training content, and should parent training gaps be visible and routed?",
      a: "No to owning content; yes — gaps must be visible and routed.",
    },
    reflectionPrompt: "Why does parent training visibility matter for behavior support?",
  }),
  day(2, 3, 8, {
    title: "Treatment Plan Awareness",
    description: "Learn how treatment plans connect to behavioral support while remaining under BCBA ownership.",
    objectives: [
      "Explain treatment plan vs behavior plan at a high level",
      "Route clinical plan questions to BCBA/Clinical leadership",
      "Route quality/documentation questions to QA where appropriate",
    ],
    lessons: [
      { id: "w2d3-l1", title: "Treatment plan purpose", kind: "Overview", minutes: 8, summary: "What treatment plans do for clients, families, and clinical direction." },
      { id: "w2d3-l2", title: "Treatment plan vs behavior plan", kind: "SOP", minutes: 10, summary: "Different documents, different purposes, same BCBA ownership." },
      { id: "w2d3-l3", title: "Support questions and gaps", kind: "Workflow", minutes: 12, summary: "What Behavioral Support can help route." },
      { id: "w2d3-l4", title: "QA / BCBA routing", kind: "SOP", minutes: 10, summary: "Send quality questions to QA; clinical questions to BCBA." },
    ],
    checklist: [
      "Can explain treatment plan vs behavior plan at a high level",
      "Reviewed 3 scenarios",
      "Routed questions correctly",
    ],
    shadowing: ["Watch mentor review treatment-plan-related support need."],
    livePractice: ["Review 3 treatment-plan support scenarios and choose next action."],
    resources: [R.l2TP, R.l2TpQa, R.l1BcbaSup, R.tpRefGuide],
    knowledgeCheck: {
      q: "Does Behavioral Support write treatment plans for the BCBA, and can treatment plan awareness help route behavioral support needs?",
      a: "No to writing plans; yes — awareness supports routing.",
    },
    reflectionPrompt: "How can Behavioral Support use treatment plan awareness without becoming the plan author?",
  }),
  day(2, 4, 9, {
    title: "Clinical Documentation Awareness",
    description: "Learn how clinical documentation affects support visibility, QA, and follow-up.",
    objectives: [
      "Identify missing / unclear / late documentation",
      "Route to correct owner (BCBA / QA / Clinical)",
      "Never edit clinical documentation without authorization",
    ],
    lessons: [
      { id: "w2d4-l1", title: "Clinical documentation purpose", kind: "Overview", minutes: 8, summary: "Why documentation matters for care continuity and QA." },
      { id: "w2d4-l2", title: "Documentation visibility", kind: "SOP", minutes: 10, summary: "What Behavioral Support can see and cite." },
      { id: "w2d4-l3", title: "Missing / unclear documentation", kind: "Workflow", minutes: 12, summary: "Identify and route without overstepping." },
      { id: "w2d4-l4", title: "QA / Clinical routing", kind: "SOP", minutes: 10, summary: "Route to the correct owner with follow-up." },
    ],
    checklist: [
      "Reviewed 4 documentation scenarios",
      "Identified correct owner",
      "Drafted follow-up note",
    ],
    shadowing: ["Watch mentor review a documentation visibility issue."],
    livePractice: ["Review 4 documentation scenarios and recommend next action."],
    resources: [R.l2ClinicalDocs, R.l2DocStd, R.l2MissingItem],
    knowledgeCheck: {
      q: "Should documentation issues be routed to the correct owner, and should Behavioral Support edit clinical documentation without authorization?",
      a: "Yes to routing; no to unauthorized edits.",
    },
    reflectionPrompt: "How can missing documentation make behavioral support harder?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description: "Complete a supervised mini-shift using current family / RBT / clinical support visibility tasks.",
    objectives: [
      "Run 5–8 low-risk behavioral support tasks with mentor review",
      "Keep every item's next step visible",
      "Maintain confidentiality end-to-end",
    ],
    lessons: [
      { id: "w2d5-l1", title: "Family behavioral concern review", kind: "Live Practice", minutes: 10, summary: "Draft warm, boundaried family communication." },
      { id: "w2d5-l2", title: "Parent training visibility review", kind: "Live Practice", minutes: 10, summary: "Route parent-training follow-up." },
      { id: "w2d5-l3", title: "Treatment / behavior plan awareness review", kind: "Live Practice", minutes: 10, summary: "Track visibility without editing clinical content." },
      { id: "w2d5-l4", title: "Clinical documentation awareness review", kind: "Reflection", minutes: 10, summary: "Mentor reviews notes for clarity and boundary." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No behavioral support item left without next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list."],
    resources: [R.l2FamilyComm, R.l2ParentTraining, R.l2TP, R.l2ClinicalDocs],
    knowledgeCheck: {
      q: "What must always be true at the end of a mini-shift?",
      a: "Every item has owner, status, next action, and follow-up date; clinical info stays need-to-know.",
    },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 manager / mentor signoff required before moving to Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: BehavioralSupportDayModule[] = [
  day(3, 1, 11, {
    title: "Clinical Escalation and Case Review",
    description: "Learn when behavior-related concerns should be escalated and how to prepare useful case-review notes.",
    objectives: [
      "Identify escalation trigger and correct owner",
      "Write escalation notes with concern, context, impact, attempted actions, owner, requested decision, follow-up",
      "Avoid sending everything to State Director without clinical context",
    ],
    lessons: [
      { id: "w3d1-l1", title: "Escalation criteria", kind: "SOP", minutes: 10, summary: "Safety concerns, increased behavior concerns, family concerns, RBT support needs, repeated implementation issues, doc gaps, service pauses, parent training concerns, clinical uncertainty." },
      { id: "w3d1-l2", title: "Behavioral concern summary", kind: "Workflow", minutes: 10, summary: "Concise, factual, respectful summary." },
      { id: "w3d1-l3", title: "Clinical vs operational escalations", kind: "SOP", minutes: 10, summary: "BCBA, Clinical leadership, QA, Case Manager, State Ops, Scheduling/Staffing, or manager." },
      { id: "w3d1-l4", title: "Case review notes", kind: "SOP", minutes: 12, summary: "Facts, impact, requested decision, follow-up date." },
    ],
    checklist: [
      "Reviewed 5 escalation scenarios",
      "Identified correct owner / path",
      "Drafted escalation note",
    ],
    shadowing: ["Watch mentor review a behavior-related escalation."],
    livePractice: ["Review 5 escalation scenarios and choose correct owner / path."],
    resources: [R.l2Escalation, R.l2BP, R.l2FamilyComm, R.escTemplate],
    knowledgeCheck: {
      q: "Should escalations include context, impact, owner, and requested next step, and should every issue automatically go to the State Director without clinical context?",
      a: "Yes to structured escalations; no — never send everything to State Director without context.",
    },
    reflectionPrompt: "What makes a behavioral escalation actionable for a BCBA or clinical leader?",
  }),
  day(3, 2, 12, {
    title: "Services on Pause and Behavioral Support",
    description: "Learn how behavior-related concerns may connect to services on pause and how to support visibility.",
    objectives: [
      "Identify pause reason (behavior support, staffing, family, clinical, auth, scheduling, other)",
      "Confirm who owns restart plan",
      "Document behavioral support need and follow-up",
    ],
    lessons: [
      { id: "w3d2-l1", title: "Services on pause basics", kind: "Overview", minutes: 8, summary: "Why paused services need active ownership." },
      { id: "w3d2-l2", title: "Behavior-related pause reasons", kind: "SOP", minutes: 10, summary: "Common behavior-linked pause scenarios." },
      { id: "w3d2-l3", title: "Restart support visibility", kind: "Workflow", minutes: 12, summary: "What Behavioral Support can help track for restart." },
      { id: "w3d2-l4", title: "Escalation and follow-up", kind: "SOP", minutes: 10, summary: "Route clinical concerns to BCBA/Clinical leadership." },
    ],
    checklist: [
      "Reviewed 4 pause scenarios",
      "Identified pause reason and owner",
      "Drafted restart / support follow-up note",
    ],
    shadowing: ["Watch mentor review services-on-pause case involving clinical/behavior support."],
    livePractice: ["Review 4 services-on-pause scenarios and recommend next action."],
    resources: [R.l2Pause, R.l2Escalation, R.l2Case, R.pauseTracker],
    knowledgeCheck: {
      q: "Should paused services sit without restart plan or follow-up, and should behavioral support needs be routed to BCBA/Clinical leadership when clinical?",
      a: "No to unowned pauses; yes — clinical concerns go to BCBA/Clinical leadership.",
    },
    reflectionPrompt: "Why do paused services need clear clinical and operational ownership?",
  }),
  day(3, 3, 13, {
    title: "Discharge Awareness and Behavioral Support",
    description: "Learn how discharge workflows may involve behavior support visibility while clinical decisions remain with clinical leadership.",
    objectives: [
      "Identify behavioral context, family concern, clinical owner, documentation needs, and next action",
      "Do not make clinical discharge decisions unless assigned/qualified",
      "Route questions to BCBA/Clinical leadership and document support/handoff",
    ],
    lessons: [
      { id: "w3d3-l1", title: "Discharge awareness", kind: "Overview", minutes: 8, summary: "Why respectful, organized discharge matters." },
      { id: "w3d3-l2", title: "Behavioral context in discharge", kind: "SOP", minutes: 10, summary: "What Behavioral Support may surface for the clinical owner." },
      { id: "w3d3-l3", title: "Family communication boundary", kind: "SOP", minutes: 10, summary: "Warm, specific, non-clinical support communication." },
      { id: "w3d3-l4", title: "Documentation and handoff", kind: "Workflow", minutes: 12, summary: "Clear, dated, respectful handoff to clinical owner." },
    ],
    checklist: [
      "Reviewed 3 discharge scenarios",
      "Identified clinical owner / next action",
      "Drafted clear support note",
    ],
    shadowing: ["Watch mentor review discharge scenario involving clinical/behavior support."],
    livePractice: ["Review 3 discharge scenarios and draft support / handoff notes."],
    resources: [R.l2Discharge, R.l2FamilyComm, R.l2Escalation],
    knowledgeCheck: {
      q: "Does Behavioral Support make discharge decisions by default, and should discharge-related support notes be clear and respectful?",
      a: "No to clinical decisions; yes — always clear and respectful.",
    },
    reflectionPrompt: "How can Behavioral Support help with discharge visibility without owning the discharge decision?",
  }),
  day(3, 4, 14, {
    title: "Cross-Department Behavioral Support Handoffs",
    description: "Learn how behavioral support concerns may need coordination with Case Management, QA, Scheduling, Staffing, HR, Training, and State Ops.",
    objectives: [
      "Identify which department owns the next action",
      "Write clear handoffs: client/staff/family, concern, context, urgency, owner, requested action, follow-up",
      "Keep clinical and employee information need-to-know",
    ],
    lessons: [
      { id: "w3d4-l1", title: "Case Management handoff", kind: "SOP", minutes: 10, summary: "When to loop in Case Management." },
      { id: "w3d4-l2", title: "QA / Documentation handoff", kind: "SOP", minutes: 10, summary: "When to loop in QA." },
      { id: "w3d4-l3", title: "Scheduling / Staffing handoff", kind: "SOP", minutes: 10, summary: "When behavior support needs schedule/staffing coordination." },
      { id: "w3d4-l4", title: "HR / Training / State Ops handoff", kind: "SOP", minutes: 10, summary: "When to loop in HR, Training, or State Ops." },
    ],
    checklist: [
      "Drafted 5 clear handoffs",
      "Identified correct owner",
      "Included context / impact / requested action / follow-up",
    ],
    shadowing: ["Watch mentor complete cross-department support handoffs."],
    livePractice: ["Draft 5 behavioral support handoffs for mentor review."],
    resources: [R.l2Escalation, R.l2Case, R.l2QaEsc, R.handoffTemplates],
    knowledgeCheck: {
      q: "Should handoffs identify owner and requested action, and should behavior concerns be described vaguely without context?",
      a: "Yes to structured handoffs; no to vague concerns.",
    },
    reflectionPrompt: "What makes another department able to act on a behavioral support handoff immediately?",
  }),
  day(3, 5, 15, {
    title: "Behavioral Support Trend Awareness and End-of-Day Cleanup",
    description: "Identify patterns and close the day with a clean support queue.",
    objectives: [
      "Identify repeated concerns (same client, same RBT, same family, same setting, recurring implementation or documentation issue)",
      "Confirm every item has status, owner, next action, follow-up date",
      "Escalate trends to BCBA/Clinical leadership when appropriate",
    ],
    lessons: [
      { id: "w3d5-l1", title: "Trend awareness", kind: "Overview", minutes: 10, summary: "Patterns leaders need to see." },
      { id: "w3d5-l2", title: "Repeated support needs", kind: "Workflow", minutes: 10, summary: "Spot recurrences across items." },
      { id: "w3d5-l3", title: "End-of-day queue cleanup", kind: "Workflow", minutes: 12, summary: "Nothing left silently pending." },
      { id: "w3d5-l4", title: "Tomorrow's priority list", kind: "Workflow", minutes: 10, summary: "Set up tomorrow before you leave." },
    ],
    checklist: [
      "Completed queue cleanup",
      "Identified possible trends",
      "No assigned item left without next action",
      "Created tomorrow priority list",
    ],
    shadowing: ["Watch mentor complete end-of-day support queue cleanup."],
    livePractice: ["Clean up 8–10 assigned / simulated behavioral support items with mentor review."],
    resources: [R.l2Escalation, R.l2RbtSupport, R.l2Metrics],
    knowledgeCheck: {
      q: "Should repeated support needs be surfaced to clinical leadership, and should every support item have a next action before end of day?",
      a: "Yes to both.",
    },
    reflectionPrompt: "What makes a behavioral support queue feel controlled instead of reactive?",
    signoffRequired: "Week 3 manager / mentor signoff required before moving to Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: BehavioralSupportDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled Behavioral Support Queue Ownership — Part 1",
    description: "Own a small set of real behavioral support tasks with mentor review.",
    objectives: [
      "Prioritize behavioral support work",
      "Complete assigned work accurately",
      "End day with no assigned item lacking next action",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning support queue review", kind: "Workflow", minutes: 10, summary: "Set the day's priorities." },
      { id: "w4d1-l2", title: "Prioritizing behavioral support work", kind: "SOP", minutes: 10, summary: "Urgent family concerns, RBT support needs, behavior plan questions, escalations, pauses, repeated patterns, doc/comm blockers." },
      { id: "w4d1-l3", title: "Updating current notes / trackers", kind: "SOP", minutes: 10, summary: "Keep systems accurate as you work." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "Workflow", minutes: 10, summary: "Nothing left silently pending." },
    ],
    checklist: [
      "Completed assigned queue",
      "Updated current systems accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned behavioral support tasks with mentor review."],
    resources: [R.l2BP, R.l2RbtSupport, R.l2Escalation, R.l2FamilyComm],
    knowledgeCheck: {
      q: "What should be true at end of day about your assigned behavioral support queue?",
      a: "Every item has current status, owner, next action, and follow-up date; clinical info stays need-to-know.",
    },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled Behavioral Support Queue Ownership — Part 2",
    description: "Repeat controlled ownership with more independence.",
    objectives: [
      "Own more with less oversight",
      "Escalate clinical uncertainty, family concerns, RBT support needs, repeated implementation, doc gaps, and pauses to correct owners",
      "Keep queue clean and follow-ups on time",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "SOP", minutes: 10, summary: "Follow-up dates land, don't drift." },
      { id: "w4d2-l2", title: "Clinical boundary", kind: "SOP", minutes: 10, summary: "Route clinical decisions to Clinical / BCBA owner." },
      { id: "w4d2-l3", title: "RBT / family support communication", kind: "Workflow", minutes: 10, summary: "Warm, specific, boundaried." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Facts, impact, requested next step." },
    ],
    checklist: [
      "Completed queue work",
      "Escalated blockers correctly",
      "No stale / unowned assigned support item",
    ],
    shadowing: ["Minimal — learner performs while mentor reviews."],
    livePractice: ["Own 10–15 assigned behavioral support tasks."],
    resources: [R.l2Sessions, R.l2RbtSupport, R.l2Escalation, R.l2Pause],
    knowledgeCheck: {
      q: "Where should clinical uncertainty, family concerns, RBT support needs, repeated implementation issues, doc gaps, and service-pause concerns be routed?",
      a: "To the correct owner (BCBA/Clinical, Case Manager, QA, Scheduling, Staffing, HR/Training, or State Ops) with facts, impact, and requested next step.",
    },
    reflectionPrompt: "What did you escalate today and why?",
  }),
  day(4, 3, 18, {
    title: "Behavioral Support Communication Quality Day",
    description: "Clear, warm, clinically appropriate communication with families, RBTs, BCBAs, Clinical leadership, Case Management, QA, Scheduling/Staffing, HR/Training, and State Ops.",
    objectives: [
      "Write clear behavioral support notes",
      "Keep family/RBT communication warm, specific, and within role boundaries",
      "Communicate urgency when safety, family trust, staff confidence, or service continuity is at risk",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Clear behavioral support notes", kind: "SOP", minutes: 12, summary: "Concern, context, plan/status if known, owner, impact, follow-up date." },
      { id: "w4d3-l2", title: "Family communication tone", kind: "Workflow", minutes: 10, summary: "Warm, specific, boundaried." },
      { id: "w4d3-l3", title: "RBT support tone", kind: "Workflow", minutes: 10, summary: "Supportive, non-supervisory, respectful." },
      { id: "w4d3-l4", title: "BCBA / Clinical handoff quality", kind: "SOP", minutes: 10, summary: "Specific, dated, respectful — no clinical overreach." },
    ],
    checklist: [
      "Drafted 5 clear notes / handoffs",
      "Mentor approved tone and specificity",
      "Clinical boundary handled correctly",
    ],
    shadowing: ["Mentor reviews written support notes and family/RBT/handoff communication."],
    livePractice: ["Draft 5 behavioral support notes / messages / handoffs for mentor review."],
    resources: [R.l2FamilyComm, R.l2RbtSupport, R.l2Escalation, R.handoffTemplates],
    knowledgeCheck: {
      q: "What kind of behavioral support communication helps people feel supported and still keeps clinical ownership clear?",
      a: "Warm, specific, dated, boundaried — clear about issue, owner, next action, and follow-up.",
    },
    reflectionPrompt: "What kind of behavioral support communication helps people feel supported and still keeps clinical ownership clear?",
  }),
  day(4, 4, 19, {
    title: "End-to-End Behavioral Support Simulation",
    description: "Complete a full behavioral support simulation from support need review through family / RBT communication, BCBA handoff, escalation, and follow-up plan.",
    objectives: [
      "Run one behavioral support scenario end-to-end",
      "Pass mentor review",
      "Complete a real task set alongside the simulation",
    ],
    lessons: [
      { id: "w4d4-l1", title: "Support need intake simulation", kind: "Live Practice", minutes: 10, summary: "Capture concern, context, owner, next step." },
      { id: "w4d4-l2", title: "Behavior plan / treatment plan awareness simulation", kind: "Live Practice", minutes: 10, summary: "Reference plans without editing." },
      { id: "w4d4-l3", title: "RBT or family support simulation", kind: "Live Practice", minutes: 12, summary: "Draft warm, boundaried support communication." },
      { id: "w4d4-l4", title: "Clinical escalation simulation", kind: "Live Practice", minutes: 10, summary: "Escalate to BCBA/Clinical with facts, impact, requested decision." },
      { id: "w4d4-l5", title: "Follow-up and cleanup simulation", kind: "Live Practice", minutes: 12, summary: "Close cleanly with owner, status, next action, follow-up." },
    ],
    checklist: [
      "Completed full simulation",
      "Passed mentor review",
      "Completed real task set",
    ],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l2BP, R.l2TP, R.l2RbtSupport, R.l2FamilyComm, R.l2Escalation, R.l1BcbaSup, R.l1Rbt],
    knowledgeCheck: {
      q: "What part of the full behavioral support process do you still need more repetitions on?",
      a: "Any step the learner cannot execute end-to-end without prompting — schedule reps.",
    },
    reflectionPrompt: "What part of the full behavioral support process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description: "Complete final review; manager determines readiness for ongoing behavioral support ownership and sets a 30-day plan.",
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
    livePractice: ["Learner runs a short behavioral support queue review while manager observes."],
    resources: [R.role306090, R.roleDeepDive, R.l2BP, R.l2RbtSupport, R.l2FamilyComm, R.l2Escalation],
    knowledgeCheck: {
      q: "Final: name any 3 of — behavioral support lifecycle, current systems (CentralReach / clinical docs / current trackers / Outlook / Teams), owner/status/next action/follow-up, behavior plan awareness, treatment plan awareness, BCBA clinical ownership, RBT support and retention, session expectations, family clinical communication, parent training visibility, clinical documentation awareness, services on pause, discharge awareness, clinical escalation and case review, cross-department handoffs, confidentiality and clinical boundaries.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about Behavioral Support that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into independent ownership with a 30-day plan.",
  }),
];

export const BEHAVIORAL_SUPPORT_DAYS: BehavioralSupportDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getBehavioralSupportDay(sourceModuleId: string): BehavioralSupportDayModule | undefined {
  return BEHAVIORAL_SUPPORT_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalBehavioralSupportMinutes(): number {
  return BEHAVIORAL_SUPPORT_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}