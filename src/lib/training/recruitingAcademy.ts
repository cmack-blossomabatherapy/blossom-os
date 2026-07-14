/**
 * Recruiting Department Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day · 4 lessons/module.
 * Trains a new Recruiting Coordinator / Recruiting team member on today's
 * Blossom recruiting process using today's tools (Apploi, Calendly, Outlook,
 * Teams, phone/email, current recruiting trackers) — NOT a future Blossom OS
 * recruiting workflow.
 *
 * Self-contained, mirrors `intakeAcademy.ts` so it plugs into the Training
 * Academy journey adapter without touching State Director, RBT, BCBA, or
 * Intake curricula.
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
  /** true = SOP not yet uploaded to the library; UI shows a pending badge. */
  pending?: boolean;
}

export interface RecruitingDayModule {
  /** Source module id — becomes `recruiting::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;      // 1..5 within the week
  dayInJourney: number;   // 1..20 across the whole journey
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
    goal: "Understand Blossom, the Recruiting Department's purpose, today's systems, the candidate experience, and basic pipeline ownership before touching candidate work independently." },
  { weekNumber: 2, title: "Week 2 · Job Needs, Application Review, Screening, and Interview Scheduling",
    goal: "Move from observation into supervised execution of common recruiting tasks." },
  { weekNumber: 3, title: "Week 3 · Interview Follow-Up, Offers, HR Handoff, and Pipeline Cleanup",
    goal: "Own more work with review, learn judgment points, and practice clean handoffs to HR and state/department leaders." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Quality, Speed, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real recruiting work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1RoleSop: { label: "L1 Recruiting Lead / Coordinator Role SOP", href: "/resource-library", pending: true },
  binderIndex: { label: "Recruiting Department Binder Index", href: "/resource-library", pending: true },
  roleDeepDive: { label: "Recruiting Lead / Coordinator Role Deep Dive", href: "/resource-library", pending: true },
  l2StateNeeds: { label: "L2 State Recruiting Need Review Process SOP", href: "/resource-library", pending: true },
  l2JobPosting: { label: "L2 Job Posting — Current Operations", href: "/resource-library", pending: true },
  l2ResumeReview: { label: "L2 Resume Review — Current Operations", href: "/resource-library", pending: true },
  l2InterviewSchedSop: { label: "L2 Interview Scheduling Process SOP", href: "/resource-library", pending: true },
  l2InterviewOps: { label: "L2 Interview Process — Current Operations", href: "/resource-library", pending: true },
  l2OfferLetters: { label: "L2 Offer Letters — Current Operations", href: "/resource-library", pending: true },
  l2OnboardingLogistics: { label: "L2 Employee Onboarding Logistics Process SOP", href: "/resource-library", pending: true },
  l2BackgroundChecks: { label: "L2 Background Checks — Current Operations", href: "/resource-library", pending: true },
  l2OnboardingOps: { label: "L2 Onboarding — Current Operations", href: "/resource-library", pending: true },
  apploiGuide: { label: "Apploi Guide", href: "/resource-library", pending: true },
  calendlyGuide: { label: "Calendly Guide", href: "/resource-library", pending: true },
  outlookTeamsGuide: { label: "Outlook / Teams Interview Scheduling Guide", href: "/resource-library", pending: true },
  candidateTemplates: { label: "Candidate Communication Templates", href: "/resource-library", pending: true },
  phoneScreenScript: { label: "Candidate Phone Screen Script", href: "/resource-library", pending: true },
  reviewScorecard: { label: "Candidate Review Scorecard", href: "/resource-library", pending: true },
  interviewScorecard: { label: "Interview Scorecard", href: "/resource-library", pending: true },
  notSelectedTemplate: { label: "Not-Selected Template", href: "/resource-library", pending: true },
  hrHandoffChecklist: { label: "HR / Recruiting Handoff Checklist", href: "/resource-library", pending: true },
  offerLetterTemplate: { label: "Offer Letter Templates", href: "/resource-library", pending: true },
  stateHiringTracker: { label: "State Hiring Needs Tracker", href: "/resource-library", pending: true },
  viventiumHandoff: { label: "Viventium HR Handoff Overview", href: "/resource-library", pending: true },
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
      "Start with Blossom's company welcome, then learn what Recruiting does and why it matters. Recruiting is one of Blossom's biggest growth engines — every candidate must have an owner, status, next action, and follow-up date.",
    objectives: [
      "Complete the existing Welcome to Blossom experience",
      "Explain what Recruiting owns and does not own today",
      "Explain the candidate experience standard",
      "Explain the owner / status / next action / follow-up date rule",
    ],
    lessons: [
      { id: "w1d1-l1", title: "Welcome to Blossom", kind: "Video", minutes: 20, summary: "Open and complete the existing Welcome to Blossom module." },
      { id: "w1d1-l2", title: "What Recruiting owns today", kind: "Overview", minutes: 10, summary: "Candidate movement, communication, interview scheduling, follow-up, offer recommendation, clean HR handoff." },
      { id: "w1d1-l3", title: "What Recruiting does not own", kind: "Overview", minutes: 8, summary: "Not payroll, HR compliance, clinical credentialing, CentralReach clinical setup, performance management, or state director escalation closure." },
      { id: "w1d1-l4", title: "The candidate experience standard", kind: "Workflow", minutes: 10, summary: "Fast, warm, direct, specific — a candidate should feel guided, never routed." },
    ],
    checklist: [
      "Completed Welcome to Blossom",
      "Can explain what Recruiting owns",
      "Can explain what Recruiting does not own",
      "Can explain the owner / status / next action / follow-up date rule",
    ],
    shadowing: ["Sit with the Recruiting Lead / Assistant or mentor for 30–60 minutes and watch how they start their day."],
    livePractice: ["No live candidate ownership yet — observe only."],
    resources: [R.welcome, R.l1RoleSop, R.binderIndex, R.l2StateNeeds],
    knowledgeCheck: {
      q: "What four things should every candidate have before you leave it?",
      a: "Owner, status, next action, follow-up date. Recruiting does not own payroll or final HR compliance.",
    },
    reflectionPrompt: "In your own words, why does Recruiting matter to Blossom's ability to grow and serve families?",
  }),
  day(1, 2, 2, {
    title: "Current Recruiting Systems Tour — Apploi, Calendly, Outlook, Teams, Phone, Trackers",
    description:
      "Learn every system Recruiting touches today and what each is used for: Apploi, Calendly, Outlook, Teams, phone/email, and today's state recruiting need trackers.",
    objectives: [
      "Identify today's main recruiting tools",
      "Find candidate/application, status, and next action in Apploi",
      "Explain how Calendly, Outlook, and Teams work together today",
    ],
    lessons: [
      { id: "w1d2-l1", title: "Apploi basics", kind: "Workflow", minutes: 15, summary: "Where candidates/applications live, pipeline/status fields, candidate notes." },
      { id: "w1d2-l2", title: "Calendly scheduling basics", kind: "SOP", minutes: 10, summary: "Interview scheduling links, availability, booking flow." },
      { id: "w1d2-l3", title: "Outlook / Teams interview coordination", kind: "SOP", minutes: 10, summary: "Creating and verifying interview invitations and meeting links." },
      { id: "w1d2-l4", title: "Phone/email + current tracker & state need awareness", kind: "SOP", minutes: 10, summary: "How reminders are sent, where completion/no-show/reschedule notes go, where state needs live today." },
    ],
    checklist: [
      "Located Apploi candidates, statuses, and notes",
      "Reviewed a Calendly link and Outlook/Teams invite",
      "Identified where candidate status and next action must be updated",
    ],
    shadowing: ["Watch mentor schedule or confirm one candidate interview end-to-end."],
    livePractice: ["In a training/sandbox, locate 3 sample candidates and point out owner / status / next action / follow-up date."],
    resources: [R.l2InterviewSchedSop, R.l2InterviewOps, R.l2StateNeeds, R.apploiGuide, R.calendlyGuide, R.outlookTeamsGuide],
    knowledgeCheck: {
      q: "What system is a major current source for recruiting applicants, and which tools coordinate interview scheduling today?",
      a: "Apploi is a major current source. Calendly, Outlook, and Teams coordinate interview scheduling — all must be kept aligned.",
    },
    reflectionPrompt: "Which recruiting system is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "Candidate Pipeline Basics",
    description:
      "Learn the candidate pipeline stages and how to prevent candidates from falling through the cracks.",
    objectives: [
      "Name the core candidate pipeline statuses",
      "Perform a duplicate/existing candidate check",
      "Choose the correct next action for any candidate",
    ],
    lessons: [
      { id: "w1d3-l1", title: "What counts as a candidate", kind: "Overview", minutes: 6, summary: "Sources, timing, and when an application becomes a candidate." },
      { id: "w1d3-l2", title: "Candidate pipeline statuses", kind: "Workflow", minutes: 10, summary: "Application received, review needed, phone screen, interview scheduled, interview completed, follow-up needed, offer, accepted, not selected, no-show, ghosted, handoff." },
      { id: "w1d3-l3", title: "Candidate owner and next action", kind: "SOP", minutes: 8, summary: "Every candidate must have an owner and a specific next action." },
      { id: "w1d3-l4", title: "Duplicate / existing candidate check", kind: "SOP", minutes: 8, summary: "Search phone, email, and name before creating a new record or sending duplicate communication." },
    ],
    checklist: [
      "Named the core candidate pipeline stages",
      "Performed candidate duplicate/existing record check with mentor",
      "Recommended next action for 3 candidates",
    ],
    shadowing: ["Watch mentor review 5 candidates and decide next actions."],
    livePractice: ["Under mentor supervision, review 3 candidates and recommend the correct next action."],
    resources: [R.l1RoleSop, R.l2ResumeReview, R.l2InterviewSchedSop],
    knowledgeCheck: {
      q: "Should a candidate ever be left without a next action, and what should you confirm before moving them forward?",
      a: "No. Confirm role, state/location, availability, qualifications/certification, and current need.",
    },
    reflectionPrompt: "What can go wrong if candidates are left in the wrong status?",
  }),
  day(1, 4, 4, {
    title: "Candidate Communication and Follow-Up",
    description:
      "Learn how Recruiting communicates with candidates in a clear, warm, professional, and documented way.",
    objectives: [
      "Meet first-response expectations",
      "Write clear scheduling, reminder, reschedule, and not-selected messages",
      "Document every contact attempt with outcome and next follow-up date",
    ],
    lessons: [
      { id: "w1d4-l1", title: "Candidate communication tone", kind: "SOP", minutes: 10, summary: "Fast, warm, direct, specific, professional." },
      { id: "w1d4-l2", title: "First response expectations", kind: "Workflow", minutes: 8, summary: "When candidates should hear back and from whom." },
      { id: "w1d4-l3", title: "Interview confirmation and reminder messages", kind: "SOP", minutes: 10, summary: "Approved wording for confirm / remind / reschedule." },
      { id: "w1d4-l4", title: "Documenting calls, emails, texts", kind: "SOP", minutes: 8, summary: "Log every attempt and set the next follow-up date." },
    ],
    checklist: [
      "Drafted an approved candidate scheduling message",
      "Drafted an approved interview reminder",
      "Role-played a candidate communication",
      "Can document a communication attempt correctly",
    ],
    shadowing: ["Listen to mentor make 2–3 candidate calls or review recent candidate messages."],
    livePractice: ["Draft 2 candidate texts/emails and 1 interview reminder for mentor review; role-play a short candidate screen or scheduling call."],
    resources: [R.l2InterviewSchedSop, R.l2InterviewOps, R.candidateTemplates, R.outlookTeamsGuide],
    knowledgeCheck: {
      q: "Should every candidate contact attempt be documented, and what must be added after a missed candidate call?",
      a: "Yes — every attempt is documented; add the outcome and the next follow-up date.",
    },
    reflectionPrompt: "What makes a candidate feel guided instead of ignored?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1 and confirm you understand the Recruiting role, systems, candidate experience, and basic pipeline handling.",
    objectives: [
      "Review 3 sample candidates with mentor and explain status, next action, and handoff readiness",
      "Identify anything still unclear",
      "Complete manager/mentor signoff for Week 1",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering systems, owner/status, communication documentation, next action, interview scheduling, boundaries." },
      { id: "w1d5-l2", title: "Recruiting role boundary check", kind: "Overview", minutes: 8, summary: "Recruiting vs HR vs state director vs clinical credentialing." },
      { id: "w1d5-l3", title: "Candidate pipeline walkthrough", kind: "Workflow", minutes: 15, summary: "Walk 3 sample candidates end-to-end." },
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
    resources: [R.l1RoleSop, R.l2StateNeeds, R.l2InterviewSchedSop],
    knowledgeCheck: {
      q: "Name three things Recruiting does not own.",
      a: "Payroll, final HR compliance decisions, clinical credentialing, CentralReach clinical setup, employee performance management, or state director escalation closure.",
    },
    reflectionPrompt: "What part of Recruiting still feels confusing?",
    signoffRequired: "Week 1 manager signoff before starting Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: RecruitingDayModule[] = [
  day(2, 1, 6, {
    title: "State Recruiting Needs and Job Posting Awareness",
    description:
      "Learn how Recruiting connects candidate activity to real staffing needs by state, clinic, role, and urgency.",
    objectives: [
      "Explain why state recruiting needs must be confirmed before pushing candidates forward",
      "Identify role/state/location fit",
      "Know when to ask a state leader or manager for clarification",
    ],
    lessons: [
      { id: "w2d1-l1", title: "State recruiting need review", kind: "SOP", minutes: 12, summary: "How to confirm current state/role need before scheduling." },
      { id: "w2d1-l2", title: "Role and location awareness", kind: "Workflow", minutes: 8, summary: "RBT/BT, BCBA, state support, office roles — where each is needed." },
      { id: "w2d1-l3", title: "Job posting basics", kind: "SOP", minutes: 10, summary: "Why postings must match the real need." },
      { id: "w2d1-l4", title: "When to ask for clarification", kind: "Overview", minutes: 8, summary: "Escalate to state leader or manager when the need is unclear." },
    ],
    checklist: [
      "Reviewed current state staffing needs with mentor",
      "Matched 5 sample candidates to current state/role needs",
      "Identified 1 case requiring clarification from leadership",
    ],
    shadowing: ["Watch mentor compare current state recruiting needs to open applicants."],
    livePractice: ["Match 5 sample candidates/applications to current state/role needs with mentor review."],
    resources: [R.l2StateNeeds, R.l2JobPosting, R.stateHiringTracker],
    knowledgeCheck: {
      q: "Should Recruiting push every candidate forward without checking state/role fit?",
      a: "No — confirm role, state/location, availability, qualifications, and current need first.",
    },
    reflectionPrompt: "How can Recruiting create problems if we move candidates forward without confirming the real state need?",
  }),
  day(2, 2, 7, {
    title: "Resume and Application Review",
    description:
      "Learn how to review applications/resumes and decide whether a candidate should move forward, needs more information, or should not be moved forward.",
    objectives: [
      "Review an application/resume for role fit",
      "Identify missing information",
      "Recommend the correct next step",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Application review basics", kind: "SOP", minutes: 10, summary: "Contact info, role, location, availability, employment history, notes." },
      { id: "w2d2-l2", title: "Resume review basics", kind: "Workflow", minutes: 10, summary: "Qualification and experience signals per role." },
      { id: "w2d2-l3", title: "Role-specific signals", kind: "Overview", minutes: 8, summary: "RBT certification, BCBA credential status, office role competencies." },
      { id: "w2d2-l4", title: "Red flags and manager review", kind: "SOP", minutes: 8, summary: "When to escalate before moving forward." },
    ],
    checklist: [
      "Reviewed 5 candidate applications",
      "Correctly identified missing information",
      "Recommended correct next step with mentor approval",
    ],
    shadowing: ["Watch mentor review 5 applications and explain decisions."],
    livePractice: ["Under supervision, review 5 candidate applications and recommend the next step."],
    resources: [R.l2ResumeReview, R.l2JobPosting, R.reviewScorecard],
    knowledgeCheck: {
      q: "Should missing contact information be ignored, and should unclear qualifications be escalated?",
      a: "No, missing info is never ignored. Yes, unclear qualifications go to manager review.",
    },
    reflectionPrompt: "What makes a candidate ready for a phone screen or interview?",
  }),
  day(2, 3, 8, {
    title: "Phone Screen / Initial Candidate Screen",
    description:
      "Learn how to conduct or support the first candidate screen.",
    objectives: [
      "Confirm identity, role, and interest",
      "Confirm location/state, availability, certification/experience",
      "Document screen notes and decide next action",
    ],
    lessons: [
      { id: "w2d3-l1", title: "Phone screen purpose", kind: "Overview", minutes: 6, summary: "Why the first screen matters and what it decides." },
      { id: "w2d3-l2", title: "What to confirm", kind: "SOP", minutes: 10, summary: "Location, availability, schedule preference, certification, start timeline, professionalism." },
      { id: "w2d3-l3", title: "Candidate questions and expectations", kind: "Workflow", minutes: 10, summary: "Answer basics; route detailed HR/pay/benefit questions to the correct person." },
      { id: "w2d3-l4", title: "Screen notes and next step", kind: "SOP", minutes: 8, summary: "Document clearly; decide schedule, request info, manager review, not selected, or follow-up." },
    ],
    checklist: [
      "Completed phone screen role-play",
      "Documented screen notes",
      "Can identify when to escalate a candidate question",
    ],
    shadowing: ["Listen to mentor conduct 2 phone screens."],
    livePractice: ["Role-play 2 phone screens with mentor; conduct or co-conduct 1 low-risk screen if manager approves."],
    resources: [R.l2InterviewOps, R.phoneScreenScript, R.candidateTemplates],
    knowledgeCheck: {
      q: "Should Recruiting promise pay/benefits details it is not authorized to promise?",
      a: "No. Route detailed HR/pay/benefit questions to the correct owner and document clearly.",
    },
    reflectionPrompt: "What information must Recruiting gather before an interview is worth scheduling?",
  }),
  day(2, 4, 9, {
    title: "Interview Scheduling, Reminders, Reschedules, and No-Shows",
    description:
      "Learn the current interview scheduling process and how to keep the calendar and candidate record clean.",
    objectives: [
      "Schedule an interview end-to-end using Calendly + Outlook/Teams",
      "Send approved reminders",
      "Document reschedules and no-shows",
    ],
    lessons: [
      { id: "w2d4-l1", title: "Scheduling with Calendly", kind: "SOP", minutes: 10, summary: "Availability, links, and confirmation." },
      { id: "w2d4-l2", title: "Outlook / Teams interview invitations", kind: "SOP", minutes: 10, summary: "Verify date/time, meeting link/location, interviewer." },
      { id: "w2d4-l3", title: "Candidate reminders", kind: "Workflow", minutes: 8, summary: "Approved reminder wording and timing." },
      { id: "w2d4-l4", title: "Reschedule and no-show process", kind: "SOP", minutes: 10, summary: "Document outcome and set next action." },
    ],
    checklist: [
      "Scheduled or mock-scheduled 2 interviews",
      "Verified calendar/meeting details",
      "Drafted reminder message",
      "Documented status and next action",
    ],
    shadowing: ["Watch mentor schedule 2 interviews and handle 1 reminder/reschedule/no-show example."],
    livePractice: ["Under supervision, schedule or mock-schedule 2 interviews and draft reminders for 2 candidates."],
    resources: [R.l2InterviewSchedSop, R.l2InterviewOps, R.calendlyGuide, R.outlookTeamsGuide, R.candidateTemplates],
    knowledgeCheck: {
      q: "Should an interview be considered scheduled if the candidate does not have the details?",
      a: "No. Calendly, Outlook, Teams, and Apploi must all reflect the same confirmed details.",
    },
    reflectionPrompt: "What breaks when Calendly, Outlook, Teams, and Apploi are not kept aligned?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description:
      "Complete a supervised mini-shift using current recruiting tasks.",
    objectives: [
      "Complete a mini-shift with mentor review",
      "Leave no candidate without a next step",
      "Get manager signoff for Week 2",
    ],
    lessons: [
      { id: "w2d5-l1", title: "State need review", kind: "Live Practice", minutes: 10, summary: "Confirm needs before pushing candidates." },
      { id: "w2d5-l2", title: "Application review", kind: "Live Practice", minutes: 10, summary: "Review, decide next step." },
      { id: "w2d5-l3", title: "Phone screen practice", kind: "Live Practice", minutes: 15, summary: "Screen, document, decide." },
      { id: "w2d5-l4", title: "Interview scheduling practice", kind: "Live Practice", minutes: 15, summary: "Schedule + verify + reminder." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No candidate left without a next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review."],
    livePractice: ["Complete mini-shift task list (5–8 low-risk recruiting tasks)."],
    resources: [R.l2StateNeeds, R.l2ResumeReview, R.l2InterviewSchedSop],
    knowledgeCheck: {
      q: "What must be true about every candidate at end-of-day?",
      a: "Owner, status, next action, and follow-up date are set.",
    },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Week 2 manager signoff before starting Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: RecruitingDayModule[] = [
  day(3, 1, 11, {
    title: "Interview Preparation and Interview Notes",
    description:
      "Learn how to support interviews before and after they happen.",
    objectives: [
      "Confirm candidate has interview details",
      "Confirm interviewer has candidate context",
      "Ensure interview outcome and next action are recorded",
    ],
    lessons: [
      { id: "w3d1-l1", title: "Interview prep checklist", kind: "SOP", minutes: 10, summary: "What must be true before the interview starts." },
      { id: "w3d1-l2", title: "Candidate context for interviewers", kind: "Workflow", minutes: 8, summary: "Summarize candidate for the interviewer if required." },
      { id: "w3d1-l3", title: "Interview outcome notes", kind: "SOP", minutes: 10, summary: "Move forward, hold, second interview, not selected, offer recommendation, follow-up needed." },
      { id: "w3d1-l4", title: "Next step decision", kind: "Workflow", minutes: 8, summary: "Every completed interview must have a next step." },
    ],
    checklist: [
      "Prepared 2 interview summaries",
      "Identified missing interview outcomes",
      "Added or requested next action for 2 interviews",
    ],
    shadowing: ["Watch mentor prepare and close out interview records."],
    livePractice: ["Prepare 2 candidate interview summaries for mentor review; review 2 completed interviews and identify missing outcome/next action."],
    resources: [R.l2InterviewOps, R.l2InterviewSchedSop, R.interviewScorecard],
    knowledgeCheck: {
      q: "Should interview outcomes sit blank after the interview?",
      a: "No. Every completed interview needs an outcome and a next action.",
    },
    reflectionPrompt: "What does a good interview note need to include so the next person is not guessing?",
  }),
  day(3, 2, 12, {
    title: "Interview Follow-Up and Candidate Experience",
    description:
      "Learn how to follow up with candidates after interviews without letting people drift.",
    objectives: [
      "Audit recently interviewed candidates for missing next action",
      "Send approved follow-up messages",
      "Handle not-selected communication respectfully",
    ],
    lessons: [
      { id: "w3d2-l1", title: "Post-interview follow-up", kind: "SOP", minutes: 10, summary: "Cadence and ownership of decision." },
      { id: "w3d2-l2", title: "Candidate status updates", kind: "Workflow", minutes: 8, summary: "Keep Apploi/current tracker current." },
      { id: "w3d2-l3", title: "Holding pattern communication", kind: "Workflow", minutes: 8, summary: "Keep candidates warm when decisions are pending." },
      { id: "w3d2-l4", title: "Not-selected communication awareness", kind: "SOP", minutes: 8, summary: "Use approved template, document respectfully." },
    ],
    checklist: [
      "Drafted 3 post-interview follow-up messages",
      "Audited 5 recently interviewed candidates",
      "Set next actions and follow-up dates",
    ],
    shadowing: ["Watch mentor handle post-interview follow-up."],
    livePractice: ["Draft 3 post-interview follow-up messages; audit 5 candidates for missing next action."],
    resources: [R.l2InterviewOps, R.candidateTemplates, R.notSelectedTemplate],
    knowledgeCheck: {
      q: "Should a candidate be left pending without an internal owner?",
      a: "No. Every pending decision has an internal owner and a follow-up date.",
    },
    reflectionPrompt: "What kind of post-interview experience would make a candidate trust Blossom?",
  }),
  day(3, 3, 13, {
    title: "Can't Reach, Ghosted, Rescheduled, and No-Show Candidates",
    description:
      "Learn how to handle candidates who do not respond, miss interviews, or keep rescheduling.",
    objectives: [
      "Follow the approved follow-up cadence",
      "Document no-shows factually and respectfully",
      "Decide when to reschedule, close, or escalate",
    ],
    lessons: [
      { id: "w3d3-l1", title: "Candidate follow-up cadence", kind: "SOP", minutes: 10, summary: "Approved attempts before marking ghosted/can't reach." },
      { id: "w3d3-l2", title: "No-show documentation", kind: "SOP", minutes: 8, summary: "Missed interview, next action, tone." },
      { id: "w3d3-l3", title: "Ghosted / can't reach status", kind: "Workflow", minutes: 8, summary: "When and how to mark, and what happens next." },
      { id: "w3d3-l4", title: "When to close or manager review", kind: "Workflow", minutes: 8, summary: "Judgment calls that need escalation." },
    ],
    checklist: [
      "Audited 5 no-response / no-show candidates",
      "Recommended correct next action",
      "Wrote clear, respectful notes",
    ],
    shadowing: ["Watch mentor review stale / no-response candidates."],
    livePractice: ["Audit 5 no-response/no-show candidates and recommend next action."],
    resources: [R.l2InterviewSchedSop, R.l2InterviewOps],
    knowledgeCheck: {
      q: "Should a candidate be marked ghosted after one missed call?",
      a: "No — follow the approved cadence before marking ghosted, and always document.",
    },
    reflectionPrompt: "How do we avoid giving up too early while also keeping the pipeline clean?",
  }),
  day(3, 4, 14, {
    title: "Offer Recommendation and Offer Handoff",
    description:
      "Learn what Recruiting must prepare when a candidate is ready for an offer — while staying inside Recruiting's current role boundary.",
    objectives: [
      "Confirm required candidate details for offer handoff",
      "Understand recommendation vs HR ownership",
      "Route offer details to the correct owner",
    ],
    lessons: [
      { id: "w3d4-l1", title: "Offer recommendation basics", kind: "SOP", minutes: 10, summary: "Role, state/location, interviewer outcome, availability, start timeline, manager approval." },
      { id: "w3d4-l2", title: "Required candidate details", kind: "Workflow", minutes: 8, summary: "What must be complete before offer handoff." },
      { id: "w3d4-l3", title: "Offer letter awareness", kind: "Overview", minutes: 8, summary: "Understand — do not create — offer letters outside Recruiting's ownership." },
      { id: "w3d4-l4", title: "HR / manager handoff", kind: "SOP", minutes: 10, summary: "Route offer details using current process; update status and follow-up date." },
    ],
    checklist: [
      "Listed required offer handoff information",
      "Completed 2 mock offer handoff checklists",
      "Explained Recruiting vs HR ownership",
    ],
    shadowing: ["Watch mentor prepare or review an offer handoff."],
    livePractice: ["Complete 2 mock offer handoff checklists with mentor review."],
    resources: [R.l2OfferLetters, R.l2OnboardingLogistics, R.hrHandoffChecklist, R.offerLetterTemplate],
    knowledgeCheck: {
      q: "Does Recruiting own payroll setup?",
      a: "No. Offer handoff must include role, state/location, start timeline, and approval — HR owns compliance and setup.",
    },
    reflectionPrompt: "What information does HR need from Recruiting so the candidate does not get stuck?",
  }),
  day(3, 5, 15, {
    title: "HR Onboarding Handoff and Recruiting Boundaries",
    description:
      "Learn how Recruiting hands off accepted candidates to HR/onboarding and how to avoid confusion after the handoff.",
    objectives: [
      "Complete an accepted-candidate handoff",
      "Explain background check and onboarding ownership",
      "Explain what remains in Recruiting after handoff",
    ],
    lessons: [
      { id: "w3d5-l1", title: "Accepted candidate handoff", kind: "SOP", minutes: 10, summary: "Confirm required handoff details and status update." },
      { id: "w3d5-l2", title: "Background check awareness", kind: "Overview", minutes: 8, summary: "HR owns background checks and compliance." },
      { id: "w3d5-l3", title: "Onboarding logistics awareness", kind: "Overview", minutes: 8, summary: "Employee setup, compliance, official file." },
      { id: "w3d5-l4", title: "Recruiting boundary review", kind: "Workflow", minutes: 8, summary: "Recruiting can track responsiveness and start-readiness — not compliance." },
    ],
    checklist: [
      "Completed accepted-candidate handoff practice",
      "Explained background check / onboarding ownership",
      "Identified what remains in Recruiting after handoff",
    ],
    shadowing: ["Watch mentor hand off an accepted candidate to HR or review an accepted-candidate record."],
    livePractice: ["Prepare 2 mock accepted-candidate handoffs; identify Recruiting vs HR ownership in 5 scenarios."],
    resources: [R.l2BackgroundChecks, R.l2OnboardingOps, R.l2OnboardingLogistics, R.hrHandoffChecklist, R.viventiumHandoff],
    knowledgeCheck: {
      q: "Is Recruiting the owner of final HR compliance?",
      a: "No. Recruiting hands off cleanly; HR owns background checks, compliance, and employee setup.",
    },
    reflectionPrompt: "Where is the line between Recruiting and HR?",
    signoffRequired: "Week 3 manager signoff before starting Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: RecruitingDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled Recruiting Queue Ownership — Part 1",
    description:
      "Own a small set of real recruiting tasks with mentor review.",
    objectives: [
      "Run a morning recruiting queue review",
      "Prioritize candidates correctly",
      "End the day with no assigned candidate lacking a next action",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning recruiting queue review", kind: "Workflow", minutes: 10, summary: "New applicants, overdue follow-ups, interview reminders, no-shows, post-interview, offer/handoff." },
      { id: "w4d1-l2", title: "Prioritizing candidates", kind: "SOP", minutes: 10, summary: "Urgency + state need + candidate stage." },
      { id: "w4d1-l3", title: "Updating Apploi / current trackers", kind: "SOP", minutes: 10, summary: "Keep systems aligned." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "Workflow", minutes: 8, summary: "Every assigned candidate has owner/status/next action/follow-up date." },
    ],
    checklist: [
      "Completed assigned queue (8–12 tasks)",
      "Updated required systems accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned recruiting tasks with mentor review."],
    resources: [R.l1RoleSop, R.l2ResumeReview, R.l2InterviewSchedSop, R.l2InterviewOps],
    knowledgeCheck: {
      q: "What is the end-of-day standard for every assigned candidate?",
      a: "Owner, status, next action, and follow-up date are set.",
    },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled Recruiting Queue Ownership — Part 2",
    description:
      "Repeat controlled ownership with more independence.",
    objectives: [
      "Own a larger queue with midpoint mentor checks",
      "Escalate blockers correctly",
      "Document decisions clearly",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "SOP", minutes: 10, summary: "Nothing waits without a next action." },
      { id: "w4d2-l2", title: "Interview scheduling cleanup", kind: "Workflow", minutes: 10, summary: "Calendly, Outlook, Teams, Apploi aligned." },
      { id: "w4d2-l3", title: "Candidate communication documentation", kind: "SOP", minutes: 8, summary: "Every attempt logged." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "Workflow", minutes: 8, summary: "Unclear candidates, urgent state needs, offer/handoff issues." },
    ],
    checklist: [
      "Completed 10–15 assigned tasks",
      "Escalated blockers correctly",
      "No stale/unowned assigned candidate",
    ],
    shadowing: ["Minimal — mentor checks at midpoint and end of day."],
    livePractice: ["Own 10–15 assigned recruiting tasks."],
    resources: [R.l2InterviewSchedSop, R.l2InterviewOps, R.l2StateNeeds],
    knowledgeCheck: {
      q: "When should you escalate?",
      a: "For unclear candidates, urgent state staffing needs, and offer/handoff issues.",
    },
    reflectionPrompt: "What did you escalate today and why?",
  }),
  day(4, 3, 18, {
    title: "Candidate Communication Quality Day",
    description:
      "Focus on tone, clarity, responsiveness, and documentation in candidate communication.",
    objectives: [
      "Deliver warm, specific candidate messages",
      "Avoid promising details outside Recruiting's authority",
      "Document every outcome and next follow-up",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Warm candidate tone", kind: "Workflow", minutes: 10, summary: "Fast, warm, direct, specific, professional." },
      { id: "w4d3-l2", title: "Clear interview details", kind: "SOP", minutes: 8, summary: "Date, time, location/link, interviewer, prep." },
      { id: "w4d3-l3", title: "Difficult or confused candidate questions", kind: "Workflow", minutes: 10, summary: "Route detailed HR/pay/benefit questions properly." },
      { id: "w4d3-l4", title: "Documentation after communication", kind: "SOP", minutes: 8, summary: "Outcome + next follow-up, every time." },
    ],
    checklist: [
      "Completed 3–5 candidate communications",
      "Notes updated accurately",
      "Mentor approved tone",
    ],
    shadowing: ["Mentor listens to call or reviews written messages."],
    livePractice: ["Complete 3–5 candidate communications with mentor approval."],
    resources: [R.candidateTemplates, R.l2InterviewSchedSop, R.l2InterviewOps],
    knowledgeCheck: {
      q: "Which is better — 'call me' or a specific message with next steps?",
      a: "A specific message with next steps. Vague messages hurt candidate trust.",
    },
    reflectionPrompt: "What candidate message are you proud of from today and why?",
  }),
  day(4, 4, 19, {
    title: "End-to-End Recruiting Simulation",
    description:
      "Complete a full recruiting simulation from application review through interview scheduling and HR handoff recommendation.",
    objectives: [
      "Complete a full simulated recruiting workflow",
      "Pass mentor quality review",
      "Complete real tasks after the simulation",
    ],
    lessons: [
      { id: "w4d4-l1", title: "Application review simulation", kind: "Live Practice", minutes: 15, summary: "Review + duplicate check + next step." },
      { id: "w4d4-l2", title: "Candidate screen simulation", kind: "Live Practice", minutes: 15, summary: "Screen, document, decide." },
      { id: "w4d4-l3", title: "Interview scheduling simulation", kind: "Live Practice", minutes: 15, summary: "Calendly + Outlook/Teams + reminder." },
      { id: "w4d4-l4", title: "Interview follow-up + offer/handoff simulation", kind: "Live Practice", minutes: 20, summary: "Follow-up + offer recommendation + HR handoff." },
    ],
    checklist: [
      "Completed the full simulation",
      "Passed mentor review",
      "Completed the real task set that followed",
    ],
    shadowing: ["None unless requested."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l1RoleSop, R.l2InterviewSchedSop, R.l2InterviewOps, R.l2OfferLetters, R.l2OnboardingLogistics, R.candidateTemplates, R.apploiGuide, R.calendlyGuide, R.outlookTeamsGuide],
    knowledgeCheck: {
      q: "What are the core stages of a clean recruiting lifecycle?",
      a: "Application/source → review → screen → interview → follow-up → offer recommendation → HR/onboarding handoff → start-readiness.",
    },
    reflectionPrompt: "What part of the full recruiting process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description:
      "Final review; manager confirms readiness for ongoing recruiting ownership.",
    objectives: [
      "Review training completion and live-work accuracy",
      "Confirm what the learner can own independently vs. still needs review",
      "Create a 30-day follow-up growth plan",
    ],
    lessons: [
      { id: "w4d5-l1", title: "Final knowledge review", kind: "Quiz", minutes: 20, summary: "10–15 questions across the whole recruiting process." },
      { id: "w4d5-l2", title: "Readiness conversation", kind: "Reflection", minutes: 15, summary: "Frank conversation with manager on readiness." },
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
    livePractice: ["Run a short recruiting queue review while manager observes."],
    resources: [R.l1RoleSop, R.l2InterviewSchedSop, R.l2InterviewOps, R.l2OfferLetters, R.l2OnboardingLogistics, R.roleDeepDive],
    knowledgeCheck: {
      q: "Final: name any 3 of — Apploi basics, candidate owner/status/next action/follow-up, state recruiting needs, resume/application review, candidate communication, interview scheduling, Calendly/Outlook/Teams coordination, no-shows/can't reach, interview follow-up, offer recommendation, HR/onboarding handoff, Recruiting role boundaries.",
      a: "Any 3 correctly named topics with a one-line description each.",
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