/**
 * CentralReach data contract for Behavioral Support workflows.
 *
 * Blossom OS is not yet wired to the CentralReach API. This contract defines
 * the shape expected once a live sync exists so Behavioral Support pages can
 * be powered by a single adapter, and so Behavioral Support records store the
 * CentralReach IDs needed to reconcile bidirectional sync later.
 */
export interface CentralReachBehavioralSupportRecord {
  clientId: string;
  clientName: string;
  dateOfService: string | null;
  provider: string | null;
  bcba: string | null;
  rbt: string | null;
  procedureCode: string | null;
  hours97153: number | null;
  supervisionHours97155: number | null;
  parentTrainingHours97156: number | null;
  cancellations: number | null;
  noShows: number | null;
  lastSessionDate: string | null;
  lastBcbaSupervisionDate: string | null;
  authorizationId: string | null;
  authStartDate: string | null;
  authEndDate: string | null;
  progressReportDueDate: string | null;
  treatmentPlanDueDate: string | null;
  treatmentPlanReceivedDate: string | null;
  noteFlags: string[];
  serviceLocation: string | null;
  state: string | null;
}

export interface BehavioralSupportSupervisionSignal {
  clientName: string;
  state: string | null;
  bcbaName: string | null;
  rbtName: string | null;
  daysSinceLastBcbaSupervision: number | null;
  supervisionRatio: number | null; // 97155 / 97153
  parentTrainingHoursLast30d: number | null;
  cancellationsLast30d: number;
  riskFlags: string[];
  centralreachClientId: string | null;
}

export type CentralReachBSStatus = "not_connected" | "pending_config" | "syncing" | "ready";

export interface CentralReachBSSyncSnapshot {
  status: CentralReachBSStatus;
  lastSyncedAt: string | null;
  message?: string;
}