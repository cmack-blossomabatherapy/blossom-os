/**
 * Recruiting Department Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new Recruiting Coordinator on today's Blossom recruiting process
 * using today's tools (Apploi, Calendly, Outlook, Teams, phone/email,
 * current trackers) and a clean HR handoff.
 *
 * Structure mirrors `intakeAcademy.ts` so it plugs into the same academy
 * adapter without touching State Director / RBT / BCBA / Intake curricula.
 */

export type RecruitingLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface RecruitingLesson {
  id: string;
  title: string;
  summary: string;
  kind: RecruitingLessonKind;
  minutes: number;
}

export interface RecruitingResourceLink {
  label: string;
  href: string;
  pending?: boolean;
}

export interface RecruitingDayModule {
  /** Source module id — becomes `recruiting::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: RecruitingLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: RecruitingResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface RecruitingWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const RECRUITING_WEEKS: RecruitingWeek[] = [
  { weekNumber: 1, title: "Week 1 · Recruiting Foundations, Welcome, and Current Systems",
    goal: "Understand Blossom, the Recruiting Department's purpose, today's systems, the candidate experience, and pipeline ownership before touching candidate work independently." },
  { weekNumber: 2, title: "Week 2 · State Needs, Application Review, Screening, and Interview Scheduling",
    goal: "Move from observation into supervised execution of common recruiting tasks." },
  { weekNumber: 3, title: "Week 3 · Interview Follow-Up, Offers, HR Handoff, and Pipeline Cleanup",
    goal: "Own more work with review, learn judgment points, and practice clean handoffs to HR and department leaders." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Quality, Speed, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real recruiting work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1RoleSop: { label: "L1 Recruiting Lead / Coordinator Role SOP", href: "/resource-library", pending: true },
  binder: { label: "Recruiting Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "Recruiting Lead / Coordinator Role Deep Dive", href: "/resource-library", pending: true },
  role306090: { label: "Recruiting Training Journey and 30/60/90", href: "/resource-library", pending: true },
  l2StateNeed: { label: "L2 State Recruiting Need Review Process SOP", href: "/resource-library", pending: true },
  l2JobPosting: { label: "L2 Job Posting — Current Operations", href: "/resource-library", pending: true },
  l2ResumeReview: { label: "L2 Resume Review — Current Operations", href: "/resource-library", pending: true },
  l2InterviewScheduling: { label: "L2 Interview Scheduling Process SOP", href: "/resource-library", pending: true },
  l2InterviewProcess: { label: "L2 Interview Process — Current Operations", href: "/resource-library", pending: true },
  l2OfferLetters: { label: "L2 Offer Letters — Current Operations", href: "/resource-library", pending: true },
  l2EmployeeOnboarding: { label: "L2 Employee Onboarding Logistics Process SOP", href: "/resource-library", pending: true },
  l2BackgroundChecks: { label: "L2 Background Checks — Current Operations", href: "/resource-library", pending: true },
  l2Onboarding: { label: "L2 Onboarding — Current Operations", href: "/resource-library", pending: true },
  apploiGuide: { label: "Apploi Guide", href: "/resource-library", pending: true },
  calendlyGuide: { label: "Calendly Guide", href: "/resource-library", pending: true },
  outlookTeamsGuide: { label: "Outlook / Teams Interview Scheduling Guide", href: "/resource-library", pending: true },
  candidateTemplates: { label: "Candidate Communication Templates", href: "/resource-library", pending: true },
  phoneScreenScript: { label: "Candidate Phone Screen Script", href: "/resource-library", pending: true },
  reviewScorecard: { label: "Candidate Review Scorecard", href: "/resource-library", pending: true },
  interviewScorecard: { label: "Interview Scorecard", href: "/resource-library", pending: true },
  notSelectedTemplate: { label: "Not-Selected Template", href: "/resource-library", pending: true },
  hrHandoffChecklist: { label: "HR / Recruiting Handoff Checklist", href: "/resource-library", pending: true },
  offerLetterTemplates: { label: "Offer Letter Templates", href: "/resource-library", pending: true },
  stateHiringTracker: { label: "State Hiring Needs Tracker", href: "/resource-library", pending: true },
  viventiumOverview: { label: "Viventium HR Handoff Overview", href: "/resource-library", pending: true },
  followUpCadence: { label: "Candidate Follow-Up Cadence", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<RecruitingDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): RecruitingDayModule {
  return {
    id: `recruiting-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: RecruitingDayModule[] = [
  day(1, 1, 1, {
    title: "Welcome to Blossom + Recruiting Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what Recruiting owns today and why it matters. If recruiting is slow or messy, states cannot fill cases and families wait longer for care.",
    objectives: [
      "Complete the existing Welcome to Blossom experience",
      "Explain what Recruiting owns and does not own today",
      "Explain the candidate experience standard",
      "Explain the owner / status / next action / follow-up date rule",
    ],
    lessons: [
      { id: "w1d1-l1", title: "Welcome to Blossom", kind: "Video", minutes: 20, summary: "Open and complete the existing Welcome to Blossom module." },
      { id: "w1d1-l2", title: "What Recruiting owns today", kind: "Overview", minutes: 10, summary: "Candidate pipeline movement, communication, interview scheduling, clean HR handoff." },
      { id: "w1d1-l3", title: "What Recruiting does not own", kind: "Overview", minutes: 8, summary: "Not payroll, final HR compliance, clinical credentialing, CentralReach clinical setup, or performance management." },
      { id: "w1d1-l4", title: "The candidate experience standard", kind: "Workflow", minutes: 10, summary: "Warm, direct, professional. No candidate sits without owner, status, next action, follow-up date." },
    ],
    checklist: [
      "Completed Welcome to Blossom",
      "Can explain what Recruiting owns",
      "Can explain what Recruiting does not own",
      "Can explain the owner/status/next action/follow-up date rule",
    ],
    shadowing: ["Sit with Recruiting Lead, Recruiting Assistant, or assigned mentor for 30–60 minutes and watch how they start their day."],
    livePractice: ["No live candidate ownership yet — observe only."],
    resources: [R.welcome, R.l1RoleSop, R.binder, R.l2StateNeed],
    knowledgeCheck: {
      q: "What four things should every candidate have before you leave it?",
      a: "Owner, status, next action, follow-up date. Recruiting does not own payroll or final HR compliance.",
    },
    reflectionPrompt: "In your own words, why does Recruiting matter to Blossom's ability to grow and serve families?",
  }),
  day(1, 2, 2, {
    title: "Current Systems Tour — Apploi, Calendly, Outlook, Teams, Phone, and Trackers",
    description:
      "Tour every system Recruiting touches today: Apploi, Calendly, Outlook/Teams, phone/email, and current recruiting/state trackers.",
    objectives: [
      "Identify today's main recruiting tools",
      "Explain what Apploi is used for",
      "Explain how Calendly, Outlook, and Teams work together",
      "Identify where candidate status and next action are updated",
    ],
    lessons: [
      { id: "w1d2-l1", title: "Apploi basics", kind: "Workflow", minutes: 15, summary: "Where candidates live, current status/pipeline fields, and candidate notes." },
      { id: "w1d2-l2", title: "Calendly scheduling basics", kind: "SOP", minutes: 10, summary: "Interview links, availability, booking flow." },
      { id: "w1d2-l3", title: "Outlook & Teams interview coordination", kind: "SOP", minutes: 10, summary: "Invites, meeting links, and reminders." },
      { id: "w1d2-l4", title: "Phone/email + state need tracker awareness", kind: "SOP", minutes: 10, summary: "Where current state staffing needs are communicated today." },
    ],
    checklist: [
      "Identified the main current recruiting tools",
      "Located candidate status/next action fields in Apploi",
      "Located state need tracker or communication channel",
    ],
    shadowing: ["Watch mentor schedule or confirm one candidate interview."],
    livePractice: ["In training/sandbox or with mentor supervision, locate 3 sample candidates and point out owner/status/next action/follow-up date."],
    resources: [R.apploiGuide, R.calendlyGuide, R.outlookTeamsGuide, R.l2InterviewScheduling, R.l2InterviewProcess, R.l2StateNeed],
    knowledgeCheck: {
      q: "What tools coordinate interview scheduling today?",
      a: "Calendly, Outlook, and Teams — with Apploi as the current major applicant source. All required systems must be updated.",
    },
    reflectionPrompt: "Which recruiting system is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "Candidate Pipeline Basics",
    description:
      "Learn the candidate pipeline stages and how to prevent candidates from falling through the cracks.",
    objectives: [
      "Name the core candidate pipeline stages",
      "Perform a duplicate/existing candidate check",
      "Confirm required candidate basics and pick the correct next action",
    ],
    lessons: [
      { id: "w1d3-l1", title: "What counts as a candidate", kind: "Overview", minutes: 6, summary: "Sources and when an application becomes a candidate." },
      { id: "w1d3-l2", title: "Pipeline statuses", kind: "SOP", minutes: 10, summary: "Application received → screen → interview scheduled/completed → follow-up → offer/handoff → not selected/ghosted." },
      { id: "w1d3-l3", title: "Candidate owner and next action", kind: "Workflow", minutes: 10, summary: "Every candidate has an owner, status, next action, and follow-up date." },
      { id: "w1d3-l4", title: "Duplicate / existing record check", kind: "SOP", minutes: 8, summary: "Search by name, phone, email before creating a duplicate or duplicate outreach." },
    ],
    checklist: [
      "Named core candidate pipeline stages",
      "Performed a duplicate/existing candidate check with mentor",
      "Recommended next action for 3 candidates",
    ],
    shadowing: ["Watch mentor review 5 candidates and decide next actions."],
    livePractice: ["Under mentor supervision, review 3 candidates and recommend the correct next action."],
    resources: [R.l1RoleSop, R.l2ResumeReview, R.l2InterviewScheduling],
    knowledgeCheck: {
      q: "Should a candidate ever be left without a next action?",
      a: "No. Every candidate keeps owner, status, next action, and follow-up date.",
    },
    reflectionPrompt: "What can go wrong if candidates are left in the wrong status?",
  }),
  day(1, 4, 4, {
    title: "Candidate Communication and Follow-Up",
    description:
      "How Recruiting communicates with candidates in a clear, warm, professional, and documented way.",
    objectives: [
      "Use approved candidate tone: fast, warm, direct, professional, specific",
      "Draft clear scheduling, reminder, reschedule, and not-selected messages",
      "Log every communication attempt and set the next follow-up date",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Candidate communication tone", kind: "Workflow", minutes: 8, summary: "Fast, warm, direct, professional, and specific." },
      { id: "w1d4-l2", title: "First response expectations", kind: "SOP", minutes: 8, summary: "How quickly and how the first contact goes." },
      { id: "w1d4-l3", title: "Interview confirmation and reminders", kind: "SOP", minutes: 10, summary: "Approved wording; when to text vs email." },
      { id: "w1d4-l4", title: "Documenting calls, emails, texts", kind: "SOP", minutes: 8, summary: "Log attempt, outcome, and next follow-up date every time." },
    ],
    checklist: [
      "Drafted approved candidate scheduling message",
      "Drafted approved interview reminder",
      "Role-played a short candidate call",
      "Documented a communication attempt correctly",
    ],
    shadowing: ["Listen to mentor make candidate calls or review candidate messages."],
    livePractice: ["Draft 2 candidate texts/emails and 1 interview reminder for mentor review; role-play a short candidate screen/scheduling call."],
    resources: [R.candidateTemplates, R.l2InterviewScheduling, R.l2InterviewProcess, R.outlookTeamsGuide],
    knowledgeCheck: {
      q: "What must be added after a missed candidate call?",
      a: "Documented outcome and a next follow-up date. Vague messages like 'call me' are not acceptable.",
    },
    reflectionPrompt: "What makes a candidate feel guided instead of ignored?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1: Recruiting role, systems, candidate experience, and basic pipeline handling.",
    objectives: [
      "Review 3 sample candidates with mentor",
      "Explain each candidate's status, next action, and required follow-up",
      "Identify what still feels confusing",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering systems, owner/status, communication documentation, next action, scheduling, boundaries." },
      { id: "w1d5-l2", title: "Recruiting role boundary check", kind: "Overview", minutes: 8, summary: "Recruiting vs HR vs Clinical vs State leadership." },
      { id: "w1d5-l3", title: "Candidate pipeline walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 candidate records end to end with mentor." },
      { id: "w1d5-l4", title: "Mentor feedback", kind: "Shadowing", minutes: 10, summary: "What went well, what to sharpen next week." },
    ],
    checklist: [
      "Completed Week 1 quiz",
      "Reviewed 3 candidates with mentor",
      "Can explain Apploi, Calendly, Outlook, Teams, and current tracker responsibilities",
      "Manager/mentor signoff completed",
    ],
    shadowing: ["Watch end-of-day recruiting queue review."],
    livePractice: ["Complete supervised candidate review checklist for 3 candidates."],
    resources: [R.l1RoleSop, R.l2StateNeed, R.binder],
    knowledgeCheck: {
      q: "Where should candidate status live today so nothing drifts?",
      a: "Apploi and any current required tracker — kept aligned with Calendly/Outlook/Teams.",
    },
    reflectionPrompt: "What part of Recruiting still feels confusing?",
    signoffRequired: "Week 1 manager/mentor signoff required before Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: RecruitingDayModule[] = [
  day(2, 1, 6, {
    title: "State Recruiting Needs and Job Posting Awareness",
    description:
      "Connect candidate activity to real staffing needs by state, clinic, role, and urgency.",
    objectives: [
      "Confirm current state staffing needs before pushing candidates forward",
      "Identify role/state/location fit",
      "Explain when to ask a state leader or manager for clarification",
    ],
    lessons: [
      { id: "w2d1-l1", title: "State recruiting need review", kind: "SOP", minutes: 12, summary: "Where and how state needs are communicated today." },
      { id: "w2d1-l2", title: "Role and location awareness", kind: "Workflow", minutes: 8, summary: "RBT/BT, BCBA, office, state-support roles." },
      { id: "w2d1-l3", title: "Job posting basics", kind: "Overview", minutes: 10, summary: "Why postings must match the real need." },
      { id: "w2d1-l4", title: "When to ask for clarification", kind: "Workflow", minutes: 6, summary: "Escalation points for unclear needs." },
    ],
    checklist: [
      "Explained why state recruiting needs must be confirmed",
      "Matched 5 candidates to current state/role needs with mentor",
      "Identified when to ask a state leader or manager",
    ],
    shadowing: ["Watch mentor review current state recruiting needs and compare them to open applicants."],
    livePractice: ["Match 5 sample candidates/applications to current state/role needs with mentor review."],
    resources: [R.l2StateNeed, R.l2JobPosting, R.stateHiringTracker],
    knowledgeCheck: {
      q: "Should Recruiting push every candidate forward without checking state/role fit?",
      a: "No — confirm role, state/location, availability, qualifications, and current need first.",
    },
    reflectionPrompt: "How can Recruiting create problems if we move candidates forward without confirming the real state need?",
  }),
  day(2, 2, 7, {
    title: "Resume and Application Review",
    description:
      "Review applications/resumes and decide move-forward, more information, or not-selected.",
    objectives: [
      "Review contact info, role, location, experience, certification, availability",
      "Identify role-specific basics (RBT cert, BCBA credential)",
      "Recommend the correct next step",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Application review basics", kind: "SOP", minutes: 10, summary: "What fields to confirm first." },
      { id: "w2d2-l2", title: "Resume review basics", kind: "SOP", minutes: 10, summary: "Experience, employment history, notes." },
      { id: "w2d2-l3", title: "Qualification / experience signals", kind: "Workflow", minutes: 10, summary: "Role-specific requirements." },
      { id: "w2d2-l4", title: "Red flags and manager review", kind: "Workflow", minutes: 8, summary: "When to escalate before moving forward." },
    ],
    checklist: [
      "Reviewed 5 candidate applications",
      "Identified missing information",
      "Recommended correct next step with mentor approval",
    ],
    shadowing: ["Watch mentor review 5 applications and explain decisions."],
    livePractice: ["Under supervision, review 5 candidate applications and recommend next step."],
    resources: [R.l2ResumeReview, R.l2JobPosting, R.reviewScorecard],
    knowledgeCheck: {
      q: "Should unclear qualifications be escalated?",
      a: "Yes. Missing contact info or unclear qualifications get manager review before moving forward.",
    },
    reflectionPrompt: "What makes a candidate ready for a phone screen or interview?",
  }),
  day(2, 3, 8, {
    title: "Phone Screen / Initial Candidate Screen",
    description:
      "Conduct or support the first candidate screen.",
    objectives: [
      "Confirm identity, role interest, location/state, availability, certification, transportation, timeline",
      "Answer basic candidate questions or route detailed HR/pay questions correctly",
      "Document screen notes clearly and set next action",
    ],
    lessons: [
      { id: "w2d3-l1", title: "Phone screen purpose", kind: "Overview", minutes: 6, summary: "Why a screen protects both parties." },
      { id: "w2d3-l2", title: "What to confirm", kind: "SOP", minutes: 10, summary: "Identity, role, location, availability, qualifications." },
      { id: "w2d3-l3", title: "Candidate questions and expectations", kind: "Workflow", minutes: 10, summary: "What you can/can't promise on pay/benefits." },
      { id: "w2d3-l4", title: "Screen notes and next step", kind: "SOP", minutes: 8, summary: "Notes specific enough for the next person to act on." },
    ],
    checklist: [
      "Completed phone screen role-play",
      "Documented screen notes",
      "Identified when to escalate a candidate question",
    ],
    shadowing: ["Listen to mentor conduct 2 phone screens."],
    livePractice: ["Role-play 2 phone screens with mentor; conduct or co-conduct 1 low-risk screen if manager approves."],
    resources: [R.l2InterviewProcess, R.phoneScreenScript, R.candidateTemplates],
    knowledgeCheck: {
      q: "Should Recruiting promise pay/benefits details it is not authorized to promise?",
      a: "No. Route those questions to the correct owner and document specifically.",
    },
    reflectionPrompt: "What information must Recruiting gather before an interview is worth scheduling?",
  }),
  day(2, 4, 9, {
    title: "Interview Scheduling, Reminders, Reschedules, and No-Shows",
    description:
      "Keep the calendar, candidate record, and communication aligned across Calendly, Outlook, Teams, and Apploi.",
    objectives: [
      "Schedule / confirm interviews via current process",
      "Verify invites, times, links, and interviewers",
      "Send approved reminders; document reschedules and no-shows with next action",
    ],
    lessons: [
      { id: "w2d4-l1", title: "Scheduling with Calendly", kind: "SOP", minutes: 10, summary: "Booking links and availability." },
      { id: "w2d4-l2", title: "Outlook / Teams invitations", kind: "SOP", minutes: 10, summary: "Correct date/time, candidate info, meeting link, interviewer." },
      { id: "w2d4-l3", title: "Candidate reminders", kind: "Workflow", minutes: 8, summary: "Approved wording and timing." },
      { id: "w2d4-l4", title: "Reschedule and no-show process", kind: "SOP", minutes: 10, summary: "Document outcome, set next action." },
    ],
    checklist: [
      "Scheduled or mock-scheduled 2 interviews",
      "Verified calendar/meeting details",
      "Drafted a reminder message",
      "Documented status and next action",
    ],
    shadowing: ["Watch mentor schedule 2 interviews and handle 1 reminder/reschedule/no-show example if available."],
    livePractice: ["Under supervision, schedule or mock-schedule 2 interviews; draft reminders for 2 candidates; update interview status with mentor review."],
    resources: [R.l2InterviewScheduling, R.l2InterviewProcess, R.calendlyGuide, R.outlookTeamsGuide, R.candidateTemplates],
    knowledgeCheck: {
      q: "Should no-shows be documented with a next action?",
      a: "Yes. And an interview isn't 'scheduled' until the candidate has the details.",
    },
    reflectionPrompt: "What breaks when Calendly, Outlook, Teams, and Apploi are not kept aligned?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description:
      "Complete a supervised mini-shift using current recruiting tasks.",
    objectives: [
      "Complete 5–8 mentor-assigned low-risk recruiting tasks",
      "Update candidate status, notes, communication, scheduling, follow-up",
      "Leave no candidate without a next step",
    ],
    lessons: [
      { id: "w2d5-l1", title: "State need review", kind: "Workflow", minutes: 10, summary: "Confirm today's needs before advancing candidates." },
      { id: "w2d5-l2", title: "Application review", kind: "SOP", minutes: 10, summary: "Move forward vs more info vs not selected." },
      { id: "w2d5-l3", title: "Phone screen practice", kind: "Live Practice", minutes: 15, summary: "Complete supervised screens." },
      { id: "w2d5-l4", title: "Interview scheduling practice", kind: "Live Practice", minutes: 15, summary: "Book, verify, remind, document." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No candidate left without next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list."],
    resources: [R.l2StateNeed, R.l2ResumeReview, R.l2InterviewScheduling, R.l2InterviewProcess],
    knowledgeCheck: {
      q: "Between state need review, application review, screening, scheduling, and reminders — which are Recruiting's owned work today?",
      a: "All of them, with escalation to leadership when state need or fit is unclear.",
    },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 mentor signoff required before Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: RecruitingDayModule[] = [
  day(3, 1, 11, {
    title: "Interview Preparation and Interview Notes",
    description: "Support interviews before and after they happen.",
    objectives: [
      "Confirm candidate has interview details and interviewer has candidate context",
      "Check that outcome is recorded after the interview",
      "Document or request outcome and next step",
    ],
    lessons: [
      { id: "w3d1-l1", title: "Interview prep checklist", kind: "SOP", minutes: 8, summary: "Everything ready before the meeting." },
      { id: "w3d1-l2", title: "Candidate context for interviewers", kind: "Workflow", minutes: 8, summary: "What the interviewer needs to see." },
      { id: "w3d1-l3", title: "Interview outcome notes", kind: "SOP", minutes: 10, summary: "Move forward, hold, second interview, not selected, offer recommendation." },
      { id: "w3d1-l4", title: "Next step decision", kind: "Workflow", minutes: 8, summary: "Set the next action so nothing drifts." },
    ],
    checklist: [
      "Prepared 2 candidate interview summaries",
      "Identified missing interview outcome on 2 completed interviews",
      "Added or requested next action",
    ],
    shadowing: ["Watch mentor prepare and close out interview records."],
    livePractice: ["Prepare 2 candidate interview summaries for mentor review; audit 2 completed interviews for missing outcome/next action."],
    resources: [R.l2InterviewProcess, R.l2InterviewScheduling, R.interviewScorecard],
    knowledgeCheck: {
      q: "Should interview outcomes sit blank after the interview?",
      a: "No — outcome and next action must be captured.",
    },
    reflectionPrompt: "What does a good interview note need to include so the next person is not guessing?",
  }),
  day(3, 2, 12, {
    title: "Interview Follow-Up and Candidate Experience",
    description: "Follow up with candidates after interviews without letting people drift.",
    objectives: [
      "Confirm status and next action for recently interviewed candidates",
      "Send approved follow-up or reminder if needed",
      "Handle not-selected respectfully using approved wording",
    ],
    lessons: [
      { id: "w3d2-l1", title: "Post-interview follow-up", kind: "SOP", minutes: 10, summary: "Cadence and content." },
      { id: "w3d2-l2", title: "Candidate status updates", kind: "Workflow", minutes: 8, summary: "Keep Apploi/current tracker current." },
      { id: "w3d2-l3", title: "Holding-pattern communication", kind: "Workflow", minutes: 8, summary: "How to communicate when a decision is pending." },
      { id: "w3d2-l4", title: "Not-selected communication awareness", kind: "SOP", minutes: 8, summary: "Approved process and template." },
    ],
    checklist: [
      "Drafted 3 post-interview follow-up messages",
      "Audited 5 recently interviewed candidates for missing next action",
      "Set follow-up dates",
    ],
    shadowing: ["Watch mentor handle post-interview follow-up."],
    livePractice: ["Draft 3 post-interview follow-up messages; audit 5 recently interviewed candidates."],
    resources: [R.l2InterviewProcess, R.candidateTemplates, R.notSelectedTemplate],
    knowledgeCheck: {
      q: "Should a candidate be left pending without an internal owner?",
      a: "No. Document who owns the decision and when follow-up is due.",
    },
    reflectionPrompt: "What kind of post-interview experience would make a candidate trust Blossom?",
  }),
  day(3, 3, 13, {
    title: "Can't Reach, Ghosted, Rescheduled, and No-Show Candidates",
    description: "Handle candidates who don't respond, miss interviews, or keep rescheduling.",
    objectives: [
      "Follow approved cadence before marking ghosted / can't reach",
      "Document attempts and outcomes",
      "Decide reschedule, final attempt, close, or manager review for no-shows",
    ],
    lessons: [
      { id: "w3d3-l1", title: "Candidate follow-up cadence", kind: "SOP", minutes: 8, summary: "How many attempts and over what window." },
      { id: "w3d3-l2", title: "No-show documentation", kind: "SOP", minutes: 8, summary: "Missed interview + next action." },
      { id: "w3d3-l3", title: "Ghosted / can't reach status", kind: "Workflow", minutes: 8, summary: "When to move a candidate there." },
      { id: "w3d3-l4", title: "When to close or manager-review", kind: "Workflow", minutes: 8, summary: "Judgment points before closing." },
    ],
    checklist: [
      "Audited 5 no-response/no-show candidates",
      "Recommended correct next action",
      "Wrote clear, respectful notes",
    ],
    shadowing: ["Watch mentor review stale/no-response candidates."],
    livePractice: ["Audit 5 no-response/no-show candidates and recommend next action."],
    resources: [R.l2InterviewScheduling, R.l2InterviewProcess, R.followUpCadence],
    knowledgeCheck: {
      q: "Should a candidate be marked ghosted after one missed call?",
      a: "No — follow current cadence before marking ghosted/can't reach.",
    },
    reflectionPrompt: "How do we avoid giving up too early while also keeping the pipeline clean?",
  }),
  day(3, 4, 14, {
    title: "Offer Recommendation and Offer Handoff",
    description: "Prepare candidates for offer while staying inside Recruiting's role boundary.",
    objectives: [
      "Confirm role, state/location, interviewer outcome, availability, start timeline, manager approval",
      "Route offer details to the correct owner",
      "Update candidate status and follow-up date",
    ],
    lessons: [
      { id: "w3d4-l1", title: "Offer recommendation basics", kind: "SOP", minutes: 10, summary: "What triggers an offer recommendation." },
      { id: "w3d4-l2", title: "Required candidate details", kind: "Workflow", minutes: 8, summary: "The information HR needs to move." },
      { id: "w3d4-l3", title: "Offer letter awareness", kind: "Overview", minutes: 8, summary: "Recruiting prepares the recommendation; HR owns compliance." },
      { id: "w3d4-l4", title: "HR / manager handoff", kind: "SOP", minutes: 10, summary: "Where and how to route." },
    ],
    checklist: [
      "Listed required offer handoff information",
      "Completed 2 mock offer handoff checklists",
      "Explained Recruiting vs HR ownership",
    ],
    shadowing: ["Watch mentor prepare or review an offer handoff."],
    livePractice: ["Complete 2 mock offer handoff checklists with mentor review."],
    resources: [R.l2OfferLetters, R.l2EmployeeOnboarding, R.hrHandoffChecklist, R.offerLetterTemplates],
    knowledgeCheck: {
      q: "Does Recruiting own payroll setup?",
      a: "No. Recruiting recommends/prepares; HR owns compliance and payroll setup.",
    },
    reflectionPrompt: "What information does HR need from Recruiting so the candidate does not get stuck?",
  }),
  day(3, 5, 15, {
    title: "HR Onboarding Handoff and Recruiting Boundaries",
    description: "Hand off accepted candidates cleanly to HR/onboarding.",
    objectives: [
      "Confirm accepted candidate status and handoff details",
      "Understand HR ownership of background checks, onboarding compliance, and employee setup",
      "Keep systems current so the candidate isn't lost between Recruiting and HR",
    ],
    lessons: [
      { id: "w3d5-l1", title: "Accepted candidate handoff", kind: "SOP", minutes: 10, summary: "What Recruiting confirms before handoff." },
      { id: "w3d5-l2", title: "Background check awareness", kind: "Overview", minutes: 8, summary: "HR owns background checks and employee file requirements." },
      { id: "w3d5-l3", title: "Onboarding logistics awareness", kind: "Overview", minutes: 8, summary: "What Recruiting supports vs owns." },
      { id: "w3d5-l4", title: "Recruiting boundary review", kind: "Workflow", minutes: 8, summary: "Recruiting vs HR ownership in 5 scenarios." },
    ],
    checklist: [
      "Completed 2 mock accepted-candidate handoffs",
      "Explained background check / onboarding ownership",
      "Explained what remains in Recruiting after handoff",
    ],
    shadowing: ["Watch mentor hand off an accepted candidate to HR or review an accepted-candidate record."],
    livePractice: ["Prepare 2 mock accepted-candidate handoffs; identify Recruiting vs HR ownership in 5 scenarios."],
    resources: [R.l2BackgroundChecks, R.l2Onboarding, R.l2EmployeeOnboarding, R.hrHandoffChecklist, R.viventiumOverview],
    knowledgeCheck: {
      q: "Is Recruiting the owner of final HR compliance?",
      a: "No. The candidate record must clearly show handoff status.",
    },
    reflectionPrompt: "Where is the line between Recruiting and HR?",
    signoffRequired: "Week 3 mentor signoff required before Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: RecruitingDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled Recruiting Queue Ownership — Part 1",
    description: "Own a small set of real recruiting tasks with mentor review.",
    objectives: [
      "Review assigned candidates and prioritize the day",
      "Complete assigned work updating required systems",
      "End the day with no assigned candidate lacking next action/follow-up",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning recruiting queue review", kind: "Workflow", minutes: 10, summary: "New applicants, overdue follow-ups, reminders, no-shows, post-interviews, offer/handoff items." },
      { id: "w4d1-l2", title: "Prioritizing candidates", kind: "SOP", minutes: 8, summary: "What to work first." },
      { id: "w4d1-l3", title: "Updating Apploi / current trackers", kind: "SOP", minutes: 10, summary: "Keep every required system aligned." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "Workflow", minutes: 10, summary: "No candidate closes the day without a next step." },
    ],
    checklist: [
      "Completed assigned queue (8–12 tasks)",
      "Updated required systems accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned recruiting tasks with mentor review."],
    resources: [R.l1RoleSop, R.l2ResumeReview, R.l2InterviewScheduling, R.l2InterviewProcess],
    knowledgeCheck: {
      q: "What must be true for a candidate before the day closes?",
      a: "Owner, status, next action, and follow-up date are all set.",
    },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled Recruiting Queue Ownership — Part 2",
    description: "Repeat controlled ownership with more independence.",
    objectives: [
      "Complete assigned queue with mentor checks only at midpoint and end of day",
      "Document blockers and escalations",
      "Escalate unclear candidates or urgent state needs to the correct owner",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "Workflow", minutes: 10, summary: "No candidate drifts today." },
      { id: "w4d2-l2", title: "Interview scheduling cleanup", kind: "SOP", minutes: 10, summary: "Keep Calendly/Outlook/Teams/Apploi aligned." },
      { id: "w4d2-l3", title: "Candidate communication documentation", kind: "SOP", minutes: 10, summary: "Every attempt logged, next follow-up set." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "Workflow", minutes: 8, summary: "Escalate blockers and urgent state needs." },
    ],
    checklist: [
      "Completed queue (10–15 tasks)",
      "Escalated blockers correctly",
      "No stale/unowned assigned candidate",
    ],
    shadowing: ["Minimal — learner performs work while mentor reviews."],
    livePractice: ["Own 10–15 assigned recruiting tasks."],
    resources: [R.l2InterviewScheduling, R.l2InterviewProcess, R.l2StateNeed],
    knowledgeCheck: {
      q: "Given a candidate with unclear state fit and pending decision, what's the right next action?",
      a: "Document ownership and escalate to the correct state leader or manager with a next follow-up date.",
    },
    reflectionPrompt: "What did you escalate and why?",
  }),
  day(4, 3, 18, {
    title: "Candidate Communication Quality Day",
    description: "Focus on tone, clarity, responsiveness, and documentation in candidate communication.",
    objectives: [
      "Make supervised candidate calls or draft/send approved texts/emails",
      "Keep language simple, warm, specific, professional",
      "Document outcome and next follow-up",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Warm candidate tone", kind: "Workflow", minutes: 8, summary: "Feels human, not scripted." },
      { id: "w4d3-l2", title: "Clear interview details", kind: "SOP", minutes: 8, summary: "When, where, how, with whom." },
      { id: "w4d3-l3", title: "Difficult or confused candidate questions", kind: "Workflow", minutes: 10, summary: "Route detail-heavy questions correctly." },
      { id: "w4d3-l4", title: "Documentation after communication", kind: "SOP", minutes: 8, summary: "Outcome, next follow-up, and any escalation." },
    ],
    checklist: [
      "Completed 3–5 candidate communications with mentor approval",
      "Notes updated accurately",
      "Mentor approved tone",
    ],
    shadowing: ["Mentor listens to call or reviews written messages."],
    livePractice: ["Complete 3–5 candidate communications with mentor approval."],
    resources: [R.candidateTemplates, R.l2InterviewScheduling, R.l2InterviewProcess, R.hrHandoffChecklist],
    knowledgeCheck: {
      q: "Between 'call me back' and 'Hi Sam — following up on your BCBA interview Thursday 2pm with Alicia; please confirm', which meets Blossom's standard?",
      a: "The second — clear, warm, specific.",
    },
    reflectionPrompt: "What candidate message are you proud of from today and why?",
  }),
  day(4, 4, 19, {
    title: "End-to-End Recruiting Simulation",
    description: "Complete a full recruiting simulation from application review through interview scheduling and HR handoff recommendation.",
    objectives: [
      "Complete candidate review, duplicate check, screen plan, interview schedule, communication notes, post-interview next action, handoff recommendation",
      "Pass mentor review against checklist",
    ],
    lessons: [
      { id: "w4d4-l1", title: "Application review simulation", kind: "Live Practice", minutes: 12, summary: "Full applicant workup." },
      { id: "w4d4-l2", title: "Candidate screen simulation", kind: "Live Practice", minutes: 12, summary: "Screen + notes." },
      { id: "w4d4-l3", title: "Interview scheduling simulation", kind: "Live Practice", minutes: 12, summary: "Book, verify, remind." },
      { id: "w4d4-l4", title: "Interview follow-up + offer/handoff simulation", kind: "Live Practice", minutes: 15, summary: "Close the loop through HR handoff." },
    ],
    checklist: [
      "Completed full simulation",
      "Passed mentor review",
      "Completed real task set alongside simulation",
    ],
    shadowing: ["None unless needed."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1RoleSop, R.l2InterviewScheduling, R.l2InterviewProcess, R.l2OfferLetters, R.candidateTemplates, R.apploiGuide, R.calendlyGuide, R.outlookTeamsGuide],
    knowledgeCheck: {
      q: "Name the 5 stages of a clean recruiting flow.",
      a: "Application review → screen → interview scheduled → interview follow-up → offer recommendation / HR handoff.",
    },
    reflectionPrompt: "What part of the full recruiting process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description: "Final review; manager confirms readiness for ongoing recruiting ownership.",
    objectives: [
      "Review training completion and live-work accuracy",
      "Confirm what the learner can own independently vs. still needs review",
      "Create a 30-day follow-up growth plan",
    ],
    lessons: [
      { id: "w4d5-l1", title: "Final knowledge review", kind: "Quiz", minutes: 20, summary: "10–15 questions across Apploi, pipeline, state needs, review, communication, scheduling, no-shows, follow-up, offer, handoff, boundaries." },
      { id: "w4d5-l2", title: "Readiness conversation", kind: "Reflection", minutes: 15, summary: "Frank conversation with manager." },
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
    livePractice: ["Learner runs a short recruiting queue review while manager observes."],
    resources: [R.l1RoleSop, R.role306090, R.roleDeepDive, R.l2InterviewScheduling, R.l2InterviewProcess, R.l2OfferLetters, R.l2EmployeeOnboarding],
    knowledgeCheck: {
      q: "Final: name any 3 of — Apploi basics, pipeline owner/status, state needs, resume review, communication, scheduling, Calendly/Outlook/Teams, no-shows, interview follow-up, offer recommendation, HR handoff, role boundaries.",
      a: "Any 3 correctly named with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about Recruiting that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into independent ownership with a 30-day plan.",
  }),
];

export const RECRUITING_DAYS: RecruitingDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getRecruitingDay(sourceModuleId: string): RecruitingDayModule | undefined {
  return RECRUITING_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalRecruitingMinutes(): number {
  return RECRUITING_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}