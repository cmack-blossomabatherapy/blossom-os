/**
 * Staffing Team Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new Staffing Coordinator on today's Blossom staffing process
 * using today's tools (Monday / current trackers, CentralReach-related
 * schedule/service data, Outlook, phone) and clean cross-department
 * handoffs to Scheduling, Recruiting, State Ops, and Clinical.
 *
 * Mirrors `schedulingAcademy.ts` so it plugs into the same academy adapter
 * without touching other role/department curricula.
 */

export type StaffLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface StaffLesson {
  id: string;
  title: string;
  summary: string;
  kind: StaffLessonKind;
  minutes: number;
}

export interface StaffResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface StaffingDayModule {
  /** Source module id — becomes `staffing::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: StaffLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: StaffResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface StaffingWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const STAFFING_WEEKS: StaffingWeek[] = [
  { weekNumber: 1, title: "Week 1 · Staffing Foundations, Welcome, Current Systems, and Role Boundaries",
    goal: "Understand Blossom, the Staffing Team's purpose, today's systems, open case discipline, RBT/BT availability, and the difference between Staffing, Scheduling, Recruiting, and State Ops." },
  { weekNumber: 2, title: "Week 2 · Case Matching, Pairing, Coverage, Open Hours, and Family/Staff Communication",
    goal: "Move from observation into supervised execution of common staffing tasks." },
  { weekNumber: 3, title: "Week 3 · Recruiting Escalations, State Ops Handoffs, Hours Serviced, Hard Cases, and Cleanup",
    goal: "Own more work with review, learn judgment points, and practice escalation to Recruiting, Scheduling, State Ops, and management." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Quality, Communication, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real staffing work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1StaffingSop: { label: "L1 Staffing Coordinator Role SOP", href: "/resource-library", pending: true },
  l1SchedSop: { label: "L1 Scheduling Coordinator Role SOP", href: "/resource-library", pending: true },
  binder: { label: "Staffing Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "Staffing Coordinator Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "Staffing Coordinator Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l2CaseMatch: { label: "L2 Case Staffing Match Process SOP", href: "/resource-library", pending: true },
  l2OpenCase: { label: "L2 Open Case Staffing Follow-Up Process SOP", href: "/resource-library", pending: true },
  l2OpenHours: { label: "L2 Open Hours and Coverage Review Process SOP", href: "/resource-library", pending: true },
  l2HoursReview: { label: "L2 Hours Serviced Staffing Review Process SOP", href: "/resource-library", pending: true },
  l2RbtAvail: { label: "L2 RBT Availability Update Process SOP", href: "/resource-library", pending: true },
  l2Escalate: { label: "L2 Staffing Escalation to Recruiting Process SOP", href: "/resource-library", pending: true },
  l2Pairing: { label: "L2 Pairing Process — Current Operations", href: "/resource-library", pending: true },
  l2Coverage: { label: "L2 Coverage — Current Operations", href: "/resource-library", pending: true },
  l2FamilyComms: { label: "L2 Family Scheduling Communication Process SOP", href: "/resource-library", pending: true },
  l2NewClient: { label: "L2 New Client Schedule Setup Process SOP", href: "/resource-library", pending: true },
  l2Conflicts: { label: "L2 Schedule Conflicts — Current Operations", href: "/resource-library", pending: true },
  l2Changes: { label: "L2 Schedule Changes — Current Operations", href: "/resource-library", pending: true },
  l2StateRecruit: { label: "L2 State Recruiting Need Review Process SOP", href: "/resource-library", pending: true },
  mondayGuide: { label: "Monday / Current Staffing Tracker Field Guide", href: "/resource-library", pending: true },
  openCaseGuide: { label: "Current Open Case Tracker Guide", href: "/resource-library", pending: true },
  crRef: { label: "CentralReach Schedule/Service Data Reference", href: "/resource-library", pending: true },
  availGuide: { label: "RBT/BT Availability Tracker Guide", href: "/resource-library", pending: true },
  familyTemplates: { label: "Family/Staff Communication Templates", href: "/resource-library", pending: true },
  matchChecklist: { label: "Case Staffing Match Checklist", href: "/resource-library", pending: true },
  openHoursChecklist: { label: "Open Hours Review Checklist", href: "/resource-library", pending: true },
  escalateTemplate: { label: "Recruiting Escalation Template", href: "/resource-library", pending: true },
  stateOpsGuide: { label: "State Ops Escalation Guide", href: "/resource-library", pending: true },
  handoffChecklist: { label: "Scheduling Handoff Checklist", href: "/resource-library", pending: true },
  hardCaseTemplate: { label: "Hard-to-Staff Case Review Template", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<StaffingDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): StaffingDayModule {
  return {
    id: `staff-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: StaffingDayModule[] = [
  day(1, 1, 1, {
    title: "Welcome to Blossom + Staffing Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what Staffing does and why it matters. Staffing is the bridge between approved/ready cases and actual service delivery. Strong staffing means families start faster, authorized hours are used better, and state leaders have fewer avoidable fires.",
    objectives: [
      "Complete the existing Welcome to Blossom experience",
      "Explain what Staffing owns and does not own today",
      "Describe how a case moves from ready → matched → confirmed → schedule handoff or escalation",
      "Explain the owner / status / next action / follow-up date rule",
    ],
    lessons: [
      { id: "w1d1-l1", title: "Welcome to Blossom", kind: "Video", minutes: 20, summary: "Open and complete the existing Welcome to Blossom module." },
      { id: "w1d1-l2", title: "What Staffing owns today", kind: "Overview", minutes: 10, summary: "Open case review, RBT/BT availability, case matching, pairing, coverage/open hours, follow-up, escalation, and scheduling handoff." },
      { id: "w1d1-l3", title: "What Staffing does not own", kind: "Overview", minutes: 8, summary: "Not intake conversion, auth approval, clinical treatment, recruiting pipeline execution, payroll, or final CR schedule entry unless assigned." },
      { id: "w1d1-l4", title: "Staffing vs Scheduling vs Recruiting vs State Ops", kind: "Overview", minutes: 10, summary: "Staffing matches; Scheduling builds the schedule; Recruiting owns candidates; State Ops owns state health." },
    ],
    checklist: [
      "Completed Welcome to Blossom",
      "Can explain what Staffing owns",
      "Can explain what Staffing does not own",
      "Can explain why open cases need owner/status/next action/follow-up date",
      "Can explain the difference between Staffing, Scheduling, Recruiting, and State Ops",
    ],
    shadowing: ["Sit with Staffing Lead, Coordinator, or assigned mentor for 30–60 minutes and watch how they review open cases."],
    livePractice: ["No live staffing ownership yet — observe only."],
    resources: [R.welcome, R.l1StaffingSop, R.binder, R.roleDeepDive, R.l2CaseMatch],
    knowledgeCheck: {
      q: "What four things should every open case / staffing item have before you leave it?",
      a: "Owner, status, next action, follow-up date. Staffing does not own recruiting pipeline execution or final schedule entry.",
    },
    reflectionPrompt: "In your own words, why does Staffing matter to families, RBTs/BTs, state leaders, and hours serviced?",
  }),
  day(1, 2, 2, {
    title: "Current Staffing Systems Tour — Monday, CR-Related Data, Outlook, Phone, Trackers",
    description:
      "Learn the systems Staffing touches today: Monday / current staffing tracker, CentralReach-related schedule/service data for awareness, Outlook / email, and phone / team messaging.",
    objectives: [
      "Identify today's main staffing tools",
      "Locate key open case / staffing fields",
      "Explain why current trackers must be accurate",
      "Explain where phone / message documentation happens today",
    ],
    lessons: [
      { id: "w1d2-l1", title: "Monday / current staffing tracker basics", kind: "SOP", minutes: 15, summary: "Client, state, service location, service type, auth/needed hours, hours serviced, availability, staffing status, owner, next action." },
      { id: "w1d2-l2", title: "CentralReach-related schedule/service data awareness", kind: "Workflow", minutes: 12, summary: "How CR schedule/service reality can affect a staffing decision (Staffing does not own CR entry)." },
      { id: "w1d2-l3", title: "Outlook / email communication basics", kind: "SOP", minutes: 8, summary: "Family, staff, and cross-department staffing threads." },
      { id: "w1d2-l4", title: "Phone, family/staff messages + tracker reality", kind: "SOP", minutes: 10, summary: "Where calls, texts, and manual updates get documented today." },
    ],
    checklist: [
      "Identified main current staffing tools",
      "Located key open case / staffing fields",
      "Explained what current trackers are used for",
      "Explained why manual tracker updates must be accurate",
    ],
    shadowing: ["Watch mentor review one open case and compare tracker information to schedule/service reality."],
    livePractice: ["Locate 3 sample staffing items and point out owner, status, next action, follow-up date."],
    resources: [R.l1StaffingSop, R.l2CaseMatch, R.l2OpenCase, R.l2OpenHours, R.mondayGuide, R.openCaseGuide, R.crRef],
    knowledgeCheck: {
      q: "Should tracker information conflict with known schedule/service reality without follow-up?",
      a: "No. If tracker and reality disagree, flag it, set an owner and next action, and follow up.",
    },
    reflectionPrompt: "Which staffing system or tracker is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "Open Case Basics and Staffing Readiness",
    description:
      "Learn what an open case means and what must be known before Staffing can make a useful match.",
    objectives: [
      "Confirm whether a case is truly open and needs staffing",
      "Identify what's missing and who owns it",
      "Never mark a case staffed unless the match is truly confirmed",
    ],
    lessons: [
      { id: "w1d3-l1", title: "What counts as an open case", kind: "Overview", minutes: 8, summary: "New client, added hours, coverage gap, lost staff, or partial staffing." },
      { id: "w1d3-l2", title: "Staffing readiness checklist", kind: "SOP", minutes: 12, summary: "State, location, service model, auth/needed hours, family availability, staff availability, clinical/BCBA readiness." },
      { id: "w1d3-l3", title: "Authorized / needed hours awareness", kind: "Workflow", minutes: 10, summary: "How auth/needed hours shape match urgency and coverage priorities." },
      { id: "w1d3-l4", title: "Owner and next action", kind: "SOP", minutes: 8, summary: "Every open case gets an owner and a next action before you leave it." },
    ],
    checklist: [
      "Can explain what an open case means",
      "Completed open case review with mentor",
      "Correctly identified missing / blocking information",
    ],
    shadowing: ["Watch mentor review 3 open cases and decide ready / blocked / partially staffed / fully staffed / needs recruiting escalation."],
    livePractice: ["Under mentor supervision, complete open case review on 3 sample / current cases."],
    resources: [R.l2OpenCase, R.l2CaseMatch, R.l2HoursReview, R.l2OpenHours, R.matchChecklist],
    knowledgeCheck: {
      q: "Name three things Staffing needs to know before matching a case.",
      a: "Any 3 of: family availability, RBT/BT availability, location, authorized/needed hours, service model, state, clinical fit.",
    },
    reflectionPrompt: "What can go wrong if a case is marked staffed before the match is real?",
  }),
  day(1, 4, 4, {
    title: "RBT/BT Availability and Fit",
    description:
      "Learn how RBT/BT availability and fit affect staffing decisions.",
    objectives: [
      "Review current RBT/BT availability information",
      "Identify whether availability is fresh or stale",
      "Consider travel, service model, hours capacity, and manager-approved restrictions",
    ],
    lessons: [
      { id: "w1d4-l1", title: "RBT/BT availability basics", kind: "Workflow", minutes: 10, summary: "Where availability lives today and how it's kept current." },
      { id: "w1d4-l2", title: "Availability updates", kind: "SOP", minutes: 10, summary: "How and when to refresh availability information." },
      { id: "w1d4-l3", title: "Fit factors", kind: "Workflow", minutes: 12, summary: "Location, travel, service model, hours capacity, clinic vs field, restrictions." },
      { id: "w1d4-l4", title: "Documentation and follow-up", kind: "SOP", minutes: 8, summary: "Document potential match, blocker, or follow-up needed." },
    ],
    checklist: [
      "Reviewed 5 availability examples",
      "Identified possible fit or blocker",
      "Documented next action with mentor approval",
    ],
    shadowing: ["Watch mentor review RBT/BT availability against open cases."],
    livePractice: ["Under supervision, review 5 availability examples and identify possible matches or blockers."],
    resources: [R.l2RbtAvail, R.l2CaseMatch, R.l2Pairing, R.availGuide],
    knowledgeCheck: {
      q: "Should old / stale availability be trusted without confirmation?",
      a: "No. Confirm current availability before treating a match as real. Travel/location and family schedule count.",
    },
    reflectionPrompt: "What makes an RBT/BT match realistic instead of just possible on paper?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1: Staffing role, systems, open case basics, availability, and role boundaries.",
    objectives: [
      "Review 3 sample open cases with mentor",
      "Explain each case's status, next action, blocker, and correct escalation path",
      "Identify anything still unclear",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering open cases, owner/status/next action, availability, current systems, and role boundaries." },
      { id: "w1d5-l2", title: "Staffing role boundary check", kind: "Overview", minutes: 8, summary: "Staffing vs Scheduling vs Recruiting vs State Ops vs Clinical." },
      { id: "w1d5-l3", title: "Open case walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 items end to end with mentor." },
      { id: "w1d5-l4", title: "Mentor feedback", kind: "Shadowing", minutes: 10, summary: "What went well; what to sharpen next week." },
    ],
    checklist: [
      "Completed Week 1 quiz",
      "Reviewed 3 open cases with mentor",
      "Can explain current tools and role boundaries",
      "Manager / mentor signoff completed",
    ],
    shadowing: ["Watch end-of-day open case / staffing queue review."],
    livePractice: ["Complete supervised open case review checklist for 3 cases."],
    resources: [R.l1StaffingSop, R.l2OpenCase, R.binder],
    knowledgeCheck: {
      q: "What must always be true before you close out a staffing item for the day?",
      a: "Owner, status, next action, and follow-up date are set. Nothing is left silently pending.",
    },
    reflectionPrompt: "What part of Staffing still feels confusing?",
    signoffRequired: "Week 1 manager / mentor signoff required before moving to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: StaffingDayModule[] = [
  day(2, 1, 6, {
    title: "Case Staffing Match Process",
    description: "Learn how to evaluate whether a case and RBT/BT are a good staffing match.",
    objectives: [
      "Review the case need: state, location, service, hours, family availability, urgency, schedule status",
      "Review staff availability: days/times, location, capacity, experience/fit",
      "Decide strong / possible-with-confirmation / not a fit / needs manager review",
    ],
    lessons: [
      { id: "w2d1-l1", title: "Case need review", kind: "Workflow", minutes: 12, summary: "What does this case actually require?" },
      { id: "w2d1-l2", title: "Staff availability review", kind: "Workflow", minutes: 12, summary: "What can each candidate realistically do?" },
      { id: "w2d1-l3", title: "Match criteria", kind: "SOP", minutes: 12, summary: "How Blossom decides today whether a match is strong." },
      { id: "w2d1-l4", title: "Match documentation", kind: "SOP", minutes: 8, summary: "Document why the match works or why it does not." },
    ],
    checklist: ["Evaluated 5 pairings", "Documented why each match works or does not", "Identified manager-review items"],
    shadowing: ["Watch mentor evaluate 3 case/staff match examples."],
    livePractice: ["Under supervision, evaluate 5 case/staff pairings and recommend next action."],
    resources: [R.l2CaseMatch, R.l2Pairing, R.l2RbtAvail, R.matchChecklist],
    knowledgeCheck: { q: "Should unclear fit be forced forward?", a: "No. Document why it is unclear, propose next steps, or route for manager review." },
    reflectionPrompt: "What makes a staffing match strong enough to move forward?",
  }),
  day(2, 2, 7, {
    title: "Pairing Process — Current Operations",
    description: "Learn how the pairing process works today and how it connects to Scheduling and State Ops.",
    objectives: [
      "Understand pairing statuses",
      "Confirm family and staff availability align",
      "Hand off to Scheduling only when the match is ready",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Pairing purpose", kind: "Overview", minutes: 8, summary: "Why we pair carefully instead of quickly." },
      { id: "w2d2-l2", title: "Pairing statuses", kind: "SOP", minutes: 10, summary: "What each current status means." },
      { id: "w2d2-l3", title: "Confirmation steps", kind: "Workflow", minutes: 12, summary: "How family and staff confirmations happen today." },
      { id: "w2d2-l4", title: "Scheduling handoff", kind: "SOP", minutes: 10, summary: "What Scheduling needs to receive a ready match cleanly." },
    ],
    checklist: ["Can explain pairing statuses", "Reviewed 4 pairing scenarios", "Identified when Scheduling handoff is appropriate"],
    shadowing: ["Watch mentor move a potential pairing toward confirmation or escalation."],
    livePractice: ["Review 4 pairing examples and choose correct next status / action."],
    resources: [R.l2Pairing, R.l2CaseMatch, R.l2FamilyComms, R.l2NewClient, R.handoffChecklist],
    knowledgeCheck: { q: "Should Scheduling receive vague pairing information?", a: "No. Handoff must include client, state, staff, days/times, location, service, confirmation status, and next step." },
    reflectionPrompt: "What information does Scheduling need from Staffing to avoid rework?",
  }),
  day(2, 3, 8, {
    title: "Coverage and Open Hours Review",
    description: "Learn how coverage gaps and open hours are reviewed today.",
    objectives: [
      "Review coverage / open-hours queue",
      "Prioritize same-day, high-hours, repeated, clinic, and family-concern gaps",
      "Document next action and escalate when no match exists",
    ],
    lessons: [
      { id: "w2d3-l1", title: "Coverage basics", kind: "Overview", minutes: 8, summary: "What counts as a coverage gap today." },
      { id: "w2d3-l2", title: "Open hours basics", kind: "Workflow", minutes: 10, summary: "What counts as open hours and why they matter." },
      { id: "w2d3-l3", title: "Prioritizing staffing gaps", kind: "SOP", minutes: 12, summary: "How to sort urgency without missing quiet risks." },
      { id: "w2d3-l4", title: "Coverage documentation", kind: "SOP", minutes: 10, summary: "Owner, status, next action, follow-up date for coverage." },
    ],
    checklist: ["Audited 5 coverage / open-hours items", "Correctly prioritized urgent items", "Identified escalation needs"],
    shadowing: ["Watch mentor review coverage / open-hours items."],
    livePractice: ["Audit 5 coverage / open-hours items and recommend priority / next action."],
    resources: [R.l2Coverage, R.l2OpenHours, R.l2HoursReview, R.l2OpenCase, R.openHoursChecklist],
    knowledgeCheck: { q: "Should repeated coverage gaps be escalated?", a: "Yes. Recurring gaps signal a pattern that needs manager, recruiting, or state-ops visibility." },
    reflectionPrompt: "What makes an open-hours or coverage issue urgent?",
  }),
  day(2, 4, 9, {
    title: "Family and Staff Communication for Staffing",
    description: "Learn how Staffing communicates about availability, match potential, and staffing status without overpromising.",
    objectives: [
      "Use clear, warm, specific language",
      "Never promise a start date or assignment before the match is confirmed",
      "Document communication attempt, outcome, and follow-up",
    ],
    lessons: [
      { id: "w2d4-l1", title: "Family availability confirmation", kind: "Workflow", minutes: 10, summary: "Warm, clear, specific — no promises." },
      { id: "w2d4-l2", title: "Staff availability confirmation", kind: "Workflow", minutes: 10, summary: "Direct, professional, dated." },
      { id: "w2d4-l3", title: "Match communication", kind: "SOP", minutes: 10, summary: "How and when to communicate a proposed match." },
      { id: "w2d4-l4", title: "Documentation after communication", kind: "SOP", minutes: 8, summary: "Log attempt, outcome, next follow-up." },
    ],
    checklist: ["Drafted approved family availability message", "Drafted approved staff availability message", "Role-played a staffing communication", "Documented outcome correctly"],
    shadowing: ["Listen to mentor make family/staff availability calls or review staffing messages."],
    livePractice: ["Draft 2 family and 2 staff availability messages for mentor review; role-play a staff availability confirmation call."],
    resources: [R.l2FamilyComms, R.l2RbtAvail, R.l2CaseMatch, R.familyTemplates],
    knowledgeCheck: { q: "Should Staffing promise a start date before the match is confirmed?", a: "No. Communication should be warm and hopeful, but never promise a start date or assignment before confirmation." },
    reflectionPrompt: "How do we keep families hopeful without overpromising staffing?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description: "Complete a supervised mini-shift using current staffing tasks.",
    objectives: ["Run 5–8 low-risk staffing tasks with mentor review", "Keep every item's next step visible", "Confirm quality of match logic, notes, and communication"],
    lessons: [
      { id: "w2d5-l1", title: "Case match review", kind: "Live Practice", minutes: 15, summary: "Match decisions on real / sample items." },
      { id: "w2d5-l2", title: "Pairing review", kind: "Live Practice", minutes: 12, summary: "Move pairings toward confirmation or escalation." },
      { id: "w2d5-l3", title: "Coverage / open hours review", kind: "Live Practice", minutes: 12, summary: "Prioritize and document." },
      { id: "w2d5-l4", title: "Family / staff communication review", kind: "Reflection", minutes: 10, summary: "Manager reviews written and verbal comms." },
    ],
    checklist: ["Completed assigned supervised tasks", "No open case / staffing item left without next step", "Manager check-in completed"],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list."],
    resources: [R.l2CaseMatch, R.l2Pairing, R.l2OpenHours, R.l2FamilyComms, R.matchChecklist],
    knowledgeCheck: { q: "What must always be true at the end of a mini-shift?", a: "Every assigned item has owner, status, next action, and follow-up date. Nothing left silently pending." },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 manager / mentor signoff required before moving to Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: StaffingDayModule[] = [
  day(3, 1, 11, {
    title: "Staffing Escalation to Recruiting",
    description: "Learn how Staffing turns real staffing gaps into clear recruiting needs.",
    objectives: ["Identify when no current staff match exists", "Package the need clearly for Recruiting", "Track receipt and follow-up"],
    lessons: [
      { id: "w3d1-l1", title: "When recruiting escalation is needed", kind: "Overview", minutes: 8, summary: "Real gap vs stale tracker vs missed match." },
      { id: "w3d1-l2", title: "What Recruiting needs to know", kind: "SOP", minutes: 12, summary: "State, location, service, days/times, hours, urgency, case type, start target, special fit." },
      { id: "w3d1-l3", title: "Writing a clear staffing need", kind: "Workflow", minutes: 12, summary: "Concise, specific, actionable." },
      { id: "w3d1-l4", title: "Follow-up on recruiting escalations", kind: "SOP", minutes: 10, summary: "Confirm receipt, set follow-up date, track outcome." },
    ],
    checklist: ["Identified when escalation is needed", "Drafted 3 clear recruiting needs", "Added owner / status / next action / follow-up date"],
    shadowing: ["Watch mentor escalate a staffing need to Recruiting."],
    livePractice: ["Draft 3 recruiting escalation requests for mentor review."],
    resources: [R.l2Escalate, R.l2StateRecruit, R.l2OpenCase, R.escalateTemplate],
    knowledgeCheck: { q: "Should Recruiting be told only 'need RBT' without location / hours / timing?", a: "No. Escalations must be specific and follow-upable." },
    reflectionPrompt: "What makes a recruiting escalation useful instead of vague?",
  }),
  day(3, 2, 12, {
    title: "State Ops and Manager Handoffs",
    description: "Learn when State Ops or management needs visibility into staffing issues.",
    objectives: ["Identify staffing issues affecting state health", "Write an escalation note with impact and requested decision", "Never dump vague problems on leaders"],
    lessons: [
      { id: "w3d2-l1", title: "State health impact", kind: "Overview", minutes: 8, summary: "Which staffing issues actually move state metrics." },
      { id: "w3d2-l2", title: "State Ops handoff criteria", kind: "SOP", minutes: 12, summary: "When to loop State Ops." },
      { id: "w3d2-l3", title: "Manager review criteria", kind: "SOP", minutes: 10, summary: "When to loop your Staffing manager." },
      { id: "w3d2-l4", title: "Clear escalation notes", kind: "Workflow", minutes: 12, summary: "Issue, impact, attempts, blocker, owner, requested decision." },
    ],
    checklist: ["Correctly selected escalation path for scenarios", "Drafted a clear State Ops / manager note", "Included impact and requested decision"],
    shadowing: ["Watch mentor escalate a state staffing issue."],
    livePractice: ["Review 4 scenarios and decide whether they need Scheduling, Recruiting, State Ops, Clinical, or manager escalation."],
    resources: [R.l2OpenCase, R.l2Escalate, R.stateOpsGuide],
    knowledgeCheck: { q: "Should State Ops receive vague 'staffing issue' notes?", a: "No. Give facts, impact, and a requested decision — not a dump." },
    reflectionPrompt: "What kind of staffing issue should a State Director know about?",
  }),
  day(3, 3, 13, {
    title: "Hours Serviced and Staffing Review",
    description: "Learn how staffing affects hours serviced and why open hours must be monitored.",
    objectives: ["Compare authorized / needed hours to serviced / scheduled hours", "Identify gap reasons", "Document action plan and escalate recurring gaps"],
    lessons: [
      { id: "w3d3-l1", title: "Hours serviced basics", kind: "Overview", minutes: 8, summary: "Why hours serviced matters beyond the schedule." },
      { id: "w3d3-l2", title: "Scheduled vs needed hours awareness", kind: "Workflow", minutes: 10, summary: "How to read the gap fairly." },
      { id: "w3d3-l3", title: "Open hours pattern review", kind: "SOP", minutes: 12, summary: "Look for recurring patterns, not just single misses." },
      { id: "w3d3-l4", title: "Staffing action plan", kind: "SOP", minutes: 10, summary: "Match, confirm, cover, escalate, or manager-review." },
    ],
    checklist: ["Reviewed 5 hours / open-hours examples", "Identified gap reason", "Recommended staffing action plan"],
    shadowing: ["Watch mentor review an hours-serviced staffing gap."],
    livePractice: ["Review 5 cases for open-hours or hours-serviced staffing gaps."],
    resources: [R.l2HoursReview, R.l2OpenHours, R.l2CaseMatch, R.openHoursChecklist],
    knowledgeCheck: { q: "Can staffing gaps reduce hours serviced?", a: "Yes. Staffing quality directly affects hours serviced; recurring gaps must be documented and escalated." },
    reflectionPrompt: "Why does hours serviced matter beyond just the schedule?",
  }),
  day(3, 4, 14, {
    title: "Hard-to-Staff Cases and Fit Problems",
    description: "Learn how to handle cases that are hard to staff — geography, schedule, hours, fit, clinic vs field, or repeated mismatch.",
    objectives: ["Identify why a case is hard to staff", "Build practical options", "Document and escalate"],
    lessons: [
      { id: "w3d4-l1", title: "Hard-to-staff case types", kind: "Overview", minutes: 8, summary: "Common patterns Blossom sees today." },
      { id: "w3d4-l2", title: "Fit problem review", kind: "Workflow", minutes: 12, summary: "Why did this pairing fail — and what did we learn?" },
      { id: "w3d4-l3", title: "Option building", kind: "SOP", minutes: 12, summary: "Alternate schedule, partial staffing, recruiting, state outreach, manager review, or clinical/BCBA input." },
      { id: "w3d4-l4", title: "Escalation and follow-up", kind: "SOP", minutes: 10, summary: "How to escalate a hard case with facts and options." },
    ],
    checklist: ["Identified hard-to-staff reason", "Drafted practical options", "Escalated appropriately"],
    shadowing: ["Watch mentor review a hard-to-staff case."],
    livePractice: ["Review 4 hard-to-staff scenarios and draft action options."],
    resources: [R.l2OpenCase, R.l2CaseMatch, R.l2Escalate, R.l2Conflicts, R.hardCaseTemplate],
    knowledgeCheck: { q: "Should a hard-to-staff case sit with no reason documented?", a: "No. Reason, attempts, and options should always be documented before or during escalation." },
    reflectionPrompt: "What makes a case hard to staff, and how can Staffing make the problem clearer?",
  }),
  day(3, 5, 15, {
    title: "Staffing Cleanup and End-of-Day Discipline",
    description: "Learn how to end the day with a clean staffing queue.",
    objectives: ["Confirm every item has current status, owner, next action, follow-up", "Identify stale items", "Build tomorrow's priority list"],
    lessons: [
      { id: "w3d5-l1", title: "End-of-day open case review", kind: "SOP", minutes: 10, summary: "The last pass of the day." },
      { id: "w3d5-l2", title: "Stale follow-up cleanup", kind: "Workflow", minutes: 10, summary: "Find and fix silent items." },
      { id: "w3d5-l3", title: "Owner and next action check", kind: "SOP", minutes: 8, summary: "Nothing leaves the day without owner and next action." },
      { id: "w3d5-l4", title: "Tomorrow's priority list", kind: "Workflow", minutes: 10, summary: "Urgent coverage, open hours, no-match, family waiting, escalation follow-up." },
    ],
    checklist: ["Completed queue cleanup", "No assigned item left without next action", "Created tomorrow's priority list"],
    shadowing: ["Watch mentor complete end-of-day staffing cleanup."],
    livePractice: ["Clean up 8–10 assigned / simulated staffing items with mentor review."],
    resources: [R.l2OpenCase, R.l2OpenHours, R.l2Escalate],
    knowledgeCheck: { q: "Should stale staffing items be left untouched?", a: "No. Stale items must be reviewed, updated, or escalated — never ignored." },
    reflectionPrompt: "What makes a staffing queue feel controlled instead of chaotic?",
    signoffRequired: "Week 3 manager / mentor signoff required before moving to Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: StaffingDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled Staffing Queue Ownership — Part 1",
    description: "Own a small set of real staffing tasks with mentor review.",
    objectives: ["Prioritize the queue", "Complete assigned work", "End day with no assigned item lacking next action"],
    lessons: [
      { id: "w4d1-l1", title: "Morning staffing queue review", kind: "Workflow", minutes: 10, summary: "Set the day's priorities." },
      { id: "w4d1-l2", title: "Prioritizing staffing work", kind: "SOP", minutes: 10, summary: "Urgent coverage, longest-open, high-hours, family concern." },
      { id: "w4d1-l3", title: "Updating current trackers", kind: "SOP", minutes: 10, summary: "Keep Monday / trackers accurate as you work." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "Workflow", minutes: 10, summary: "Repeat the Day 15 discipline." },
    ],
    checklist: ["Completed assigned queue", "Updated current systems accurately", "Manager reviewed work"],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned staffing tasks with mentor review."],
    resources: [R.l1StaffingSop, R.l2CaseMatch, R.l2OpenCase, R.l2OpenHours],
    knowledgeCheck: { q: "What should be true at end of day about your assigned queue?", a: "Every item has current status, owner, next action, and follow-up date." },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled Staffing Queue Ownership — Part 2",
    description: "Repeat controlled ownership with more independence.",
    objectives: ["Own more with less oversight", "Escalate blockers with clear notes", "Keep queue clean"],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "SOP", minutes: 10, summary: "Follow-up dates land, don't drift." },
      { id: "w4d2-l2", title: "Match quality", kind: "Workflow", minutes: 12, summary: "Match decisions get sharper with reps." },
      { id: "w4d2-l3", title: "Family / staff communication", kind: "Workflow", minutes: 10, summary: "Keep tone warm, specific, documented." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Escalate the right way, to the right owner." },
    ],
    checklist: ["Completed queue work", "Escalated blockers correctly", "No stale / unowned assigned staffing item"],
    shadowing: ["Minimal — learner performs while mentor reviews."],
    livePractice: ["Own 10–15 assigned staffing tasks."],
    resources: [R.l2Escalate, R.l2RbtAvail, R.l2Pairing, R.l2HoursReview],
    knowledgeCheck: { q: "Where should a staffing blocker go if you cannot resolve it?", a: "To the correct owner — Scheduling, Recruiting, State Ops, Clinical, or manager — with facts, impact, and a requested decision." },
    reflectionPrompt: "What did you escalate today and why?",
  }),
  day(4, 3, 18, {
    title: "Staffing Communication Quality Day",
    description: "Focus on clear communication with families, staff, Scheduling, Recruiting, State Ops, Clinical, and managers.",
    objectives: ["Write clear staffing notes", "Communicate urgency without drama", "Keep tone calm, specific, actionable"],
    lessons: [
      { id: "w4d3-l1", title: "Clear staffing notes", kind: "SOP", minutes: 12, summary: "What is needed, who is available, what was attempted, owner, follow-up date." },
      { id: "w4d3-l2", title: "Family / staff update quality", kind: "Workflow", minutes: 10, summary: "Warm, specific, honest — never overpromise." },
      { id: "w4d3-l3", title: "Recruiting escalation quality", kind: "SOP", minutes: 10, summary: "Specific need, urgency, follow-up date." },
      { id: "w4d3-l4", title: "State Ops escalation quality", kind: "SOP", minutes: 10, summary: "Impact, attempts, requested decision." },
    ],
    checklist: ["Drafted 5 clear notes / handoffs", "Mentor approved tone and specificity", "Correct owner / date / next action included"],
    shadowing: ["Mentor reviews written updates and handoffs."],
    livePractice: ["Draft 5 staffing update / handoff notes for mentor review."],
    resources: [R.l2CaseMatch, R.l2Escalate, R.l2OpenCase, R.familyTemplates],
    knowledgeCheck: { q: "What makes a staffing note actionable for another department?", a: "Specifics: client/state/need, who owns the next step, follow-up date, and what decision is being requested." },
    reflectionPrompt: "What kind of staffing note makes another department able to act immediately?",
  }),
  day(4, 4, 19, {
    title: "End-to-End Staffing Simulation",
    description: "Complete a full staffing simulation from open case review through match, availability confirmation, schedule handoff, or escalation.",
    objectives: ["Run one case end-to-end", "Pass mentor review", "Complete a real task set alongside the simulation"],
    lessons: [
      { id: "w4d4-l1", title: "Open case review simulation", kind: "Live Practice", minutes: 12, summary: "Start from a fresh open case." },
      { id: "w4d4-l2", title: "Match and pairing simulation", kind: "Live Practice", minutes: 15, summary: "Decide, document, and confirm." },
      { id: "w4d4-l3", title: "Coverage / open hours simulation", kind: "Live Practice", minutes: 10, summary: "Prioritize and act." },
      { id: "w4d4-l4", title: "Escalation / handoff simulation", kind: "Live Practice", minutes: 12, summary: "Hand off to Scheduling or escalate to Recruiting / State Ops." },
    ],
    checklist: ["Completed full simulation", "Passed mentor review", "Completed real task set"],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1StaffingSop, R.l2CaseMatch, R.l2OpenCase, R.l2OpenHours, R.l2Escalate, R.handoffChecklist],
    knowledgeCheck: { q: "What part of the full staffing process should you still practice?", a: "Any step the learner cannot execute end-to-end without prompting — call it out and schedule reps." },
    reflectionPrompt: "What part of the full staffing process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description: "Complete final review; manager determines readiness for ongoing staffing ownership and sets a 30-day plan.",
    objectives: ["Complete final knowledge review", "Have a readiness conversation with manager", "Create a 30-day growth plan"],
    lessons: [
      { id: "w4d5-l1", title: "Final knowledge review", kind: "Quiz", minutes: 20, summary: "10–15 questions covering the full journey." },
      { id: "w4d5-l2", title: "Readiness conversation", kind: "Workflow", minutes: 15, summary: "What can be owned independently vs still reviewed." },
      { id: "w4d5-l3", title: "Strengths and coaching areas", kind: "Overview", minutes: 10, summary: "Name 2 strengths and 2 coaching areas." },
      { id: "w4d5-l4", title: "Next 30-day growth plan", kind: "Workflow", minutes: 15, summary: "Concrete targets for the first month of independent work." },
    ],
    checklist: ["Completed all modules", "Completed final quiz", "Manager signoff completed", "Next 30-day plan created"],
    shadowing: ["End-of-journey manager review."],
    livePractice: ["Learner runs a short staffing queue review while manager observes."],
    resources: [R.l1StaffingSop, R.role306090, R.roleDeepDive, R.l2CaseMatch, R.l2OpenCase, R.l2OpenHours, R.l2Escalate],
    knowledgeCheck: {
      q: "Final: name any 3 of — staffing lifecycle, current systems, owner/status/next action/follow-up, open case review, authorized/needed hours, family availability, RBT/BT availability, case staffing match, pairing, coverage/open hours, hard-to-staff cases, hours serviced impact, recruiting escalation, State Ops escalation, scheduling handoff, role boundaries.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about Staffing that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into independent ownership with a 30-day plan.",
  }),
];

export const STAFFING_DAYS: StaffingDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getStaffingDay(sourceModuleId: string): StaffingDayModule | undefined {
  return STAFFING_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalStaffingMinutes(): number {
  return STAFFING_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}
