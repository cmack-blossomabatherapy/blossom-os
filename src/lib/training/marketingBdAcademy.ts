/**
 * Marketing and Business Development Onboarding Journey — current-state (today's operations).
 *
 * 4 weeks · 20 business days · 1 runtime module per day.
 * Trains a new Marketing / BD team member on today's Blossom process: lead sources,
 * referral partner tracking, CTM / call source awareness, Facebook / Google Ads,
 * LeadTrap, Mailchimp where applicable, events, boots-on-the-ground BD, provider
 * and referral relationships, and clean handoff to Intake. Marketing / BD does
 * NOT own intake execution after proper handoff.
 */

export type MbdLessonKind =
  | "Overview" | "SOP" | "Workflow" | "Video" | "Shadowing" | "Live Practice" | "Reflection" | "Quiz";

export interface MbdLesson { id: string; title: string; summary: string; kind: MbdLessonKind; minutes: number; }
export interface MbdResourceLink { label: string; href: string; pending?: boolean; }

export interface MarketingBdDayModule {
  id: string;
  weekNumber: 1 | 2 | 3 | 4;
  dayNumber: number;
  dayInJourney: number;
  title: string;
  description: string;
  objectives: string[];
  lessons: MbdLesson[];
  checklist: string[];
  shadowing: string[];
  livePractice: string[];
  resources: MbdResourceLink[];
  knowledgeCheck: { q: string; a: string };
  reflectionPrompt: string;
}

export interface MarketingBdWeek { weekNumber: 1 | 2 | 3 | 4; title: string; goal: string; }

export const MARKETING_BD_WEEKS: MarketingBdWeek[] = [
  {
    "weekNumber": 1,
    "title": "Week 1 · Marketing and Business Development Foundations, Role Clarity, and Systems",
    "goal": "Understand Blossom, the Marketing and Business Development function, role boundaries, systems, communication norms, and how the department fits into the larger operation."
  },
  {
    "weekNumber": 2,
    "title": "Week 2 · Core Marketing and Business Development Execution",
    "goal": "Run the core Marketing / BD workflows: lead sources, campaigns, referral partners, event work, and clean handoffs to Intake."
  },
  {
    "weekNumber": 3,
    "title": "Week 3 · Marketing and Business Development Judgment, Quality, and Escalation",
    "goal": "Apply quality standards, prioritize aging work, handle difficult scenarios, and escalate cleanly."
  },
  {
    "weekNumber": 4,
    "title": "Week 4 · Controlled Ownership and Graduation",
    "goal": "Move from supervised practice to controlled ownership of real Marketing / BD work with mentor quality review."
  }
];

const R: Record<string, MbdResourceLink> = {
  welcome: { label: "Welcome to Blossom", href: "/training/welcome" },
  marketingSops: { label: "Marketing SOPs", href: "/resource-library", pending: true },
  bdRole: { label: "Business Development Role Guide", href: "/resource-library", pending: true },
  referralTracker: { label: "Referral Partner Tracker", href: "/resource-library", pending: true },
  ctm: { label: "CTM / Call Source Guide", href: "/resource-library", pending: true },
  fbGoog: { label: "Facebook / Google Lead Source Guide", href: "/resource-library", pending: true },
  event: { label: "Event Checklist", href: "/resource-library", pending: true },
  parentComm: { label: "Parent Communication Resources", href: "/resource-library", pending: true },
  intakeHandoff: { label: "Intake Handoff Checklist", href: "/resource-library", pending: true },
};

const RES = [R.welcome, R.marketingSops, R.bdRole, R.referralTracker, R.ctm, R.fbGoog, R.event, R.parentComm, R.intakeHandoff];


export const MARKETING_BD_DAYS: MarketingBdDayModule[] = [
  {
    id: "mbd-w1d1",
    weekNumber: 1, dayNumber: 1, dayInJourney: 1,
    title: "Marketing and Business Development Role Orientation",
    description: "Marketing and Business Development Role Orientation",
    objectives: ["Apply today's Marketing / BD process for Marketing and Business Development Role Orientation.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w1d1-l1","title":"What This Team Owns","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply Marketing and Business Development ownership and core responsibilities."},{"id":"w1d1-l2","title":"What This Team Does Not Own","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply Marketing and Business Development boundaries and clean handoffs."},{"id":"w1d1-l3","title":"The Experience Standard","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how Marketing and Business Development work should feel to families, staff, or internal partners."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w1d2",
    weekNumber: 1, dayNumber: 2, dayInJourney: 2,
    title: "Current Systems Tour",
    description: "Current Systems Tour",
    objectives: ["Apply today's Marketing / BD process for Current Systems Tour.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w1d2-l1","title":"System Map","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply which systems are used and why."},{"id":"w1d2-l2","title":"Record Hygiene","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to keep notes, statuses, and owners clean."},{"id":"w1d2-l3","title":"Communication Channels","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply when to use Teams, Outlook, phone, internal comments, and escalation."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w1d3",
    weekNumber: 1, dayNumber: 3, dayInJourney: 3,
    title: "Daily Workflow Basics",
    description: "Daily Workflow Basics",
    objectives: ["Apply today's Marketing / BD process for Daily Workflow Basics.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w1d3-l1","title":"Morning Review","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply how to review assigned work and priorities."},{"id":"w1d3-l2","title":"Task Ownership","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to identify and own today's work."},{"id":"w1d3-l3","title":"End-of-Day Cleanup","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how to leave work clear for tomorrow."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w1d4",
    weekNumber: 1, dayNumber: 4, dayInJourney: 4,
    title: "Communication and Documentation",
    description: "Communication and Documentation",
    objectives: ["Apply today's Marketing / BD process for Communication and Documentation.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w1d4-l1","title":"Writing Useful Notes","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply specific, clear, usable documentation."},{"id":"w1d4-l2","title":"Internal Updates","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to update managers and partner departments."},{"id":"w1d4-l3","title":"Escalation Notes","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how to write a clean escalation."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w1d5",
    weekNumber: 1, dayNumber: 5, dayInJourney: 5,
    title: "Week 1 Review",
    description: "Week 1 Review",
    objectives: ["Apply today's Marketing / BD process for Week 1 Review.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w1d5-l1","title":"Knowledge Review","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply key role and systems concepts."},{"id":"w1d5-l2","title":"Mentor Review","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply review sample records/tasks with mentor."},{"id":"w1d5-l3","title":"Manager Check-In","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply reflection and readiness for supervised work."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w2d1",
    weekNumber: 2, dayNumber: 1, dayInJourney: 6,
    title: "Core Workflow 1",
    description: "Core Workflow 1",
    objectives: ["Apply today's Marketing / BD process for Core Workflow 1.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w2d1-l1","title":"Workflow Purpose","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply why this workflow matters."},{"id":"w2d1-l2","title":"Step-by-Step Execution","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to complete the workflow."},{"id":"w2d1-l3","title":"Practice Scenarios","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how to apply the workflow to sample cases."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w2d2",
    weekNumber: 2, dayNumber: 2, dayInJourney: 7,
    title: "Core Workflow 2",
    description: "Core Workflow 2",
    objectives: ["Apply today's Marketing / BD process for Core Workflow 2.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w2d2-l1","title":"Inputs and Required Info","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply what information is needed before action."},{"id":"w2d2-l2","title":"Processing the Work","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to move the work forward."},{"id":"w2d2-l3","title":"Quality Check","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how to verify the work is complete."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w2d3",
    weekNumber: 2, dayNumber: 3, dayInJourney: 8,
    title: "Exceptions and Missing Information",
    description: "Exceptions and Missing Information",
    objectives: ["Apply today's Marketing / BD process for Exceptions and Missing Information.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w2d3-l1","title":"Common Missing Items","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply what is usually missing."},{"id":"w2d3-l2","title":"Follow-Up Process","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to request or chase missing items."},{"id":"w2d3-l3","title":"Blocked Work","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how to document and escalate blockers."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w2d4",
    weekNumber: 2, dayNumber: 4, dayInJourney: 9,
    title: "Partner Department Handoffs",
    description: "Partner Department Handoffs",
    objectives: ["Apply today's Marketing / BD process for Partner Department Handoffs.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w2d4-l1","title":"Handoff Standards","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply what every handoff must include."},{"id":"w2d4-l2","title":"Receiving Handoffs","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to accept and clarify incoming work."},{"id":"w2d4-l3","title":"Sending Handoffs","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how to send work without creating confusion."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w2d5",
    weekNumber: 2, dayNumber: 5, dayInJourney: 10,
    title: "Week 2 Supervised Execution Review",
    description: "Week 2 Supervised Execution Review",
    objectives: ["Apply today's Marketing / BD process for Week 2 Supervised Execution Review.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w2d5-l1","title":"Mini-Shift Setup","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply how to prepare for supervised work."},{"id":"w2d5-l2","title":"Accuracy Review","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how mentor reviews quality."},{"id":"w2d5-l3","title":"Week 2 Reflection","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply what learner can own with support."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w3d1",
    weekNumber: 3, dayNumber: 1, dayInJourney: 11,
    title: "Quality Standards",
    description: "Quality Standards",
    objectives: ["Apply today's Marketing / BD process for Quality Standards.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w3d1-l1","title":"Quality Criteria","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply how quality is judged."},{"id":"w3d1-l2","title":"Common Errors","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply what errors create rework."},{"id":"w3d1-l3","title":"Self-Audit","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how to check work before marking done."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w3d2",
    weekNumber: 3, dayNumber: 2, dayInJourney: 12,
    title: "Aging, Urgency, and Prioritization",
    description: "Aging, Urgency, and Prioritization",
    objectives: ["Apply today's Marketing / BD process for Aging, Urgency, and Prioritization.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w3d2-l1","title":"Priority Rules","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply what gets handled first."},{"id":"w3d2-l2","title":"Aging Work","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to handle stale tasks."},{"id":"w3d2-l3","title":"Urgent Escalations","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply what must be escalated same day."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w3d3",
    weekNumber: 3, dayNumber: 3, dayInJourney: 13,
    title: "Difficult Scenarios",
    description: "Difficult Scenarios",
    objectives: ["Apply today's Marketing / BD process for Difficult Scenarios.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w3d3-l1","title":"Scenario Patterns","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply common hard situations."},{"id":"w3d3-l2","title":"Decision Points","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to choose next action."},{"id":"w3d3-l3","title":"Role-Play or Case Practice","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply practice responding to difficult scenarios."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w3d4",
    weekNumber: 3, dayNumber: 4, dayInJourney: 14,
    title: "Cross-Team Communication",
    description: "Cross-Team Communication",
    objectives: ["Apply today's Marketing / BD process for Cross-Team Communication.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w3d4-l1","title":"Update Rhythm","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply how often to update and who needs to know."},{"id":"w3d4-l2","title":"Meeting/Check-In Prep","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply what to bring to a check-in."},{"id":"w3d4-l3","title":"Escalation Follow-Through","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how to confirm escalation was resolved."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w3d5",
    weekNumber: 3, dayNumber: 5, dayInJourney: 15,
    title: "Week 3 Readiness Review",
    description: "Week 3 Readiness Review",
    objectives: ["Apply today's Marketing / BD process for Week 3 Readiness Review.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w3d5-l1","title":"Scenario Quiz","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply test judgment."},{"id":"w3d5-l2","title":"Mentor Feedback","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply review strengths and coaching areas."},{"id":"w3d5-l3","title":"Manager Signoff","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply readiness for week 4 ownership."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w4d1",
    weekNumber: 4, dayNumber: 1, dayInJourney: 16,
    title: "Controlled Ownership Part 1",
    description: "Controlled Ownership Part 1",
    objectives: ["Apply today's Marketing / BD process for Controlled Ownership Part 1.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w4d1-l1","title":"Queue Setup","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply how to choose assigned work."},{"id":"w4d1-l2","title":"Live Work Standards","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to work safely and document."},{"id":"w4d1-l3","title":"Mentor Review","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how feedback is captured."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w4d2",
    weekNumber: 4, dayNumber: 2, dayInJourney: 17,
    title: "Controlled Ownership Part 2",
    description: "Controlled Ownership Part 2",
    objectives: ["Apply today's Marketing / BD process for Controlled Ownership Part 2.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w4d2-l1","title":"Independent Prioritization","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply how learner chooses order of work."},{"id":"w4d2-l2","title":"Midday Checkpoint","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to catch issues early."},{"id":"w4d2-l3","title":"End-of-Day Signoff","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how to close the day."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w4d3",
    weekNumber: 4, dayNumber: 3, dayInJourney: 18,
    title: "Speed, Accuracy, and Communication",
    description: "Speed, Accuracy, and Communication",
    objectives: ["Apply today's Marketing / BD process for Speed, Accuracy, and Communication.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w4d3-l1","title":"Speed Without Sloppiness","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply how to move faster safely."},{"id":"w4d3-l2","title":"Accuracy Habits","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply how to avoid repeat mistakes."},{"id":"w4d3-l3","title":"Professional Communication","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply how to sound clear and calm."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w4d4",
    weekNumber: 4, dayNumber: 4, dayInJourney: 19,
    title: "End-to-End Simulation",
    description: "End-to-End Simulation",
    objectives: ["Apply today's Marketing / BD process for End-to-End Simulation.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w4d4-l1","title":"Simulation Setup","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply the full scenario."},{"id":"w4d4-l2","title":"Execution","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply complete all steps."},{"id":"w4d4-l3","title":"Debrief","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply mentor scores work and corrections."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
  {
    id: "mbd-w4d5",
    weekNumber: 4, dayNumber: 5, dayInJourney: 20,
    title: "Graduation and Next 30 Days",
    description: "Graduation and Next 30 Days",
    objectives: ["Apply today's Marketing / BD process for Graduation and Next 30 Days.", "Know the correct owner, next action, and handoff to Intake."],
    lessons: [{"id":"w4d5-l1","title":"Final Knowledge Review","kind":"Overview","minutes":10,"summary":"Help a new Marketing and Business Development team member understand and apply quiz and scenario review."},{"id":"w4d5-l2","title":"Readiness Decision","kind":"SOP","minutes":12,"summary":"Help a new Marketing and Business Development team member understand and apply manager decision and signoff."},{"id":"w4d5-l3","title":"Next 30-Day Plan","kind":"Live Practice","minutes":15,"summary":"Help a new Marketing and Business Development team member understand and apply goals, check-ins, and ownership level."}],
    checklist: ["Completed all lessons for this day.", "Documented notes, owners, and next actions.", "Reviewed related resources."],
    shadowing: ["Sit with the Marketing / BD lead or mentor for 30-60 minutes on this topic."],
    livePractice: ["Under mentor supervision, apply this day's workflow to 2-3 real Marketing / BD situations."],
    resources: RES,
    knowledgeCheck: { q: "Where does Marketing / BD ownership end today?", a: "At a clean handoff to Intake with source, contact info, and context documented." },
    reflectionPrompt: "How will you apply today's lesson without stepping into Intake's execution?",
  },
];

export function getMarketingBdDay(id: string): MarketingBdDayModule | undefined {
  return MARKETING_BD_DAYS.find((d) => d.id === id);
}

