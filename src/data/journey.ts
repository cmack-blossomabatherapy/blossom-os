import type { LucideIcon } from "lucide-react";
import {
  GraduationCap, ClipboardCheck, Award, BookOpen, Eye, ShieldCheck,
  Users, Briefcase, Sparkles, Stethoscope, Settings2, UserCheck,
} from "lucide-react";

export type StepStatus = "completed" | "in_progress" | "locked" | "available";
export type JourneyRole = "rbt-uncertified" | "rbt-certified" | "bcba";

export interface JourneyStep {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
  ownerName: string;
  ownerRole: string;
  checklist: string[];
  estMinutes: number;
  /** Optional helpful links shown in the current stage panel. */
  links?: { label: string; url: string; description?: string }[];
  /** Optional training coordinator contact for this stage. */
  coordinatorName?: string;
  coordinatorEmail?: string;
  coordinatorRole?: string;
  /** Optional richer "more information" body shown below the description. */
  moreInfo?: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  assignedBy: string;
  estMinutes: number;
  category: "Compliance" | "Clinical" | "Operations" | "Methodology";
  stepId?: string; // links to a lifecycle step
}

export interface JourneyResource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: "Drive" | "BACB" | "Guide" | "Examples" | "System";
  icon: LucideIcon;
  /** If set, opens internally at this in-app route instead of the external url. */
  internalRoute?: string;
}

export interface MatchingInfo {
  staffingOwner: string;
  caseManagerOptions: string[];
  assignedCaseManager?: string;
  assignedBcba?: string;
  caregiverFamily?: string;
  startDate?: string; // ISO date
  prepChecklist: { id: string; label: string; done: boolean }[];
}

export interface JourneyData {
  viewerName: string;
  role: JourneyRole;
  roleLabel: string;
  steps: JourneyStep[];
  /** Index of step the user is currently on. Steps before are completed by default. */
  currentStepIndex: number;
  modules: TrainingModule[];
  resources: JourneyResource[];
  matching?: MatchingInfo;
  notifications: { id: string; tone: "info" | "warning" | "success"; title: string; detail: string }[];
}

/* ------------------------------------------------------------------ */
/*  Lifecycle definitions                                              */
/* ------------------------------------------------------------------ */

const RBT_UNCERTIFIED_STEPS: JourneyStep[] = [
  {
    id: "rbt40",
    label: "40 Hour RBT Course",
    shortLabel: "40 Hour Course",
    icon: BookOpen,
    description: "Complete the BACB-required 40 hour RBT training. Self-paced video modules with knowledge checks at the end of each unit.",
    ownerName: "Rebecca Bailey",
    ownerRole: "Training Owner",
    checklist: [
      "Watch all 40 hours of video content",
      "Pass knowledge checks for each module",
      "Submit completion certificate to Rebecca",
    ],
    estMinutes: 2400,
  },
  {
    id: "orientation",
    label: "Orientation",
    shortLabel: "Orientation",
    icon: Sparkles,
    description: "Live orientation session with Rebecca Bailey covering Blossom culture, expectations, scheduling, and the parent experience.",
    ownerName: "Rebecca Bailey",
    ownerRole: "Training Owner",
    checklist: [
      "Attend live orientation session",
      "Sign Blossom code of conduct",
      "Complete intro to CentralReach",
    ],
    estMinutes: 120,
  },
  {
    id: "competency",
    label: "Competency Assessment",
    shortLabel: "Competency",
    icon: ClipboardCheck,
    description: "Demonstrate the BACB Competency Assessment tasks with a qualified BCBA observer.",
    ownerName: "Rebecca Bailey",
    ownerRole: "Training Owner",
    checklist: [
      "Schedule assessment with assigned BCBA",
      "Complete all 20 task list items",
      "Submit signed competency form",
    ],
    estMinutes: 180,
  },
  {
    id: "exam",
    label: "RBT Exam",
    shortLabel: "RBT Exam",
    icon: Award,
    description: "Pass the official BACB Registered Behavior Technician exam through Pearson VUE.",
    ownerName: "BACB",
    ownerRole: "Certification Body",
    checklist: [
      "Apply for the RBT exam",
      "Schedule with Pearson VUE",
      "Pass and upload certificate",
    ],
    estMinutes: 120,
  },
  {
    id: "core",
    label: "Core Trainings",
    shortLabel: "Core Training",
    icon: GraduationCap,
    description: "Complete the three core Blossom trainings: Ethics, Session Notes, and Methodology.",
    ownerName: "Rebecca Bailey",
    ownerRole: "Training Owner",
    checklist: [
      "Complete Ethics training",
      "Complete Session Notes training",
      "Complete Methodology training",
    ],
    estMinutes: 240,
  },
  {
    id: "ready",
    label: "Ready for Matching",
    shortLabel: "Ready",
    icon: UserCheck,
    description: "All training is complete. You're now in the staffing queue to be matched with a client.",
    ownerName: "Sarah Uhr",
    ownerRole: "Staffing Lead",
    checklist: [
      "Confirm availability with Staffing",
      "Review client preferences",
      "Wait for case assignment",
    ],
    estMinutes: 30,
  },
  {
    id: "assigned",
    label: "Assigned to Case",
    shortLabel: "Case Assigned",
    icon: Briefcase,
    description: "You've been matched! Get connected with the BCBA, caregiver, and prep for your first session.",
    ownerName: "Case Manager",
    ownerRole: "Operations",
    checklist: [
      "Meet your BCBA",
      "Introduction call with caregiver",
      "Confirm first session date",
      "Review treatment plan",
    ],
    estMinutes: 90,
  },
  {
    id: "active",
    label: "Active RBT",
    shortLabel: "Active",
    icon: ShieldCheck,
    description: "You're delivering sessions. Keep up with notes, monthly check-ins, and continuing education.",
    ownerName: "Your BCBA",
    ownerRole: "Clinical",
    checklist: [
      "Submit session notes within 24 hours",
      "Complete monthly check-in",
      "Stay current on CEUs",
    ],
    estMinutes: 0,
  },
];

const RBT_CERTIFIED_STEPS: JourneyStep[] = [
  RBT_UNCERTIFIED_STEPS[1], // Orientation
  {
    id: "shadow",
    label: "Shadow / Session Notes Training",
    shortLabel: "Shadowing",
    icon: Eye,
    description: "Shadow an experienced RBT and learn the Blossom session note format.",
    ownerName: "Lead RBT",
    ownerRole: "Mentor",
    checklist: [
      "Complete 3 shadow sessions",
      "Submit a practice session note",
      "Review with Lead RBT",
    ],
    estMinutes: 360,
  },
  {
    id: "leadeval",
    label: "Lead RBT Evaluation",
    shortLabel: "Evaluation",
    icon: ClipboardCheck,
    description: "Final evaluation by your assigned Lead RBT before being added to the matching pool.",
    ownerName: "Lead RBT",
    ownerRole: "Mentor",
    checklist: [
      "Schedule evaluation",
      "Pass observation",
      "Receive sign-off",
    ],
    estMinutes: 120,
  },
  RBT_UNCERTIFIED_STEPS[5], // Ready
  RBT_UNCERTIFIED_STEPS[6], // Assigned
  RBT_UNCERTIFIED_STEPS[7], // Active
];

const BCBA_STEPS: JourneyStep[] = [
  {
    id: "orientation",
    label: "Orientation",
    shortLabel: "Orientation",
    icon: Sparkles,
    description: "Welcome to Blossom. Meet leadership, understand our model, and tour the operating system.",
    ownerName: "Rebecca Bailey",
    ownerRole: "Training Owner",
    checklist: [
      "Attend BCBA welcome session",
      "Sign clinical agreement",
      "Tour Blossom OS",
    ],
    estMinutes: 90,
  },
  {
    id: "system",
    label: "System Training",
    shortLabel: "Systems",
    icon: Settings2,
    description: "Hands-on training in CentralReach, documentation workflows, and authorization processes.",
    ownerName: "Rebecca Bailey",
    ownerRole: "Training Owner",
    checklist: [
      "Complete CentralReach module",
      "Practice treatment plan upload",
      "Run a mock auth submission",
    ],
    estMinutes: 240,
  },
  {
    id: "clinical",
    label: "Clinical Standards",
    shortLabel: "Clinical",
    icon: Stethoscope,
    description: "Review Blossom clinical standards, supervision expectations, and QA cadence.",
    ownerName: "Clinical Director",
    ownerRole: "Clinical Leadership",
    checklist: [
      "Review Blossom clinical handbook",
      "Pass standards quiz",
      "Schedule first supervision",
    ],
    estMinutes: 180,
  },
  {
    id: "case",
    label: "Case Assignment",
    shortLabel: "Case",
    icon: Briefcase,
    description: "Get assigned your first caseload and meet the RBTs you'll supervise.",
    ownerName: "Operations",
    ownerRole: "Ops Leadership",
    checklist: [
      "Receive caseload",
      "Meet assigned RBTs",
      "Complete intake review",
    ],
    estMinutes: 120,
  },
  {
    id: "active",
    label: "Active BCBA",
    shortLabel: "Active",
    icon: ShieldCheck,
    description: "You're now actively supervising cases. Keep up with QA, supervision hours, and treatment plans.",
    ownerName: "Clinical Director",
    ownerRole: "Clinical Leadership",
    checklist: [
      "Maintain supervision logs",
      "Submit QA reviews",
      "Stay current on CEUs",
    ],
    estMinutes: 0,
  },
];

const STEPS_BY_ROLE: Record<JourneyRole, JourneyStep[]> = {
  "rbt-uncertified": RBT_UNCERTIFIED_STEPS,
  "rbt-certified": RBT_CERTIFIED_STEPS,
  "bcba": BCBA_STEPS,
};

/* ------------------------------------------------------------------ */
/*  Resources                                                          */
/* ------------------------------------------------------------------ */

const RBT_RESOURCES: JourneyResource[] = [
  {
    id: "drive", title: "RBT Resource Hub",
    description: "Curated Google Drive with all RBT training materials, forms, and guides.",
    url: "https://drive.google.com/", category: "Drive", icon: BookOpen,
  },
  {
    id: "bacb", title: "BACB Certification Info",
    description: "Official BACB website for RBT certification, ethics code, and renewal.",
    url: "https://www.bacb.com/rbt/", category: "BACB", icon: Award,
  },
  {
    id: "competency", title: "Competency Assessment Guide",
    description: "Walkthrough of all 20 BACB competency tasks with examples.",
    url: "https://www.bacb.com/wp-content/uploads/2022/01/RBT-Handbook.pdf", category: "Guide", icon: ClipboardCheck,
  },
  {
    id: "notes", title: "Session Note Examples",
    description: "Real (anonymized) session notes that meet Blossom QA standards.",
    url: "https://drive.google.com/", category: "Examples", icon: BookOpen,
  },
];

const BCBA_RESOURCES: JourneyResource[] = [
  {
    id: "cr", title: "CentralReach Playbook",
    description: "Step-by-step CentralReach workflows for treatment plans and authorizations.",
    url: "https://centralreach.com/", category: "System", icon: Settings2,
  },
  {
    id: "bacb", title: "BACB BCBA Resources",
    description: "BACB ethics, supervision standards, and continuing education.",
    url: "https://www.bacb.com/bcba/", category: "BACB", icon: Award,
  },
  {
    id: "clinical", title: "Blossom Clinical Handbook",
    description: "Internal clinical standards, supervision cadence, and QA criteria.",
    url: "https://drive.google.com/", category: "Guide", icon: Stethoscope,
  },
  {
    id: "examples", title: "Treatment Plan Examples",
    description: "Reference treatment plans across age groups and goal areas.",
    url: "https://drive.google.com/", category: "Examples", icon: BookOpen,
  },
];

/* ------------------------------------------------------------------ */
/*  Demo personas                                                      */
/* ------------------------------------------------------------------ */

const DEMO: Record<string, JourneyData> = {
  "rbt-uncertified": {
    viewerName: "Maya Cohen",
    role: "rbt-uncertified",
    roleLabel: "RBT in Training",
    steps: RBT_UNCERTIFIED_STEPS,
    currentStepIndex: 0,
    modules: rbtModules("rbt40"),
    resources: RBT_RESOURCES,
    notifications: [
      { id: "n1", tone: "info", title: "Keep going on the 40 Hour Course", detail: "You're 50% through. Aim to finish this week." },
      { id: "n2", tone: "warning", title: "Competency assessment not scheduled", detail: "Reach out to Rebecca to book once you finish the course." },
    ],
  },
  "rbt-certified": {
    viewerName: "Jordan Reed",
    role: "rbt-certified",
    roleLabel: "Certified RBT (Onboarding)",
    steps: RBT_CERTIFIED_STEPS,
    currentStepIndex: 1, // shadowing
    modules: rbtModules("shadow"),
    resources: RBT_RESOURCES,
    notifications: [
      { id: "n1", tone: "info", title: "Two more shadow sessions to go", detail: "Submit your practice note after session 3." },
    ],
  },
  "rbt-ready": {
    viewerName: "Priya Patel",
    role: "rbt-certified",
    roleLabel: "Certified RBT (Ready)",
    steps: RBT_CERTIFIED_STEPS,
    currentStepIndex: 3, // Ready
    modules: rbtModules("ready"),
    resources: RBT_RESOURCES,
    matching: {
      staffingOwner: "Sarah Uhr",
      caseManagerOptions: ["Rachel Greenspan", "Ahuva Florens", "Nicky Newman"],
      prepChecklist: [
        { id: "p1", label: "Update availability in CentralReach", done: true },
        { id: "p2", label: "Confirm preferred clinics", done: true },
        { id: "p3", label: "Wait for case manager intro", done: false },
      ],
    },
    notifications: [
      { id: "n1", tone: "success", title: "You're in the matching queue", detail: "Sarah Uhr will reach out within 3 business days." },
    ],
  },
  "rbt-active": {
    viewerName: "Devon Banks",
    role: "rbt-certified",
    roleLabel: "Active RBT",
    steps: RBT_CERTIFIED_STEPS,
    currentStepIndex: 5, // Active
    modules: rbtModules("active"),
    resources: RBT_RESOURCES,
    matching: {
      staffingOwner: "Sarah Uhr",
      caseManagerOptions: ["Rachel Greenspan", "Ahuva Florens", "Nicky Newman"],
      assignedCaseManager: "Rachel Greenspan",
      assignedBcba: "Dr. Alex Stone",
      caregiverFamily: "The Lopez Family",
      startDate: "2026-05-04",
      prepChecklist: [
        { id: "p1", label: "Meet your BCBA", done: true },
        { id: "p2", label: "Caregiver intro call", done: true },
        { id: "p3", label: "Review treatment plan", done: true },
        { id: "p4", label: "First session prep", done: false },
      ],
    },
    notifications: [
      { id: "n1", tone: "success", title: "Case assigned: Lopez Family", detail: "Start date Mon May 4. Treatment plan ready in CR." },
      { id: "n2", tone: "info", title: "Submit your first session note within 24h", detail: "Use the Blossom note template." },
    ],
  },
  "bcba": {
    viewerName: "Dr. Alex Stone",
    role: "bcba",
    roleLabel: "BCBA (Onboarding)",
    steps: BCBA_STEPS,
    currentStepIndex: 1, // System
    modules: bcbaModules(),
    resources: BCBA_RESOURCES,
    notifications: [
      { id: "n1", tone: "info", title: "Finish CentralReach module this week", detail: "Required before your first case assignment." },
    ],
  },
};

function rbtModules(stage: string): TrainingModule[] {
  return [
    {
      id: "ethics", title: "Ethics Training",
      description: "BACB ethics code applied to day-to-day RBT decisions and edge cases.",
      assignedBy: "Rebecca Bailey", estMinutes: 60, category: "Compliance", stepId: "core",
    },
    {
      id: "notes", title: "Session Note Training",
      description: "Write clean, billable session notes that pass Blossom QA on the first try.",
      assignedBy: "Rebecca Bailey", estMinutes: 75, category: "Operations", stepId: "core",
    },
    {
      id: "method", title: "Methodology Training",
      description: "Core ABA methodology refresher: DTT, NET, prompting, and reinforcement.",
      assignedBy: "Rebecca Bailey", estMinutes: 90, category: "Methodology", stepId: "core",
    },
    {
      id: "shadow", title: "Shadowing / Observation",
      description: "Structured shadowing with a Lead RBT before working independently.",
      assignedBy: "Lead RBT", estMinutes: 360, category: "Clinical", stepId: "shadow",
    },
  ];
}

function bcbaModules(): TrainingModule[] {
  return [
    { id: "cr", title: "CentralReach Deep Dive", description: "Treatment plans, auths, and progress reports inside CR.", assignedBy: "Rebecca Bailey", estMinutes: 120, category: "Operations", stepId: "system" },
    { id: "ethics", title: "Clinical Ethics", description: "BACB ethics for BCBAs with case studies.", assignedBy: "Clinical Director", estMinutes: 90, category: "Compliance", stepId: "clinical" },
    { id: "supervision", title: "Supervision Standards", description: "How Blossom runs supervision and QA cadence.", assignedBy: "Clinical Director", estMinutes: 60, category: "Clinical", stepId: "clinical" },
    { id: "intake", title: "Intake & Assessment", description: "Onboarding new clients and writing the first treatment plan.", assignedBy: "Operations", estMinutes: 75, category: "Clinical", stepId: "case" },
  ];
}

/* ------------------------------------------------------------------ */
/*  Viewer resolver                                                    */
/* ------------------------------------------------------------------ */

export type DemoKey = keyof typeof DEMO;

export const DEMO_OPTIONS: { key: DemoKey; label: string }[] = [
  { key: "rbt-uncertified", label: "RBT — In Training" },
  { key: "rbt-certified", label: "RBT — Certified, Onboarding" },
  { key: "rbt-ready", label: "RBT — Ready for Matching" },
  { key: "rbt-active", label: "RBT — Active" },
  { key: "bcba", label: "BCBA — Onboarding" },
];

export function resolveJourney(opts: {
  override?: string | null;
  jobTitle?: string | null;
  displayName?: string | null;
}): { data: JourneyData; key: DemoKey } {
  const override = (opts.override ?? "").toLowerCase();
  if (override && override in DEMO) {
    return { data: DEMO[override as DemoKey], key: override as DemoKey };
  }
  const title = (opts.jobTitle ?? "").toLowerCase();
  let key: DemoKey = "rbt-uncertified";
  if (title.includes("bcba") || title.includes("board certified")) key = "bcba";
  else if (title.includes("rbt") || title.includes("registered behavior")) key = "rbt-certified";
  const data = { ...DEMO[key] };
  if (opts.displayName) data.viewerName = opts.displayName;
  return { data, key };
}

export function isJourneyEligible(jobTitle?: string | null): boolean {
  const t = (jobTitle ?? "").toLowerCase();
  return t.includes("rbt") || t.includes("registered behavior") || t.includes("bcba") || t.includes("board certified");
}

/* ------------------------------------------------------------------ */
/*  Local progress overrides                                           */
/* ------------------------------------------------------------------ */

export interface JourneyProgress {
  /** step id -> completed */
  steps: Record<string, boolean>;
  /** module id -> completed */
  modules: Record<string, boolean>;
}

export function loadProgress(userKey: string): JourneyProgress {
  if (typeof window === "undefined") return { steps: {}, modules: {} };
  try {
    const raw = localStorage.getItem(`blossom.journey.${userKey}`);
    if (!raw) return { steps: {}, modules: {} };
    const parsed = JSON.parse(raw);
    return { steps: parsed.steps ?? {}, modules: parsed.modules ?? {} };
  } catch {
    return { steps: {}, modules: {} };
  }
}

export function saveProgress(userKey: string, p: JourneyProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`blossom.journey.${userKey}`, JSON.stringify(p));
}

export function computeStepStatuses(
  data: JourneyData,
  progress: JourneyProgress,
): { statuses: StepStatus[]; effectiveCurrentIndex: number; percent: number } {
  const baseIndex = data.currentStepIndex;
  const steps = data.steps;
  // A step is completed if (its index < baseIndex) OR override completed.
  const completedFlags = steps.map((s, i) => (i < baseIndex) || !!progress.steps[s.id]);
  // Effective current index = first index that is NOT completed.
  let current = completedFlags.findIndex((c) => !c);
  if (current === -1) current = steps.length - 1;
  const statuses: StepStatus[] = steps.map((_, i) => {
    if (completedFlags[i]) return "completed";
    if (i === current) return "in_progress";
    if (i === current + 1) return "available";
    return "locked";
  });
  const completedCount = completedFlags.filter(Boolean).length;
  const percent = Math.round((completedCount / steps.length) * 100);
  return { statuses, effectiveCurrentIndex: current, percent };
}

export { STEPS_BY_ROLE };
