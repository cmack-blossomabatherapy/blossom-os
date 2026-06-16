import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, ArrowRight, CheckCircle2, Clock, Sparkles, Compass, Workflow,
  FileText, ClipboardCheck, Users, Layers, BookOpen, PlayCircle, ExternalLink,
  Target, GraduationCap as Cap, Eye, Hand, ChevronRight, MessageSquare, Calendar,
  ListChecks, HeartHandshake, ShieldCheck, Award, Bot, Heart, Stethoscope, Brain,
} from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// BCBA Journey
// Operational onboarding for Blossom ABA BCBAs. Grounded in real Blossom
// workflows: caseload management, supervision (97155), parent training (97156),
// PR & authorization cadence, scheduling coordination, escalation paths, and
// the BCBA-facing Blossom OS surface. NOT a corporate LMS.
// =============================================================================

type LessonKind = "Overview" | "SOP" | "Workflow" | "Tango" | "Checklist" | "Shadowing" | "Knowledge Check";

interface Lesson {
  id: string;
  title: string;
  kind: LessonKind;
  minutes: number;
  summary: string;
}

type Phase = "Observe" | "Practice" | "Assisted" | "Independent";

interface Module {
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

const modules: Module[] = [
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

const phaseStyles: Record<Phase, { label: string; tone: string; icon: typeof Eye }> = {
  Observe: { label: "Phase 1 · Foundations", tone: "bg-info/10 text-info border-info/20", icon: Eye },
  Practice: { label: "Phase 2 · Core practice", tone: "bg-warning/10 text-warning border-warning/20", icon: Hand },
  Assisted: { label: "Phase 3 · Assisted execution", tone: "bg-accent/10 text-accent border-accent/30", icon: Users },
  Independent: { label: "Phase 4 · Independent readiness", tone: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
};

const lessonKindIcon: Record<LessonKind, typeof FileText> = {
  Overview: BookOpen,
  SOP: FileText,
  Workflow: Workflow,
  Tango: PlayCircle,
  Checklist: ListChecks,
  Shadowing: Eye,
  "Knowledge Check": ClipboardCheck,
};

export default function BCBAJourney() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeModuleId, setActiveModuleId] = useState<string>(modules[0].id);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);

  const totalLessons = useMemo(() => modules.reduce((s, m) => s + m.lessons.length, 0), []);
  const totalMinutes = useMemo(() => modules.reduce((s, m) => s + m.lessons.reduce((a, l) => a + l.minutes, 0), 0), []);
  const completedCount = completed.size;
  const pct = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const toggle = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const active = modules.find((m) => m.id === activeModuleId)!;
  const activeCompleted = active.lessons.filter((l) => completed.has(l.id)).length;
  const activePct = Math.round((activeCompleted / active.lessons.length) * 100);

  return (
    <GlassPageShell
      eyebrow="Training Academy · BCBA Journey"
      eyebrowIcon={GraduationCap}
      title="BCBA Journey"
      description="Learn how to manage your caseload, supervision, parent training, PRs, and clinical operations inside Blossom OS — calmly and confidently."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="bg-white/15 text-primary-foreground hover:bg-white/25 border-white/20">
            <Link to="/academy"><Compass className="mr-1.5 h-4 w-4" /> Academy home</Link>
          </Button>
          <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90">
            <Link to="/bcba/workspace"><ArrowRight className="mr-1.5 h-4 w-4" /> Open BCBA Workspace</Link>
          </Button>
        </div>
      }
      stats={
        <div className="grid grid-cols-3 gap-3">
          <JourneyStat label="Modules" value={`${modules.length}`} sub="BCBA-specific" />
          <JourneyStat label="Lessons" value={`${totalLessons}`} sub={`${totalMinutes} min total`} />
          <JourneyStat label="Progress" value={`${pct}%`} sub={`${completedCount} of ${totalLessons} complete`} />
        </div>
      }
    >
      {/* Mission + meta */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <GlassPanel className="p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mission</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">
                Help every BCBA at Blossom operate with clarity, calm, and confidence — across supervision,
                parent training, authorizations, scheduling, and family communication.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetaRow icon={Layers} label="Core systems" value="Blossom OS · CentralReach · Resource Library" />
                <MetaRow icon={Workflow} label="Key workflows" value="Caseload · Supervision · PR · Parent Training" />
                <MetaRow icon={Calendar} label="Suggested length" value="3–5 weeks clinical onboarding" />
                <MetaRow icon={Users} label="Assigned trainer" value="State Director · BCBA Lead" />
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Journey progress</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{pct}%</p>
            </div>
            <Badge variant="secondary" className="rounded-full">{completedCount}/{totalLessons} lessons</Badge>
          </div>
          <Progress value={pct} className="mt-3 h-2" />
          <div className="mt-5 space-y-2">
            {(["Observe", "Practice", "Assisted", "Independent"] as Phase[]).map((phase) => {
              const phaseModules = modules.filter((m) => m.phase === phase);
              const phaseLessons = phaseModules.flatMap((m) => m.lessons);
              const done = phaseLessons.filter((l) => completed.has(l.id)).length;
              const p = phaseLessons.length === 0 ? 0 : Math.round((done / phaseLessons.length) * 100);
              const meta = phaseStyles[phase];
              const Icon = meta.icon;
              return (
                <div key={phase} className="flex items-center gap-3">
                  <div className={cn("grid h-7 w-7 place-items-center rounded-full border", meta.tone)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{meta.label}</span>
                      <span className="text-muted-foreground">{done}/{phaseLessons.length}</span>
                    </div>
                    <Progress value={p} className="mt-1 h-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      {/* Module rail + active module */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <GlassPanel className="p-3">
          <p className="px-3 pt-2 pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Modules</p>
          <ol className="space-y-1">
            {modules.map((m) => {
              const Icon = m.icon;
              const isActive = m.id === activeModuleId;
              const done = m.lessons.filter((l) => completed.has(l.id)).length;
              const isDone = done === m.lessons.length;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => setActiveModuleId(m.id)}
                    className={cn(
                      "group w-full rounded-xl border px-3 py-2.5 text-left transition-all",
                      isActive
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : "border-transparent hover:bg-muted/60 hover:border-border/60",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors",
                        isActive ? "border-primary/30 bg-primary/10 text-primary" : "border-border/60 bg-muted/60 text-muted-foreground group-hover:text-foreground",
                      )}>
                        {isDone ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Module {m.number}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{done}/{m.lessons.length}</span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{m.title}</p>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isActive && "translate-x-0.5 text-primary")} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel className="overflow-hidden p-0">
            <div className="border-b border-border/60 bg-gradient-to-br from-muted/40 to-transparent p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn("rounded-full border text-[10px] font-semibold uppercase tracking-wider", phaseStyles[active.phase].tone)}>
                      {phaseStyles[active.phase].label}
                    </Badge>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Module {active.number} of {modules.length}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{active.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{active.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Module progress</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight">{activePct}%</p>
                  <Progress value={activePct} className="mt-2 h-1.5 w-32" />
                </div>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-2">
              <div className="border-b border-border/60 p-6 md:border-b-0 md:border-r">
                <SectionHeader icon={Target} label="Learning objectives" />
                <ul className="mt-3 space-y-2">
                  {active.objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6">
                <SectionHeader icon={FileText} label="SOPs & walkthroughs" />
                <ul className="mt-3 space-y-2">
                  {active.sopLinks.map((l) => (
                    <li key={l.label}>
                      <Link to={l.href} className="group flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted">
                        <span className="flex items-center gap-2 text-foreground"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> {l.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                  {active.tangos?.map((t) => (
                    <li key={t.label} className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 text-foreground"><PlayCircle className="h-3.5 w-3.5 text-primary" /> {t.label}</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-border/60 p-6">
              <SectionHeader icon={BookOpen} label="Lessons" />
              <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
                {active.lessons.map((l) => {
                  const Icon = lessonKindIcon[l.kind];
                  const isDone = completed.has(l.id);
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => toggle(l.id)}
                        className="group flex w-full items-start gap-3 bg-card p-4 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors",
                          isDone ? "border-success/30 bg-success/10 text-success" : "border-border/60 bg-muted/60 text-muted-foreground",
                        )}>
                          {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={cn("text-sm font-medium", isDone ? "text-muted-foreground line-through" : "text-foreground")}>{l.title}</p>
                            <Badge variant="secondary" className="rounded-full text-[10px]">{l.kind}</Badge>
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {l.minutes} min</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{l.summary}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="grid gap-0 border-t border-border/60 md:grid-cols-2">
              {active.shadowing && active.shadowing.length > 0 && (
                <div className="border-b border-border/60 p-6 md:border-b-0 md:border-r">
                  <SectionHeader icon={Eye} label="Shadowing tasks" />
                  <ul className="mt-3 space-y-2">
                    {active.shadowing.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className={cn("p-6", !active.shadowing && "md:col-span-2")}>
                <SectionHeader icon={ListChecks} label="Completion checklist" />
                <ul className="mt-3 space-y-2">
                  {active.checklist.map((c, i) => {
                    const key = `${active.id}-chk-${i}`;
                    const isDone = completed.has(key);
                    return (
                      <li key={key}>
                        <button
                          onClick={() => toggle(key)}
                          className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50"
                        >
                          <div className={cn(
                            "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors",
                            isDone ? "border-success bg-success text-primary-foreground" : "border-border bg-background",
                          )}>
                            {isDone && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                          <span className={cn(isDone ? "text-muted-foreground line-through" : "text-foreground")}>{c}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {active.knowledgeCheck && (
              <div className="border-t border-border/60 bg-muted/30 p-6">
                <SectionHeader icon={ClipboardCheck} label="Lightweight knowledge check" />
                <p className="mt-2 text-sm font-medium text-foreground">{active.knowledgeCheck.q}</p>
                <details className="mt-2 group">
                  <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">Reveal answer</summary>
                  <p className="mt-2 rounded-lg border border-border/60 bg-card p-3 text-sm text-foreground">{active.knowledgeCheck.a}</p>
                </details>
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Operational Insights · {active.title}</p>
                  <Badge variant="secondary" className="rounded-full text-[10px]">role-aware</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">Contextual help grounded in your caseload and SOPs. HIPAA-aware.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {active.aiPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAiPrompt(p)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        aiPrompt === p ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-muted/50 text-foreground hover:bg-muted",
                      )}
                    >
                      <MessageSquare className="mr-1 inline h-3 w-3" /> {p}
                    </button>
                  ))}
                </div>
                {aiPrompt && (
                  <div className="mt-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-3 text-sm text-foreground">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Suggested response</p>
                    <p className="mt-1">{aiResponseFor(aiPrompt, active)}</p>
                  </div>
                )}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </GlassPageShell>
  );
}

function aiResponseFor(prompt: string, m: Module): string {
  const p = prompt.toLowerCase();
  if (p.includes("bcba role") || (p.includes("responsibilities") && p.includes("bcba"))) {
    return "As a BCBA at Blossom, you own clinical direction for your caseload: supervision cadence, treatment plans, PRs, and parent training. You coordinate (not own) scheduling and authorization submission. Your operating surface is the BCBA Workspace.";
  }
  if (p.includes("supported") || p.includes("departments")) {
    return "Scheduling owns coverage. The Auth team owns submissions and payor follow-up. QA owns clinical review and PR readiness. Your State Director owns escalations. You are never on an island.";
  }
  if (p.includes("scheduling vs") || p.includes("owned by scheduling")) {
    return "Scheduling owns staffing decisions, RBT assignments, and rebooking. You own communicating cancellations, flagging coverage risk, and supporting RBTs once paired. You coordinate — you don't run scheduling.";
  }
  if (p.includes("attention today") || p.includes("first this morning")) {
    return "Open the Workspace action queue. Work the red-zone clients first: any overdue supervision, any PR within 6 weeks of due, any client with 2+ cancellations in the last 30 days. Then your parent training cadence.";
  }
  if (p.includes("caseload health") || p.includes("caseload risks")) {
    return "Sort your caseload by risk. Red = overdue supervision OR PR overdue OR auth expiring <30 days. Yellow = approaching one of those thresholds. Green = healthy. Spend 70% of your time on Red, 30% on Yellow, and let Green run.";
  }
  if (p.includes("overdue") && p.includes("supervision")) {
    return "Filter the supervision queue by 'days since last touchpoint' > 21. Each one needs either a scheduled supervision in the next 7 days or a documented reason. If you can't schedule it, escalate to Scheduling with the client name and required date.";
  }
  if (p.includes("missed supervision") || p.includes("escalate") && p.includes("supervision")) {
    return "Escalate to Scheduling first with the client name and the overdue window. If unresolved within 3 business days, loop in your State Director. Document the gap in the supervision log either way.";
  }
  if (p.includes("6-week") || p.includes("approaching the 6-week")) {
    return "Pull your authorizations queue and filter by PR due in the next 6 weeks. Anything older than that should already be in QA. Anything at the 6-week mark needs a documented next action today.";
  }
  if (p.includes("parent signature")) {
    return "Signatures are requested at the same time the PR enters QA. If unsigned after 7 days, send a calm follow-up. If unsigned after 14 days, loop in the family's primary contact and document the delay in the auth record.";
  }
  if (p.includes("behind on 97156") || (p.includes("families") && p.includes("behind"))) {
    return "Filter the parent training queue by 'days since last 97156' > 30. Each one needs a scheduled session in the next 14 days or a documented family reason. Repeated misses become a continuation risk worth flagging to your SD.";
  }
  if (p.includes("low parent participation") || p.includes("document") && p.includes("participation")) {
    return "In the session note, document attendance rate, presence quality, follow-through on prior session goals, and one concrete next step. Below 60% participation over 60 days is a written escalation to your SD.";
  }
  if (p.includes("scheduling contact")) {
    return "Each State has a primary scheduling contact listed in the Org Chart. For day-to-day requests, use the standard channel. For urgent coverage gaps, use the operational escalation path defined in Module 7.";
  }
  if (p.includes("uncovered client") || p.includes("escalate") && p.includes("client")) {
    return "Report the gap to Scheduling immediately with the client name, the uncovered hours, and the deadline by which it must be resolved. If unresolved within 24 hours for a Red client, escalate to your State Director.";
  }
  if (p.includes("escalate") && p.includes("pr signature")) {
    return "Stalled parent signatures: gentle follow-up at 7 days, primary contact loop-in at 14 days, State Director notification at 21 days. Document each touch in the auth record.";
  }
  if (p.includes("draft a calm message") || p.includes("missed session")) {
    return "Lead with care: \"Hi [Family], we missed [Client] today and want to make sure everything is okay.\" Confirm the next session, offer a make-up if applicable, and avoid blame language. Document the message in the family thread.";
  }
  if (p.includes("documentation expectations") || p.includes("documentation gaps")) {
    return "Every session note: attendance, behaviors observed, programs run, parent presence (97156), and next-session plan. Gaps usually show up as missing parent presence fields or missing next-step notes — both are common QA pushbacks.";
  }
  if (p.includes("operational risks this month") || p.includes("top operational risks")) {
    return "Three risk buckets: (1) PRs landing in the next 6 weeks, (2) supervision overdue, (3) clients with rising cancellation patterns. Sort each by severity and clear bucket 1 by end of week.";
  }
  if (p.includes("busiest weeks") || p.includes("pre-plan")) {
    return "Layer your PR due dates, supervision cadence, and parent training cadence on one calendar. Weeks with 3+ overlapping deliverables are your pre-plan weeks — block focus time the week before.";
  }
  if (p.includes("learned in this journey")) {
    return `You've moved through ${modules.length} modules covering BCBA foundations, caseload management, supervision, PRs and authorizations, parent training, scheduling coordination, escalations, Blossom OS, documentation, and advanced operations. You are operationally ready.`;
  }
  if (p.includes("first 90 days") || p.includes("post-journey")) {
    return "First 30 days: run your Workspace daily and complete every required workflow on cadence. Next 30: tune your weekly rituals. Last 30: mentor a newer BCBA on one workflow you've mastered.";
  }
  return `Operational context for "${m.title}": ${m.subtitle} Use the SOP links in this module and the BCBA Workspace to ground your next action.`;
}

// ---------- small atoms ----------

function JourneyStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 px-4 py-3 backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/80">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-primary-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-primary-foreground/75">{sub}</p>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }: { icon: typeof Layers; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted/60 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: typeof Layers; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}