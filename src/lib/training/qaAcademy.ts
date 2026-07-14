/**
 * QA Team Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new QA reviewer on today's Blossom QA process using current tools
 * (CentralReach, current QA trackers, Monday/current trackers where used,
 * NoteGuard if assigned, Amerigroup review if assigned, Outlook/Teams) and
 * clean handoffs to Clinical, Authorizations, State Ops, RBT support/training.
 *
 * Mirrors `credentialingAcademy.ts` so it plugs into the same academy adapter
 * without touching other role/department curricula.
 */

export type QaLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface QaLesson {
  id: string;
  title: string;
  summary: string;
  kind: QaLessonKind;
  minutes: number;
}

export interface QaResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface QaDayModule {
  /** Source module id — becomes `qa::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: QaLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: QaResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface QaWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const QA_WEEKS: QaWeek[] = [
  { weekNumber: 1, title: "Week 1 · QA Foundations, Welcome, Current Systems, Documentation Standards, and Role Boundaries",
    goal: "Understand Blossom, the QA Team's purpose, today's systems, documentation standards, confidentiality, and the difference between QA, Clinical ownership, Authorizations, Compliance, and State Ops." },
  { weekNumber: 2, title: "Week 2 · Clinical Report Review, Missing Items, Corrections, and External Document Follow-Up",
    goal: "Move from observation into supervised execution of common QA review and follow-up tasks." },
  { weekNumber: 3, title: "Week 3 · Compliance Reviews, Audits, NoteGuard/Amerigroup, New RBT Check-Ins, Metrics, and Escalation",
    goal: "Own more work with review, learn compliance and audit judgment points, and practice trend reporting/escalation." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, QA Communication Quality, Simulation, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real QA work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1QaSop: { label: "L1 QA Director / QA Reviewer Role SOP", href: "/resource-library", pending: true },
  binder: { label: "Quality Assurance Compliance and Documentation Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "QA Director / QA Reviewer Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "QA Director / QA Reviewer Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l1BcbaSup: { label: "L1 BCBA Clinical Supervisor Role SOP", href: "/resource-library", pending: true },
  l1AuthMgr: { label: "L1 Authorizations / Utilization Manager Role SOP", href: "/resource-library", pending: true },
  l2Review: { label: "L2 QA Review Current Operations", href: "/resource-library", pending: true },
  l2DocStd: { label: "L2 Documentation Standards Current Operations", href: "/resource-library", pending: true },
  l2TpQa: { label: "L2 Treatment Plan QA Current Operations", href: "/resource-library", pending: true },
  l2Audits: { label: "L2 Audits Current Operations", href: "/resource-library", pending: true },
  l2Metrics: { label: "L2 Clinical Quality Metrics Current Operations", href: "/resource-library", pending: true },
  l2Compliance: { label: "L2 Compliance Reviews Current Operations", href: "/resource-library", pending: true },
  l2Corrections: { label: "L2 Corrections Current Operations", href: "/resource-library", pending: true },
  l2ReportQa: { label: "L2 Clinical Report QA Review Process SOP", href: "/resource-library", pending: true },
  l2MissingItem: { label: "L2 Documentation Missing Item Follow-Up Process SOP", href: "/resource-library", pending: true },
  l2FaxChase: { label: "L2 Fax and External Document Chase Process SOP", href: "/resource-library", pending: true },
  l2Escalation: { label: "L2 QA Escalation Review Process SOP", href: "/resource-library", pending: true },
  l2TrendReport: { label: "L2 QA Trend Reporting Process SOP", href: "/resource-library", pending: true },
  crGuide: { label: "CentralReach QA / Reference Guide", href: "/resource-library", pending: true },
  trackerGuide: { label: "QA Tracker Field Guide", href: "/resource-library", pending: true },
  tpChecklist: { label: "Treatment Plan QA Checklist", href: "/resource-library", pending: true },
  reportChecklist: { label: "Clinical Report QA Checklist", href: "/resource-library", pending: true },
  docChecklist: { label: "Documentation Standards Checklist", href: "/resource-library", pending: true },
  correctionTpl: { label: "Correction Request Templates", href: "/resource-library", pending: true },
  complianceChecklist: { label: "Compliance Review Checklist", href: "/resource-library", pending: true },
  auditChecklist: { label: "Audit Checklist", href: "/resource-library", pending: true },
  noteGuard: { label: "NoteGuard Guide", href: "/resource-library", pending: true },
  amerigroup: { label: "Amerigroup Daily Note Review Guide", href: "/resource-library", pending: true },
  rbtCheckIn: { label: "New RBT Check-In Guide", href: "/resource-library", pending: true },
  escTemplate: { label: "QA Escalation Template", href: "/resource-library", pending: true },
  trendTemplate: { label: "QA Trend Report Template", href: "/resource-library", pending: true },
  hipaa: { label: "Confidentiality / HIPAA Guidance", href: "/resource-library", pending: true },
  clinStandards: { label: "Clinical Quality Standards", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<QaDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): QaDayModule {
  return {
    id: `qa-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: QaDayModule[] = [
  day(1, 1, 1, {
    title: "QA Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what QA does and why it matters. QA protects clinical quality, documentation accuracy, compliance readiness, and clinical process trust. When QA is unclear, treatment plans get delayed, reports sit too long, authorizations get blocked, documentation drifts, and leaders lose visibility into quality issues.",
    objectives: [
      "Explain what QA owns and does not own today",
      "Describe the current QA lifecycle end-to-end",
      "Explain the owner / status / next action / follow-up date rule",
      "Explain confidentiality and clinical sensitivity",
    ],
    lessons: [
      { id: "w1d1-l1", title: "What QA owns today", kind: "Overview", minutes: 10, summary: "Review of clinical reports and treatment plans, documentation standards, missing-item follow-up, corrections, compliance/audits, trend reporting, escalation." },
      { id: "w1d1-l2", title: "What QA does not own", kind: "Overview", minutes: 8, summary: "Not clinical judgment, not writing the treatment plan for the BCBA, not authorizations, not intake, not scheduling, not payroll." },
      { id: "w1d1-l3", title: "Current QA lifecycle", kind: "Workflow", minutes: 10, summary: "Item enters queue → review → missing/correction items documented → owner set → follow-up → corrections reviewed → escalated when needed → final status updated." },
      { id: "w1d1-l4", title: "Confidentiality and clinical sensitivity", kind: "SOP", minutes: 10, summary: "Clinical QA content is sensitive; share on a need-to-know basis and stay respectful in every note." },
    ],
    checklist: [
      "Can explain what QA owns",
      "Can explain what QA does not own",
      "Can explain why QA impacts clinical quality, auth readiness, and compliance",
      "Can describe the basic QA lifecycle",
    ],
    shadowing: ["Sit with QA Director (e.g. Rochel Walzman), QA Reviewer, or assigned mentor for 30–60 minutes and watch how they review the QA queue."],
    livePractice: ["No live QA ownership yet — observe only."],
    resources: [R.l1QaSop, R.binder, R.roleDeepDive, R.l2Review, R.hipaa, R.clinStandards],
    knowledgeCheck: {
      q: "What four things should every QA item have before you leave it?",
      a: "Owner, status, next action, follow-up date. QA does not replace the BCBA's clinical ownership.",
    },
    reflectionPrompt: "In your own words, why does QA matter to Blossom's clinical quality and operational flow?",
  }),
  day(1, 2, 2, {
    title: "Current QA Systems Tour — CentralReach, QA Trackers, NoteGuard/Amerigroup, Outlook, Teams",
    description:
      "Learn today's systems: CentralReach for clinical/documentation visibility, current QA/document/report trackers, Monday/current trackers where used, NoteGuard and Amerigroup review where assigned, and Outlook/Teams for QA communication.",
    objectives: [
      "Identify today's main QA tools",
      "Find key QA status fields",
      "Explain what CentralReach is used for in QA",
      "Explain where correction/follow-up notes should be documented",
    ],
    lessons: [
      { id: "w1d2-l1", title: "CentralReach basics for QA", kind: "SOP", minutes: 12, summary: "Where clinical notes, reports, and client documentation may be reviewed." },
      { id: "w1d2-l2", title: "Current QA tracker / Monday tracker basics", kind: "SOP", minutes: 10, summary: "Client, BCBA, RBT, state, document type, due date, status, missing items, correction owner, follow-up, reviewer, notes." },
      { id: "w1d2-l3", title: "NoteGuard awareness", kind: "Overview", minutes: 8, summary: "Assigned workflow (e.g. Anje Grobler) — not universal to every QA task." },
      { id: "w1d2-l4", title: "Amerigroup review awareness", kind: "Overview", minutes: 8, summary: "Assigned daily note review workflow." },
      { id: "w1d2-l5", title: "Outlook / Teams communication basics", kind: "SOP", minutes: 10, summary: "Professional QA correction and escalation communication norms." },
    ],
    checklist: [
      "Identified main current QA tools",
      "Found key QA status fields",
      "Explained what CentralReach is used for in QA",
      "Explained where correction/follow-up notes should be documented",
    ],
    shadowing: ["Watch mentor review one QA item across CentralReach / current tracker and communication notes."],
    livePractice: ["In training/sandbox or with mentor supervision, locate 3 sample QA items and point out owner/status/next action/follow-up date."],
    resources: [R.l2Review, R.l2DocStd, R.l2Compliance, R.crGuide, R.trackerGuide, R.noteGuard, R.amerigroup],
    knowledgeCheck: {
      q: "Are NoteGuard/Amerigroup reviews assigned workflows, and is CentralReach part of today's QA reality?",
      a: "Yes to both — apply NoteGuard/Amerigroup only where assigned; CentralReach is central to QA visibility.",
    },
    reflectionPrompt: "Which QA system or tracker is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "Documentation Standards Basics",
    description:
      "Learn the purpose of documentation standards and how to review for clarity, completeness, and consistency without rewriting clinical content.",
    objectives: [
      "Identify common documentation categories",
      "Identify missing/unclear/incomplete/inconsistent/late items",
      "Write clear, respectful correction notes",
    ],
    lessons: [
      { id: "w1d3-l1", title: "Documentation standards purpose", kind: "Overview", minutes: 8, summary: "Why standards protect clinical quality and downstream operations." },
      { id: "w1d3-l2", title: "Common documentation categories", kind: "SOP", minutes: 10, summary: "Notes, reports, treatment plans, forms, signatures/dates, payer-specific items." },
      { id: "w1d3-l3", title: "Missing item identification", kind: "Workflow", minutes: 12, summary: "Read against the current QA checklist or standard." },
      { id: "w1d3-l4", title: "Correction note quality", kind: "SOP", minutes: 10, summary: "What is wrong/missing, who owns it, what to fix, follow-up date." },
    ],
    checklist: [
      "Reviewed 3 sample documentation items",
      "Identified missing/correction items",
      "Drafted clear correction notes",
    ],
    shadowing: ["Watch mentor review a documentation sample and explain correction notes."],
    livePractice: ["Under mentor supervision, review 3 sample documentation items and identify issues."],
    resources: [R.l2DocStd, R.l2MissingItem, R.l2Corrections, R.docChecklist, R.correctionTpl],
    knowledgeCheck: {
      q: "Should QA notes say only 'fix this' without detail, and should documentation issues have owner and follow-up date?",
      a: "No to vague notes; yes — every issue needs owner + follow-up date.",
    },
    reflectionPrompt: "What makes a QA correction note helpful instead of frustrating?",
  }),
  day(1, 4, 4, {
    title: "Treatment Plan QA Basics",
    description:
      "Learn how treatment plan QA fits into today's clinical and authorization flow without replacing the BCBA's clinical ownership.",
    objectives: [
      "Identify required treatment-plan review points",
      "Route correction requests to the BCBA/clinical owner",
      "Document status, correction owner, next action, follow-up",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Treatment plan QA purpose", kind: "Overview", minutes: 8, summary: "Why treatment plan QA protects clinical quality and auth readiness." },
      { id: "w1d4-l2", title: "Common treatment plan review points", kind: "SOP", minutes: 12, summary: "Required sections, standards, signatures/dates, payer/state requirements." },
      { id: "w1d4-l3", title: "BCBA correction workflow", kind: "Workflow", minutes: 12, summary: "Route correction requests without rewriting clinical content." },
      { id: "w1d4-l4", title: "Auth readiness impact", kind: "SOP", minutes: 10, summary: "How treatment plan QA affects authorizations and service delivery." },
    ],
    checklist: [
      "Can explain treatment plan QA purpose",
      "Reviewed 2 treatment plan examples",
      "Drafted correction/follow-up notes",
    ],
    shadowing: ["Watch mentor complete or review a treatment plan QA item."],
    livePractice: ["Review 2 treatment plan QA examples under mentor supervision."],
    resources: [R.l2TpQa, R.l2ReportQa, R.l1BcbaSup, R.l1AuthMgr, R.tpChecklist],
    knowledgeCheck: {
      q: "Does QA replace the BCBA's clinical judgment, and should treatment plan corrections be tracked clearly?",
      a: "No — QA does not replace clinical judgment; yes — corrections must be tracked.",
    },
    reflectionPrompt: "How can treatment plan QA affect authorizations and service delivery?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1: QA role boundaries, current systems, documentation standards, treatment plan QA basics, and confidentiality.",
    objectives: [
      "Review 3 sample QA items with mentor",
      "Explain status, next action, owner, and correction/missing item",
      "Identify anything still unclear",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering QA ownership, documentation standards, treatment plan QA, and current systems." },
      { id: "w1d5-l2", title: "QA role boundary check", kind: "Overview", minutes: 8, summary: "QA vs Clinical vs Auth vs Compliance vs State Ops." },
      { id: "w1d5-l3", title: "QA item walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 items end-to-end with mentor." },
      { id: "w1d5-l4", title: "Mentor feedback", kind: "Shadowing", minutes: 10, summary: "Strengths and coaching areas for Week 2." },
    ],
    checklist: [
      "Completed Week 1 quiz",
      "Reviewed 3 QA items with mentor",
      "Can explain current systems and role boundaries",
      "Manager / mentor signoff completed",
    ],
    shadowing: ["Watch end-of-day QA queue review."],
    livePractice: ["Complete supervised QA review checklist for 3 items."],
    resources: [R.l1QaSop, R.l2Review, R.binder],
    knowledgeCheck: {
      q: "What must always be true before you close out a QA item for the day?",
      a: "Owner, status, next action, and follow-up date are set; sensitive clinical info stays need-to-know.",
    },
    reflectionPrompt: "What part of QA still feels confusing?",
    signoffRequired: "Week 1 manager / mentor signoff required before moving to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: QaDayModule[] = [
  day(2, 1, 6, {
    title: "Clinical Report QA Review",
    description: "Learn how clinical report QA review works today and why report quality and timeliness matter.",
    objectives: [
      "Confirm report type, client, BCBA, state, due date, status, owner",
      "Check for missing/incomplete/unclear elements",
      "Draft correction notes with exact needed actions",
    ],
    lessons: [
      { id: "w2d1-l1", title: "Clinical report QA purpose", kind: "Overview", minutes: 8, summary: "Quality + timeliness protect clients and downstream operations." },
      { id: "w2d1-l2", title: "Report review checklist", kind: "SOP", minutes: 12, summary: "Use the current QA checklist consistently." },
      { id: "w2d1-l3", title: "Report timeline awareness", kind: "Workflow", minutes: 10, summary: "Late reports cascade into auth and clinical delays." },
      { id: "w2d1-l4", title: "Correction request workflow", kind: "SOP", minutes: 12, summary: "Route to correct owner with clear next action." },
    ],
    checklist: [
      "Reviewed 2 clinical report examples",
      "Identified missing/correction items",
      "Drafted clear correction notes",
    ],
    shadowing: ["Watch mentor review a clinical report QA item."],
    livePractice: ["Under supervision, review 2 clinical report samples or scenarios and draft correction notes."],
    resources: [R.l2ReportQa, R.l2Review, R.l2DocStd, R.reportChecklist],
    knowledgeCheck: {
      q: "Should report corrections identify the exact issue, and should timeline delays be visible?",
      a: "Yes to both.",
    },
    reflectionPrompt: "Why does report review need both quality and timeline discipline?",
  }),
  day(2, 2, 7, {
    title: "Documentation Missing Item Follow-Up",
    description: "Follow up on missing documentation without letting items sit.",
    objectives: [
      "Identify exact missing items",
      "Determine correct owner: BCBA, RBT, Clinical, family, QA, State Ops, manager",
      "Update tracker with owner, status, next action, follow-up date",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Missing item types", kind: "Overview", minutes: 8, summary: "Notes, signatures, dates, forms, payer-specific items, attestations." },
      { id: "w2d2-l2", title: "Owner identification", kind: "SOP", minutes: 10, summary: "Who owns each type of missing item." },
      { id: "w2d2-l3", title: "Follow-up cadence", kind: "Workflow", minutes: 12, summary: "How often to follow up based on urgency and impact." },
      { id: "w2d2-l4", title: "Escalation for delay", kind: "SOP", minutes: 10, summary: "When and how to escalate overdue or high-impact items." },
    ],
    checklist: [
      "Identified exact missing items",
      "Assigned correct owner",
      "Drafted follow-up request",
    ],
    shadowing: ["Watch mentor handle missing documentation follow-up."],
    livePractice: ["Review 5 missing documentation scenarios and draft next actions."],
    resources: [R.l2MissingItem, R.l2Escalation, R.correctionTpl],
    knowledgeCheck: {
      q: "Should missing documentation be written as 'missing docs' only, and should overdue items be escalated?",
      a: "No to vague notes; yes to escalation for overdue/high-impact items.",
    },
    reflectionPrompt: "How does vague missing-documentation tracking slow everyone down?",
  }),
  day(2, 3, 8, {
    title: "Corrections Current Operations",
    description: "How corrections are requested, tracked, reviewed, and closed.",
    objectives: [
      "Confirm requested correction is specific and assigned",
      "Check whether corrections have been completed",
      "Close, follow up, or escalate appropriately",
    ],
    lessons: [
      { id: "w2d3-l1", title: "Correction request standards", kind: "SOP", minutes: 10, summary: "Specific, respectful, actionable." },
      { id: "w2d3-l2", title: "Correction owner and due date", kind: "SOP", minutes: 10, summary: "Every correction has an owner and a date." },
      { id: "w2d3-l3", title: "Correction review", kind: "Workflow", minutes: 12, summary: "Verify against original ask." },
      { id: "w2d3-l4", title: "Closing or reopening the item", kind: "SOP", minutes: 10, summary: "Close only when complete; document what remains otherwise." },
    ],
    checklist: [
      "Reviewed 5 correction scenarios",
      "Correctly identified complete vs incomplete corrections",
      "Drafted follow-up notes",
    ],
    shadowing: ["Watch mentor review completed and incomplete corrections."],
    livePractice: ["Review 5 correction scenarios and choose close, follow-up, or escalate."],
    resources: [R.l2Corrections, R.l2DocStd, R.l2Escalation],
    knowledgeCheck: {
      q: "Should incomplete corrections be closed, and should correction notes show what remains?",
      a: "No — incomplete corrections stay open; yes — always document what remains.",
    },
    reflectionPrompt: "What makes a correction ready to close?",
  }),
  day(2, 4, 9, {
    title: "Fax and External Document Chase",
    description: "How current QA/support processes handle missing external documents and fax follow-up where assigned.",
    objectives: [
      "Identify external document needed",
      "Document attempt, date/time, contact, outcome, next follow-up",
      "Escalate repeated failed attempts",
    ],
    lessons: [
      { id: "w2d4-l1", title: "External document types", kind: "Overview", minutes: 8, summary: "Payer, provider, family, external evaluator, prior records." },
      { id: "w2d4-l2", title: "Fax / external follow-up process", kind: "SOP", minutes: 12, summary: "Where and how to send follow-up." },
      { id: "w2d4-l3", title: "Documentation of attempts", kind: "SOP", minutes: 10, summary: "Exact times, contacts, outcomes." },
      { id: "w2d4-l4", title: "Escalation when documents do not arrive", kind: "Workflow", minutes: 10, summary: "When to escalate to manager/leadership." },
    ],
    checklist: [
      "Reviewed 3 external document scenarios",
      "Documented follow-up attempts",
      "Identified escalation criteria",
    ],
    shadowing: ["Watch mentor process a fax/external document chase example."],
    livePractice: ["Review 3 external document chase scenarios and draft follow-up notes."],
    resources: [R.l2FaxChase, R.l2MissingItem],
    knowledgeCheck: {
      q: "Should fax/external follow-up attempts be documented, and should repeated failed attempts on important documents be escalated?",
      a: "Yes to both.",
    },
    reflectionPrompt: "Why do external document attempts need exact documentation?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description: "Complete a supervised mini-shift using current QA review and follow-up tasks.",
    objectives: [
      "Run 5–8 low-risk QA tasks with mentor review",
      "Keep every item's next step visible",
      "Maintain confidentiality end-to-end",
    ],
    lessons: [
      { id: "w2d5-l1", title: "Clinical report review", kind: "Live Practice", minutes: 12, summary: "Move report reviews forward accurately." },
      { id: "w2d5-l2", title: "Missing item follow-up", kind: "Live Practice", minutes: 10, summary: "Draft and route missing-item requests." },
      { id: "w2d5-l3", title: "Correction review", kind: "Live Practice", minutes: 10, summary: "Verify against original correction ask." },
      { id: "w2d5-l4", title: "External document follow-up", kind: "Reflection", minutes: 10, summary: "Mentor reviews written attempts and escalations." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No QA item left without next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list."],
    resources: [R.l2Review, R.l2ReportQa, R.l2Corrections, R.l2FaxChase],
    knowledgeCheck: {
      q: "What must always be true at the end of a mini-shift?",
      a: "Every item has owner, status, next action, and follow-up date; clinical info stays need-to-know.",
    },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 manager / mentor signoff required before moving to Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: QaDayModule[] = [
  day(3, 1, 11, {
    title: "Compliance Reviews",
    description: "How compliance reviews are handled today and why they need careful documentation.",
    objectives: [
      "Identify meets vs misses vs needs-review against current standards",
      "Document findings factually",
      "Route correction or escalation to correct owner",
    ],
    lessons: [
      { id: "w3d1-l1", title: "Compliance review purpose", kind: "Overview", minutes: 8, summary: "Protecting clients, the company, and clinical trust." },
      { id: "w3d1-l2", title: "Review criteria awareness", kind: "SOP", minutes: 12, summary: "What today's standard looks like." },
      { id: "w3d1-l3", title: "Findings documentation", kind: "SOP", minutes: 12, summary: "Factual, dated, specific — no exaggeration." },
      { id: "w3d1-l4", title: "Escalation and follow-up", kind: "Workflow", minutes: 10, summary: "Route to QA Director / Clinical leadership when needed." },
    ],
    checklist: [
      "Reviewed 3 compliance scenarios",
      "Drafted factual findings",
      "Identified escalation path",
    ],
    shadowing: ["Watch mentor complete a compliance review item."],
    livePractice: ["Review 3 compliance scenarios and draft findings."],
    resources: [R.l2Compliance, R.l2DocStd, R.l2Escalation, R.complianceChecklist],
    knowledgeCheck: {
      q: "Should compliance findings be factual and specific, and should unclear compliance concerns be escalated?",
      a: "Yes to both.",
    },
    reflectionPrompt: "What makes compliance documentation factual and useful?",
  }),
  day(3, 2, 12, {
    title: "Audits Current Operations",
    description: "How audits are reviewed, documented, and followed up on today.",
    objectives: [
      "Document what was reviewed",
      "Record pass / correction / missing / escalation",
      "Escalate trends and repeated issues",
    ],
    lessons: [
      { id: "w3d2-l1", title: "Audit purpose", kind: "Overview", minutes: 8, summary: "Audits protect quality across many items at once." },
      { id: "w3d2-l2", title: "Audit sample / scope awareness", kind: "SOP", minutes: 10, summary: "Know what's in and out of scope." },
      { id: "w3d2-l3", title: "Audit findings", kind: "SOP", minutes: 12, summary: "Specific, dated, categorized." },
      { id: "w3d2-l4", title: "Correction and trend follow-up", kind: "Workflow", minutes: 12, summary: "Individual corrections + trend visibility." },
    ],
    checklist: [
      "Reviewed 5 audit scenarios",
      "Recorded findings and next action",
      "Identified trend/escalation needs",
    ],
    shadowing: ["Watch mentor review audit examples."],
    livePractice: ["Review 5 audit scenarios and choose status/next action."],
    resources: [R.l2Audits, R.l2TrendReport, R.l2Corrections, R.auditChecklist],
    knowledgeCheck: {
      q: "Should audits show what was reviewed, and should repeated issues be tracked as trends?",
      a: "Yes to both.",
    },
    reflectionPrompt: "What makes an audit finding useful to leadership?",
  }),
  day(3, 3, 13, {
    title: "NoteGuard / Amerigroup Review Awareness",
    description: "Current NoteGuard and Amerigroup review workflows where assigned.",
    objectives: [
      "Explain what the assigned reviewer checks today",
      "Document issue, owner, next action, follow-up",
      "Escalate repeated or serious issues",
    ],
    lessons: [
      { id: "w3d3-l1", title: "NoteGuard review awareness", kind: "Overview", minutes: 10, summary: "Purpose and scope of the assigned workflow." },
      { id: "w3d3-l2", title: "Amerigroup daily note review awareness", kind: "Overview", minutes: 10, summary: "Payer-specific review process." },
      { id: "w3d3-l3", title: "Issue documentation", kind: "SOP", minutes: 10, summary: "Consistent, factual, dated." },
      { id: "w3d3-l4", title: "Escalation and follow-up", kind: "Workflow", minutes: 10, summary: "Route serious/repeat issues to QA Director / Clinical leadership." },
    ],
    checklist: [
      "Can explain assigned NoteGuard/Amerigroup review purpose",
      "Reviewed 3 scenarios",
      "Documented findings and next action",
    ],
    shadowing: ["Watch mentor complete or explain a NoteGuard/Amerigroup review example."],
    livePractice: ["Review 3 mock NoteGuard/Amerigroup scenarios and document next action."],
    resources: [R.l2Compliance, R.l2Audits, R.noteGuard, R.amerigroup],
    knowledgeCheck: {
      q: "Are NoteGuard/Amerigroup reviews assigned workflows, and should repeated issues be escalated?",
      a: "Yes to both.",
    },
    reflectionPrompt: "Why should payer/compliance-specific reviews be treated carefully instead of casually?",
  }),
  day(3, 4, 14, {
    title: "New RBT Check-Ins and QA/Compliance Support",
    description: "How QA may support new RBT check-ins where assigned and how that connects to documentation quality and early support.",
    objectives: [
      "Identify what QA looks for in early RBT check-ins",
      "Document check-in outcome and next action",
      "Escalate training/clinical/HR concerns to correct owner",
    ],
    lessons: [
      { id: "w3d4-l1", title: "New RBT check-in purpose", kind: "Overview", minutes: 8, summary: "Early support prevents downstream quality issues." },
      { id: "w3d4-l2", title: "What QA looks for", kind: "SOP", minutes: 12, summary: "Early documentation habits, expectations, questions, support needs." },
      { id: "w3d4-l3", title: "Documentation of check-in", kind: "SOP", minutes: 10, summary: "Specific, respectful, dated." },
      { id: "w3d4-l4", title: "Escalation to Training/Clinical/HR", kind: "Workflow", minutes: 10, summary: "Route non-QA concerns to correct owner." },
    ],
    checklist: [
      "Reviewed 3 new RBT check-in scenarios",
      "Identified owner for follow-up",
      "Drafted clear check-in note",
    ],
    shadowing: ["Watch mentor review or conduct a new RBT check-in."],
    livePractice: ["Review 3 new RBT check-in scenarios and recommend next action."],
    resources: [R.rbtCheckIn, R.l2Compliance, R.l2Escalation],
    knowledgeCheck: {
      q: "Should QA handle clinical supervision concerns alone, and should check-ins have documented outcomes?",
      a: "No — route clinical supervision to Clinical; yes — every check-in has a documented outcome.",
    },
    reflectionPrompt: "How can early RBT check-ins prevent bigger documentation and quality problems later?",
  }),
  day(3, 5, 15, {
    title: "QA Escalation and Trend Reporting",
    description: "How QA escalates individual risks and reports trends without creating noise.",
    objectives: [
      "Identify escalation triggers",
      "Identify trends across several items",
      "Draft escalation and trend notes with impact and requested decision",
    ],
    lessons: [
      { id: "w3d5-l1", title: "Escalation criteria", kind: "SOP", minutes: 10, summary: "Repeated issues, delayed reports, missing critical items, compliance concerns, safety/clinical risk, auth blockers." },
      { id: "w3d5-l2", title: "Trend identification", kind: "Workflow", minutes: 10, summary: "Spot recurring patterns across items and owners." },
      { id: "w3d5-l3", title: "QA trend reporting", kind: "SOP", minutes: 12, summary: "Impact + examples + requested decision + follow-up." },
      { id: "w3d5-l4", title: "End-of-day QA queue cleanup", kind: "Workflow", minutes: 10, summary: "Every item has owner/status/next action/follow-up date." },
    ],
    checklist: [
      "Identified trend/escalation items",
      "Drafted escalation/trend note",
      "Completed queue cleanup",
    ],
    shadowing: ["Watch mentor prepare escalation or trend report."],
    livePractice: ["Review 5 QA items and identify isolated issues, trends, or escalation items."],
    resources: [R.l2Escalation, R.l2TrendReport, R.l2Metrics, R.escTemplate, R.trendTemplate],
    knowledgeCheck: {
      q: "Should QA escalate repeated issues with examples, and should every queue item have a next action before end of day?",
      a: "Yes to both.",
    },
    reflectionPrompt: "What makes a QA escalation actionable for leadership?",
    signoffRequired: "Week 3 manager / mentor signoff required before moving to Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: QaDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled QA Queue Ownership — Part 1",
    description: "Own a small set of real QA tasks with mentor review.",
    objectives: [
      "Prioritize the QA queue",
      "Complete assigned work accurately",
      "End day with no item lacking next action",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning QA queue review", kind: "Workflow", minutes: 10, summary: "Set the day's priorities." },
      { id: "w4d1-l2", title: "Prioritizing QA work", kind: "SOP", minutes: 10, summary: "Reports, treatment plans, urgent auth blockers, compliance, missing items, overdue." },
      { id: "w4d1-l3", title: "Updating current trackers", kind: "SOP", minutes: 10, summary: "Keep systems accurate as you work." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "Workflow", minutes: 10, summary: "Nothing left silently pending." },
    ],
    checklist: [
      "Completed assigned queue",
      "Updated current systems accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned QA tasks with mentor review."],
    resources: [R.l1QaSop, R.l2Review, R.l2ReportQa, R.l2MissingItem],
    knowledgeCheck: {
      q: "What should be true at end of day about your assigned QA queue?",
      a: "Every item has current status, owner, next action, and follow-up date; clinical info stays need-to-know.",
    },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled QA Queue Ownership — Part 2",
    description: "Repeat controlled ownership with more independence.",
    objectives: [
      "Own more with less oversight",
      "Escalate blockers clearly to correct owners",
      "Keep queue clean and follow-ups on time",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "SOP", minutes: 10, summary: "Follow-up dates land, don't drift." },
      { id: "w4d2-l2", title: "Correction quality", kind: "Workflow", minutes: 12, summary: "Specific, respectful, actionable." },
      { id: "w4d2-l3", title: "Documentation accuracy", kind: "Workflow", minutes: 10, summary: "Notes reflect exactly what was reviewed and found." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Facts, impact, requested next step." },
    ],
    checklist: [
      "Completed queue work",
      "Escalated blockers correctly",
      "No stale / unowned assigned QA item",
    ],
    shadowing: ["Minimal — learner performs while mentor reviews."],
    livePractice: ["Own 10–15 assigned QA tasks."],
    resources: [R.l2Corrections, R.l2Escalation, R.l2Compliance, R.l2Audits],
    knowledgeCheck: {
      q: "Where should overdue reports, repeated correction issues, and clinical-quality concerns be routed?",
      a: "To QA Director / Clinical leadership with facts, impact, and requested next step.",
    },
    reflectionPrompt: "What did you escalate today and why?",
  }),
  day(4, 3, 18, {
    title: "QA Communication Quality Day",
    description: "Clear, respectful, clinically appropriate communication with BCBAs, Clinical leadership, Authorizations, State Ops, RBT support/training, and managers.",
    objectives: [
      "Write clear QA notes and correction requests",
      "Communicate urgency when auth/compliance/quality are at risk",
      "Stay out of clinical ownership",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Clear QA notes", kind: "SOP", minutes: 12, summary: "What was reviewed, what's missing/corrected, owner, impact, follow-up." },
      { id: "w4d3-l2", title: "Correction request tone", kind: "Workflow", minutes: 10, summary: "Respectful, specific, dated." },
      { id: "w4d3-l3", title: "Clinical escalation quality", kind: "SOP", minutes: 10, summary: "Route clinical decisions to Clinical leadership / BCBA owner." },
      { id: "w4d3-l4", title: "Trend / leadership update quality", kind: "SOP", minutes: 10, summary: "Impact + examples + requested decision." },
    ],
    checklist: [
      "Drafted 5 clear notes/correction requests/escalations",
      "Mentor approved tone and specificity",
      "Clinical boundary handled correctly",
    ],
    shadowing: ["Mentor reviews written QA updates and correction requests."],
    livePractice: ["Draft 5 QA notes/correction requests/escalations for mentor review."],
    resources: [R.l2Review, R.l2Corrections, R.l2Escalation, R.correctionTpl, R.escTemplate],
    knowledgeCheck: {
      q: "What kind of QA communication helps BCBAs improve without feeling attacked?",
      a: "Specific, respectful, dated, and focused on the item — not the person.",
    },
    reflectionPrompt: "What kind of QA communication helps BCBAs improve without feeling attacked?",
  }),
  day(4, 4, 19, {
    title: "End-to-End QA Simulation",
    description: "Complete a full QA simulation from review intake through documentation review, correction request, missing item follow-up, escalation/trend note, and closure.",
    objectives: [
      "Run one QA scenario end-to-end",
      "Pass mentor review",
      "Complete a real task set alongside the simulation",
    ],
    lessons: [
      { id: "w4d4-l1", title: "QA intake simulation", kind: "Live Practice", minutes: 10, summary: "Take an item into the QA queue cleanly." },
      { id: "w4d4-l2", title: "Treatment plan / report review simulation", kind: "Live Practice", minutes: 12, summary: "Apply the checklist end-to-end." },
      { id: "w4d4-l3", title: "Missing item / correction simulation", kind: "Live Practice", minutes: 10, summary: "Route and follow up cleanly." },
      { id: "w4d4-l4", title: "Compliance / audit scenario simulation", kind: "Live Practice", minutes: 10, summary: "Document findings factually." },
      { id: "w4d4-l5", title: "Escalation / closure simulation", kind: "Live Practice", minutes: 12, summary: "Escalate or close with the correct trail." },
    ],
    checklist: [
      "Completed full simulation",
      "Passed mentor review",
      "Completed real task set",
    ],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1QaSop, R.l2Review, R.l2ReportQa, R.l2TpQa, R.l2Corrections, R.l2Escalation],
    knowledgeCheck: {
      q: "What part of the QA process do you still need more repetitions on?",
      a: "Any step the learner cannot execute end-to-end without prompting — schedule reps.",
    },
    reflectionPrompt: "What part of the full QA process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description: "Complete final review; manager determines readiness for ongoing QA ownership and sets a 30-day plan.",
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
    livePractice: ["Learner runs a short QA queue review while manager observes."],
    resources: [R.l1QaSop, R.role306090, R.roleDeepDive, R.l2Review, R.l2ReportQa, R.l2TpQa, R.l2DocStd],
    knowledgeCheck: {
      q: "Final: name any 3 of — QA lifecycle, current systems, owner/status/next action/follow-up, documentation standards, treatment plan QA, clinical report QA, missing-item follow-up, corrections, fax/external chase, compliance reviews, audits, NoteGuard/Amerigroup awareness, new RBT check-ins, escalation, trend reporting, clinical boundary and confidentiality.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about QA that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into independent ownership with a 30-day plan.",
  }),
];

export const QA_DAYS: QaDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getQaDay(sourceModuleId: string): QaDayModule | undefined {
  return QA_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalQaMinutes(): number {
  return QA_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}