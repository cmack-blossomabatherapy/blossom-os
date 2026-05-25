import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Authorization, AuthStage, AuthType } from "@/data/authorizations";

/**
 * Live authorizations sourced from the `monday_authorizations_raw` import.
 * Maps each Monday row into the existing Authorization shape used by the
 * Authorizations workspace so we get the full UI without duplicating it.
 */

const PAGE_SIZE = 1000;

interface RawAuthRow {
  id: string;
  monday_item_id: string | null;
  monday_group: string | null;
  name: string | null;
  state: string | null;
  status: string | null;
  owner: string | null;
  data: Record<string, unknown>;
  updated_at: string;
  imported_at: string;
}

function pickIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
function pickString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length ? v : null;
}
function truthyText(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v.length > 0 && v !== "no" && v !== "false" && v !== "n/a" && v !== "none";
}

function mapStage(status: string | null, group: string | null): AuthStage {
  const s = (status ?? "").trim();
  switch (s) {
    case "Approved":
    case "Partial Approval":
      return "Approved";
    case "Denied":
      return "Denied";
    case "Expiring Soon":
      return "Expiring Soon";
    case "Flaked Client":
    case "Cancelled":
    case "NAR":
      return "Flaked Client";
    case "In QA Review":
      return "In QA Review";
    case "Submitted":
    case "Pending-rec'd in process":
      return "Submitted";
    case "Awaiting Submission":
      return "Awaiting Submission";
  }
  // Fall back to the monday group bucket when status is unfamiliar.
  const g = (group ?? "").trim();
  if (g === "Approved") return "Approved";
  if (g === "Denied") return "Denied";
  if (g === "Expiring Soon" || g === "Expired") return "Expiring Soon";
  if (g === "Flaked") return "Flaked Client";
  if (g === "QA Review") return "In QA Review";
  if (g.startsWith("Pending")) return "Submitted";
  return "Awaiting Submission";
}

function mapType(group: string | null): AuthType {
  const g = (group ?? "").trim();
  if (g === "Pending IA" || g === "Pending Initial Treatment") return "Initial";
  if (g === "Pending Concurrent" || g === "Pending RA") return "Reauth";
  return "Treatment";
}

function daysBetween(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function mapRow(row: RawAuthRow): Authorization & { liveBcba: string | null } {
  const data = row.data ?? {};
  const stage = mapStage(row.status, row.monday_group);
  const submitted = pickIsoDate(data["Date Submitted"]);
  const approved = pickIsoDate(data["Date Reviewed"]);
  const expiration = pickIsoDate(data["Auth Exp. Date"]);
  const prDue = pickIsoDate(data["PR Due Date"]);
  const denialReason = pickString(data["Denial Reason"]);
  const insurance = pickString(data["Insurance"]) ?? "Unknown";
  const units = pickString(data["Code(s)/Units"]);
  const bcba = pickString(data["Active BCBA"]);
  const coordinator =
    pickString(row.owner) ?? pickString(data["Person"]) ?? "Unassigned";
  const missingInfo = truthyText(data["Missing Information"]);
  const id = row.monday_item_id || row.id;

  const nextAction = (() => {
    switch (stage) {
      case "Awaiting Submission": return "Submit authorization packet";
      case "Submitted": return "Awaiting payor decision";
      case "In QA Review": return "Complete QA review";
      case "Approved": return expiration ? `Approved · expires ${expiration}` : "Approved";
      case "Denied": return denialReason ? `Address denial: ${denialReason}` : "Address denial reason";
      case "Expiring Soon": return "Initiate reauthorization";
      case "Flaked Client": return "Confirm client status";
    }
  })();

  return {
    id,
    clientId: id,
    clientName: row.name?.trim() || "Unnamed client",
    state: row.state?.trim() || "—",
    payor: insurance,
    authType: mapType(row.monday_group),
    stage,
    coordinator,
    qaOwner: stage === "In QA Review" ? coordinator : null,
    qaStatus: stage === "In QA Review" ? "In Review" : stage === "Approved" ? "Complete" : "Not Started",
    qaNotes: null,
    submittedDate: submitted,
    approvedDate: approved,
    expirationDate: expiration,
    hours: units,
    daysInStage: daysBetween(row.updated_at),
    riskLevel: stage === "Denied" || stage === "Expiring Soon" ? "High"
      : stage === "In QA Review" || stage === "Awaiting Submission" ? "Medium" : "Low",
    missingInfo,
    treatmentPlanReceived: stage !== "Awaiting Submission",
    documents: [],
    missingRequirements: missingInfo ? ["Listed in Monday: Missing Information"] : [],
    nextAction,
    nextTaskDue: prDue ?? expiration,
    lastActivity: row.updated_at,
    tasks: [],
    timeline: [
      {
        id: "imported",
        type: "system",
        description: `Imported from Monday (group: ${row.monday_group ?? "—"})`,
        timestamp: row.imported_at,
      },
    ],
    automationLog: [],
    denialReason: denialReason ?? undefined,
    liveBcba: bcba,
  };
}

export interface LiveAuthorizations {
  loading: boolean;
  error: string | null;
  items: Authorization[];
  /**
   * Same as `items`, but `coordinator` is overwritten with the actual
   * `Active BCBA` (from Monday) when one exists. QA pages display this
   * field as "BCBA", so this gives them the correct attribution without
   * affecting non-QA consumers that still need the auth coordinator.
   */
  qaItems: Authorization[];
  bcbaById: Map<string, string>;
  totalRows: number;
}

export function useLiveAuthorizations(): LiveAuthorizations {
  const [rows, setRows] = useState<RawAuthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const all: RawAuthRow[] = [];
        for (let page = 0; ; page++) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;
          const { data, error: qErr } = await supabase
            .from("monday_authorizations_raw")
            .select("id,monday_item_id,monday_group,name,state,status,owner,data,updated_at,imported_at")
            .order("updated_at", { ascending: false })
            .range(from, to);
          if (qErr) throw qErr;
          const chunk = (data ?? []) as unknown as RawAuthRow[];
          all.push(...chunk);
          if (chunk.length < PAGE_SIZE) break;
          if (page > 20) break;
        }
        if (!cancelled) setRows(all);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load authorizations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return useMemo(() => {
    const mapped = rows
      .filter((r) => (r.status ?? "").toLowerCase() !== "duplicate")
      .map(mapRow);
    const bcbaById = new Map<string, string>();
    const items: Authorization[] = mapped.map(({ liveBcba, ...auth }) => {
      if (liveBcba) bcbaById.set(auth.id, liveBcba);
      return auth;
    });
    const qaItems: Authorization[] = items.map((a) => {
      const bcba = bcbaById.get(a.id);
      return bcba ? { ...a, coordinator: bcba } : a;
    });
    return { loading, error, items, qaItems, bcbaById, totalRows: rows.length };
  }, [rows, loading, error]);
}