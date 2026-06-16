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
  | "Assessment"
  | "Role Play"
  | "Evaluation"
  | "Signoff";

export interface RBTModule {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  type: ModuleType;
  required?: boolean;
  status: ModuleStatus;
  progress?: number;
  branching?: {
    /** When this module finishes, optionally route to gap modules based on result. */
    note: string;
    branches: { condition: string; assigns: string[] }[];
  };
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

// ----- Paths -----

export const RBT_PATHS: RBTPath[] = [
  {
    id: "not_certified",
    label: "Not Certified",
    tagline: "Full Blossom journey from day one through BCBA final readiness.",
    estWeeks: "8–12 weeks",
    audience: "New hires without RBT certification.",
    phases: [
      WELCOME_PHASE,
      phase("nc-classroom", "Phase 2 · Classroom and Role Play Training",
        "Learn the RBT role, ABA principles, and practice core clinical skills through role play.", [
        { id: "nc-c1", title: "RBT Role, Scope, and Ethics", summary: "What an RBT does, the limits of scope, and BACB ethics in plain language.", minutes: 20, type: "SOP", required: true },
        { id: "nc-c2", title: "ABA Explained", summary: "Plain-language intro to Applied Behavior Analysis for new RBTs.", minutes: 25, type: "Video", required: true },
        { id: "nc-c3", title: "ABA Principles and Foundations", summary: "Reinforcement, prompting, fading, and measurement basics.", minutes: 30, type: "Video", required: true },
        { id: "nc-c4", title: "Clinical Skills Role Play", summary: "Practice DTT, NET, prompting, and reinforcement with your Lead RBT Trainer.", minutes: 60, type: "Role Play", required: true },
      ]),
      phase("nc-competency", "Phase 3 · Client-Based Competency Training",
        "Prepare for and complete the client-based competency assessment.", [
        { id: "nc-cp1", title: "Competency Preparation", summary: "Review the BCBA-led competency checklist and what to expect.", minutes: 20, type: "Checklist", required: true },
        { id: "nc-cp2", title: "Client-Based Competency Session", summary: "Run the BACB competency assessment with a client and your BCBA.", minutes: 90, type: "Assessment", required: true },
      ]),
      phase("nc-knowledge", "Phase 4 · Knowledge Assessment",
        "Confirm core knowledge before stepping into shadowing.", [
        { id: "nc-k1", title: "Data Collection", summary: "How Blossom captures frequency, duration, ABC, and trial-by-trial data.", minutes: 18, type: "SOP", required: true },
        { id: "nc-k2", title: "Session Notes Documentation", summary: "Writing complete, billable, audit-ready session notes.", minutes: 18, type: "SOP", required: true },
        { id: "nc-k3", title: "Assistance Test", summary: "Knowledge check covering ethics, data, and documentation.", minutes: 30, type: "Assessment", required: true },
      ]),
      phase("nc-shadow", "Phase 5 · Shadowing and Documentation Review",
        "Observe a Lead RBT and get feedback on your written documentation.", [
        { id: "nc-s1", title: "Lead RBT Shadow Session", summary: "Shadow a full session led by a Lead RBT and debrief.", minutes: 90, type: "Shadowing", required: true },
        { id: "nc-s2", title: "Mock Session Note Review", summary: "Submit a mock session note for Lead RBT review and feedback.", minutes: 30, type: "Assessment", required: true },
      ]),
      phase("nc-full", "Phase 6 · Full Session Participation",
        "Run a full session alongside your Lead RBT before independent assignment.", [
        { id: "nc-fs1", title: "Full Session With Lead RBT", summary: "Lead the session with your Lead RBT observing and coaching in the moment.", minutes: 90, type: "Shadowing", required: true },
      ]),
      phase("nc-bcba", "Phase 7 · BCBA Oversight and Final Readiness",
        "Final BCBA observation and signoff before independent assignment.", [
        { id: "nc-b1", title: "BCBA Oversight and Final Readiness", summary: "BCBA observes a full session and signs off on field readiness.", minutes: 90, type: "Signoff", required: true },
      ]),
    ],
    signoffs: [
      { id: "so-1", label: "Welcome to Blossom complete", owner: "Operations", required: true, status: "pending" },
      { id: "so-2", label: "Clinical Skills Role Play passed", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-3", label: "Client-Based Competency Assessment passed", owner: "BCBA", required: true, status: "pending" },
      { id: "so-4", label: "Assistance Test passed", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-5", label: "Mock Session Note approved", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-6", label: "Full Session With Lead RBT signoff", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-7", label: "BCBA Final Readiness signoff", owner: "BCBA", required: true, status: "pending" },
    ],
  },
  {
    id: "certified_no_experience",
    label: "Certified, no experience",
    tagline: "Bridge from certification into real Blossom field practice.",
    estWeeks: "3–5 weeks",
    audience: "Newly certified RBTs starting their first field role.",
    phases: [
      WELCOME_PHASE,
      phase("ne-standards", "Phase 1 · Professionalism and Field Standards",
        "How Blossom RBTs show up — dress, communication, punctuality, boundaries.", [
        { id: "ne-p1", title: "Professionalism and Field Standards", summary: "Blossom's expectations in the home and clinic.", minutes: 15, type: "SOP", required: true },
      ]),
      phase("ne-aba", "Phase 2 · ABA Explained Refresher",
        "Quick refresher to align your ABA vocabulary to Blossom.", [
        { id: "ne-a1", title: "ABA Explained Refresher", summary: "Reinforcement, prompting, and measurement — Blossom's way.", minutes: 20, type: "Video", required: true },
      ]),
      phase("ne-flow", "Phase 3 · Session Flow and Field Expectations",
        "What a Blossom session looks like start to finish.", [
        { id: "ne-f1", title: "Session Flow and Field Expectations", summary: "Arrival, pairing, programming, transitions, wrap-up.", minutes: 20, type: "Walkthrough", required: true },
      ]),
      phase("ne-data", "Phase 4 · Data and Session Note Bridge",
        "Learn the Blossom-specific data and documentation standards.", [
        { id: "ne-d1", title: "Data and Session Note Bridge", summary: "How Blossom collects data and writes session notes day-to-day.", minutes: 25, type: "SOP", required: true },
      ]),
      phase("ne-role", "Phase 5 · Lead RBT Role Play",
        "Practice core programs in a safe environment with a Lead RBT.", [
        { id: "ne-r1", title: "Lead RBT Role Play", summary: "Run mock trials with Lead RBT feedback before client contact.", minutes: 60, type: "Role Play", required: true },
      ]),
      phase("ne-shadow", "Phase 6 · Shadow and Reflection",
        "Observe a Lead RBT session and reflect on what you saw.", [
        { id: "ne-s1", title: "Shadow and Reflection", summary: "Shadow a Lead RBT session, then submit a guided reflection.", minutes: 90, type: "Shadowing", required: true },
      ]),
      phase("ne-full", "Phase 7 · Full Session With Lead RBT",
        "Run the session with the Lead RBT observing and coaching.", [
        { id: "ne-fs1", title: "Full Session With Lead RBT", summary: "Lead the session — Lead RBT signs off when ready.", minutes: 90, type: "Shadowing", required: true },
      ]),
      phase("ne-bcba", "Phase 8 · BCBA Readiness Observation",
        "BCBA observes and clears you for independent assignment.", [
        { id: "ne-b1", title: "BCBA Readiness Observation", summary: "BCBA observation and final readiness signoff.", minutes: 60, type: "Signoff", required: true },
      ]),
    ],
    signoffs: [
      { id: "so-1", label: "Welcome to Blossom complete", owner: "Operations", required: true, status: "pending" },
      { id: "so-2", label: "Lead RBT Role Play passed", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-3", label: "Shadow & reflection reviewed", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-4", label: "Full Session With Lead RBT signoff", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-5", label: "BCBA Readiness Observation signoff", owner: "BCBA", required: true, status: "pending" },
    ],
  },
  {
    id: "certified_under_2yrs",
    label: "Certified, under 2 years",
    tagline: "Start with an evaluation — Blossom assigns support where you need it.",
    estWeeks: "1–3 weeks (varies by evaluation)",
    audience: "RBTs with under 2 years of field experience joining Blossom.",
    phases: [
      WELCOME_PHASE,
      phase("u2-eval", "Phase 1 · Implementation Evaluation",
        "Lead RBT and BCBA evaluate implementation in a live session.", [
        {
          id: "u2-e1",
          title: "Implementation Evaluation",
          summary: "Live evaluation of implementation, data collection, and documentation.",
          minutes: 90,
          type: "Evaluation",
          required: true,
          branching: {
            note: "Evaluation outcome routes you to the right support.",
            branches: [
              { condition: "Implementation not correct", assigns: ["Lead RBT Support Session"] },
              { condition: "ABA concepts weak", assigns: ["ABA Explained Gap Module"] },
              { condition: "Evaluation passed", assigns: ["Day 2 BCBA Supervision"] },
            ],
          },
        },
      ]),
      phase("u2-check", "Phase 2 · ABA Concept Check",
        "Short knowledge check to confirm core ABA fluency.", [
        { id: "u2-c1", title: "ABA Concept Check", summary: "Quick check on reinforcement, prompting, and measurement.", minutes: 20, type: "Assessment", required: true },
      ]),
      phase("u2-gap", "Phase 3 · Conditional gap modules",
        "Only assigned when the evaluation or concept check flags a gap.", [
        { id: "u2-g1", title: "Lead RBT Support Session", summary: "Targeted coaching from a Lead RBT on implementation gaps.", minutes: 60, type: "Role Play" },
        { id: "u2-g2", title: "ABA Explained Gap Module", summary: "Reinforcement, prompting, and measurement deep dive.", minutes: 30, type: "Video" },
      ]),
      phase("u2-bcba", "Phase 4 · Day 2 BCBA Supervision",
        "Independent session with BCBA supervision and signoff.", [
        { id: "u2-b1", title: "Day 2 BCBA Supervision", summary: "BCBA supervises Day 2 session and clears for independent assignment.", minutes: 90, type: "Signoff", required: true },
      ]),
    ],
    signoffs: [
      { id: "so-1", label: "Welcome to Blossom complete", owner: "Operations", required: true, status: "pending" },
      { id: "so-2", label: "Implementation Evaluation complete", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-3", label: "ABA Concept Check passed", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-4", label: "Assigned gap modules complete (if any)", owner: "Lead RBT Trainer", required: false, status: "pending" },
      { id: "so-5", label: "Day 2 BCBA Supervision signoff", owner: "BCBA", required: true, status: "pending" },
    ],
  },
  {
    id: "certified_2yrs_plus",
    label: "Certified, 2+ years",
    tagline: "Fast-track — not a free pass. Confirm Blossom standards before independent work.",
    estWeeks: "3–7 days",
    audience: "Experienced RBTs (2+ years) joining Blossom.",
    phases: [
      WELCOME_PHASE,
      phase("ex-docs", "Phase 1 · Blossom Documentation Standards",
        "How Blossom expects session notes and data to be captured.", [
        { id: "ex-d1", title: "Blossom Documentation Standards", summary: "Session note quality, timeliness, and data integrity rules.", minutes: 20, type: "SOP", required: true },
      ]),
      phase("ex-safety", "Phase 2 · Safety and Escalations",
        "Safety protocols and how to escalate inside Blossom.", [
        { id: "ex-s1", title: "Safety and Escalations", summary: "De-escalation, incident reporting, and who to call.", minutes: 15, type: "SOP", required: true },
      ]),
      phase("ex-parent", "Phase 3 · Parent Communication and Boundaries",
        "Professional communication and where the boundaries sit.", [
        { id: "ex-p1", title: "Parent Communication and Boundaries", summary: "What to share, what to escalate, what not to say.", minutes: 15, type: "SOP", required: true },
      ]),
      phase("ex-client", "Phase 4 · Client-Specific Protocol Review",
        "Review the protocols for your assigned clients before stepping in.", [
        { id: "ex-c1", title: "Client-Specific Protocol Review", summary: "Walk programs, BIPs, and reinforcers with the assigned BCBA.", minutes: 45, type: "Walkthrough", required: true },
      ]),
      phase("ex-signoff", "Phase 5 · Experienced RBT Readiness Signoff",
        "Short readiness signoff before independent assignment.", [
        { id: "ex-r1", title: "Experienced RBT Readiness Signoff", summary: "Lead RBT and BCBA confirm readiness for independent assignment.", minutes: 30, type: "Signoff", required: true },
      ]),
      phase("ex-optional", "Phase 6 · Optional · Lead RBT / Mentor Track",
        "Optional advanced path for RBTs pursuing Lead RBT or mentor roles.", [
        { id: "ex-o1", title: "Mentoring newer RBTs", summary: "How to model the Blossom standard for new teammates.", minutes: 20, type: "Overview" },
        { id: "ex-o2", title: "Leading shadow sessions", summary: "How to host a shadow session for a new RBT.", minutes: 15, type: "Walkthrough" },
        { id: "ex-o3", title: "Coaching and feedback skills", summary: "Giving clean, actionable feedback to peers.", minutes: 20, type: "Video" },
      ]),
    ],
    signoffs: [
      { id: "so-1", label: "Welcome to Blossom complete", owner: "Operations", required: true, status: "pending" },
      { id: "so-2", label: "Documentation, safety, and parent comms reviewed", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-3", label: "Client-specific protocol review with BCBA", owner: "BCBA", required: true, status: "pending" },
      { id: "so-4", label: "Experienced RBT Readiness Signoff", owner: "Lead RBT Trainer", required: true, status: "pending" },
      { id: "so-5", label: "Optional · Lead RBT / Mentor track complete", owner: "Lead RBT Trainer", required: false, status: "pending" },
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