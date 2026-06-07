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

export type TrainingType =
  | "SOP"
  | "Workflow"
  | "Tango"
  | "Video"
  | "Checklist"
  | "Quick Guide"
  | "Training"
  | "Task"
  | "Meeting"
  | "Shadowing"
  | "Quiz"
  | "Reflection";
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
  /** Why this module matters operationally. */
  whyItMatters?: string;
  /** What the learner should actually do. */
  whatToDo?: string;
  /** How completion is verified (evidence / proof). */
  completionEvidence?: string;
  /** Optional written reflection prompt. */
  reflectionPrompt?: string;
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
      { id: "r1", type: "Link", title: "Resource Library entry", url: "/resource-library" },
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

  /* ===================== QA / Compliance Journey ===================== */
  {
    id: "qa-start-here",
    title: "Start Here",
    description: "Welcome to QA / Compliance — how QA supports Blossom operations and connects across the org.",
    type: "Quick Guide", estimatedMinutes: 12, required: true,
    category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-22",
    overview: "A calm introduction to the QA role at Blossom — what we own, who we work with, and how we keep operations quiet.",
    sopMarkdown: "## What QA owns\n- Authorization and treatment plan reviews\n- Progress report follow-ups\n- Missing-information workflows\n- Escalations and operational quality\n\n## How QA connects\nIntake → Authorizations → **QA** → BCBA → Scheduling.",
    checklist: [
      { id: "s1", item: "Welcome to QA / Compliance", required: true },
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
      { id: "r3", type: "Link", title: "Ask Blossom AI", url: "/ai/assistant" },
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

/**
 * State Director Training Journey — 5-week framework.
 * Day-by-day placeholder structure. SOP / video / quiz content is intentionally
 * empty — modules are scaffolds to be filled in later.
 */
export interface SDDay { day: number; title: string; modules: string[]; }
export interface SDWeek { week: number; title: string; goal: string; days: SDDay[]; }

export const SD_JOURNEY_STRUCTURE: SDWeek[] = [
  { week: 1, title: "Foundations & Welcome to Blossom", goal: "Understand Blossom ABA, leadership expectations, company structure, and operational philosophy.", days: [
    { day: 1, title: "Welcome to Blossom", modules: [
      "Welcome Video from Blossom", "Mission & Vision", "Core Values", "Meet the Team",
      "How Blossom Works", "Welcome from Chad Kaufman", "A Note from Shira Lasry",
    ]},
    { day: 2, title: "Understanding Blossom Operations", modules: [
      "Company Structure", "Department Overview", "State Director Role Overview", "Leadership Expectations",
    ]},
    { day: 3, title: "Blossom Ecosystem", modules: [
      "Intake Department", "Authorizations Department", "Scheduling Department",
      "Recruiting Department", "QA Department", "Billing Department",
    ]},
    { day: 4, title: "Communication & Accountability", modules: [
      "Communication Standards", "Escalation Structure", "Accountability Expectations", "Operational Ownership",
    ]},
    { day: 5, title: "The Winning State Philosophy", modules: [
      "Data Integrity", "Utilization Mindset", "State Ownership", "Operational Leadership Philosophy",
    ]},
  ]},
  { week: 2, title: "Systems & Client Flow", goal: "Understand systems and how clients move through Blossom.", days: [
    { day: 1, title: "CentralReach Foundations", modules: [
      "CR Overview", "Navigation", "Calendar Basics", "User Permissions",
    ]},
    { day: 2, title: "Scheduling Fundamentals", modules: [
      "Calendar Views", "Labels & Filters", "Session Tracking", "Scheduling Oversight",
    ]},
    { day: 3, title: "Session Accountability", modules: [
      "Converted Sessions", "Non-Converted Sessions", "Session Integrity", "Schedule Monitoring",
    ]},
    { day: 4, title: "Lead & Intake Flow", modules: [
      "Lead Lifecycle", "Phone Calls Workflow", "Intake Workflow", "Consent Workflow",
    ]},
    { day: 5, title: "Client Lifecycle", modules: [
      "VOB Process", "Assessment Process", "Client Workflow", "Active Client Lifecycle",
    ]},
  ]},
  { week: 3, title: "Authorizations & Utilization", goal: "Learn how to protect revenue and treatment continuity.", days: [
    { day: 1, title: "Authorization Foundations", modules: [
      "Authorization Lifecycle", "Auth Statuses", "Submission Process",
    ]},
    { day: 2, title: "Treatment Authorizations", modules: [
      "Initial Auths", "Treatment Auths", "Reassessments", "Progress Reports",
    ]},
    { day: 3, title: "Utilization Tracking", modules: [
      "Actual Hours", "Pending Hours", "Remaining Hours", "Utilization %",
    ]},
    { day: 4, title: "Managing Gaps", modules: [
      "Expiring Auths", "Missing PRs", "Delayed Assessments", "Coverage Risks",
    ]},
    { day: 5, title: "Revenue Protection", modules: [
      "Utilization Management", "Revenue Awareness", "Preventing Lost Hours", "Operational Visibility",
    ]},
  ]},
  { week: 4, title: "Staffing, Recruiting & Operations", goal: "Understand staffing growth and workforce management.", days: [
    { day: 1, title: "Staffing Operations", modules: [
      "Staffing Structure", "BCBA Oversight", "RBT Oversight", "Capacity Management",
    ]},
    { day: 2, title: "Scheduling Health", modules: [
      "Coverage Gaps", "Cancellations", "Pairing Process", "Schedule Optimization",
    ]},
    { day: 3, title: "Recruiting Overview", modules: [
      "Recruiting Workflow", "Candidate Pipeline", "Interview Process", "Hiring Flow",
    ]},
    { day: 4, title: "Onboarding Operations", modules: [
      "Orientation Process", "Background Checks", "Viventium Workflow", "Workforce Readiness",
    ]},
    { day: 5, title: "Shadowing & Field Training", modules: [
      "Scheduling Shadow", "Recruiting Shadow", "BCBA Shadow", "State Director Shadow",
    ]},
  ]},
  { week: 5, title: "State Ownership & Leadership", goal: "Transition from trainee to operational leader.", days: [
    { day: 1, title: "KPI Management", modules: [
      "Utilization KPIs", "Staffing KPIs", "Client KPIs", "Recruiting KPIs",
    ]},
    { day: 2, title: "Weekly Operations", modules: [
      "Weekly Meetings", "Department Follow-Up", "Accountability Reviews", "Escalation Tracking",
    ]},
    { day: 3, title: "Managing Escalations", modules: [
      "Parent Escalations", "BCBA Escalations", "Staffing Escalations", "Operational Issues",
    ]},
    { day: 4, title: "Independent State Oversight", modules: [
      "Cross Department Management", "Operational Prioritization", "State Health Monitoring", "Leadership Decision Making",
    ]},
    { day: 5, title: "Graduation & Readiness Review", modules: [
      "Final Knowledge Review", "Readiness Assessment", "Leadership Sign-Off", "State Director Certification",
    ]},
  ]},
];

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

/**
 * SOP resource names, in module-position order per week.
 * Source: State Director Training Academy SOP catalog.
 */
export const SD_SOPS_BY_WEEK: Record<number, Record<number, string[]>> = {
  1: {
    1: [],
    2: [
      "Understanding Blossom Organizational Structure SOP",
      "Department Functions & Operational Ecosystem SOP",
      "State Director Role & Responsibilities SOP",
      "Leadership Expectations for State Directors SOP",
    ],
    3: [
      "Intake Department Operations SOP",
      "Authorizations Department Operations SOP",
      "Scheduling Department Operations SOP",
      "Recruiting Department Operations SOP",
      "Quality Assurance Department Operations SOP",
      "Billing Department Operations SOP",
    ],
    4: [
      "Communication Standards & Professional Expectations SOP",
      "Operational Escalation Management SOP",
      "Accountability & Performance Ownership SOP",
      "State Director Operational Ownership SOP",
    ],
    5: [
      "Data Integrity & Source of Truth Management SOP",
      "Utilization Management Philosophy SOP",
      "State Ownership Framework SOP",
      "Operational Leadership Philosophy SOP",
    ],
  },
  2: {
    1: [
      "CentralReach System Overview SOP",
      "CentralReach Navigation & User Experience SOP",
      "CentralReach Calendar Management SOP",
      "CentralReach User Permissions & Security SOP",
    ],
    2: [
      "Calendar Views & Filtering SOP",
      "Scheduling Labels & Workflow Filters SOP",
      "Session Tracking & Monitoring SOP",
      "Scheduling Oversight & Capacity Management SOP",
    ],
    3: [
      "Session Conversion Management SOP",
      "Non-Converted Session Resolution SOP",
      "Session Integrity & Fraud Prevention SOP",
      "Schedule Monitoring & Operational Visibility SOP",
    ],
    4: [
      "Lead Lifecycle Management SOP",
      "Phone Calls & Lead Follow-Up Process SOP",
      "Intake Workflow Management SOP",
      "Consent Form Management SOP",
    ],
    5: [
      "Verification of Benefits (VOB) Process SOP",
      "Assessment Scheduling & Oversight SOP",
      "Client Lifecycle Management SOP",
      "Active Client Oversight SOP",
    ],
  },
  3: {
    1: [
      "Authorization Lifecycle Management SOP",
      "Authorization Status Management SOP",
      "Authorization Submission Process SOP",
    ],
    2: [
      "Initial Authorization Management SOP",
      "Treatment Authorization Management SOP",
      "Reassessment Management SOP",
      "Progress Report Management SOP",
    ],
    3: [
      "Actual Hours Monitoring SOP",
      "Pending Hours Management SOP",
      "Remaining Hours Tracking SOP",
      "Utilization Percentage Management SOP",
    ],
    4: [
      "Expiring Authorization Management SOP",
      "Missing Progress Report Resolution SOP",
      "Delayed Assessment Resolution SOP",
      "Coverage Risk Management SOP",
    ],
    5: [
      "Utilization Management & Recovery SOP",
      "Revenue Awareness for State Directors SOP",
      "Lost Hours Prevention SOP",
      "Operational Visibility & Reporting SOP",
    ],
  },
  4: {
    1: [
      "Staffing Structure & Workforce Planning SOP",
      "BCBA Oversight & Management SOP",
      "RBT Oversight & Management SOP",
      "Capacity Management & Forecasting SOP",
    ],
    2: [
      "Coverage Gap Management SOP",
      "Cancellation Management SOP",
      "Therapist Pairing Process SOP",
      "Schedule Optimization SOP",
    ],
    3: [
      "Recruiting Workflow Management SOP",
      "Candidate Pipeline Management SOP",
      "Interview Process Management SOP",
      "Hiring & Offer Management SOP",
    ],
    4: [
      "New Employee Orientation Process SOP",
      "Background Check Management SOP",
      "Viventium Onboarding Process SOP",
      "Workforce Readiness Validation SOP",
    ],
    5: [
      "Scheduling Shadow Program SOP",
      "Recruiting Shadow Program SOP",
      "BCBA Shadow Program SOP",
      "State Director Shadow Program SOP",
    ],
  },
  5: {
    1: [
      "Utilization KPI Management SOP",
      "Staffing KPI Management SOP",
      "Client KPI Management SOP",
      "Recruiting KPI Management SOP",
    ],
    2: [
      "Weekly State Operations Meetings SOP",
      "Department Follow-Up Process SOP",
      "Accountability Review Process SOP",
      "Escalation Tracking Process SOP",
    ],
    3: [
      "Parent Escalation Management SOP",
      "BCBA Escalation Management SOP",
      "Staffing Escalation Management SOP",
      "Operational Issue Resolution SOP",
    ],
    4: [
      "Cross-Department Management SOP",
      "Operational Prioritization SOP",
      "State Health Monitoring SOP",
      "Leadership Decision Making SOP",
    ],
    5: [
      "Final Knowledge Assessment SOP",
      "State Director Readiness Evaluation SOP",
      "Leadership Sign-Off Process SOP",
      "State Director Certification Process SOP",
    ],
  },
};

interface SdModuleSpec {
  type: TrainingType;
  minutes: number;
  description: string;
  whyItMatters: string;
  whatToDo: string;
  completionEvidence: string;
  reflectionPrompt?: string;
  sopName?: string;
}

const SD_W1D1_SPECS: Record<string, SdModuleSpec> = {
  "Welcome Video from Blossom": {
    type: "Video", minutes: 8,
    description: "Short welcome video from Blossom leadership — who we are, who we serve, and why this work matters.",
    whyItMatters: "Sets the tone for everything you'll learn. You'll hear our purpose in our own words.",
    whatToDo: "Watch the welcome video end-to-end. Capture one thing that stood out.",
    completionEvidence: "Mark the video as watched and bring your takeaway to your first mentor check-in.",
  },
  "Mission & Vision": {
    type: "Training", minutes: 10,
    description: "Blossom's mission, vision, and the operational philosophy behind them.",
    whyItMatters: "Every operational decision you make should ladder up to this.",
    whatToDo: "Read the mission & vision overview and be able to restate it in your own words.",
    completionEvidence: "Confirm understanding with your mentor in your Week 1 check-in.",
    reflectionPrompt: "In one sentence — what is Blossom here to do, and why does it matter to families?",
  },
  "Core Values": {
    type: "Training", minutes: 10,
    description: "The values that drive how we work, communicate, and lead.",
    whyItMatters: "Values are how leaders make calls when there's no playbook.",
    whatToDo: "Review each value and connect it to a moment from your past leadership experience.",
    completionEvidence: "Discuss values in mentor check-in and pick one value to focus on this week.",
    reflectionPrompt: "Which value will be hardest for you to live in week 1? Why?",
  },
  "Meet the Team": {
    type: "Training", minutes: 12,
    description: "Org overview — leadership team, department leads, and the people you'll partner with day-to-day.",
    whyItMatters: "You can't run a state if you don't know who owns what.",
    whatToDo: "Review the team directory and identify your peer State Directors and department partners.",
    completionEvidence: "Bookmark the team directory and intro yourself to at least 3 department leads.",
  },
  "How Blossom Works": {
    type: "Training", minutes: 15,
    description: "End-to-end operational flow — lead → intake → VOB → assessment → authorization → scheduling → active client → utilization.",
    whyItMatters: "Every problem you'll solve is somewhere on this flow.",
    whatToDo: "Walk through the flow. Identify where your state currently has friction.",
    completionEvidence: "Sketch the flow from memory and share with your mentor.",
  },
  "Welcome from Chad Kaufman": {
    type: "Video", minutes: 6,
    description: "Personal welcome from Chad Kaufman — Blossom's origin story and what we expect from leaders.",
    whyItMatters: "Hearing directly from leadership grounds you in the why.",
    whatToDo: "Watch the message. No notes required — just listen.",
    completionEvidence: "Mark as watched.",
  },
  "A Note from Shira Lasry": {
    type: "Video", minutes: 5,
    description: "Personal note from Shira Lasry on operational leadership and what makes a strong State Director at Blossom.",
    whyItMatters: "Shira's lens on operations is the bar you'll be measured against.",
    whatToDo: "Watch and write down one expectation that surprised you.",
    completionEvidence: "Mark as watched and bring your note to your first mentor check-in.",
  },
};

const SD_SPECIAL_TYPES: Record<string, TrainingType> = {
  "Weekly Meetings": "Meeting",
  "Department Follow-Up": "Meeting",
  "Accountability Reviews": "Meeting",
  "Scheduling Shadow": "Shadowing",
  "Recruiting Shadow": "Shadowing",
  "BCBA Shadow": "Shadowing",
  "State Director Shadow": "Shadowing",
  "Final Knowledge Review": "Quiz",
  "Readiness Assessment": "Reflection",
  "Leadership Sign-Off": "Meeting",
  "State Director Certification": "Task",
};

function specForModule(weekNum: number, dayNum: number, position: number, title: string): SdModuleSpec {
  if (weekNum === 1 && dayNum === 1 && SD_W1D1_SPECS[title]) {
    return SD_W1D1_SPECS[title];
  }

  const sopName = SD_SOPS_BY_WEEK[weekNum]?.[dayNum]?.[position] ?? `${title} SOP`;
  const overrideType = SD_SPECIAL_TYPES[title];

  if (overrideType === "Shadowing") {
    return {
      type: "Shadowing", minutes: 90, sopName,
      description: `Live shadow session with the ${title.replace(" Shadow", "")} team to see the operational workflow in real time.`,
      whyItMatters: "Reading SOPs is not enough. Shadowing builds operational intuition.",
      whatToDo: `Schedule and complete a shadow session with the ${title.replace(" Shadow", "")} team. Take notes on what surprised you.`,
      completionEvidence: "Log a shadow session entry with date, host, hours, and 2-3 observations. Mentor sign-off required.",
      reflectionPrompt: "What did you see that you wouldn't have learned from the SOP alone?",
    };
  }
  if (overrideType === "Meeting") {
    return {
      type: "Meeting", minutes: 45, sopName,
      description: `${title} — operational meeting cadence that drives accountability and follow-through.`,
      whyItMatters: "Operational meetings are how a State Director keeps the system honest.",
      whatToDo: `Sit in on (or run) the relevant ${title.toLowerCase()} session and capture decisions, owners, and follow-ups.`,
      completionEvidence: "Log the check-in with date, attendees, and 1-line summary. Mentor verifies attendance.",
    };
  }
  if (overrideType === "Quiz") {
    return {
      type: "Quiz", minutes: 30, sopName,
      description: "Final knowledge review across the 5-week State Director curriculum.",
      whyItMatters: "Confirms you can recall and apply what you've learned before sign-off.",
      whatToDo: "Complete the knowledge review. Aim for ≥80% on the first attempt; review missed items with your mentor.",
      completionEvidence: "Quiz score ≥80% recorded. Missed items reviewed in mentor check-in.",
    };
  }
  if (overrideType === "Reflection") {
    return {
      type: "Reflection", minutes: 20, sopName,
      description: "Written readiness reflection — strengths, gaps, and what you'll own first.",
      whyItMatters: "Self-awareness is the difference between a manager and a leader.",
      whatToDo: "Submit a written readiness reflection answering the prompts in the template.",
      completionEvidence: "Reflection submitted and reviewed in mentor check-in.",
      reflectionPrompt: "What's the first operational call you'll make in your state in week 1, and why?",
    };
  }
  if (overrideType === "Task") {
    return {
      type: "Task", minutes: 15, sopName,
      description: "Final certification step — leadership sign-off and your activation as State Director.",
      whyItMatters: "Marks the formal transition from trainee to operational owner of your state.",
      whatToDo: "Confirm all weeks/modules complete, mentor sign-off received, and leadership approval logged.",
      completionEvidence: "Certification record stored with mentor and leadership signatures.",
    };
  }

  const weekTheme: Record<number, string> = {
    1: "Foundations & Welcome to Blossom",
    2: "Systems & Client Flow",
    3: "Authorizations & Utilization",
    4: "Staffing, Recruiting & Operations",
    5: "State Ownership & Leadership",
  };

  return {
    type: "SOP",
    minutes: 20,
    sopName,
    description: `${title} — part of ${weekTheme[weekNum]}. Read the named SOP and connect it to how your state currently runs this area.`,
    whyItMatters: `${title} is load-bearing for week ${weekNum} (${weekTheme[weekNum]}). Weak here, weak everywhere downstream.`,
    whatToDo: `Read the ${sopName} end-to-end. Note 1 thing your state already does well and 1 thing that needs tightening.`,
    completionEvidence: "Acknowledge SOP read + capture 2 notes (1 strength, 1 gap) in your mentor check-in.",
  };
}

function buildSdModule(weekNum: number, dayNum: number, position: number, title: string): Training {
  const id = `sd-w${weekNum}d${dayNum}-${slugify(title)}`;
  const spec = specForModule(weekNum, dayNum, position, title);
  const resources: TrainingResource[] = spec.sopName
    ? [{
        id: `${id}-sop`,
        type: spec.type === "Video" ? "Video" : "PDF",
        title: spec.sopName,
        url: "",
      }]
    : [];

  const checklist: TrainingChecklistItem[] = [];
  if (spec.type === "SOP" || spec.type === "Training") {
    checklist.push(
      { id: "c1", item: "Read the named SOP / module content", required: true },
      { id: "c2", item: "Capture 1 strength and 1 gap for your state", required: true },
      { id: "c3", item: "Confirm understanding in mentor check-in", required: true },
    );
  } else if (spec.type === "Shadowing") {
    checklist.push(
      { id: "c1", item: "Schedule the shadow session", required: true },
      { id: "c2", item: "Attend and take field notes", required: true },
      { id: "c3", item: "Log shadow session with mentor sign-off", required: true },
    );
  } else if (spec.type === "Meeting") {
    checklist.push(
      { id: "c1", item: "Attend the meeting", required: true },
      { id: "c2", item: "Log decisions, owners, follow-ups", required: true },
    );
  } else if (spec.type === "Video") {
    checklist.push(
      { id: "c1", item: "Watch the video end-to-end", required: true },
      { id: "c2", item: "Capture 1 takeaway", required: false },
    );
  } else if (spec.type === "Quiz") {
    checklist.push({ id: "c1", item: "Complete the quiz with score ≥ 80%", required: true });
  } else if (spec.type === "Reflection") {
    checklist.push({ id: "c1", item: "Submit written reflection", required: true });
  } else if (spec.type === "Task") {
    checklist.push({ id: "c1", item: "Complete the task and upload evidence", required: true });
  }

  const overview = [
    spec.description,
    "",
    `**Why this matters:** ${spec.whyItMatters}`,
    "",
    `**What to do:** ${spec.whatToDo}`,
    "",
    `**How to complete:** ${spec.completionEvidence}`,
    spec.reflectionPrompt ? `\n**Reflection prompt:** ${spec.reflectionPrompt}` : "",
  ].filter(Boolean).join("\n");

  const sopMarkdown = spec.sopName
    ? `## ${spec.sopName}\n\nThe SOP is the source of truth for this module. If the link below is empty, the SOP write-up lives in the Resource Library under State Director Operations and will be wired up here as it's published.`
    : "";

  return {
    id,
    title: `W${weekNum} · D${dayNum} — ${title}`,
    description: spec.description,
    type: spec.type,
    estimatedMinutes: spec.minutes,
    required: true,
    category: "role",
    department: "state_operations",
    owner: SD_OWNER,
    lastUpdated: SD_DATE,
    overview,
    sopMarkdown,
    videoUrl: spec.type === "Video" ? "" : undefined,
    checklist,
    resources,
    whyItMatters: spec.whyItMatters,
    whatToDo: spec.whatToDo,
    completionEvidence: spec.completionEvidence,
    reflectionPrompt: spec.reflectionPrompt,
  };
}

const STATE_DIRECTOR_TRAININGS: Training[] = SD_JOURNEY_STRUCTURE.flatMap((w) =>
  w.days.flatMap((d) => d.modules.map((m, idx) => buildSdModule(w.week, d.day, idx, m))),
);

/** Flat ordered moduleIds for the SD journey (W1D1 → W5D5). */
export const SD_JOURNEY_MODULE_IDS: string[] = STATE_DIRECTOR_TRAININGS.map((t) => t.id);

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
  { id: "j-qa", role: "qa_team", title: "QA / Compliance Journey",
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
    tagline: "5-week structured onboarding: foundations → systems → auths → staffing → leadership.",
    icon: "Crown", tone: "violet", moduleIds: SD_JOURNEY_MODULE_IDS },
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

const STORAGE_KEY = "blossom.training.academy.v9";

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
    { id: `${id}-ov`, trainingId: id, type: "Overview", title: "Overview", content: t?.overview || "Why this module matters and how it connects to your role.", videoUrl: t?.videoUrl },
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
