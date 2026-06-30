import type { Authorization } from "@/data/authorizations";
import type { CentralReachQARecord } from "./qaTypes";

/**
 * Project a CentralReach QA record onto the existing Authorization shape so
 * QA UI components can render either source without branching. CentralReach
 * sync is not live yet — callers should treat this as the seam.
 */
export function mapCentralReachToAuthorization(
  record: CentralReachQARecord,
): Pick<
  Authorization,
  | "id"
  | "clientId"
  | "clientName"
  | "payor"
  | "expirationDate"
  | "submittedDate"
  | "approvedDate"
  | "hours"
> {
  return {
    id: record.authorizationId ?? record.clientId,
    clientId: record.clientId,
    clientName: record.clientName,
    payor: record.serviceCode ?? "Unknown",
    expirationDate: record.authEndDate,
    submittedDate: record.authStartDate,
    approvedDate: record.authStartDate,
    hours:
      record.authorizedHours != null
        ? String(record.authorizedHours)
        : null,
  };
}

/**
 * Best-effort match a Monday-derived authorization against CentralReach
 * records when no shared id exists. Returns the first confident match by
 * normalized client name + service code, or null.
 */
export function matchAuthorizationToCentralReach(
  auth: Pick<Authorization, "clientName" | "payor">,
  records: CentralReachQARecord[],
): CentralReachQARecord | null {
  const norm = (s: string) => s.trim().toLowerCase();
  const name = norm(auth.clientName);
  return (
    records.find(
      (r) =>
        norm(r.clientName) === name &&
        (r.serviceCode ? norm(r.serviceCode) === norm(auth.payor) : true),
    ) ?? null
  );
}