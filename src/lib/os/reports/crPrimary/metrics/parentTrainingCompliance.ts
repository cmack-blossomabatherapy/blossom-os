/**
 * Parent Training Compliance — a SEPARATE payer-policy view from the main
 * Parent Training report.
 *
 * Scope: completed, nonvoid, nondeleted BILLED 97156 in the selected calendar
 * month. Scheduled or cancelled sessions never count as delivered. 97153 is
 * activity context only — shown for awareness but never used as a denominator
 * for compliance.
 *
 * Per-client payor rule, from usable ACTIVE 97156 authorizations (CR client id
 * matched first, unambiguous normalized name as the only fallback):
 *   - Payor alias containing "peachstate" / "peach state" (normalized) => 2.0
 *     hour monthly threshold.
 *   - Exactly one other usable active 97156 authorization payor => 0.25 hour
 *     monthly threshold.
 *   - No payor documented => "No target".
 *   - More than one DISTINCT active 97156 authorization payor => "Needs Payor
 *     Review" — never picked arbitrarily.
 *
 * BCBA rollup: thresholds apply PER CLIENT, never once to a BCBA total. A BCBA
 * is Healthy only when every resolvable client meets their own threshold,
 * Monitor when any resolvable client is below. Clients with "No target" or
 * "Needs Payor Review" never force a Monitor by themselves.
 */
import { CODE_PARENT_TRAINING, CODE_DIRECT, normalizeCode } from "./codes";
import { buildClientIdentityResolver, type ClientIdentityInput } from "./clientIdentity";

export const NO_TARGET_LABEL = "No target";
export const NEEDS_PAYOR_REVIEW_LABEL = "Needs Payor Review";
export const INSUFFICIENT_DATA_LABEL = "Insufficient Data";

export const PEACHSTATE_THRESHOLD_HOURS = 2.0;
export const OTHER_PAYOR_THRESHOLD_HOURS = 0.25;

export type PtcClientStatus = "healthy" | "monitor" | "no_target" | "needs_payor_review";
export type PtcBcbaStatus = "healthy" | "monitor" | "no_target";

export interface PtcBilledInput {
  date: string | null | undefined;
  procedureCode: string | null | undefined;
  hours: number | null | undefined;
  clientName: string | null | undefined;
  clientCrId?: string | null;
  isVoid?: boolean | null;
  deleted?: boolean | null;
}

export interface PtcAuthorizationInput {
  clientName: string | null | undefined;
  clientCrId?: string | null;
  payor?: string | null;
  procedureCode?: string | null;
  serviceCodes?: string | null;
  isActive?: boolean | null;
}

function normalizePayor(v: string | null | undefined): string {
  return String(v ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function isPeachstate(payor: string | null | undefined): boolean {
  const n = normalizePayor(payor);
  return n.includes("peachstate");
}

/** True when the authorization row carries a 97156 service scope. */
function isParentTrainingAuth(a: PtcAuthorizationInput): boolean {
  return /97156/.test(`${a.procedureCode ?? ""} ${a.serviceCodes ?? ""}`);
}

export interface PtcPayorResolution {
  status: "resolved" | "no_target" | "needs_payor_review";
  payor: string | null;
  thresholdHours: number | null;
}

/**
 * Resolve one client's payor rule from their usable active 97156
 * authorizations. Distinct payors are compared on a normalized, case- and
 * whitespace-insensitive basis so trivial formatting differences don't
 * manufacture a false "Needs Payor Review".
 */
export function resolveClientPayorRule(auths: PtcAuthorizationInput[]): PtcPayorResolution {
  const usable = auths.filter((a) => a.isActive !== false && isParentTrainingAuth(a));
  const distinctPayors = new Map<string, string>();
  for (const a of usable) {
    const raw = String(a.payor ?? "").trim();
    if (!raw) continue;
    const key = normalizePayor(raw);
    if (!key) continue;
    if (!distinctPayors.has(key)) distinctPayors.set(key, raw);
  }
  if (distinctPayors.size === 0) {
    return { status: "no_target", payor: null, thresholdHours: null };
  }
  if (distinctPayors.size > 1) {
    return { status: "needs_payor_review", payor: null, thresholdHours: null };
  }
  const [payor] = [...distinctPayors.values()];
  const thresholdHours = isPeachstate(payor) ? PEACHSTATE_THRESHOLD_HOURS : OTHER_PAYOR_THRESHOLD_HOURS;
  return { status: "resolved", payor, thresholdHours };
}

export interface PtcClientRow {
  clientKey: string;
  client: string;
  clientCrId: string;
  bcba: string;
  payor: string | null;
  completed97156Hours: number;
  completed97153Hours: number;
  thresholdHours: number | null;
  gapHours: number | null;
  status: PtcClientStatus;
  reason: string;
}

export interface PtcBcbaRow {
  bcba: string;
  completed97156Hours: number;
  completed97153Hours: number;
  status: PtcBcbaStatus;
  clientKeys: string[];
}

export interface PtcAnalysis {
  clientRows: PtcClientRow[];
  bcbaRows: PtcBcbaRow[];
}

export interface PtcComputeInput {
  billed: PtcBilledInput[];
  authorizations: PtcAuthorizationInput[];
  resolveOwner: (s: { clientName?: string | null; clientCrId?: string | null; date?: string | null }) => string | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const UNOWNED = "Unassigned";

export function computeParentTrainingCompliance({
  billed,
  authorizations,
  resolveOwner,
}: PtcComputeInput): PtcAnalysis {
  const identity = buildClientIdentityResolver(
    billed as unknown as ClientIdentityInput[],
    authorizations as unknown as ClientIdentityInput[],
  );

  const billedActive = billed.filter((r) => !r.isVoid && !r.deleted);

  const clients = new Map<
    string,
    { client: string; clientCrId: string; hours97156: number; hours97153: number }
  >();
  for (const r of billedActive) {
    const code = normalizeCode(r.procedureCode);
    if (code !== CODE_PARENT_TRAINING && code !== CODE_DIRECT) continue;
    const name = String(r.clientName ?? "").trim();
    if (!name) continue;
    const key = identity.keyFor(r.clientCrId, name);
    if (!clients.has(key)) {
      clients.set(key, { client: name, clientCrId: String(r.clientCrId ?? "").trim(), hours97156: 0, hours97153: 0 });
    }
    const entry = clients.get(key)!;
    if (!entry.clientCrId && r.clientCrId) entry.clientCrId = String(r.clientCrId).trim();
    const hrs = Number.isFinite(Number(r.hours)) ? Number(r.hours) : 0;
    if (code === CODE_PARENT_TRAINING) entry.hours97156 += hrs;
    else entry.hours97153 += hrs;
  }

  const authsByClient = new Map<string, PtcAuthorizationInput[]>();
  for (const a of authorizations) {
    const key = identity.keyFor(a.clientCrId, a.clientName);
    if (!authsByClient.has(key)) authsByClient.set(key, []);
    authsByClient.get(key)!.push(a);
  }

  const clientRows: PtcClientRow[] = [];
  for (const [key, c] of clients) {
    const auths = authsByClient.get(key) ?? [];
    const resolution = resolveClientPayorRule(auths);
    const bcba =
      resolveOwner({ clientName: c.client, clientCrId: c.clientCrId || null, date: null }) ?? UNOWNED;

    let status: PtcClientStatus;
    let reason: string;
    let gapHours: number | null = null;
    const completed = round2(c.hours97156);

    if (resolution.status === "no_target") {
      status = "no_target";
      reason = "No 97156 payor documented on an active authorization — No target.";
    } else if (resolution.status === "needs_payor_review") {
      status = "needs_payor_review";
      reason = "More than one distinct active 97156 authorization payor documented — Needs Payor Review.";
    } else {
      const threshold = resolution.thresholdHours as number;
      gapHours = round2(Math.max(0, threshold - completed));
      if (completed >= threshold) {
        status = "healthy";
        reason = `Completed ${completed} hr of 97156 meets the ${threshold} hr monthly threshold for ${resolution.payor}.`;
      } else {
        status = "monitor";
        reason = `Completed ${completed} hr of 97156 is below the ${threshold} hr monthly threshold for ${resolution.payor} (gap ${gapHours} hr).`;
      }
    }

    clientRows.push({
      clientKey: key,
      client: c.client,
      clientCrId: c.clientCrId,
      bcba,
      payor: resolution.payor,
      completed97156Hours: completed,
      completed97153Hours: round2(c.hours97153),
      thresholdHours: resolution.status === "resolved" ? (resolution.thresholdHours as number) : null,
      gapHours,
      status,
      reason,
    });
  }

  clientRows.sort((a, b) => a.client.localeCompare(b.client));

  const bcbaMap = new Map<string, PtcBcbaRow>();
  for (const row of clientRows) {
    if (!bcbaMap.has(row.bcba)) {
      bcbaMap.set(row.bcba, {
        bcba: row.bcba,
        completed97156Hours: 0,
        completed97153Hours: 0,
        status: "no_target",
        clientKeys: [],
      });
    }
    const g = bcbaMap.get(row.bcba)!;
    g.completed97156Hours = round2(g.completed97156Hours + row.completed97156Hours);
    g.completed97153Hours = round2(g.completed97153Hours + row.completed97153Hours);
    g.clientKeys.push(row.clientKey);
  }

  for (const g of bcbaMap.values()) {
    const resolvable = clientRows.filter(
      (r) => g.clientKeys.includes(r.clientKey) && (r.status === "healthy" || r.status === "monitor"),
    );
    if (resolvable.length === 0) {
      g.status = "no_target";
    } else if (resolvable.some((r) => r.status === "monitor")) {
      g.status = "monitor";
    } else {
      g.status = "healthy";
    }
  }

  const bcbaRows = [...bcbaMap.values()].sort((a, b) => a.bcba.localeCompare(b.bcba));

  return { clientRows, bcbaRows };
}
