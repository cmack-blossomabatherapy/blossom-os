/**
 * CentralReach QA data contract.
 *
 * Blossom OS is not yet wired to the CentralReach API. This file defines the
 * shape we expect once the sync exists, so QA pages can be powered through a
 * single adapter rather than scattering CR-specific shapes through the UI.
 */
export interface CentralReachQARecord {
  clientId: string;
  clientName: string;
  authorizationId: string | null;
  authStartDate: string | null;
  authEndDate: string | null;
  authorizedHours: number | null;
  usedHours: number | null;
  remainingHours: number | null;
  serviceCode: string | null;
  hours97153: number | null;
  supervisionHours97155: number | null;
  parentTrainingHours97156: number | null;
  lastSessionDate: string | null;
  provider: string | null;
  bcba: string | null;
  rbt: string | null;
  cancellationStatus: string | null;
  cancellationReason: string | null;
  progressReportDueDate: string | null;
  progressReportReceivedDate: string | null;
  treatmentPlanDueDate: string | null;
  treatmentPlanReceivedDate: string | null;
  noteFlags: string[];
}

export type CentralReachQAStatus =
  | "not_connected"
  | "pending_config"
  | "syncing"
  | "ready";

export interface CentralReachQASyncSnapshot {
  status: CentralReachQAStatus;
  lastSyncedAt: string | null;
  records: CentralReachQARecord[];
}