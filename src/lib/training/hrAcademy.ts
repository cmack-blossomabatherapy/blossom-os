/**
 * HR / People Operations Team Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new HR team member on today's Blossom HR process using today's
 * tools (employee records, Outlook / Microsoft 365, Viventium awareness,
 * current HR trackers) and clean cross-department handoffs to Recruiting,
 * Payroll/Finance, Office Manager/Admin, IT/Security, Training, and State Ops.
 *
 * Mirrors `staffingAcademy.ts` so it plugs into the same academy adapter
 * without touching other role/department curricula.
 */

export type HrLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface HrLesson {
  id: string;
  title: string;
  summary: string;
  kind: HrLessonKind;
  minutes: number;
}

export interface HrResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface HrDayModule {
  /** Source module id — becomes `hr::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: HrLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: HrResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface HrWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const HR_WEEKS: HrWeek[] = [
  { weekNumber: 1, title: "Week 1 · HR Foundations, Welcome, Confidentiality, Current Systems, and Role Boundaries",
    goal: "Understand Blossom, the HR Team's purpose, today's systems, confidentiality expectations, employee lifecycle basics, and the difference between HR, Recruiting, Payroll, Office Manager/Admin, Training, and State Ops." },
  { weekNumber: 2, title: "Week 2 · Onboarding, Background Checks, Orientation, Training Visibility, and Office/Admin Intersections",
    goal: "Move from observation into supervised execution of common HR onboarding and employee lifecycle tasks." },
  { weekNumber: 3, title: "Week 3 · Employee Records, Reviews, Corrective Action, Offboarding, and Cross-Department Handoffs",
    goal: "Own more work with review, learn sensitive judgment points, and practice clean cross-department handoffs." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Communication Quality, HR Queue Cleanup, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real HR support work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1HrSop: { label: "L1 HR / People Operations Role SOP", href: "/resource-library", pending: true },
  l1OfficeSop: { label: "L1 Office Manager / HR Assistant Role SOP", href: "/resource-library", pending: true },
  binder: { label: "People Operations HR and Office Administration Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "HR People Operations Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "HR People Operations Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l2Intake: { label: "L2 HR Support Task Intake Process SOP", href: "/resource-library", pending: true },
  l2Handoff: { label: "L2 Hiring Handoff to HR Process SOP", href: "/resource-library", pending: true },
  l2Onboard: { label: "L2 Employee Onboarding Logistics Process SOP", href: "/resource-library", pending: true },
  l2OnboardOps: { label: "L2 Onboarding — Current Operations", href: "/resource-library", pending: true },
  l2Background: { label: "L2 Background Checks — Current Operations", href: "/resource-library", pending: true },
  l2Orientation: { label: "L2 Orientation — Current Operations", href: "/resource-library", pending: true },
  l2Benefits: { label: "L2 Benefits — Current Operations", href: "/resource-library", pending: true },
  l2Reviews: { label: "L2 Performance Reviews — Current Operations", href: "/resource-library", pending: true },
  l2Corrective: { label: "L2 Corrective Action — Current Operations", href: "/resource-library", pending: true },
  l2Offboard: { label: "L2 Offboarding — Current Operations", href: "/resource-library", pending: true },
  l2Offer: { label: "L2 Offer Letters — Current Operations", href: "/resource-library", pending: true },
  l2Scanning: { label: "L2 Scanning, AP, and Document Support Process SOP", href: "/resource-library", pending: true },
  l2Mail: { label: "L2 Mail, UPS, Shipping, and Inventory Process SOP", href: "/resource-library", pending: true },
  l2Supply: { label: "L2 Office Supply and Lunch Ordering Process SOP", href: "/resource-library", pending: true },
  handbook: { label: "Employee Handbook", href: "/resource-library", pending: true },
  policies: { label: "Company Policies", href: "/resource-library", pending: true },
  orgChart: { label: "Company Org Chart / Hierarchy", href: "/resource-library", pending: true },
  trackerGuide: { label: "Current HR Tracker Guide", href: "/resource-library", pending: true },
  employeeRecordGuide: { label: "Employee Record Guide", href: "/resource-library", pending: true },
  viventium: { label: "Viventium Overview", href: "/resource-library", pending: true },
  benefitsGuide: { label: "Benefits Guide", href: "/resource-library", pending: true },
  bgChecklist: { label: "Background Check Checklist", href: "/resource-library", pending: true },
  onboardChecklist: { label: "Onboarding Checklist", href: "/resource-library", pending: true },
  offboardChecklist: { label: "Offboarding Checklist", href: "/resource-library", pending: true },
  emplTemplates: { label: "Employee Communication Templates", href: "/resource-library", pending: true },
  mgrTemplates: { label: "Manager Communication Templates", href: "/resource-library", pending: true },
  reviewTemplates: { label: "Performance Review Templates", href: "/resource-library", pending: true },
  correctiveGuide: { label: "Corrective Action Documentation Guide", href: "/resource-library", pending: true },
  itOffboard: { label: "IT / Security Offboarding Guide", href: "/resource-library", pending: true },
  officeHandoff: { label: "Office Manager / HR Assistant Handoff Guide", href: "/resource-library", pending: true },
  payrollHandoff: { label: "Payroll / Finance Handoff Guide", href: "/resource-library", pending: true },
  escalationGuide: { label: "HR Escalation Guide", href: "/resource-library", pending: true },
  docStandards: { label: "HR Documentation Standards Guide", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<HrDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): HrDayModule {
  return {
    id: `hr-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: HrDayModule[] = [
  day(1, 1, 1, {
    title: "Welcome to Blossom + HR Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what HR / People Operations does and why it matters. HR protects the employee lifecycle — helping people join Blossom correctly, stay organized, complete training, move through performance processes appropriately, and exit cleanly when needed. When HR is messy, employees feel unsupported, managers lack visibility, compliance is at risk, and payroll/training/operations get harder.",
    objectives: [
      "Complete the existing Welcome to Blossom experience",
      "Explain what HR owns and does not own today",
      "Describe the employee lifecycle end to end",
      "Explain the owner / status / next action / follow-up date rule",
      "Explain the confidentiality rule",
    ],
    lessons: [
      { id: "w1d1-l1", title: "Welcome to Blossom", kind: "Video", minutes: 20, summary: "Open and complete the existing Welcome to Blossom module." },
      { id: "w1d1-l2", title: "What HR owns today", kind: "Overview", minutes: 10, summary: "Employee lifecycle, onboarding, background checks, records, reviews, benefits questions, corrective-action support, offboarding, confidentiality." },
      { id: "w1d1-l3", title: "What HR does not own", kind: "Overview", minutes: 8, summary: "Not Recruiting's candidate pipeline, Payroll processing, Clinical supervision, or State Ops execution." },
      { id: "w1d1-l4", title: "The employee lifecycle", kind: "Workflow", minutes: 10, summary: "Hiring handoff → onboarding → background checks → orientation → records → training visibility → reviews → HR support → corrective action → offboarding." },
      { id: "w1d1-l5", title: "Confidentiality and professional judgment", kind: "SOP", minutes: 10, summary: "HR info is shared only with people who need it for their role, per current policy and leadership direction." },
    ],
    checklist: [
      "Completed Welcome to Blossom",
      "Can explain what HR owns",
      "Can explain what HR does not own",
      "Can explain why confidentiality matters",
      "Can describe the basic employee lifecycle",
    ],
    shadowing: ["Sit with HR / People Operations Lead or assigned mentor for 30–60 minutes and watch how they review the HR queue or employee lifecycle items."],
    livePractice: ["No live HR ownership yet — observe only."],
    resources: [R.welcome, R.l1HrSop, R.binder, R.roleDeepDive, R.handbook, R.policies],
    knowledgeCheck: {
      q: "What four things should every HR item have before you leave it?",
      a: "Owner, status, next action, follow-up date. HR does not run the recruiting pipeline, run payroll, or supervise clinicians.",
    },
    reflectionPrompt: "In your own words, why does HR matter to employee trust and company operations?",
  }),
  day(1, 2, 2, {
    title: "Current HR Systems Tour — Employee Records, Outlook, Microsoft 365, Viventium Awareness, Trackers",
    description:
      "Learn the systems HR touches today: employee records, Outlook / Microsoft 365, Viventium at an awareness level, and current HR trackers for onboarding / background / offboarding / training.",
    objectives: [
      "Identify today's main HR tools",
      "Explain Viventium at a high level (awareness, not payroll ownership)",
      "Explain where HR support requests and lifecycle items live",
      "Explain why record hygiene and confidentiality matter",
    ],
    lessons: [
      { id: "w1d2-l1", title: "Employee record basics", kind: "SOP", minutes: 12, summary: "Where employee records live and how they should be maintained." },
      { id: "w1d2-l2", title: "Outlook / Microsoft 365 communication basics", kind: "SOP", minutes: 10, summary: "Email, files, and communication norms." },
      { id: "w1d2-l3", title: "Viventium awareness", kind: "Overview", minutes: 10, summary: "What Viventium is used for at a high level — HR supports readiness, not payroll processing." },
      { id: "w1d2-l4", title: "Current HR trackers", kind: "SOP", minutes: 10, summary: "Onboarding, background, offboarding, training visibility." },
      { id: "w1d2-l5", title: "Training and document record awareness", kind: "Workflow", minutes: 8, summary: "Where training and document status shows up today." },
    ],
    checklist: [
      "Identified main current HR tools",
      "Explained Viventium at a high level",
      "Explained where HR support requests and lifecycle items are tracked",
      "Explained why record hygiene matters",
    ],
    shadowing: ["Watch mentor locate an employee lifecycle item and explain where updates belong."],
    livePractice: ["Locate 3 sample HR items and point out owner, status, next action, follow-up date."],
    resources: [R.l1HrSop, R.l2Intake, R.l2Onboard, R.viventium, R.trackerGuide, R.employeeRecordGuide],
    knowledgeCheck: {
      q: "Is Viventium relevant to HR/payroll operations today, and does HR own payroll processing?",
      a: "Yes, Viventium is relevant. No, HR does not own payroll processing — HR supports employee-info readiness for Payroll.",
    },
    reflectionPrompt: "Which HR system or tracker is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "HR Support Task Intake",
    description:
      "Learn how HR receives, categorizes, prioritizes, and follows up on HR support requests while protecting confidentiality.",
    objectives: [
      "Identify what counts as an HR support task",
      "Categorize, prioritize, and route requests",
      "Keep sensitive information private",
    ],
    lessons: [
      { id: "w1d3-l1", title: "What counts as an HR support task", kind: "Overview", minutes: 8, summary: "Onboarding, background, benefits, policy, employment questions, performance, offboarding, manager support, payroll-adjacent." },
      { id: "w1d3-l2", title: "Intake and categorization", kind: "SOP", minutes: 12, summary: "How to log and label a new HR request." },
      { id: "w1d3-l3", title: "Priority and confidentiality", kind: "SOP", minutes: 10, summary: "Some HR items are urgent; some are sensitive; some are both." },
      { id: "w1d3-l4", title: "Owner and follow-up", kind: "SOP", minutes: 8, summary: "Every HR item gets an owner, status, next action, and follow-up date." },
    ],
    checklist: [
      "Categorized 5 HR support requests",
      "Identified priority / confidentiality considerations",
      "Recommended correct next action",
    ],
    shadowing: ["Watch mentor triage 3 HR support tasks."],
    livePractice: ["Under mentor supervision, categorize 5 sample HR requests and recommend next action."],
    resources: [R.l2Intake, R.l1HrSop, R.emplTemplates],
    knowledgeCheck: { q: "Should every HR request be treated as public information?", a: "No. HR information is shared only with people who need it for their role, per current policy." },
    reflectionPrompt: "What makes an HR request urgent or sensitive?",
  }),
  day(1, 4, 4, {
    title: "Hiring Handoff From Recruiting",
    description: "Learn how Recruiting hands a candidate to HR and what HR needs to start onboarding correctly.",
    objectives: [
      "Review an accepted hiring handoff from Recruiting",
      "Confirm required handoff details are present",
      "Route back to Recruiting / manager if handoff is incomplete",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Recruiting → HR boundary", kind: "Overview", minutes: 8, summary: "Recruiting owns candidates; HR owns employees post-hire." },
      { id: "w1d4-l2", title: "Hiring handoff checklist", kind: "SOP", minutes: 12, summary: "Name, role, dept/state, manager, start date, offer, contact, docs, background needs." },
      { id: "w1d4-l3", title: "Candidate-to-employee transition", kind: "Workflow", minutes: 10, summary: "Kicking off HR onboarding tracker only when handoff is clear." },
      { id: "w1d4-l4", title: "Missing handoff information", kind: "SOP", minutes: 10, summary: "How to route back cleanly without dropping the candidate." },
    ],
    checklist: [
      "Can explain what HR needs from Recruiting",
      "Reviewed 3 handoff examples",
      "Identified missing information correctly",
    ],
    shadowing: ["Watch mentor review a hiring handoff."],
    livePractice: ["Review 3 mock hiring handoffs and identify complete vs incomplete items."],
    resources: [R.l2Handoff, R.l2Offer, R.l2Onboard],
    knowledgeCheck: { q: "Should HR accept a vague handoff without role, start, or manager basics?", a: "No. Route back cleanly and set a follow-up date." },
    reflectionPrompt: "What information does HR need so a new employee does not get stuck before day one?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description: "Review Week 1: HR role boundaries, current systems, confidentiality, support task intake, and Recruiting-to-HR handoff.",
    objectives: ["Review 3 sample HR items with mentor", "Explain each item's status, next action, owner, and privacy level", "Identify anything still unclear"],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering confidentiality, HR ownership, current tools, intake, and handoff." },
      { id: "w1d5-l2", title: "HR role boundary check", kind: "Overview", minutes: 8, summary: "HR vs Recruiting vs Payroll vs Office/Admin vs Training vs State Ops." },
      { id: "w1d5-l3", title: "Employee lifecycle walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 items end to end with mentor." },
      { id: "w1d5-l4", title: "Mentor feedback", kind: "Shadowing", minutes: 10, summary: "What went well; what to sharpen next week." },
    ],
    checklist: ["Completed Week 1 quiz", "Reviewed 3 HR items with mentor", "Can explain current systems and role boundaries", "Manager / mentor signoff completed"],
    shadowing: ["Watch end-of-day HR queue review."],
    livePractice: ["Complete supervised HR review checklist for 3 items."],
    resources: [R.l1HrSop, R.l2Intake, R.binder],
    knowledgeCheck: { q: "What must always be true before you close out an HR item for the day?", a: "Owner, status, next action, and follow-up date are set; sensitive info stays need-to-know." },
    reflectionPrompt: "What part of HR still feels confusing?",
    signoffRequired: "Week 1 manager / mentor signoff required before moving to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: HrDayModule[] = [
  day(2, 1, 6, {
    title: "Employee Onboarding Logistics",
    description: "Learn how HR supports new employee onboarding logistics using today's process.",
    objectives: ["Confirm start-date readiness across role, docs, training, and logistics", "Coordinate with Office Manager / HR Assistant when relevant", "Document onboarding status and next follow-up"],
    lessons: [
      { id: "w2d1-l1", title: "Onboarding purpose", kind: "Overview", minutes: 6, summary: "Why organized onboarding builds employee trust." },
      { id: "w2d1-l2", title: "Onboarding checklist", kind: "SOP", minutes: 12, summary: "Role, dept/state, manager, start date, forms, background needs, training journey, logistics." },
      { id: "w2d1-l3", title: "Start date readiness", kind: "Workflow", minutes: 12, summary: "Everything that has to be true by Day One." },
      { id: "w2d1-l4", title: "Onboarding communication", kind: "SOP", minutes: 10, summary: "Warm, clear, dated messages to new hires and managers." },
    ],
    checklist: ["Can explain onboarding readiness", "Completed 2 onboarding readiness checks", "Identified HR-owned vs admin-support tasks"],
    shadowing: ["Watch mentor process or review a new hire onboarding checklist."],
    livePractice: ["Under supervision, complete onboarding readiness check for 2 new hire examples."],
    resources: [R.l2Onboard, R.l2OnboardOps, R.l1OfficeSop, R.onboardChecklist, R.officeHandoff],
    knowledgeCheck: { q: "Does HR need to coordinate with admin/office support for some logistics?", a: "Yes. HR owns coordination; Office/Admin executes assigned logistics tasks." },
    reflectionPrompt: "What has to be ready before a new employee's first day feels organized?",
  }),
  day(2, 2, 7, {
    title: "Background Checks and Compliance Tracking",
    description: "Learn how background checks are tracked and followed up on in today's process.",
    objectives: ["Track background check status and pending items", "Escalate delays and concerning results appropriately", "Never freelance compliance decisions"],
    lessons: [
      { id: "w2d2-l1", title: "Background check purpose", kind: "Overview", minutes: 8, summary: "Why background checks matter and who they protect." },
      { id: "w2d2-l2", title: "Required information", kind: "SOP", minutes: 10, summary: "What must be collected and when." },
      { id: "w2d2-l3", title: "Status tracking", kind: "Workflow", minutes: 12, summary: "Pending vs completed vs on-hold vs flagged." },
      { id: "w2d2-l4", title: "Escalation and follow-up", kind: "SOP", minutes: 10, summary: "How and when to escalate to HR Lead / leadership." },
    ],
    checklist: ["Reviewed 3 background check scenarios", "Identified missing / pending items", "Escalated correctly with mentor approval"],
    shadowing: ["Watch mentor review background check statuses."],
    livePractice: ["Review 3 background check scenarios and recommend next action."],
    resources: [R.l2Background, R.l2Onboard, R.bgChecklist],
    knowledgeCheck: { q: "Should background check concerns be discussed casually?", a: "No. Keep confidential and escalate to the correct HR/leadership owner." },
    reflectionPrompt: "Why do background checks need clear tracking and careful communication?",
  }),
  day(2, 3, 8, {
    title: "Orientation and Training Visibility",
    description: "Learn how HR supports orientation and training visibility without replacing department training owners.",
    objectives: ["Confirm the right orientation and training journey for each role", "Track completion when current process requires HR visibility", "Follow up with manager / training owner when training is late"],
    lessons: [
      { id: "w2d3-l1", title: "Orientation basics", kind: "Overview", minutes: 8, summary: "What Blossom orientation looks like today." },
      { id: "w2d3-l2", title: "Training assignment awareness", kind: "Workflow", minutes: 10, summary: "Which journey matches which role." },
      { id: "w2d3-l3", title: "Training completion visibility", kind: "SOP", minutes: 12, summary: "How HR sees whether required training is happening." },
      { id: "w2d3-l4", title: "Manager follow-up", kind: "SOP", minutes: 10, summary: "How to nudge managers/training owners without owning their content." },
    ],
    checklist: ["Can explain orientation vs role training", "Reviewed 3 training visibility examples", "Identified manager / training-owner follow-up"],
    shadowing: ["Watch mentor review orientation / training completion for a new employee."],
    livePractice: ["Review 3 sample employees and identify training/orientation status and next action."],
    resources: [R.l2Orientation, R.l2OnboardOps, R.welcome],
    knowledgeCheck: { q: "Does HR own every department's role training content?", a: "No. HR supports visibility and follow-up; departments own their role training." },
    reflectionPrompt: "How can HR support training completion without becoming every department's trainer?",
  }),
  day(2, 4, 9, {
    title: "Benefits Basics and Employee Questions",
    description: "Handle benefits-related questions at the right level and route appropriately without guessing.",
    objectives: ["Identify approved-answer vs escalation", "Never guess on benefits or payroll info", "Document response and follow-up"],
    lessons: [
      { id: "w2d4-l1", title: "Benefits awareness", kind: "Overview", minutes: 8, summary: "What Blossom benefits look like today at a high level." },
      { id: "w2d4-l2", title: "What HR can answer", kind: "SOP", minutes: 10, summary: "Approved current answers HR is allowed to give directly." },
      { id: "w2d4-l3", title: "What needs escalation", kind: "SOP", minutes: 10, summary: "Eligibility, exceptions, payroll amounts — escalate, don't guess." },
      { id: "w2d4-l4", title: "Documentation and follow-up", kind: "SOP", minutes: 8, summary: "Log the question, the answer, the owner, and follow-up." },
    ],
    checklist: ["Reviewed 5 benefits question scenarios", "Identified approved-answer vs escalation", "Drafted clear response with mentor review"],
    shadowing: ["Watch mentor respond to benefits or employee policy questions."],
    livePractice: ["Review 5 benefits/policy question scenarios and choose answer / escalation path."],
    resources: [R.l2Benefits, R.benefitsGuide, R.emplTemplates],
    knowledgeCheck: { q: "Should HR guess if unsure about benefits eligibility?", a: "No. Escalate — never guess on benefits or payroll." },
    reflectionPrompt: "Why is it better to escalate than guess on benefits or policy questions?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description: "Complete a supervised mini-shift using current HR onboarding and support tasks.",
    objectives: ["Run 5–8 low-risk HR tasks with mentor review", "Keep every item's next step visible", "Confirm confidentiality is respected end-to-end"],
    lessons: [
      { id: "w2d5-l1", title: "Onboarding review", kind: "Live Practice", minutes: 12, summary: "Move onboarding items forward." },
      { id: "w2d5-l2", title: "Background check review", kind: "Live Practice", minutes: 12, summary: "Track and follow up on background items." },
      { id: "w2d5-l3", title: "Orientation / training visibility review", kind: "Live Practice", minutes: 10, summary: "Confirm status and route follow-up." },
      { id: "w2d5-l4", title: "Benefits / employee question review", kind: "Reflection", minutes: 10, summary: "Manager reviews written responses." },
    ],
    checklist: ["Completed assigned supervised tasks", "No HR item left without next step", "Manager check-in completed"],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list."],
    resources: [R.l2Intake, R.l2Onboard, R.l2Background, R.l2Benefits],
    knowledgeCheck: { q: "What must always be true at the end of a mini-shift?", a: "Every item has owner, status, next action, and follow-up date; sensitive info stays need-to-know." },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 manager / mentor signoff required before moving to Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: HrDayModule[] = [
  day(3, 1, 11, {
    title: "Employee Record Hygiene and Hierarchy Visibility",
    description: "Learn why employee records, reporting lines, roles, departments, state assignment, and hierarchy must be clean.",
    objectives: ["Audit employee record fields", "Identify missing or outdated information", "Route updates to the correct owner/system"],
    lessons: [
      { id: "w3d1-l1", title: "Employee record basics", kind: "SOP", minutes: 10, summary: "What fields matter and why." },
      { id: "w3d1-l2", title: "Role / department / state accuracy", kind: "Workflow", minutes: 10, summary: "Keep the operational picture true." },
      { id: "w3d1-l3", title: "Reporting line awareness", kind: "Overview", minutes: 8, summary: "Managers rely on accurate reporting lines." },
      { id: "w3d1-l4", title: "Record updates and confidentiality", kind: "SOP", minutes: 10, summary: "How to update records safely and confidentially." },
    ],
    checklist: ["Audited 5 employee records", "Identified missing/outdated information", "Routed / update plan approved by mentor"],
    shadowing: ["Watch mentor review employee record / hierarchy information."],
    livePractice: ["Audit 5 sample employee records for missing/outdated info."],
    resources: [R.l1HrSop, R.employeeRecordGuide, R.orgChart],
    knowledgeCheck: { q: "Should sensitive employee record details be shared casually?", a: "No. Records stay need-to-know and current." },
    reflectionPrompt: "How does inaccurate employee hierarchy create operational confusion?",
  }),
  day(3, 2, 12, {
    title: "Performance Reviews and Manager Support",
    description: "Support performance review processes without replacing the manager's ownership of performance.",
    objectives: ["Track review schedule and status", "Support managers with process and deadlines", "Document review completion without unofficial commentary"],
    lessons: [
      { id: "w3d2-l1", title: "Performance review purpose", kind: "Overview", minutes: 8, summary: "Reviews grow people and protect the company." },
      { id: "w3d2-l2", title: "Review tracking", kind: "SOP", minutes: 10, summary: "Schedule, status, due dates, follow-up." },
      { id: "w3d2-l3", title: "Manager follow-up", kind: "Workflow", minutes: 12, summary: "Warm, specific reminders to managers." },
      { id: "w3d2-l4", title: "Documentation quality", kind: "SOP", minutes: 10, summary: "Factual, dated, professional." },
    ],
    checklist: ["Reviewed 5 performance review examples", "Identified manager follow-up", "Drafted clear review-status note"],
    shadowing: ["Watch mentor review performance review tracker or manager follow-up."],
    livePractice: ["Review 5 performance review scenarios and recommend next action."],
    resources: [R.l2Reviews, R.reviewTemplates, R.mgrTemplates],
    knowledgeCheck: { q: "Does HR replace the manager's performance ownership?", a: "No. HR supports process; managers own the performance conversation." },
    reflectionPrompt: "How can HR support performance reviews without becoming the employee's direct manager?",
  }),
  day(3, 3, 13, {
    title: "Corrective Action and Sensitive Employee Matters",
    description: "Handle corrective action and sensitive employee matters carefully, factually, and confidentially.",
    objectives: ["Route sensitive matters to HR Lead / leadership when needed", "Keep notes factual and professional", "Never provide unauthorized legal/compliance conclusions"],
    lessons: [
      { id: "w3d3-l1", title: "Corrective action purpose", kind: "Overview", minutes: 8, summary: "Why we document and how we protect people." },
      { id: "w3d3-l2", title: "Sensitive matter handling", kind: "SOP", minutes: 12, summary: "Care, discretion, timing, and privacy." },
      { id: "w3d3-l3", title: "Documentation standards", kind: "SOP", minutes: 12, summary: "Factual, dated, complete, professional." },
      { id: "w3d3-l4", title: "Escalation to HR Lead / leadership", kind: "SOP", minutes: 10, summary: "When to loop in leadership." },
    ],
    checklist: ["Reviewed 4 sensitive scenarios", "Identified escalation path", "Drafted factual notes with mentor approval"],
    shadowing: ["Watch mentor review a sensitive scenario using a mock/example only."],
    livePractice: ["Review 4 mock corrective action / sensitive issue scenarios and select escalation path."],
    resources: [R.l2Corrective, R.correctiveGuide, R.escalationGuide, R.docStandards],
    knowledgeCheck: { q: "Should corrective action details be discussed outside need-to-know channels?", a: "No. Sensitive matters stay confidential and factual; escalate when unclear." },
    reflectionPrompt: "What makes HR documentation professional and safe?",
  }),
  day(3, 4, 14, {
    title: "Offboarding — Current Operations",
    description: "Coordinate offboarding cleanly and respectfully.",
    objectives: ["Confirm last day, access/equipment return, and final paperwork", "Coordinate with IT/Security, manager, payroll/finance, and office/admin", "Track completion and follow-up"],
    lessons: [
      { id: "w3d4-l1", title: "Offboarding purpose", kind: "Overview", minutes: 6, summary: "Clean exits protect the person and the company." },
      { id: "w3d4-l2", title: "Departure information", kind: "SOP", minutes: 10, summary: "Role, dept/state, last day, manager, reason/category." },
      { id: "w3d4-l3", title: "Access / equipment / final items", kind: "SOP", minutes: 12, summary: "IT/security, equipment return, badges, credentials." },
      { id: "w3d4-l4", title: "Documentation and communication", kind: "SOP", minutes: 10, summary: "Professional, confidential, complete." },
    ],
    checklist: ["Reviewed 3 offboarding scenarios", "Identified cross-department owners", "Completed offboarding next-action plan"],
    shadowing: ["Watch mentor process or review an offboarding checklist."],
    livePractice: ["Review 3 offboarding scenarios and complete checklist / next-action plan."],
    resources: [R.l2Offboard, R.offboardChecklist, R.itOffboard, R.officeHandoff],
    knowledgeCheck: { q: "Should access/equipment/offboarding tasks be tracked?", a: "Yes. Cleanly, confidentially, and with follow-up." },
    reflectionPrompt: "Why does offboarding need to be organized even when someone leaves quickly?",
  }),
  day(3, 5, 15, {
    title: "Cross-Department HR Handoffs",
    description: "Coordinate with Recruiting, Payroll/Finance, Office Manager/Admin, IT/Security, Training, State Ops, and department managers.",
    objectives: ["Identify the correct next owner", "Write clear, specific handoffs", "Confirm follow-up date and update the tracker"],
    lessons: [
      { id: "w3d5-l1", title: "Recruiting handoff", kind: "SOP", minutes: 10, summary: "Both directions — back to Recruiting or over to HR." },
      { id: "w3d5-l2", title: "Payroll / Finance handoff", kind: "SOP", minutes: 10, summary: "HR supplies readiness; Payroll processes." },
      { id: "w3d5-l3", title: "Office Manager / Admin handoff", kind: "SOP", minutes: 10, summary: "Assigned logistics, supplies, mail, scanning." },
      { id: "w3d5-l4", title: "IT/Security and Training handoff", kind: "SOP", minutes: 10, summary: "Access, credentials, training visibility." },
    ],
    checklist: ["Drafted 5 clear HR handoffs", "Identified correct owner", "Included due date / context / follow-up"],
    shadowing: ["Watch mentor complete cross-department handoffs."],
    livePractice: ["Draft 5 HR handoffs for mentor review."],
    resources: [R.l2Handoff, R.l2Onboard, R.l2Intake, R.l1OfficeSop, R.payrollHandoff],
    knowledgeCheck: { q: "Should HR own payroll processing if Payroll/Finance owns it?", a: "No. HR supports readiness; Payroll processes." },
    reflectionPrompt: "What makes another department able to act on an HR handoff immediately?",
    signoffRequired: "Week 3 manager / mentor signoff required before moving to Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: HrDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled HR Queue Ownership — Part 1",
    description: "Own a small set of real HR tasks with mentor review.",
    objectives: ["Prioritize the HR queue", "Complete assigned work accurately and confidentially", "End day with no assigned item lacking next action"],
    lessons: [
      { id: "w4d1-l1", title: "Morning HR queue review", kind: "Workflow", minutes: 10, summary: "Set the day's priorities." },
      { id: "w4d1-l2", title: "Prioritizing HR work", kind: "SOP", minutes: 10, summary: "Onboarding starts, background follow-up, urgent employee questions, offboarding, sensitive items." },
      { id: "w4d1-l3", title: "Updating current trackers / records", kind: "SOP", minutes: 10, summary: "Keep records accurate as you work." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "Workflow", minutes: 10, summary: "Nothing left silently pending." },
    ],
    checklist: ["Completed assigned queue", "Updated current systems accurately", "Manager reviewed work"],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned HR tasks with mentor review."],
    resources: [R.l1HrSop, R.l2Intake, R.l2Onboard, R.l2Offboard],
    knowledgeCheck: { q: "What should be true at end of day about your assigned HR queue?", a: "Every item has current status, owner, next action, and follow-up date; sensitive info stays need-to-know." },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled HR Queue Ownership — Part 2",
    description: "Repeat controlled ownership with more independence.",
    objectives: ["Own more with less oversight", "Escalate sensitive matters clearly", "Keep queue clean"],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "SOP", minutes: 10, summary: "Follow-up dates land, don't drift." },
      { id: "w4d2-l2", title: "Confidentiality in practice", kind: "Workflow", minutes: 12, summary: "Real reps under a confidentiality lens." },
      { id: "w4d2-l3", title: "Employee communication", kind: "Workflow", minutes: 10, summary: "Warm, plain, professional, dated." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Escalate the right way, to the right owner." },
    ],
    checklist: ["Completed queue work", "Escalated blockers correctly", "No stale / unowned assigned HR item"],
    shadowing: ["Minimal — learner performs while mentor reviews."],
    livePractice: ["Own 10–15 assigned HR tasks."],
    resources: [R.l2Benefits, R.l2Background, R.l2Corrective, R.l2Reviews],
    knowledgeCheck: { q: "Where should an unclear or sensitive HR matter go?", a: "To HR Lead / leadership with facts, impact, and a requested next step." },
    reflectionPrompt: "What did you escalate today and why?",
  }),
  day(4, 3, 18, {
    title: "HR Communication Quality Day",
    description: "Focus on clear, warm, confidential communication with employees, managers, Recruiting, Payroll/Finance, Office/Admin, IT/Security, and leadership.",
    objectives: ["Write clear HR notes", "Keep employee communication warm and plain-language", "Never overpromise or share beyond need-to-know"],
    lessons: [
      { id: "w4d3-l1", title: "Clear HR notes", kind: "SOP", minutes: 12, summary: "What was asked, what was done, what's missing, owner, follow-up." },
      { id: "w4d3-l2", title: "Employee response quality", kind: "Workflow", minutes: 10, summary: "Warm, plain, professional." },
      { id: "w4d3-l3", title: "Manager handoff quality", kind: "SOP", minutes: 10, summary: "Actionable, specific, dated." },
      { id: "w4d3-l4", title: "Confidentiality and tone", kind: "SOP", minutes: 10, summary: "Sensitive notes stay factual and need-to-know." },
    ],
    checklist: ["Drafted 5 clear HR notes / responses", "Mentor approved tone and specificity", "Confidentiality handled correctly"],
    shadowing: ["Mentor reviews written updates and handoffs."],
    livePractice: ["Draft 5 HR responses / handoff notes for mentor review."],
    resources: [R.l2Intake, R.l2Benefits, R.l2Corrective, R.emplTemplates, R.mgrTemplates],
    knowledgeCheck: { q: "What makes an HR message feel helpful without saying too much?", a: "Clarity + warmth + need-to-know discipline + a clear next step." },
    reflectionPrompt: "What makes an HR message feel helpful without saying too much?",
  }),
  day(4, 4, 19, {
    title: "End-to-End HR Lifecycle Simulation",
    description: "Complete a full HR simulation from hiring handoff through onboarding, background, orientation/training visibility, employee question, and offboarding/sensitive issue routing.",
    objectives: ["Run one lifecycle end-to-end", "Pass mentor review", "Complete a real task set alongside the simulation"],
    lessons: [
      { id: "w4d4-l1", title: "Hiring handoff simulation", kind: "Live Practice", minutes: 10, summary: "Start from a fresh Recruiting handoff." },
      { id: "w4d4-l2", title: "Onboarding / background simulation", kind: "Live Practice", minutes: 12, summary: "Move onboarding + background forward cleanly." },
      { id: "w4d4-l3", title: "Orientation / training visibility simulation", kind: "Live Practice", minutes: 10, summary: "Confirm status and follow up." },
      { id: "w4d4-l4", title: "Employee support request simulation", kind: "Live Practice", minutes: 10, summary: "Handle or route with confidence." },
      { id: "w4d4-l5", title: "Offboarding / sensitive issue routing simulation", kind: "Live Practice", minutes: 12, summary: "Coordinate cross-department; escalate as needed." },
    ],
    checklist: ["Completed full simulation", "Passed mentor review", "Completed real task set"],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1HrSop, R.l2Handoff, R.l2Onboard, R.l2Background, R.l2Offboard, R.l2Corrective],
    knowledgeCheck: { q: "What part of the HR lifecycle should you still practice?", a: "Any step the learner cannot execute end-to-end without prompting — schedule reps." },
    reflectionPrompt: "What part of the HR lifecycle do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description: "Complete final review; manager determines readiness for ongoing HR ownership and sets a 30-day plan.",
    objectives: ["Complete final knowledge review", "Have a readiness conversation with manager", "Create a 30-day growth plan"],
    lessons: [
      { id: "w4d5-l1", title: "Final knowledge review", kind: "Quiz", minutes: 20, summary: "10–15 questions covering the full journey." },
      { id: "w4d5-l2", title: "Readiness conversation", kind: "Workflow", minutes: 15, summary: "What can be owned independently vs still reviewed." },
      { id: "w4d5-l3", title: "Strengths and coaching areas", kind: "Overview", minutes: 10, summary: "Name 2 strengths and 2 coaching areas." },
      { id: "w4d5-l4", title: "Next 30-day growth plan", kind: "Workflow", minutes: 15, summary: "Concrete targets for the first month of independent work." },
    ],
    checklist: ["Completed all modules", "Completed final quiz", "Manager signoff completed", "Next 30-day plan created"],
    shadowing: ["End-of-journey manager review."],
    livePractice: ["Learner runs a short HR queue review while manager observes."],
    resources: [R.l1HrSop, R.role306090, R.roleDeepDive, R.l2Intake, R.l2Handoff, R.l2Onboard, R.l2Offboard],
    knowledgeCheck: {
      q: "Final: name any 3 of — HR lifecycle, confidentiality, current systems, owner/status/next action/follow-up, intake, hiring handoff, onboarding, background, orientation, benefits, records, reviews, corrective action, offboarding, cross-department handoffs, role boundaries.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about HR that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into independent ownership with a 30-day plan.",
  }),
];

export const HR_DAYS: HrDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getHrDay(sourceModuleId: string): HrDayModule | undefined {
  return HR_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalHrMinutes(): number {
  return HR_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}
