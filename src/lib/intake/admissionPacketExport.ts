/**
 * Blossom OS — CentralReach admission packet exports.
 *
 * Pure helpers so the packet prep queue can produce a CSV of the queue and a
 * human-readable packet handoff sheet per lead. Downstream CentralReach staff
 * activate the patient; these files are the handoff artifact.
 */
import type { AdmissionChecklistItem, AdmissionReadinessResult } from "./admissionReadiness";

export interface PacketExportRow {
  leadId: string;
  childName: string;
  parentName: string;
  state: string;
  owner: string;
  insurance: string;
  stage: string;
  status: string;
  requiredComplete: number;
  requiredTotal: number;
  blockers: string[];
  approvedBy: string | null;
  approvedAt: string | null;
  handoffMarkedAt: string | null;
  handoffReference: string | null;
  checklist: AdmissionChecklistItem[];
}

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const PACKET_CSV_HEADERS = [
  "Lead ID", "Child", "Parent / Guardian", "State", "Owner", "Insurance",
  "Pipeline stage", "Packet status", "Required complete", "Required total",
  "Blockers", "Approved by", "Approved at", "Handoff marked at", "Handoff reference",
] as const;

export function buildPacketQueueCsv(rows: PacketExportRow[]): string {
  const lines = [PACKET_CSV_HEADERS.join(",")];
  for (const r of rows) {
    lines.push([
      r.leadId, r.childName, r.parentName, r.state, r.owner, r.insurance,
      r.stage, r.status, r.requiredComplete, r.requiredTotal,
      r.blockers.join(" | "), r.approvedBy ?? "", r.approvedAt ?? "",
      r.handoffMarkedAt ?? "", r.handoffReference ?? "",
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function buildPacketHandoffSheet(
  row: PacketExportRow,
  readiness: AdmissionReadinessResult,
  boundaryNote: string,
): string {
  const out: string[] = [];
  out.push("CENTRALREACH ADMISSION PACKET");
  out.push("=============================");
  out.push(`Child: ${row.childName || "—"}`);
  out.push(`Parent / guardian: ${row.parentName || "—"}`);
  out.push(`State: ${row.state || "—"}`);
  out.push(`Insurance: ${row.insurance || "—"}`);
  out.push(`Intake owner: ${row.owner || "Unassigned"}`);
  out.push(`Pipeline stage: ${row.stage || "—"}`);
  out.push(`Packet status: ${row.status}`);
  out.push("");
  out.push(`Checklist (${readiness.completeCount + readiness.waivedCount}/${readiness.requiredCount} required complete)`);
  for (const item of row.checklist) {
    const mark = item.status === "complete" ? "[x]" : item.status === "waived" ? "[~]" : "[ ]";
    const detail =
      item.status === "waived"
        ? ` — waived: ${item.waivedReason ?? "no reason recorded"}`
        : item.status === "missing" && (item.missing?.length ?? 0) > 0
        ? ` — missing: ${item.missing!.join(", ")}`
        : "";
    out.push(`${mark} ${item.label}${item.required ? "" : " (optional)"}${detail}`);
  }
  out.push("");
  if (readiness.blockers.length > 0) {
    out.push(`Blocking handoff: ${readiness.blockers.join(" · ")}`);
  } else {
    out.push("Blocking handoff: none");
  }
  out.push(`Director approval: ${row.approvedBy ? `${row.approvedBy} @ ${row.approvedAt ?? "—"}` : "not approved"}`);
  if (readiness.exceptionReason) out.push(`Director exception: ${readiness.exceptionReason}`);
  out.push(`CentralReach handoff: ${row.handoffMarkedAt ? `${row.handoffMarkedAt}${row.handoffReference ? ` (ref ${row.handoffReference})` : ""}` : "not marked"}`);
  out.push("");
  out.push(boundaryNote);
  out.push(`Generated ${new Date().toISOString()}`);
  return out.join("\n");
}

/** Browser download helper. No-op outside a DOM. */
export function downloadTextFile(filename: string, contents: string, mime = "text/plain;charset=utf-8") {
  if (typeof document === "undefined") return;
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function packetFileSlug(name: string, leadId: string): string {
  const base = (name || "packet").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "packet"}-${leadId.slice(0, 8)}`;
}
