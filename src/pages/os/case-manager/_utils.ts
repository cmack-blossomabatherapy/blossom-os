/**
 * Case Manager shared UTILITIES ONLY.
 *
 * This file MUST NOT export React components. It exists so `_shared.tsx`
 * (components-only) can stay Fast-Refresh clean per the react-refresh
 * lint rule ("Fast refresh only works when a file only exports
 * components. Use a new file to share constants or functions").
 *
 * Anything that is not a React component / hook belongs in here.
 */

/* ============================================================
 * Form value types
 * ------------------------------------------------------------
 * FormDialog values are keyed by field name. Because we render
 * strings, checkboxes (booleans) and empty defaults, the safe
 * shared type is `unknown`. Pages narrow with the helpers below
 * instead of scattering `any` casts.
 * ============================================================ */

export type CMFormValue = unknown;
export type CMFormValues = Record<string, CMFormValue>;

export function stringValue(v: CMFormValue): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

export function stringOrNull(v: CMFormValue): string | null {
  const s = stringValue(v);
  return s.length ? s : null;
}

export function booleanValue(v: CMFormValue): boolean {
  return !!v;
}

export function dateTimeIsoOrNull(v: CMFormValue): string | null {
  const s = stringValue(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/* ------------ Field def used by FormDialog ------------ */

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "datetime" | "checkbox";
  /**
   * Select options. Either a plain string list (legacy behavior — value === label)
   * or a `{ value, label }` list where `value` is the durable identifier that
   * gets submitted. Case Manager family selects use the object form so we
   * submit a stable client_id / assignment_id, not a display name.
   */
  options?: Array<string | { value: string; label: string }>;
  required?: boolean;
  placeholder?: string;
  defaultValue?: CMFormValue;
};

/* ------------ Tone helpers ------------ */

export type Tone = "calm" | "warm" | "cool" | "amber" | "alert" | "violet";

export function priorityTone(p?: string | null): Tone {
  if (!p) return "calm";
  const lower = p.toLowerCase();
  if (lower === "urgent" || lower === "critical") return "alert";
  if (lower === "high") return "amber";
  if (lower === "low") return "calm";
  return "cool";
}

export function statusTone(s?: string | null): Tone {
  const lower = (s ?? "").toLowerCase();
  if (["resolved", "closed", "completed", "done"].includes(lower)) return "calm";
  if (["overdue", "urgent"].includes(lower)) return "alert";
  if (["waiting", "in_progress", "in progress"].includes(lower)) return "amber";
  return "cool";
}

/* ============================================================
 * Family option helpers
 * ============================================================ */

export type CMAssignmentLike = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  state: string | null;
  centralreach_client_id?: string | null;
};

export type CMFamilyOption = {
  value: string;              // client_id if present, else assignment id
  label: string;              // "Smith Family - NC - CR 12345"
  client_id: string | null;
  client_name: string | null;
  state: string | null;
  assignment_id: string;
  centralreach_client_id: string | null;
};

export function familySelectOptions(assignments: CMAssignmentLike[]): CMFamilyOption[] {
  return assignments
    .filter((a) => a.client_name)
    .map((a) => {
      const value = a.client_id ?? a.id;
      const parts = [a.client_name as string];
      if (a.state) parts.push(a.state);
      if (a.centralreach_client_id) parts.push(`CR ${a.centralreach_client_id}`);
      return {
        value,
        label: parts.join(" - "),
        client_id: a.client_id,
        client_name: a.client_name,
        state: a.state,
        assignment_id: a.id,
        centralreach_client_id: a.centralreach_client_id ?? null,
      };
    });
}

export function familyOptionByValue(
  assignments: CMAssignmentLike[],
  value: string | null | undefined,
): CMFamilyOption | null {
  if (!value) return null;
  return familySelectOptions(assignments).find((o) => o.value === value) ?? null;
}

/**
 * Spread this onto the payload of any Case Manager write that carries client
 * identity so we always store the durable client_id (when known) alongside a
 * display-friendly client_name and state. Never sends the raw option value as
 * client_name.
 */
export function familyContext(opt: CMFamilyOption | null | undefined) {
  return {
    client_id: opt?.client_id ?? null,
    client_name: opt?.client_name ?? null,
    state: opt?.state ?? null,
  };
}

/* ============================================================
 * Case Manager durable client matching
 * ------------------------------------------------------------
 * Real Blossom data has duplicate patient names, nicknames,
 * middle initials, CentralReach formatting differences, and
 * Monday-imported names that don't always match Blossom client
 * rows. We must NEVER trust `client_name` as the primary join.
 *
 * The rule for every Case Manager live-status lookup is:
 *   1. Match by Blossom OS `client_id` (uuid) when available.
 *   2. Match by `centralreach_client_id` when available.
 *   3. Match by normalized client name as a LAST fallback.
 *
 * These helpers centralize that policy so no Case Manager page
 * ships name-first matching to production.
 * ============================================================ */

export type CaseManagerClientMatchKeys = {
  clientId: string | null;
  centralReachClientId: string | null;
  normalizedClientName: string | null;
};

export function normalizeClientName(v: string | null | undefined): string | null {
  if (!v) return null;
  const n = String(v)
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return n.length ? n : null;
}

export function matchKeysForAssignment(a: CMAssignmentLike): CaseManagerClientMatchKeys {
  return {
    clientId: a.client_id ?? null,
    centralReachClientId: a.centralreach_client_id ?? null,
    normalizedClientName: normalizeClientName(a.client_name),
  };
}

/**
 * Find the live authorization record for a Case Manager assignment.
 * Prefers CentralReach client id (via `auth.metaById`), then falls
 * back to normalized clientName. Returns null when nothing matches.
 */
export function findAuthorizationForAssignment<
  T extends { id: string; clientName?: string | null },
>(
  auth: {
    items: T[];
    metaById?: Map<string, { centralreachClientId: string | null }>;
  },
  assignment: CMAssignmentLike,
): T | null {
  const keys = matchKeysForAssignment(assignment);
  // 1) CentralReach client id via overlay meta.
  if (keys.centralReachClientId && auth.metaById) {
    for (const item of auth.items) {
      const meta = auth.metaById.get(item.id);
      if (meta?.centralreachClientId && meta.centralreachClientId === keys.centralReachClientId) {
        return item;
      }
    }
  }
  // 2) Normalized-name fallback.
  if (keys.normalizedClientName) {
    for (const item of auth.items) {
      if (normalizeClientName(item.clientName as string | null) === keys.normalizedClientName) {
        return item;
      }
    }
  }
  return null;
}

/**
 * CentralReach `bcba_billable_sessions` currently has no durable CR
 * client id, so we prefer any future CR id on the pairing when it's
 * available and always fall back to normalized name. The name
 * matching lives HERE, not in the Case Manager pages.
 */
export function findCentralReachPairingForAssignment<T extends { clientName: string; centralReachClientId?: string | null }>(
  cr: { pairingsByClient: Map<string, T> },
  assignment: CMAssignmentLike,
): T | null {
  const keys = matchKeysForAssignment(assignment);
  if (keys.centralReachClientId) {
    for (const p of cr.pairingsByClient.values()) {
      if (p.centralReachClientId && p.centralReachClientId === keys.centralReachClientId) return p;
    }
  }
  if (!keys.normalizedClientName) return null;
  for (const p of cr.pairingsByClient.values()) {
    if (normalizeClientName(p.clientName) === keys.normalizedClientName) return p;
  }
  return null;
}

export function findCentralReachCoverageRiskForAssignment<T extends { clientName: string; centralReachClientId?: string | null }>(
  cr: { coverageRisks: T[] },
  assignment: CMAssignmentLike,
): T | null {
  const keys = matchKeysForAssignment(assignment);
  if (keys.centralReachClientId) {
    const cr1 = cr.coverageRisks.find((r) => r.centralReachClientId && r.centralReachClientId === keys.centralReachClientId);
    if (cr1) return cr1;
  }
  if (!keys.normalizedClientName) return null;
  return cr.coverageRisks.find((r) => normalizeClientName(r.clientName) === keys.normalizedClientName) ?? null;
}

/**
 * Prefer `client_id` for both staffing matches and family preferences.
 * Only fall back to normalized name when the row has no client_id.
 */
export function findStaffingForAssignment<
  M extends { client_id: string | null; client_name?: string | null; status?: string; rbt_name?: string | null },
  P extends { client_id: string | null; client_name: string | null },
>(
  staffing: { matches: M[]; preferences: P[] },
  assignment: CMAssignmentLike,
) {
  const keys = matchKeysForAssignment(assignment);
  const matches = staffing.matches.filter((m) => {
    if (keys.clientId && m.client_id) return m.client_id === keys.clientId;
    if (!m.client_id && keys.normalizedClientName) {
      return normalizeClientName(m.client_name ?? null) === keys.normalizedClientName;
    }
    return false;
  });
  const preferences = staffing.preferences.filter((p) => {
    if (keys.clientId && p.client_id) return p.client_id === keys.clientId;
    if (!p.client_id && keys.normalizedClientName) {
      return normalizeClientName(p.client_name) === keys.normalizedClientName;
    }
    return false;
  });
  return { matches, preferences };
}