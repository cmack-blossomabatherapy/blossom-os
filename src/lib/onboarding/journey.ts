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
      { key: "p0.mission", title: "Mission & Vision", blurb: "Why we exist and where we're going.", icon: Heart, estMinutes: 5, kind: "content" },
      { key: "p0.values", title: "Core Values", blurb: "The four values that guide every decision.", icon: Compass, estMinutes: 6, kind: "content" },
      { key: "p0.team", title: "Meet the Team", blurb: "Who you'll work with at Blossom.", icon: Users, estMinutes: 5, kind: "content" },
      { key: "p0.how", title: "How Blossom Works", blurb: "How learning, training, and growth fit together.", icon: GraduationCap, estMinutes: 5, kind: "content" },
      { key: "p0.chad", title: "Welcome from Chad Kaufman", blurb: "Leadership expectations, oversight, and company vision.", icon: UserCheck, estMinutes: 4, kind: "leader",
        leader: { ...LEADERS.chad, message: "Welcome to Blossom. I'm thrilled you're joining us — our work matters, and you matter to it." } },
      { key: "p0.shira", title: "A note from Shira Lasry", blurb: "This onboarding journey was designed for you.", icon: UserCheck, estMinutes: 4, kind: "leader",
        leader: { ...LEADERS.shira, message: "This onboarding journey was designed to help you feel confident, supported, and fully prepared to succeed at Blossom." } },
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
      { key: "w1.team", title: "Team Introductions", blurb: "Meet key team members and learn roles & responsibilities.", icon: Users, estMinutes: 30, kind: "content" },
      { key: "w1.lead.chad", title: "Meet with Chad Kaufman", blurb: "Leadership expectations, operational oversight, company vision.", icon: UserCheck, estMinutes: 45, kind: "leader",
        leader: { ...LEADERS.chad, message: "Let's talk about what great looks like at Blossom and how we operate." } },
      { key: "w1.lead.shira", title: "Meet with Shira Lasry", blurb: "ABA background, company protocols, expectations, philosophy.", icon: UserCheck, estMinutes: 60, kind: "leader",
        leader: { ...LEADERS.shira, message: "We'll cover ABA fundamentals, our protocols, and how we think about quality care." } },
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
        system: { name: "CentralReach", videoLabel: "Watch CR walkthrough", sopLabel: "View CR SOP", tangoLabel: "Tango walkthrough" } },
      { key: "w1.sys.monday", title: "Monday.com", blurb: "Workflow and project management.", icon: MonitorPlay, estMinutes: 30, kind: "system",
        system: { name: "Monday.com", videoLabel: "Watch Monday training", sopLabel: "View Monday SOP" } },
      { key: "w1.sys.workflows", title: "Internal Workflows", blurb: "How handoffs, approvals, and escalations move.", icon: Workflow, estMinutes: 30, kind: "system",
        system: { name: "Internal Workflows", sopLabel: "View workflow SOPs" } },
      { key: "w1.sys.cr-backend", title: "CR Backend with Eli Berman", blurb: "Backend configuration & power-user training.", icon: Database, estMinutes: 60, kind: "leader",
        leader: { ...LEADERS.eli, message: "I'll walk you through the CR backend and how to make it work for the team." } },
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
      { key: "w2.intake", title: "Intake Department", blurb: "Lead intake flow, client onboarding, lead management.", icon: Briefcase, estMinutes: 60, kind: "department" },
      { key: "w2.recruiting", title: "Recruiting Department", blurb: "Hiring process, candidate pipeline, interviews.", icon: Users, estMinutes: 60, kind: "department" },
      { key: "w2.case", title: "Case Management", blurb: "Client coordination and internal communication.", icon: ClipboardCheck, estMinutes: 60, kind: "department" },
      { key: "w2.scheduling", title: "Scheduling — meet with Daylis", blurb: "Scheduling systems and challenges.", icon: CalendarDays, estMinutes: 45, kind: "leader",
        leader: { ...LEADERS.daylis, message: "Scheduling is the heartbeat — let me show you how we keep it healthy." } },
      { key: "w2.marketing", title: "Marketing — meet with Nick", blurb: "Lead generation and marketing strategies.", icon: Megaphone, estMinutes: 45, kind: "leader",
        leader: { ...LEADERS.nick, message: "Here's how leads find us, and how we think about growth." } },
      { key: "w2.tracking", title: "Tracking & Reporting — meet with Corey", blurb: "KPIs, reporting expectations, accountability.", icon: BarChart3, estMinutes: 45, kind: "leader",
        leader: { ...LEADERS.corey, message: "We measure what matters. Let's get you fluent in our metrics." } },
      { key: "w2.checkin.chad", title: "Weekly check-in with Chad", blurb: "30-minute alignment meeting.", icon: MessageSquare, estMinutes: 30, kind: "checkin" },
      { key: "w2.checkin.shira", title: "Daily check-ins with Shira", blurb: "Short daily touchpoints — questions, blockers, wins.", icon: MessageSquare, estMinutes: 75, kind: "checkin" },
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
      { key: "w3.ns.laws", title: "State laws & regulations", blurb: "Compliance landscape for your new market.", icon: ShieldCheck, estMinutes: 60, kind: "content", pathOnly: "new_state" },
      { key: "w3.ns.cred", title: "Credentialing requirements", blurb: "What's needed to operate.", icon: ClipboardCheck, estMinutes: 60, kind: "content", pathOnly: "new_state" },
      { key: "w3.ns.bcba", title: "BCBA recruiting in market", blurb: "Build the clinical bench.", icon: Users, estMinutes: 90, kind: "content", pathOnly: "new_state" },
      { key: "w3.ns.cred-init", title: "Credentialing initiation", blurb: "Kick off the credentialing engine.", icon: Briefcase, estMinutes: 60, kind: "content", pathOnly: "new_state" },
      { key: "w3.ns.infra", title: "Infrastructure building", blurb: "Stand up the operational foundation.", icon: Building2, estMinutes: 90, kind: "content", pathOnly: "new_state" },
      { key: "w3.ns.launch", title: "State launch preparation", blurb: "Final readiness for go-live.", icon: Rocket, estMinutes: 60, kind: "content", pathOnly: "new_state" },
      // Path B — existing state
      { key: "w3.es.intake", title: "Work in Intake", blurb: "Hands-on with leads and onboarding.", icon: Briefcase, estMinutes: 240, kind: "content", pathOnly: "existing_state" },
      { key: "w3.es.recruit", title: "Work in Recruiting", blurb: "Run candidate pipelines.", icon: Users, estMinutes: 180, kind: "content", pathOnly: "existing_state" },
      { key: "w3.es.workflow", title: "Workflow management", blurb: "Own a workflow end-to-end.", icon: Workflow, estMinutes: 120, kind: "content", pathOnly: "existing_state" },
      { key: "w3.es.coord", title: "Team coordination", blurb: "Coordinate across departments.", icon: MessageSquare, estMinutes: 120, kind: "content", pathOnly: "existing_state" },
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