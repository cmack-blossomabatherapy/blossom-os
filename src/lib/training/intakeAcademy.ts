/**
 * Intake Department Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day · 4 lessons/module.
 * Trains a new Intake Coordinator on today's Blossom intake process using
 * today's tools (Monday, Outlook, PandaDoc, CTM, Retell after-hours, etc.).
 *
 * This file is intentionally self-contained (like `bcbaAcademy.ts`) so it can
 * be plugged into the Training Academy journey adapter without touching the
 * existing State Director / RBT / BCBA curricula.
 */

export type IntakeLessonKind =
  | "Overview"
  | "SOP"
  | "Workflow"
  | "Video"
  | "Shadowing"
  | "Live Practice"
  | "Reflection"
  | "Quiz";

export interface IntakeLesson {
  id: string;
  title: string;
  summary: string;
  kind: IntakeLessonKind;
  minutes: number;
}

export interface IntakeResourceLink {
  label: string;
  href: string;
  /** true = we don't have the SOP uploaded yet; UI shows a "pending" state. */
  pending?: boolean;
}

export interface IntakeDayModule {
  /** Source module id — becomes `intake::<id>` in the academy adapter. */
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;      // 1..5 within the week
  dayInJourney: number;   // 1..20 across the whole journey
  title: string;
  description: string;
  objectives: string[];
  lessons: IntakeLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: IntakeResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
  trainerNotes?: string;
  signoffRequired?: string;
}

export interface IntakeWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
}

export const INTAKE_WEEKS: IntakeWeek[] = [
  { weekNumber: 1, title: "Week 1 · Foundations, Welcome, and Current Systems",
    goal: "Understand Blossom, the Intake Department's purpose, today's systems, the family experience, and basic lead handling before touching live work independently." },
  { weekNumber: 2, title: "Week 2 · Forms, Missing Information, Insurance, and After-Hours AI",
    goal: "Move from observation into supervised execution of common intake tasks." },
  { weekNumber: 3, title: "Week 3 · Packet Review, VOB Handoff, Can't Reach, Disqualification, Handoffs",
    goal: "Start owning more work with review, learn judgment points, and practice clean handoffs." },
  { weekNumber: 4, title: "Week 4 · Controlled Ownership, Quality, Speed, and Graduation",
    goal: "Transition from supervised practice to controlled ownership of real intake work with mentor quality review." },
];

/* ---------- resource shorthands ---------- */

const R = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  l1Overview: { label: "L1 Overview — Current Operations", href: "/resource-library", pending: true },
  l1RoleSop: { label: "L1 Intake Lead / Admissions Role SOP", href: "/resource-library", pending: true },
  l1RoleDeepDive: { label: "Intake Lead / Admissions Role Deep Dive", href: "/resource-library", pending: true },
  l2NewLeadOps: { label: "L2 New Lead — Current Operations", href: "/resource-library", pending: true },
  l2NewLeadSop: { label: "L2 New Lead Intake Process SOP", href: "/resource-library", pending: true },
  l2StatusSop: { label: "L2 Lead Status Update Process SOP", href: "/resource-library", pending: true },
  l2PhoneOps: { label: "L2 Phone Calls — Current Operations", href: "/resource-library", pending: true },
  l2FamilyContactSop: { label: "L2 Family Contact & Follow-Up Process SOP", href: "/resource-library", pending: true },
  l2WebsiteLeadsSop: { label: "L2 Website Leads — Current Operations", href: "/resource-library", pending: true },
  l2FacebookLeadsSop: { label: "L2 Facebook Leads — Current Operations", href: "/resource-library", pending: true },
  l2AfterHoursSop: { label: "L2 After-Hours AI Call Review Process SOP", href: "/resource-library", pending: true },
  l2InitialForms: { label: "L2 Initial Forms — Current Operations", href: "/resource-library", pending: true },
  l2ConsentForms: { label: "L2 Consent Forms — Current Operations", href: "/resource-library", pending: true },
  l2InsuranceCollection: { label: "L2 Insurance Collection — Current Operations", href: "/resource-library", pending: true },
  l2InsuranceHandoffSop: { label: "L2 Insurance & Benefits Handoff Process SOP", href: "/resource-library", pending: true },
  l2MissingInfo: { label: "L2 Missing Information — Current Operations", href: "/resource-library", pending: true },
  l2NeedDiagnosis: { label: "L2 Need Diagnosis — Current Operations", href: "/resource-library", pending: true },
  l2ReviewPacket: { label: "L2 Review Packet — Current Operations", href: "/resource-library", pending: true },
  l2VobSubmission: { label: "L2 VOB Submission — Current Operations", href: "/resource-library", pending: true },
  l2VobReview: { label: "L2 VOB Review — Current Operations", href: "/resource-library", pending: true },
  l2CantReach: { label: "L2 Can't Reach Process — Current Operations", href: "/resource-library", pending: true },
  l2Disqualification: { label: "L2 Lead Disqualification — Current Operations", href: "/resource-library", pending: true },
  l2TransitionToClient: { label: "L2 Transition to Client — Current Operations", href: "/resource-library", pending: true },
  benefitsCheatSheets: { label: "Lead Benefits Cheat Sheets", href: "/resource-library", pending: true },
  mondayFieldGuide: { label: "Monday Leads Board Field Guide", href: "/resource-library", pending: true },
  pandaDocGuide: { label: "PandaDoc / Forms Guide", href: "/resource-library", pending: true },
  ctmGuide: { label: "CTM / Call Tracking Guide", href: "/resource-library", pending: true },
  retellSpreadsheet: { label: "Retell AI After-Hours Spreadsheet Guide", href: "/resource-library", pending: true },
} as const;

/* ---------- helpers ---------- */

function day(
  weekNumber: 1 | 2 | 3 | 4,
  dayNumber: number,
  dayInJourney: number,
  spec: Omit<IntakeDayModule, "id" | "weekNumber" | "dayNumber" | "dayInJourney">,
): IntakeDayModule {
  return {
    id: `intake-w${weekNumber}d${dayNumber}`,
    weekNumber, dayNumber, dayInJourney,
    ...spec,
  };
}

/* ---------- WEEK 1 ---------- */

const W1: IntakeDayModule[] = [
  day(1, 1, 1, {
    title: "Intake Role Orientation",
    description:
      "Start with Blossom's company welcome, then learn what Intake does and why it matters. Intake is the first operational trust point for families — no lead should sit without owner, status, next action, and follow-up date.",
    objectives: [
      "Explain what Intake owns and does not own today",
      "Explain the family experience standard",
      "Explain why Monday must stay updated today",
    ],
    lessons: [
      { id: "w1d1-l1", title: "What Intake owns today", kind: "Overview", minutes: 10, summary: "Leads, first contact, forms/consents, missing info, insurance collection, VOB readiness, handoff." },
      { id: "w1d1-l2", title: "What Intake does not own", kind: "Overview", minutes: 8, summary: "Not Finance, RCM, Auth, Scheduling, Staffing, or Clinical — Intake supports handoff." },
      { id: "w1d1-l3", title: "The family experience standard", kind: "Workflow", minutes: 10, summary: "Warm, clear, guided. Every family feels owned, not routed." },
    ],
    checklist: [
      "Can explain what Intake owns",
      "Can explain what Intake does not own",
      "Can explain why Monday must stay updated today",
    ],
    shadowing: ["Sit with Intake Lead or assigned mentor for 30–60 minutes and watch how they start their day."],
    livePractice: ["No live lead ownership yet — observe only."],
    resources: [R.l1Overview, R.l1RoleSop, R.l1RoleDeepDive],
    knowledgeCheck: {
      q: "What four things should every lead have before you leave it?",
      a: "Owner, status, next action, follow-up date. Intake does not own clinical documentation. Monday is today's intake source of truth.",
    },
    reflectionPrompt: "In your own words, why does Intake matter to the family and to the rest of Blossom?",
  }),
  day(1, 2, 2, {
    title: "Current Systems Tour — Monday, Email, Phone, Forms, and Call Sources",
    description:
      "Learn every system Intake touches today and what each is used for: Monday, phone/CTM, Outlook, PandaDoc/forms, and lead sources including Retell after-hours AI.",
    objectives: [
      "Identify today's main intake tools",
      "Find the key lead fields on the Monday board",
      "Explain where calls originate (CTM, website, Facebook, Google, referrals, after-hours AI)",
    ],
    lessons: [
      { id: "w1d2-l1", title: "Monday Leads Board basics", kind: "Workflow", minutes: 15, summary: "Views, key fields, filters, and who updates what." },
      { id: "w1d2-l2", title: "Phone & call log basics", kind: "SOP", minutes: 10, summary: "CTM, call tracking, and what to log after each call." },
      { id: "w1d2-l3", title: "Outlook / email basics", kind: "SOP", minutes: 8, summary: "Family email standards, shared inboxes, and threading rules." },
      { id: "w1d2-l4", title: "Forms/PandaDoc + lead source awareness", kind: "SOP", minutes: 10, summary: "Where forms go, and where new leads originate." },
    ],
    checklist: [
      "Located intake tools in Monday, Outlook, phone system, and PandaDoc",
      "Identified owner / status / next action / follow-up date fields on 3 sample leads",
      "Explained what each tool is used for",
    ],
    shadowing: ["Watch mentor update one lead from a call and one from an email."],
    livePractice: ["In a training/sandbox or with mentor supervision, locate 3 sample leads and identify owner/status/next action/follow-up date."],
    resources: [R.l2NewLeadOps, R.l2NewLeadSop, R.l2PhoneOps, R.l2WebsiteLeadsSop, R.l2FacebookLeadsSop, R.mondayFieldGuide, R.ctmGuide],
    knowledgeCheck: {
      q: "Which system is today's intake source of truth, and should you create a duplicate before searching?",
      a: "Monday is today's source of truth. Never create a duplicate before searching existing records.",
    },
    reflectionPrompt: "Which system is easiest to forget to update, and how will you prevent that?",
  }),
  day(1, 3, 3, {
    title: "New Lead Intake Basics",
    description:
      "Learn how a new lead is received, duplicate-checked, and moved into the correct first action.",
    objectives: [
      "Perform duplicate search before creating or changing a lead",
      "Confirm required lead basics",
      "Choose the correct first action",
    ],
    lessons: [
      { id: "w1d3-l1", title: "What counts as a new lead", kind: "Overview", minutes: 6, summary: "Sources, timing, and when a call becomes a lead." },
      { id: "w1d3-l2", title: "Duplicate search", kind: "SOP", minutes: 8, summary: "Search by phone, email, and child/guardian name before anything else." },
      { id: "w1d3-l3", title: "Required lead basics", kind: "Workflow", minutes: 10, summary: "Guardian, child, phone, email, state, insurance if available, diagnosis status, source, reason." },
      { id: "w1d3-l4", title: "First action decision", kind: "Workflow", minutes: 10, summary: "Call back, send forms, request missing info, route for VOB, disqualify, or escalate." },
    ],
    checklist: [
      "Performed duplicate search",
      "Identified required lead basics",
      "Chose the correct next action with mentor approval",
    ],
    shadowing: ["Watch mentor process 2–3 new leads from different sources."],
    livePractice: ["Under mentor supervision, complete duplicate search and field review on 2 sample or current leads."],
    resources: [R.l2NewLeadSop, R.l2NewLeadOps, R.l2StatusSop],
    knowledgeCheck: {
      q: "Name three identifiers to search before creating a duplicate.",
      a: "Phone, email, child or guardian name. If required info is missing, the lead does not move forward.",
    },
    reflectionPrompt: "What can go wrong if we create duplicates?",
  }),
  day(1, 4, 4, {
    title: "Family Contact and Follow-Up",
    description:
      "Learn how Intake communicates with families in a warm, clear, and documented way — voice, email, and text.",
    objectives: [
      "Meet first-call expectations",
      "Handle missed-call follow-up correctly",
      "Use email/text tone that feels warm and specific",
      "Document every contact attempt with an outcome and next follow-up date",
    ],
    lessons: [
      { id: "w1d4-l1", title: "First call expectations", kind: "SOP", minutes: 10, summary: "Introduce, listen, confirm basics, set next step." },
      { id: "w1d4-l2", title: "Missed call follow-up", kind: "SOP", minutes: 8, summary: "Cadence, when to text vs email, when to try again." },
      { id: "w1d4-l3", title: "Email / text tone", kind: "Workflow", minutes: 10, summary: "Plain language, specific ask, warm sign-off." },
      { id: "w1d4-l4", title: "Documenting contact attempts", kind: "SOP", minutes: 8, summary: "Log attempt, outcome, and next follow-up date every time." },
    ],
    checklist: [
      "Drafted an approved family text",
      "Drafted an approved family email",
      "Role-played a first intake call",
    ],
    shadowing: ["Listen to mentor make 2–3 family follow-up calls."],
    livePractice: ["Draft 2 family texts and 1 email for mentor review; role-play a first intake call."],
    resources: [R.l2FamilyContactSop, R.l2PhoneOps],
    knowledgeCheck: {
      q: "Should every contact attempt be documented, and what must be added after a missed call?",
      a: "Yes, every attempt is documented; add outcome and next follow-up date.",
    },
    reflectionPrompt: "What makes a family feel guided instead of ignored?",
  }),
  day(1, 5, 5, {
    title: "Week 1 Review + First Manager Check-In",
    description:
      "Review Week 1 and confirm you understand the Intake role, systems, and basic lead handling.",
    objectives: [
      "Review 3 sample leads with mentor and explain status, next action, and Intake's role",
      "Identify anything still unclear",
      "Complete manager/mentor signoff for Week 1",
    ],
    lessons: [
      { id: "w1d5-l1", title: "Week 1 knowledge review", kind: "Quiz", minutes: 15, summary: "5–7 questions covering systems, owner/status, duplicates, follow-up, boundaries." },
      { id: "w1d5-l2", title: "Intake role boundary check", kind: "Overview", minutes: 8, summary: "Walk the line between Intake, RCM/Benefits, Auth, Scheduling, Clinical." },
      { id: "w1d5-l3", title: "Mentor feedback", kind: "Shadowing", minutes: 15, summary: "What went well, what to sharpen next week." },
      { id: "w1d5-l4", title: "End-of-day queue review", kind: "Shadowing", minutes: 10, summary: "Watch mentor close the day with no lead left without a next step." },
    ],
    checklist: [
      "Completed Week 1 quiz",
      "Reviewed 3 leads with mentor",
      "Manager/mentor signoff completed",
    ],
    shadowing: ["Watch end-of-day queue review with mentor."],
    livePractice: ["Complete supervised lead review checklist for 3 leads."],
    resources: [R.l1Overview, R.l1RoleSop],
    knowledgeCheck: {
      q: "Which four fields must every lead carry at end of day?",
      a: "Owner, status, next action, follow-up date.",
    },
    reflectionPrompt: "What part of Intake still feels confusing?",
    signoffRequired: "Intake Lead / Manager signs off before you continue to Week 2.",
  }),
];

/* ---------- WEEK 2 ---------- */

const W2: IntakeDayModule[] = [
  day(2, 1, 6, {
    title: "Initial Forms and Consent Forms",
    description: "Learn how forms are sent, tracked, reviewed, and followed up on today.",
    objectives: [
      "Identify whether forms have been sent / viewed / completed",
      "Send forms using today's approved tool",
      "Update Monday form status and next follow-up",
    ],
    lessons: [
      { id: "w2d1-l1", title: "Initial forms overview", kind: "Overview", minutes: 8, summary: "What we send first and why." },
      { id: "w2d1-l2", title: "Consent forms overview", kind: "SOP", minutes: 10, summary: "Which consents matter and when they're required." },
      { id: "w2d1-l3", title: "Form status tracking", kind: "Workflow", minutes: 8, summary: "Sent, viewed, partially complete, complete." },
      { id: "w2d1-l4", title: "Family reminder process", kind: "SOP", minutes: 8, summary: "Warm reminders that don't feel like nagging." },
    ],
    checklist: [
      "Can explain form statuses",
      "Updated form status with mentor approval",
      "Drafted a family reminder message",
    ],
    shadowing: ["Watch mentor send forms and update status on 2 leads."],
    livePractice: ["Under supervision, update form status and draft reminders for 2 leads."],
    resources: [R.l2InitialForms, R.l2ConsentForms, R.pandaDocGuide],
    knowledgeCheck: { q: "If forms are incomplete, what must be updated?", a: "The missing item, the lead status, and the next follow-up date." },
    reflectionPrompt: "What should a family know when we ask them for forms?",
  }),
  day(2, 2, 7, {
    title: "Missing Information Workflow",
    description: "Track missing information without letting families or leads drift.",
    objectives: [
      "Identify missing diagnosis, insurance, guardian info, consents, forms, schedule, or location",
      "Record missing items separately and clearly",
      "Contact family with the exact request and next follow-up date",
    ],
    lessons: [
      { id: "w2d2-l1", title: "Missing info standards", kind: "SOP", minutes: 8, summary: "How we write missing info so the next teammate can act on it." },
      { id: "w2d2-l2", title: "Clear family requests", kind: "Workflow", minutes: 8, summary: "Specific asks beat vague 'send docs' asks." },
      { id: "w2d2-l3", title: "Follow-up dates", kind: "SOP", minutes: 6, summary: "Every missing item has a next step." },
      { id: "w2d2-l4", title: "Same-day escalation", kind: "SOP", minutes: 6, summary: "When missing info blocks care, we escalate the same day." },
    ],
    checklist: [
      "Identified missing items correctly",
      "Drafted a clear family request",
      "Added a next follow-up date",
    ],
    shadowing: ["Observe mentor handle 2 missing-info leads."],
    livePractice: ["Update missing-info notes for 3 leads with mentor review."],
    resources: [R.l2MissingInfo, R.l2NeedDiagnosis, R.l2FamilyContactSop],
    knowledgeCheck: { q: "Should missing information be written vaguely as 'need docs'?", a: "No. Write the specific missing item and the next step." },
    reflectionPrompt: "How can unclear missing-info notes hurt the next department?",
  }),
  day(2, 3, 8, {
    title: "Insurance Collection and Benefits/VOB Readiness",
    description: "What Intake collects for benefits/VOB readiness — and how to hand off cleanly.",
    objectives: [
      "Confirm insurance name, member info/card, state, diagnosis status, required family info",
      "Attach/check relevant lead benefits cheat sheet",
      "Mark what is ready and what is still missing before handoff",
    ],
    lessons: [
      { id: "w2d3-l1", title: "Insurance collection basics", kind: "SOP", minutes: 10, summary: "Card front/back, member ID, group, subscriber." },
      { id: "w2d3-l2", title: "What Intake checks before handoff", kind: "Workflow", minutes: 8, summary: "Ready vs. not-ready checklist for benefits/RCM." },
      { id: "w2d3-l3", title: "Lead benefits cheat sheet awareness", kind: "Overview", minutes: 6, summary: "Where cheat sheets live and how to use them without giving quotes." },
      { id: "w2d3-l4", title: "VOB readiness checklist", kind: "Workflow", minutes: 10, summary: "Prepare a clean handoff to the benefits/RCM/VOB owner." },
    ],
    checklist: [
      "Listed required insurance items",
      "Completed supervised readiness check on 2 leads",
      "Knows when to ask RCM/benefits owner",
    ],
    shadowing: ["Watch mentor prepare a VOB/benefits handoff."],
    livePractice: ["Complete a supervised VOB readiness check on 2 leads."],
    resources: [R.l2InsuranceCollection, R.l2InsuranceHandoffSop, R.benefitsCheatSheets],
    knowledgeCheck: { q: "Does Intake make the final financial acceptance?", a: "No — Intake prepares readiness; RCM/Benefits owns the decision." },
    reflectionPrompt: "What information does Benefits/RCM need from Intake to avoid rework?",
  }),
  day(2, 4, 9, {
    title: "After-Hours AI Call Review (Retell)",
    description: "Learn the current Retell AI after-hours / overflow call review process.",
    objectives: [
      "Open and review the daily Retell after-hours spreadsheet",
      "Identify caller type (new family, existing, staff, vendor, wrong number, unclear)",
      "Search Monday first, then update or route correctly",
    ],
    lessons: [
      { id: "w2d4-l1", title: "What Retell does today", kind: "Overview", minutes: 6, summary: "Retell answers after-hours and hands the transcript to us." },
      { id: "w2d4-l2", title: "Daily spreadsheet review", kind: "Workflow", minutes: 10, summary: "Row-by-row review before making changes in Monday." },
      { id: "w2d4-l3", title: "Caller type identification", kind: "Workflow", minutes: 8, summary: "Classify before you act." },
      { id: "w2d4-l4", title: "Monday update + follow-up", kind: "SOP", minutes: 10, summary: "Update or route to the correct owner; call new families during business hours." },
    ],
    checklist: [
      "Reviewed sample spreadsheet rows",
      "Identified caller type",
      "Updated or routed correctly with mentor approval",
    ],
    shadowing: ["Watch mentor process a full daily after-hours spreadsheet."],
    livePractice: ["Process 3 spreadsheet rows under supervision."],
    resources: [R.l2AfterHoursSop, R.l2NewLeadSop, R.l2FamilyContactSop, R.retellSpreadsheet],
    knowledgeCheck: { q: "Does Retell complete intake follow-up by itself?", a: "No. Retell captures the call; Intake still owns follow-up." },
    reflectionPrompt: "What does Retell do, and what does the Intake team still own?",
  }),
  day(2, 5, 10, {
    title: "Week 2 Supervised Execution Review",
    description: "Complete a supervised mini-shift using current intake tasks with mentor quality review.",
    objectives: [
      "Complete 5–8 low-risk intake tasks assigned by mentor",
      "Leave no lead without a next step",
      "Pass Week 2 manager check-in",
    ],
    lessons: [
      { id: "w2d5-l1", title: "Forms review", kind: "Live Practice", minutes: 15, summary: "Send / follow up / update statuses." },
      { id: "w2d5-l2", title: "Missing info review", kind: "Live Practice", minutes: 15, summary: "Ask families with clarity and log next steps." },
      { id: "w2d5-l3", title: "Insurance / VOB readiness review", kind: "Live Practice", minutes: 15, summary: "Prepare 1–2 clean handoffs." },
      { id: "w2d5-l4", title: "After-hours call review", kind: "Live Practice", minutes: 15, summary: "Process a small sample under supervision." },
    ],
    checklist: [
      "Completed assigned supervised tasks",
      "No lead left without next step",
      "Manager check-in completed",
    ],
    shadowing: ["Observe mentor's quality review of your work."],
    livePractice: ["Complete the mini-shift task list."],
    resources: [R.l2InitialForms, R.l2MissingInfo, R.l2InsuranceCollection, R.l2AfterHoursSop],
    knowledgeCheck: { q: "What did you do independently this week that you could not do last week?", a: "Learner responds in reflection; mentor confirms readiness before Week 3." },
    reflectionPrompt: "What did you do independently this week that you could not do last week?",
    signoffRequired: "Manager confirms readiness to move into judgment work in Week 3.",
  }),
];

/* ---------- WEEK 3 ---------- */

const W3: IntakeDayModule[] = [
  day(3, 1, 11, {
    title: "Review Packet",
    description: "Learn how to review an intake packet before the next department depends on it.",
    objectives: [
      "Review family/child info, diagnosis, insurance, forms/consents, missing items, schedule, state, source, next action",
      "Identify incomplete items and blockers",
      "Do not advance a packet with missing required info unless manager approves an exception",
    ],
    lessons: [
      { id: "w3d1-l1", title: "Packet review purpose", kind: "Overview", minutes: 6, summary: "Who reads it next and why quality matters here." },
      { id: "w3d1-l2", title: "Required packet elements", kind: "SOP", minutes: 10, summary: "The exact checklist for a complete packet today." },
      { id: "w3d1-l3", title: "What blocks a packet", kind: "Workflow", minutes: 8, summary: "Common blockers and how to resolve them." },
      { id: "w3d1-l4", title: "Notes and handoff quality", kind: "SOP", minutes: 8, summary: "Write notes the next teammate can act on." },
    ],
    checklist: [
      "Completed packet review checklist on 2 packets",
      "Correctly identified blockers",
      "Wrote clean handoff notes",
    ],
    shadowing: ["Watch mentor complete a full packet review."],
    livePractice: ["Review 2 packets with mentor."],
    resources: [R.l2ReviewPacket, R.l2InitialForms, R.l2ConsentForms, R.l2MissingInfo],
    knowledgeCheck: { q: "Should a packet move forward with unclear missing info?", a: "No, unless a manager approves a documented exception." },
    reflectionPrompt: "What would make a packet confusing for the next department?",
  }),
  day(3, 2, 12, {
    title: "VOB Submission and VOB Review Awareness",
    description: "Learn the current Intake side of VOB submission/review without taking over RCM decisions.",
    objectives: [
      "Confirm packet readiness for VOB handoff/submission",
      "Record VOB status in Monday",
      "Escalate unclear benefit/financial questions to the correct owner",
    ],
    lessons: [
      { id: "w3d2-l1", title: "VOB submission readiness", kind: "SOP", minutes: 10, summary: "What we send and what we don't." },
      { id: "w3d2-l2", title: "What Intake sends", kind: "Workflow", minutes: 8, summary: "Family, insurance, state, missing item detail." },
      { id: "w3d2-l3", title: "VOB status awareness", kind: "Overview", minutes: 6, summary: "Returned / pending / needs more info." },
      { id: "w3d2-l4", title: "When to ask for help", kind: "SOP", minutes: 6, summary: "Escalation triggers on VOB questions." },
    ],
    checklist: [
      "Can explain Intake's VOB role",
      "Can explain what Intake does not decide",
      "Completed supervised handoff on 2 leads",
    ],
    shadowing: ["Watch mentor handle a VOB-ready lead end-to-end."],
    livePractice: ["Prepare a supervised handoff for 2 VOB-ready leads."],
    resources: [R.l2VobSubmission, R.l2VobReview, R.l2InsuranceHandoffSop, R.benefitsCheatSheets],
    knowledgeCheck: { q: "Is Intake responsible for final payer/financial acceptance?", a: "No. Intake supports readiness; RCM/Benefits owns acceptance." },
    reflectionPrompt: "Where is the line between Intake and RCM/Benefits?",
  }),
  day(3, 3, 13, {
    title: "Can't Reach Process",
    description: "How to handle leads where the family is not responding — respectfully and cleanly.",
    objectives: [
      "Review attempt cadence across call/text/email",
      "Confirm follow-up dates were used",
      "Move to Can't Reach only after cadence/criteria are met",
    ],
    lessons: [
      { id: "w3d3-l1", title: "Contact cadence", kind: "SOP", minutes: 8, summary: "How many attempts, on what channels, in what timing." },
      { id: "w3d3-l2", title: "Documentation", kind: "SOP", minutes: 6, summary: "Every attempt logged; no ghost attempts." },
      { id: "w3d3-l3", title: "When to move to Can't Reach", kind: "Workflow", minutes: 8, summary: "The trigger points that justify the status." },
      { id: "w3d3-l4", title: "Respectful family communication", kind: "Workflow", minutes: 6, summary: "Language that keeps the door open." },
    ],
    checklist: [
      "Audited contact attempts on 3 no-response leads",
      "Recommended the correct next action",
      "Used respectful language",
    ],
    shadowing: ["Watch mentor review a stale / no-response lead."],
    livePractice: ["Audit 3 no-response leads and recommend next action for mentor sign-off."],
    resources: [R.l2CantReach, R.l2FamilyContactSop, R.l2StatusSop],
    knowledgeCheck: { q: "Should 'Can't Reach' be used after one missed call?", a: "No — only after the full cadence has been attempted and documented." },
    reflectionPrompt: "How do we avoid giving up too early while also keeping the board clean?",
  }),
  day(3, 4, 14, {
    title: "Lead Disqualification and Need Diagnosis",
    description: "Handle leads that may not be ready or may not qualify today.",
    objectives: [
      "Identify diagnosis missing / not ready",
      "Identify disqualification reasons",
      "Document reason clearly and respectfully",
    ],
    lessons: [
      { id: "w3d4-l1", title: "Need diagnosis", kind: "SOP", minutes: 8, summary: "When and how we mark a lead as needing diagnosis." },
      { id: "w3d4-l2", title: "Not a fit / disqualification", kind: "Workflow", minutes: 8, summary: "Common non-fit patterns and how to close respectfully." },
      { id: "w3d4-l3", title: "Clear documentation", kind: "SOP", minutes: 6, summary: "Reason, next step, whether we can revisit later." },
      { id: "w3d4-l4", title: "Family communication", kind: "Workflow", minutes: 6, summary: "Warm language even when saying 'not now'." },
    ],
    checklist: [
      "Correctly categorized 3 sample leads",
      "Drafted a respectful family note",
      "Manager approved recommendations",
    ],
    shadowing: ["Observe mentor handle a disqualification or need-diagnosis lead."],
    livePractice: ["Review 3 sample leads and categorize: move forward, need diagnosis, missing info, not a fit, manager review."],
    resources: [R.l2NeedDiagnosis, R.l2Disqualification, R.l2FamilyContactSop],
    knowledgeCheck: { q: "Should a lead be closed without a clear reason?", a: "No. Every close needs a documented reason and next step." },
    reflectionPrompt: "What makes a disqualification note respectful and useful?",
  }),
  day(3, 5, 15, {
    title: "Cross-Department Handoffs",
    description: "How Intake hands off to Benefits/RCM, Auth, Scheduling, State Ops, and other owners.",
    objectives: [
      "Write a handoff with family name, state, need, owner, and timing",
      "Update Monday before/after the handoff",
      "Escalate same-day when patient care, compliance, billing, staffing, or urgent family issues are involved",
    ],
    lessons: [
      { id: "w3d5-l1", title: "What a good handoff looks like", kind: "Workflow", minutes: 10, summary: "Owner + due + context — every time." },
      { id: "w3d5-l2", title: "Owner, due date, context", kind: "SOP", minutes: 8, summary: "Three fields, no exceptions." },
      { id: "w3d5-l3", title: "Same-day escalations", kind: "SOP", minutes: 6, summary: "When to escalate now, not tomorrow." },
      { id: "w3d5-l4", title: "Avoiding State Director overload", kind: "Overview", minutes: 6, summary: "Which decisions belong to Intake, not the SD." },
    ],
    checklist: [
      "Drafted 3 clear handoffs",
      "Identified the correct receiving department",
      "Added owner / date / next action",
    ],
    shadowing: ["Watch mentor send 2 handoffs."],
    livePractice: ["Draft 3 handoffs for mentor review."],
    resources: [R.l2InsuranceHandoffSop, R.l2TransitionToClient, R.l1RoleDeepDive],
    knowledgeCheck: { q: "Should handoffs be vague, and should State Directors absorb normal Intake execution?", a: "No — handoffs are specific; SDs are not the fallback for normal Intake work." },
    reflectionPrompt: "What makes another department trust Intake?",
    signoffRequired: "Manager confirms readiness to own live queue work in Week 4.",
  }),
];

/* ---------- WEEK 4 ---------- */

const W4: IntakeDayModule[] = [
  day(4, 1, 16, {
    title: "Controlled Intake Queue Ownership — Part 1",
    description: "Own a small set of real intake tasks with mentor review.",
    objectives: [
      "Review assigned leads in the morning",
      "Prioritize new leads, overdue follow-ups, missing info, forms, and VOB-ready items",
      "End the day with no assigned lead missing next action / follow-up",
    ],
    lessons: [
      { id: "w4d1-l1", title: "Morning queue review", kind: "Live Practice", minutes: 15, summary: "Sort by risk, not by arrival." },
      { id: "w4d1-l2", title: "Prioritizing leads", kind: "Workflow", minutes: 10, summary: "New leads and overdue follow-ups first." },
      { id: "w4d1-l3", title: "Updating Monday", kind: "SOP", minutes: 10, summary: "Owner/status/next action/follow-up date on every touched lead." },
      { id: "w4d1-l4", title: "End-of-day cleanup", kind: "Workflow", minutes: 10, summary: "Nothing stale, nothing unowned." },
    ],
    checklist: [
      "Completed assigned queue (8–12 tasks)",
      "Updated Monday accurately",
      "Manager reviewed work",
    ],
    shadowing: ["Mentor observes learner's queue review."],
    livePractice: ["Own 8–12 assigned intake tasks with mentor review."],
    resources: [R.l1Overview, R.l2StatusSop, R.l2FamilyContactSop],
    knowledgeCheck: { q: "What must be true of every assigned lead at end of day?", a: "Owner, status, next action, and follow-up date are all set." },
    reflectionPrompt: "What slowed you down today?",
  }),
  day(4, 2, 17, {
    title: "Controlled Intake Queue Ownership — Part 2",
    description: "Repeat controlled ownership with more independence.",
    objectives: [
      "Start the day with the assigned queue",
      "Mentor checks midpoint and end of day only",
      "Document blockers and escalations",
    ],
    lessons: [
      { id: "w4d2-l1", title: "Follow-up discipline", kind: "Workflow", minutes: 10, summary: "No stale follow-ups on your queue." },
      { id: "w4d2-l2", title: "Missing info cleanup", kind: "Workflow", minutes: 10, summary: "Clear old missing-info items decisively." },
      { id: "w4d2-l3", title: "Call / email documentation", kind: "SOP", minutes: 8, summary: "Log outcome and next step every time." },
      { id: "w4d2-l4", title: "Escalation notes", kind: "SOP", minutes: 8, summary: "Escalations that a manager can act on immediately." },
    ],
    checklist: [
      "Completed 10–15 assigned tasks",
      "Escalated blockers correctly",
      "No stale or unowned assigned item",
    ],
    shadowing: ["Minimal — learner performs work while mentor reviews."],
    livePractice: ["Own 10–15 assigned intake tasks with midpoint + end-of-day checks."],
    resources: [R.l2MissingInfo, R.l2PhoneOps, R.l2AfterHoursSop],
    knowledgeCheck: { q: "When you can't unblock a lead yourself, what do you do?", a: "Escalate the same day with a note a manager can act on." },
    reflectionPrompt: "What did you escalate and why?",
  }),
  day(4, 3, 18, {
    title: "Family Communication Quality Day",
    description: "Focus on tone, clarity, and documentation in family communication.",
    objectives: [
      "Make supervised calls or send approved texts/emails",
      "Keep language simple, warm, and specific",
      "Document outcome and next follow-up",
    ],
    lessons: [
      { id: "w4d3-l1", title: "Warm intake tone", kind: "Overview", minutes: 8, summary: "What warm sounds like in writing and on the phone." },
      { id: "w4d3-l2", title: "Clear requests", kind: "Workflow", minutes: 8, summary: "One ask per message, always." },
      { id: "w4d3-l3", title: "Difficult / confused family calls", kind: "SOP", minutes: 10, summary: "Slow down, listen, restate, confirm." },
      { id: "w4d3-l4", title: "Documentation after communication", kind: "SOP", minutes: 8, summary: "Notes match reality." },
    ],
    checklist: [
      "Completed 3–5 family communications with mentor approval",
      "Notes updated accurately",
      "Mentor approved tone",
    ],
    shadowing: ["Mentor listens to a call or reviews your written messages."],
    livePractice: ["Complete 3–5 family communications with mentor approval."],
    resources: [R.l2FamilyContactSop, R.l2MissingInfo, R.l2CantReach],
    knowledgeCheck: { q: "One ask per message — true or false?", a: "True. Multiple asks in one message reduce family follow-through." },
    reflectionPrompt: "What family message are you proud of from today and why?",
  }),
  day(4, 4, 19, {
    title: "End-to-End Intake Simulation",
    description: "Complete a full intake simulation from new lead through next-step handoff.",
    objectives: [
      "Complete duplicate search, contact plan, missing info, insurance readiness, Monday notes, and handoff",
      "Pass mentor checklist review",
      "Complete a small set of real tasks after the simulation",
    ],
    lessons: [
      { id: "w4d4-l1", title: "New lead simulation", kind: "Live Practice", minutes: 15, summary: "You receive a simulated lead — take it from zero." },
      { id: "w4d4-l2", title: "Family contact simulation", kind: "Live Practice", minutes: 15, summary: "First call + follow-up cadence." },
      { id: "w4d4-l3", title: "Forms / missing info simulation", kind: "Live Practice", minutes: 15, summary: "Send, track, and clean up." },
      { id: "w4d4-l4", title: "Insurance / VOB readiness + handoff", kind: "Live Practice", minutes: 20, summary: "Prepare and send a clean handoff." },
    ],
    checklist: [
      "Completed the full simulation",
      "Passed mentor review",
      "Completed the real task set that followed",
    ],
    shadowing: ["None unless requested."],
    livePractice: ["Full simulation plus 5 real tasks."],
    resources: [R.l2NewLeadSop, R.l2FamilyContactSop, R.l2InsuranceHandoffSop, R.benefitsCheatSheets, R.l1RoleDeepDive],
    knowledgeCheck: { q: "What are the 5 stages of a clean intake lifecycle?", a: "New lead → contact + basics → forms/missing info → insurance/VOB readiness → handoff." },
    reflectionPrompt: "What part of the full process do you still need more repetitions on?",
  }),
  day(4, 5, 20, {
    title: "Graduation, Readiness Review, and Next 30 Days",
    description: "Final review; manager confirms readiness for ongoing intake ownership.",
    objectives: [
      "Review training completion and live-work accuracy",
      "Confirm what the learner can own independently vs. still needs review",
      "Create a 30-day follow-up growth plan",
    ],
    lessons: [
      { id: "w4d5-l1", title: "Final knowledge review", kind: "Quiz", minutes: 20, summary: "10–15 questions across the whole intake process." },
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
    livePractice: ["Run a short queue review while manager observes."],
    resources: [R.l1Overview, R.l1RoleSop, R.l1RoleDeepDive],
    knowledgeCheck: {
      q: "Final: name any 3 of — lead creation & dup search, owner/status/next/follow-up, family follow-up, missing info, forms/consent, insurance collection, VOB readiness, after-hours AI, Can't Reach, handoffs & escalation.",
      a: "Any 3 correctly named topics with a one-line description each.",
    },
    reflectionPrompt: "What do you now understand about Intake that you did not understand on Day 1?",
    signoffRequired: "Manager signoff completes the journey. Learner moves into independent ownership with a 30-day plan.",
  }),
];

export const INTAKE_DAYS: IntakeDayModule[] = [...W1, ...W2, ...W3, ...W4];

export function getIntakeDay(sourceModuleId: string): IntakeDayModule | undefined {
  return INTAKE_DAYS.find((d) => d.id === sourceModuleId);
}

export function totalIntakeMinutes(): number {
  return INTAKE_DAYS.reduce(
    (sum, d) => sum + d.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
}
