import { mockClients, type Client } from "./clients";
import { mockRBTs, type Availability, type RBT } from "./scheduling";

export type RBTStatus = "Available" | "Assigned" | "Full" | "Inactive";
export type StaffingMatchStatus = "Suggested" | "Pending" | "Assigned" | "Rejected";

export interface RBTProfile extends RBT {
  status: RBTStatus;
  hireDate: string;
  zip: string;
  region: string;
  travelRadius: number;
  performanceTags: string[];
  assignedClientIds: string[];
  matchHistory: { date: string; clientName: string; event: "Assigned" | "Removed" | "Flaked" }[];
  tasks: { id: string; title: string; completed: boolean }[];
  timeline: { date: string; event: string }[];
}

export interface StaffingMatch {
  clientId: string;
  rbtId: string;
  rbtName: string;
  status: StaffingMatchStatus;
  score: number;
  distanceMiles: number;
  availabilityOverlap: Availability[];
  capacityRemaining: number;
  notes: string;
}

// Decorate the existing RBT roster with profile data
export const mockRBTProfiles: RBTProfile[] = mockRBTs.map((r, idx) => {
  const remaining = r.capacityHours - r.assignedHours;
  const status: RBTStatus = remaining <= 0 ? "Full" : remaining < 8 ? "Assigned" : idx === 5 ? "Inactive" : "Available";
  const assignedClientIds = mockClients
    .filter((c) => c.rbt && c.rbt.toLowerCase().includes(r.name.split(" ")[0].toLowerCase()))
    .map((c) => c.id);
  return {
    ...r,
    status,
    hireDate: ["2024-08-15", "2025-01-10", "2024-05-20", "2026-02-01", "2024-11-03", "2026-01-22"][idx] ?? "2025-01-01",
    zip: ["30092", "30274", "78701", "78704", "85020", "30092"][idx] ?? "00000",
    region: `${r.state} · ${r.clinic}`,
    travelRadius: [18, 25, 20, 15, 22, 10][idx] ?? 15,
    performanceTags: [
      ["Reliable", "Top Performer"],
      ["Flexible"],
      ["Senior", "Mentor"],
      ["New Hire"],
      ["Reliable"],
      ["New Hire"],
    ][idx] ?? [],
    assignedClientIds,
    matchHistory: [
      { date: "2026-03-10", clientName: "Aiden Patel", event: "Assigned" as const },
      { date: "2026-02-14", clientName: "Liam Chen", event: "Removed" as const },
    ].slice(0, idx % 3),
    tasks: [
      { id: "t1", title: "Confirm weekly availability", completed: idx % 2 === 0 },
      { id: "t2", title: "Complete onboarding modules", completed: status !== "Inactive" },
    ],
    timeline: [
      { date: "2024-08-15", event: "Hired" },
      { date: "2025-02-01", event: "First client assigned" },
    ],
  };
});

export type StaffingClientNeed = {
  client: Client;
  reason: "Staffing Needed" | "Matching" | "RBT Assigned" | "Restaffing Needed";
  priority: "High" | "Medium" | "Low";
  daysWaiting: number;
  requiredHours: number;
  availability: Availability[];
  zip: string;
  region: string;
  alert: string | null;
};

export const getClientStaffingNeeds = (): StaffingClientNeed[] => {
  return mockClients
    .filter(
      (c) =>
        c.stage === "Staffing Needed" ||
        c.stage === "Matching in Progress" ||
        c.stage === "RBT Assigned" ||
        c.stage === "Restaffing Needed" ||
        c.stage === "Pending Start Date" ||
        c.staffingStatus === "Needed" ||
        c.staffingStatus === "In Progress" ||
        c.staffingStatus === "Assigned",
    )
    .map((c) => {
      const reason: StaffingClientNeed["reason"] =
        c.stage === "Restaffing Needed"
          ? "Restaffing Needed"
          : c.stage === "Matching in Progress" || c.staffingStatus === "In Progress"
            ? "Matching"
          : c.stage === "Pending Start Date" || c.stage === "RBT Assigned" || c.staffingStatus === "Assigned"
            ? "RBT Assigned"
            : "Staffing Needed";
      const priority: StaffingClientNeed["priority"] =
        c.daysInStage > 10 ? "High" : c.daysInStage > 5 ? "Medium" : "Low";
      const availability = c.schedule.length > 0 ? Array.from(new Set(c.schedule.map((s) => Number(s.start.split(":")[0]) < 12 ? "morning" : Number(s.start.split(":")[0]) < 16 ? "afternoon" : "evening"))) as Availability[] : (["morning", "afternoon"] as Availability[]);
      const regionRbts = mockRBTProfiles.filter((r) => r.state === c.state && r.status !== "Inactive");
      const availableRegionRbts = regionRbts.filter((r) => r.capacityHours - r.assignedHours >= 4);
      const alert = c.stage === "Restaffing Needed"
        ? "Restaffing urgent"
        : c.daysInStage > 5 && !c.rbt
          ? "Client waiting > 5 days"
          : availableRegionRbts.length === 0
            ? "No available RBT in region"
            : c.authStatus === "Approved" && !c.rbt
              ? "Ready client not staffed"
              : null;
      return {
        client: c,
        reason,
        priority,
        daysWaiting: c.daysInStage,
        requiredHours: c.authorizations.find((a) => a.type === "Treatment" || a.type === "Reauth")?.approvedHours ?? (Number.parseInt(c.authorizations.find((a) => a.type === "Treatment" || a.type === "Reauth")?.hours ?? "20", 10) || 20),
        availability,
        zip: c.state === "GA" ? "30092" : c.state === "TX" ? "78701" : "85020",
        region: `${c.state} · ${c.clinic}`,
        alert,
      };
    });
};

export const scoreStaffingMatch = (need: StaffingClientNeed, rbt: RBTProfile): StaffingMatch => {
  const capacityRemaining = rbt.capacityHours - rbt.assignedHours;
  const availabilityOverlap = rbt.availability.filter((slot) => need.availability.includes(slot));
  const sameState = rbt.state === need.client.state;
  const sameClinic = rbt.clinic === need.client.clinic;
  const distanceMiles = sameClinic ? 4 : sameState ? 16 : 75;
  const capacityScore = Math.min(30, Math.max(0, capacityRemaining / Math.max(need.requiredHours, 1) * 30));
  const availabilityScore = Math.min(30, availabilityOverlap.length * 15);
  const locationScore = sameClinic ? 25 : sameState && distanceMiles <= rbt.travelRadius ? 18 : sameState ? 8 : 0;
  const experienceScore = rbt.experience === "Senior" ? 10 : rbt.experience === "Mid" ? 7 : 4;
  const priorityScore = need.priority === "High" ? 5 : need.priority === "Medium" ? 3 : 1;
  const overCapacityPenalty = capacityRemaining < need.requiredHours ? 12 : 0;
  return {
    clientId: need.client.id,
    rbtId: rbt.id,
    rbtName: rbt.name,
    status: "Suggested",
    score: Math.max(0, Math.round(capacityScore + availabilityScore + locationScore + experienceScore + priorityScore - overCapacityPenalty)),
    distanceMiles,
    availabilityOverlap,
    capacityRemaining,
    notes: capacityRemaining < need.requiredHours ? "Partial availability — manual review" : sameState ? "Strong regional fit" : "Out of region",
  };
};

export const suggestStaffingMatches = (need: StaffingClientNeed): StaffingMatch[] =>
  mockRBTProfiles
    .filter((r) => r.status !== "Inactive")
    .map((r) => scoreStaffingMatch(need, r))
    .filter((m) => m.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

export type CapacityRow = {
  region: string;
  totalRBTs: number;
  availableHours: number;
  neededHours: number;
  gap: number;
};

export const getCapacityMap = (): CapacityRow[] => {
  const states = Array.from(new Set(mockRBTProfiles.map((r) => r.state)));
  return states.map((state) => {
    const rbts = mockRBTProfiles.filter((r) => r.state === state);
    const availableHours = rbts.reduce((s, r) => s + (r.capacityHours - r.assignedHours), 0);
    const totalCapacity = rbts.reduce((s, r) => s + r.capacityHours, 0);
    const neededHours = mockClients
      .filter((c) => c.state === state && (c.stage === "Staffing Needed" || c.stage === "Restaffing Needed"))
      .length * 20;
    return {
      region: state,
      totalRBTs: rbts.length,
      availableHours,
      neededHours: neededHours + Math.round(totalCapacity * 0.7),
      gap: availableHours - (neededHours + Math.round(totalCapacity * 0.7)),
    };
  });
};

export const getRBTUtilization = (r: RBTProfile): number =>
  r.capacityHours > 0 ? (r.assignedHours / r.capacityHours) * 100 : 0;

export const utilizationVariant = (
  pct: number,
): "default" | "success" | "warning" | "destructive" | "muted" => {
  if (pct >= 95) return "destructive";
  if (pct >= 75) return "warning";
  if (pct >= 30) return "success";
  return "muted";
};

export const statusVariant = (
  s: RBTStatus,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const m: Record<RBTStatus, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    Available: "success",
    Assigned: "warning",
    Full: "destructive",
    Inactive: "muted",
  };
  return m[s];
};

export const findProfileById = (id: string): RBTProfile | undefined =>
  mockRBTProfiles.find((r) => r.id === id);
