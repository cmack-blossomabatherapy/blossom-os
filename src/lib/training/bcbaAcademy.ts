/**
 * BCBA Training curriculum — canonical shared data.
 *
 * Module data and types previously lived inside
 * `src/pages/training/BCBAJourney.tsx`. They now live here so both the legacy
 * /bcba/training-academy page and the unified Training Academy adapter
 * (`src/lib/academy/journeyContent.ts`) consume one source.
 */
import {
  Compass, Workflow, Layers, Eye, Calendar, HeartHandshake, ShieldCheck,
  Award, Stethoscope, Brain,
} from "lucide-react";

export type LessonKind = "Overview" | "SOP" | "Workflow" | "Tango" | "Checklist" | "Shadowing" | "Knowledge Check";

export interface Lesson {
  id: string;
  title: string;
  kind: LessonKind;
  minutes: number;
  summary: string;
}

export type Phase = "Observe" | "Practice" | "Assisted" | "Independent";

export interface Module {
  id: string;
  number: number;
  phase: Phase;
  title: string;
  subtitle: string;
  icon: typeof Compass;
  objectives: string[];
  lessons: Lesson[];
  sopLinks: { label: string; href: string }[];
  tangos?: { label: string; note: string }[];
  checklist: string[];
  shadowing?: string[];
  aiPrompts: string[];
  knowledgeCheck?: { q: string; a: string };
}

export const modules: Module[] = [
  {
    id: "m1",
    number: 1,
    phase: "Observe",
    title: "Welcome to Blossom",
    subtitle: "Our mission, our clinical philosophy, and how Blossom operates as a company.",
    icon: Compass,
    objectives: [
      "Understand the Blossom mission and clinical values",
      "Know how Blossom OS is structured (Dashboards · Workspaces · Pages)",
      "Identify the teams that support every BCBA (Scheduling, Auth, QA, SD)",
      "Internalize the calm, proactive operational mindset",
    ],
    lessons: [
      { id: "m1-l1", title: "Welcome from leadership", kind: "Overview", minutes: 4, summary: "Short welcome and mission framing from the State Director." },
      { id: "m1-l2", title: "How Blossom operates", kind: "Overview", minutes: 6, summary: "Departments, ownership, and how clinical and operations work together." },
      { id: "m1-l3", title: "Touring Blossom OS", kind: "Workflow", minutes: 8, summary: "Dashboards show, Workspaces act, Pages document — for BCBAs." },
      { id: "m1-l4", title: "Communication & tone at Blossom", kind: "Overview", minutes: 4, summary: "How we communicate calmly and clearly across departments and families." },
    ],
    sopLinks: [
      { label: "Blossom operational principles", href: "/resources" },
      { label: "Org chart & state leadership", href: "/hr/org-chart" },
    ],
    checklist: [
      "Watched the welcome video",
      "Reviewed org chart and identified your manager + State Director",
      "Logged into Blossom OS and bookmarked the BCBA Workspace",
    ],
    shadowing: ["Sit in on one team standup", "Meet your assigned Scheduling and Auth contacts"],
    aiPrompts: [
      "Summarize the BCBA role at Blossom in one paragraph",
      "Which departments support me as a BCBA?",
    ],
  },
  {
    id: "m2",
    number: 2,
    phase: "Observe",
    title: "BCBA Foundations",
    subtitle: "Your operational role: ownership, expectations, and what a successful BCBA looks like.",
    icon: Stethoscope,
    objectives: [
      "Define BCBA responsibilities and workflow ownership",
      "Recognize what is yours vs. what is owned by other teams",
      "Understand supervision, parent training, and documentation expectations",
      "Internalize the standard for a successful BCBA at Blossom",
    ],
    lessons: [
      { id: "m2-l1", title: "What a successful BCBA looks like", kind: "Overview", minutes: 6, summary: "Operational portrait of a high-functioning BCBA at Blossom." },
      { id: "m2-l2", title: "Workflow ownership map", kind: "Workflow", minutes: 7, summary: "What you own, what you coordinate, and what you hand off." },
      { id: "m2-l3", title: "Expectations checklist", kind: "Checklist", minutes: 5, summary: "Daily, weekly, and monthly operational expectations." },
      { id: "m2-l4", title: "Role boundaries", kind: "SOP", minutes: 5, summary: "When to engage Scheduling, QA, Auth, or SD — and when not to." },
    ],
    sopLinks: [
      { label: "BCBA role & expectations SOP", href: "/resources" },
      { label: "BCBA Workspace", href: "/bcba/workspace" },
    ],
    checklist: [
      "Reviewed the BCBA responsibilities checklist",
      "Identified your weekly operational cadence",
      "Can name what you own vs. what other teams own",
    ],
    aiPrompts: [
      "Summarize my responsibilities as a BCBA",
      "What is owned by Scheduling vs. by me?",
    ],
  },
  {
    id: "m3",
    number: 3,
    phase: "Practice",
    title: "Caseload Management",
    subtitle: "Run your caseload like an operator: prioritize, identify risk, stay organized.",
    icon: Layers,
    objectives: [
      "Read your caseload through the lens of operational health",
      "Identify stable, at-risk, and red-zone clients",
      "Prioritize supervision, parent training, and scheduling actions weekly",
      "Use the BCBA Workspace as your daily operating surface",
    ],
    lessons: [
      { id: "m3-l1", title: "Reading your caseload", kind: "Workflow", minutes: 8, summary: "Auth status, supervision freshness, cancellation trends, and what to act on first." },
      { id: "m3-l2", title: "Stable vs at-risk vs red zone", kind: "Overview", minutes: 6, summary: "The three operational states of a client and what each requires from you." },
      { id: "m3-l3", title: "Weekly caseload review", kind: "Checklist", minutes: 5, summary: "A 15-minute Monday ritual that keeps every client on track." },
      { id: "m3-l4", title: "Using the BCBA Workspace", kind: "Tango", minutes: 7, summary: "Walkthrough of caseload board, supervision queue, and action rail." },
    ],
    sopLinks: [
      { label: "Caseload management SOP", href: "/resources" },
      { label: "Open BCBA Workspace", href: "/bcba/workspace" },
    ],
    tangos: [
      { label: "Workspace tour", note: "Caseload board, supervision queue, parent training queue, and AI prompts." },
    ],
    checklist: [
      "Completed first weekly caseload review",
      "Identified your at-risk and red-zone clients",
      "Logged at least one operational follow-up per client",
    ],
    shadowing: ["Shadow a senior BCBA's Monday review"],
    aiPrompts: [
      "Which clients on my caseload need attention today?",
      "Summarize my caseload health",
    ],
    knowledgeCheck: {
      q: "A client is in the red zone. What three signals most likely put them there?",
      a: "Some combination of: overdue supervision (>21 days), 2+ recent cancellations, or upcoming auth expiration / PR overdue. Each is a coordinator-owned signal worth addressing today.",
    },
  },
  {
    id: "m4",
    number: 4,
    phase: "Practice",
    title: "Supervision Operations (97155)",
    subtitle: "Cadence, documentation, and supporting your RBTs operationally.",
    icon: Eye,
    objectives: [
      "Know the supervision cadence expected on every client",
      "Document supervision sessions to standard",
      "Identify and resolve supervision gaps before they become risks",
      "Support your RBTs through coaching and feedback loops",
    ],
    lessons: [
      { id: "m4-l1", title: "Supervision cadence & overlap rules", kind: "SOP", minutes: 8, summary: "Required frequency, overlap %, and what counts as a touchpoint." },
      { id: "m4-l2", title: "Documenting supervision", kind: "Workflow", minutes: 7, summary: "What the note needs to contain and where it lives." },
      { id: "m4-l3", title: "Identifying supervision risk", kind: "Workflow", minutes: 6, summary: "Reading the supervision queue and acting before clients go overdue." },
      { id: "m4-l4", title: "Supporting your RBTs", kind: "Overview", minutes: 6, summary: "Coaching cadence, feedback structure, and operational support." },
      { id: "m4-l5", title: "Common supervision mistakes", kind: "Overview", minutes: 4, summary: "The five most common operational mistakes and how to avoid them." },
    ],
    sopLinks: [
      { label: "Supervision SOP", href: "/resources" },
      { label: "Supervision queue", href: "/bcba/supervision" },
    ],
    checklist: [
      "Reviewed supervision cadence for every assigned client",
      "Logged one supervision session end-to-end",
      "Cleared any overdue supervision flags in your workspace",
    ],
    shadowing: ["Observe a senior BCBA's supervision session", "Shadow an RBT coaching conversation"],
    aiPrompts: [
      "Which of my clients are overdue for supervision?",
      "How do I escalate a missed supervision touchpoint?",
    ],
  },
  {
    id: "m5",
    number: 5,
    phase: "Practice",
    title: "Progress Reports & Authorizations",
    subtitle: "PR cadence, reassessment timing, QA coordination, and avoiding authorization delays.",
    icon: ShieldCheck,
    objectives: [
      "Internalize the 9-week reminder / 6-week escalation cadence",
      "Coordinate with QA and Auth proactively, not reactively",
      "Manage parent signatures and reassessment timing cleanly",
      "Recognize the operational cost of a late PR",
    ],
    lessons: [
      { id: "m5-l1", title: "The PR lifecycle", kind: "Workflow", minutes: 9, summary: "From reassessment to QA-ready to submission — your part in each stage." },
      { id: "m5-l2", title: "9-week reminder · 6-week escalation", kind: "SOP", minutes: 7, summary: "What happens at each milestone and what is expected of you." },
      { id: "m5-l3", title: "Parent signature process", kind: "Workflow", minutes: 5, summary: "How signatures are requested, tracked, and escalated when delayed." },
      { id: "m5-l4", title: "QA coordination", kind: "Workflow", minutes: 6, summary: "What QA needs from you, when, and how to make handoffs clean." },
      { id: "m5-l5", title: "Avoiding authorization delays", kind: "Overview", minutes: 6, summary: "The five operational patterns that cause auth delays — and how to avoid them." },
      { id: "m5-l6", title: "PR escalation walkthrough", kind: "Tango", minutes: 5, summary: "Visual walkthrough of an SD-involved PR escalation." },
    ],
    sopLinks: [
      { label: "PR & Auth SOP", href: "/resources" },
      { label: "My authorizations", href: "/bcba/authorizations" },
    ],
    tangos: [
      { label: "Locating an auth in CR", note: "Find active, expired, and pending authorizations for any client." },
    ],
    checklist: [
      "Reviewed every upcoming PR on your caseload",
      "Coordinated one PR submission with QA",
      "Cleared any 6-week-old PRs or escalated them",
    ],
    shadowing: ["Sit in on one QA/BCBA PR review"],
    aiPrompts: [
      "Which of my PRs are approaching the 6-week mark?",
      "Walk me through the parent signature process",
    ],
    knowledgeCheck: {
      q: "A PR hits 6 weeks overdue. What happens?",
      a: "State Director enters the workflow. You document one concrete next action, the blocker is named explicitly, and outreach moves from BCBA-led to SD-supported until movement is restored.",
    },
  },
  {
    id: "m6",
    number: 6,
    phase: "Practice",
    title: "Parent Training Operations (97156)",
    subtitle: "Cadence, engagement, documentation, and the family relationship.",
    icon: HeartHandshake,
    objectives: [
      "Know the 97156 expectations on every active client",
      "Plan and document parent training to standard",
      "Recognize and respond to engagement drops",
      "Communicate with families in line with Blossom standards",
    ],
    lessons: [
      { id: "m6-l1", title: "97156 expectations", kind: "SOP", minutes: 6, summary: "Required cadence, content, and outcomes per family." },
      { id: "m6-l2", title: "Planning a parent training session", kind: "Workflow", minutes: 7, summary: "Topic selection, prep, and tying sessions to client goals." },
      { id: "m6-l3", title: "Increasing parent engagement", kind: "Overview", minutes: 6, summary: "What works, what doesn't, and how to recover stalled families." },
      { id: "m6-l4", title: "Documentation standards", kind: "Checklist", minutes: 4, summary: "What every 97156 note needs to contain." },
      { id: "m6-l5", title: "Engagement escalation", kind: "Workflow", minutes: 5, summary: "When low engagement becomes a continuation risk, and who to loop in." },
    ],
    sopLinks: [
      { label: "Parent training SOP", href: "/resources" },
      { label: "My parent training queue", href: "/bcba/parent-training" },
    ],
    checklist: [
      "Reviewed parent training cadence for every assigned family",
      "Logged one parent training session end-to-end",
      "Identified at least one family with engagement risk",
    ],
    aiPrompts: [
      "Which of my families are behind on 97156?",
      "How do I document low parent participation?",
    ],
  },
  {
    id: "m7",
    number: 7,
    phase: "Assisted",
    title: "Scheduling Coordination",
    subtitle: "You are not a scheduler — you are a coordinator. Here is how to work with the scheduling team.",
    icon: Calendar,
    objectives: [
      "Understand what Scheduling owns vs. what you coordinate",
      "Communicate cancellations and disruptions cleanly",
      "Recognize staffing risk patterns on your caseload",
      "Escalate without overstepping",
    ],
    lessons: [
      { id: "m7-l1", title: "Working with Scheduling", kind: "Overview", minutes: 6, summary: "How to partner with the scheduling team for stability and coverage." },
      { id: "m7-l2", title: "Cancellation workflows", kind: "Workflow", minutes: 6, summary: "Reporting cancellations, requesting rebooks, and avoiding patterns." },
      { id: "m7-l3", title: "Staffing escalations", kind: "SOP", minutes: 5, summary: "When and how to escalate a coverage gap." },
      { id: "m7-l4", title: "Maintaining schedule stability", kind: "Overview", minutes: 5, summary: "Operational habits that keep your caseload running smoothly." },
    ],
    sopLinks: [
      { label: "Scheduling coordination SOP", href: "/resources" },
      { label: "My scheduling view", href: "/bcba/scheduling" },
    ],
    checklist: [
      "Identified your assigned scheduling contact",
      "Reported one cancellation through the standard workflow",
      "Can describe what Scheduling owns vs. what you coordinate",
    ],
    aiPrompts: [
      "Who is my scheduling contact?",
      "How do I escalate an uncovered client?",
    ],
  },
  {
    id: "m8",
    number: 8,
    phase: "Assisted",
    title: "Escalations & Operational Communication",
    subtitle: "When to escalate, to whom, and how to communicate operationally across departments.",
    icon: Workflow,
    objectives: [
      "Know the escalation hierarchy at Blossom",
      "Recognize the difference between a question, an issue, and an escalation",
      "Communicate clinical concerns to QA and operational concerns to leadership",
      "Handle sensitive parent conversations with structure and calm",
    ],
    lessons: [
      { id: "m8-l1", title: "Escalation pathways", kind: "Overview", minutes: 6, summary: "Visual map of who owns what across QA, SD, Scheduling, and Auth." },
      { id: "m8-l2", title: "When to loop in leadership", kind: "SOP", minutes: 5, summary: "The clear triggers that warrant leadership involvement." },
      { id: "m8-l3", title: "Communication templates", kind: "Workflow", minutes: 6, summary: "Templates for cancellations, escalations, and family communication." },
      { id: "m8-l4", title: "Sensitive parent conversations", kind: "Overview", minutes: 7, summary: "Frameworks for the hardest conversations — calmly and professionally." },
    ],
    sopLinks: [
      { label: "Escalation SOP", href: "/resources" },
      { label: "Communication templates", href: "/resources" },
    ],
    checklist: [
      "Can name the right owner for any common operational issue",
      "Drafted one escalation message using a template",
    ],
    shadowing: ["Observe one parent escalation handled by a senior BCBA"],
    aiPrompts: [
      "Who do I escalate a missed PR signature to?",
      "Draft a calm message to a family about a missed session",
    ],
  },
  {
    id: "m9",
    number: 9,
    phase: "Assisted",
    title: "Using Blossom OS",
    subtitle: "Your daily operating surface: Dashboard, Workspace, queues, and Operational Insights.",
    icon: Compass,
    objectives: [
      "Navigate the BCBA Dashboard and Workspace fluently",
      "Use the supervision, auth, and parent training queues effectively",
      "Leverage Operational Insights for operational summaries and next actions",
      "Set up your personal operating cadence inside Blossom OS",
    ],
    lessons: [
      { id: "m9-l1", title: "Navigating Blossom OS", kind: "Tango", minutes: 7, summary: "Sidebar, home, workspace, and key shortcuts for BCBAs." },
      { id: "m9-l2", title: "Managing your Workspace", kind: "Workflow", minutes: 7, summary: "Action queue, caseload board, and right-rail tools." },
      { id: "m9-l3", title: "Working with queues", kind: "Workflow", minutes: 5, summary: "Supervision, parent training, and auth queues — what each is for." },
      { id: "m9-l4", title: "Operational Insights for BCBAs", kind: "Overview", minutes: 5, summary: "Operational prompts that save you 20 minutes a day." },
      { id: "m9-l5", title: "Personal operating cadence", kind: "Checklist", minutes: 4, summary: "Daily, weekly, and monthly rituals using Blossom OS." },
    ],
    sopLinks: [
      { label: "Blossom OS guide for BCBAs", href: "/resources" },
      { label: "BCBA Dashboard", href: "/bcba" },
      { label: "BCBA Workspace", href: "/bcba/workspace" },
    ],
    tangos: [
      { label: "Workspace deep dive", note: "Every panel, every action, every shortcut." },
    ],
    checklist: [
      "Set up your Workspace layout",
      "Used Operational Insights at least three times",
      "Established your daily morning routine inside Blossom OS",
    ],
    aiPrompts: [
      "What should I work on first this morning?",
      "Summarize today's caseload risks",
    ],
  },
  {
    id: "m10",
    number: 10,
    phase: "Assisted",
    title: "Documentation & Workflow Standards",
    subtitle: "Documentation cadence, ownership, and the standards that keep operations clean.",
    icon: FileText,
    objectives: [
      "Know the documentation standards expected at every workflow stage",
      "Stay organized across notes, plans, and supervision logs",
      "Avoid the operational delays caused by missing documentation",
      "Take clean ownership of what you produce",
    ],
    lessons: [
      { id: "m10-l1", title: "Documentation standards", kind: "SOP", minutes: 6, summary: "What every note, plan, and update needs to contain." },
      { id: "m10-l2", title: "Workflow ownership", kind: "Overview", minutes: 5, summary: "Owning what you produce and handing off cleanly." },
      { id: "m10-l3", title: "Staying organized", kind: "Checklist", minutes: 5, summary: "Operational rituals that prevent backlog." },
      { id: "m10-l4", title: "Reducing operational delays", kind: "Overview", minutes: 5, summary: "Top causes of delays — and how to prevent them on your caseload." },
    ],
    sopLinks: [
      { label: "Documentation SOP", href: "/resources" },
    ],
    checklist: [
      "Reviewed documentation expectations for every workflow you own",
      "Set up a weekly documentation review ritual",
    ],
    aiPrompts: [
      "Summarize my documentation expectations",
      "What documentation gaps are slowing my caseload?",
    ],
  },
  {
    id: "m11",
    number: 11,
    phase: "Independent",
    title: "Advanced Clinical Operations",
    subtitle: "Run a high-performing caseload over the long term, without burning out.",
    icon: Brain,
    objectives: [
      "Manage high-complexity caseloads operationally",
      "Recognize and prevent operational burnout",
      "Improve family engagement on tough cases",
      "Demonstrate collaboration excellence across departments",
    ],
    lessons: [
      { id: "m11-l1", title: "Advanced caseload management", kind: "Overview", minutes: 7, summary: "How experienced BCBAs handle high-volume, high-complexity caseloads." },
      { id: "m11-l2", title: "High-risk client workflows", kind: "Workflow", minutes: 7, summary: "Operational playbook for clients with multiple risk signals." },
      { id: "m11-l3", title: "Preventing operational burnout", kind: "Overview", minutes: 6, summary: "Habits, boundaries, and warning signs to watch for in yourself." },
      { id: "m11-l4", title: "Collaboration excellence", kind: "Overview", minutes: 5, summary: "What it looks like to be the BCBA every team wants to work with." },
    ],
    sopLinks: [
      { label: "Advanced operations playbook", href: "/resources" },
    ],
    checklist: [
      "Demonstrated independent prioritization for two full weeks",
      "Resolved one high-complexity case with minimal escalation",
      "Mentored a newer BCBA on one workflow",
    ],
    aiPrompts: [
      "What are my top operational risks this month?",
      "Show me my busiest weeks ahead and where I should pre-plan",
    ],
    knowledgeCheck: {
      q: "Two equally urgent clinical concerns hit at 4:45 PM on a Friday. How do you decide?",
      a: "Choose the one with the shorter safe-recovery window if unaddressed over the weekend. Document the second with an owner and a Monday-first commitment.",
    },
  },
  {
    id: "m12",
    number: 12,
    phase: "Independent",
    title: "Graduation & Certification",
    subtitle: "Operational readiness — and a celebration of completing the BCBA Journey.",
    icon: Award,
    objectives: [
      "Confirm operational readiness across every BCBA workflow",
      "Earn the BCBA Journey completion badge",
      "Identify your next growth areas with leadership",
    ],
    lessons: [
      { id: "m12-l1", title: "Operational readiness checklist", kind: "Checklist", minutes: 6, summary: "Every workflow, every standard, confirmed." },
      { id: "m12-l2", title: "Final reflection with your manager", kind: "Overview", minutes: 5, summary: "Quick conversation framework to align on next growth steps." },
      { id: "m12-l3", title: "Congratulations & what comes next", kind: "Overview", minutes: 3, summary: "What ongoing learning looks like beyond the journey." },
    ],
    sopLinks: [
      { label: "BCBA growth ladder", href: "/resources" },
    ],
    checklist: [
      "Completed all required modules",
      "Confirmed operational readiness with your manager",
      "Received your BCBA Journey completion badge",
    ],
    aiPrompts: [
      "Summarize what I've learned in this journey",
      "What should I focus on in my first 90 days post-journey?",
    ],
  },
];

// Aliases that downstream consumers (academy adapter) prefer.
export { modules as BCBA_MODULES };
export type {
  Module as BCBAModule,
  Lesson as BCBALesson,
  Phase as BCBAPhase,
  LessonKind as BCBALessonKind,
};

