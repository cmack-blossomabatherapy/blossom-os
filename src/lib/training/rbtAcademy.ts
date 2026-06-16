// RBT Training Academy — experience-based paths.
// Mock/static for now; structure is shaped so a backend can populate later.

export type RBTPathId =
  | "not_certified"
  | "certified_no_experience"
  | "certified_under_2yrs"
  | "certified_2yrs_plus";

export type ModuleStatus = "completed" | "in_progress" | "not_started" | "locked";
export type ModuleType =
  | "Overview"
  | "SOP"
  | "Video"
  | "Walkthrough"
  | "Checklist"
  | "Shadowing"
  | "Assessment";

export interface RBTModule {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  type: ModuleType;
  required?: boolean;
  status: ModuleStatus;
  progress?: number;
}

export interface RBTPhase {
  id: string;
  title: string;
  description: string;
  modules: RBTModule[];
}

export interface SignoffItem {
  id: string;
  label: string;
  owner: "Lead RBT Trainer" | "BCBA" | "Operations";
  required: boolean;
  status: "signed" | "pending" | "scheduled";
  signedBy?: string;
  signedOn?: string;
  note?: string;
}

export interface RBTPath {
  id: RBTPathId;
  label: string;
  tagline: string;
  estWeeks: string;
  audience: string;
  phases: RBTPhase[];
  signoffs: SignoffItem[];
}

// Shared "Welcome to Blossom for RBTs" phase — required at the start of every path.
const WELCOME_PHASE: RBTPhase = {
  id: "phase-welcome",
  title: "Phase 0 · Welcome to Blossom for RBTs",
  description:
    "Required for every RBT, every path. Meet the company, the people, and how we support families.",
  modules: [
    {
      id: "welcome-1",
      title: "Welcome to Blossom for RBTs",
      summary: "Mission, values, and what makes Blossom different.",
      minutes: 8,
      type: "Overview",
      required: true,
      status: "in_progress",
      progress: 40,
    },
    {
      id: "welcome-2",
      title: "Meet your team",
      summary: "Your Lead RBT Trainer, BCBA supervisor, and who to call when stuck.",
      minutes: 5,
      type: "Overview",
      required: true,
      status: "not_started",
    },
    {
      id: "welcome-3",
      title: "How Blossom OS works for RBTs",
      summary: "My Day, schedule, messages, and resources — the quick tour.",
      minutes: 6,
      type: "Walkthrough",
      required: true,
      status: "not_started",
    },
  ],
};

function phase(
  id: string,
  title: string,
  description: string,
  modules: Omit<RBTModule, "status">[],
  firstStatus: ModuleStatus = "not_started",
): RBTPhase {
  return {
    id,
    title,
    description,
    modules: modules.map((m, i) => ({
      ...m,
      status: i === 0 ? firstStatus : "locked",
    })),
  };
}

const FOUNDATIONS_MODULES: Omit<RBTModule, "status">[] = [
  { id: "f1", title: "RBT role & scope of practice", summary: "What an RBT does and where the line is.", minutes: 12, type: "SOP", required: true },
  { id: "f2", title: "Ethics & professional conduct", summary: "BACB ethics in plain language.", minutes: 10, type: "SOP", required: true },
  { id: "f3", title: "ABA fundamentals", summary: "Reinforcement, prompting, and data — the basics.", minutes: 18, type: "Video", required: true },
  { id: "f4", title: "Session-ready checklist", summary: "What to bring, set up, and confirm before a session.", minutes: 6, type: "Checklist", required: true },
];

const SESSION_MODULES: Omit<RBTModule, "status">[] = [
  { id: "s1", title: "Running a clean session", summary: "Arrival, structure, transitions, clean wrap-ups.", minutes: 14, type: "Walkthrough", required: true },
  { id: "s2", title: "Behavior support in the moment", summary: "De-escalation and supporting the client safely.", minutes: 12, type: "Video", required: true },
  { id: "s3", title: "Documentation expectations", summary: "Session notes, timeliness, and data integrity.", minutes: 9, type: "SOP", required: true },
  { id: "s4", title: "Parent & caregiver communication", summary: "Professional tone, what to share, what to escalate.", minutes: 8, type: "SOP", required: true },
];

const ADVANCED_MODULES: Omit<RBTModule, "status">[] = [
  { id: "a1", title: "Complex behavior protocols", summary: "Working with high-acuity protocols safely.", minutes: 16, type: "Video" },
  { id: "a2", title: "Mentoring newer RBTs", summary: "How to model the standard for newer teammates.", minutes: 10, type: "Overview" },
  { id: "a3", title: "Leading shadow sessions", summary: "How to host a shadow session for a new RBT.", minutes: 8, type: "Walkthrough" },
];

const FIELD_READY_MODULES: Omit<RBTModule, "status">[] = [
  { id: "fr1", title: "Shadow 2 BCBA-led sessions", summary: "Observe two sessions with your BCBA.", minutes: 60, type: "Shadowing", required: true },
  { id: "fr2", title: "Lead 1 supervised session", summary: "Lead a session with BCBA observation.", minutes: 60, type: "Shadowing", required: true },
  { id: "fr3", title: "Field-ready skills check", summary: "Lead RBT Trainer confirms field readiness.", minutes: 30, type: "Assessment", required: true },
];

const CERT_PREP_MODULES: Omit<RBTModule, "status">[] = [
  { id: "c1", title: "40-hour RBT training overview", summary: "How to complete your 40-hour requirement.", minutes: 30, type: "Overview", required: true },
  { id: "c2", title: "Competency assessment prep", summary: "What the BCBA will assess and how to prepare.", minutes: 20, type: "Video", required: true },
  { id: "c3", title: "Practice exam & study guide", summary: "Lightweight prep — not the real exam.", minutes: 45, type: "Checklist" },
];

// ----- Paths -----

export const RBT_PATHS: RBTPath[] = [
  {
    id: "not_certified",
    label: "Not Certified",
    tagline: "Build the foundation while you complete your 40-hour and exam.",
    estWeeks: "6–10 weeks",
    audience: "New hires pursuing RBT certification.",
    phases: [
      WELCOME_PHASE,
      phase(
        "nc-cert",
        "Phase 1 · Certification path",
        "Complete the 40-hour requirement and prepare for the RBT competency assessment.",
        CERT_PREP_MODULES,
      ),
      phase(
        "nc-foundations",
        "Phase 2 · Foundations",
        "ABA basics so you arrive to your first session confident.",
        FOUNDATIONS_MODULES,
      ),
      phase(
        "nc-field",
        "Phase 3 · Field readiness",
        "Shadow and lead supervised sessions before independent assignment.",
        FIELD_READY_MODULES,
      ),
    ],
    signoffs: [
      { id: "so-1", label: "Welcome to Blossom complete", owner: "Operations", required: true, status: "pending" },
      { id: "so-2", label: "40-hour RBT training complete", owner: "Operations", required: true, status: "pending" },
      { id: "so-3", label: "BCBA competency assessment passed", owner: "BCBA", required: true, status: "pending" },
      { id: "so-4", label: "Lead RBT Trainer field-ready signoff", owner: "Lead RBT Trainer", required: true, status: "pending" },
    ],
  },
  {
    id: "certified_no_experience",
    label: "Certified, no experience",
    tagline: "You have your RBT — now learn how Blossom runs sessions.",
    estWeeks: "3–5 weeks",
    audience: "Newly certified RBTs starting their first role.",
    phases: [
      WELCOME_PHASE,
      phase("ne-foundations", "Phase 1 · Foundations at Blossom", "How Blossom applies ABA day-to-day.", FOUNDATIONS_MODULES),
      phase("ne-session", "Phase 2 · Running sessions", "From first hello to a clean wrap-up.", SESSION_MODULES),
      phase("ne-field", "Phase 3 · Field readiness", "Shadow and lead supervised sessions before independent assignment.", FIELD_READY_MODULES),
    ],
    signoffs: [
      { id: "so-1", label: "Welcome to Blossom complete", owner: "Operations", required: true, status: "pending" },
      { id: "so-2", label: "Foundations check-in with Lead RBT Trainer", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-3", label: "2 BCBA-led shadow sessions complete", owner: "BCBA", required: true, status: "pending" },
      { id: "so-4", label: "Lead RBT Trainer field-ready signoff", owner: "Lead RBT Trainer", required: true, status: "pending" },
    ],
  },
  {
    id: "certified_under_2yrs",
    label: "Certified, under 2 years",
    tagline: "Calibrate to the Blossom standard and pick up advanced skills.",
    estWeeks: "2–3 weeks",
    audience: "RBTs with some field experience joining Blossom.",
    phases: [
      WELCOME_PHASE,
      phase("u2-calibrate", "Phase 1 · Calibrate", "Where Blossom's standard differs from where you've worked.", SESSION_MODULES),
      phase("u2-advanced", "Phase 2 · Advanced skills", "Step up to harder cases and protocols.", ADVANCED_MODULES),
      phase("u2-field", "Phase 3 · Field readiness", "One supervised session before independent assignment.", [
        FIELD_READY_MODULES[1],
        FIELD_READY_MODULES[2],
      ]),
    ],
    signoffs: [
      { id: "so-1", label: "Welcome to Blossom complete", owner: "Operations", required: true, status: "pending" },
      { id: "so-2", label: "Calibration session with Lead RBT Trainer", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-3", label: "1 BCBA supervised session complete", owner: "BCBA", required: true, status: "pending" },
      { id: "so-4", label: "Lead RBT Trainer field-ready signoff", owner: "Lead RBT Trainer", required: true, status: "pending" },
    ],
  },
  {
    id: "certified_2yrs_plus",
    label: "Certified, 2+ years",
    tagline: "Fast-track onboarding plus a path to mentor newer RBTs.",
    estWeeks: "1–2 weeks",
    audience: "Experienced RBTs joining Blossom.",
    phases: [
      WELCOME_PHASE,
      phase("ex-calibrate", "Phase 1 · Calibrate to Blossom", "Quick alignment on session standards and documentation.", [
        SESSION_MODULES[0],
        SESSION_MODULES[2],
        SESSION_MODULES[3],
      ]),
      phase("ex-advanced", "Phase 2 · Advanced & mentoring", "Pick up complex protocols and how we mentor newer RBTs.", ADVANCED_MODULES),
      phase("ex-field", "Phase 3 · Field readiness", "One supervised session before independent assignment.", [
        FIELD_READY_MODULES[1],
        FIELD_READY_MODULES[2],
      ]),
    ],
    signoffs: [
      { id: "so-1", label: "Welcome to Blossom complete", owner: "Operations", required: true, status: "pending" },
      { id: "so-2", label: "Calibration session with Lead RBT Trainer", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-3", label: "1 BCBA supervised session complete", owner: "BCBA", required: true, status: "pending" },
      { id: "so-4", label: "Lead RBT Trainer field-ready signoff", owner: "Lead RBT Trainer", required: true, status: "pending" },
    ],
  },
];

export const RBT_OWNERSHIP = {
  leadTrainer: { name: "Lead RBT Trainer", placeholder: "Unassigned", role: "Owns field readiness & signoffs" },
  bcba: { name: "BCBA Supervisor", placeholder: "Unassigned", role: "Owns clinical supervision & competency" },
};

export const RBT_RESOURCES = [
  { id: "r1", title: "Session-ready checklist", type: "Checklist" },
  { id: "r2", title: "Parent communication script", type: "SOP" },
  { id: "r3", title: "Safety & escalation flow", type: "SOP" },
  { id: "r4", title: "Blossom OS quick tour", type: "Video" },
  { id: "r5", title: "Data collection cheat sheet", type: "Quick Guide" },
  { id: "r6", title: "What to do if a session is cancelled", type: "SOP" },
];

export function pathStats(path: RBTPath) {
  const all = path.phases.flatMap((p) => p.modules);
  const required = all.filter((m) => m.required);
  const requiredDone = required.filter((m) => m.status === "completed").length;
  const completed = all.filter((m) => m.status === "completed").length;
  const readiness = required.length === 0 ? 0 : Math.round((requiredDone / required.length) * 100);
  const progress = all.length === 0 ? 0 : Math.round((completed / all.length) * 100);
  const requiredSignoffs = path.signoffs.filter((s) => s.required);
  const signedCount = requiredSignoffs.filter((s) => s.status === "signed").length;
  const fieldReady = readiness === 100 && signedCount === requiredSignoffs.length;
  const nextModule =
    all.find((m) => m.status === "in_progress") ??
    all.find((m) => m.status === "not_started" && m.required) ??
    all.find((m) => m.status === "not_started");
  return {
    progress,
    readiness,
    completed,
    total: all.length,
    requiredDone,
    requiredTotal: required.length,
    signedCount,
    signoffTotal: requiredSignoffs.length,
    fieldReady,
    nextModule,
  };
}