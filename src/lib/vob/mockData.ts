// VOB Decision Center — mock operational data.
// Real data architecture is reflected by these interfaces; storage layer can be wired later.

export type Tone = "ok" | "warn" | "crit";
export type StaffingDifficulty = "easy" | "moderate" | "difficult" | "high_risk";
export type VobStatus =
  | "ready"           // Ready for Review
  | "finance_review"  // Finance Review
  | "payment_plan"    // Payment Plan Needed
  | "approved"        // Approved
  | "no_oon"          // No OON Benefits
  | "declined"        // Declined / Flaked
  | "needs_info";     // Needs More Information

export type PayorCategory = "green" | "yellow" | "red";
export type DecisionType =
  | "approve"
  | "approve_payment_plan"
  | "finance_review"
  | "needs_info"
  | "no_oon"
  | "decline";

export interface VobNote {
  id: string;
  author: string;
  role: string;
  text: string;
  createdAt: string;
  tags?: string[];
}

export interface VobComm {
  id: string;
  kind: "email" | "call" | "text";
  subject: string;
  direction: "in" | "out";
  createdAt: string;
}

export interface VobReview {
  id: string;
  parentName: string;
  childName: string;
  childAge: number;
  state: string;
  payor: string;
  planType: string;
  policyId: string;
  innOon: "INN" | "OON";
  deductible: number;
  deductibleMet: number;
  coinsurance: number; // family share %
  copay: number;
  moop: number;
  oonCoverage: "covered" | "limited" | "none";
  requestedHours: number;
  requestedServices: string[];
  staffing: StaffingDifficulty;
  bcbaAvailability: "open" | "tight" | "none";
  rbtAvailability: "open" | "tight" | "none";
  travelComplexity: Tone;
  marketDemand: Tone;
  urgency: Tone;
  status: VobStatus;
  assignedReviewer: string;
  intakeCoordinator: string;
  stateDirector: string;
  payorCategory: PayorCategory;
  estFamilyResponsibility: number;
  financeRisk: Tone;
  operationalRisk: Tone;
  notes: VobNote[];
  communications: VobComm[];
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<VobStatus, string> = {
  ready: "Ready for Review",
  finance_review: "Finance Review",
  payment_plan: "Payment Plan Needed",
  approved: "Approved",
  no_oon: "No OON Benefits",
  declined: "Declined",
  needs_info: "Needs More Info",
};

export const STATUS_TONE: Record<VobStatus, Tone> = {
  ready: "ok",
  finance_review: "warn",
  payment_plan: "warn",
  approved: "ok",
  no_oon: "crit",
  declined: "crit",
  needs_info: "warn",
};

export const VOB_REVIEWS: VobReview[] = [
  {
    id: "vob-001",
    parentName: "Erin Walker", childName: "Ava", childAge: 5,
    state: "NC", payor: "BCBS NC", planType: "PPO", policyId: "YPB123456789",
    innOon: "INN", deductible: 3500, deductibleMet: 1200,
    coinsurance: 20, copay: 30, moop: 8500, oonCoverage: "covered",
    requestedHours: 30, requestedServices: ["97153", "97155", "97156"],
    staffing: "moderate", bcbaAvailability: "tight", rbtAvailability: "open",
    travelComplexity: "ok", marketDemand: "ok", urgency: "warn",
    status: "ready", assignedReviewer: "Michelle B.",
    intakeCoordinator: "Devon P.", stateDirector: "Priya S.",
    payorCategory: "green",
    estFamilyResponsibility: 2300, financeRisk: "ok", operationalRisk: "warn",
    notes: [
      { id: "n1", author: "Devon P.", role: "Intake", text: "Parent open to a payment plan if needed. Prefers afternoons.", createdAt: "2 hours ago" },
    ],
    communications: [
      { id: "c1", kind: "email", subject: "Welcome packet sent", direction: "out", createdAt: "Yesterday" },
      { id: "c2", kind: "call", subject: "Intro call (12 min)", direction: "out", createdAt: "2d ago" },
    ],
    createdAt: "2d ago", updatedAt: "2h ago",
  },
  {
    id: "vob-002",
    parentName: "Devon Pierce", childName: "Liam", childAge: 4,
    state: "GA", payor: "Aetna", planType: "HMO", policyId: "W2745611",
    innOon: "INN", deductible: 1500, deductibleMet: 800,
    coinsurance: 10, copay: 25, moop: 6000, oonCoverage: "limited",
    requestedHours: 25, requestedServices: ["97153", "97155"],
    staffing: "easy", bcbaAvailability: "open", rbtAvailability: "open",
    travelComplexity: "ok", marketDemand: "ok", urgency: "ok",
    status: "ready", assignedReviewer: "Michelle B.",
    intakeCoordinator: "Devon P.", stateDirector: "Tariq D.",
    payorCategory: "green",
    estFamilyResponsibility: 950, financeRisk: "ok", operationalRisk: "ok",
    notes: [],
    communications: [
      { id: "c1", kind: "text", subject: "Confirmed VOB info received", direction: "in", createdAt: "1d ago" },
    ],
    createdAt: "3d ago", updatedAt: "1d ago",
  },
  {
    id: "vob-003",
    parentName: "Priya Sharma", childName: "Reya", childAge: 6,
    state: "TN", payor: "Cigna", planType: "PPO", policyId: "U9988776",
    innOon: "OON", deductible: 6000, deductibleMet: 0,
    coinsurance: 30, copay: 0, moop: 12000, oonCoverage: "limited",
    requestedHours: 28, requestedServices: ["97153", "97155"],
    staffing: "difficult", bcbaAvailability: "tight", rbtAvailability: "tight",
    travelComplexity: "warn", marketDemand: "warn", urgency: "warn",
    status: "finance_review", assignedReviewer: "Camila O.",
    intakeCoordinator: "Devon P.", stateDirector: "Priya S.",
    payorCategory: "red",
    estFamilyResponsibility: 7800, financeRisk: "crit", operationalRisk: "warn",
    notes: [
      { id: "n1", author: "Camila O.", role: "Finance", text: "Cigna TN historically not accepted — needs exception review.", createdAt: "Yesterday", tags: ["exception"] },
    ],
    communications: [],
    createdAt: "4d ago", updatedAt: "1d ago",
  },
  {
    id: "vob-004",
    parentName: "Jordan Hayes", childName: "Mason", childAge: 3,
    state: "VA", payor: "UHC", planType: "EPO", policyId: "947812005",
    innOon: "INN", deductible: 4500, deductibleMet: 200,
    coinsurance: 20, copay: 40, moop: 9000, oonCoverage: "none",
    requestedHours: 32, requestedServices: ["97153", "97155", "97156"],
    staffing: "moderate", bcbaAvailability: "tight", rbtAvailability: "open",
    travelComplexity: "ok", marketDemand: "ok", urgency: "crit",
    status: "payment_plan", assignedReviewer: "Michelle B.",
    intakeCoordinator: "Devon P.", stateDirector: "Tariq D.",
    payorCategory: "yellow",
    estFamilyResponsibility: 4100, financeRisk: "warn", operationalRisk: "warn",
    notes: [
      { id: "n1", author: "Michelle B.", role: "Reviewer", text: "Deductible high — recommend monthly plan.", createdAt: "Today", tags: ["payment-plan"] },
    ],
    communications: [
      { id: "c1", kind: "email", subject: "Benefit summary delivered", direction: "out", createdAt: "Today" },
    ],
    createdAt: "5d ago", updatedAt: "Today",
  },
  {
    id: "vob-005",
    parentName: "Camila Ortiz", childName: "Sofia", childAge: 5,
    state: "GA", payor: "BCBS TX", planType: "PPO", policyId: "TX887766",
    innOon: "OON", deductible: 11000, deductibleMet: 0,
    coinsurance: 40, copay: 0, moop: 18000, oonCoverage: "none",
    requestedHours: 25, requestedServices: ["97153", "97155"],
    staffing: "moderate", bcbaAvailability: "tight", rbtAvailability: "tight",
    travelComplexity: "warn", marketDemand: "ok", urgency: "warn",
    status: "no_oon", assignedReviewer: "Camila O.",
    intakeCoordinator: "Devon P.", stateDirector: "Tariq D.",
    payorCategory: "red",
    estFamilyResponsibility: 14000, financeRisk: "crit", operationalRisk: "crit",
    notes: [
      { id: "n1", author: "Camila O.", role: "Finance", text: "BCBS TX historically poor OON in GA — decline.", createdAt: "Yesterday" },
    ],
    communications: [],
    createdAt: "6d ago", updatedAt: "Yesterday",
  },
  {
    id: "vob-006",
    parentName: "Tariq Davis", childName: "Noah", childAge: 4,
    state: "MD", payor: "Tricare", planType: "Select", policyId: "TS5544",
    innOon: "INN", deductible: 500, deductibleMet: 500,
    coinsurance: 5, copay: 0, moop: 3000, oonCoverage: "covered",
    requestedHours: 20, requestedServices: ["97153"],
    staffing: "easy", bcbaAvailability: "open", rbtAvailability: "open",
    travelComplexity: "ok", marketDemand: "ok", urgency: "ok",
    status: "approved", assignedReviewer: "Michelle B.",
    intakeCoordinator: "Devon P.", stateDirector: "Anya B.",
    payorCategory: "green",
    estFamilyResponsibility: 250, financeRisk: "ok", operationalRisk: "ok",
    notes: [],
    communications: [
      { id: "c1", kind: "email", subject: "Approval confirmation sent", direction: "out", createdAt: "Today" },
    ],
    createdAt: "7d ago", updatedAt: "Today",
  },
  {
    id: "vob-007",
    parentName: "Anya Brooks", childName: "Maya", childAge: 6,
    state: "VA", payor: "Aetna", planType: "PPO", policyId: "W812234",
    innOon: "INN", deductible: 2500, deductibleMet: 0,
    coinsurance: 20, copay: 35, moop: 7000, oonCoverage: "covered",
    requestedHours: 28, requestedServices: ["97153", "97155"],
    staffing: "moderate", bcbaAvailability: "tight", rbtAvailability: "open",
    travelComplexity: "ok", marketDemand: "ok", urgency: "warn",
    status: "needs_info", assignedReviewer: "Michelle B.",
    intakeCoordinator: "Devon P.", stateDirector: "Tariq D.",
    payorCategory: "green",
    estFamilyResponsibility: 1900, financeRisk: "ok", operationalRisk: "warn",
    notes: [
      { id: "n1", author: "Michelle B.", role: "Reviewer", text: "Need diagnosis code + assessment date from parent.", createdAt: "Today" },
    ],
    communications: [],
    createdAt: "1d ago", updatedAt: "Today",
  },
];

export interface PayorIntel {
  payor: string;
  state: string; // "*" = all states
  category: PayorCategory;
  reimbursement: string;
  staffing: string;
  finance: string;
}

export const PAYOR_INTEL: PayorIntel[] = [
  { payor: "Aetna",   state: "*",  category: "green",  reimbursement: "UCR 80–90% historically strong.", staffing: "Standard credentialing, broad provider acceptance.", finance: "Reliable EOB cycles, predictable reimbursement." },
  { payor: "BCBS NC", state: "NC", category: "green",  reimbursement: "Consistent INN reimbursement at fee schedule.", staffing: "Strong network — easy to staff statewide.", finance: "Clean EOBs, low denial rates." },
  { payor: "Tricare", state: "*",  category: "green",  reimbursement: "Solid INN — clean claims preferred.", staffing: "Network credentialing required up-front.", finance: "Stable but slow EOB turnaround." },
  { payor: "UHC",     state: "*",  category: "yellow", reimbursement: "Variable — confirm rate per CPT before approval.", staffing: "Workable, watch for plan-specific exclusions.", finance: "Finance review on plans with high deductibles." },
  { payor: "Medicaid",state: "*",  category: "yellow", reimbursement: "State-by-state variance, low rates in some markets.", staffing: "Confirm state Medicaid panel before staffing.", finance: "Often requires payment plan offset." },
  { payor: "Cigna",   state: "TN", category: "red",    reimbursement: "Generally not accepted in TN.", staffing: "Avoid placing capacity unless exception approved.", finance: "Decline unless Finance authorizes exception." },
  { payor: "BCBS TX", state: "GA", category: "red",    reimbursement: "Historically poor OON reimbursement in GA.", staffing: "High operational risk — avoid.", finance: "Decline OON cases — payment plans unlikely to close gap." },
  { payor: "Cigna",   state: "*",  category: "yellow", reimbursement: "Mid-tier outside TN — confirm OON benefits.", staffing: "Workable in most states.", finance: "Finance review on OON cases." },
];

export function intelFor(payor: string, state: string): PayorIntel | undefined {
  return (
    PAYOR_INTEL.find((p) => p.payor === payor && p.state === state) ||
    PAYOR_INTEL.find((p) => p.payor === payor && p.state === "*")
  );
}

/** Lightweight rule-based "AI" guidance — surfaces operational recommendations. */
export function deriveGuidance(r: VobReview): { tone: Tone; text: string }[] {
  const out: { tone: Tone; text: string }[] = [];
  const intel = intelFor(r.payor, r.state);
  if (intel?.category === "green") out.push({ tone: "ok",  text: `${r.payor} historically reimburses well — proceed with confidence.` });
  if (intel?.category === "yellow")out.push({ tone: "warn",text: `${r.payor} has variable reimbursement — Finance review recommended.` });
  if (intel?.category === "red")   out.push({ tone: "crit",text: `${r.payor} in ${r.state} is a known poor performer — consider declining.` });
  if (r.deductible > 10000)        out.push({ tone: "crit",text: `Deductible $${r.deductible.toLocaleString()} exceeds the $10K review threshold.` });
  else if (r.deductible > 5000)    out.push({ tone: "warn",text: `Deductible $${r.deductible.toLocaleString()} is high — payment plan likely needed.` });
  if (r.coinsurance >= 30)         out.push({ tone: "warn",text: `${r.coinsurance}% coinsurance is above the 30% review threshold.` });
  if (r.oonCoverage === "none" && r.innOon === "OON")
    out.push({ tone: "crit", text: "No OON benefits detected — recommend decline." });
  if (r.staffing === "difficult" || r.staffing === "high_risk")
    out.push({ tone: "warn", text: `Staffing complexity is ${r.staffing.replace("_"," ")} in ${r.state} — confirm BCBA availability.` });
  if (r.estFamilyResponsibility >= 3000)
    out.push({ tone: "warn", text: `Estimated family responsibility ~$${r.estFamilyResponsibility.toLocaleString()} — payment plan strongly recommended.` });
  if (out.length === 0) out.push({ tone: "ok", text: "No flags detected — operationally viable case." });
  return out;
}

/** Operational rules for the payment-plan panel. */
export function paymentPlanStatus(r: VobReview): { label: string; tone: Tone; reason: string } {
  if (r.oonCoverage === "none" && r.innOon === "OON")
    return { label: "Decline Consideration", tone: "crit", reason: "No OON coverage available." };
  if (r.deductible > 10000 || r.coinsurance >= 30)
    return { label: "Finance Review Needed", tone: "crit", reason: "Deductible or coinsurance exceeds review threshold." };
  if (r.estFamilyResponsibility >= 3000)
    return { label: "Payment Plan Recommended", tone: "warn", reason: "Family responsibility exceeds $3K." };
  return { label: "No Payment Plan Needed", tone: "ok", reason: "Family responsibility within standard range." };
}
