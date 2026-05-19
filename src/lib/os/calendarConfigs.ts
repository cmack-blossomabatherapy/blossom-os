import {
  Briefcase, Flame, ClipboardCheck, FileCheck2, Brain, Lightbulb, Zap, Clock,
  Heart, UserPlus, GraduationCap, Wallet, DollarSign, ShieldCheck, FileText,
  Users, Megaphone, Bot, Target, Activity, BellRing, Phone, ListChecks,
  TrendingUp, Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { OSRole } from "./permissions";

export type CalStat = { icon: LucideIcon; label: string; value: string; tone: string };
export type CalPriority = { id: string; label: string; time: string; icon: LucideIcon; tone: string };
export type CalInsight = { icon: LucideIcon; text: string };

export interface RoleCalendarConfig {
  badge: string;
  title: string;
  subtitle: string;
  stats: CalStat[];
  todayPriorities: CalPriority[];
  aiInsights: CalInsight[];
  scopeNote?: string;
}

const STATE_DIRECTOR: RoleCalendarConfig = {
  badge: "State Director · Calendar Command Center",
  title: "State Director Calendar",
  subtitle: "Manage meetings, interviews, trainings, and state operations in one connected calendar — Microsoft, Calendly, and Blossom OS unified.",
  stats: [
    { icon: Briefcase, label: "This week", value: "21 events", tone: "violet" },
    { icon: UserPlus, label: "Interviews", value: "4", tone: "fuchsia" },
    { icon: Flame, label: "Escalations", value: "1", tone: "red" },
    { icon: Clock, label: "Open blocks", value: "6.5h", tone: "emerald" },
  ],
  todayPriorities: [
    { id: "p1", label: "Prep NC state huddle deck", time: "8:00 AM", icon: Briefcase, tone: "violet" },
    { id: "p2", label: "Follow up: Charlotte staffing gap", time: "By noon", icon: Flame, tone: "red" },
    { id: "p3", label: "Review 3 Calendly interview notes", time: "Afternoon", icon: ClipboardCheck, tone: "fuchsia" },
    { id: "p4", label: "Sign off on Raleigh site report", time: "EOD", icon: FileCheck2, tone: "amber" },
  ],
  aiInsights: [
    { icon: Brain, text: "You haven't met with Scheduling this week. Suggest 30m Thursday 9:00 AM." },
    { icon: Flame, text: "Raleigh staffing escalation has no follow-up meeting scheduled." },
    { icon: Lightbulb, text: "3 Calendly interviews completed — auto-create post-interview tasks?" },
    { icon: Clock, text: "You have a 2hr open block Friday afternoon — protect for deep work?" },
  ],
};

const EXECUTIVE: RoleCalendarConfig = {
  badge: "Executive Leadership · Strategic Calendar",
  title: "Executive Calendar",
  subtitle: "Cross-state strategy, board prep, executive reviews, and growth meetings — unified across Microsoft and Calendly.",
  stats: [
    { icon: Briefcase, label: "Strategy mtgs", value: "9", tone: "violet" },
    { icon: Target, label: "State reviews", value: "5", tone: "indigo" },
    { icon: Users, label: "Board / Investors", value: "2", tone: "fuchsia" },
    { icon: Clock, label: "Deep-work blocks", value: "4h", tone: "emerald" },
  ],
  todayPriorities: [
    { id: "p1", label: "Q4 board prep review", time: "9:00 AM", icon: FileText, tone: "violet" },
    { id: "p2", label: "State Director 1:1 — NC", time: "11:00 AM", icon: Users, tone: "indigo" },
    { id: "p3", label: "Growth strategy sync", time: "2:00 PM", icon: Target, tone: "fuchsia" },
  ],
  aiInsights: [
    { icon: Brain, text: "You haven't met with the FL State Director in 3 weeks — suggest a 30m sync." },
    { icon: Lightbulb, text: "Investor update is due Friday — schedule 90m prep block Wednesday." },
    { icon: Clock, text: "Calendar is 78% scheduled this week — consider protecting Thursday AM." },
  ],
};

const OPERATIONS: RoleCalendarConfig = {
  badge: "Operations Leadership · Ops Calendar",
  title: "Operations Calendar",
  subtitle: "Cross-functional ops meetings, escalation reviews, workflow standups, and state syncs.",
  stats: [
    { icon: Briefcase, label: "Standups", value: "8", tone: "violet" },
    { icon: Flame, label: "Escalations", value: "3", tone: "red" },
    { icon: Activity, label: "Ops reviews", value: "4", tone: "indigo" },
    { icon: Clock, label: "Open blocks", value: "5h", tone: "emerald" },
  ],
  todayPriorities: [
    { id: "p1", label: "Cross-state ops standup", time: "8:30 AM", icon: Megaphone, tone: "violet" },
    { id: "p2", label: "Escalation review — INC-238", time: "11:00 AM", icon: Flame, tone: "red" },
    { id: "p3", label: "Workflow bottleneck sync", time: "3:00 PM", icon: Activity, tone: "indigo" },
  ],
  aiInsights: [
    { icon: Flame, text: "3 escalations are aging past SLA — block 30m to review." },
    { icon: Brain, text: "QA team has no review on calendar this week — suggest Thursday 2 PM." },
    { icon: Lightbulb, text: "Recruiting interviews stacked Tuesday — consider rebalancing across the week." },
  ],
};

const INTAKE: RoleCalendarConfig = {
  badge: "Intake Coordinator · Intake Calendar",
  title: "Intake Calendar",
  subtitle: "Parent intake calls, VOB follow-ups, onboarding sessions, and intake pipeline meetings.",
  stats: [
    { icon: Phone, label: "Intake calls", value: "12", tone: "teal" },
    { icon: FileCheck2, label: "VOB follow-ups", value: "7", tone: "orange" },
    { icon: ClipboardCheck, label: "Onboardings", value: "3", tone: "fuchsia" },
    { icon: Clock, label: "Open blocks", value: "3h", tone: "emerald" },
  ],
  todayPriorities: [
    { id: "p1", label: "Garcia family intake call", time: "10:00 AM", icon: Phone, tone: "teal" },
    { id: "p2", label: "VOB follow-up — 3 clients", time: "Afternoon", icon: FileCheck2, tone: "orange" },
    { id: "p3", label: "New client onboarding — J. Park", time: "2:00 PM", icon: ClipboardCheck, tone: "fuchsia" },
  ],
  aiInsights: [
    { icon: Lightbulb, text: "2 Calendly intake calls have no notes yet — auto-draft summaries?" },
    { icon: Clock, text: "VOB response window for 1 lead expires tomorrow — schedule a call." },
    { icon: Brain, text: "Conversion rate is highest for 11 AM intakes — block more morning slots." },
  ],
};

const AUTH: RoleCalendarConfig = {
  badge: "Auth Coordinator · Authorization Calendar",
  title: "Authorization Calendar",
  subtitle: "Auth deadlines, insurance calls, renewal windows, and submission reviews.",
  stats: [
    { icon: FileCheck2, label: "Auths expiring", value: "6", tone: "orange" },
    { icon: Phone, label: "Insurance calls", value: "4", tone: "blue" },
    { icon: ShieldCheck, label: "Renewals due", value: "9", tone: "violet" },
    { icon: Flame, label: "At risk", value: "2", tone: "red" },
  ],
  todayPriorities: [
    { id: "p1", label: "Submit BCBS renewal — 3 clients", time: "10:00 AM", icon: FileCheck2, tone: "orange" },
    { id: "p2", label: "Aetna provider call", time: "1:00 PM", icon: Phone, tone: "blue" },
    { id: "p3", label: "Auth at-risk huddle", time: "3:30 PM", icon: Flame, tone: "red" },
  ],
  aiInsights: [
    { icon: Flame, text: "2 auths expire within 7 days with no submission scheduled." },
    { icon: Brain, text: "Average Aetna response is 4.5 days — submit by Thursday to stay safe." },
    { icon: Lightbulb, text: "5 renewals share the same insurer — batch them into one call?" },
  ],
};

const SCHEDULING: RoleCalendarConfig = {
  badge: "Scheduling Team · Scheduling Calendar",
  title: "Scheduling Calendar",
  subtitle: "Shift placements, coverage gaps, RBT/BCBA availability, and staffing escalations.",
  stats: [
    { icon: Users, label: "Sessions this week", value: "186", tone: "sky" },
    { icon: Flame, label: "Coverage gaps", value: "8", tone: "red" },
    { icon: ClipboardCheck, label: "Shifts to confirm", value: "14", tone: "violet" },
    { icon: Clock, label: "Unassigned hours", value: "11h", tone: "amber" },
  ],
  todayPriorities: [
    { id: "p1", label: "Fill Charlotte AM coverage gap", time: "8:00 AM", icon: Flame, tone: "red" },
    { id: "p2", label: "Confirm RBT shifts — 14 pending", time: "10:00 AM", icon: ClipboardCheck, tone: "violet" },
    { id: "p3", label: "BCBA supervision schedule review", time: "2:00 PM", icon: Heart, tone: "rose" },
  ],
  aiInsights: [
    { icon: Flame, text: "Wednesday afternoon has 4 uncovered sessions — 2 RBTs nearby are free." },
    { icon: Brain, text: "RBT A. Kim has 6 cancellations this month — flag for review." },
    { icon: Lightbulb, text: "Cluster Raleigh sessions for Maria L. to cut 1.5h drive time." },
  ],
};

const RECRUITING: RoleCalendarConfig = {
  badge: "Recruiting · Talent Calendar",
  title: "Recruiting Calendar",
  subtitle: "Interviews, candidate calls, offer deadlines, and onboarding kickoffs.",
  stats: [
    { icon: UserPlus, label: "Interviews", value: "11", tone: "fuchsia" },
    { icon: Phone, label: "Screening calls", value: "9", tone: "blue" },
    { icon: ClipboardCheck, label: "Offers pending", value: "3", tone: "violet" },
    { icon: GraduationCap, label: "Orientations", value: "2", tone: "lime" },
  ],
  todayPriorities: [
    { id: "p1", label: "RBT interview — A. Kim", time: "9:00 AM", icon: UserPlus, tone: "fuchsia" },
    { id: "p2", label: "Screen 4 BCBA candidates", time: "Afternoon", icon: Phone, tone: "blue" },
    { id: "p3", label: "Offer deadline reminder — 2 candidates", time: "EOD", icon: BellRing, tone: "amber" },
  ],
  aiInsights: [
    { icon: Lightbulb, text: "3 Calendly interviews have no follow-up scheduled." },
    { icon: Brain, text: "Best-performing interview slot is Tue 9 AM — open 2 more next week." },
    { icon: Clock, text: "Offer for K. Singh expires Friday — schedule a close call." },
  ],
};

const HR: RoleCalendarConfig = {
  badge: "HR · People Calendar",
  title: "HR Calendar",
  subtitle: "Onboarding, evaluations, training sessions, employee 1:1s, and culture events.",
  stats: [
    { icon: GraduationCap, label: "Trainings", value: "6", tone: "emerald" },
    { icon: ClipboardCheck, label: "Evaluations", value: "8", tone: "violet" },
    { icon: Users, label: "1:1s", value: "12", tone: "sky" },
    { icon: Heart, label: "Culture events", value: "1", tone: "rose" },
  ],
  todayPriorities: [
    { id: "p1", label: "New hire orientation — 5 RBTs", time: "9:00 AM", icon: GraduationCap, tone: "emerald" },
    { id: "p2", label: "BCBA evaluations — 3 staff", time: "11:00 AM", icon: ClipboardCheck, tone: "violet" },
    { id: "p3", label: "Quarterly culture huddle", time: "3:00 PM", icon: Heart, tone: "rose" },
  ],
  aiInsights: [
    { icon: Brain, text: "2 staff have overdue evaluations — schedule before month-end." },
    { icon: Lightbulb, text: "New cohort starts Monday — block prep time Friday." },
    { icon: Clock, text: "Training capacity is tight Thursday — consider splitting cohort." },
  ],
};

const BILLING: RoleCalendarConfig = {
  badge: "Billing & Finance · Finance Calendar",
  title: "Billing & Finance Calendar",
  subtitle: "Billing cycles, claim submission windows, payer calls, and revenue reviews.",
  stats: [
    { icon: DollarSign, label: "Claims due", value: "47", tone: "violet" },
    { icon: Phone, label: "Payer calls", value: "5", tone: "blue" },
    { icon: Activity, label: "Revenue reviews", value: "3", tone: "emerald" },
    { icon: Flame, label: "At-risk claims", value: "4", tone: "red" },
  ],
  todayPriorities: [
    { id: "p1", label: "Submit weekly claim batch", time: "10:00 AM", icon: DollarSign, tone: "violet" },
    { id: "p2", label: "BCBS denial review call", time: "1:00 PM", icon: Phone, tone: "blue" },
    { id: "p3", label: "Revenue forecast prep", time: "3:30 PM", icon: Activity, tone: "emerald" },
  ],
  aiInsights: [
    { icon: Flame, text: "4 claims aging past 30 days — schedule a follow-up batch." },
    { icon: Brain, text: "Aetna denials trending up — review patterns Wednesday." },
    { icon: Clock, text: "Submission cutoff is Friday — protect Thursday afternoon." },
  ],
};

const QA: RoleCalendarConfig = {
  badge: "QA · Quality Calendar",
  title: "QA Calendar",
  subtitle: "Audits, session reviews, QA team huddles, and clinical compliance windows.",
  stats: [
    { icon: ShieldCheck, label: "Audits", value: "7", tone: "violet" },
    { icon: ClipboardCheck, label: "Session reviews", value: "23", tone: "fuchsia" },
    { icon: Flame, label: "Findings to close", value: "5", tone: "red" },
    { icon: Clock, label: "Open blocks", value: "4h", tone: "emerald" },
  ],
  todayPriorities: [
    { id: "p1", label: "Clinical audit — Raleigh clinic", time: "9:00 AM", icon: ShieldCheck, tone: "violet" },
    { id: "p2", label: "Review 5 session notes", time: "Afternoon", icon: ClipboardCheck, tone: "fuchsia" },
    { id: "p3", label: "Close out QA findings", time: "EOD", icon: Flame, tone: "red" },
  ],
  aiInsights: [
    { icon: Brain, text: "5 QA findings open >7 days — schedule closeout meeting." },
    { icon: Lightbulb, text: "Recurring documentation gap on BCBA Pod B — schedule training." },
  ],
};

const PAYROLL: RoleCalendarConfig = {
  badge: "Payroll · Payroll Calendar",
  title: "Payroll Calendar",
  subtitle: "Pay period cycles, timesheet deadlines, payroll runs, and adjustment windows.",
  stats: [
    { icon: Wallet, label: "Pay runs", value: "1", tone: "violet" },
    { icon: ClipboardCheck, label: "Timesheets pending", value: "32", tone: "amber" },
    { icon: Flame, label: "Exceptions", value: "6", tone: "red" },
    { icon: Clock, label: "Cutoff in", value: "2d", tone: "emerald" },
  ],
  todayPriorities: [
    { id: "p1", label: "Close timesheet window", time: "Noon", icon: ClipboardCheck, tone: "amber" },
    { id: "p2", label: "Review payroll exceptions", time: "2:00 PM", icon: Flame, tone: "red" },
    { id: "p3", label: "Run bi-weekly payroll", time: "4:00 PM", icon: Wallet, tone: "violet" },
  ],
  aiInsights: [
    { icon: Brain, text: "6 exceptions need RBT confirmation before run — send reminders now." },
    { icon: Clock, text: "Cutoff is Wednesday 5 PM — block prep time Wednesday morning." },
    { icon: Lightbulb, text: "OT trending up vs last cycle — schedule review with Scheduling." },
  ],
};

const BCBA: RoleCalendarConfig = {
  badge: "BCBA · Clinical Calendar",
  title: "My Clinical Calendar",
  subtitle: "Client sessions, supervisions, assessments, progress reports, and parent meetings.",
  stats: [
    { icon: Heart, label: "Client sessions", value: "18", tone: "rose" },
    { icon: ClipboardCheck, label: "Supervisions", value: "5", tone: "violet" },
    { icon: FileText, label: "Progress reports", value: "3 due", tone: "purple" },
    { icon: Users, label: "Parent mtgs", value: "4", tone: "sky" },
  ],
  todayPriorities: [
    { id: "p1", label: "Assessment — new client", time: "9:00 AM", icon: ClipboardCheck, tone: "cyan" },
    { id: "p2", label: "Supervise A. Kim (RBT)", time: "11:30 AM", icon: Heart, tone: "rose" },
    { id: "p3", label: "Parent meeting — Garcia", time: "2:00 PM", icon: Users, tone: "sky" },
    { id: "p4", label: "Progress report — J. Park", time: "EOD", icon: FileText, tone: "purple" },
  ],
  aiInsights: [
    { icon: Brain, text: "Progress report for J. Park due Friday — block 90m Thursday." },
    { icon: Lightbulb, text: "RBT A. Kim supervision overdue by 2 days — schedule today." },
    { icon: Clock, text: "Drive time stacks 45m between 2 PM sessions — re-cluster?" },
  ],
};

const RBT: RoleCalendarConfig = {
  badge: "RBT · My Schedule",
  title: "My Schedule",
  subtitle: "Today's clients, sessions, supervisions, training, and personal time blocks.",
  stats: [
    { icon: Heart, label: "Sessions today", value: "5", tone: "rose" },
    { icon: Clock, label: "Hours scheduled", value: "7.5h", tone: "emerald" },
    { icon: GraduationCap, label: "Trainings", value: "1", tone: "lime" },
    { icon: ClipboardCheck, label: "Supervision", value: "1", tone: "violet" },
  ],
  todayPriorities: [
    { id: "p1", label: "Session — J. Park", time: "9:00 AM", icon: Heart, tone: "rose" },
    { id: "p2", label: "Supervision w/ Maria L.", time: "11:30 AM", icon: ClipboardCheck, tone: "violet" },
    { id: "p3", label: "Session — Garcia", time: "2:00 PM", icon: Heart, tone: "rose" },
    { id: "p4", label: "RBT training module", time: "5:00 PM", icon: GraduationCap, tone: "lime" },
  ],
  aiInsights: [
    { icon: Lightbulb, text: "Submit session notes within 24 hours to stay compliant." },
    { icon: Brain, text: "30m gap between 11 AM and 12 PM — use for documentation?" },
    { icon: Clock, text: "You have 1.5 training hours due this month." },
  ],
};

export const ROLE_CALENDAR_CONFIG: Record<OSRole, RoleCalendarConfig> = {
  super_admin: STATE_DIRECTOR,
  executive_leadership: EXECUTIVE,
  operations_leadership: OPERATIONS,
  state_director: STATE_DIRECTOR,
  intake_coordinator: INTAKE,
  authorization_coordinator: AUTH,
  scheduling_team: SCHEDULING,
  recruiting_team: RECRUITING,
  hr_team: HR,
  billing_finance: BILLING,
  qa_team: QA,
  payroll_coordinator: PAYROLL,
  bcba: BCBA,
  rbt: RBT,
  marketing_team: MARKETING,
};

const MARKETING_DEF: RoleCalendarConfig = {
  badge: "Marketing Team · Growth Calendar",
  title: "Marketing Calendar",
  subtitle: "Campaigns, content cadence, recruiting marketing, partner outreach, and growth syncs — unified across Microsoft and Calendly.",
  stats: [
    { icon: Megaphone, label: "Active campaigns", value: "6", tone: "violet" },
    { icon: TrendingUp, label: "Lead lift WoW", value: "+14%", tone: "emerald" },
    { icon: Sparkles, label: "Content posts", value: "11", tone: "fuchsia" },
    { icon: Clock, label: "Strategy blocks", value: "4.0h", tone: "amber" },
  ],
  todayPriorities: [
    { id: "p1", label: "Approve weekly content calendar", time: "9:00 AM", icon: Sparkles, tone: "violet" },
    { id: "p2", label: "Review Google Ads creative refresh", time: "11:00 AM", icon: Megaphone, tone: "fuchsia" },
    { id: "p3", label: "Recruiting campaign sync — Charlotte", time: "1:30 PM", icon: UserPlus, tone: "amber" },
    { id: "p4", label: "Local SEO ranking audit — GA", time: "EOD", icon: TrendingUp, tone: "emerald" },
  ],
  aiInsights: [
    { icon: Brain, text: "Charlotte staffing escalation = recruiting campaign demand. Spin up boost?" },
    { icon: Lightbulb, text: "Blog 'Signs of Early Autism' is your top organic page — refresh for Q4." },
    { icon: TrendingUp, text: "Calendly recruiting bookings up 22% — keep cadence." },
    { icon: Clock, text: "Friday 2–4 PM open — block for campaign retro?" },
  ],
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MARKETING = MARKETING_DEF;