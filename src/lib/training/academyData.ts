/**
 * Training Academy — role-journey data model with editable store.
 *
 * Everything is editable per role through the Manage Journeys page.
 * Persistence: localStorage (no backend yet).
 */
import { useSyncExternalStore } from "react";
import {
  ClipboardList, ShieldCheck, CalendarClock, Users, Heart, CheckCircle2,
  Wallet, Stethoscope, Crown, Workflow, BookOpen, Sparkles, type LucideIcon,
} from "lucide-react";

export type TrainingType = "SOP" | "Workflow" | "Tango" | "Video" | "Checklist" | "Quick Guide";
export type TrainingStatus = "not_started" | "in_progress" | "completed" | "overdue";
export type JourneyTone = "violet" | "sky" | "mint" | "rose" | "peach" | "lilac";

export type IconKey =
  | "ClipboardList" | "ShieldCheck" | "CalendarClock" | "Users" | "Heart"
  | "CheckCircle2" | "Wallet" | "Stethoscope" | "Crown" | "Workflow"
  | "BookOpen" | "Sparkles";

export const ICONS: Record<IconKey, LucideIcon> = {
  ClipboardList, ShieldCheck, CalendarClock, Users, Heart,
  CheckCircle2, Wallet, Stethoscope, Crown, Workflow, BookOpen, Sparkles,
};

export const TONES: JourneyTone[] = ["violet", "sky", "mint", "rose", "peach", "lilac"];

export interface TrainingResource {
  id: string;
  type: "PDF" | "Link" | "Tango" | "Video" | "Template";
  title: string;
  url: string;
}

export interface TrainingChecklistItem {
  id: string;
  item: string;
  required: boolean;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  type: TrainingType;
  estimatedMinutes: number;
  required?: boolean;
  category: "role" | "systems" | "shared";
  department?: string;
  owner?: string;
  lastUpdated?: string;
  // Deep editable content
  overview?: string;
  sopMarkdown?: string;
  tangoUrl?: string;
  videoUrl?: string;
  checklist?: TrainingChecklistItem[];
  resources?: TrainingResource[];
}

export interface RoleJourney {
  id: string;
  role: string;
  title: string;
  tagline: string;
  icon: IconKey;
  tone: JourneyTone;
  moduleIds: string[];
}

export interface TrainingProgress {
  trainingId: string;
  status: TrainingStatus;
  progressPercent: number;
  dueDate?: string;
}

/* ---------------- Seed ---------------- */

const SEED_TRAININGS: Training[] = [
  {
    id: "phone-leads",
    title: "Phone Calls & Leads",
    description: "End-to-end lead handling from first call through warm hand-off.",
    type: "Workflow", estimatedMinutes: 18, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-10",
    overview: "Why clean lead handling matters and how it sets up the rest of intake.",
    sopMarkdown: "## SOP\n1. Answer within 2 rings.\n2. Capture name, child age, insurance, state.\n3. Log lead in Blossom OS.\n4. Warm hand-off to the right state intake lead.",
    tangoUrl: "",
    checklist: [
      { id: "c1", item: "Read the SOP top to bottom", required: true },
      { id: "c2", item: "Shadow 2 live calls", required: true },
      { id: "c3", item: "Log your first lead end-to-end", required: true },
    ],
    resources: [
      { id: "r1", type: "Link", title: "Resource Library entry", url: "/sop" },
    ],
  },
  {
    id: "intake-workflow",
    title: "Intake Workflow",
    description: "From qualified lead to active client — stages, ownership, timing.",
    type: "Workflow", estimatedMinutes: 22, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-08",
    overview: "The full intake pipeline and who owns each stage.",
    sopMarkdown: "## Intake Stages\n- New Lead → Qualified → VOB → Setup → Active",
    checklist: [
      { id: "c1", item: "Walk one client through every stage", required: true },
    ],
    resources: [],
  },
  {
    id: "vob-basics",
    title: "VOB Fundamentals",
    description: "Verify benefits accurately and route the file correctly the first time.",
    type: "SOP", estimatedMinutes: 20, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-15",
    overview: "Insurance verification fundamentals.",
    sopMarkdown: "## VOB SOP\nUse Solum. Capture all fields. Flag exclusions.",
    checklist: [{ id: "c1", item: "Complete 3 VOBs with QA review", required: true }],
    resources: [{ id: "r1", type: "Link", title: "VOB Decision Guide", url: "/resources" }],
  },
  {
    id: "family-communication",
    title: "Family Communication",
    description: "Cadence, tone, and templates for parent communication.",
    type: "Quick Guide", estimatedMinutes: 10, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-04",
    overview: "How we talk to families at every stage.",
    checklist: [{ id: "c1", item: "Send 3 templated updates", required: true }],
    resources: [{ id: "r1", type: "Link", title: "Communication Templates", url: "/resources" }],
  },
  {
    id: "intake-foundations",
    title: "Intake Foundations",
    description: "What Intake owns, who we serve, and how the role connects to the rest of operations.",
    type: "Quick Guide", estimatedMinutes: 12, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-20",
    overview: "Intake exists to turn inquiries into ready-to-serve families. Calm, clear, fast.",
    sopMarkdown: "## Foundations\n- Intake is centralized (not state-scoped).\n- Goal: reduce time-to-service while keeping families informed.\n- Handoffs: Scheduling, BCBA, QA.",
    checklist: [{ id: "c1", item: "Read the Intake charter", required: true }],
    resources: [{ id: "r1", type: "Link", title: "Intake Workspace", url: "/os/intake/workspace" }],
  },
  {
    id: "insurance-basics",
    title: "Insurance Basics",
    description: "Plans, payers, networks, and what each one means for an ABA family.",
    type: "Quick Guide", estimatedMinutes: 15, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-18",
    overview: "A practical insurance primer for intake — no jargon, just what you actually need.",
    sopMarkdown: "## Cheat Sheet\n- Commercial vs Medicaid.\n- In-network vs out-of-network.\n- Common BCBS / Aetna / UHC quirks by state.",
    checklist: [{ id: "c1", item: "Pass the insurance vocab quiz", required: true }],
    resources: [{ id: "r1", type: "Link", title: "Insurance Cheat Sheet", url: "/resources" }],
  },
  {
    id: "assessment-coordination",
    title: "Assessment Coordination",
    description: "Schedule assessments, assign BCBAs, and keep families informed.",
    type: "Workflow", estimatedMinutes: 16, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-19",
    overview: "Owning the path from VOB approved to assessment complete.",
    sopMarkdown: "## Steps\n1. Confirm availability.\n2. Assign BCBA by state + caseload.\n3. Send pre-assessment packet.\n4. Confirm 24h before.",
    checklist: [{ id: "c1", item: "Coordinate one full assessment", required: true }],
    resources: [],
  },
  {
    id: "service-readiness",
    title: "Service Readiness",
    description: "What 'ready to serve' actually means and who signs off.",
    type: "SOP", estimatedMinutes: 12, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-17",
    overview: "Final-mile checklist before a family becomes active.",
    sopMarkdown: "## Readiness Checklist\n- Auth in hand.\n- BCBA assigned.\n- Schedule pattern proposed.\n- Family briefed.",
    checklist: [{ id: "c1", item: "Complete a readiness review", required: true }],
    resources: [],
  },
  {
    id: "intake-systems",
    title: "Intake Systems Training",
    description: "How Blossom OS Intake Workspace, CentralReach and Solum fit together.",
    type: "Tango", estimatedMinutes: 18, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-21",
    overview: "A click-by-click tour of every system you'll touch as an Intake Coordinator.",
    tangoUrl: "",
    checklist: [{ id: "c1", item: "Complete the Tango walkthrough", required: true }],
    resources: [{ id: "r1", type: "Link", title: "Intake Workspace", url: "/os/intake/workspace" }],
  },
  {
    id: "operational-escalations",
    title: "Operational Escalations",
    description: "When to escalate, who to escalate to, and how to write a clean escalation.",
    type: "Quick Guide", estimatedMinutes: 8, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-16",
    overview: "Escalations protect families and keep operations calm.",
    sopMarkdown: "## Escalation Path\nIntake Lead → State Director → Ops Leadership.",
    checklist: [{ id: "c1", item: "Write one practice escalation", required: false }],
    resources: [],
  },
  {
    id: "sys-centralreach",
    title: "CentralReach Basics",
    description: "The essentials every intake user needs to know in CR.",
    type: "Tango", estimatedMinutes: 14,
    category: "systems", department: "intake", owner: "Systems", lastUpdated: "2026-05-11",
    overview: "Client creation, scheduling fields, and where notes live.",
    checklist: [], resources: [],
  },
  {
    id: "sys-outlook",
    title: "Outlook Workflow",
    description: "Inbox rules, templates, and shared mailboxes.",
    type: "Quick Guide", estimatedMinutes: 8,
    category: "systems", department: "intake", owner: "Systems", lastUpdated: "2026-05-09",
    checklist: [], resources: [],
  },
  {
    id: "sys-teams",
    title: "Microsoft Teams",
    description: "Channels, mentions, and how Intake collaborates async.",
    type: "Quick Guide", estimatedMinutes: 6,
    category: "systems", department: "intake", owner: "Systems", lastUpdated: "2026-05-06",
    checklist: [], resources: [],
  },
  {
    id: "shared-scheduling-overview",
    title: "Scheduling Overview",
    description: "How scheduling thinks so intake can hand off cleanly.",
    type: "Quick Guide", estimatedMinutes: 10,
    category: "shared", department: "scheduling", owner: "Scheduling", lastUpdated: "2026-05-13",
    checklist: [], resources: [],
  },
  {
    id: "shared-qa-basics",
    title: "QA Basics",
    description: "What QA looks at and how intake quality shows up downstream.",
    type: "Quick Guide", estimatedMinutes: 10,
    category: "shared", department: "qa", owner: "QA", lastUpdated: "2026-05-14",
    checklist: [], resources: [],
  },

  /* ===================== QA Team Journey ===================== */
  {
    id: "qa-start-here",
    title: "Start Here",
    description: "Welcome to the QA Team — how QA supports Blossom operations and connects across the org.",
    type: "Quick Guide", estimatedMinutes: 12, required: true,
    category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-22",
    overview: "A calm introduction to the QA role at Blossom — what we own, who we work with, and how we keep operations quiet.",
    sopMarkdown: "## What QA owns\n- Authorization and treatment plan reviews\n- Progress report follow-ups\n- Missing-information workflows\n- Escalations and operational quality\n\n## How QA connects\nIntake → Authorizations → **QA** → BCBA → Scheduling.",
    checklist: [
      { id: "s1", item: "Welcome to the QA Team", required: true },
      { id: "s2", item: "How QA Supports Blossom Operations", required: true },
      { id: "s3", item: "QA Role Expectations", required: true },
      { id: "s4", item: "Understanding Workflow Visibility", required: true },
      { id: "s5", item: "How QA Connects with Intake / Auth / BCBA / Scheduling", required: true },
      { id: "s6", item: "Introduction to Blossom OS", required: true },
    ],
    resources: [
      { id: "r1", type: "Link", title: "QA Dashboard", url: "/qa-team" },
      { id: "r2", type: "Link", title: "QA Workspace", url: "/qa-workspace" },
    ],
  },
  {
    id: "qa-workflow-foundations",
    title: "QA Workflow Foundations",
    description: "The operational structure behind every QA workflow — queues, blockers, and daily prioritization.",
    type: "Workflow", estimatedMinutes: 18, required: true,
    category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-22",
    overview: "Understand how QA work moves from intake to completion and how to prioritize your day.",
    sopMarkdown: "## Workflow states\nAwaiting Review · Missing Information · Ready for Submission · Waiting on BCBA · Expiring Soon · Escalated · Completed.\n\n## Daily order\n1. Escalations\n2. Expiring inside 14 days\n3. Stalled reviews >5 days\n4. New reviews",
    checklist: [
      { id: "f1", item: "Understanding QA Workflow States", required: true },
      { id: "f2", item: "Review Queues Explained", required: true },
      { id: "f3", item: "Blocked Workflow Management", required: true },
      { id: "f4", item: "Expiring Workflow Visibility", required: true },
      { id: "f5", item: "Missing Information Workflows", required: true },
      { id: "f6", item: "Daily QA Prioritization", required: true },
    ],
    resources: [
      { id: "r1", type: "Link", title: "QA Workspace queues", url: "/qa-workspace" },
    ],
  },
  {
    id: "qa-authorization-review",
    title: "Authorization Review Process",
    description: "Reviewing authorizations end-to-end — from In QA Review to Ready for Submission.",
    type: "SOP", estimatedMinutes: 22, required: true,
    category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-22",
    overview: "How QA reviews authorization packets and coordinates with the Authorizations team.",
    sopMarkdown: "## Authorization statuses\n- Awaiting Submission\n- Submitted\n- Approved\n- Denied\n- Expiring Soon\n- In QA Review\n\n## QA review checklist\n1. Required documentation present\n2. Treatment plan attached and current\n3. Codes and units match auth\n4. Signatures captured\n5. Move to Ready for Submission",
    checklist: [
      { id: "a1", item: "Understanding Authorization Statuses", required: true },
      { id: "a2", item: "In QA Review Workflow", required: true },
      { id: "a3", item: "Ready for Submission Process", required: true },
      { id: "a4", item: "Missing Information Handling", required: true },
      { id: "a5", item: "Expiring Authorization Workflow", required: true },
      { id: "a6", item: "Coordination with Authorizations Team", required: true },
    ],
    resources: [
      { id: "r1", type: "Link", title: "Authorizations workspace", url: "/authorizations" },
    ],
  },
  {
    id: "qa-treatment-plan-review",
    title: "Treatment Plan Review Workflow",
    description: "Reviewing treatment plans, identifying missing items, and routing for corrections or submission.",
    type: "Workflow", estimatedMinutes: 20, required: true,
    category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-22",
    overview: "How treatment plans flow through QA — intake, review, corrections, and routing.",
    sopMarkdown: "## Path\nReceived → QA Review → (Corrections) → Ready → Submitted.\n\n## Common gaps\n- Missing parent signature\n- Goals not measurable\n- Supervision schedule unclear",
    checklist: [
      { id: "t1", item: "Treatment Plan Intake", required: true },
      { id: "t2", item: "Reviewing Treatment Plans", required: true },
      { id: "t3", item: "Identifying Missing Items", required: true },
      { id: "t4", item: "Returning Plans for Corrections", required: true },
      { id: "t5", item: "Routing to Submission", required: true },
      { id: "t6", item: "Escalation Process", required: true },
    ],
    resources: [],
  },
  {
    id: "qa-progress-report-followups",
    title: "Progress Report Follow-Ups",
    description: "PR timelines, GA vs multi-state workflows, BCBA follow-ups, and State Director escalation.",
    type: "Workflow", estimatedMinutes: 20, required: true,
    category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-22",
    overview: "How Blossom manages progress reports across states and when to escalate.",
    sopMarkdown: "## Georgia\n- Rivky Weissman begins outreach at **9 weeks** out\n- Shira and Rachel are looped in at **6 weeks** out\n\n## Other States\n- Rikki Wallach sends weekly notifications starting **9 weeks** out\n- Julianne is included in the PR workflow\n- State Director escalation begins at **6 weeks** if PR is missing\n\n## Parent signature\nTrack separately — escalate at 14 days outstanding.",
    checklist: [
      { id: "p1", item: "Progress Report Timeline Expectations", required: true },
      { id: "p2", item: "GA PR Workflow (Rivky · Shira · Rachel)", required: true },
      { id: "p3", item: "Multi-State PR Workflow (Rikki · Julianne · SD)", required: true },
      { id: "p4", item: "BCBA Follow-Up Standards", required: true },
      { id: "p5", item: "State Director Escalation Process", required: true },
      { id: "p6", item: "Parent Signature Coordination", required: true },
      { id: "p7", item: "Overdue PR Management", required: true },
    ],
    resources: [
      { id: "r1", type: "Link", title: "QA Dashboard — PR watchlist", url: "/qa-team" },
    ],
  },
  {
    id: "qa-escalation-standards",
    title: "Escalation Standards",
    description: "When to escalate, who to escalate to, and how to write a clean operational escalation.",
    type: "Quick Guide", estimatedMinutes: 12, required: true,
    category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-22",
    overview: "Escalations protect operations and families — use them early, write them clearly.",
    sopMarkdown: "## Escalation path\nBCBA → State Director → Operations Leadership.\n\n## Triggers\n- Workflow blocked >7 days\n- Authorization expiring inside 14 days\n- PR overdue inside 6 weeks of expiration\n- Denial received",
    checklist: [
      { id: "e1", item: "When to Escalate", required: true },
      { id: "e2", item: "Who to Escalate To", required: true },
      { id: "e3", item: "BCBA Escalation Rules", required: true },
      { id: "e4", item: "State Director Escalations", required: true },
      { id: "e5", item: "Authorization Escalations", required: true },
      { id: "e6", item: "Documentation Standards", required: true },
      { id: "e7", item: "Escalation Communication Best Practices", required: true },
    ],
    resources: [],
  },
  {
    id: "qa-communication-expectations",
    title: "Communication Expectations",
    description: "How QA communicates internally, with BCBAs, with parents, and across operational handoffs.",
    type: "Quick Guide", estimatedMinutes: 12, required: true,
    category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-22",
    overview: "Professional, calm, and supportive — the QA voice.",
    sopMarkdown: "## Principles\n- Lead with the workflow, not the problem\n- Tag the next owner clearly\n- Keep follow-ups under 48 hours\n- Document every escalation",
    checklist: [
      { id: "c1", item: "Internal QA Communication", required: true },
      { id: "c2", item: "BCBA Follow-Up Communication", required: true },
      { id: "c3", item: "Professional Escalation Messaging", required: true },
      { id: "c4", item: "Parent Communication Standards", required: true },
      { id: "c5", item: "Documentation Expectations", required: true },
      { id: "c6", item: "Workflow Update Expectations", required: true },
    ],
    resources: [],
  },
  {
    id: "qa-using-blossom-os",
    title: "Using Blossom OS for QA",
    description: "Navigating the QA Dashboard and Workspace, managing queues, and using Ask Blossom AI.",
    type: "Tango", estimatedMinutes: 18, required: true,
    category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-22",
    overview: "A click-by-click tour of the QA surfaces inside Blossom OS.",
    tangoUrl: "",
    checklist: [
      { id: "u1", item: "Navigating the QA Dashboard", required: true },
      { id: "u2", item: "Using the QA Workspace", required: true },
      { id: "u3", item: "Managing Review Queues", required: true },
      { id: "u4", item: "Updating Workflow Statuses", required: true },
      { id: "u5", item: "Using Search & Filters", required: true },
      { id: "u6", item: "Internal Notes & Follow-Ups", required: true },
      { id: "u7", item: "Using Ask Blossom AI", required: true },
    ],
    resources: [
      { id: "r1", type: "Link", title: "QA Dashboard", url: "/qa-team" },
      { id: "r2", type: "Link", title: "QA Workspace", url: "/qa-workspace" },
      { id: "r3", type: "Link", title: "Ask Blossom AI", url: "/ask-blossom-ai" },
    ],
  },
  {
    id: "qa-operational-standards",
    title: "QA Operational Standards",
    description: "Accuracy, consistency, timeliness, and the quality bar that keeps operations calm.",
    type: "SOP", estimatedMinutes: 14, required: true,
    category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-22",
    overview: "The standards we hold ourselves to as a QA team.",
    sopMarkdown: "## Standards\n- Review turnaround ≤ 2 days\n- Zero unaddressed escalations past 48h\n- All follow-ups documented in the workflow\n- Consistent status hygiene across all queues",
    checklist: [
      { id: "o1", item: "QA Accuracy Standards", required: true },
      { id: "o2", item: "Workflow Consistency", required: true },
      { id: "o3", item: "Timeliness Expectations", required: true },
      { id: "o4", item: "Reducing Operational Delays", required: true },
      { id: "o5", item: "Documentation Quality", required: true },
      { id: "o6", item: "Follow-Up Accountability", required: true },
      { id: "o7", item: "Maintaining Calm Operations", required: true },
    ],
    resources: [],
  },
];

/* ===================== Case Manager Journey ===================== */
const CASE_MANAGER_TRAININGS: Training[] = [
  {
    id: "cm-welcome",
    title: "Welcome to the Case Manager Role",
    description: "What the role is, what it isn't, and where Case Managers fit at Blossom.",
    type: "Quick Guide", estimatedMinutes: 12, required: true,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "The Case Manager is the family-relationship and service-continuity layer at Blossom — the warm bridge between families and operations.",
    sopMarkdown: "## What you own\n- Family relationships\n- Service continuity\n- Parent communication\n- Escalation clarity\n\n## What you support (not own)\n- Clinical decisions (BCBA)\n- Scheduling builds (Scheduling Team)\n- Auths (Authorization Coordinator)\n- HR / Payroll / Billing",
    checklist: [
      { id: "c1", item: "What a Case Manager Does at Blossom", required: true },
      { id: "c2", item: "The Family Relationship Bridge", required: true },
      { id: "c3", item: "What You Own vs. What You Support", required: true },
      { id: "c4", item: "How Case Managers Use Blossom OS", required: true },
    ],
    resources: [{ id: "r1", type: "Link", title: "Case Manager Dashboard", url: "/case-manager" }],
  },
  {
    id: "cm-assigned-families",
    title: "Assigned Families",
    description: "Read the family snapshot, understand status, and spot service continuity concerns.",
    type: "Workflow", estimatedMinutes: 15, required: true,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "How to use the Assigned Families area to stay close to every family without creating noise.",
    checklist: [
      { id: "c1", item: "Understanding Your Assigned Families", required: true },
      { id: "c2", item: "Reading the Family Snapshot", required: true },
      { id: "c3", item: "Spotting Service Continuity Concerns", required: true },
      { id: "c4", item: "Using Notes Without Creating Noise", required: true },
    ],
    resources: [{ id: "r1", type: "Link", title: "Assigned Families", url: "/case-manager/families" }],
  },
  {
    id: "cm-parent-communication",
    title: "Parent Communication",
    description: "Tone, cadence, documentation, and when communication becomes an escalation.",
    type: "SOP", estimatedMinutes: 18, required: true,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "Warm, calm, and clear — without making promises you can't control.",
    checklist: [
      { id: "c1", item: "Communicating With Parents Clearly", required: true },
      { id: "c2", item: "Follow-Up Expectations", required: true },
      { id: "c3", item: "How to Document Parent Conversations", required: true },
      { id: "c4", item: "What Not to Promise Families", required: true },
      { id: "c5", item: "When Communication Becomes an Escalation", required: true },
    ],
    resources: [{ id: "r1", type: "Link", title: "Parent Communication", url: "/case-manager/communication" }],
  },
  {
    id: "cm-family-support",
    title: "Family Support & Relationship Health",
    description: "Trust, frustration signals, and emotional intelligence in family support.",
    type: "Quick Guide", estimatedMinutes: 14, required: true,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "Support families beyond task tracking — recognize relationship risk early.",
    checklist: [
      { id: "c1", item: "Understanding Family Trust", required: true },
      { id: "c2", item: "Recognizing Relationship Risk", required: true },
      { id: "c3", item: "Supporting Families Through Delays", required: true },
      { id: "c4", item: "Staying Calm During Difficult Conversations", required: true },
    ],
    resources: [],
  },
  {
    id: "cm-followups",
    title: "Progress & Follow-Ups",
    description: "Close the loop. Keep issues from falling through the cracks.",
    type: "Workflow", estimatedMinutes: 12, required: true,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "How to manage follow-through, handoffs, and recurring concerns.",
    checklist: [
      { id: "c1", item: "Managing Open Follow-Ups", required: true },
      { id: "c2", item: "Keeping Issues From Falling Through the Cracks", required: true },
      { id: "c3", item: "Internal Handoff Best Practices", required: true },
      { id: "c4", item: "Closing the Loop With Families", required: true },
    ],
    resources: [{ id: "r1", type: "Link", title: "Follow-Ups", url: "/case-manager/follow-ups" }],
  },
  {
    id: "cm-scheduling",
    title: "Scheduling Coordination",
    description: "Scheduling visibility — without becoming the scheduler.",
    type: "Quick Guide", estimatedMinutes: 10, required: true,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "When to involve Scheduling, and how to talk to families about gaps.",
    checklist: [
      { id: "c1", item: "Understanding Scheduling Visibility", required: true },
      { id: "c2", item: "When to Involve Scheduling", required: true },
      { id: "c3", item: "Talking to Families About Schedule Gaps", required: true },
      { id: "c4", item: "Monitoring Service Continuity", required: true },
    ],
    resources: [{ id: "r1", type: "Link", title: "Scheduling Coordination", url: "/case-manager/scheduling" }],
  },
  {
    id: "cm-authorizations",
    title: "Authorization Visibility",
    description: "Auth status awareness — awaiting submission, submitted, approved, denied, expiring soon, QA review.",
    type: "Quick Guide", estimatedMinutes: 12, required: true,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "Awareness only — Case Managers know auth statuses but don't manage auths.",
    sopMarkdown: "## Statuses you'll see\n- Awaiting Submission\n- Submitted\n- Approved\n- Denied\n- Expiring Soon\n- QA Review\n- Flaked Client",
    checklist: [
      { id: "c1", item: "Understanding Authorization Statuses", required: true },
      { id: "c2", item: "What Expiring Soon Means", required: true },
      { id: "c3", item: "Missing Information and Family Communication", required: true },
      { id: "c4", item: "When to Loop in Authorizations", required: true },
    ],
    resources: [{ id: "r1", type: "Link", title: "Auth Visibility", url: "/case-manager/authorizations" }],
  },
  {
    id: "cm-staffing",
    title: "Staffing Coordination",
    description: "Staffing visibility from Needs RBT → Pending Start Date → Active.",
    type: "Quick Guide", estimatedMinutes: 10, required: true,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "Recognize staffing concerns and how they impact family trust.",
    sopMarkdown: "## Client flow\nPending Treatment Auth → Staffing Status → Staffing Needed → Pending Start Date → Active.",
    checklist: [
      { id: "c1", item: "Understanding Staffing Visibility", required: true },
      { id: "c2", item: "Needs RBT vs. RBT Confirmed", required: true },
      { id: "c3", item: "Communicating Staffing Delays", required: true },
      { id: "c4", item: "When to Escalate Staffing Concerns", required: true },
    ],
    resources: [{ id: "r1", type: "Link", title: "Staffing Coordination", url: "/case-manager/staffing" }],
  },
  {
    id: "cm-escalations",
    title: "Service Issues & Escalations",
    description: "Identify and escalate service issues calmly. Keep escalations actionable.",
    type: "SOP", estimatedMinutes: 15, required: true,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "Calm, clear, well-documented escalations protect families and operations.",
    checklist: [
      { id: "c1", item: "What Counts as a Service Issue", required: true },
      { id: "c2", item: "Understanding Services on Pause", required: true },
      { id: "c3", item: "Escalation Levels", required: true },
      { id: "c4", item: "How to Write a Clear Escalation Note", required: true },
      { id: "c5", item: "Keeping Escalations Calm and Actionable", required: true },
    ],
    resources: [{ id: "r1", type: "Link", title: "Escalations", url: "/case-manager/escalations" }],
  },
  {
    id: "cm-resources",
    title: "Community Referrals & Resources",
    description: "Share approved resources. Stay within role boundaries.",
    type: "Quick Guide", estimatedMinutes: 8,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "What you can recommend, what requires clinical or leadership approval.",
    checklist: [
      { id: "c1", item: "Using the Resource Library", required: true },
      { id: "c2", item: "Sharing Approved Family Resources", required: true },
      { id: "c3", item: "Community Referral Guidelines", required: true },
      { id: "c4", item: "Staying Within Role Boundaries", required: true },
    ],
    resources: [{ id: "r1", type: "Link", title: "Resource Library", url: "/case-manager/resources" }],
  },
  {
    id: "cm-ai",
    title: "Ask Blossom AI for Case Managers",
    description: "Use AI for summaries, drafts, and risk awareness — never for clinical decisions.",
    type: "Quick Guide", estimatedMinutes: 10,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "AI is a calm co-pilot. Human review always comes first.",
    checklist: [
      { id: "c1", item: "Using Ask Blossom AI for Family Support", required: true },
      { id: "c2", item: "AI Follow-Up Suggestions", required: true },
      { id: "c3", item: "AI Escalation Summaries", required: true },
      { id: "c4", item: "What Not to Ask AI", required: true },
      { id: "c5", item: "Human Review Always Comes First", required: true },
    ],
    resources: [{ id: "r1", type: "Link", title: "Ask Blossom AI", url: "/case-manager/ai" }],
  },
  {
    id: "cm-readiness",
    title: "Case Manager Readiness Check",
    description: "Final review — role understanding, communication, escalation, and family support mindset.",
    type: "Checklist", estimatedMinutes: 15, required: true,
    category: "role", department: "case_management", owner: "Case Manager Lead", lastUpdated: "2026-05-26",
    overview: "Confirm you're ready to support families with confidence and calm.",
    checklist: [
      { id: "c1", item: "Case Manager Role Review", required: true },
      { id: "c2", item: "Communication Readiness", required: true },
      { id: "c3", item: "Escalation Readiness", required: true },
      { id: "c4", item: "Final Acknowledgement", required: true },
    ],
    resources: [],
  },
];

SEED_TRAININGS.push(...CASE_MANAGER_TRAININGS);

/* ===================== State Director Journey ===================== */
const SD_OWNER = "State Director Program";
const SD_DATE = "2026-05-26";
const sd = (
  id: string,
  title: string,
  description: string,
  type: TrainingType,
  minutes: number,
  overview: string,
  items: string[],
  opts: { required?: boolean; category?: "role" | "systems" | "shared"; sopMarkdown?: string; resources?: TrainingResource[] } = {},
): Training => ({
  id,
  title,
  description,
  type,
  estimatedMinutes: minutes,
  required: opts.required ?? true,
  category: opts.category ?? "role",
  department: "state_operations",
  owner: SD_OWNER,
  lastUpdated: SD_DATE,
  overview,
  sopMarkdown: opts.sopMarkdown,
  checklist: items.map((item, i) => ({ id: `${id}-c${i + 1}`, item, required: true })),
  resources: opts.resources ?? [],
});

const STATE_DIRECTOR_TRAININGS: Training[] = [
  // ---- 14 Required Modules ----
  sd("sd-m1-welcome", "Welcome to Blossom ABA",
    "Mission, philosophy, and the Blossom multi-state ecosystem.",
    "Quick Guide", 12,
    "How Blossom thinks about families, clinicians, and operations — the foundation every State Director leads from.",
    ["Company mission", "ABA overview", "Family-first philosophy", "Multi-state operations", "Understanding the Blossom ecosystem"]),

  sd("sd-m2-role", "Understanding the State Director Role",
    "Operational ownership, leadership, escalation, and accountability.",
    "SOP", 18,
    "What a State Director owns, who they answer to, and how they hold a state accountable end-to-end.",
    ["SD responsibilities", "Operational ownership", "Leadership expectations", "Department coordination", "Accountability structure", "Escalation ownership"]),

  sd("sd-m3-org", "Executive & Department Structure",
    "Every department, every handoff, every dependency.",
    "Quick Guide", 15,
    "Know who owns what across Blossom so you can route, escalate, and coordinate without friction.",
    ["Executive leadership", "Operations leadership", "Intake", "Authorizations", "Scheduling", "QA", "Recruiting", "Billing", "Marketing", "Clinics", "Training"]),

  sd("sd-m4-winning-state", "The Winning State Philosophy",
    "Honest communication, data integrity, utilization, ecosystem oversight.",
    "SOP", 18,
    "The operating philosophy from the SD workbook — the difference between running a state and reacting to one.",
    ["Honest communication", "Data integrity", "High utilization", "Ecosystem oversight", "Operational flow vs damage control"]),

  sd("sd-m5-cr-foundations", "CentralReach Foundations",
    "CR as source of truth — navigation, calendar, scheduler, labels.",
    "Tango", 22,
    "The CR fundamentals every SD needs to read the state at a glance.",
    ["CR overview", "Source of truth philosophy", "Navigation basics", "Calendar system", "Scheduler overview", "Labels & filtering", "Month/week/day views"]),

  sd("sd-m6-sessions", "Session Management & Scheduling Oversight",
    "Converted sessions, missing sessions, coverage gaps, cancellations.",
    "Workflow", 24,
    "Tracking session reality across the state — the single most leverage-heavy operational lens an SD has.",
    ["Converted vs non-converted sessions", "Session accountability", "Tracking missing sessions", "Scheduling oversight", "Coverage gaps", "Client cancellations", "RBT cancellations", "Assessment tracking"]),

  sd("sd-m7-cpt", "CPT Codes & ABA Billing Basics",
    "97151, 97153, 97155, 97156 and how billing connects to operations.",
    "Quick Guide", 14,
    "Billing awareness for SDs — enough to read utilization and spot revenue risk without becoming a biller.",
    ["97151 assessments", "97153 direct therapy", "97155 supervision", "97156 parent training", "Assessments", "Direct therapy", "Supervision", "Parent training", "Billing awareness"]),

  sd("sd-m8-utilization", "Utilization Management",
    "Pending vs actual, weekly vs bulk auths, decay, ghost sessions.",
    "SOP", 22,
    "Utilization is the SD scoreboard. Learn to read it, defend it, and grow it.",
    ["Pending vs actual hours", "Utilization %", "Weekly vs bulk authorizations", "Underutilization", "Overutilization", "Maximizing hours", "Preventing utilization decay", "Ghost sessions"]),

  sd("sd-m9-auths", "Authorizations Oversight",
    "Auth lifecycle, expirations, QA review, BCBA accountability.",
    "Workflow", 22,
    "How auths move through Blossom and where SDs need to apply pressure to prevent gaps.",
    ["Authorization lifecycle", "Awaiting submission", "Submitted vs approved", "Expiring soon", "QA review", "Treatment auth workflow", "Preventing auth gaps", "Progress reports", "Reassessments", "BCBA accountability"]),

  sd("sd-m10-intake", "Intake & Client Lifecycle",
    "Lead → VOB → Payment plan → Assessment → Staffing → Active.",
    "Workflow", 26,
    "The full client lifecycle so SDs can read where any family is and what's blocking them.",
    ["Lead intake workflow", "Phone calls workflow", "Initial forms", "Consent forms", "Missing information", "VOB process", "Solum & Eligipro overview", "Payment plans", "Assessment scheduling", "Staffing needed workflow", "Pending start dates", "Active clients", "Flaked clients"]),

  sd("sd-m11-staffing", "Staffing & Clinical Operations",
    "BCBA / RBT oversight, pairing, capacity, state coverage.",
    "Workflow", 20,
    "How the clinical ecosystem actually runs day-to-day and how SDs steward it.",
    ["Staffing ecosystem", "BCBA oversight", "RBT oversight", "Pairing process", "Scheduling health", "Capacity management", "State coverage awareness", "Clinical flow management"]),

  sd("sd-m12-recruiting", "Recruiting & Workforce Operations",
    "Apploi, screening, BACB, interviews, offers, orientation.",
    "Workflow", 18,
    "How candidates become workforce — and where SDs influence pipeline health.",
    ["Recruiting workflow", "Apploi overview", "Resume screening", "BACB verification", "Interview flow", "Offer letters", "Orientation process", "Background checks", "Workforce readiness"]),

  sd("sd-m13-escalations", "Parent & BCBA Escalations",
    "Difficult parents, missing PRs, delayed assessments, conflict resolution.",
    "SOP", 16,
    "Calm, clear escalation handling — the SD as the last calm voice in the room.",
    ["Difficult parent situations", "BCBA follow-up", "Missing PRs", "Delayed assessments", "Communication standards", "Escalation expectations", "Conflict resolution"]),

  sd("sd-m14-leadership", "Operational Leadership & State Ownership",
    "Weekly meetings, KPIs, prioritization, becoming the system architect.",
    "SOP", 22,
    "The leadership rhythm of a high-performing state and the mindset of a Director who builds systems.",
    ["Running weekly meetings", "KPI oversight", "Cross-department coordination", "Managing operational chaos", "Protecting utilization", "Operational prioritization", "Accountability systems", "Becoming the system architect"]),

  // ---- Required Shadowing ----
  sd("sd-shadow-gary", "Shadow Gary Frank — 3 Days",
    "Three days shadowing Gary to absorb the SD operating standard.",
    "Checklist", 1440,
    "Live observation of how a Blossom SD runs a week. Capture rhythms, decisions, and escalations.",
    ["Day 1 shadow notes", "Day 2 shadow notes", "Day 3 shadow notes", "Debrief with Gary"]),
  sd("sd-shadow-intake", "Shadow Intake Team",
    "Sit alongside intake to see lead flow in real time.",
    "Checklist", 240,
    "Watch live calls, VOBs, and handoffs to understand how a family becomes a client.",
    ["Shadow live intake calls", "Observe VOB workflow", "Observe handoff to scheduling", "Debrief with Intake Lead"]),
  sd("sd-shadow-scheduling", "Shadow Scheduling Team",
    "Live observation of scheduling, gaps, and coverage decisions.",
    "Checklist", 240,
    "Understand how schedules are actually built and where they break.",
    ["Observe schedule build", "Watch cancellation handling", "Observe coverage decisions", "Debrief with Scheduling Lead"]),
  sd("sd-shadow-auth", "Shadow Authorizations Team",
    "Watch auth submissions, denials, and follow-ups end-to-end.",
    "Checklist", 240,
    "See how auths actually move through Blossom from submission to approval.",
    ["Observe auth submission", "Watch QA review handoff", "Observe denial workflow", "Debrief with Authorizations Lead"]),
  sd("sd-shadow-qa", "Shadow QA Team",
    "Sit with QA to see treatment plan reviews and PR follow-ups.",
    "Checklist", 180,
    "QA is where operational quality is enforced. See it firsthand.",
    ["Observe treatment plan review", "Watch PR follow-up cadence", "Observe escalation routing", "Debrief with QA Lead"]),
  sd("sd-shadow-recruiting", "Shadow Recruiting Team",
    "Observe screening, interviews, and orientation flow.",
    "Checklist", 180,
    "Recruiting is the pipeline. Understand the friction points.",
    ["Observe resume screening", "Sit in on an interview", "Observe orientation onboarding", "Debrief with Recruiting Lead"]),
  sd("sd-shadow-sd", "Shadow Existing State Director",
    "Spend a full operating week with a tenured State Director.",
    "Checklist", 480,
    "Live observation of how an established SD prioritizes, escalates, and leads their week.",
    ["Shadow weekly leadership meeting", "Observe KPI review", "Observe escalation triage", "Debrief with SD"]),
  sd("sd-shadow-bcba", "Shadow BCBA Operations",
    "Sit with BCBAs to understand clinical reality on the ground.",
    "Checklist", 180,
    "How BCBAs run their day — clinical reality drives every operational decision.",
    ["Observe BCBA session prep", "Watch supervision time", "Observe parent meeting", "Debrief with BCBA"]),
  sd("sd-shadow-leadership", "Shadow Leadership Meeting",
    "Attend a full leadership meeting as an observer.",
    "Checklist", 90,
    "Understand the leadership rhythm Blossom runs on.",
    ["Pre-read agenda", "Attend full meeting", "Capture key decisions", "Debrief with leadership"]),

  // ---- Required System Training ----
  sd("sd-sys-cr", "CentralReach (SD Depth)",
    "Deeper CR workflows for state oversight.",
    "Tango", 30,
    "Beyond fundamentals — the views, reports, and scheduler depth an SD needs daily.",
    ["Caseload views", "Scheduler depth", "Reporting basics", "Notes & supervision"],
    { category: "systems" }),
  sd("sd-sys-monday", "Monday.com",
    "Operational boards used across Blossom.",
    "Tango", 15,
    "How Blossom uses Monday for cross-team operational workflows.",
    ["Board navigation", "Column filters", "Status updates", "SD-relevant boards"],
    { category: "systems" }),
  sd("sd-sys-solum", "Solum",
    "VOB workflow tooling.",
    "Quick Guide", 10,
    "What Solum is and how to read VOB output as an SD.",
    ["VOB request flow", "Reading VOB results", "Common edge cases"],
    { category: "systems" }),
  sd("sd-sys-eligipro", "Eligipro",
    "Eligibility verification tool.",
    "Quick Guide", 10,
    "When and how Eligipro is used in the intake stack.",
    ["Eligipro overview", "When to use", "Common signals"],
    { category: "systems" }),
  sd("sd-sys-apploi", "Apploi",
    "Recruiting ATS basics.",
    "Quick Guide", 10,
    "How Apploi feeds the recruiting pipeline.",
    ["Pipeline overview", "Candidate stages", "SD visibility"],
    { category: "systems" }),
  sd("sd-sys-viventium", "Viventium",
    "Payroll & HRIS overview for SDs.",
    "Quick Guide", 10,
    "What an SD needs to know about payroll and HRIS context.",
    ["Viventium overview", "What SDs see", "Escalation path"],
    { category: "systems" }),
  sd("sd-sys-qglobal", "Q-Global",
    "Assessment platform overview.",
    "Quick Guide", 10,
    "Q-Global basics for SDs supporting clinical assessment workflows.",
    ["Q-Global overview", "Clinical workflow context", "SD visibility"],
    { category: "systems" }),
  sd("sd-sys-vbmapp", "VB-MAPP",
    "Assessment framework overview.",
    "Quick Guide", 10,
    "VB-MAPP basics for SDs supporting clinical conversations.",
    ["VB-MAPP overview", "How it informs assessments", "SD touchpoints"],
    { category: "systems" }),

  // ---- Required SOP / Resource Training ----
  sd("sd-sop-leads", "Leads SOP",
    "How leads are handled across Blossom.",
    "SOP", 12,
    "The canonical Leads SOP — every SD needs to read this end-to-end.",
    ["Read full SOP", "Understand intake handoff", "Know escalation rules"]),
  sd("sd-sop-clients", "Clients SOP",
    "Client lifecycle and ownership.",
    "SOP", 12,
    "The canonical Clients SOP across all states.",
    ["Read full SOP", "Understand status transitions", "Know SD oversight points"]),
  sd("sd-sop-auth", "Auth SOP",
    "Authorization lifecycle, submission, and review.",
    "SOP", 14,
    "The canonical Authorizations SOP — including QA review and escalations.",
    ["Read full SOP", "Understand expiration handling", "Know QA review rules"]),
  sd("sd-sop-eob", "EOB / Payment Plan Process",
    "Payment plans and EOB handling.",
    "SOP", 12,
    "How Blossom handles payment plans and EOB reconciliation.",
    ["Read full SOP", "Understand payment plan triggers", "Know finance escalation path"]),
  sd("sd-sop-recruiting", "Recruiting Workflow",
    "Full recruiting workflow from inbound to active hire.",
    "Workflow", 12,
    "The canonical recruiting workflow used across Blossom.",
    ["Read full workflow", "Understand stage ownership", "Know SD escalation points"]),
  sd("sd-sop-tangos", "Tangos / CR Workflows",
    "Curated Tangos for the most common CR workflows.",
    "Tango", 20,
    "Click-by-click CR walkthroughs an SD references constantly.",
    ["Walk through scheduler Tango", "Walk through caseload Tango", "Walk through report Tango"]),

  // ---- Continued Education (Optional) ----
  sd("sd-ce-utilization-advanced", "Advanced Utilization Analysis",
    "Deeper utilization patterns and corrective levers.", "SOP", 20,
    "Once fluent, learn the deeper levers behind utilization performance.",
    ["Pattern detection", "Corrective actions", "Forecasting"], { required: false }),
  sd("sd-ce-insurance-advanced", "Advanced Insurance Rules", "Payer-specific quirks and edge cases.", "Quick Guide", 15,
    "Going past the basics into payer-specific operational implications.",
    ["Payer quirks", "Edge cases", "When to escalate"], { required: false }),
  sd("sd-ce-fraud", "Fraud Detection Awareness", "Spotting operational red flags early.", "Quick Guide", 12,
    "What fraud looks like operationally and how to surface it responsibly.",
    ["Red flags", "Surfacing concerns", "Escalation path"], { required: false }),
  sd("sd-ce-scheduling-advanced", "Advanced Scheduling Oversight", "Coverage modeling and resilience.", "Workflow", 18,
    "Advanced techniques for protecting schedule resilience.",
    ["Coverage modeling", "Resilience tactics", "Risk scenarios"], { required: false }),
  sd("sd-ce-multistate", "Multi-State Leadership", "Leading across more than one state.", "SOP", 18,
    "When an SD's scope grows beyond a single state.",
    ["Cross-state coordination", "Standardization", "Cultural rhythm"], { required: false }),
  sd("sd-ce-expansion", "Expansion Planning", "Standing up new markets.", "Workflow", 18,
    "What it takes to bring a new state online operationally.",
    ["Market readiness", "Staffing build", "Operational sequencing"], { required: false }),
  sd("sd-ce-burnout", "Burnout Prevention", "Sustainable leadership rhythm.", "Quick Guide", 10,
    "Protect the operator. Burnt-out SDs make burnt-out states.",
    ["Signals", "Boundaries", "Team rhythm"], { required: false }),
  sd("sd-ce-crisis", "Crisis Management", "Operating during operational crises.", "SOP", 15,
    "How to hold a state together when things break.",
    ["Crisis triage", "Communication", "Recovery sequencing"], { required: false }),
  sd("sd-ce-kpi-advanced", "Advanced KPI Management", "Reading and influencing KPIs at depth.", "SOP", 18,
    "Going past dashboard literacy into KPI strategy.",
    ["KPI strategy", "Leading vs lagging", "Driving change"], { required: false }),
  sd("sd-ce-revenue", "Revenue Awareness", "How operations creates (or loses) revenue.", "Quick Guide", 12,
    "Revenue literacy for SDs without becoming a finance role.",
    ["Revenue drivers", "Operational leakage", "Reading reports"], { required: false }),
  sd("sd-ce-staffing-markets", "Difficult Staffing Markets", "Operating where the labor market is hostile.", "Workflow", 15,
    "Tactical playbook for tough staffing environments.",
    ["Diagnostics", "Tactical levers", "Long-term plays"], { required: false }),
  sd("sd-ce-escalations-advanced", "Advanced Parent Escalations", "Handling the hardest family conversations.", "SOP", 18,
    "Tactics for escalations that require senior calm and clarity.",
    ["Hardest cases", "Documentation", "Legal awareness"], { required: false }),
  sd("sd-ce-coaching", "Leadership Coaching", "Coaching frameworks for the SD role.", "Quick Guide", 15,
    "Becoming a coach to your team, not just a manager.",
    ["Coaching basics", "Feedback frameworks", "Developing leaders"], { required: false }),
  sd("sd-ce-forecasting", "Operational Forecasting", "Reading the next 90 days, not the last 7.", "SOP", 18,
    "How great SDs anticipate operational risk.",
    ["Forecast inputs", "Signals", "Pre-mortems"], { required: false }),
];

SEED_TRAININGS.push(...STATE_DIRECTOR_TRAININGS);

/** Only Intake is seeded with modules. Other roles get empty journeys ready to edit. */
const SEED_JOURNEYS: RoleJourney[] = [
  { id: "j-intake", role: "intake_coordinator", title: "Intake Coordinator Journey", tagline: "From first phone call to a happy active client.", icon: "ClipboardList", tone: "lilac", moduleIds: [
    "intake-foundations",
    "phone-leads",
    "intake-workflow",
    "insurance-basics",
    "vob-basics",
    "family-communication",
    "assessment-coordination",
    "service-readiness",
    "intake-systems",
    "operational-escalations",
  ] },
  { id: "j-auth", role: "authorization_coordinator", title: "Authorization Coordinator Journey", tagline: "Auths approved on time, every time.", icon: "ShieldCheck", tone: "sky", moduleIds: [] },
  { id: "j-scheduling", role: "scheduling_team", title: "Scheduling Journey", tagline: "Build clean schedules that hold up.", icon: "CalendarClock", tone: "mint", moduleIds: [] },
  { id: "j-qa", role: "qa_team", title: "QA Team Journey",
    tagline: "Learn Blossom QA workflows, review systems, escalation processes, and operational quality standards.",
    icon: "CheckCircle2", tone: "violet", moduleIds: [
      "qa-start-here",
      "qa-workflow-foundations",
      "qa-authorization-review",
      "qa-treatment-plan-review",
      "qa-progress-report-followups",
      "qa-escalation-standards",
      "qa-communication-expectations",
      "qa-using-blossom-os",
      "qa-operational-standards",
    ] },
  { id: "j-recruiting", role: "recruiting_team", title: "Recruiting Journey", tagline: "A predictable pipeline of great clinicians.", icon: "Users", tone: "peach", moduleIds: [] },
  { id: "j-bcba", role: "bcba", title: "BCBA Journey", tagline: "Clinical excellence and clean supervision.", icon: "Stethoscope", tone: "sky", moduleIds: [] },
  { id: "j-rbt", role: "rbt", title: "RBT Journey", tagline: "Show up prepared, document on time.", icon: "Stethoscope", tone: "mint", moduleIds: [] },
  { id: "j-state", role: "state_director", title: "State Director Journey",
    tagline: "Run a state with calm, operational rhythm — utilization, staffing, auths, intake, and leadership.",
    icon: "Crown", tone: "violet", moduleIds: [
      "sd-m1-welcome",
      "sd-m2-role",
      "sd-m3-org",
      "sd-m4-winning-state",
      "sd-m5-cr-foundations",
      "sd-m6-sessions",
      "sd-m7-cpt",
      "sd-m8-utilization",
      "sd-m9-auths",
      "sd-m10-intake",
      "sd-m11-staffing",
      "sd-m12-recruiting",
      "sd-m13-escalations",
      "sd-m14-leadership",
      "sd-shadow-gary",
      "sd-shadow-intake",
      "sd-shadow-scheduling",
      "sd-shadow-auth",
      "sd-shadow-qa",
      "sd-shadow-recruiting",
      "sd-shadow-sd",
      "sd-shadow-bcba",
      "sd-shadow-leadership",
      "sd-sys-cr",
      "sd-sys-monday",
      "sd-sys-solum",
      "sd-sys-eligipro",
      "sd-sys-apploi",
      "sd-sys-viventium",
      "sd-sys-qglobal",
      "sd-sys-vbmapp",
      "sd-sop-leads",
      "sd-sop-clients",
      "sd-sop-auth",
      "sd-sop-eob",
      "sd-sop-recruiting",
      "sd-sop-tangos",
      "sd-ce-utilization-advanced",
      "sd-ce-insurance-advanced",
      "sd-ce-fraud",
      "sd-ce-scheduling-advanced",
      "sd-ce-multistate",
      "sd-ce-expansion",
      "sd-ce-burnout",
      "sd-ce-crisis",
      "sd-ce-kpi-advanced",
      "sd-ce-revenue",
      "sd-ce-staffing-markets",
      "sd-ce-escalations-advanced",
      "sd-ce-coaching",
      "sd-ce-forecasting",
    ] },
  { id: "j-hr", role: "hr_team", title: "HR Journey", tagline: "Take care of the people who take care of clients.", icon: "Heart", tone: "rose", moduleIds: [] },
  { id: "j-billing", role: "billing_finance", title: "Billing & Finance Journey", tagline: "Keep revenue clean and predictable.", icon: "Wallet", tone: "lilac", moduleIds: [] },
  { id: "j-exec", role: "executive_leadership", title: "Executive Leadership Journey", tagline: "Lead Blossom with rhythm and clarity.", icon: "Crown", tone: "violet", moduleIds: [] },
  { id: "j-ops", role: "operations_leadership", title: "Operations Leadership Journey", tagline: "Keep all states pulling the same direction.", icon: "Workflow", tone: "violet", moduleIds: [] },
  { id: "j-case-manager", role: "case_manager", title: "Case Manager Onboarding Journey",
    tagline: "Learn how to support families, coordinate service continuity, and keep communication calm, clear, and consistent.",
    icon: "Heart", tone: "rose", moduleIds: [
      "cm-welcome",
      "cm-assigned-families",
      "cm-parent-communication",
      "cm-family-support",
      "cm-followups",
      "cm-scheduling",
      "cm-authorizations",
      "cm-staffing",
      "cm-escalations",
      "cm-resources",
      "cm-ai",
      "cm-readiness",
    ] },
];

/* ---------------- Store ---------------- */

interface AcademyState {
  trainings: Training[];
  journeys: RoleJourney[];
}

const STORAGE_KEY = "blossom.training.academy.v6";

function loadInitial(): AcademyState {
  if (typeof window === "undefined") {
    return { trainings: SEED_TRAININGS, journeys: SEED_JOURNEYS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AcademyState;
      if (parsed?.trainings && parsed?.journeys) return parsed;
    }
  } catch { /* ignore */ }
  return { trainings: SEED_TRAININGS, journeys: SEED_JOURNEYS };
}

let state: AcademyState = loadInitial();
const listeners = new Set<() => void>();

function emit() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

function getSnapshot() { return state; }

export function useAcademy(): AcademyState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* ---------------- Mutations ---------------- */

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function resetAcademy() {
  state = { trainings: SEED_TRAININGS, journeys: SEED_JOURNEYS };
  emit();
}

export function clearAllModules() {
  state = {
    trainings: [],
    journeys: state.journeys.map((j) => ({ ...j, moduleIds: [] })),
  };
  emit();
}

export function upsertTraining(t: Training) {
  const idx = state.trainings.findIndex((x) => x.id === t.id);
  const next = [...state.trainings];
  if (idx >= 0) next[idx] = t;
  else next.push(t);
  state = { ...state, trainings: next };
  emit();
}

export function createTraining(partial: Partial<Training> & { title: string }): Training {
  const t: Training = {
    id: genId("m"),
    title: partial.title,
    description: partial.description ?? "",
    type: partial.type ?? "SOP",
    estimatedMinutes: partial.estimatedMinutes ?? 10,
    required: partial.required ?? false,
    category: partial.category ?? "role",
    department: partial.department,
    owner: partial.owner,
    lastUpdated: new Date().toISOString().slice(0, 10),
    overview: partial.overview ?? "",
    sopMarkdown: partial.sopMarkdown ?? "",
    tangoUrl: partial.tangoUrl ?? "",
    videoUrl: partial.videoUrl ?? "",
    checklist: partial.checklist ?? [],
    resources: partial.resources ?? [],
  };
  state = { ...state, trainings: [...state.trainings, t] };
  emit();
  return t;
}

export function deleteTraining(id: string) {
  state = {
    trainings: state.trainings.filter((t) => t.id !== id),
    journeys: state.journeys.map((j) => ({ ...j, moduleIds: j.moduleIds.filter((m) => m !== id) })),
  };
  emit();
}

export function updateJourney(id: string, patch: Partial<Omit<RoleJourney, "id" | "role">>) {
  state = {
    ...state,
    journeys: state.journeys.map((j) => (j.id === id ? { ...j, ...patch } : j)),
  };
  emit();
}

export function setJourneyModules(journeyId: string, moduleIds: string[]) {
  updateJourney(journeyId, { moduleIds });
}

export function addModuleToJourney(journeyId: string, moduleId: string) {
  const j = state.journeys.find((x) => x.id === journeyId);
  if (!j || j.moduleIds.includes(moduleId)) return;
  setJourneyModules(journeyId, [...j.moduleIds, moduleId]);
}

export function removeModuleFromJourney(journeyId: string, moduleId: string) {
  const j = state.journeys.find((x) => x.id === journeyId);
  if (!j) return;
  setJourneyModules(journeyId, j.moduleIds.filter((m) => m !== moduleId));
}

export function reorderJourneyModule(journeyId: string, fromIndex: number, toIndex: number) {
  const j = state.journeys.find((x) => x.id === journeyId);
  if (!j) return;
  const ids = [...j.moduleIds];
  const [moved] = ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, moved);
  setJourneyModules(journeyId, ids);
}

/* ---------------- Mock progress ---------------- */

export const trainingProgress: Record<string, TrainingProgress> = {
  "intake-foundations": { trainingId: "intake-foundations", status: "completed", progressPercent: 100 },
  "phone-leads": { trainingId: "phone-leads", status: "completed", progressPercent: 100 },
  "intake-workflow": { trainingId: "intake-workflow", status: "in_progress", progressPercent: 60 },
  "insurance-basics": { trainingId: "insurance-basics", status: "in_progress", progressPercent: 25 },
  "vob-basics": { trainingId: "vob-basics", status: "overdue", progressPercent: 10, dueDate: "2026-05-18" },
};

export function getProgress(id: string): TrainingProgress {
  return trainingProgress[id] ?? { trainingId: id, status: "not_started", progressPercent: 0 };
}

/* ---------------- Lookups (read live state) ---------------- */

export function getTrainings(): Training[] { return state.trainings; }
export function getJourneys(): RoleJourney[] { return state.journeys; }

export function getTraining(id: string): Training | undefined {
  return state.trainings.find((t) => t.id === id);
}

export function getJourneyForRole(role: string): RoleJourney {
  const direct = state.journeys.find((j) => j.role === role);
  if (direct) return direct;
  if (role === "super_admin") {
    return state.journeys.find((j) => j.role === "executive_leadership")
      ?? state.journeys[0]
      ?? { id: "j-empty", role, title: "Your Journey", tagline: "No modules yet.", icon: "BookOpen", tone: "violet", moduleIds: [] };
  }
  return state.journeys.find((j) => j.role === "operations_leadership")
    ?? state.journeys[0]
    ?? { id: "j-empty", role, title: "Your Journey", tagline: "No modules yet.", icon: "BookOpen", tone: "violet", moduleIds: [] };
}

export function getJourneyModules(j: RoleJourney): Training[] {
  return j.moduleIds.map((id) => getTraining(id)).filter(Boolean) as Training[];
}

export function continueLearning(): { training: Training; progress: TrainingProgress }[] {
  return Object.values(trainingProgress)
    .filter((p) => p.status === "in_progress" || p.status === "overdue")
    .map((p) => ({ training: getTraining(p.trainingId)!, progress: p }))
    .filter((x) => x.training);
}

export function requiredDue(): Training[] {
  return state.trainings.filter((t) => t.required && getProgress(t.id).status !== "completed");
}

export function systemsTrainings(): Training[] {
  return state.trainings.filter((t) => t.category === "systems");
}

export function sharedTrainings(): Training[] {
  return state.trainings.filter((t) => t.category === "shared");
}

export function searchTrainings(q: string): Training[] {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return state.trainings.filter((t) =>
    [t.title, t.description, t.type, t.department ?? "", t.owner ?? ""]
      .join(" ").toLowerCase().includes(term),
  );
}

/** Recently published / updated modules — sorted by lastUpdated desc. */
export function recentlyAdded(limit = 4): Training[] {
  return [...state.trainings]
    .filter((t) => !!t.lastUpdated)
    .sort((a, b) => (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? ""))
    .slice(0, limit);
}

/** Required modules scoped to a department (role-aware). */
export function requiredForDepartment(department: string): Training[] {
  return state.trainings.filter(
    (t) => t.required && (t.department ?? "").toLowerCase() === department.toLowerCase(),
  );
}

/* ---------------- Detail-page compatibility ---------------- */

export type TrainingSectionType = "Overview" | "SOP" | "Walkthrough" | "Checklist" | "Quiz" | "Resources";

export interface TrainingSection {
  id: string;
  trainingId: string;
  type: TrainingSectionType;
  title: string;
  content?: string;
  tangoUrl?: string;
  videoUrl?: string;
}

export function getSectionsFor(id: string): TrainingSection[] {
  const t = getTraining(id);
  return [
    { id: `${id}-ov`, trainingId: id, type: "Overview", title: "Overview", content: t?.overview || "Why this module matters and how it connects to your role." },
    { id: `${id}-sop`, trainingId: id, type: "SOP", title: "Standard Operating Procedure", content: t?.sopMarkdown || "## SOP\nThe written SOP for this module lives in the Resource Library and is linked here." },
    { id: `${id}-wt`, trainingId: id, type: "Walkthrough", title: "Tango Walkthrough", content: "Click-by-click walkthrough.", tangoUrl: t?.tangoUrl || "#", videoUrl: t?.videoUrl },
    { id: `${id}-ck`, trainingId: id, type: "Checklist", title: "Checklist" },
    { id: `${id}-rs`, trainingId: id, type: "Resources", title: "Resources" },
  ];
}

export function getChecklistFor(id: string): (TrainingChecklistItem & { trainingId: string })[] {
  const t = getTraining(id);
  return (t?.checklist ?? []).map((c) => ({ ...c, trainingId: id }));
}

export function getResourcesFor(id: string): (TrainingResource & { trainingId: string })[] {
  const t = getTraining(id);
  return (t?.resources ?? []).map((r) => ({ ...r, trainingId: id }));
}

export interface TrainingQuizQuestion {
  id: string;
  question: string;
  kind: "multiple_choice" | "true_false";
  options: string[];
  answerIndex: number;
}

export const trainingQuiz: TrainingQuizQuestion[] = [];
