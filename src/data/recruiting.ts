// Recruiting & onboarding data layer (mock until Apploi sync is wired in Stage 2)

export type CandidateRole = "RBT" | "BCBA";

export const RBT_STAGES = [
  "New Applicant",
  "Screening",
  "Interview Scheduled",
  "Interview Completed",
  "Offer Sent",
  "Offer Accepted",
  "Onboarding",
  "Background Check",
  "Orientation",
  "Training",
  "I9 / E-Verify",
  "Ready for Staffing",
] as const;

export const BCBA_STAGES = [
  "New Applicant",
  "Screening",
  "Interview",
  "Offer",
  "Onboarding",
  "Credentialing",
  "Orientation",
  "Ready for Assignment",
] as const;

export type RBTStage = (typeof RBT_STAGES)[number];
export type BCBAStage = (typeof BCBA_STAGES)[number];
export type CandidateStage = RBTStage | BCBAStage;

export type CandidateStatus = "Active" | "On Hold" | "Withdrawn" | "Hired" | "Rejected";
export type Source = "Apploi" | "Referral" | "Direct" | "Indeed";

export interface InterviewResponse {
  travelRadiusMiles: number;
  weeklyAvailabilityHours: number;
  yearsExperience: number;
  hasReliableTransport: boolean;
  preferredShifts: ("morning" | "afternoon" | "evening")[];
  startDateAvailability: string; // ISO
  notes: string;
  capturedBy: string;
  capturedAt: string;
}

export type AvailabilityCell = "available" | "preferred" | "unavailable";
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const TIME_SLOTS = ["AM (8-12)", "Mid (12-3)", "PM (3-7)", "Eve (7-9)"] as const;
export type AvailabilityGrid = Record<
  (typeof DAYS)[number],
  Record<(typeof TIME_SLOTS)[number], AvailabilityCell>
>;

export type OnboardingStepStatus = "Not Started" | "In Progress" | "Complete" | "Blocked";
export interface OnboardingStep {
  key: string;
  label: string;
  category: "Viventium" | "Background" | "Orientation" | "Training" | "Compliance";
  status: OnboardingStepStatus;
  completedAt?: string;
  blockerReason?: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
  actor?: string;
  type: "milestone" | "automation" | "note" | "alert";
}

export interface Candidate {
  id: string;
  apploiId?: string;
  name: string;
  role: CandidateRole;
  email: string;
  phone: string;
  city: string;
  state: string;
  travelRadiusMiles: number;
  source: Source;
  appliedFor: string;
  appliedDate: string;
  recruiter: string;
  status: CandidateStatus;
  stage: CandidateStage;
  daysInStage: number;
  resumeUrl?: string;
  interview?: InterviewResponse;
  availability: AvailabilityGrid;
  maxWeeklyHours: number;
  preferredLocations: string[];
  onboarding: OnboardingStep[];
  timeline: TimelineEvent[];
  credentials: { name: string; status: "Valid" | "Pending" | "Expired" | "N/A"; expiresAt?: string }[];
  alerts: string[];
}

// ----- helpers -----
const blankAvail = (): AvailabilityGrid =>
  DAYS.reduce((acc, d) => {
    acc[d] = TIME_SLOTS.reduce(
      (s, t) => ({ ...s, [t]: "unavailable" as AvailabilityCell }),
      {} as Record<(typeof TIME_SLOTS)[number], AvailabilityCell>,
    );
    return acc;
  }, {} as AvailabilityGrid);

const fillAvail = (
  spec: Partial<Record<(typeof DAYS)[number], (typeof TIME_SLOTS)[number][]>>,
  preferred: Partial<Record<(typeof DAYS)[number], (typeof TIME_SLOTS)[number][]>> = {},
): AvailabilityGrid => {
  const g = blankAvail();
  for (const d of DAYS) {
    for (const t of spec[d] ?? []) g[d][t] = "available";
    for (const t of preferred[d] ?? []) g[d][t] = "preferred";
  }
  return g;
};

const rbtOnboarding = (
  doneThrough: number,
): OnboardingStep[] => {
  const steps: Omit<OnboardingStep, "status">[] = [
    { key: "viv-paperwork", label: "Viventium paperwork", category: "Viventium" },
    { key: "viv-direct-deposit", label: "Direct deposit", category: "Viventium" },
    { key: "bg-check", label: "Background check", category: "Background" },
    { key: "fingerprints", label: "Fingerprints", category: "Background" },
    { key: "orientation", label: "Orientation completed", category: "Orientation" },
    { key: "rbt-training", label: "40-hr RBT training", category: "Training" },
    { key: "state-training", label: "State-specific training", category: "Training" },
    { key: "i9", label: "I-9 verification", category: "Compliance" },
    { key: "everify", label: "E-Verify", category: "Compliance" },
  ];
  return steps.map((s, i) => ({
    ...s,
    status:
      i < doneThrough
        ? "Complete"
        : i === doneThrough
          ? "In Progress"
          : "Not Started",
    completedAt: i < doneThrough ? "2026-04-0" + Math.max(1, (i % 9) + 1) : undefined,
  }));
};

const bcbaOnboarding = (doneThrough: number): OnboardingStep[] => {
  const steps: Omit<OnboardingStep, "status">[] = [
    { key: "viv-paperwork", label: "Viventium paperwork", category: "Viventium" },
    { key: "bg-check", label: "Background check", category: "Background" },
    { key: "credentialing", label: "BCBA credential verification", category: "Compliance" },
    { key: "state-license", label: "State LBA license", category: "Compliance" },
    { key: "orientation", label: "Clinical orientation", category: "Orientation" },
    { key: "i9", label: "I-9 verification", category: "Compliance" },
  ];
  return steps.map((s, i) => ({
    ...s,
    status:
      i < doneThrough ? "Complete" : i === doneThrough ? "In Progress" : "Not Started",
    completedAt: i < doneThrough ? "2026-04-0" + Math.max(1, (i % 9) + 1) : undefined,
  }));
};

// ----- mock candidates -----
export const mockCandidates: Candidate[] = [
  {
    id: "CAN-001",
    apploiId: "APP-88421",
    name: "Maya Robinson",
    role: "RBT",
    email: "maya.robinson@example.com",
    phone: "(404) 555-0142",
    city: "Atlanta",
    state: "GA",
    travelRadiusMiles: 20,
    source: "Apploi",
    appliedFor: "RBT - Peachtree Corners",
    appliedDate: "2026-04-12",
    recruiter: "Sarah Chen",
    status: "Active",
    stage: "New Applicant",
    daysInStage: 2,
    resumeUrl: "#",
    availability: fillAvail({
      Mon: ["AM (8-12)", "Mid (12-3)"],
      Wed: ["AM (8-12)", "Mid (12-3)"],
      Fri: ["AM (8-12)"],
    }),
    maxWeeklyHours: 25,
    preferredLocations: ["Peachtree Corners", "Atlanta"],
    onboarding: rbtOnboarding(0),
    timeline: [
      { date: "2026-04-12", event: "Application received from Apploi", type: "automation" },
    ],
    credentials: [{ name: "RBT Certification", status: "N/A" }],
    alerts: ["Missing interview data — schedule screening call"],
  },
  {
    id: "CAN-002",
    apploiId: "APP-88440",
    name: "Devon Brooks",
    role: "RBT",
    email: "devon.brooks@example.com",
    phone: "(404) 555-0177",
    city: "Marietta",
    state: "GA",
    travelRadiusMiles: 30,
    source: "Apploi",
    appliedFor: "RBT - Riverdale",
    appliedDate: "2026-04-08",
    recruiter: "Sarah Chen",
    status: "Active",
    stage: "Interview Scheduled",
    daysInStage: 1,
    resumeUrl: "#",
    interview: {
      travelRadiusMiles: 30,
      weeklyAvailabilityHours: 32,
      yearsExperience: 1,
      hasReliableTransport: true,
      preferredShifts: ["afternoon", "evening"],
      startDateAvailability: "2026-05-01",
      notes: "Strong candidate, currently working in childcare. Available afternoons after 2pm.",
      capturedBy: "Sarah Chen",
      capturedAt: "2026-04-09",
    },
    availability: fillAvail(
      { Mon: ["Mid (12-3)", "PM (3-7)"], Tue: ["PM (3-7)", "Eve (7-9)"], Wed: ["PM (3-7)"], Thu: ["Mid (12-3)", "PM (3-7)"] },
      { Fri: ["PM (3-7)"] },
    ),
    maxWeeklyHours: 32,
    preferredLocations: ["Riverdale", "Marietta"],
    onboarding: rbtOnboarding(0),
    timeline: [
      { date: "2026-04-08", event: "Application received from Apploi", type: "automation" },
      { date: "2026-04-09", event: "Phone screen completed", actor: "Sarah Chen", type: "milestone" },
      { date: "2026-04-13", event: "Interview scheduled for Apr 15, 2pm", actor: "Sarah Chen", type: "milestone" },
    ],
    credentials: [{ name: "RBT Certification", status: "Pending" }],
    alerts: [],
  },
  {
    id: "CAN-003",
    apploiId: "APP-88301",
    name: "Priya Anand",
    role: "RBT",
    email: "priya.anand@example.com",
    phone: "(512) 555-0199",
    city: "Austin",
    state: "TX",
    travelRadiusMiles: 25,
    source: "Apploi",
    appliedFor: "RBT - Austin Central",
    appliedDate: "2026-03-28",
    recruiter: "Marcus Webb",
    status: "Active",
    stage: "Offer Accepted",
    daysInStage: 3,
    resumeUrl: "#",
    interview: {
      travelRadiusMiles: 25,
      weeklyAvailabilityHours: 35,
      yearsExperience: 2,
      hasReliableTransport: true,
      preferredShifts: ["morning", "afternoon"],
      startDateAvailability: "2026-04-22",
      notes: "Existing RBT cert, transferring from another agency. Excellent references.",
      capturedBy: "Marcus Webb",
      capturedAt: "2026-04-02",
    },
    availability: fillAvail(
      { Mon: ["AM (8-12)", "Mid (12-3)"], Tue: ["AM (8-12)", "Mid (12-3)"], Wed: ["AM (8-12)"], Thu: ["AM (8-12)", "Mid (12-3)"], Fri: ["AM (8-12)"] },
    ),
    maxWeeklyHours: 35,
    preferredLocations: ["Austin Central", "Round Rock"],
    onboarding: rbtOnboarding(1),
    timeline: [
      { date: "2026-03-28", event: "Application received from Apploi", type: "automation" },
      { date: "2026-04-02", event: "Interview completed — recommended", actor: "Marcus Webb", type: "milestone" },
      { date: "2026-04-08", event: "Offer sent", actor: "Marcus Webb", type: "milestone" },
      { date: "2026-04-11", event: "Offer accepted", actor: "Priya Anand", type: "milestone" },
      { date: "2026-04-11", event: "Auto-sent to Viventium for onboarding", type: "automation" },
    ],
    credentials: [{ name: "RBT Certification", status: "Valid", expiresAt: "2027-06-30" }],
    alerts: [],
  },
  {
    id: "CAN-004",
    apploiId: "APP-88105",
    name: "Jamal Carter",
    role: "RBT",
    email: "jamal.carter@example.com",
    phone: "(404) 555-0211",
    city: "Decatur",
    state: "GA",
    travelRadiusMiles: 15,
    source: "Apploi",
    appliedFor: "RBT - Peachtree Corners",
    appliedDate: "2026-03-15",
    recruiter: "Sarah Chen",
    status: "Active",
    stage: "Background Check",
    daysInStage: 12,
    resumeUrl: "#",
    interview: {
      travelRadiusMiles: 15,
      weeklyAvailabilityHours: 28,
      yearsExperience: 0,
      hasReliableTransport: true,
      preferredShifts: ["afternoon"],
      startDateAvailability: "2026-04-25",
      notes: "New to ABA but strong willingness to learn. Will need 40-hr training.",
      capturedBy: "Sarah Chen",
      capturedAt: "2026-03-20",
    },
    availability: fillAvail({ Mon: ["PM (3-7)"], Tue: ["PM (3-7)"], Wed: ["PM (3-7)"], Thu: ["PM (3-7)"], Fri: ["PM (3-7)"] }),
    maxWeeklyHours: 28,
    preferredLocations: ["Peachtree Corners", "Decatur"],
    onboarding: [
      ...rbtOnboarding(2).slice(0, 2),
      { key: "bg-check", label: "Background check", category: "Background", status: "In Progress" },
      { key: "fingerprints", label: "Fingerprints", category: "Background", status: "Blocked", blockerReason: "Awaiting candidate to schedule appointment" },
      ...rbtOnboarding(2).slice(4),
    ],
    timeline: [
      { date: "2026-03-15", event: "Application received from Apploi", type: "automation" },
      { date: "2026-03-20", event: "Interview completed", actor: "Sarah Chen", type: "milestone" },
      { date: "2026-03-25", event: "Offer accepted", type: "milestone" },
      { date: "2026-04-02", event: "Background check stuck > 10 days", type: "alert" },
    ],
    credentials: [{ name: "RBT Certification", status: "Pending" }],
    alerts: ["Onboarding stuck — fingerprint appointment not scheduled"],
  },
  {
    id: "CAN-005",
    apploiId: "APP-87990",
    name: "Sofia Ramirez",
    role: "RBT",
    email: "sofia.ramirez@example.com",
    phone: "(602) 555-0188",
    city: "Phoenix",
    state: "AZ",
    travelRadiusMiles: 20,
    source: "Referral",
    appliedFor: "RBT - In-home AZ",
    appliedDate: "2026-03-10",
    recruiter: "Marcus Webb",
    status: "Active",
    stage: "Ready for Staffing",
    daysInStage: 2,
    resumeUrl: "#",
    interview: {
      travelRadiusMiles: 20,
      weeklyAvailabilityHours: 30,
      yearsExperience: 3,
      hasReliableTransport: true,
      preferredShifts: ["morning", "afternoon"],
      startDateAvailability: "2026-04-20",
      notes: "Experienced senior RBT. Spanish-speaking. Mentor candidate.",
      capturedBy: "Marcus Webb",
      capturedAt: "2026-03-15",
    },
    availability: fillAvail(
      { Mon: ["AM (8-12)", "Mid (12-3)"], Tue: ["AM (8-12)", "Mid (12-3)"], Wed: ["AM (8-12)", "Mid (12-3)"], Thu: ["AM (8-12)", "Mid (12-3)"], Fri: ["AM (8-12)"] },
    ),
    maxWeeklyHours: 30,
    preferredLocations: ["Phoenix", "Scottsdale"],
    onboarding: rbtOnboarding(9),
    timeline: [
      { date: "2026-03-10", event: "Application received via referral", type: "automation" },
      { date: "2026-03-15", event: "Interview completed", actor: "Marcus Webb", type: "milestone" },
      { date: "2026-03-22", event: "Offer accepted", type: "milestone" },
      { date: "2026-04-12", event: "Onboarding complete — moved to Ready for Staffing", type: "automation" },
    ],
    credentials: [{ name: "RBT Certification", status: "Valid", expiresAt: "2027-09-30" }],
    alerts: [],
  },
  {
    id: "CAN-006",
    apploiId: "APP-88512",
    name: "Tyler Nguyen",
    role: "RBT",
    email: "tyler.nguyen@example.com",
    phone: "(404) 555-0299",
    city: "Sandy Springs",
    state: "GA",
    travelRadiusMiles: 25,
    source: "Apploi",
    appliedFor: "RBT - Peachtree Corners",
    appliedDate: "2026-04-05",
    recruiter: "Sarah Chen",
    status: "Active",
    stage: "Offer Sent",
    daysInStage: 4,
    resumeUrl: "#",
    interview: {
      travelRadiusMiles: 25,
      weeklyAvailabilityHours: 25,
      yearsExperience: 1,
      hasReliableTransport: true,
      preferredShifts: ["afternoon", "evening"],
      startDateAvailability: "2026-05-05",
      notes: "Part-time, college student. Strong ABA coursework background.",
      capturedBy: "Sarah Chen",
      capturedAt: "2026-04-09",
    },
    availability: fillAvail({ Mon: ["PM (3-7)", "Eve (7-9)"], Wed: ["PM (3-7)", "Eve (7-9)"], Sat: ["AM (8-12)", "Mid (12-3)"] }),
    maxWeeklyHours: 25,
    preferredLocations: ["Peachtree Corners", "Sandy Springs"],
    onboarding: rbtOnboarding(0),
    timeline: [
      { date: "2026-04-05", event: "Application received from Apploi", type: "automation" },
      { date: "2026-04-09", event: "Interview completed — recommended", actor: "Sarah Chen", type: "milestone" },
      { date: "2026-04-13", event: "Offer sent", actor: "Sarah Chen", type: "milestone" },
    ],
    credentials: [{ name: "RBT Certification", status: "Pending" }],
    alerts: [],
  },
  {
    id: "CAN-007",
    apploiId: "APP-88218",
    name: "Aisha Williams",
    role: "RBT",
    email: "aisha.williams@example.com",
    phone: "(214) 555-0166",
    city: "Dallas",
    state: "TX",
    travelRadiusMiles: 18,
    source: "Apploi",
    appliedFor: "RBT - In-home TX",
    appliedDate: "2026-03-22",
    recruiter: "Marcus Webb",
    status: "Active",
    stage: "Training",
    daysInStage: 6,
    resumeUrl: "#",
    interview: {
      travelRadiusMiles: 18,
      weeklyAvailabilityHours: 30,
      yearsExperience: 0,
      hasReliableTransport: true,
      preferredShifts: ["morning"],
      startDateAvailability: "2026-04-30",
      notes: "Career-changer from teaching. Excellent communication.",
      capturedBy: "Marcus Webb",
      capturedAt: "2026-03-26",
    },
    availability: fillAvail({ Mon: ["AM (8-12)"], Tue: ["AM (8-12)"], Wed: ["AM (8-12)"], Thu: ["AM (8-12)"], Fri: ["AM (8-12)"] }),
    maxWeeklyHours: 30,
    preferredLocations: ["Dallas", "Plano"],
    onboarding: rbtOnboarding(5),
    timeline: [
      { date: "2026-03-22", event: "Application received from Apploi", type: "automation" },
      { date: "2026-03-26", event: "Interview completed", actor: "Marcus Webb", type: "milestone" },
      { date: "2026-04-01", event: "Offer accepted", type: "milestone" },
      { date: "2026-04-08", event: "Background check cleared", type: "automation" },
      { date: "2026-04-10", event: "Started 40-hr RBT training", type: "milestone" },
    ],
    credentials: [{ name: "RBT Certification", status: "Pending" }],
    alerts: [],
  },
  {
    id: "CAN-008",
    apploiId: "APP-88001",
    name: "Reggie Park",
    role: "BCBA",
    email: "reggie.park@example.com",
    phone: "(404) 555-0444",
    city: "Atlanta",
    state: "GA",
    travelRadiusMiles: 35,
    source: "Apploi",
    appliedFor: "BCBA - Multi-state",
    appliedDate: "2026-03-18",
    recruiter: "Director Han",
    status: "Active",
    stage: "Credentialing",
    daysInStage: 5,
    resumeUrl: "#",
    interview: {
      travelRadiusMiles: 35,
      weeklyAvailabilityHours: 40,
      yearsExperience: 6,
      hasReliableTransport: true,
      preferredShifts: ["morning", "afternoon"],
      startDateAvailability: "2026-05-01",
      notes: "Senior BCBA, supervisory experience. Looking to build a team.",
      capturedBy: "Director Han",
      capturedAt: "2026-03-22",
    },
    availability: fillAvail({ Mon: ["AM (8-12)", "Mid (12-3)", "PM (3-7)"], Tue: ["AM (8-12)", "Mid (12-3)"], Wed: ["AM (8-12)", "Mid (12-3)", "PM (3-7)"], Thu: ["AM (8-12)", "Mid (12-3)"], Fri: ["AM (8-12)"] }),
    maxWeeklyHours: 40,
    preferredLocations: ["Peachtree Corners", "Atlanta"],
    onboarding: bcbaOnboarding(3),
    timeline: [
      { date: "2026-03-18", event: "Application received from Apploi", type: "automation" },
      { date: "2026-03-22", event: "Interview completed", actor: "Director Han", type: "milestone" },
      { date: "2026-03-30", event: "Offer accepted", type: "milestone" },
      { date: "2026-04-05", event: "Background check cleared", type: "automation" },
      { date: "2026-04-08", event: "BCBA credential verification in progress", type: "milestone" },
    ],
    credentials: [
      { name: "BCBA Certification", status: "Valid", expiresAt: "2028-01-15" },
      { name: "GA LBA License", status: "Pending" },
    ],
    alerts: [],
  },
  {
    id: "CAN-009",
    apploiId: "APP-88375",
    name: "Hannah Liu",
    role: "BCBA",
    email: "hannah.liu@example.com",
    phone: "(602) 555-0299",
    city: "Phoenix",
    state: "AZ",
    travelRadiusMiles: 30,
    source: "Apploi",
    appliedFor: "BCBA - AZ",
    appliedDate: "2026-04-01",
    recruiter: "Director Han",
    status: "Active",
    stage: "Interview",
    daysInStage: 3,
    resumeUrl: "#",
    availability: fillAvail({ Mon: ["AM (8-12)", "Mid (12-3)"], Tue: ["AM (8-12)", "Mid (12-3)"], Thu: ["AM (8-12)", "Mid (12-3)"] }),
    maxWeeklyHours: 32,
    preferredLocations: ["Phoenix"],
    onboarding: bcbaOnboarding(0),
    timeline: [
      { date: "2026-04-01", event: "Application received from Apploi", type: "automation" },
      { date: "2026-04-12", event: "Interview scheduled for Apr 16", actor: "Director Han", type: "milestone" },
    ],
    credentials: [
      { name: "BCBA Certification", status: "Valid", expiresAt: "2027-11-30" },
      { name: "AZ LBA License", status: "Valid", expiresAt: "2027-08-15" },
    ],
    alerts: ["Missing interview data capture"],
  },
  {
    id: "CAN-010",
    apploiId: "APP-87850",
    name: "Brandon Mills",
    role: "RBT",
    email: "brandon.mills@example.com",
    phone: "(404) 555-0322",
    city: "Lawrenceville",
    state: "GA",
    travelRadiusMiles: 25,
    source: "Apploi",
    appliedFor: "RBT - Peachtree Corners",
    appliedDate: "2026-02-28",
    recruiter: "Sarah Chen",
    status: "On Hold",
    stage: "Interview Completed",
    daysInStage: 22,
    resumeUrl: "#",
    interview: {
      travelRadiusMiles: 25,
      weeklyAvailabilityHours: 20,
      yearsExperience: 0,
      hasReliableTransport: false,
      preferredShifts: ["afternoon"],
      startDateAvailability: "2026-06-01",
      notes: "Limited transport — flagged for review. Considering rideshare options.",
      capturedBy: "Sarah Chen",
      capturedAt: "2026-03-05",
    },
    availability: fillAvail({ Tue: ["PM (3-7)"], Thu: ["PM (3-7)"] }),
    maxWeeklyHours: 20,
    preferredLocations: ["Peachtree Corners"],
    onboarding: rbtOnboarding(0),
    timeline: [
      { date: "2026-02-28", event: "Application received from Apploi", type: "automation" },
      { date: "2026-03-05", event: "Interview completed — on hold pending transport", type: "milestone" },
      { date: "2026-03-25", event: "Stuck in stage > 14 days", type: "alert" },
    ],
    credentials: [{ name: "RBT Certification", status: "N/A" }],
    alerts: ["On hold > 14 days — needs decision"],
  },
  {
    id: "CAN-011",
    apploiId: "APP-88455",
    name: "Olivia Tran",
    role: "RBT",
    email: "olivia.tran@example.com",
    phone: "(512) 555-0211",
    city: "Round Rock",
    state: "TX",
    travelRadiusMiles: 20,
    source: "Apploi",
    appliedFor: "RBT - Austin Central",
    appliedDate: "2026-04-10",
    recruiter: "Marcus Webb",
    status: "Active",
    stage: "Screening",
    daysInStage: 1,
    resumeUrl: "#",
    availability: fillAvail({ Mon: ["AM (8-12)"], Wed: ["AM (8-12)"], Fri: ["AM (8-12)"] }),
    maxWeeklyHours: 18,
    preferredLocations: ["Austin Central", "Round Rock"],
    onboarding: rbtOnboarding(0),
    timeline: [
      { date: "2026-04-10", event: "Application received from Apploi", type: "automation" },
      { date: "2026-04-13", event: "Screening call requested", actor: "Marcus Webb", type: "milestone" },
    ],
    credentials: [{ name: "RBT Certification", status: "Valid", expiresAt: "2026-12-15" }],
    alerts: [],
  },
  {
    id: "CAN-012",
    apploiId: "APP-88600",
    name: "Marcus Stone",
    role: "RBT",
    email: "marcus.stone@example.com",
    phone: "(404) 555-0388",
    city: "Atlanta",
    state: "GA",
    travelRadiusMiles: 15,
    source: "Apploi",
    appliedFor: "RBT - Riverdale",
    appliedDate: "2026-04-13",
    recruiter: "Sarah Chen",
    status: "Active",
    stage: "Orientation",
    daysInStage: 2,
    resumeUrl: "#",
    interview: {
      travelRadiusMiles: 15,
      weeklyAvailabilityHours: 30,
      yearsExperience: 2,
      hasReliableTransport: true,
      preferredShifts: ["morning", "afternoon"],
      startDateAvailability: "2026-04-22",
      notes: "Returning RBT — previously worked at sister agency. Fast-track candidate.",
      capturedBy: "Sarah Chen",
      capturedAt: "2026-04-13",
    },
    availability: fillAvail({ Mon: ["AM (8-12)", "Mid (12-3)"], Tue: ["AM (8-12)", "Mid (12-3)"], Wed: ["AM (8-12)"], Thu: ["AM (8-12)", "Mid (12-3)"], Fri: ["AM (8-12)"] }),
    maxWeeklyHours: 30,
    preferredLocations: ["Riverdale", "Atlanta"],
    onboarding: rbtOnboarding(4),
    timeline: [
      { date: "2026-04-13", event: "Application received from Apploi", type: "automation" },
      { date: "2026-04-13", event: "Fast-track interview completed", actor: "Sarah Chen", type: "milestone" },
      { date: "2026-04-13", event: "Offer accepted same-day", type: "milestone" },
      { date: "2026-04-14", event: "Background check cleared", type: "automation" },
      { date: "2026-04-15", event: "Orientation in progress", type: "milestone" },
    ],
    credentials: [{ name: "RBT Certification", status: "Valid", expiresAt: "2027-03-30" }],
    alerts: [],
  },
];

// ----- selectors -----
export const stagesForRole = (role: CandidateRole): readonly CandidateStage[] =>
  role === "RBT" ? RBT_STAGES : BCBA_STAGES;

export const candidatesByStage = (
  role: CandidateRole,
  filter?: (c: Candidate) => boolean,
): { stage: CandidateStage; candidates: Candidate[] }[] => {
  const stages = stagesForRole(role);
  return stages.map((stage) => ({
    stage,
    candidates: mockCandidates.filter(
      (c) => c.role === role && c.stage === stage && (!filter || filter(c)),
    ),
  }));
};

export const findCandidateById = (id: string): Candidate | undefined =>
  mockCandidates.find((c) => c.id === id);

export const stageVariant = (
  stage: CandidateStage,
): "default" | "success" | "warning" | "info" | "muted" => {
  if (stage === "Ready for Staffing" || stage === "Ready for Assignment") return "success";
  if (stage === "Offer Accepted" || stage === "Offer Sent" || stage === "Offer") return "info";
  if (stage === "New Applicant" || stage === "Screening") return "muted";
  return "default";
};

export const onboardingProgress = (c: Candidate): { done: number; total: number; pct: number } => {
  const total = c.onboarding.length;
  const done = c.onboarding.filter((s) => s.status === "Complete").length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
};

export const recruitingMetrics = () => {
  const total = mockCandidates.length;
  const ready = mockCandidates.filter((c) => c.stage === "Ready for Staffing" || c.stage === "Ready for Assignment").length;
  const inOnboarding = mockCandidates.filter((c) =>
    ["Onboarding", "Background Check", "Orientation", "Training", "I9 / E-Verify", "Credentialing"].includes(c.stage),
  ).length;
  const stuck = mockCandidates.filter((c) => c.daysInStage > 10).length;
  const newThisWeek = mockCandidates.filter((c) => c.daysInStage <= 7 && c.stage === "New Applicant").length;
  return { total, ready, inOnboarding, stuck, newThisWeek };
};
