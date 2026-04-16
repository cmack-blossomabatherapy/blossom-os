import { mockClients, type Client } from "./clients";
import { mockRBTs, type RBT } from "./scheduling";

export type RBTStatus = "Active" | "Onboarding" | "Inactive";

export interface RBTProfile extends RBT {
  status: RBTStatus;
  hireDate: string;
  performanceTags: string[];
  assignedClientIds: string[];
  matchHistory: { date: string; clientName: string; event: "Assigned" | "Removed" | "Flaked" }[];
  tasks: { id: string; title: string; completed: boolean }[];
  timeline: { date: string; event: string }[];
}

// Decorate the existing RBT roster with profile data
export const mockRBTProfiles: RBTProfile[] = mockRBTs.map((r, idx) => {
  const status: RBTStatus = idx === 3 ? "Onboarding" : idx === 5 ? "Onboarding" : "Active";
  const assignedClientIds = mockClients
    .filter((c) => c.rbt && c.rbt.toLowerCase().includes(r.name.split(" ")[0].toLowerCase()))
    .map((c) => c.id);
  return {
    ...r,
    status,
    hireDate: ["2024-08-15", "2025-01-10", "2024-05-20", "2026-02-01", "2024-11-03", "2026-01-22"][idx] ?? "2025-01-01",
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
      { id: "t2", title: "Complete onboarding modules", completed: status === "Active" },
    ],
    timeline: [
      { date: "2024-08-15", event: "Hired" },
      { date: "2025-02-01", event: "First client assigned" },
    ],
  };
});

export type StaffingClientNeed = {
  client: Client;
  reason: "Staffing Needed" | "Restaffing Needed" | "Ready to Assign";
  priority: "High" | "Medium" | "Low";
  daysWaiting: number;
  requiredHours: number;
};

export const getClientStaffingNeeds = (): StaffingClientNeed[] => {
  return mockClients
    .filter(
      (c) =>
        c.stage === "Staffing Needed" ||
        c.stage === "Restaffing Needed" ||
        (c.stage === "Pending Start Date" && !c.rbt),
    )
    .map((c) => {
      const reason: StaffingClientNeed["reason"] =
        c.stage === "Restaffing Needed"
          ? "Restaffing Needed"
          : c.stage === "Pending Start Date"
            ? "Ready to Assign"
            : "Staffing Needed";
      const priority: StaffingClientNeed["priority"] =
        c.daysInStage > 10 ? "High" : c.daysInStage > 5 ? "Medium" : "Low";
      return {
        client: c,
        reason,
        priority,
        daysWaiting: c.daysInStage,
        requiredHours: 20,
      };
    });
};

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
    Active: "success",
    Onboarding: "info",
    Inactive: "muted",
  };
  return m[s];
};

export const findProfileById = (id: string): RBTProfile | undefined =>
  mockRBTProfiles.find((r) => r.id === id);
