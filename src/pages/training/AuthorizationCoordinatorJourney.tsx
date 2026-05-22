import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, ArrowRight, CheckCircle2, Clock, Sparkles, Compass, Workflow,
  FileText, AlertTriangle, ClipboardCheck, Users, Layers, BookOpen,
  PlayCircle, ExternalLink, Target, Wrench, GraduationCap, Eye, Hand,
  Activity, ChevronRight, MessageSquare, Calendar, ListChecks,
} from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// Authorization Coordinator Journey
// Operational onboarding for Blossom ABA authorization team members.
// All content is grounded in real Blossom auth workflows (SOPs, PR escalation,
// QA readiness, missing-doc handling). No mock corporate LMS material.
// =============================================================================

type LessonKind = "Overview" | "SOP" | "Workflow" | "Tango" | "Checklist" | "Shadowing" | "Knowledge Check";

interface Lesson {
  id: string;
  title: string;
  kind: LessonKind;
  minutes: number;
  summary: string;
}

interface Module {
  id: string;
  number: number;
  phase: "Observe" | "Practice" | "Assisted" | "Independent";
  title: string;
  subtitle: string;
  icon: typeof ShieldCheck;
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
    title: "Welcome to Authorization Operations",
    subtitle: "How Blossom thinks about authorizations, and how this role fits.",
    icon: Compass,
    objectives: [
      "Understand the Blossom OS operating philosophy",
      "Know the difference between dashboards, workspaces, and pages",
      "Internalize the calm, proactive operational mindset",
      "Recognize the role of the Authorization Coordinator inside Blossom",
    ],
    lessons: [
      { id: "m1-l1", title: "Welcome from the State Director", kind: "Overview", minutes: 4, summary: "A short welcome video and mission framing." },
      { id: "m1-l2", title: "How Blossom OS is structured", kind: "Workflow", minutes: 8, summary: "Dashboards show, Workspaces act, Pages document." },
      { id: "m1-l3", title: "Role overview & operational expectations", kind: "Overview", minutes: 6, summary: "Where the coordinator sits in the org and what success looks like." },
      { id: "m1-l4", title: "Calm under pressure: how we communicate", kind: "Overview", minutes: 5, summary: "Tone, escalation, and ownership norms across Blossom." },
    ],
    sopLinks: [
      { label: "Blossom Operational Principles", href: "/resources" },
      { label: "Org structure & state leadership", href: "/hr/org-chart" },
    ],
    checklist: [
      "Watched welcome video",
      "Reviewed org chart and identified your manager",
      "Logged into Blossom OS and bookmarked the Auth workspace",
    ],
    shadowing: ["Sit in on one daily auth standup", "Observe one PR escalation conversation"],
    aiPrompts: [
      "Summarize the Authorization Coordinator role in one paragraph",
      "What does 'workflows before automations' mean at Blossom?",
    ],
  },
  {
    id: "m2",
    number: 2,
    phase: "Observe",
    title: "Authorization Workflow Foundations",
    subtitle: "The real lifecycle: Awaiting Submission → Submitted → Approved (and everything that can go wrong).",
    icon: Workflow,
    objectives: [
      "Define every authorization status and what triggers a move",
      "Identify operational ownership at each stage",
      "Recognize expiration risk windows (60 / 30 / 15 days)",
      "Understand reassessment timing and continuation cadence",
    ],
    lessons: [
      { id: "m2-l1", title: "The 8 authorization statuses", kind: "Workflow", minutes: 10, summary: "Awaiting Submission, Submitted, Approved, Expiring Soon, In QA Review, Denied, Missing Information, Flaked." },
      { id: "m2-l2", title: "Status progression rules", kind: "SOP", minutes: 8, summary: "When records move automatically vs. by hand, and who owns each transition." },
      { id: "m2-l3", title: "Reassessment & continuation timing", kind: "Workflow", minutes: 7, summary: "When to begin reassessment and how to time submissions." },
      { id: "m2-l4", title: "Lifecycle map walkthrough", kind: "Tango", minutes: 6, summary: "Visual walkthrough of an auth from start to finish." },
    ],
    sopLinks: [
      { label: "Auth SOP — Lifecycle & Statuses", href: "/resources" },
      { label: "Authorizations workspace", href: "/authorizations" },
    ],
    tangos: [
      { label: "CR — locating an auth", note: "Find any client's active and expired authorizations in CentralReach." },
      { label: "Blossom OS — auth drawer tour", note: "Every field, every action, every link." },
    ],
    checklist: [
      "Can recite all 8 statuses unprompted",
      "Walked through one approved auth end-to-end",
      "Walked through one denied auth end-to-end",
    ],
    shadowing: ["Shadow one auth submission", "Shadow one expiring-soon outreach"],
    aiPrompts: [
      "Explain the difference between Missing Information and Flaked",
      "When does an auth move from QA Review to Awaiting Submission?",
    ],
    knowledgeCheck: {
      q: "An auth shows In QA Review for 8 days with no movement. What's the right first action?",
      a: "Open the linked treatment record, confirm the BCBA assignment, and escalate to QA owner before touching status.",
    },
  },
  {
    id: "m3",
    number: 3,
    phase: "Practice",
    title: "Progress Reports & Supervision Tracking",
    subtitle: "The PR escalation system — Georgia and multi-state ladders.",
    icon: Activity,
    objectives: [
      "Master the Georgia escalation ladder (Rivky → Shira/Rachel)",
      "Master the multi-state ladder (Rikki → Julianne → SD)",
      "Track supervision % and know when it becomes a blocker",
      "Coordinate parent signature workflows without over-escalating",
    ],
    lessons: [
      { id: "m3-l1", title: "What a PR actually is, operationally", kind: "Overview", minutes: 5, summary: "Why PRs gate continuation, reimbursement, and QA." },
      { id: "m3-l2", title: "Georgia escalation ladder", kind: "Workflow", minutes: 8, summary: "Rivky begins outreach at 9 weeks. Shira/Rachel engage at 6 weeks." },
      { id: "m3-l3", title: "Multi-state escalation ladder", kind: "Workflow", minutes: 9, summary: "Rikki outreach at 9 weeks with Julianne CC'd. SD escalation at 6 weeks. SD exits after PR is received unless parent signature support is needed." },
      { id: "m3-l4", title: "Supervision tracking thresholds", kind: "SOP", minutes: 6, summary: "Why <70% supervision is a coordinator-owned signal." },
      { id: "m3-l5", title: "Parent signature support workflows", kind: "Workflow", minutes: 7, summary: "When to pull SD back in even after PR is received." },
    ],
    sopLinks: [
      { label: "Getting Progress Reports — SOP", href: "/resources" },
      { label: "PR escalation timing reference", href: "/auth-risk-center" },
    ],
    checklist: [
      "Pulled the current PR aging list for your state",
      "Identified every PR ≥ 6 weeks and confirmed escalation owner",
      "Drafted one outreach message in the Blossom tone",
    ],
    shadowing: ["Shadow one 9-week outreach", "Shadow one 6-week SD handoff"],
    aiPrompts: [
      "Summarize the escalation path for a 7-week-overdue PR in NC",
      "Which PRs in my caseload need SD involvement today?",
    ],
    knowledgeCheck: {
      q: "A Virginia client's PR has been outstanding 7 weeks. Who is the current owner?",
      a: "Rikki continues outreach with Julianne CC'd; SD has not yet entered the ladder (engages at week 6 in the ladder counted from the BCBA, which is now active).",
    },
  },
  {
    id: "m4",
    number: 4,
    phase: "Practice",
    title: "QA & Reassessment Coordination",
    subtitle: "Treatment auth flow: QA Review → Awaiting Submission once ready.",
    icon: ClipboardCheck,
    objectives: [
      "Coordinate treatment plan handoffs without losing records",
      "Time reassessments so submissions land before expiration",
      "Recognize what 'QA ready' actually means operationally",
      "Own the handoff back to coordinator after QA clears",
    ],
    lessons: [
      { id: "m4-l1", title: "Treatment auth flow vs. assessment flow", kind: "Workflow", minutes: 8, summary: "Why the QA Review status is the operational gate." },
      { id: "m4-l2", title: "Reassessment creation timing", kind: "SOP", minutes: 7, summary: "Open reassessment at the right week so QA has runway." },
      { id: "m4-l3", title: "Submission preparation after QA clears", kind: "Checklist", minutes: 6, summary: "Documents, signatures, payer-specific fields." },
      { id: "m4-l4", title: "When QA pushes back: how to respond", kind: "Workflow", minutes: 6, summary: "Calm rework, not re-escalation." },
    ],
    sopLinks: [
      { label: "Treatment Auth SOP", href: "/resources" },
      { label: "QA coordination workflow", href: "/qa" },
    ],
    checklist: [
      "Moved one record from QA Review → Awaiting Submission",
      "Prepared one full reassessment submission packet",
      "Coordinated one QA pushback round-trip without escalation",
    ],
    shadowing: ["Shadow one QA handoff", "Shadow one full reassessment submission"],
    aiPrompts: [
      "Which reassessments expire in the next 30 days and aren't QA-cleared?",
      "Summarize the QA blockers on this auth",
    ],
  },
  {
    id: "m5",
    number: 5,
    phase: "Assisted",
    title: "Missing Documentation & Blocker Resolution",
    subtitle: "The 'Incomplete Documents' rule and the Can't Submit Auth fallback.",
    icon: AlertTriangle,
    objectives: [
      "Diagnose missing-doc patterns (insurance, diagnosis, consent, signatures)",
      "Apply the Incomplete Documents rule correctly",
      "Know when an auth must be deleted vs. paused",
      "Coordinate with intake, BCBA, and the parent to unblock",
    ],
    lessons: [
      { id: "m5-l1", title: "The Incomplete Documents rule", kind: "SOP", minutes: 7, summary: "When 'Incomplete Documents' is checked correctly, the auth is deleted and the client moves back to 'Can't Submit Auth' until resolved." },
      { id: "m5-l2", title: "Missing insurance card workflow", kind: "Workflow", minutes: 5, summary: "Who chases, who confirms, and how long to wait." },
      { id: "m5-l3", title: "Missing diagnosis / consent / PR / signatures", kind: "Checklist", minutes: 8, summary: "Owner mapping for every common gap." },
      { id: "m5-l4", title: "Blocker resolution patterns", kind: "Workflow", minutes: 6, summary: "Three patterns that resolve 80% of blockers." },
    ],
    sopLinks: [
      { label: "Auth SOP — Incomplete Documents", href: "/resources" },
      { label: "Can't Submit Auth queue", href: "/authorizations" },
    ],
    checklist: [
      "Resolved one missing-doc blocker end-to-end",
      "Correctly applied Incomplete Documents to one record",
      "Coordinated one cross-team unblock (intake + BCBA)",
    ],
    shadowing: ["Shadow one Incomplete Documents action", "Shadow one re-entry from Can't Submit Auth"],
    aiPrompts: [
      "What documents are currently missing on this auth and who owns each?",
      "Walk me through resolving a missing diagnosis on a new client",
    ],
    knowledgeCheck: {
      q: "An auth has missing insurance and missing diagnosis. Do you mark Incomplete Documents?",
      a: "Only after confirming with intake that both are truly unrecoverable in the short term. If yes, the auth is deleted and the client returns to Can't Submit Auth.",
    },
  },
  {
    id: "m6",
    number: 6,
    phase: "Assisted",
    title: "Parent Training 97156 Operations",
    subtitle: "Continuation readiness and parent participation visibility.",
    icon: Users,
    objectives: [
      "Manage parent training utilization without clinical overreach",
      "Identify continuation risk before it becomes denial risk",
      "Coordinate documentation that supports reimbursement readiness",
      "Track parent participation as an operational signal",
    ],
    lessons: [
      { id: "m6-l1", title: "Why 97156 is operationally different", kind: "Overview", minutes: 5, summary: "Continuation, not clinical training, is the coordinator's job." },
      { id: "m6-l2", title: "Utilization pacing and red flags", kind: "Workflow", minutes: 7, summary: "Under-utilization patterns that predict continuation issues." },
      { id: "m6-l3", title: "Parent participation visibility", kind: "Workflow", minutes: 6, summary: "How to surface participation gaps to BCBA and SD." },
      { id: "m6-l4", title: "Documentation coordination", kind: "Checklist", minutes: 5, summary: "What QA needs to see before continuation." },
    ],
    sopLinks: [
      { label: "Parent Training 97156 workspace", href: "/parent-training-97156" },
    ],
    checklist: [
      "Reviewed your state's 97156 utilization report",
      "Flagged at least one continuation risk to SD",
      "Confirmed documentation status on one continuation",
    ],
    aiPrompts: [
      "Which 97156 clients have utilization concerns this month?",
      "Summarize parent participation for this client over the last 60 days",
    ],
  },
  {
    id: "m7",
    number: 7,
    phase: "Independent",
    title: "Auth Risk Center & Operational Intelligence",
    subtitle: "Proactive operational thinking — prevent failures before they happen.",
    icon: Target,
    objectives: [
      "Read the Auth Risk Center fluently every morning",
      "Distinguish expiration risk from workflow risk from payer risk",
      "Prioritize action across 20+ concurrent risks",
      "Escalate at the right moment, not the loudest one",
    ],
    lessons: [
      { id: "m7-l1", title: "The 11 risk signals in the Risk Center", kind: "Workflow", minutes: 9, summary: "Expiration, PR overdue, QA bottleneck, missing docs, stalled submission, denial, continuation, utilization, and more." },
      { id: "m7-l2", title: "Zone bands: Red, Orange, Yellow, Green", kind: "SOP", minutes: 6, summary: "Thresholds and what action each zone requires." },
      { id: "m7-l3", title: "Daily morning routine", kind: "Checklist", minutes: 5, summary: "The 10-minute scan that catches 90% of issues." },
      { id: "m7-l4", title: "Proactive escalation timing", kind: "Workflow", minutes: 7, summary: "Escalate early, calmly, with a recommended next action." },
    ],
    sopLinks: [
      { label: "Auth Risk Center", href: "/auth-risk-center" },
      { label: "Risk Center operational guide", href: "/resources" },
    ],
    checklist: [
      "Completed 5 consecutive morning risk scans",
      "Escalated 1 risk before it entered the red zone",
      "Cleared 1 risk through coordination only (no escalation)",
    ],
    shadowing: ["Shadow SD's weekly risk review"],
    aiPrompts: [
      "What are the top 3 risks I should act on today?",
      "Why is this authorization in the red zone?",
    ],
  },
  {
    id: "m8",
    number: 8,
    phase: "Independent",
    title: "Systems & Tools",
    subtitle: "Blossom OS, CentralReach, legacy Monday, QA workflows, Resource Library, Ask Blossom AI.",
    icon: Wrench,
    objectives: [
      "Move fluidly between Blossom OS and CentralReach",
      "Understand legacy Monday boards well enough to read history",
      "Use the Resource Library and Ask Blossom AI as daily tools",
    ],
    lessons: [
      { id: "m8-l1", title: "Blossom OS — authorization workspace tour", kind: "Tango", minutes: 7, summary: "Every panel, every filter, every keyboard shortcut." },
      { id: "m8-l2", title: "CentralReach for coordinators", kind: "Tango", minutes: 10, summary: "Auth lookup, treatment plan workflows, contact exports." },
      { id: "m8-l3", title: "Reading legacy Monday context", kind: "Workflow", minutes: 5, summary: "When historical context lives outside Blossom OS." },
      { id: "m8-l4", title: "Resource Library navigation", kind: "Workflow", minutes: 4, summary: "Find any SOP in under 15 seconds." },
      { id: "m8-l5", title: "Ask Blossom AI as a daily tool", kind: "Workflow", minutes: 5, summary: "When to ask AI, when to ask a human." },
    ],
    sopLinks: [
      { label: "Authorizations workspace", href: "/authorizations" },
      { label: "Resource Library", href: "/resources" },
    ],
    tangos: [
      { label: "CR — user management", note: "Add and adjust coordinator access in CentralReach." },
      { label: "CR — auth actions", note: "Open, edit, and update auth records in CR." },
      { label: "CR — treatment plan workflow", note: "Find treatment plans tied to active auths." },
      { label: "CR — contact exports", note: "Pull contact lists for parent outreach." },
    ],
    checklist: [
      "Completed all CR tangos",
      "Found 5 SOPs in the Resource Library in under 2 minutes total",
      "Used Ask Blossom AI to answer one real operational question",
    ],
    aiPrompts: [
      "Where is the SOP for treatment plan handoffs?",
      "Show me every active auth assigned to me in CR",
    ],
  },
  {
    id: "m9",
    number: 9,
    phase: "Independent",
    title: "Advanced Authorization Operations",
    subtitle: "Difficult payers, OON, continuation complexity, and escalation leadership.",
    icon: GraduationCap,
    objectives: [
      "Navigate payer-specific quirks without freezing",
      "Handle OON considerations and EOB / payment-plan context",
      "Own escalation leadership on your caseload",
      "Prioritize ruthlessly under load",
    ],
    lessons: [
      { id: "m9-l1", title: "Difficult payers — playbook", kind: "Workflow", minutes: 10, summary: "Patterns that repeat across the hardest payers." },
      { id: "m9-l2", title: "OON considerations", kind: "SOP", minutes: 7, summary: "What OON changes operationally for the coordinator." },
      { id: "m9-l3", title: "EOB & payment plan context", kind: "Overview", minutes: 6, summary: "Enough finance literacy to coordinate well." },
      { id: "m9-l4", title: "Continuation complexity", kind: "Workflow", minutes: 8, summary: "Multi-factor continuation cases and how to staff them." },
      { id: "m9-l5", title: "Escalation leadership", kind: "Overview", minutes: 6, summary: "Calm, specific, action-oriented escalation." },
      { id: "m9-l6", title: "Workload prioritization under pressure", kind: "Workflow", minutes: 5, summary: "The two-list method coordinators use at Blossom." },
    ],
    sopLinks: [
      { label: "Blossom EOB & Payment Plan guidance", href: "/resources" },
      { label: "Continuation playbook", href: "/auth-risk-center" },
    ],
    checklist: [
      "Led one difficult-payer escalation end-to-end",
      "Co-managed one OON continuation",
      "Demonstrated independent prioritization for 1 full week",
    ],
    aiPrompts: [
      "Summarize all blockers across my caseload, ranked by urgency",
      "Which continuations are at highest risk this week?",
    ],
    knowledgeCheck: {
      q: "Two equally-urgent escalations land at 4:45 PM. How do you decide?",
      a: "Choose the one with the shorter recovery window if unaddressed today. Document the second with an owner and a morning-first commitment.",
    },
  },
];

const phaseStyles: Record<Module["phase"], { label: string; tone: string; icon: typeof Eye }> = {
  Observe: { label: "Phase 1 · Observe", tone: "bg-info/10 text-info border-info/20", icon: Eye },
  Practice: { label: "Phase 2 · Practice", tone: "bg-warning/10 text-warning border-warning/20", icon: Hand },
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

export default function AuthorizationCoordinatorJourney() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeModuleId, setActiveModuleId] = useState<string>(modules[0].id);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);

  const totalLessons = useMemo(() => modules.reduce((s, m) => s + m.lessons.length, 0), []);
  const totalMinutes = useMemo(() => modules.reduce((s, m) => s + m.lessons.reduce((a, l) => a + l.minutes, 0), 0), []);
  const completedCount = completed.size;
  const pct = Math.round((completedCount / totalLessons) * 100);

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
      eyebrow="Training Academy · Role Journey"
      eyebrowIcon={ShieldCheck}
      title="Authorization Coordinator Journey"
      description="Learn how Blossom manages authorizations, reassessments, PR workflows, QA readiness, escalation timing, and operational authorization coordination."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="bg-white/15 text-primary-foreground hover:bg-white/25 border-white/20">
            <Link to="/training"><GraduationCap className="mr-1.5 h-4 w-4" /> Academy home</Link>
          </Button>
          <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90">
            <Link to="/authorizations"><ArrowRight className="mr-1.5 h-4 w-4" /> Open Auth workspace</Link>
          </Button>
        </div>
      }
      stats={
        <div className="grid grid-cols-3 gap-3">
          <JourneyStat label="Modules" value={`${modules.length}`} sub="role-specific" />
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
                The Authorization Coordinator role protects service continuity, reimbursement readiness, and operational
                progression by proactively managing authorization workflows and escalation timing.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetaRow icon={Layers} label="Core systems" value="Blossom OS · CentralReach · Resource Library" />
                <MetaRow icon={Workflow} label="Key workflows" value="Auth lifecycle · PR escalation · QA readiness · Missing docs" />
                <MetaRow icon={Calendar} label="Suggested length" value="2–4 weeks operational onboarding" />
                <MetaRow icon={Users} label="Assigned trainer" value="State Director · Auth Lead" />
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
            {(["Observe", "Practice", "Assisted", "Independent"] as Module["phase"][]).map((phase) => {
              const phaseModules = modules.filter((m) => m.phase === phase);
              const phaseLessons = phaseModules.flatMap((m) => m.lessons);
              const done = phaseLessons.filter((l) => completed.has(l.id)).length;
              const p = Math.round((done / phaseLessons.length) * 100);
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
        {/* Module list */}
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

        {/* Active module detail */}
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
              {/* Objectives */}
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

              {/* SOP & Tango links */}
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

            {/* Lessons */}
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

            {/* Shadowing + checklist */}
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

            {/* Knowledge check */}
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

          {/* Ask Blossom AI */}
          <GlassPanel className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Ask Blossom AI · {active.title}</p>
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
  // Deterministic, operationally-grounded preview answers per module.
  const p = prompt.toLowerCase();
  if (p.includes("role") && p.includes("paragraph")) {
    return "Authorization Coordinators protect continuity of services by managing the full authorization lifecycle: submissions, PR cadence, QA handoffs, and risk escalation — calmly, proactively, and in coordination with State Directors and BCBAs.";
  }
  if (p.includes("workflows before automations")) {
    return "We clean and standardize a workflow first — owners, statuses, escalation timing — before we automate any of it. Automating a messy workflow only scales the mess.";
  }
  if (p.includes("missing information") && p.includes("flaked")) {
    return "Missing Information means a recoverable doc gap with a known owner and an active path to resolution. Flaked means the parent or required party has gone unresponsive after standard outreach, and the workflow can no longer progress without leadership intervention.";
  }
  if (p.includes("qa review to awaiting submission")) {
    return "A treatment auth moves from In QA Review to Awaiting Submission only after the assigned QA reviewer confirms the treatment plan is complete, signed where required, and payer-ready. The coordinator owns the next move.";
  }
  if (p.includes("7-week") || p.includes("overdue pr") || p.includes("nc")) {
    return "At 7 weeks in a non-GA state, Rikki continues active outreach with Julianne CC'd. SD has not yet entered the ladder. Begin preparing handoff notes; SD engages at the 6-week mark relative to the BCBA's owed window. Document one concrete next action before end of day.";
  }
  if (p.includes("which prs in my caseload need sd involvement")) {
    return "Pull PRs aged ≥ 6 weeks where outreach by Rivky (GA) or Rikki/Julianne (other states) has not produced movement in the last 7 days. Those are SD-eligible today. Anything younger stays at the outreach layer.";
  }
  if (p.includes("reassessments expire")) {
    return "Filter the Auth workspace by status In QA Review or Awaiting Submission with expiration ≤ 30 days. Anything that isn't QA-cleared is your priority list today.";
  }
  if (p.includes("qa blockers")) {
    return "Open the linked treatment record and surface: outstanding signatures, missing data sheets, unresolved QA comments, and any payer-specific fields. List each with an owner and a concrete next action.";
  }
  if (p.includes("missing on this auth") || p.includes("missing diagnosis")) {
    return "Map every missing doc to its owner: insurance → intake, diagnosis → intake/parent, consent → BCBA, PR → BCBA, signatures → parent. If two or more are unrecoverable short-term, apply Incomplete Documents and move the client back to Can't Submit Auth.";
  }
  if (p.includes("97156") && p.includes("utilization")) {
    return "Pull the 97156 utilization report for your state. Flag any client under 60% utilization in the trailing 30 days, and any with three+ missed sessions in 14 days. Those are continuation risks worth surfacing to SD.";
  }
  if (p.includes("parent participation")) {
    return "Summarize session attendance, parent presence rate, and rescheduled sessions over the last 60 days. Anything below 70% participation is an operational signal for the BCBA and a coordinator-owned flag.";
  }
  if (p.includes("top 3 risks")) {
    return "Sort Risk Center by zone (Red first), filter to your caseload, and take the first three that have no action logged in the last 48 hours. Those are your morning three.";
  }
  if (p.includes("why is this authorization in the red zone")) {
    return "Red zones trigger on: expiration < 15 days, PR overdue > 45 days, days-in-stage ≥ 3 with no movement, or denial. Open the drawer's Risk Factors tab to see the exact signal driving the zone.";
  }
  if (p.includes("sop for treatment plan handoffs")) {
    return "Resource Library → Authorizations → Treatment Auth SOP → Section 4 (QA handoffs). The Tango walkthrough is linked in the same SOP page.";
  }
  if (p.includes("every active auth assigned to me in cr")) {
    return "In CentralReach: Authorizations → filter by Owner = you, Status = Active. Save as a personal view named 'My Active Auths' so it loads in one click each morning.";
  }
  if (p.includes("all blockers across my caseload")) {
    return "Three buckets, ranked: (1) Red-zone risks with no owner action in 48 hours, (2) Missing-doc holds older than 7 days, (3) QA stalls > 5 days. Address bucket 1 first; bucket 2 by EOD; bucket 3 tomorrow morning.";
  }
  if (p.includes("continuations are at highest risk")) {
    return "Continuations are highest risk when utilization is < 60%, PR is overdue, and expiration is < 45 days. Any continuation hitting two of three is an SD escalation today.";
  }
  return `Operational context for "${m.title}": ${m.subtitle} Use the SOP links in this module and the Auth workspace to ground your next action.`;
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