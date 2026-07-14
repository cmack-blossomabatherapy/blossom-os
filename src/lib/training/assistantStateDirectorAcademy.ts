/**
 * Assistant State Director Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new Assistant State Director / State Director Assistant on today's
 * Blossom process using current tools (Monday / current trackers, CentralReach
 * visibility, Outlook / Teams, phone, state notes) with clear boundaries
 * between State Director ownership, Assistant State Director support execution,
 * and department ownership (Intake, Recruiting, Authorizations, Scheduling,
 * Staffing, QA, HR, Credentialing, Billing/RCM, Clinical) — plus VA task
 * oversight where a VA exists.
 *
 * Mirrors `behavioralSupportAcademy.ts` so it plugs into the same academy
 * adapter without touching other role/department curricula.
 */

export type AsdLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface AsdLesson {
  id: string;
  title: string;
  summary: string;
  kind: AsdLessonKind;
  minutes: number;
}

export interface AsdResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface AssistantStateDirectorDayModule {
  /** Source module id — becomes `assistant-state-director::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: AsdLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: AsdResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface AssistantStateDirectorWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const ASSISTANT_STATE_DIRECTOR_WEEKS: AssistantStateDirectorWeek[] = [
  { weekNumber: 1, title: "Week 1 · State Operations Foundations, Welcome, Current Systems, and Role Boundaries",
    goal: "Understand Blossom, the Assistant State Director role, state health, current systems, current department boundaries, and why the assistant supports execution without becoming the permanent owner of every department." },
  { weekNumber: 2, title: "Week 2 · Intake Support, Recruiting Support, State Growth, and Current Scaling Reality",
    goal: "Learn today's reality that Assistant State Directors may support intake / recruiting execution while a state is scaling, without erasing department ownership." },
  { weekNumber: 3, title: "Week 3 · VA Oversight, Escalation Management, State Communication, and Local State Knowledge",
    goal: "Manage task follow-up, VA work visibility, escalation quality, state communication discipline, and state-specific details." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Communication Quality, Simulation, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real Assistant State Director work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1Asd: { label: "L1 Assistant State Director Role SOP", href: "/resource-library", pending: true },
  l1Sd: { label: "L1 State Director Role SOP", href: "/resource-library", pending: true },
  l1Rsd: { label: "L1 Regional State Director Role SOP", href: "/resource-library", pending: true },
  l1Va: { label: "L1 State VA Role SOP", href: "/resource-library", pending: true },
  binder: { label: "State Operations Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "Assistant State Director Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "Assistant State Director Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l2AsdSupport: { label: "L2 Assistant State Director Intake and Recruiting Support Process SOP", href: "/resource-library", pending: true },
  l2Health: { label: "L2 State Health Review Process SOP", href: "/resource-library", pending: true },
  l2Esc: { label: "L2 State Escalation Management Process SOP", href: "/resource-library", pending: true },
  l2Growth: { label: "L2 State Growth Coordination Process SOP", href: "/resource-library", pending: true },
  l2Va: { label: "L2 State VA Task Oversight Process SOP", href: "/resource-library", pending: true },
  l2Recruit: { label: "L2 State Recruiting Need Review Process SOP", href: "/resource-library", pending: true },
  l1Intake: { label: "L1 Intake Lead / Admissions Role SOP", href: "/resource-library", pending: true },
  l2Intake: { label: "L2 New Lead Intake Process SOP", href: "/resource-library", pending: true },
  l2Family: { label: "L2 Family Contact and Follow-Up Process SOP", href: "/resource-library", pending: true },
  l1Recruit: { label: "L1 Recruiting Lead / Coordinator Role SOP", href: "/resource-library", pending: true },
  l1Sched: { label: "L1 Scheduling Coordinator Role SOP", href: "/resource-library", pending: true },
  l1Staff: { label: "L1 Staffing Coordinator Role SOP", href: "/resource-library", pending: true },
  l1Auth: { label: "L1 Authorizations / Utilization Manager Role SOP", href: "/resource-library", pending: true },
  l1Clin: { label: "L1 Clinical Services / Case Manager Role SOP", href: "/resource-library", pending: true },
  l1Qa: { label: "L1 QA Director / QA Reviewer Role SOP", href: "/resource-library", pending: true },
  l2Lifecycle: { label: "L2 Client Lifecycle Current Operations", href: "/resource-library", pending: true },
  l2OpenCase: { label: "L2 Open Case Staffing Follow-Up Process SOP", href: "/resource-library", pending: true },
  l2PendingAuth: { label: "L2 Pending Authorization Follow-Up Process SOP", href: "/resource-library", pending: true },
  stateOverview: { label: "Assigned State Overview SOP", href: "/resource-library", pending: true },
  stateContacts: { label: "Assigned State Contacts SOP", href: "/resource-library", pending: true },
  stateIns: { label: "Assigned State Insurance SOP", href: "/resource-library", pending: true },
  stateReq: { label: "Assigned State Local Requirements SOP", href: "/resource-library", pending: true },
  stateSched: { label: "Assigned State Scheduling / Forms / Local Vendors SOPs", href: "/resource-library", pending: true },
  trackerGuide: { label: "Current State Tracker Guide", href: "/resource-library", pending: true },
  crGuide: { label: "CentralReach Visibility Guide", href: "/resource-library", pending: true },
  healthTemplate: { label: "State Health Review Template", href: "/resource-library", pending: true },
  sdUpdate: { label: "State Director Update Template", href: "/resource-library", pending: true },
  vaTracker: { label: "VA Task Tracker Template", href: "/resource-library", pending: true },
  deptMap: { label: "Department Ownership Map", href: "/resource-library", pending: true },
  escTemplate: { label: "Escalation Template", href: "/resource-library", pending: true },
  intakeChecklist: { label: "Intake Support Checklist", href: "/resource-library", pending: true },
  recruitChecklist: { label: "Recruiting Support Checklist", href: "/resource-library", pending: true },
  growthChecklist: { label: "State Growth Blocker Checklist", href: "/resource-library", pending: true },
  commTemplates: { label: "Current Communication Templates", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<AssistantStateDirectorDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): AssistantStateDirectorDayModule {
  return {
    id: `asd-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: AssistantStateDirectorDayModule[] = [
  day(1, 1, 1, {
    title: "Assistant State Director Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what the Assistant State Director does and why it matters. The Assistant State Director helps the State Director keep the state moving every day — watching details, following up, helping execute state priorities, and making sure issues do not disappear into Monday, email, Teams, or memory.",
    objectives: [
      "Explain what the Assistant State Director owns today",
      "Explain what the Assistant State Director does not own",
      "Explain State Director vs Assistant State Director vs VA responsibilities",
      "Explain the owner / status / next action / follow-up date rule",
    ],
    lessons: [
      { id: "w1d1-l1", title: "What the Assistant State Director owns today", kind: "Overview", minutes: 10, summary: "Support execution, state issue follow-up, communication support, intake/recruiting support where currently assigned, and VA task oversight where a VA exists." },
      { id: "w1d1-l2", title: "What the Assistant State Director does not own", kind: "Overview", minutes: 8, summary: "Not the permanent owner of Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, HR, Credentialing, Billing/RCM, or Clinical execution." },
      { id: "w1d1-l3", title: "State Director vs Assistant State Director vs VA", kind: "SOP", minutes: 10, summary: "State Director owns state health / growth / relationships / outcomes / escalation accountability. Assistant State Director supports execution and follow-up. VA supports assigned tasks as volume grows." },
      { id: "w1d1-l4", title: "State health and daily execution", kind: "Workflow", minutes: 10, summary: "No state issue, support task, lead/candidate item, case follow-up, or VA task should sit without owner, status, next action, and follow-up date." },
    ],
    checklist: [
      "Can explain what the Assistant State Director owns",
      "Can explain what the Assistant State Director does not own",
      "Can explain the State Director / Assistant State Director / VA difference",
      "Can explain why state issues need owner / status / next action / follow-up date",
    ],
    shadowing: ["Sit with the State Director, Assistant State Director mentor, Regional State Director/mentor, or assigned manager for 30–60 minutes and watch how they review state priorities and open issues."],
    livePractice: ["No live state ownership yet — observe only."],
    resources: [R.l1Asd, R.binder, R.roleDeepDive, R.l1Sd, R.l1Va, R.l2Health],
    knowledgeCheck: {
      q: "What four things should every state issue or support task have before you leave it?",
      a: "Owner, status, next action, follow-up date. The Assistant State Director does not permanently own every department.",
    },
    reflectionPrompt: "In your own words, how does an Assistant State Director help a state run better without becoming the owner of every department?",
  }),
  day(1, 2, 2, {
    title: "Current State Operations Systems Tour — Monday, CentralReach Visibility, Outlook, Teams, Phone, and State Notes",
    description:
      "Learn today's systems the Assistant State Director touches: Monday / current trackers for state work, CentralReach for visibility into clinical / schedule / client information per role, Outlook / Teams / phone for communication, and where state issue notes and handoffs are documented today.",
    objectives: [
      "Identify the main current state operations tools",
      "Explain what CentralReach is used for in state visibility (not a state ops CRM)",
      "Find key state issue fields in samples",
      "Explain where follow-up should be documented today",
    ],
    lessons: [
      { id: "w1d2-l1", title: "Monday / current tracker basics", kind: "SOP", minutes: 12, summary: "State, client/family, lead/candidate, staff/RBT/BCBA, department owner, issue type, status, urgency, owner, next action, follow-up date, notes." },
      { id: "w1d2-l2", title: "CentralReach visibility basics", kind: "Overview", minutes: 10, summary: "Read-only visibility into clinical / schedule / client info by permission. Not the state ops CRM." },
      { id: "w1d2-l3", title: "Outlook and Teams communication basics", kind: "SOP", minutes: 10, summary: "Documented, professional communication with departments, staff, families, and state leadership." },
      { id: "w1d2-l4", title: "Phone and follow-up basics", kind: "SOP", minutes: 8, summary: "Document contact attempts and outcomes; never leave follow-up in memory." },
      { id: "w1d2-l5", title: "State notes and issue tracking", kind: "SOP", minutes: 10, summary: "Where state issue notes and handoffs are captured today." },
    ],
    checklist: [
      "Identified main current state operations tools",
      "Explained what CentralReach is used for in state visibility",
      "Identified key state issue fields in 3 samples",
      "Explained where follow-up should be documented",
    ],
    shadowing: ["Watch mentor review one state issue across the current tracker, CentralReach visibility if needed, and communication notes."],
    livePractice: ["In training/sandbox or with mentor supervision, locate 3 sample state issues and point out owner / status / next action / follow-up date."],
    resources: [R.l2Health, R.l2Esc, R.trackerGuide, R.crGuide],
    knowledgeCheck: {
      q: "Is CentralReach the state operations CRM, and should state issue follow-up be documented today?",
      a: "No — CentralReach is clinical/scheduling visibility. Yes — follow-up must always be documented.",
    },
    reflectionPrompt: "Which state operations system or communication channel is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "State Health Review Basics",
    description:
      "Learn what state health means and how the Assistant State Director helps keep it visible for the State Director.",
    objectives: [
      "Explain state health categories",
      "Distinguish department-owned vs state-leadership-owned issues",
      "Prepare a state health summary for the State Director",
    ],
    lessons: [
      { id: "w1d3-l1", title: "What state health means", kind: "Overview", minutes: 8, summary: "Lead flow, intake status, recruiting/staffing needs, open cases, hours serviced, auth blockers, schedule/staffing issues, clinical/QA concerns, family issues, RBT/BCBA concerns, local marketing/BD support, escalations." },
      { id: "w1d3-l2", title: "State health inputs", kind: "SOP", minutes: 10, summary: "Where each input lives today." },
      { id: "w1d3-l3", title: "Daily / weekly review discipline", kind: "Workflow", minutes: 12, summary: "Cadence and what to look at." },
      { id: "w1d3-l4", title: "State Director handoff", kind: "SOP", minutes: 10, summary: "Prepare a concise, structured summary." },
    ],
    checklist: [
      "Can explain state health",
      "Reviewed 5 state health items",
      "Categorized department owner vs state leadership follow-up",
      "Drafted state health summary points",
    ],
    shadowing: ["Watch mentor prepare or review a state health summary."],
    livePractice: ["Under mentor supervision, review 5 state health items and categorize owner / next action."],
    resources: [R.l2Health, R.l2Growth, R.l1Sd, R.healthTemplate],
    knowledgeCheck: {
      q: "Should every issue automatically belong to the State Director, and should the Assistant State Director prepare clear state visibility?",
      a: "No to blanket State Director ownership; yes — prepare clear visibility.",
    },
    reflectionPrompt: "What makes a state feel healthy or unhealthy operationally?",
  }),
  day(1, 4, 4, {
    title: "Department Boundaries and Handoff Discipline",
    description:
      "Learn how to work with departments without absorbing every department's job. Follow up so items move, but never quietly become the permanent owner.",
    objectives: [
      "Identify the correct department owner for common state issues",
      "Write clean handoffs with issue / state / owner / action / urgency / follow-up",
      "Escalate stuck items to State Director / department lead / leadership",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Department ownership map", kind: "Overview", minutes: 10, summary: "Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, Clinical, Case Management, HR, Credentialing, Billing/RCM, Marketing/BD, State Ops, and leadership." },
      { id: "w1d4-l2", title: "Clean handoff standards", kind: "SOP", minutes: 12, summary: "Issue, state, client/candidate/family/staff, department owner, requested action, urgency, due/follow-up date, context." },
      { id: "w1d4-l3", title: "Follow-up without taking over", kind: "Workflow", minutes: 10, summary: "Make sure items move without becoming the silent permanent owner." },
      { id: "w1d4-l4", title: "Escalation when departments are blocked", kind: "SOP", minutes: 10, summary: "Escalate cleanly — not stress-forward every issue." },
    ],
    checklist: [
      "Drafted 5 clear handoffs",
      "Identified correct department owner",
      "Included urgency / context / follow-up date",
    ],
    shadowing: ["Watch mentor hand off issues to multiple departments."],
    livePractice: ["Draft 5 department handoffs for mentor review."],
    resources: [R.l2Esc, R.l2Health, R.deptMap],
    knowledgeCheck: {
      q: "Should handoffs include owner and requested action, and should the Assistant State Director quietly become the permanent owner of every department?",
      a: "Yes to structured handoffs; no — departments retain ownership.",
    },
    reflectionPrompt: "How can an Assistant State Director be helpful without letting departments lose ownership?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1 and confirm understanding of Assistant State Director role boundaries, current systems, state health, and department handoffs.",
    objectives: [
      "Review 3 sample state items with mentor",
      "Explain status, next action, owner, state impact, department boundary, escalation need",
      "Identify anything still unclear",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering state health, current systems, department ownership, owner/status/next action, and escalation." },
      { id: "w1d5-l2", title: "Assistant State Director boundary check", kind: "Overview", minutes: 8, summary: "Assistant State Director vs State Director vs VA vs departments." },
      { id: "w1d5-l3", title: "State health walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 items end-to-end with mentor." },
      { id: "w1d5-l4", title: "Mentor feedback", kind: "Shadowing", minutes: 10, summary: "Strengths and coaching areas for Week 2." },
    ],
    checklist: [
      "Completed Week 1 quiz",
      "Reviewed 3 state items with mentor",
      "Can explain current systems and role boundaries",
      "Manager / mentor signoff completed",
    ],
    shadowing: ["Watch end-of-day state issue review."],
    livePractice: ["Complete supervised state issue checklist for 3 items."],
    resources: [R.l1Asd, R.l2Health, R.binder, R.roleDeepDive],
    knowledgeCheck: {
      q: "What must always be true before you close out a state item for the day?",
      a: "Owner, status, next action, and follow-up date are set; departments retain ownership; escalate only what needs leadership decisions.",
    },
    reflectionPrompt: "What part of Assistant State Director work still feels confusing?",
    signoffRequired: "Week 1 manager / mentor signoff required before moving to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: AssistantStateDirectorDayModule[] = [
  day(2, 1, 6, {
    title: "Intake Support in a Growing State",
    description:
      "Learn how the Assistant State Director may support intake work today when the state is still scaling — without erasing that Intake exists and owns its department.",
    objectives: [
      "Support lead follow-up where currently assigned",
      "Hand off cleanly to Intake when Intake owns the item",
      "Track owner / status / next action / follow-up date",
    ],
    lessons: [
      { id: "w2d1-l1", title: "Intake support purpose", kind: "Overview", minutes: 8, summary: "Why state support helps intake in growing states." },
      { id: "w2d1-l2", title: "Current state scaling reality", kind: "SOP", minutes: 10, summary: "State Director → Assistant State Director → VA support → additional VA → BD as volume grows." },
      { id: "w2d1-l3", title: "Lead follow-up basics", kind: "Workflow", minutes: 12, summary: "Confirm owner, status, family contact needs, missing info, follow-up date, VOB/benefits readiness awareness, next action." },
      { id: "w2d1-l4", title: "Handoff to Intake department", kind: "SOP", minutes: 10, summary: "Clean handoff when Intake owns or when state support is no longer appropriate." },
    ],
    checklist: [
      "Reviewed 5 intake support scenarios",
      "Identified when Assistant State Director supports vs when Intake owns",
      "Drafted clear follow-up / handoff note",
    ],
    shadowing: ["Watch mentor support or review state intake items."],
    livePractice: ["Review 5 lead / intake support scenarios and recommend next action / owner."],
    resources: [R.l2AsdSupport, R.l1Intake, R.l2Intake, R.l2Family, R.intakeChecklist],
    knowledgeCheck: {
      q: "Does Intake exist today, and can the Assistant State Director support intake work in growing states?",
      a: "Yes to both — Intake owns its department; Assistant State Directors support where assigned.",
    },
    reflectionPrompt: "How can state intake support help without erasing Intake department ownership?",
  }),
  day(2, 2, 7, {
    title: "Recruiting Support in a Growing State",
    description:
      "Learn how the Assistant State Director may support recruiting visibility and follow-up without owning the Recruiting department.",
    objectives: [
      "Communicate clear state hiring needs to Recruiting",
      "Support candidate / interview follow-up only where assigned",
      "Track owner / status / next action / follow-up",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Recruiting support purpose", kind: "Overview", minutes: 8, summary: "Why state support helps recruiting in growing states." },
      { id: "w2d2-l2", title: "State hiring need awareness", kind: "SOP", minutes: 10, summary: "Role / state / location need, urgency, staffing gap, open hours, hiring priority." },
      { id: "w2d2-l3", title: "Candidate / interview follow-up awareness", kind: "Workflow", minutes: 12, summary: "Support follow-up where assigned; do not permanently own the pipeline." },
      { id: "w2d2-l4", title: "Handoff to Recruiting", kind: "SOP", minutes: 10, summary: "Send state needs to Recruiting in a specific, actionable way." },
    ],
    checklist: [
      "Reviewed 5 recruiting support scenarios",
      "Identified when Recruiting owns vs state support assists",
      "Drafted state recruiting need / handoff note",
    ],
    shadowing: ["Watch mentor review a state recruiting need or candidate follow-up item."],
    livePractice: ["Review 5 recruiting support scenarios and choose next action / owner."],
    resources: [R.l2AsdSupport, R.l2Recruit, R.l1Recruit, R.recruitChecklist],
    knowledgeCheck: {
      q: "Should the Assistant State Director own the full recruiting pipeline forever, and should state hiring needs be specific?",
      a: "No to permanent pipeline ownership; yes — hiring needs must be specific.",
    },
    reflectionPrompt: "What does Recruiting need from State Operations to find the right people?",
  }),
  day(2, 3, 8, {
    title: "State Growth Coordination",
    description:
      "Learn how the Assistant State Director supports state growth through visibility, follow-up, and coordination.",
    objectives: [
      "Identify growth inputs and blockers",
      "Track owner and next action for each blocker",
      "Prepare a clear growth summary for the State Director",
    ],
    lessons: [
      { id: "w2d3-l1", title: "What state growth means", kind: "Overview", minutes: 8, summary: "Growth is more than lead volume — capacity, clinical, family experience, hours." },
      { id: "w2d3-l2", title: "Growth inputs", kind: "SOP", minutes: 10, summary: "Leads, referrals, marketing/BD activity, recruiting/staffing capacity, open cases, clinical capacity, auth readiness, family experience, hours serviced." },
      { id: "w2d3-l3", title: "BD / local support awareness", kind: "SOP", minutes: 10, summary: "How BD / local support ties into growth." },
      { id: "w2d3-l4", title: "Growth blocker tracking", kind: "Workflow", minutes: 12, summary: "Blocker, owner, action, follow-up date." },
    ],
    checklist: [
      "Can explain state growth inputs",
      "Reviewed 5 growth items",
      "Drafted blocker summary",
    ],
    shadowing: ["Watch mentor prepare a growth / blocker summary."],
    livePractice: ["Review 5 state growth items and identify blocker / owner / next action."],
    resources: [R.l2Growth, R.l2Health, R.growthChecklist],
    knowledgeCheck: {
      q: "Can staffing / recruiting capacity block growth, and should growth blockers have owners?",
      a: "Yes to both.",
    },
    reflectionPrompt: "What blocks state growth besides just lead volume?",
  }),
  day(2, 4, 9, {
    title: "Client Pipeline and Case Follow-Up Support",
    description:
      "Learn how the Assistant State Director helps keep the state client pipeline moving without replacing departments.",
    objectives: [
      "Identify current blocker (intake, VOB/financial, auth, scheduling, staffing, clinical/QA, family, state)",
      "Route to correct department owner and follow up",
      "Document state impact and next action",
    ],
    lessons: [
      { id: "w2d4-l1", title: "Client pipeline overview", kind: "Overview", minutes: 8, summary: "What the state client pipeline looks like today." },
      { id: "w2d4-l2", title: "Open case / staffing awareness", kind: "SOP", minutes: 10, summary: "Where open cases live and who owns them." },
      { id: "w2d4-l3", title: "Auth / scheduling / clinical blocker awareness", kind: "Workflow", minutes: 12, summary: "How to see stuck items and route." },
      { id: "w2d4-l4", title: "Follow-up notes", kind: "SOP", minutes: 10, summary: "Clear notes with owner, action, follow-up, state impact." },
    ],
    checklist: [
      "Reviewed 5 pipeline / case scenarios",
      "Identified blocker and owner",
      "Drafted follow-up notes",
    ],
    shadowing: ["Watch mentor review client pipeline or open case items."],
    livePractice: ["Review 5 client pipeline scenarios and identify owner / next action."],
    resources: [R.l2Lifecycle, R.l2OpenCase, R.l2PendingAuth, R.l2Esc],
    knowledgeCheck: {
      q: "Should state pipeline blockers be routed to the right department, and should the Assistant State Director know where cases are stuck?",
      a: "Yes to both.",
    },
    reflectionPrompt: "How can state support keep cases moving without taking every task away from departments?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description:
      "Complete a supervised mini-shift using current intake / recruiting / growth / case support tasks.",
    objectives: [
      "Run 5–8 low-risk state support tasks with mentor review",
      "Keep every item's next step visible",
      "Maintain boundary discipline end-to-end",
    ],
    lessons: [
      { id: "w2d5-l1", title: "Intake support review", kind: "Live Practice", minutes: 10, summary: "Handle intake support items and hand off cleanly." },
      { id: "w2d5-l2", title: "Recruiting support review", kind: "Live Practice", minutes: 10, summary: "Handle recruiting support items and hand off cleanly." },
      { id: "w2d5-l3", title: "State growth blocker review", kind: "Live Practice", minutes: 10, summary: "Update blockers with owner / action / follow-up." },
      { id: "w2d5-l4", title: "Client pipeline follow-up review", kind: "Reflection", minutes: 10, summary: "Mentor reviews notes for clarity and boundary." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No state support item left without next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list."],
    resources: [R.l2AsdSupport, R.l2Health, R.l2Growth, R.l2Esc],
    knowledgeCheck: {
      q: "What must always be true at the end of a mini-shift?",
      a: "Every item has owner, status, next action, and follow-up date; departments retain ownership.",
    },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 manager / mentor signoff required before moving to Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: AssistantStateDirectorDayModule[] = [
  day(3, 1, 11, {
    title: "State VA Task Oversight",
    description:
      "Learn how the Assistant State Director oversees VA tasks when the state has VA support — clear instructions, quality review, and coaching without vague micromanaging.",
    objectives: [
      "Confirm task owner, instructions, due date, quality expectations, follow-up",
      "Review completed VA work for accuracy / completeness",
      "Provide clear correction or escalate repeated misses",
    ],
    lessons: [
      { id: "w3d1-l1", title: "VA role awareness", kind: "Overview", minutes: 8, summary: "What VAs support today and how their scope may expand with volume." },
      { id: "w3d1-l2", title: "VA task assignment", kind: "SOP", minutes: 10, summary: "Clear task, instructions, due date, quality expectation, follow-up." },
      { id: "w3d1-l3", title: "VA work review", kind: "Workflow", minutes: 12, summary: "Review completed work; give specific feedback." },
      { id: "w3d1-l4", title: "Coaching and escalation", kind: "SOP", minutes: 10, summary: "Escalate repeated quality issues or scope confusion." },
    ],
    checklist: [
      "Reviewed 5 VA task scenarios",
      "Identified quality / completion issues",
      "Drafted clear VA feedback / follow-up",
    ],
    shadowing: ["Watch mentor review VA work or task tracker."],
    livePractice: ["Review 5 VA task scenarios and choose next action."],
    resources: [R.l2Va, R.l1Va, R.vaTracker, R.roleDeepDive],
    knowledgeCheck: {
      q: "Should VA tasks have clear instructions and due dates, and should repeated VA quality issues be escalated / coached?",
      a: "Yes to both.",
    },
    reflectionPrompt: "What makes VA task oversight helpful instead of vague micromanaging?",
  }),
  day(3, 2, 12, {
    title: "State Escalation Management",
    description:
      "Learn how to manage state escalations clearly and calmly — with issue, impact, owner, attempted actions, requested decision, and follow-up date.",
    objectives: [
      "Identify escalation type and urgency",
      "Route to the correct owner",
      "Close the loop with State Director and department",
    ],
    lessons: [
      { id: "w3d2-l1", title: "What counts as a state escalation", kind: "SOP", minutes: 10, summary: "Family, staff/RBT, BCBA, clinical, scheduling, staffing, auth, intake, recruiting, billing/RCM, local vendor, state compliance, or leadership issue." },
      { id: "w3d2-l2", title: "Escalation triage", kind: "Workflow", minutes: 12, summary: "Urgency and owner." },
      { id: "w3d2-l3", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Issue, state impact, attempted actions, owner, requested decision, follow-up date." },
      { id: "w3d2-l4", title: "Closing the loop", kind: "SOP", minutes: 10, summary: "Update State Director and department on outcomes." },
    ],
    checklist: [
      "Reviewed 6 escalation scenarios",
      "Identified urgency and owner",
      "Drafted escalation notes",
    ],
    shadowing: ["Watch mentor triage and route state escalations."],
    livePractice: ["Review 6 escalation scenarios and choose owner / urgency / next action."],
    resources: [R.l2Esc, R.l2Health, R.deptMap, R.escTemplate],
    knowledgeCheck: {
      q: "Should escalations include issue, impact, owner, and requested next step, and should every escalation be vague and sent to everyone?",
      a: "Yes to structured escalations; no — never vague / everyone.",
    },
    reflectionPrompt: "What makes an escalation actionable instead of just stressful?",
  }),
  day(3, 3, 13, {
    title: "State Communication and Follow-Up Discipline",
    description:
      "Learn how to communicate clearly with departments, families, staff, and state leadership. Avoid vague updates; document contact and outcomes.",
    objectives: [
      "Use Outlook / Teams / phone appropriately",
      "Write specific, action-oriented updates",
      "Document contact attempts and outcomes",
    ],
    lessons: [
      { id: "w3d3-l1", title: "Communication channels", kind: "SOP", minutes: 8, summary: "When to use which channel today." },
      { id: "w3d3-l2", title: "Clear state updates", kind: "Workflow", minutes: 12, summary: "What happened, who owns next step, due date, state impact." },
      { id: "w3d3-l3", title: "Follow-up cadence", kind: "SOP", minutes: 10, summary: "Set the next check and honor it." },
      { id: "w3d3-l4", title: "Documentation after communication", kind: "SOP", minutes: 10, summary: "Capture contact, outcome, and next action." },
    ],
    checklist: [
      "Drafted 5 clear updates / handoffs",
      "Included owner / status / next action / follow-up",
      "Mentor approved tone and specificity",
    ],
    shadowing: ["Watch mentor communicate state updates."],
    livePractice: ["Draft 5 state update messages / handoffs for mentor review."],
    resources: [R.l2Esc, R.l2Health, R.commTemplates],
    knowledgeCheck: {
      q: "Should updates be specific and action-oriented, and should follow-up live only in memory?",
      a: "Yes to specific; no — follow-up is always documented.",
    },
    reflectionPrompt: "What makes a state update useful to leadership?",
  }),
  day(3, 4, 14, {
    title: "State-Specific Knowledge — Contacts, Insurance, Scheduling, Local Requirements, Forms, Vendors",
    description:
      "Learn how state-specific information affects Assistant State Director work. Do not assume all states work the same way.",
    objectives: [
      "Review the assigned state folder / resources",
      "Identify key state-specific notes",
      "List gaps and questions for manager",
    ],
    lessons: [
      { id: "w3d4-l1", title: "State contacts", kind: "SOP", minutes: 8, summary: "Key contacts for the assigned state." },
      { id: "w3d4-l2", title: "State insurance / local requirements", kind: "SOP", minutes: 12, summary: "Payer nuances and local rules." },
      { id: "w3d4-l3", title: "State scheduling / forms", kind: "SOP", minutes: 10, summary: "Forms and scheduling differences." },
      { id: "w3d4-l4", title: "Local vendors and local knowledge", kind: "SOP", minutes: 10, summary: "Vendors and process differences." },
    ],
    checklist: [
      "Reviewed assigned state folder / resources",
      "Identified key state-specific notes",
      "Listed gaps / questions for manager",
    ],
    shadowing: ["Watch mentor review state-specific resources."],
    livePractice: ["Complete state-specific resource review checklist for the assigned state."],
    resources: [R.stateOverview, R.stateContacts, R.stateIns, R.stateReq, R.stateSched],
    knowledgeCheck: {
      q: "Should every state be treated as identical, and should unknown state-specific rules be confirmed?",
      a: "No to identical; yes — always confirm state-specific rules.",
    },
    reflectionPrompt: "Why does state-specific knowledge matter for Assistant State Director work?",
  }),
  day(3, 5, 15, {
    title: "End-of-Day State Cleanup and Priority Planning",
    description:
      "Learn how to end the day with clean state visibility and a clear priority list for tomorrow.",
    objectives: [
      "Confirm every assigned item has status / owner / next action / follow-up date",
      "Identify stale items and tomorrow's urgent priorities",
      "Prepare a concise State Director summary",
    ],
    lessons: [
      { id: "w3d5-l1", title: "State queue cleanup", kind: "Workflow", minutes: 12, summary: "Sweep assigned items for missing fields." },
      { id: "w3d5-l2", title: "Stale item review", kind: "SOP", minutes: 10, summary: "Identify and act on stale items." },
      { id: "w3d5-l3", title: "Tomorrow priority list", kind: "Workflow", minutes: 10, summary: "Top items with owner / action / expected outcome." },
      { id: "w3d5-l4", title: "State Director summary", kind: "SOP", minutes: 10, summary: "Wins, risks, blockers, decisions needed, tomorrow priorities." },
    ],
    checklist: [
      "Completed queue cleanup",
      "No assigned item left without next action",
      "Created tomorrow priority list",
      "Drafted State Director summary",
    ],
    shadowing: ["Watch mentor complete end-of-day state cleanup."],
    livePractice: ["Clean up 8–10 assigned / simulated state items with mentor review."],
    resources: [R.l2Health, R.l2Esc, R.sdUpdate],
    knowledgeCheck: {
      q: "Should stale state items remain untouched, and should the State Director know major blockers and decisions needed?",
      a: "No to stale items; yes — always surface blockers and decisions.",
    },
    reflectionPrompt: "What makes state operations feel controlled instead of reactive?",
    signoffRequired: "Week 3 manager / mentor signoff required before moving to Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: AssistantStateDirectorDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled State Support Queue Ownership — Part 1",
    description:
      "Own a small set of real Assistant State Director tasks with mentor review. Prioritize family escalations, follow-ups, open cases, and State Director requests.",
    objectives: [
      "Run the morning state queue review",
      "Prioritize state work correctly",
      "Update current trackers / notes accurately",
      "End the day with no assigned item lacking next action",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning state queue review", kind: "Workflow", minutes: 12, summary: "Start each day by triaging the queue." },
      { id: "w4d1-l2", title: "Prioritizing state work", kind: "SOP", minutes: 10, summary: "Family escalations, lead/candidate follow-up, open cases, staffing/recruiting needs, auth/scheduling blockers, VA tasks, growth blockers, SD requests." },
      { id: "w4d1-l3", title: "Updating current trackers / notes", kind: "SOP", minutes: 10, summary: "Consistent updates with owner / action / follow-up." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "Workflow", minutes: 10, summary: "Nothing left without a next action." },
    ],
    checklist: [
      "Completed assigned queue",
      "Updated current systems accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned Assistant State Director tasks with mentor review."],
    resources: [R.l1Asd, R.l2Health, R.l2Esc, R.l2AsdSupport],
    knowledgeCheck: {
      q: "How should a controlled ownership day end?",
      a: "With every assigned item carrying owner, status, next action, and follow-up date.",
    },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled State Support Queue Ownership — Part 2",
    description:
      "Repeat controlled ownership with more independence. Mentor checks at midpoint and end of day unless asked.",
    objectives: [
      "Maintain follow-up discipline",
      "Maintain department boundary discipline",
      "Escalate blockers correctly",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "Workflow", minutes: 12, summary: "Honor every follow-up date." },
      { id: "w4d2-l2", title: "Department boundary discipline", kind: "SOP", minutes: 10, summary: "Support without silently owning." },
      { id: "w4d2-l3", title: "VA task oversight", kind: "Workflow", minutes: 10, summary: "Confirm VA work quality and coach as needed." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Escalate urgent items with structure." },
    ],
    checklist: [
      "Completed queue work",
      "Escalated blockers correctly",
      "No stale / unowned assigned item",
    ],
    shadowing: ["Minimal — learner performs work while mentor reviews."],
    livePractice: ["Own 10–15 assigned Assistant State Director tasks."],
    resources: [R.l2Va, R.l2Growth, R.l2Esc],
    knowledgeCheck: {
      q: "Should the Assistant State Director quietly absorb department work when items stall?",
      a: "No — route to the correct owner with a clear handoff and follow-up.",
    },
    reflectionPrompt: "What did you escalate and why?",
  }),
  day(4, 3, 18, {
    title: "Assistant State Director Communication Quality Day",
    description:
      "Focus on clear, calm, action-oriented communication with the State Director, departments, VAs, families, staff, and leadership.",
    objectives: [
      "Write clear state notes with issue / context / owner / impact / next action / follow-up",
      "Write warm, professional family / staff communication within role boundaries",
      "Write specific, actionable department handoffs",
      "Write State Director updates that separate facts, risks, blockers, decisions",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Clear state notes", kind: "SOP", minutes: 10, summary: "Structure and specificity." },
      { id: "w4d3-l2", title: "Family / staff communication tone", kind: "SOP", minutes: 10, summary: "Warm, professional, boundaried." },
      { id: "w4d3-l3", title: "Department handoff quality", kind: "Workflow", minutes: 12, summary: "Handoffs that departments can act on immediately." },
      { id: "w4d3-l4", title: "State Director update quality", kind: "SOP", minutes: 10, summary: "Facts, risks, blockers, decisions needed." },
    ],
    checklist: [
      "Drafted 5 clear notes / handoffs",
      "Mentor approved tone and specificity",
      "Boundary discipline handled correctly",
    ],
    shadowing: ["Mentor reviews written state notes, messages, and handoffs."],
    livePractice: ["Draft 5 state notes / messages / handoffs for mentor review."],
    resources: [R.l2Esc, R.l2Health, R.commTemplates, R.sdUpdate],
    knowledgeCheck: {
      q: "What kind of Assistant State Director communication makes everyone calmer and more effective?",
      a: "Clear, calm, specific, and action-oriented — with owner and next step.",
    },
    reflectionPrompt: "Which of your updates today was strongest, and why?",
  }),
  day(4, 4, 19, {
    title: "End-to-End Assistant State Director Simulation",
    description:
      "Complete a full Assistant State Director simulation from state health review through intake / recruiting support, department handoff, VA task oversight, escalation, and State Director summary.",
    objectives: [
      "Complete a full state health review",
      "Categorize issues, identify owners, and update current systems",
      "Complete department handoff, VA task review, escalation note, and State Director summary",
    ],
    lessons: [
      { id: "w4d4-l1", title: "State health review simulation", kind: "Live Practice", minutes: 15, summary: "Full state health scan." },
      { id: "w4d4-l2", title: "Intake / recruiting support simulation", kind: "Live Practice", minutes: 10, summary: "Route and follow up cleanly." },
      { id: "w4d4-l3", title: "Client pipeline / open case simulation", kind: "Live Practice", minutes: 10, summary: "Identify blockers and route." },
      { id: "w4d4-l4", title: "VA task oversight + escalation + SD summary", kind: "Workflow", minutes: 15, summary: "Review VA work, escalate cleanly, deliver a State Director summary." },
    ],
    checklist: [
      "Completed full simulation",
      "Passed mentor review",
      "Completed real task set",
    ],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1Asd, R.l1Sd, R.l1Va, R.l2Health, R.l2Esc, R.l2Va, R.deptMap],
    knowledgeCheck: {
      q: "What are the four things every state item must carry after the simulation?",
      a: "Owner, status, next action, follow-up date.",
    },
    reflectionPrompt: "What part of the full Assistant State Director process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description:
      "Complete final review; manager determines readiness for ongoing Assistant State Director ownership and sets a 30-day plan.",
    objectives: [
      "Complete final knowledge review",
      "Have a readiness conversation with manager",
      "Create a 30-day growth plan",
    ],
    lessons: [
      { id: "w4d5-l1", title: "Final knowledge review", kind: "Quiz", minutes: 20, summary: "10–15 questions covering state health, current systems, owner/status/next action/follow-up, State Director vs Assistant State Director vs VA, department boundaries, intake support, recruiting support, state growth, client pipeline / open case follow-up, VA task oversight, state escalation management, state-specific resources, end-of-day cleanup, communication quality, and the scaling model." },
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
    livePractice: ["Learner runs a short state support queue review while manager observes."],
    resources: [R.role306090, R.roleDeepDive, R.l1Asd, R.l2Health, R.l2Esc, R.l2Va],
    knowledgeCheck: {
      q: "Final: name any 3 of — state health, current systems, owner/status/next action/follow-up, State Director vs Assistant State Director vs VA, department boundaries, intake support, recruiting support, state growth, client pipeline / open case follow-up, VA task oversight, state escalation management, state-specific resources, end-of-day cleanup, communication quality, scaling model.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about Assistant State Director work that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into controlled ownership with a 30-day plan.",
  }),
];

export const ASSISTANT_STATE_DIRECTOR_DAYS: AssistantStateDirectorDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getAssistantStateDirectorDay(sourceModuleId: string): AssistantStateDirectorDayModule | undefined {
  return ASSISTANT_STATE_DIRECTOR_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalAssistantStateDirectorMinutes(): number {
  return ASSISTANT_STATE_DIRECTOR_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}