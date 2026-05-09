import {
  Sparkles, Heart, Compass, Users, GraduationCap, BookOpen, ShieldCheck, ClipboardCheck, Award,
  Building2, UserCheck, Eye, MonitorPlay, Workflow, Database, MapPin, Briefcase, Megaphone,
  CalendarDays, BarChart3, MessageSquare, Target, Rocket, Trophy, FileText, PlayCircle, Wand2,
  Network, Phone, Building, ListChecks, type LucideIcon,
} from "lucide-react";

export type OnboardingPath = "existing_state" | "new_state";

export interface ActionItem {
  id: string;
  label: string;
  hint?: string;
  href?: string;        // internal route or external URL
  external?: boolean;
  icon?: LucideIcon;
  optional?: boolean;
}

export interface JourneyModule {
  key: string;                  // unique storage key, e.g. "w1.systems.cr"
  title: string;
  blurb: string;
  icon: LucideIcon;
  estMinutes: number;
  /** Module kind drives the rendered card variant. */
  kind: "content" | "leader" | "shadowing" | "system" | "checkin" | "outcome" | "department";
  /** Optional details by kind */
  leader?: { name: string; role: string; message: string; initials: string };
  system?: { name: string; videoLabel?: string; sopLabel?: string; tangoLabel?: string };
  shadowing?: {
    /** Optional ordered stages — used for transition scenarios (e.g. shadow A, then Gary Frank). */
    stages?: { id: string; assignee: string; role: string; initials: string; days?: string; description?: string }[];
    /** Fallback single assignee when stages aren't used. */
    assignee?: string;
    /** Checkable observation goals — all must be checked to complete shadowing. */
    goals: string[];
  };
  outcomeBullets?: string[];
  /** Clickable, enriching to-dos. Completing all required actions can auto-complete the module. */
  actions?: ActionItem[];
  /** If set, only render when path matches. */
  pathOnly?: OnboardingPath;
}

export interface JourneyPhase {
  id: "welcome" | "w1" | "w2" | "w3" | "w45" | "graduation";
  index: number;
  weekLabel: string;          // e.g. "Phase 0", "Week 1"
  title: string;
  objective: string;
  icon: LucideIcon;
  path: string;
  modules: JourneyModule[];
  outcome?: { title: string; bullets: string[] };
}

const LEADERS = {
  chad: { name: "Chad Kaufman", role: "Leadership", initials: "CK" },
  shira: { name: "Shira Lasry", role: "ABA Operations", initials: "SL" },
  gary: { name: "Gary Frank", role: "Operations", initials: "GF" },
  daylis: { name: "Daylis", role: "Scheduling", initials: "DA" },
  nick: { name: "Nick", role: "Marketing", initials: "NK" },
  corey: { name: "Corey", role: "Tracking & Reporting", initials: "CO" },
  eli: { name: "Eli Berman", role: "CR Backend", initials: "EB" },
};

export const ONBOARDING_PHASES: JourneyPhase[] = [
  {
    id: "welcome",
    index: 0,
    weekLabel: "Phase 0",
    title: "Welcome to Blossom",
    objective: "Get grounded in who we are, what we believe, and what to expect over your first five weeks.",
    icon: Sparkles,
    path: "/onboarding/phase/welcome",
    modules: [
      { key: "p0.welcome", title: "Welcome message", blurb: "A warm hello from the Blossom team.", icon: Sparkles, estMinutes: 3, kind: "content" },
      { key: "p0.mission", title: "Mission & Vision", blurb: "Why we exist and where we're going.", icon: Heart, estMinutes: 5, kind: "content",
        actions: [
          { id: "read", label: "Read the Mission & Vision page", icon: BookOpen, href: "/onboarding/mission" },
          { id: "reflect", label: "Reflect: which part resonates with you most?", hint: "Be honest — there's no wrong answer." },
        ] },
      { key: "p0.values", title: "Core Values", blurb: "The four values that guide every decision.", icon: Compass, estMinutes: 6, kind: "content",
        actions: [
          { id: "open", label: "Open the Core Values page", icon: Compass, href: "/onboarding/values" },
          { id: "pick", label: "Pick a value you'd like to live this week", icon: Target },
        ] },
      { key: "p0.team", title: "Meet the Team", blurb: "Who you'll work with at Blossom.", icon: Users, estMinutes: 5, kind: "content",
        actions: [
          { id: "team-page", label: "Open the Team directory", icon: Users, href: "/team" },
          { id: "org-chart", label: "Browse the Org Chart", icon: Network, href: "/hr/org-chart" },
          { id: "leaders", label: "Read the Meet the Team page", icon: BookOpen, href: "/onboarding/team" },
        ] },
      { key: "p0.how", title: "How Blossom Works", blurb: "How learning, training, and growth fit together.", icon: GraduationCap, estMinutes: 5, kind: "content",
        actions: [
          { id: "how", label: "Read How Blossom Works", icon: BookOpen, href: "/onboarding/how-it-works" },
          { id: "academy", label: "Peek at the Operations Academy", icon: GraduationCap, href: "/blossom/academy" },
        ] },
      { key: "p0.chad", title: "Welcome from Chad Kaufman", blurb: "Leadership expectations, oversight, and company vision.", icon: UserCheck, estMinutes: 4, kind: "leader",
        leader: { ...LEADERS.chad, message: "Welcome to Blossom. I'm thrilled you're joining us — our work matters, and you matter to it." },
        actions: [
          { id: "watch", label: "Watch Chad's welcome message", icon: PlayCircle },
          { id: "note", label: "Jot down one expectation Chad mentioned", icon: FileText },
        ] },
      { key: "p0.shira", title: "A note from Shira Lasry", blurb: "This onboarding journey was designed for you.", icon: UserCheck, estMinutes: 4, kind: "leader",
        leader: { ...LEADERS.shira, message: "This onboarding journey was designed to help you feel confident, supported, and fully prepared to succeed at Blossom." },
        actions: [
          { id: "watch", label: "Read Shira's welcome note", icon: BookOpen },
          { id: "save-num", label: "Save Shira's contact for daily check-ins", icon: Phone },
        ] },
    ],
  },
  {
    id: "w1",
    index: 1,
    weekLabel: "Week 1",
    title: "Foundation & Systems Training",
    objective: "Build a strong understanding of company structure, ABA fundamentals, and core systems.",
    icon: Building2,
    path: "/onboarding/week/1",
    modules: [
      { key: "w1.team", title: "Team Introductions", blurb: "Meet key team members and learn roles & responsibilities.", icon: Users, estMinutes: 30, kind: "content",
        actions: [
          { id: "team", label: "Open the Team page", hint: "Browse everyone in the company.", icon: Users, href: "/team" },
          { id: "org", label: "Open the Org Chart", hint: "See reporting lines.", icon: Network, href: "/hr/org-chart" },
          { id: "directory", label: "Open the Employee Directory", icon: ListChecks, href: "/hr/directory" },
          { id: "intro", label: "Introduce yourself in the team channel", icon: MessageSquare, optional: true },
        ] },
      { key: "w1.lead.chad", title: "Meet with Chad Kaufman", blurb: "Leadership expectations, operational oversight, company vision.", icon: UserCheck, estMinutes: 45, kind: "leader",
        leader: { ...LEADERS.chad, message: "Let's talk about what great looks like at Blossom and how we operate." },
        actions: [
          { id: "schedule", label: "Schedule the meeting with Chad", icon: CalendarDays },
          { id: "prep", label: "Prep 3 questions about leadership expectations", icon: FileText },
          { id: "team", label: "Open Chad's profile in Team", icon: UserCheck, href: "/team" },
          { id: "after", label: "After the meeting, write 1 takeaway in your notes", icon: ClipboardCheck },
        ] },
      { key: "w1.lead.shira", title: "Meet with Shira Lasry", blurb: "ABA background, company protocols, expectations, philosophy.", icon: UserCheck, estMinutes: 60, kind: "leader",
        leader: { ...LEADERS.shira, message: "We'll cover ABA fundamentals, our protocols, and how we think about quality care." },
        actions: [
          { id: "schedule", label: "Schedule the meeting with Shira", icon: CalendarDays },
          { id: "prep", label: "Skim ABA basics so you can ask sharper questions", icon: BookOpen },
          { id: "team", label: "Open Shira's profile in Team", icon: UserCheck, href: "/team" },
        ] },
      { key: "w1.shadow", title: "Shadowing", blurb: "Observe day-to-day operations, workflow, and communication.", icon: Eye, estMinutes: 240, kind: "shadowing",
        shadowing: {
          stages: [
            { id: "transition", assignee: "Transitioning employee", role: "Outgoing role-holder", initials: "TE", days: "Days 1–2", description: "Shadow the person currently in the seat to learn live workflows, hand-offs, and tribal knowledge before they roll off." },
            { id: "gary", assignee: "Gary Frank", role: "Operations", initials: "GF", days: "Days 3–5", description: "Then shadow Gary Frank to see operational decision-making, escalation patterns, and how priorities are set across the day." },
          ],
          goals: [
            "Observe a full operational day end-to-end",
            "Map how communication flows between teams",
            "See how priorities are set and escalated",
            "Capture observation notes for each stage",
          ],
        },
      },
      { key: "w1.sys.cr", title: "CentralReach", blurb: "Our core clinical & operational platform.", icon: MonitorPlay, estMinutes: 60, kind: "system",
        system: { name: "CentralReach", videoLabel: "Watch CR walkthrough", sopLabel: "View CR SOP", tangoLabel: "Tango walkthrough" },
        actions: [
          { id: "video", label: "Watch the CR walkthrough video", icon: PlayCircle },
          { id: "sop", label: "Read the CentralReach SOP", icon: FileText },
          { id: "tango", label: "Run through the Tango interactive guide", icon: Wand2 },
          { id: "login", label: "Log in to CentralReach successfully", icon: MonitorPlay },
          { id: "explore", label: "Open a sample client record", icon: ClipboardCheck },
        ] },
      { key: "w1.sys.monday", title: "Monday.com", blurb: "Workflow and project management.", icon: MonitorPlay, estMinutes: 30, kind: "system",
        system: { name: "Monday.com", videoLabel: "Watch Monday training", sopLabel: "View Monday SOP" },
        actions: [
          { id: "video", label: "Watch the Monday.com training video", icon: PlayCircle },
          { id: "sop", label: "Read the Monday.com SOP", icon: FileText },
          { id: "login", label: "Log in to Monday.com", icon: MonitorPlay },
          { id: "board", label: "Find your team's main board", icon: Workflow },
        ] },
      { key: "w1.sys.workflows", title: "Internal Workflows", blurb: "How handoffs, approvals, and escalations move.", icon: Workflow, estMinutes: 30, kind: "system",
        system: { name: "Internal Workflows", sopLabel: "View workflow SOPs" },
        actions: [
          { id: "sop", label: "Read the workflow SOPs", icon: FileText },
          { id: "tasks", label: "Open the Tasks page", icon: ClipboardCheck, href: "/tasks" },
          { id: "docs", label: "Browse the Documents library", icon: FileText, href: "/documents" },
        ] },
      { key: "w1.sys.cr-backend", title: "CR Backend with Eli Berman", blurb: "Backend configuration & power-user training.", icon: Database, estMinutes: 60, kind: "leader",
        leader: { ...LEADERS.eli, message: "I'll walk you through the CR backend and how to make it work for the team." },
        actions: [
          { id: "schedule", label: "Schedule the session with Eli", icon: CalendarDays },
          { id: "prep", label: "List 3 backend questions to bring", icon: FileText },
          { id: "after", label: "Save the backend cheat-sheet", icon: Database },
        ] },
      { key: "w1.newstate", title: "New State Track", blurb: "Shadow Gary Frank for 3 full days; observe state setup process; learn the operational structure of a new market.", icon: MapPin, estMinutes: 1440, kind: "content", pathOnly: "new_state" },
    ],
    outcome: {
      title: "Week One Outcome",
      bullets: [
        "Understand company structure and expectations",
        "Familiarity with CentralReach and Monday.com",
        "Exposure to daily operations",
      ],
    },
  },
  {
    id: "w2",
    index: 2,
    weekLabel: "Week 2",
    title: "Department Immersion",
    objective: "Gain hands-on exposure to each department and understand how they interconnect.",
    icon: Workflow,
    path: "/onboarding/week/2",
    modules: [
      { key: "w2.intake", title: "Intake Department", blurb: "Lead intake flow, client onboarding, lead management.", icon: Briefcase, estMinutes: 60, kind: "department",
        actions: [
          { id: "dept", label: "Open the Intake department page", icon: Building, href: "/blossom/departments" },
          { id: "leads", label: "Open the Leads pipeline", icon: Briefcase, href: "/leads" },
          { id: "dashboard", label: "Skim the Intake dashboard", icon: BarChart3, href: "/intake-dashboard" },
          { id: "shadow", label: "Sit with an intake coordinator for 30 min", icon: Eye },
        ] },
      { key: "w2.recruiting", title: "Recruiting Department", blurb: "Hiring process, candidate pipeline, interviews.", icon: Users, estMinutes: 60, kind: "department",
        actions: [
          { id: "dept", label: "Open the Recruiting department page", icon: Building, href: "/blossom/departments" },
          { id: "pipeline", label: "Open the Recruiting candidate list", icon: Users, href: "/recruiting" },
          { id: "dashboard", label: "Skim the Recruiting dashboard", icon: BarChart3, href: "/recruiting-dashboard" },
        ] },
      { key: "w2.case", title: "Case Management", blurb: "Client coordination and internal communication.", icon: ClipboardCheck, estMinutes: 60, kind: "department",
        actions: [
          { id: "clients", label: "Open the Clients page", icon: Users, href: "/clients" },
          { id: "auth", label: "Open Authorizations", icon: ShieldCheck, href: "/authorizations" },
          { id: "qa", label: "Open the QA queue", icon: ClipboardCheck, href: "/qa" },
        ] },
      { key: "w2.scheduling", title: "Scheduling — meet with Daylis", blurb: "Scheduling systems and challenges.", icon: CalendarDays, estMinutes: 45, kind: "leader",
        leader: { ...LEADERS.daylis, message: "Scheduling is the heartbeat — let me show you how we keep it healthy." },
        actions: [
          { id: "schedule", label: "Schedule the meeting with Daylis", icon: CalendarDays },
          { id: "page", label: "Open the Scheduling page", icon: CalendarDays, href: "/scheduling" },
          { id: "dashboard", label: "Skim the Scheduling dashboard", icon: BarChart3, href: "/scheduling-dashboard" },
        ] },
      { key: "w2.marketing", title: "Marketing — meet with Nick", blurb: "Lead generation and marketing strategies.", icon: Megaphone, estMinutes: 45, kind: "leader",
        leader: { ...LEADERS.nick, message: "Here's how leads find us, and how we think about growth." },
        actions: [
          { id: "schedule", label: "Schedule the meeting with Nick", icon: CalendarDays },
          { id: "leads", label: "Look at recent leads in the Leads page", icon: Briefcase, href: "/leads" },
        ] },
      { key: "w2.tracking", title: "Tracking & Reporting — meet with Corey", blurb: "KPIs, reporting expectations, accountability.", icon: BarChart3, estMinutes: 45, kind: "leader",
        leader: { ...LEADERS.corey, message: "We measure what matters. Let's get you fluent in our metrics." },
        actions: [
          { id: "schedule", label: "Schedule the meeting with Corey", icon: CalendarDays },
          { id: "reports", label: "Open the Reports page", icon: BarChart3, href: "/reports" },
          { id: "intel", label: "Peek at Intelligence dashboards", icon: BarChart3, href: "/intelligence", optional: true },
        ] },
      { key: "w2.checkin.chad", title: "Weekly check-in with Chad", blurb: "30-minute alignment meeting.", icon: MessageSquare, estMinutes: 30, kind: "checkin",
        actions: [
          { id: "recurring", label: "Set a recurring weekly check-in on the calendar", icon: CalendarDays },
          { id: "agenda", label: "Bring an agenda each week (wins, blockers, asks)", icon: FileText },
        ] },
      { key: "w2.checkin.shira", title: "Daily check-ins with Shira", blurb: "Short daily touchpoints — questions, blockers, wins.", icon: MessageSquare, estMinutes: 75, kind: "checkin",
        actions: [
          { id: "recurring", label: "Set up a recurring daily 10-minute slot", icon: CalendarDays },
          { id: "save", label: "Save Shira's contact for quick pings", icon: Phone },
        ] },
    ],
    outcome: {
      title: "Week Two Outcome",
      bullets: [
        "Understand operational workflow",
        "See how marketing → intake → services connect",
        "Understand recruiting and tracking metrics",
        "Understand department relationships",
      ],
    },
  },
  {
    id: "w3",
    index: 3,
    weekLabel: "Week 3",
    title: "Role Application",
    objective: "Move from observing to doing — apply what you've learned in your role.",
    icon: Target,
    path: "/onboarding/week/3",
    modules: [
      // Path A — new state
      { key: "w3.ns.laws", title: "State laws & regulations", blurb: "Compliance landscape for your new market.", icon: ShieldCheck, estMinutes: 60, kind: "content", pathOnly: "new_state",
        actions: [
          { id: "research", label: "Research the state's ABA licensing rules", icon: BookOpen },
          { id: "summary", label: "Write a one-page compliance summary", icon: FileText },
          { id: "states", label: "Open the State dashboards", icon: MapPin, href: "/intelligence/states", optional: true },
        ] },
      { key: "w3.ns.cred", title: "Credentialing requirements", blurb: "What's needed to operate.", icon: ClipboardCheck, estMinutes: 60, kind: "content", pathOnly: "new_state",
        actions: [
          { id: "list", label: "List required credentials per role", icon: ListChecks },
          { id: "owner", label: "Identify the credentialing owner", icon: UserCheck },
        ] },
      { key: "w3.ns.bcba", title: "BCBA recruiting in market", blurb: "Build the clinical bench.", icon: Users, estMinutes: 90, kind: "content", pathOnly: "new_state",
        actions: [
          { id: "pipeline", label: "Open the Recruiting pipeline", icon: Users, href: "/recruiting" },
          { id: "outreach", label: "Draft a BCBA outreach plan", icon: FileText },
        ] },
      { key: "w3.ns.cred-init", title: "Credentialing initiation", blurb: "Kick off the credentialing engine.", icon: Briefcase, estMinutes: 60, kind: "content", pathOnly: "new_state",
        actions: [
          { id: "first", label: "Submit the first credentialing packet", icon: FileText },
          { id: "tracker", label: "Set up the credentialing tracker", icon: ClipboardCheck },
        ] },
      { key: "w3.ns.infra", title: "Infrastructure building", blurb: "Stand up the operational foundation.", icon: Building2, estMinutes: 90, kind: "content", pathOnly: "new_state",
        actions: [
          { id: "locations", label: "Open the Locations page", icon: Building, href: "/blossom/locations" },
          { id: "vendors", label: "List vendors needed (phones, internet, EHR)", icon: ListChecks },
        ] },
      { key: "w3.ns.launch", title: "State launch preparation", blurb: "Final readiness for go-live.", icon: Rocket, estMinutes: 60, kind: "content", pathOnly: "new_state",
        actions: [
          { id: "checklist", label: "Complete the pre-launch checklist", icon: ListChecks },
          { id: "review", label: "Get sign-off from Chad and Shira", icon: UserCheck },
        ] },
      // Path B — existing state
      { key: "w3.es.intake", title: "Work in Intake", blurb: "Hands-on with leads and onboarding.", icon: Briefcase, estMinutes: 240, kind: "content", pathOnly: "existing_state",
        actions: [
          { id: "leads", label: "Open the Leads page", icon: Briefcase, href: "/leads" },
          { id: "first", label: "Process your first lead end-to-end", icon: ClipboardCheck },
          { id: "dashboard", label: "Check the Intake dashboard", icon: BarChart3, href: "/intake-dashboard" },
        ] },
      { key: "w3.es.recruit", title: "Work in Recruiting", blurb: "Run candidate pipelines.", icon: Users, estMinutes: 180, kind: "content", pathOnly: "existing_state",
        actions: [
          { id: "open", label: "Open the Recruiting page", icon: Users, href: "/recruiting" },
          { id: "screen", label: "Screen at least 3 candidates", icon: ClipboardCheck },
        ] },
      { key: "w3.es.workflow", title: "Workflow management", blurb: "Own a workflow end-to-end.", icon: Workflow, estMinutes: 120, kind: "content", pathOnly: "existing_state",
        actions: [
          { id: "tasks", label: "Open the Tasks page", icon: ClipboardCheck, href: "/tasks" },
          { id: "own", label: "Own one workflow start-to-finish", icon: Workflow },
        ] },
      { key: "w3.es.coord", title: "Team coordination", blurb: "Coordinate across departments.", icon: MessageSquare, estMinutes: 120, kind: "content", pathOnly: "existing_state",
        actions: [
          { id: "team", label: "Open the Team page", icon: Users, href: "/team" },
          { id: "huddle", label: "Run a 15-minute cross-team huddle", icon: MessageSquare },
        ] },
    ],
    outcome: {
      title: "Week Three Outcome",
      bullets: [
        "Applied learning in your role context",
        "Owned at least one workflow end-to-end",
        "Built relationships across departments",
      ],
    },
  },
  {
    id: "w45",
    index: 4,
    weekLabel: "Weeks 4 & 5",
    title: "Transition to Ownership",
    objective: "Move from training to independent management.",
    icon: Trophy,
    path: "/onboarding/week/4-5",
    modules: [
      { key: "w45.intake", title: "Intake ownership", blurb: "Take ownership of intake outcomes.", icon: Briefcase, estMinutes: 240, kind: "content" },
      { key: "w45.recruit", title: "Recruiting ownership", blurb: "Drive the recruiting engine.", icon: Users, estMinutes: 240, kind: "content" },
      { key: "w45.coord", title: "Team coordination", blurb: "Lead cross-functional execution.", icon: MessageSquare, estMinutes: 120, kind: "content" },
      { key: "w45.kpi", title: "KPI tracking", blurb: "Own your scorecard.", icon: BarChart3, estMinutes: 60, kind: "content" },
      { key: "w45.perf", title: "Performance management", blurb: "Coach toward outcomes.", icon: Target, estMinutes: 60, kind: "content" },
      { key: "w45.acc", title: "Operational accountability", blurb: "How we hold the line on quality.", icon: ShieldCheck, estMinutes: 45, kind: "content" },
      { key: "w45.comm", title: "Leadership communication", blurb: "Brief up, align across, develop down.", icon: MessageSquare, estMinutes: 45, kind: "content" },
    ],
    outcome: {
      title: "Ownership Milestone",
      bullets: [
        "Operating independently in your role",
        "Owning your KPIs and scorecard",
        "Communicating clearly with leadership",
      ],
    },
  },
  {
    id: "graduation",
    index: 5,
    weekLabel: "Graduation",
    title: "Onboarding Complete",
    objective: "Celebrate, claim your certificate, and unlock the full Academy.",
    icon: Award,
    path: "/onboarding/graduation",
    modules: [
      { key: "grad.cert", title: "Claim your certificate", blurb: "Receive your Blossom Onboarding Certificate.", icon: Award, estMinutes: 5, kind: "content" },
    ],
  },
];

/** Returns modules for a phase, filtered by path. */
export function modulesForPath(phase: JourneyPhase, path: OnboardingPath): JourneyModule[] {
  return phase.modules.filter((m) => !m.pathOnly || m.pathOnly === path);
}

/** All required module keys across all phases for a given path (excludes graduation). */
export function requiredModuleKeys(path: OnboardingPath): string[] {
  return ONBOARDING_PHASES
    .filter((p) => p.id !== "graduation")
    .flatMap((p) => modulesForPath(p, path).map((m) => m.key));
}

export function getPhase(id: JourneyPhase["id"]): JourneyPhase | undefined {
  return ONBOARDING_PHASES.find((p) => p.id === id);
}

export function totalMinutes(path: OnboardingPath): number {
  return ONBOARDING_PHASES.flatMap((p) => modulesForPath(p, path)).reduce((s, m) => s + m.estMinutes, 0);
}