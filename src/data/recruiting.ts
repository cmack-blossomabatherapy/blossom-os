// Recruiting & onboarding data layer (mock until Apploi sync is wired in Stage 2)

export type CandidateRole = "RBT" | "BCBA";

export const RBT_STAGES: readonly string[] = [];
export const BCBA_STAGES: readonly string[] = [];

export type RBTStage = string;
export type BCBAStage = string;
export type CandidateStage = string;

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
export const DAYS: readonly string[] = [];
export const TIME_SLOTS: readonly string[] = [];
export type AvailabilityGrid = Record<string, Record<string, AvailabilityCell>>;

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
export const mockCandidates: Candidate[] = [];

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
