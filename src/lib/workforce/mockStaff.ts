// Shared mock workforce roster (used by BCBA/RBT page + User Management)

export const STATE_NAMES: Record<string, string> = {
  NC: "North Carolina", GA: "Georgia", VA: "Virginia", TN: "Tennessee", MD: "Maryland",
};

export const REGIONS_BY_STATE: Record<string, string[]> = {
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham"],
  GA: ["Atlanta", "Savannah", "Augusta", "Columbus"],
  VA: ["Richmond", "Norfolk", "Arlington", "Roanoke"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
  MD: ["Baltimore", "Bethesda", "Annapolis", "Frederick"],
};

export type BCBAStatus = "Healthy" | "Near Capacity" | "Overloaded" | "Needs Attention";
export type RBTStatus = "Healthy" | "Underutilized" | "Needs Support" | "At Risk";

export type BCBA = {
  id: string; name: string; region: string; state: string;
  caseload: number; capacity: number;
  hours: number; supervisionPct: number; overduePR: number;
  staffingGaps: number; status: BCBAStatus;
  clients: { name: string; hours: number; risk: "ok" | "watch" | "risk" }[];
  authRisks: number; trainingComplete: number; onboarding: "complete" | "in-progress";
};

export type RBT = {
  id: string; name: string; region: string; state: string;
  bcba: string; clients: number; scheduledHours: number; targetHours: number;
  utilization: number; trainingComplete: number; supervisionDue: boolean;
  status: RBTStatus;
  upcoming: { day: string; client: string; hours: number }[];
  attendanceConcerns: number; onboarding: "complete" | "in-progress";
};

function emailFor(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/,?\s*(bcba|rbt)\b/g, "")
    .replace(/dr\.\s*/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");
  return `${slug}@blossomabatherapy.com`;
}

export function buildBcbas(state: string): BCBA[] {
  const r = REGIONS_BY_STATE[state] ?? REGIONS_BY_STATE.NC;
  return [
    { id: "b1", state, name: "Dr. Maya Patel", region: r[0], caseload: 14, capacity: 12, hours: 38.5,
      supervisionPct: 78, overduePR: 3, staffingGaps: 2, status: "Overloaded",
      authRisks: 2, trainingComplete: 100, onboarding: "complete",
      clients: [
        { name: "J. Carter", hours: 18, risk: "risk" },
        { name: "A. Mendez", hours: 22, risk: "watch" },
        { name: "T. Nguyen", hours: 14, risk: "ok" },
        { name: "S. Rivera", hours: 20, risk: "watch" },
      ] },
    { id: "b2", state, name: "Jordan Lee, BCBA", region: r[1], caseload: 11, capacity: 12, hours: 34,
      supervisionPct: 92, overduePR: 0, staffingGaps: 0, status: "Healthy",
      authRisks: 0, trainingComplete: 100, onboarding: "complete",
      clients: [
        { name: "M. Brooks", hours: 16, risk: "ok" },
        { name: "E. Tran", hours: 18, risk: "ok" },
        { name: "L. Kim", hours: 12, risk: "ok" },
      ] },
    { id: "b3", state, name: "Camila Ortiz, BCBA", region: r[2], caseload: 12, capacity: 12, hours: 36.2,
      supervisionPct: 84, overduePR: 1, staffingGaps: 1, status: "Near Capacity",
      authRisks: 1, trainingComplete: 90, onboarding: "complete",
      clients: [
        { name: "R. Patel", hours: 20, risk: "watch" },
        { name: "D. Foster", hours: 16, risk: "ok" },
      ] },
    { id: "b4", state, name: "Marcus Hill, BCBA", region: r[3], caseload: 9, capacity: 12, hours: 28,
      supervisionPct: 65, overduePR: 2, staffingGaps: 0, status: "Needs Attention",
      authRisks: 0, trainingComplete: 80, onboarding: "complete",
      clients: [
        { name: "K. Wallace", hours: 14, risk: "watch" },
        { name: "P. Singh", hours: 14, risk: "ok" },
      ] },
    { id: "b5", state, name: "Priya Shah, BCBA", region: r[0], caseload: 13, capacity: 12, hours: 37,
      supervisionPct: 88, overduePR: 0, staffingGaps: 1, status: "Near Capacity",
      authRisks: 1, trainingComplete: 100, onboarding: "complete",
      clients: [
        { name: "I. Khan", hours: 18, risk: "ok" },
        { name: "B. Cole", hours: 19, risk: "watch" },
      ] },
    { id: "b6", state, name: "Dr. Elena Torres, BCBA", region: r[1], caseload: 10, capacity: 12, hours: 32,
      supervisionPct: 95, overduePR: 0, staffingGaps: 0, status: "Healthy",
      authRisks: 0, trainingComplete: 100, onboarding: "complete",
      clients: [
        { name: "A. Patel", hours: 16, risk: "ok" },
        { name: "C. Lee", hours: 14, risk: "ok" },
      ] },
    { id: "b7", state, name: "James Nakamura, BCBA", region: r[2], caseload: 12, capacity: 12, hours: 36,
      supervisionPct: 82, overduePR: 1, staffingGaps: 1, status: "Near Capacity",
      authRisks: 1, trainingComplete: 92, onboarding: "complete",
      clients: [
        { name: "M. Torres", hours: 18, risk: "watch" },
        { name: "S. Green", hours: 14, risk: "ok" },
      ] },
    { id: "b8", state, name: "Amara Osei, BCBA", region: r[3], caseload: 8, capacity: 12, hours: 26,
      supervisionPct: 70, overduePR: 0, staffingGaps: 0, status: "Needs Attention",
      authRisks: 0, trainingComplete: 85, onboarding: "complete",
      clients: [
        { name: "J. Wright", hours: 12, risk: "ok" },
        { name: "R. Johnson", hours: 10, risk: "ok" },
      ] },
    { id: "b9", state, name: "Dr. Rachel Kim, BCBA", region: r[0], caseload: 15, capacity: 12, hours: 40,
      supervisionPct: 75, overduePR: 4, staffingGaps: 3, status: "Overloaded",
      authRisks: 2, trainingComplete: 100, onboarding: "complete",
      clients: [
        { name: "L. Brown", hours: 20, risk: "risk" },
        { name: "N. Davis", hours: 18, risk: "watch" },
        { name: "O. Garcia", hours: 16, risk: "watch" },
      ] },
    { id: "b10", state, name: "Thomas Rivera, BCBA", region: r[1], caseload: 11, capacity: 12, hours: 34,
      supervisionPct: 90, overduePR: 0, staffingGaps: 0, status: "Healthy",
      authRisks: 0, trainingComplete: 100, onboarding: "complete",
      clients: [
        { name: "P. Martinez", hours: 16, risk: "ok" },
        { name: "Q. Nguyen", hours: 14, risk: "ok" },
      ] },
  ];
}

export function buildRbts(state: string): RBT[] {
  const r = REGIONS_BY_STATE[state] ?? REGIONS_BY_STATE.NC;
  return [
    { id: "r1", state, name: "Ava Thompson", region: r[0], bcba: "Dr. Maya Patel",
      clients: 3, scheduledHours: 32, targetHours: 32, utilization: 100,
      trainingComplete: 100, supervisionDue: false, status: "Healthy",
      upcoming: [{ day: "Mon", client: "J. Carter", hours: 4 }, { day: "Tue", client: "A. Mendez", hours: 3 }],
      attendanceConcerns: 0, onboarding: "complete" },
    { id: "r2", state, name: "Diego Ramirez", region: r[1], bcba: "Jordan Lee, BCBA",
      clients: 2, scheduledHours: 18, targetHours: 30, utilization: 60,
      trainingComplete: 100, supervisionDue: false, status: "Underutilized",
      upcoming: [{ day: "Mon", client: "M. Brooks", hours: 3 }],
      attendanceConcerns: 0, onboarding: "complete" },
    { id: "r3", state, name: "Sara Bennett", region: r[2], bcba: "Camila Ortiz, BCBA",
      clients: 3, scheduledHours: 28, targetHours: 32, utilization: 88,
      trainingComplete: 85, supervisionDue: true, status: "Needs Support",
      upcoming: [{ day: "Tue", client: "R. Patel", hours: 4 }, { day: "Wed", client: "D. Foster", hours: 3 }],
      attendanceConcerns: 1, onboarding: "complete" },
    { id: "r4", state, name: "Noah Kim", region: r[3], bcba: "Marcus Hill, BCBA",
      clients: 2, scheduledHours: 12, targetHours: 30, utilization: 40,
      trainingComplete: 70, supervisionDue: true, status: "At Risk",
      upcoming: [{ day: "Thu", client: "K. Wallace", hours: 3 }],
      attendanceConcerns: 2, onboarding: "in-progress" },
    { id: "r5", state, name: "Hannah Foster", region: r[0], bcba: "Priya Shah, BCBA",
      clients: 3, scheduledHours: 30, targetHours: 32, utilization: 94,
      trainingComplete: 100, supervisionDue: false, status: "Healthy",
      upcoming: [{ day: "Mon", client: "I. Khan", hours: 4 }],
      attendanceConcerns: 0, onboarding: "complete" },
    { id: "r6", state, name: "Liam Garcia", region: r[1], bcba: "Jordan Lee, BCBA",
      clients: 1, scheduledHours: 10, targetHours: 25, utilization: 40,
      trainingComplete: 95, supervisionDue: false, status: "Underutilized",
      upcoming: [{ day: "Wed", client: "E. Tran", hours: 3 }],
      attendanceConcerns: 0, onboarding: "complete" },
  ];
}

export type WorkforceUser = {
  id: string;
  name: string;
  email: string;
  role: "BCBA" | "RBT";
  state: string;
  region: string;
  active: true;
};

export const WORKFORCE_STATES = ["NC", "GA", "VA", "TN", "MD"] as const;

/** All BCBAs + RBTs across every state as user-management rows. */
export function allWorkforceUsers(): WorkforceUser[] {
  const out: WorkforceUser[] = [];
  for (const s of WORKFORCE_STATES) {
    buildBcbas(s).forEach((b) => out.push({
      id: `${s}-${b.id}`, name: b.name, email: emailFor(b.name),
      role: "BCBA", state: s, region: b.region, active: true,
    }));
    buildRbts(s).forEach((r) => out.push({
      id: `${s}-${r.id}`, name: r.name, email: emailFor(r.name),
      role: "RBT", state: s, region: r.region, active: true,
    }));
  }
  return out;
}