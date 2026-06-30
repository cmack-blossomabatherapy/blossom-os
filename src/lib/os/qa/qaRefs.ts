import type { Authorization } from "@/data/authorizations";
import type { QAWorkItemRef } from "@/lib/os/qa/qaWorkflowStore";

/**
 * Build a QA work-item ref from an Authorization shape. QA pages source
 * their rows from `useLiveAuthorizations()` which merges Monday raw rows,
 * operational overlay rows, and (later) CentralReach-synced records.
 *
 * `sourceSystem` is auto-detected from the optional source map (returned
 * by `useLiveAuthorizations().sourceById`). Defaults to
 * `monday_authorizations_raw` because that's where the majority of rows
 * live today.
 *
 * `clientId` is intentionally left null when we only have a Monday item id:
 * Monday ids are NOT client UUIDs. Pretending they are would corrupt the
 * `client_qa_reviews` table.
 */
export function toQAWorkItemRef(
  auth: Pick<Authorization, "id" | "clientId">,
  sourceSystem?: "monday" | "manual" | "centralreach",
): QAWorkItemRef {
  const mapped =
    sourceSystem === "centralreach"
      ? "centralreach_qa_records"
      : sourceSystem === "manual"
        ? "authorization_operational_records"
        : "monday_authorizations_raw";
  return {
    sourceSystem: mapped,
    sourceRecordId: auth.id,
    mondayItemId: sourceSystem === "centralreach" || sourceSystem === "manual" ? null : auth.id,
    // Only attach a clientId if it's a real UUID (overlay path may inject one
    // upstream); never trust the Monday id as a client UUID.
    clientId: null,
  };
}