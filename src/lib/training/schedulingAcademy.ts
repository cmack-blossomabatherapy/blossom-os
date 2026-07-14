/**
 * Scheduling Team Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new Scheduling Coordinator on today's Blossom scheduling process
 * using today's tools (CentralReach, Monday / current trackers, Outlook,
 * phone) and clean cross-department handoffs.
 *
 * Mirrors `authorizationsAcademy.ts` so it plugs into the same academy
 * adapter without touching other role/department curricula.
 */

export type SchedLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface SchedLesson {
  id: string;
  title: string;
  summary: string;
  kind: SchedLessonKind;
  minutes: number;
}

export interface SchedResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface SchedulingDayModule {
  /** Source module id — becomes `scheduling::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: SchedLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: SchedResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface SchedulingWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const SCHEDULING_WEEKS: SchedulingWeek[] = [
  { weekNumber: 1, title: "Week 1 · Scheduling Foundations, Welcome, Systems, and Role Boundaries",
    goal: "Understand Blossom, Scheduling's purpose, today's systems, schedule accuracy, family/staff communication, and basic queue discipline before touching live schedule work independently." },
  { weekNumber: 2, title: "Week 2 · Assessment Scheduling, New Client Setup, Client/Therapist Scheduling, and RBT Availability",
    goal: "Move from observation into supervised execution of common scheduling tasks." },
  { weekNumber: 3, title: "Week 3 · Coverage, Rescheduling, Conflicts, Clinic/Field Scheduling, and Staffing Escalations",
    goal: "Own more work with review, learn judgment points, and practice escalation and cross-department handoffs." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Schedule Accuracy, Communication Quality, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real scheduling work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1RoleSop: { label: "L1 Scheduling Coordinator Role SOP", href: "/resource-library", pending: true },
  l1StaffingSop: { label: "L1 Staffing Coordinator Role SOP", href: "/resource-library", pending: true },
  binder: { label: "Scheduling Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "Scheduling Coordinator Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "Scheduling Coordinator Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l2Assessment: { label: "L2 Assessment Scheduling — Current Operations", href: "/resource-library", pending: true },
  l2Client: { label: "L2 Client Scheduling — Current Operations", href: "/resource-library", pending: true },
  l2Therapist: { label: "L2 Therapist Scheduling — Current Operations", href: "/resource-library", pending: true },
  l2Clinic: { label: "L2 Clinic Scheduling — Current Operations", href: "/resource-library", pending: true },
  l2Field: { label: "L2 Field Scheduling — Current Operations", href: "/resource-library", pending: true },
  l2Coverage: { label: "L2 Coverage — Current Operations", href: "/resource-library", pending: true },
  l2Pairing: { label: "L2 Pairing Process — Current Operations", href: "/resource-library", pending: true },
  l2Resched: { label: "L2 Rescheduling — Current Operations", href: "/resource-library", pending: true },
  l2Changes: { label: "L2 Schedule Changes — Current Operations", href: "/resource-library", pending: true },
  l2Conflicts: { label: "L2 Schedule Conflicts — Current Operations", href: "/resource-library", pending: true },
  l2CaseMatch: { label: "L2 Case Staffing Match Process SOP", href: "/resource-library", pending: true },
  l2CrSync: { label: "L2 CentralReach Schedule Sync Check Process SOP", href: "/resource-library", pending: true },
  l2FamilyComms: { label: "L2 Family Scheduling Communication Process SOP", href: "/resource-library", pending: true },
  l2HoursReview: { label: "L2 Hours Serviced Staffing Review Process SOP", href: "/resource-library", pending: true },
  l2NewClient: { label: "L2 New Client Schedule Setup Process SOP", href: "/resource-library", pending: true },
  l2OpenCase: { label: "L2 Open Case Staffing Follow-Up Process SOP", href: "/resource-library", pending: true },
  l2OpenHours: { label: "L2 Open Hours and Coverage Review Process SOP", href: "/resource-library", pending: true },
  l2RbtAvail: { label: "L2 RBT Availability Update Process SOP", href: "/resource-library", pending: true },
  l2ChangeReq: { label: "L2 Schedule Change Request Process SOP", href: "/resource-library", pending: true },
  l2Escalate: { label: "L2 Staffing Escalation to Recruiting Process SOP", href: "/resource-library", pending: true },
  crGuide: { label: "CentralReach Scheduling Guide", href: "/resource-library", pending: true },
  mondayGuide: { label: "Monday Scheduling Tracker Field Guide", href: "/resource-library", pending: true },
  outlookGuide: { label: "Outlook / Email Scheduling Communication Guide", href: "/resource-library", pending: true },
  familyTemplates: { label: "Family Scheduling Communication Templates", href: "/resource-library", pending: true },
  staffTemplates: { label: "Staff Scheduling Communication Templates", href: "/resource-library", pending: true },
  commsTemplates: { label: "Cross-Department Communication Templates", href: "/resource-library", pending: true },
  escalationGuide: { label: "Escalation Guide", href: "/resource-library", pending: true },
  gaVariation: { label: "Georgia Scheduling Variation Guide", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<SchedulingDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): SchedulingDayModule {
  return {
    id: `sched-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: SchedulingDayModule[] = [
  day(1, 1, 1, {
    title: "Scheduling Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what Scheduling does and why it matters. Scheduling turns approvals, staffing, family availability, and clinical readiness into actual services. If scheduling is messy, families lose confidence, hours drop, and state leaders get pulled into preventable fires.",
    objectives: [
      "Explain what Scheduling owns and does not own today",
      "Describe the scheduling lifecycle end to end",
      "Explain the owner / status / next action / follow-up date rule",
    ],
    lessons: [
      { id: "w1d1-l1", title: "What Scheduling owns today", kind: "Overview", minutes: 10, summary: "Schedule setup and accuracy, availability coordination, CentralReach updates, family/staff scheduling communication, and readiness escalation." },
      { id: "w1d1-l2", title: "What Scheduling does not own", kind: "Overview", minutes: 8, summary: "Not intake conversion, auth approval, clinical treatment decisions, recruiting pipeline, payroll, or state escalation closure." },
      { id: "w1d1-l3", title: "The scheduling lifecycle", kind: "Workflow", minutes: 12, summary: "Intake / auth readiness → assessment scheduling → new client setup → therapist/RBT scheduling → clinic / field scheduling → coverage → changes → ongoing maintenance." },
    ],
    checklist: [
      "Can explain what Scheduling owns",
      "Can explain what Scheduling does not own",
      "Can explain why CentralReach schedule accuracy matters",
      "Can describe the scheduling lifecycle",
    ],
    shadowing: ["Sit with Scheduling Lead, Coordinator, or assigned mentor for 30–60 minutes and watch how they start their schedule queue review."],
    livePractice: ["No live schedule ownership yet — observe only."],
    resources: [R.l1RoleSop, R.binder, R.roleDeepDive, R.l2CrSync],
    knowledgeCheck: {
      q: "What four things should every scheduling item have before you leave it?",
      a: "Owner, status, next action, follow-up date. Scheduling does not own auth approval or clinical decisions.",
    },
    reflectionPrompt: "In your own words, why does Scheduling matter to families, staff, state leaders, billing, and hours serviced?",
  }),
  day(1, 2, 2, {
    title: "Current Scheduling Systems Tour — CentralReach, Monday, Outlook, Phone, Trackers",
    description:
      "Learn every system Scheduling touches today and what each is used for: CentralReach as the primary schedule/clinical record, Monday / current trackers, Outlook / email, and phone / team messaging.",
    objectives: [
      "Identify today's main scheduling tools",
      "Locate key schedule fields in CR and current tracker",
      "Explain why CR, tracker, and Outlook must stay aligned",
      "Explain where phone / message documentation happens today",
    ],
    lessons: [
      { id: "w1d2-l1", title: "CentralReach schedule basics", kind: "Workflow", minutes: 15, summary: "Where schedules are reviewed and updated today." },
      { id: "w1d2-l2", title: "Monday / current tracker basics", kind: "SOP", minutes: 12, summary: "Readiness, changes, coverage, open cases." },
      { id: "w1d2-l3", title: "Outlook / email communication basics", kind: "SOP", minutes: 8, summary: "Family, staff, and cross-department scheduling threads." },
      { id: "w1d2-l4", title: "Phone and family/staff messages + tracker reality", kind: "SOP", minutes: 10, summary: "Where phone calls, texts, and manual updates are documented today." },
    ],
    checklist: [
      "Identified main current scheduling tools",
      "Located key schedule fields",
      "Explained CR's role today",
      "Explained why systems must stay aligned",
    ],
    shadowing: ["Watch mentor review one CentralReach schedule and compare it to Monday / current tracker information."],
    livePractice: ["Locate 3 sample scheduling items and point out owner, status, next action, follow-up date."],
    resources: [R.l2CrSync, R.l2Client, R.l2Changes, R.crGuide, R.mondayGuide, R.outlookGuide],
    knowledgeCheck: {
      q: "What system is the primary schedule / clinical record system today?",
      a: "CentralReach. Monday / trackers and Outlook must stay aligned with CR.",
    },
    reflectionPrompt: "Which scheduling system is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "Scheduling Readiness Basics",
    description:
      "Learn what must be true before a schedule can be created, changed, or treated as ready.",
    objectives: [
      "Confirm auth, family, therapist/RBT, and clinical readiness",
      "Confirm location and service model",
      "Identify blockers and route to the correct owner",
    ],
    lessons: [
      { id: "w1d3-l1", title: "Authorization readiness", kind: "SOP", minutes: 10, summary: "Confirm auth status/readiness when required." },
      { id: "w1d3-l2", title: "Family availability", kind: "Workflow", minutes: 8, summary: "Requested schedule, location, service model." },
      { id: "w1d3-l3", title: "Therapist / RBT availability", kind: "Workflow", minutes: 10, summary: "Availability and fit for the case." },
      { id: "w1d3-l4", title: "Clinical / BCBA readiness + location and service model", kind: "SOP", minutes: 12, summary: "Confirm BCBA / clinical readiness and setting." },
    ],
    checklist: [
      "Explained scheduling readiness",
      "Completed readiness review with mentor",
      "Correctly identified blocking items",
    ],
    shadowing: ["Watch mentor review 3 scheduling items and decide ready / blocked / needs follow-up."],
    livePractice: ["Under mentor supervision, complete readiness review on 3 sample scheduling items."],
    resources: [R.l2NewClient, R.l2CaseMatch, R.l2RbtAvail, R.l2OpenCase, R.l2Escalate],
    knowledgeCheck: {
      q: "Should blocked scheduling items have a clear owner and next action?",
      a: "Yes. Blocked items keep owner, status, next action, and follow-up date until unblocked.",
    },
    reflectionPrompt: "What can go wrong if a schedule is created before auth, family, staff, or clinical readiness is confirmed?",
  }),
  day(1, 4, 4, {
    title: "Family and Staff Scheduling Communication",
    description:
      "How Scheduling communicates schedule questions, changes, and confirmations with families and staff in a clear, warm, and documented way.",
    objectives: [
      "Use clear, warm, specific language for availability and confirmations",
      "Confirm date, time, location, service type, provider, and next step",
      "Document communication attempt, outcome, and next follow-up",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Family scheduling communication", kind: "Workflow", minutes: 10, summary: "Warm, clear, specific." },
      { id: "w1d4-l2", title: "Staff scheduling communication", kind: "Workflow", minutes: 10, summary: "Direct, professional, dated." },
      { id: "w1d4-l3", title: "Clear confirmation messages", kind: "SOP", minutes: 10, summary: "Date, time, location, service, provider, next step." },
      { id: "w1d4-l4", title: "Documentation after communication", kind: "SOP", minutes: 8, summary: "Log attempt, outcome, follow-up." },
    ],
    checklist: [
      "Drafted approved family scheduling message",
      "Drafted approved staff scheduling message",
      "Role-played schedule communication",
      "Documented outcome correctly",
    ],
    shadowing: ["Listen to mentor make family / staff scheduling calls or review scheduling messages."],
    livePractice: ["Draft 2 family and 2 staff scheduling messages for mentor review; role-play one confirmation or change call."],
    resources: [R.l2FamilyComms, R.l2ChangeReq, R.l2Resched, R.familyTemplates, R.staffTemplates],
    knowledgeCheck: {
      q: "Should a family or staff member receive vague schedule information?",
      a: "No. Every message includes clear date, time, location, service, provider (as appropriate), and next step.",
    },
    reflectionPrompt: "What makes a schedule message clear instead of confusing?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1: Scheduling role, systems, readiness, communication, and role boundaries.",
    objectives: [
      "Review 3 sample scheduling items with mentor",
      "Explain each item's status and next action",
      "Identify anything still unclear",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering systems, readiness, communication, CR accuracy, boundaries." },
      { id: "w1d5-l2", title: "Role boundary check", kind: "Overview", minutes: 8, summary: "Scheduling vs Intake vs Auth vs Clinical vs Staffing vs Recruiting vs State Ops." },
      { id: "w1d5-l3", title: "Schedule queue walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 items end to end with mentor." },
      { id: "w1d5-l4", title: "Mentor feedback", kind: "Shadowing", minutes: 10, summary: "What went well, what to sharpen next week." },
    ],
    checklist: [
      "Completed Week 1 quiz",
      "Reviewed 3 schedule items with mentor",
      "Can explain current systems and role boundaries",
      "Manager / mentor signoff completed",
    ],
    shadowing: ["Watch end-of-day schedule queue review."],
    livePractice: ["Complete supervised scheduling review checklist for 3 items."],
    resources: [R.l1RoleSop, R.l2CrSync, R.binder],
    knowledgeCheck: {
      q: "What must always be true before you close out a scheduling item for the day?",
      a: "Owner, status, next action, and follow-up date are set. Nothing is left silently pending.",
    },
    reflectionPrompt: "What part of Scheduling still feels confusing?",
    signoffRequired: "Week 1 manager / mentor signoff required before moving to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: SchedulingDayModule[] = [
  day(2, 1, 6, {
    title: "Assessment Scheduling",
    description:
      "Learn how assessment scheduling works today and why it must be accurate and timely.",
    objectives: [
      "Confirm assessment readiness and required owner approval",
      "Coordinate family and BCBA / clinical availability",
      "Update CR / current tracker and send confirmations",
    ],
    lessons: [
      { id: "w2d1-l1", title: "Assessment scheduling purpose", kind: "Overview", minutes: 6, summary: "Why this step matters." },
      { id: "w2d1-l2", title: "Assessment readiness checklist", kind: "SOP", minutes: 12, summary: "Auth / documentation / owner approval." },
      { id: "w2d1-l3", title: "Family / BCBA availability coordination", kind: "Workflow", minutes: 15, summary: "Coordinate availability with clarity." },
      { id: "w2d1-l4", title: "CentralReach / tracker update", kind: "SOP", minutes: 10, summary: "Update CR and current tracker; send confirmations." },
    ],
    checklist: [
      "Explained assessment scheduling readiness",
      "Completed supervised readiness check",
      "Drafted accurate confirmation / update notes",
    ],
    shadowing: ["Watch mentor schedule or review an assessment scheduling item."],
    livePractice: ["Under supervision, complete readiness and draft confirmation for 2 assessment items."],
    resources: [R.l2Assessment, R.l2FamilyComms, R.l2CrSync],
    knowledgeCheck: {
      q: "Should assessment scheduling be updated in CentralReach / current tracker when required?",
      a: "Yes. Every scheduled assessment lands in CR / tracker with confirmation.",
    },
    reflectionPrompt: "What details must be clear before an assessment is scheduled?",
  }),
  day(2, 2, 7, {
    title: "New Client Schedule Setup",
    description:
      "Learn how new client schedules are created once the case is ready.",
    objectives: [
      "Confirm authorization and case readiness",
      "Confirm family preferences and staff availability",
      "Build the first schedule and communicate clearly",
    ],
    lessons: [
      { id: "w2d2-l1", title: "New client schedule purpose", kind: "Overview", minutes: 6, summary: "Why setup quality matters." },
      { id: "w2d2-l2", title: "Auth-to-schedule readiness", kind: "SOP", minutes: 12, summary: "Confirm approvals and constraints." },
      { id: "w2d2-l3", title: "Family availability and preferences", kind: "Workflow", minutes: 12, summary: "Location, model, constraints." },
      { id: "w2d2-l4", title: "First schedule setup", kind: "Workflow", minutes: 15, summary: "Build or observe setup in CR; confirmations." },
    ],
    checklist: [
      "Explained new client schedule setup",
      "Completed readiness checklist",
      "Identified whether staffing is ready or still blocked",
    ],
    shadowing: ["Watch mentor set up or review a new client schedule."],
    livePractice: ["Under supervision, complete new-client readiness checklist on 2 items."],
    resources: [R.l2NewClient, R.l2Client, R.l2CaseMatch, R.l2CrSync],
    knowledgeCheck: {
      q: "Should a new client schedule be treated as final if staffing is not actually ready?",
      a: "No. Setup is only complete when staffing / auth / family readiness is confirmed and the schedule lives correctly in CR.",
    },
    reflectionPrompt: "Why does new-client setup need clean handoffs from Intake, Auth, State Ops, Staffing, and Clinical?",
  }),
  day(2, 3, 8, {
    title: "Client Scheduling and Therapist Scheduling",
    description:
      "Learn ongoing client and therapist / RBT scheduling basics.",
    objectives: [
      "Review client schedule need and current status",
      "Match need to available staff / therapist",
      "Escalate mismatches or staffing gaps",
    ],
    lessons: [
      { id: "w2d3-l1", title: "Client scheduling basics", kind: "Workflow", minutes: 10, summary: "Ongoing client schedule maintenance." },
      { id: "w2d3-l2", title: "Therapist scheduling basics", kind: "Workflow", minutes: 10, summary: "Availability, fit, location, constraints." },
      { id: "w2d3-l3", title: "Availability matching", kind: "SOP", minutes: 12, summary: "Match need with staff when current process allows." },
      { id: "w2d3-l4", title: "Schedule update documentation", kind: "SOP", minutes: 10, summary: "Clear notes on every change." },
    ],
    checklist: [
      "Reviewed 3 schedule items",
      "Correctly identified availability fit or mismatch",
      "Drafted schedule update notes",
    ],
    shadowing: ["Watch mentor review client / therapist schedule matching."],
    livePractice: ["Under supervision, review 3 client / therapist items and recommend next action."],
    resources: [R.l2Client, R.l2Therapist, R.l2RbtAvail, R.l2CaseMatch],
    knowledgeCheck: {
      q: "Should therapist availability be assumed without confirming?",
      a: "No. Availability is confirmed; notes explain the actual change or blocker.",
    },
    reflectionPrompt: "What information makes a therapist / client match realistic?",
  }),
  day(2, 4, 9, {
    title: "RBT Availability Updates and Schedule Sync",
    description:
      "Learn how RBT availability updates and CentralReach schedule sync checks prevent schedule mistakes.",
    objectives: [
      "Review incoming RBT availability updates",
      "Compare CR to current tracker / communication for mismatches",
      "Correct or escalate mismatches according to current process",
    ],
    lessons: [
      { id: "w2d4-l1", title: "RBT availability update process", kind: "SOP", minutes: 12, summary: "How availability comes in and where it lands." },
      { id: "w2d4-l2", title: "CentralReach schedule sync check", kind: "Workflow", minutes: 15, summary: "Cross-check CR against tracker/comms." },
      { id: "w2d4-l3", title: "Detecting mismatches", kind: "SOP", minutes: 10, summary: "Wrong date/time/staff/client/location/auth." },
      { id: "w2d4-l4", title: "Correcting or escalating issues", kind: "SOP", minutes: 10, summary: "Correct where owned, escalate otherwise." },
    ],
    checklist: [
      "Reviewed RBT availability examples",
      "Completed sync check examples",
      "Identified mismatch / escalation needs",
    ],
    shadowing: ["Watch mentor complete a CentralReach schedule sync check."],
    livePractice: ["Under supervision, review 3 availability / schedule sync examples."],
    resources: [R.l2RbtAvail, R.l2CrSync, R.l2Changes, R.l2Conflicts],
    knowledgeCheck: {
      q: "Should CentralReach mismatches be ignored if someone sent a message?",
      a: "No. CR must reflect the actual schedule; mismatches are corrected or escalated with a next action.",
    },
    reflectionPrompt: "Why is CentralReach schedule sync so important for service, billing, and payroll?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description:
      "Complete a supervised mini-shift using current scheduling tasks.",
    objectives: [
      "Complete assigned assessment / new client / client-therapist / sync work",
      "Keep every scheduling item with a next step",
      "Pass mentor quality review",
    ],
    lessons: [
      { id: "w2d5-l1", title: "Assessment scheduling review", kind: "Workflow", minutes: 15, summary: "Assigned assessment tasks under review." },
      { id: "w2d5-l2", title: "New client schedule setup review", kind: "Workflow", minutes: 15, summary: "Assigned new-client setup tasks." },
      { id: "w2d5-l3", title: "Client / therapist scheduling review", kind: "Workflow", minutes: 15, summary: "Ongoing scheduling tasks." },
      { id: "w2d5-l4", title: "Schedule sync review", kind: "Workflow", minutes: 15, summary: "CR sync discipline." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No schedule item left without next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list of 5–8 low-risk items."],
    resources: [R.l2Assessment, R.l2NewClient, R.l2Client, R.l2CrSync],
    knowledgeCheck: {
      q: "What is the sign your work is ready for review?",
      a: "Every touched schedule item has owner, status, next action, and follow-up date with clean notes.",
    },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 mentor signoff required before moving to Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: SchedulingDayModule[] = [
  day(3, 1, 11, {
    title: "Coverage and Open Hours Review",
    description:
      "Learn how coverage needs and open hours are reviewed today.",
    objectives: [
      "Review coverage / open-hours queue",
      "Prioritize service-disruption and recurring gaps",
      "Escalate staffing / recruiting needs when needed",
    ],
    lessons: [
      { id: "w3d1-l1", title: "Coverage basics", kind: "Overview", minutes: 8, summary: "Why coverage discipline matters." },
      { id: "w3d1-l2", title: "Open hours review", kind: "Workflow", minutes: 12, summary: "Client / state / location / service / staff / urgency." },
      { id: "w3d1-l3", title: "Prioritization", kind: "SOP", minutes: 10, summary: "Urgent disruption, high-hours, clinic coverage, recurring gaps." },
      { id: "w3d1-l4", title: "Documentation and escalation", kind: "SOP", minutes: 10, summary: "Owner, next action, and escalation." },
    ],
    checklist: [
      "Audited 5 coverage / open-hours items",
      "Correctly prioritized urgent items",
      "Identified escalation needs",
    ],
    shadowing: ["Watch mentor review coverage / open-hours items."],
    livePractice: ["Audit 5 coverage / open-hours items and recommend priority / next action."],
    resources: [R.l2Coverage, R.l2OpenHours, R.l2HoursReview, R.l2OpenCase],
    knowledgeCheck: {
      q: "Should open-hours trends be escalated when staffing is the blocker?",
      a: "Yes. Coverage issues keep owner / status / next action and escalate when the gap is a staffing / recruiting need.",
    },
    reflectionPrompt: "What makes an open-hours issue urgent?",
  }),
  day(3, 2, 12, {
    title: "Rescheduling and Schedule Change Requests",
    description:
      "Handle schedule change requests and rescheduling without creating confusion.",
    objectives: [
      "Confirm requester, reason, effective date, and impact",
      "Update CR / current tracker and send confirmations",
      "Escalate recurring or service-risk changes",
    ],
    lessons: [
      { id: "w3d2-l1", title: "Schedule change request intake", kind: "SOP", minutes: 10, summary: "Capture requester, reason, impact." },
      { id: "w3d2-l2", title: "Rescheduling criteria", kind: "Workflow", minutes: 12, summary: "When and how to reschedule." },
      { id: "w3d2-l3", title: "Family / staff confirmation", kind: "SOP", minutes: 10, summary: "Confirm new details clearly." },
      { id: "w3d2-l4", title: "Current system updates", kind: "SOP", minutes: 10, summary: "CR + tracker + confirmations." },
    ],
    checklist: [
      "Reviewed 3 schedule change scenarios",
      "Drafted clear family / staff update",
      "Identified required system updates",
    ],
    shadowing: ["Watch mentor process a schedule change or reschedule."],
    livePractice: ["Review 3 schedule change scenarios and draft the correct updates / messages."],
    resources: [R.l2ChangeReq, R.l2Changes, R.l2Resched, R.l2FamilyComms],
    knowledgeCheck: {
      q: "Should schedule changes be updated in CentralReach if CR is the schedule source?",
      a: "Yes. CR is updated, confirmations sent, and recurring or unclear changes are escalated.",
    },
    reflectionPrompt: "What information must be documented so everyone knows what changed?",
  }),
  day(3, 3, 13, {
    title: "Schedule Conflicts and Same-Day Escalations",
    description:
      "Identify and respond to schedule conflicts calmly and factually.",
    objectives: [
      "Categorize conflict type and urgency",
      "Route to the correct owner",
      "Communicate calmly and specifically",
    ],
    lessons: [
      { id: "w3d3-l1", title: "Schedule conflict types", kind: "SOP", minutes: 10, summary: "Double booking, unavailable staff, wrong location, auth / capacity, CR mismatch." },
      { id: "w3d3-l2", title: "Same-day issues", kind: "Workflow", minutes: 10, summary: "Service risk, payroll / billing risk, family complaint." },
      { id: "w3d3-l3", title: "Escalation paths", kind: "SOP", minutes: 10, summary: "Where and how to escalate." },
      { id: "w3d3-l4", title: "Calm communication", kind: "Workflow", minutes: 10, summary: "Facts first, tone steady." },
    ],
    checklist: [
      "Correctly categorized conflict scenarios",
      "Identified urgent vs non-urgent issues",
      "Drafted clear escalation note",
    ],
    shadowing: ["Watch mentor handle or review schedule conflict examples."],
    livePractice: ["Review 5 conflict scenarios and choose correct next action."],
    resources: [R.l2Conflicts, R.l2CrSync, R.l2ChangeReq, R.escalationGuide],
    knowledgeCheck: {
      q: "Should same-day service-risk conflicts wait until tomorrow?",
      a: "No. Same-day risk is escalated same day with a clear note of what happened and who owns the next step.",
    },
    reflectionPrompt: "What makes a schedule conflict a same-day escalation?",
  }),
  day(3, 4, 14, {
    title: "Clinic Scheduling and Field Scheduling",
    description:
      "Learn how clinic and field scheduling differ and what details matter for each.",
    objectives: [
      "Identify clinic vs field vs other setting",
      "Confirm clinic capacity or field logistics",
      "Communicate location details clearly",
    ],
    lessons: [
      { id: "w3d4-l1", title: "Clinic scheduling basics", kind: "SOP", minutes: 10, summary: "Capacity, room/space, staff availability." },
      { id: "w3d4-l2", title: "Field scheduling basics", kind: "SOP", minutes: 10, summary: "Location, travel, family availability." },
      { id: "w3d4-l3", title: "Location and capacity awareness", kind: "Workflow", minutes: 10, summary: "How location changes the scheduling call." },
      { id: "w3d4-l4", title: "Clinic / field communication", kind: "Workflow", minutes: 10, summary: "Clear details in every message." },
    ],
    checklist: [
      "Explained clinic vs field differences",
      "Identified location / capacity considerations",
      "Drafted accurate notes",
    ],
    shadowing: ["Watch mentor compare clinic and field scheduling examples."],
    livePractice: ["Review 4 sample schedule items and identify clinic / field considerations."],
    resources: [R.l2Clinic, R.l2Field, R.l2Client, R.l2Therapist, R.gaVariation],
    knowledgeCheck: {
      q: "Should clinic capacity and field logistics be treated the same?",
      a: "No. Location and service model change how the schedule is set and communicated.",
    },
    reflectionPrompt: "Why does location / service model change how scheduling should be handled?",
  }),
  day(3, 5, 15, {
    title: "Pairing Process and Staffing Escalation to Recruiting",
    description:
      "Learn how case / staff pairing connects Scheduling, Staffing, Recruiting, and State Operations.",
    objectives: [
      "Identify whether a possible staffing match exists",
      "Document why a case is unfilled (geography, availability, skill, hours, timing)",
      "Escalate gaps to the correct owner / recruiting / state process",
    ],
    lessons: [
      { id: "w3d5-l1", title: "Pairing process basics", kind: "SOP", minutes: 10, summary: "How pairing works today." },
      { id: "w3d5-l2", title: "Case staffing match", kind: "Workflow", minutes: 12, summary: "Client needs vs staff availability." },
      { id: "w3d5-l3", title: "Open case follow-up", kind: "SOP", minutes: 10, summary: "Keep the item alive with next action and follow-up." },
      { id: "w3d5-l4", title: "Staffing escalation to Recruiting", kind: "SOP", minutes: 12, summary: "Escalate so Recruiting / State Ops can act." },
    ],
    checklist: [
      "Reviewed 5 pairing / open case scenarios",
      "Identified match or blocker",
      "Drafted staffing / recruiting escalation note",
    ],
    shadowing: ["Watch mentor review open case / staffing match examples."],
    livePractice: ["Review 5 open case / pairing scenarios and recommend next action."],
    resources: [R.l2Pairing, R.l2CaseMatch, R.l2OpenCase, R.l2Escalate, R.l1StaffingSop],
    knowledgeCheck: {
      q: "Should a case sit open without a staffing reason or next step?",
      a: "No. Every open case documents the blocker and next action; escalate to Recruiting when availability cannot fill it.",
    },
    reflectionPrompt: "How should Scheduling communicate a staffing blocker so Recruiting or State Ops can actually act on it?",
    signoffRequired: "Week 3 mentor signoff required before moving to Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: SchedulingDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled Scheduling Queue Ownership — Part 1",
    description:
      "Own a small set of real scheduling tasks with mentor review.",
    objectives: [
      "Run a morning schedule queue review",
      "Prioritize same-day, coverage, new client, changes, CR sync, staffing blockers",
      "End the day with no assigned item lacking a next action",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning scheduling queue review", kind: "Workflow", minutes: 15, summary: "Structured start-of-day queue check." },
      { id: "w4d1-l2", title: "Prioritizing scheduling work", kind: "SOP", minutes: 12, summary: "Risk-based prioritization." },
      { id: "w4d1-l3", title: "Updating CentralReach and current trackers", kind: "Workflow", minutes: 15, summary: "Clean, aligned updates." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "SOP", minutes: 10, summary: "No stale items, all follow-ups dated." },
    ],
    checklist: [
      "Completed assigned queue",
      "Updated current systems accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned scheduling tasks with mentor review."],
    resources: [R.l1RoleSop, R.l2CrSync, R.l2Changes, R.l2Coverage],
    knowledgeCheck: {
      q: "How should you end the day on a controlled ownership shift?",
      a: "Every assigned scheduling item has a next action and follow-up date. No silent pending items.",
    },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled Scheduling Queue Ownership — Part 2",
    description:
      "Repeat controlled ownership with more independence — midpoint and end-of-day mentor checks only.",
    objectives: [
      "Maintain follow-up discipline without prompting",
      "Document blockers and escalations clearly",
      "Escalate correctly to the right owner",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "Workflow", minutes: 15, summary: "Own the cadence." },
      { id: "w4d2-l2", title: "Schedule accuracy", kind: "SOP", minutes: 12, summary: "CR mirrors reality." },
      { id: "w4d2-l3", title: "Family / staff communication", kind: "Workflow", minutes: 15, summary: "Clear, warm, specific." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 10, summary: "Clean escalation to correct owner." },
    ],
    checklist: [
      "Completed queue work",
      "Escalated blockers correctly",
      "No stale / unowned assigned schedule item",
    ],
    shadowing: ["Minimal — mentor reviews at midpoint and end of day."],
    livePractice: ["Own 10–15 assigned scheduling tasks."],
    resources: [R.l2FamilyComms, R.l2Conflicts, R.l2Escalate, R.l2OpenHours],
    knowledgeCheck: {
      q: "When you escalate a blocker, what must the note contain?",
      a: "What changed, who is impacted, what is missing, who owns it, and when follow-up is due.",
    },
    reflectionPrompt: "What did you escalate and why?",
  }),
  day(4, 3, 18, {
    title: "Scheduling Communication Quality Day",
    description:
      "Focus on clear communication with families, staff, State Ops, Authorizations, Staffing, Recruiting, Clinical, and managers.",
    objectives: [
      "Write clear status notes with owner, date, and next action",
      "Avoid vague notes like 'checking schedule'",
      "Communicate urgency when services, staffing, billing, or family confidence are at risk",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Clear schedule notes", kind: "SOP", minutes: 10, summary: "Specific, actionable, dated." },
      { id: "w4d3-l2", title: "Family confirmation quality", kind: "Workflow", minutes: 12, summary: "Warm, specific, unambiguous." },
      { id: "w4d3-l3", title: "Staff confirmation quality", kind: "Workflow", minutes: 12, summary: "Direct, professional, dated." },
      { id: "w4d3-l4", title: "Escalation tone and urgency", kind: "SOP", minutes: 10, summary: "Calm, specific, actionable." },
    ],
    checklist: [
      "Drafted 5 clear notes / handoffs",
      "Mentor approved tone and specificity",
      "Correct owner / date / next action included",
    ],
    shadowing: ["Mentor reviews written updates and handoffs."],
    livePractice: ["Draft 5 schedule update / handoff notes for mentor review."],
    resources: [R.l2FamilyComms, R.l2ChangeReq, R.l2Conflicts, R.commsTemplates],
    knowledgeCheck: {
      q: "What makes another department trust the information in your schedule note?",
      a: "Specificity: what changed, who is impacted, what is missing, who owns it, when follow-up is due.",
    },
    reflectionPrompt: "What kind of scheduling note makes another department trust the information?",
  }),
  day(4, 4, 19, {
    title: "End-to-End Scheduling Simulation",
    description:
      "Complete a full scheduling simulation from readiness through setup, confirmation, CR update, conflict handling, and escalation if needed.",
    objectives: [
      "Complete readiness → setup → confirmation → CR update → conflict → handoff",
      "Apply clinic / field / state considerations",
      "Pass mentor review against checklist",
    ],
    lessons: [
      { id: "w4d4-l1", title: "Readiness simulation", kind: "Workflow", minutes: 12, summary: "Confirm all inputs." },
      { id: "w4d4-l2", title: "New client schedule setup simulation", kind: "Workflow", minutes: 15, summary: "Build the schedule." },
      { id: "w4d4-l3", title: "Availability / pairing simulation", kind: "Workflow", minutes: 12, summary: "Match need to staff." },
      { id: "w4d4-l4", title: "Schedule change / conflict + handoff simulation", kind: "Workflow", minutes: 15, summary: "Close the loop across departments." },
    ],
    checklist: [
      "Completed full simulation",
      "Passed mentor review",
      "Completed real task set",
    ],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1RoleSop, R.l2NewClient, R.l2Client, R.l2Conflicts, R.l2CrSync, R.crGuide, R.commsTemplates],
    knowledgeCheck: {
      q: "What part of the full scheduling process should you still practice?",
      a: "Any step the learner cannot execute end-to-end without prompting — call it out and schedule reps.",
    },
    reflectionPrompt: "What part of the full scheduling process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description:
      "Complete final review; manager determines readiness for ongoing scheduling ownership and sets a 30-day plan.",
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
    livePractice: ["Learner runs a short schedule queue review while manager observes."],
    resources: [R.l1RoleSop, R.role306090, R.roleDeepDive, R.l2Assessment, R.l2Client, R.l2CrSync, R.l2Conflicts],
    knowledgeCheck: {
      q: "Final: name any 3 of — scheduling lifecycle, current systems, owner/status/next action/follow-up, assessment scheduling, new client setup, client/therapist scheduling, RBT availability, CR sync, coverage/open hours, rescheduling, conflicts, clinic vs field, pairing, staffing escalation, handoffs.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about Scheduling that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into independent ownership with a 30-day plan.",
  }),
];

export const SCHEDULING_DAYS: SchedulingDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getSchedulingDay(sourceModuleId: string): SchedulingDayModule | undefined {
  return SCHEDULING_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalSchedulingMinutes(): number {
  return SCHEDULING_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}