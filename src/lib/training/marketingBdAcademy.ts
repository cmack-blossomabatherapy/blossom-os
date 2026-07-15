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
];
