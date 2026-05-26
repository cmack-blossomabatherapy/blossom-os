import { mockClients, type Client } from "./clients";
import { mockRBTProfiles, type RBTProfile } from "./staffing";

export type ClinicStatus = "Open" | "Expanding" | "Full" | "Remote";

export interface Clinic {
  id: string;
  name: string;
  state: string;
  address: string;
  manager: string;
  director: string;
  status: ClinicStatus;
  capacity: number; // max active clients
  isPhysical: boolean;
}

export const mockClinics: Clinic[] = [];

export interface ClinicMetrics {
  clinic: Clinic;
  activeClients: number;
  pendingStarts: number;
  staffingNeeded: number;
  assessmentsThisWeek: number;
  totalClients: number;
  utilizationPct: number;
  rbtCount: number;
  rbtCapacityHours: number;
  rbtAssignedHours: number;
  alerts: { level: "destructive" | "warning"; message: string }[];
}

const clientsForClinic = (clinicName: string): Client[] => {
  if (clinicName === "In-Home Services") {
    return mockClients.filter((c) => c.clinic === "Remote");
  }
  return mockClients.filter((c) => c.clinic === clinicName);
};

const rbtsForClinic = (clinicName: string): RBTProfile[] => {
  if (clinicName === "In-Home Services") return [];
  return mockRBTProfiles.filter((r) => r.clinic === clinicName);
};

export const getClinicMetrics = (clinic: Clinic): ClinicMetrics => {
  const clients = clientsForClinic(clinic.name);
  const activeClients = clients.filter((c) => c.stage === "Active").length;
  const pendingStarts = clients.filter((c) => c.stage === "Pending Start Date").length;
  const staffingNeeded = clients.filter(
    (c) => c.stage === "Staffing Needed" || c.stage === "Restaffing Needed",
  ).length;
  const assessmentsThisWeek = clients.filter((c) => c.stage === "Assessment Scheduled").length;

  const rbts = rbtsForClinic(clinic.name);
  const rbtCapacityHours = rbts.reduce((s, r) => s + r.capacityHours, 0);
  const rbtAssignedHours = rbts.reduce((s, r) => s + r.assignedHours, 0);
  const utilizationPct = clinic.capacity > 0 ? (activeClients / clinic.capacity) * 100 : 0;

  const alerts: ClinicMetrics["alerts"] = [];
  if (utilizationPct >= 95) alerts.push({ level: "destructive", message: "Clinic at capacity" });
  if (staffingNeeded >= 5) alerts.push({ level: "destructive", message: "Staffing shortage" });
  else if (staffingNeeded >= 3) alerts.push({ level: "warning", message: "Staffing demand rising" });
  if (pendingStarts >= 5) alerts.push({ level: "warning", message: "Pending starts piling up" });
  const stuckBeforeStaffing = clients.filter(
    (c) => (c.stage === "Pending Treatment Auth" || c.stage === "In QA") && c.daysInStage > 7,
  ).length;
  if (stuckBeforeStaffing >= 3) {
    alerts.push({ level: "destructive", message: "Too many clients stuck before staffing" });
  }
  if (rbtCapacityHours > 0 && rbtAssignedHours / rbtCapacityHours < 0.4) {
    alerts.push({ level: "warning", message: "Schedule gaps · low utilization" });
  }

  return {
    clinic,
    activeClients,
    pendingStarts,
    staffingNeeded,
    assessmentsThisWeek,
    totalClients: clients.length,
    utilizationPct,
    rbtCount: rbts.length,
    rbtCapacityHours,
    rbtAssignedHours,
    alerts,
  };
};

export const getAllClinicMetrics = (): ClinicMetrics[] =>
  mockClinics.map(getClinicMetrics);

export const findClinic = (id: string): Clinic | undefined =>
  mockClinics.find((c) => c.id === id);

export const getClinicClients = (clinic: Clinic): Client[] => clientsForClinic(clinic.name);
export const getClinicRBTs = (clinic: Clinic): RBTProfile[] => rbtsForClinic(clinic.name);

// Pipeline lanes scoped to a clinic — mirrors main lifecycle
export const clinicPipelineStages = []as const;

export const clinicStatusVariant = (
  s: ClinicStatus,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const m: Record<ClinicStatus, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    Open: "success",
    Expanding: "info",
    Full: "destructive",
    Remote: "muted",
  };
  return m[s];
};
