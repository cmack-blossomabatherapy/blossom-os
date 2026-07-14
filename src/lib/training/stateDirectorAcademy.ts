/**
 * State Director Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new State Director on today's Blossom process using current tools
 * (Monday / current trackers, CentralReach visibility, Outlook / Teams, phone,
 * state notes) with clear ownership of state health, growth, hours serviced,
 * local relationships, and escalation accountability — while keeping
 * department boundaries (Intake, Recruiting, Authorizations, Scheduling,
 * Staffing, QA, HR, Credentialing, Billing/RCM, Clinical) intact.
 *
 * Mirrors `assistantStateDirectorAcademy.ts` so it plugs into the same academy
 * adapter without touching other role/department curricula.
 */

export type SdLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface SdLesson {
  id: string;
  title: string;
  summary: string;
  kind: SdLessonKind;
  minutes: number;
}

export interface SdResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface StateDirectorDayModule {
  /** Source module id — becomes `state-director::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: SdLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: SdResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface StateDirectorWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const STATE_DIRECTOR_WEEKS: StateDirectorWeek[] = [
  { weekNumber: 1, title: "Week 1 · Foundations, Welcome, State Health, Current Systems, and Role Boundaries",
    goal: "Understand Blossom, the State Director role, state health, hours serviced, current systems, department boundaries, and how to lead state execution without becoming every department's operator." },
  { weekNumber: 2, title: "Week 2 · Growth, Local Relationships, Intake / Recruiting Visibility, Staffing Capacity, and State Support Structure",
    goal: "Drive state growth while understanding current intake / recruiting / staffing support realities and the state scaling model." },
  { weekNumber: 3, title: "Week 3 · Assistant / VA Leadership, Escalation Management, State-Specific Knowledge, Cross-Department Risk, and Weekly Rhythm",
    goal: "Lead the state operating layer: assistant / VA structure, escalation discipline, state-specific knowledge, and weekly rhythm." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Leadership Communication, Simulation, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real State Director work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1Sd: { label: "L1 State Director Role SOP", href: "/resource-library", pending: true },
  l1Asd: { label: "L1 Assistant State Director Role SOP", href: "/resource-library", pending: true },
  l1Va: { label: "L1 State VA Role SOP", href: "/resource-library", pending: true },
  l1Rsd: { label: "L1 Regional State Director Role SOP", href: "/resource-library", pending: true },
  binder: { label: "State Operations Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "State Director Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "State Director Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l2Health: { label: "L2 State Health Review Process SOP", href: "/resource-library", pending: true },
  l2Growth: { label: "L2 State Growth Coordination Process SOP", href: "/resource-library", pending: true },
  l2Esc: { label: "L2 State Escalation Management Process SOP", href: "/resource-library", pending: true },
  l2Va: { label: "L2 State VA Task Oversight Process SOP", href: "/resource-library", pending: true },
  l2Recruit: { label: "L2 State Recruiting Need Review Process SOP", href: "/resource-library", pending: true },
  l2OpenHours: { label: "L2 Open Hours and Coverage Review Process SOP", href: "/resource-library", pending: true },
  l2StaffEsc: { label: "L2 Staffing Escalation to Recruiting Process SOP", href: "/resource-library", pending: true },
  l2AsdSupport: { label: "L2 Assistant State Director Intake and Recruiting Support Process SOP", href: "/resource-library", pending: true },
  l1Intake: { label: "L1 Intake Lead / Admissions Role SOP", href: "/resource-library", pending: true },
  l2Intake: { label: "L2 New Lead Intake Process SOP", href: "/resource-library", pending: true },
  l1Recruit: { label: "L1 Recruiting Lead / Coordinator Role SOP", href: "/resource-library", pending: true },
  l1Sched: { label: "L1 Scheduling Coordinator Role SOP", href: "/resource-library", pending: true },
  l1Staff: { label: "L1 Staffing Coordinator Role SOP", href: "/resource-library", pending: true },
  l1Auth: { label: "L1 Authorizations / Utilization Manager Role SOP", href: "/resource-library", pending: true },
  l1Clin: { label: "L1 Clinical Services / Case Manager Role SOP", href: "/resource-library", pending: true },
  l1Qa: { label: "L1 QA Director / QA Reviewer Role SOP", href: "/resource-library", pending: true },
  l1Cred: { label: "L1 Credentialing Specialist Role SOP", href: "/resource-library", pending: true },
  l1Rcm: { label: "L1 Director of RCM Role SOP", href: "/resource-library", pending: true },
  l1Hr: { label: "L1 HR / People Operations Role SOP", href: "/resource-library", pending: true },
  stateOverview: { label: "Assigned State Overview SOP", href: "/resource-library", pending: true },
  stateContacts: { label: "Assigned State Contacts SOP", href: "/resource-library", pending: true },
  stateIns: { label: "Assigned State Insurance SOP", href: "/resource-library", pending: true },
  stateReq: { label: "Assigned State Local Requirements SOP", href: "/resource-library", pending: true },
  stateSched: { label: "Assigned State Scheduling / Forms / Local Vendors SOPs", href: "/resource-library", pending: true },
  trackerGuide: { label: "Current State Tracker Guide", href: "/resource-library", pending: true },
  crGuide: { label: "CentralReach Visibility Guide", href: "/resource-library", pending: true },
  healthTemplate: { label: "State Health Review Template", href: "/resource-library", pending: true },
  sdUpdate: { label: "State Director Update Template", href: "/resource-library", pending: true },
  scorecard: { label: "State Scorecard / KPI Template", href: "/resource-library", pending: true },
  hoursDash: { label: "Hours Serviced Report / Dashboard Reference", href: "/resource-library", pending: true },
  deptMap: { label: "Department Ownership Map", href: "/resource-library", pending: true },
  escTemplate: { label: "Escalation Template", href: "/resource-library", pending: true },
  growthChecklist: { label: "State Growth Blocker Checklist", href: "/resource-library", pending: true },
  referralTracker: { label: "Referral / Local Relationship Tracker", href: "/resource-library", pending: true },
  vaCoach: { label: "Assistant / VA Coaching Checklist", href: "/resource-library", pending: true },
  commTemplates: { label: "Current Communication Templates", href: "/resource-library", pending: true },
  bdHandoff: { label: "Marketing / BD Handoff Guide", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<StateDirectorDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): StateDirectorDayModule {
  return {
    id: `sd-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: StateDirectorDayModule[] = [
  day(1, 1, 1, {
    title: "State Director Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what the State Director does and why it matters. The State Director owns the health and growth of the state — keeping it moving, knowing where it is winning or stuck, driving growth, escalating correctly, building local relationships, and making sure the state does not rely on memory or chaos.",
    objectives: [
      "Explain what the State Director owns today",
      "Explain what the State Director does not own",
      "Explain why hours serviced is the ultimate state operating metric",
      "Explain the owner / status / next action / follow-up date rule",
    ],
    lessons: [
      { id: "w1d1-l1", title: "What the State Director owns today", kind: "Overview", minutes: 10, summary: "State health, state growth, hours serviced, local relationships, escalation accountability, state performance, staff/client state visibility, and cross-department accountability." },
      { id: "w1d1-l2", title: "What the State Director does not own", kind: "Overview", minutes: 8, summary: "Not the permanent operator of Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, HR, Credentialing, Billing/RCM, Finance, or Clinical execution." },
      { id: "w1d1-l3", title: "State health and hours serviced", kind: "SOP", minutes: 10, summary: "Hours serviced is the ultimate state operating metric. State health inputs feed it: leads, conversion, staffing capacity, open cases, auth readiness, family experience." },
      { id: "w1d1-l4", title: "Leadership mindset: own outcomes, not every task", kind: "Workflow", minutes: 10, summary: "Every state issue must have owner, status, next action, and follow-up date. Drive accountability without becoming the bottleneck." },
    ],
    checklist: [
      "Can explain what the State Director owns",
      "Can explain what the State Director does not own",
      "Can explain why hours serviced is the ultimate state operating metric",
      "Can explain why state issues require owner / status / next action / follow-up date",
    ],
    shadowing: ["Sit with an experienced State Director, Regional State Director mentor, Executive/Operations leader, or assigned manager for 30–60 minutes and watch how they review state priorities."],
    livePractice: ["No live state ownership yet — observe only."],
    resources: [R.l1Sd, R.binder, R.roleDeepDive, R.l1Asd, R.l1Rsd, R.l2Health],
    knowledgeCheck: {
      q: "What four things should every state issue have before you leave it, and does the State Director permanently own every department's work?",
      a: "Owner, status, next action, follow-up date. No — the State Director does not permanently own every department.",
    },
    reflectionPrompt: "In your own words, what does it mean to own state health without doing every department's job?",
  }),
  day(1, 2, 2, {
    title: "Current State Director Systems Tour — Monday, CentralReach Visibility, Outlook, Teams, Phone, and State Notes",
    description:
      "Learn today's systems State Directors touch: Monday / current trackers for state work, CentralReach for clinical / schedule / client visibility per permission, Outlook / Teams / phone for communication, and where state leadership notes and department handoffs live today.",
    objectives: [
      "Identify the main current State Director tools",
      "Explain what CentralReach is used for (visibility, not a state ops CRM)",
      "Locate key state issue fields in sample records",
      "Explain where follow-up should be documented today",
    ],
    lessons: [
      { id: "w1d2-l1", title: "Monday / current tracker basics", kind: "SOP", minutes: 12, summary: "State, lead/client/candidate, family, staff/RBT/BCBA, department owner, issue type, status, urgency, owner, next action, follow-up date, state impact." },
      { id: "w1d2-l2", title: "CentralReach visibility basics", kind: "Overview", minutes: 10, summary: "Read-only visibility into clinical/schedule/client info by permission. Not the state operating layer." },
      { id: "w1d2-l3", title: "Outlook and Teams communication basics", kind: "SOP", minutes: 10, summary: "Documented, professional leadership communication with departments, staff, families, referral partners." },
      { id: "w1d2-l4", title: "Phone / family / staff communication basics", kind: "SOP", minutes: 8, summary: "Document contact attempts and outcomes. Never leave leadership follow-up in memory." },
      { id: "w1d2-l5", title: "State notes and leadership summaries", kind: "SOP", minutes: 10, summary: "Where state leadership notes and department handoffs live today." },
    ],
    checklist: [
      "Identified main current State Director tools",
      "Explained what CentralReach is used for in state visibility",
      "Identified key state issue fields",
      "Explained where follow-up should be documented",
    ],
    shadowing: ["Watch mentor review one state issue across current tracker, CentralReach visibility if needed, and communication notes."],
    livePractice: ["In training/sandbox or with mentor supervision, locate 3 sample state issues and point out owner / status / next action / follow-up date."],
    resources: [R.l2Health, R.l2Esc, R.trackerGuide, R.crGuide],
    knowledgeCheck: {
      q: "Are Monday / current trackers part of today's state reality, and is CentralReach the state operations CRM?",
      a: "Yes — Monday / current trackers are today's reality. No — CentralReach is clinical/scheduling visibility, not the state ops CRM.",
    },
    reflectionPrompt: "Which current state system or communication channel creates the most risk if it is not updated?",
  }),
  day(1, 3, 3, {
    title: "State Health Review",
    description:
      "Learn what state health means and how to review it daily and weekly. Prepare structured summaries that make wins, risks, blockers, and decisions visible.",
    objectives: [
      "Explain state health categories",
      "Distinguish department-owned vs state-leadership-owned issues",
      "Draft a state health summary of wins / risks / blockers / decisions",
    ],
    lessons: [
      { id: "w1d3-l1", title: "State health definition", kind: "Overview", minutes: 8, summary: "Leads, conversion, intake status, recruiting / staffing needs, open cases, hours serviced, auth blockers, schedule / staffing issues, clinical / QA concerns, family / staff issues, local marketing / BD activity, escalations." },
      { id: "w1d3-l2", title: "State health inputs", kind: "SOP", minutes: 10, summary: "Where each input lives today and who owns it." },
      { id: "w1d3-l3", title: "Hours serviced and growth", kind: "Workflow", minutes: 12, summary: "Read hours serviced trends, connect them to staffing capacity, open cases, and family experience." },
      { id: "w1d3-l4", title: "Risk and blocker review", kind: "SOP", minutes: 10, summary: "Categorize department-owned vs state-owned vs leadership-owned vs escalation." },
    ],
    checklist: [
      "Can explain state health",
      "Reviewed 8 state health items",
      "Categorized department owner vs state leadership follow-up",
      "Drafted state health summary points",
    ],
    shadowing: ["Watch mentor prepare a state health summary or dashboard review."],
    livePractice: ["Under mentor supervision, review 8 state health items and categorize owner / next action."],
    resources: [R.l2Health, R.l2Growth, R.l1Sd, R.healthTemplate, R.hoursDash],
    knowledgeCheck: {
      q: "Should every issue automatically be solved by the State Director personally, and should the State Director know where the state is stuck?",
      a: "No — not every issue is personally solved. Yes — State Director must know where the state is stuck.",
    },
    reflectionPrompt: "What are the earliest signs that a state is becoming unhealthy?",
  }),
  day(1, 4, 4, {
    title: "Department Ownership and Accountability",
    description:
      "Hold departments accountable without taking ownership away from them. Write clean handoffs and follow up until work moves — escalate only when it's stuck.",
    objectives: [
      "Map common state issues to the correct department owner",
      "Write clean handoffs with issue / state / owner / action / urgency / follow-up",
      "Escalate stuck work through the correct department leader or executive path",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Department ownership map", kind: "Overview", minutes: 10, summary: "Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, Clinical, Case Management, HR, Credentialing, Billing/RCM, Marketing/BD, State Ops, leadership." },
      { id: "w1d4-l2", title: "Accountability without chaos", kind: "SOP", minutes: 10, summary: "Firm follow-up, respectful tone, no bypass of department owners." },
      { id: "w1d4-l3", title: "Clean handoff standards", kind: "SOP", minutes: 12, summary: "Issue, state, client/candidate/family/staff, department owner, requested action, urgency, due/follow-up date, context." },
      { id: "w1d4-l4", title: "Escalation when work is stuck", kind: "Workflow", minutes: 10, summary: "Escalate through the correct department leader or executive path — never blast every issue." },
    ],
    checklist: [
      "Drafted 5 clear handoffs",
      "Identified correct department owner",
      "Included urgency / context / follow-up date",
    ],
    shadowing: ["Watch mentor hold departments accountable through clear follow-up."],
    livePractice: ["Draft 5 department accountability handoffs for mentor review."],
    resources: [R.l2Esc, R.l2Health, R.deptMap],
    knowledgeCheck: {
      q: "Should handoffs include owner and requested action, and should departments lose ownership when a State Director follows up?",
      a: "Yes — handoffs include owner and requested action. No — departments keep ownership.",
    },
    reflectionPrompt: "How can a State Director create accountability without becoming the bottleneck?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1 and confirm understanding of State Director role boundaries, current systems, state health, hours serviced, and department accountability.",
    objectives: [
      "Review 3 sample state items with mentor",
      "Explain current status, next action, owner, state impact, department boundary, and escalation need",
      "Identify anything still unclear",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering state health, hours serviced, current systems, department ownership, owner/status/next action, and escalation." },
      { id: "w1d5-l2", title: "State Director boundary check", kind: "Overview", minutes: 8, summary: "State Director vs Assistant State Director vs VA vs departments." },
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
    resources: [R.l1Sd, R.l2Health, R.binder, R.roleDeepDive],
    knowledgeCheck: {
      q: "What must always be true before you close out a state item for the day?",
      a: "Owner, status, next action, and follow-up date are set; departments retain ownership; escalate only what needs leadership decisions.",
    },
    reflectionPrompt: "What part of State Director work still feels confusing?",
    signoffRequired: "Week 1 manager / mentor signoff required before moving to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: StateDirectorDayModule[] = [
  day(2, 1, 6, {
    title: "State Growth Coordination",
    description:
      "Drive state growth through local relationships, pipeline visibility, recruiting / staffing capacity, and cross-department accountability. Growth is not just leads — it is the whole system.",
    objectives: [
      "Identify state growth inputs",
      "Spot growth blockers and assign owner / next action",
      "Prepare a concise growth summary",
    ],
    lessons: [
      { id: "w2d1-l1", title: "State growth inputs", kind: "Overview", minutes: 10, summary: "Leads / referrals, marketing / BD activity, intake conversion, recruiting pipeline, staffing capacity, open cases, auth readiness, family experience, hours serviced." },
      { id: "w2d1-l2", title: "Lead flow and conversion visibility", kind: "SOP", minutes: 10, summary: "Read lead sources, conversion, stalls — without becoming Intake." },
      { id: "w2d1-l3", title: "Staffing capacity as growth constraint", kind: "Workflow", minutes: 12, summary: "When capacity limits growth, escalate to Recruiting / Staffing with specific asks." },
      { id: "w2d1-l4", title: "Growth blocker tracking", kind: "SOP", minutes: 10, summary: "Assign owner and next action to every growth blocker; nothing sits." },
    ],
    checklist: [
      "Can explain state growth inputs",
      "Reviewed 8 growth items",
      "Drafted growth blocker summary",
    ],
    shadowing: ["Watch mentor review growth and blockers."],
    livePractice: ["Review 8 state growth items and identify blocker / owner / next action."],
    resources: [R.l2Growth, R.l2Health, R.growthChecklist, R.bdHandoff],
    knowledgeCheck: {
      q: "Can staffing capacity block state growth, and should growth blockers have owners?",
      a: "Yes to both.",
    },
    reflectionPrompt: "What blocks state growth besides lead volume?",
  }),
  day(2, 2, 7, {
    title: "Local Relationships, Referral Sources, and BD / Boots-on-the-Ground Support",
    description:
      "Local relationships and state BD activity power sustainable growth. Learn how to track them and coordinate with Marketing / BD.",
    objectives: [
      "Identify key local relationship categories",
      "Track outreach, next follow-up, and owner",
      "Coordinate with Marketing / BD where applicable",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Local relationship purpose", kind: "Overview", minutes: 8, summary: "Referral partners, pediatricians, schools, community organizations, clinics, local providers." },
      { id: "w2d2-l2", title: "Referral partner awareness", kind: "SOP", minutes: 10, summary: "State contacts, local vendors / resources, and state-specific relationship notes." },
      { id: "w2d2-l3", title: "BD / boots-on-the-ground support", kind: "Workflow", minutes: 12, summary: "Coordinate with Marketing / BD when local support exists or is planned." },
      { id: "w2d2-l4", title: "Follow-up and relationship notes", kind: "SOP", minutes: 10, summary: "Every relationship touch has owner, outcome, next action, follow-up date." },
    ],
    checklist: [
      "Reviewed state relationship resources",
      "Identified local relationship next actions",
      "Drafted follow-up notes",
    ],
    shadowing: ["Watch mentor review referral / local relationship activity."],
    livePractice: ["Review 5 local relationship / referral scenarios and recommend next action."],
    resources: [R.stateContacts, R.stateOverview, R.l2Growth, R.bdHandoff, R.referralTracker],
    knowledgeCheck: {
      q: "Should referral relationship follow-up be tracked, and is BD support part of state growth where applicable?",
      a: "Yes to both.",
    },
    reflectionPrompt: "How should local relationship work connect back to actual lead flow and hours serviced?",
  }),
  day(2, 3, 8, {
    title: "Intake and Admissions Visibility",
    description:
      "Maintain intake visibility without replacing Intake. In growing states, the State Director / Assistant State Director may temporarily support intake execution — that is a current support pattern, not a permanent ownership model.",
    objectives: [
      "Read state lead / intake pipeline",
      "Identify stuck leads and confirm owner",
      "Escalate when lead flow / conversion is a state growth risk",
    ],
    lessons: [
      { id: "w2d3-l1", title: "Intake visibility for state health", kind: "Overview", minutes: 8, summary: "State leads, intake status, family follow-up, VOB readiness, stale follow-ups." },
      { id: "w2d3-l2", title: "Lead conversion and family experience", kind: "SOP", minutes: 10, summary: "Track conversion and family experience without owning every step." },
      { id: "w2d3-l3", title: "Intake support in growing states", kind: "Workflow", minutes: 10, summary: "Current scaling reality — support pattern only, not permanent ownership." },
      { id: "w2d3-l4", title: "Intake department boundary", kind: "SOP", minutes: 10, summary: "Intake exists today. State support is not a replacement for Intake ownership." },
    ],
    checklist: [
      "Reviewed 5 lead / intake scenarios",
      "Identified correct owner",
      "Drafted state visibility / escalation note",
    ],
    shadowing: ["Watch mentor review state intake / lead pipeline."],
    livePractice: ["Review 5 intake / lead scenarios and identify owner / next action."],
    resources: [R.l1Intake, R.l2Intake, R.l2AsdSupport, R.l2Health],
    knowledgeCheck: {
      q: "Should the State Director know intake bottlenecks, and should the State Director permanently become Intake?",
      a: "Yes — know bottlenecks. No — do not permanently become Intake.",
    },
    reflectionPrompt: "How can a State Director care deeply about intake without taking it over forever?",
  }),
  day(2, 4, 9, {
    title: "Recruiting / Staffing Capacity Visibility",
    description:
      "Drive staffing capacity and recruiting urgency without running the whole Recruiting or Staffing department. Translate state need into specific, actionable requests.",
    objectives: [
      "Review open cases, open hours, and hard-to-staff cases",
      "Translate state need into specific recruiting / staffing asks",
      "Follow up until capacity blockers move",
    ],
    lessons: [
      { id: "w2d4-l1", title: "State staffing need review", kind: "SOP", minutes: 10, summary: "Open cases, open hours, hard-to-staff cases, staff availability, upcoming needs." },
      { id: "w2d4-l2", title: "Recruiting pipeline visibility", kind: "Overview", minutes: 10, summary: "Read recruiting pipeline as it affects state capacity — without taking over the funnel." },
      { id: "w2d4-l3", title: "Open cases and open hours", kind: "Workflow", minutes: 10, summary: "Track state open hours / cases weekly with clear owners." },
      { id: "w2d4-l4", title: "Escalation to Recruiting / Staffing", kind: "SOP", minutes: 12, summary: "Specific asks: role, location, schedule, hours, urgency, start target, fit considerations." },
    ],
    checklist: [
      "Reviewed 6 recruiting / staffing scenarios",
      "Drafted specific recruiting / staffing needs",
      "Identified owner and follow-up date",
    ],
    shadowing: ["Watch mentor review recruiting / staffing capacity for a state."],
    livePractice: ["Review 6 recruiting / staffing scenarios and draft next action."],
    resources: [R.l2Recruit, R.l2StaffEsc, R.l2OpenHours, R.l1Recruit, R.l1Staff],
    knowledgeCheck: {
      q: "Should recruiting needs be vague, and should State Directors track staffing capacity as state health?",
      a: "No — never vague. Yes — capacity is state health.",
    },
    reflectionPrompt: "What does Recruiting need from a State Director to actually find the right people?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description:
      "Complete a supervised mini-shift using current growth, local relationship, intake visibility, and recruiting / staffing visibility tasks.",
    objectives: [
      "Complete assigned state visibility tasks with mentor review",
      "Hold boundary discipline across departments",
      "Leave no growth item without next step",
    ],
    lessons: [
      { id: "w2d5-l1", title: "Growth blocker review", kind: "Workflow", minutes: 15, summary: "Assigned growth-blocker set with mentor review." },
      { id: "w2d5-l2", title: "Local relationship review", kind: "Workflow", minutes: 10, summary: "Assigned relationship touchpoints." },
      { id: "w2d5-l3", title: "Intake visibility review", kind: "Workflow", minutes: 10, summary: "Assigned intake / lead visibility set." },
      { id: "w2d5-l4", title: "Recruiting / staffing visibility review", kind: "Workflow", minutes: 15, summary: "Assigned capacity set with mentor review." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No state growth item left without next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list under mentor supervision."],
    resources: [R.l2Growth, R.l2Health, R.l2Recruit, R.growthChecklist],
    knowledgeCheck: {
      q: "After a Week 2 supervised shift, what proves your work is complete?",
      a: "Every assigned item has owner / status / next action / follow-up date, and boundaries were respected.",
    },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 manager check-in required before moving to Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: StateDirectorDayModule[] = [
  day(3, 1, 11, {
    title: "Leading the Assistant State Director and VA Structure",
    description:
      "Lead the state support structure. Current scaling model: State Director → Assistant State Director → VA support as volume grows → additional VA support → state-specific BD where applicable. Regional State Director may mentor / coach as the role matures.",
    objectives: [
      "Clarify what the Assistant State Director owns today",
      "Clarify what VA tasks are assigned today",
      "Coach quality, deadlines, and accountability",
    ],
    lessons: [
      { id: "w3d1-l1", title: "Assistant State Director leadership", kind: "SOP", minutes: 10, summary: "What the Assistant State Director owns and where they need coaching." },
      { id: "w3d1-l2", title: "VA task oversight model", kind: "Overview", minutes: 10, summary: "How VA tasks are assigned, reviewed, and quality-checked." },
      { id: "w3d1-l3", title: "Scaling state support", kind: "Workflow", minutes: 12, summary: "Grow support as volume grows — do not permanently absorb department work." },
      { id: "w3d1-l4", title: "Coaching and accountability", kind: "SOP", minutes: 10, summary: "Repeated misses escalate. Unclear ownership gets clarified in writing." },
    ],
    checklist: [
      "Reviewed 5 Assistant / VA scenarios",
      "Identified coaching / accountability action",
      "Drafted support-structure note",
    ],
    shadowing: ["Watch mentor review Assistant / VA work and coaching notes."],
    livePractice: ["Review 5 Assistant / VA support scenarios and choose State Director next action."],
    resources: [R.l1Asd, R.l1Va, R.l2Va, R.l1Rsd, R.vaCoach],
    knowledgeCheck: {
      q: "Should Assistant / VA tasks have clear owners and due dates, and should state support scale as volume grows?",
      a: "Yes to both.",
    },
    reflectionPrompt: "What should a State Director inspect regularly from Assistant / VA support?",
  }),
  day(3, 2, 12, {
    title: "State Escalation Management",
    description:
      "Manage state escalations clearly and calmly. Escalations move decisions, not stress. Every escalation names issue, impact, owner, requested decision, and follow-up.",
    objectives: [
      "Identify escalation type, urgency, and owner",
      "Write structured escalation notes",
      "Close the loop with departments and leadership",
    ],
    lessons: [
      { id: "w3d2-l1", title: "Escalation types", kind: "Overview", minutes: 8, summary: "Family, staff / RBT, BCBA, clinical, scheduling, staffing, auth, intake, recruiting, billing / RCM, local vendor, compliance, leadership." },
      { id: "w3d2-l2", title: "Urgency and impact", kind: "SOP", minutes: 10, summary: "Assess state impact and urgency before routing." },
      { id: "w3d2-l3", title: "Escalation notes", kind: "Workflow", minutes: 12, summary: "Issue, state impact, attempted actions, owner, requested decision, follow-up date." },
      { id: "w3d2-l4", title: "Closing the loop", kind: "SOP", minutes: 10, summary: "Confirm resolution back to departments and leadership; do not leave escalations hanging." },
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
      q: "Should escalations include issue, impact, owner, and requested next step, and should all escalations be sent to everyone without ownership?",
      a: "Yes — always structured. No — never blast without ownership.",
    },
    reflectionPrompt: "What makes an escalation a leadership issue instead of a normal department task?",
  }),
  day(3, 3, 13, {
    title: "Clinical, QA, Authorization, Scheduling, Staffing, and Billing Risk Awareness",
    description:
      "Spot risks across departments without becoming the executor. Clinical, QA, Auth, Scheduling, Staffing, Credentialing, and Billing / RCM issues can quietly damage state health.",
    objectives: [
      "Spot cross-department risks that affect state health",
      "Route risks to the correct owner",
      "Track follow-up until resolved or formally owned",
    ],
    lessons: [
      { id: "w3d3-l1", title: "Clinical / QA risk awareness", kind: "Overview", minutes: 10, summary: "Delayed reports, treatment plan QA, family service disruption." },
      { id: "w3d3-l2", title: "Authorization risk awareness", kind: "SOP", minutes: 10, summary: "Auth expiration, pending auth follow-up, denials." },
      { id: "w3d3-l3", title: "Scheduling / staffing risk awareness", kind: "SOP", minutes: 10, summary: "Coverage gaps, pairing issues, RBT / BCBA availability shifts." },
      { id: "w3d3-l4", title: "Billing / RCM / credentialing risk awareness", kind: "Workflow", minutes: 12, summary: "Credentialing lapses, billing errors, denials trend — escalate to the correct owner." },
    ],
    checklist: [
      "Reviewed 8 risk scenarios",
      "Identified owner and state impact",
      "Drafted escalation / follow-up notes",
    ],
    shadowing: ["Watch mentor review cross-department state risk."],
    livePractice: ["Review 8 cross-department risk scenarios and choose owner / next action."],
    resources: [R.l1Qa, R.l1Auth, R.l1Sched, R.l1Staff, R.l1Rcm, R.l1Cred, R.l2Esc],
    knowledgeCheck: {
      q: "Should State Directors understand cross-department risks, and should they personally execute all cross-department work?",
      a: "Yes — understand risks. No — do not personally execute department work.",
    },
    reflectionPrompt: "How can a State Director spot risk early without becoming the department operator?",
  }),
  day(3, 4, 14, {
    title: "State-Specific Knowledge — Contacts, Insurance, Scheduling, Local Requirements, Forms, Vendors",
    description:
      "State-specific knowledge affects state leadership every day. Do not assume all states work the same way — review your assigned state's folder / resources.",
    objectives: [
      "Review the active state folder / resources for the learner's state",
      "Identify key state-specific notes",
      "List gaps / questions for manager",
    ],
    lessons: [
      { id: "w3d4-l1", title: "State contacts", kind: "SOP", minutes: 8, summary: "Key state contacts, escalation paths, local leadership." },
      { id: "w3d4-l2", title: "State insurance / local requirements", kind: "SOP", minutes: 12, summary: "Payer nuances, state-specific documentation, coverage rules." },
      { id: "w3d4-l3", title: "State scheduling / forms", kind: "SOP", minutes: 10, summary: "Local scheduling patterns and required forms." },
      { id: "w3d4-l4", title: "Local vendors and local knowledge", kind: "Overview", minutes: 10, summary: "Local vendors, community resources, referral partners." },
    ],
    checklist: [
      "Reviewed assigned state folder / resources",
      "Identified key state-specific notes",
      "Listed gaps / questions for manager",
    ],
    shadowing: ["Watch mentor review state-specific resources."],
    livePractice: ["Complete state-specific resource review checklist for assigned state."],
    resources: [R.stateOverview, R.stateContacts, R.stateIns, R.stateReq, R.stateSched],
    knowledgeCheck: {
      q: "Should every state be treated as identical, and should unknown state-specific rules be confirmed?",
      a: "No — states differ. Yes — always confirm unknown rules.",
    },
    reflectionPrompt: "Which state-specific details could hurt state performance if leadership ignores them?",
  }),
  day(3, 5, 15, {
    title: "Weekly State Rhythm, Scorecard, and Leadership Summary",
    description:
      "Run a clean state leadership rhythm. Daily check, weekly review, scorecard mindset, and a leadership summary that names wins, numbers, blockers, and decisions needed.",
    objectives: [
      "Run daily state checks and weekly reviews",
      "Read scorecard / KPI signals even when tools are imperfect",
      "Prepare a leadership summary in today's process",
    ],
    lessons: [
      { id: "w3d5-l1", title: "Daily state check", kind: "SOP", minutes: 8, summary: "Priority items, escalations, staffing capacity, hours serviced trend." },
      { id: "w3d5-l2", title: "Weekly state review", kind: "Workflow", minutes: 12, summary: "Wins, numbers, hours serviced, growth blockers, staffing needs, clinical / auth / scheduling risks, family / staff issues, decisions needed." },
      { id: "w3d5-l3", title: "Scorecard / KPI awareness", kind: "Overview", minutes: 10, summary: "Simple scorecard mindset even when current tools are imperfect." },
      { id: "w3d5-l4", title: "Leadership summary", kind: "SOP", minutes: 10, summary: "Send / prepare a leadership summary according to today's process." },
    ],
    checklist: [
      "Drafted weekly state summary",
      "Identified state wins, risks, blockers, and decisions",
      "Included hours serviced / growth visibility",
    ],
    shadowing: ["Watch mentor prepare weekly state summary."],
    livePractice: ["Draft a weekly state summary from sample state data."],
    resources: [R.l2Health, R.l2Growth, R.sdUpdate, R.scorecard, R.hoursDash],
    knowledgeCheck: {
      q: "Should weekly state summaries include blockers and decisions needed, and should State Directors know state performance trends?",
      a: "Yes to both.",
    },
    reflectionPrompt: "What should leadership know every week about a state?",
    signoffRequired: "Week 3 manager check-in required before moving to Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: StateDirectorDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled State Director Queue Ownership — Part 1",
    description:
      "Own a small set of real State Director tasks with mentor review. Prioritize family escalations, growth blockers, hours-serviced risks, recruiting / staffing needs, and leadership decisions.",
    objectives: [
      "Prioritize state leadership work",
      "Complete assigned work end-to-end",
      "End day with no assigned item lacking next action / follow-up",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning state review", kind: "Workflow", minutes: 10, summary: "Review assigned state issues / tasks." },
      { id: "w4d1-l2", title: "Prioritizing state leadership work", kind: "SOP", minutes: 10, summary: "Family escalations, growth blockers, hours-serviced risks first." },
      { id: "w4d1-l3", title: "Department follow-up", kind: "Workflow", minutes: 12, summary: "Move stuck items with departments — do not take them over." },
      { id: "w4d1-l4", title: "End-of-day leadership summary", kind: "SOP", minutes: 10, summary: "Wrap the day with a leadership-ready summary of state status." },
    ],
    checklist: [
      "Completed assigned state leadership queue",
      "Updated current systems accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's state review."],
    livePractice: ["Own 8–12 assigned State Director tasks with mentor review."],
    resources: [R.l1Sd, R.l2Health, R.l2Esc, R.l2Growth],
    knowledgeCheck: {
      q: "What proves your controlled state queue is complete for the day?",
      a: "Every assigned item has owner / status / next action / follow-up date and leadership has an end-of-day summary.",
    },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled State Director Queue Ownership — Part 2",
    description:
      "Repeat controlled ownership with more independence. Mentor checks only at midpoint and end of day unless learner asks for help.",
    objectives: [
      "Own state leadership queue independently through most of the day",
      "Escalate correctly to the right owner",
      "Leave no stale / unowned assigned item",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "SOP", minutes: 10, summary: "Every touch has next step; nothing sits." },
      { id: "w4d2-l2", title: "Department accountability", kind: "Workflow", minutes: 12, summary: "Firm, respectful, structured follow-up." },
      { id: "w4d2-l3", title: "Assistant / VA leadership", kind: "SOP", minutes: 10, summary: "Coach and unblock support structure." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Escalate urgent family, staff, recruiting / staffing, pipeline, and growth blockers." },
    ],
    checklist: [
      "Completed queue work",
      "Escalated blockers correctly",
      "No stale / unowned assigned item",
    ],
    shadowing: ["Minimal; learner performs work while mentor reviews."],
    livePractice: ["Own 10–15 assigned State Director tasks."],
    resources: [R.l2Va, R.l2Growth, R.l2Esc],
    knowledgeCheck: {
      q: "When should the State Director escalate versus follow up quietly?",
      a: "Escalate when a decision is needed, urgency is high, or a department is stuck; otherwise follow up structurally.",
    },
    reflectionPrompt: "What did you escalate and why?",
  }),
  day(4, 3, 18, {
    title: "State Director Communication Quality Day",
    description:
      "Practice clear, calm, executive communication with departments, Assistant State Director / VAs, families, staff, referral partners, and leadership.",
    objectives: [
      "Write clear state notes with owner / impact / next action / follow-up date",
      "Write leadership updates that separate facts, risks, blockers, decisions, and next actions",
      "Keep tone firm and respectful across departments and families",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Clear state notes", kind: "SOP", minutes: 10, summary: "Issue, context, owner, state impact, next action, follow-up date." },
      { id: "w4d3-l2", title: "Leadership update quality", kind: "Workflow", minutes: 12, summary: "Facts, risks, blockers, decisions needed, next actions." },
      { id: "w4d3-l3", title: "Department accountability tone", kind: "SOP", minutes: 10, summary: "Firm and respectful; no passive-aggressive escalation." },
      { id: "w4d3-l4", title: "Family / staff / partner communication boundary", kind: "SOP", minutes: 10, summary: "Professional and within role boundaries." },
    ],
    checklist: [
      "Drafted 5 clear notes / updates",
      "Mentor approved tone and specificity",
      "Boundary discipline handled correctly",
    ],
    shadowing: ["Mentor reviews written state notes, messages, and summaries."],
    livePractice: ["Draft 5 state notes / messages / leadership updates for mentor review."],
    resources: [R.l2Esc, R.l2Health, R.commTemplates, R.sdUpdate],
    knowledgeCheck: {
      q: "What kind of State Director communication makes the state calmer and more accountable?",
      a: "Clear, structured, specific messages that name owner, impact, next action, and follow-up date.",
    },
    reflectionPrompt: "What kind of State Director communication makes the state calmer and more accountable?",
  }),
  day(4, 4, 19, {
    title: "End-to-End State Director Simulation",
    description:
      "Complete a full State Director simulation: state health review → growth blocker review → department accountability → Assistant / VA coaching → escalation → leadership summary.",
    objectives: [
      "Run a full state health cycle in one session",
      "Categorize issues and identify owners",
      "Deliver a leadership summary against a checklist",
    ],
    lessons: [
      { id: "w4d4-l1", title: "State health review simulation", kind: "Workflow", minutes: 15, summary: "Simulated state operations scenario provided by mentor." },
      { id: "w4d4-l2", title: "Growth / hours-serviced simulation", kind: "Workflow", minutes: 12, summary: "Growth blocker categorization and next actions." },
      { id: "w4d4-l3", title: "Department accountability + Assistant / VA simulation", kind: "Workflow", minutes: 15, summary: "Handoffs and coaching notes." },
      { id: "w4d4-l4", title: "Escalation + leadership summary", kind: "SOP", minutes: 15, summary: "Escalation note and final leadership summary." },
    ],
    checklist: [
      "Completed full simulation",
      "Passed mentor review",
      "Completed real task set",
    ],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1Sd, R.l1Asd, R.l1Va, R.l1Rsd, R.deptMap, R.l2Health, R.l2Growth, R.l2Esc],
    knowledgeCheck: {
      q: "What are the four things every state item must carry after the simulation?",
      a: "Owner, status, next action, follow-up date.",
    },
    reflectionPrompt: "What part of the full State Director process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description:
      "Complete final review; manager determines readiness for ongoing State Director ownership and sets a 30-day plan focused on state health, hours serviced, growth, assistant / VA structure, department accountability, and local relationship priorities.",
    objectives: [
      "Complete final knowledge review",
      "Have a readiness conversation with manager",
      "Create a 30-day growth plan",
    ],
    lessons: [
      { id: "w4d5-l1", title: "Final knowledge review", kind: "Quiz", minutes: 20, summary: "10–15 questions covering state health, hours serviced, current systems, owner/status/next action/follow-up, State Director vs Assistant State Director vs VA vs Regional State Director, department boundaries, growth coordination, local relationships / referral / BD support, intake visibility, recruiting / staffing capacity visibility, Assistant / VA leadership, state escalation management, state-specific resources, weekly rhythm and scorecard, and executive communication quality." },
      { id: "w4d5-l2", title: "Readiness conversation", kind: "Workflow", minutes: 15, summary: "What can be owned independently vs still reviewed." },
      { id: "w4d5-l3", title: "Strengths and coaching areas", kind: "Overview", minutes: 10, summary: "Name 2 strengths and 2 coaching areas." },
      { id: "w4d5-l4", title: "Next 30-day growth plan", kind: "Workflow", minutes: 15, summary: "Concrete targets for the first month of independent ownership." },
    ],
    checklist: [
      "Completed all modules",
      "Completed final quiz",
      "Manager signoff completed",
      "Next 30-day plan created",
    ],
    shadowing: ["End-of-journey manager review."],
    livePractice: ["Learner runs a short state health review while manager observes."],
    resources: [R.role306090, R.roleDeepDive, R.l1Sd, R.l2Health, R.l2Esc, R.l2Growth],
    knowledgeCheck: {
      q: "Final: name any 3 of — state health, hours serviced, current systems, owner/status/next action/follow-up, department boundaries, growth coordination, local relationships, intake visibility, recruiting / staffing visibility, Assistant / VA leadership, escalation, state-specific resources, weekly rhythm, communication quality, scaling model.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about State Director leadership that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into controlled ownership with a 30-day plan.",
  }),
];

export const STATE_DIRECTOR_DAYS: StateDirectorDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getStateDirectorDay(sourceModuleId: string): StateDirectorDayModule | undefined {
  return STATE_DIRECTOR_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalStateDirectorMinutes(): number {
  return STATE_DIRECTOR_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}