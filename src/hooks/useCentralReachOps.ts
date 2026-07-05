import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single source of truth for Scheduling-ecosystem operational signals
 * derived from the CentralReach `bcba_billable_sessions` import.
 *
 * No mock data. No fabricated metrics. If the import is empty, the hook
 * returns empty arrays + zero counts and the UI shows calm empty states.
 */

const RBT_CODE_PREFIX = "97153"; // RBT direct
const BCBA_CODES = ["97155", "97151", "97156"]; // protocol mod / assessment / parent
const LOOKBACK_DAYS = 60;
const SESSION_PAGE_SIZE = 1000;

export interface CRSessionRow {
  date_of_service: string | null;
  client_full: string | null;
  bcba_name: string | null;
  provider_full: string | null;
  procedure_code: string | null;
  procedure_description: string | null;
  hours: number | null;
  state: string | null;
  service_location: string | null;
  payor_name: string | null;
}

export interface ProviderRosterEntry {
  name: string;
  state: string | null;
  hoursLast7d: number;
  hoursLast30d: number;
  sessionsLast7d: number;
  sessionsLast30d: number;
  distinctClients: number;
  lastSessionDate: string | null;
  clients: string[]; // unique client_full assigned in last 30d
}

export interface ClientPairing {
  clientName: string;
  state: string | null;
  rbtName: string | null;
  bcbaName: string | null;
  lastRbtSessionDate: string | null;
  lastBcbaSessionDate: string | null;
  rbtHoursLast7d: number;
  rbtHoursLast30d: number;
  weeklyPattern: { day: string; hours: number }[];
  cancellationsLast30d: number;
}

export type CoverageRiskLevel = "uncovered" | "at_risk" | "covered";

export interface CoverageRiskRow {
  clientName: string;
  state: string | null;
  level: CoverageRiskLevel;
  rbtName: string | null;
  bcbaName: string | null;
  daysSinceLastRbt: number | null;
  lastSessionDate: string | null;
  reason: string;
}

export interface CentralReachOps {
  loading: boolean;
  error: string | null;
  totalSessions: number;
  lookbackDays: number;
  windowStart: string;
  rbtRoster: ProviderRosterEntry[];
  bcbaRoster: ProviderRosterEntry[];
  pairingsByClient: Map<string, ClientPairing>;
  coverageRisks: CoverageRiskRow[];
  cancellationsLast7d: number;
  cancellationsLast30d: number;
  counts: {
    activeClients: number;
    coveredClients: number;
    uncoveredClients: number;
    atRiskClients: number;
    rbtCount: number;
    bcbaCount: number;
  };
  lastSyncedAt: string | null;
  refresh: () => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysAgo(iso: string | null, ref = Date.now()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((ref - t) / 86_400_000));
}

function isRbtCode(code: string | null): boolean {
  return !!code && code.trim().startsWith(RBT_CODE_PREFIX);
}
function isBcbaCode(code: string | null): boolean {
  if (!code) return false;
  const head = code.trim().split(/\s+/)[0];
  return BCBA_CODES.includes(head);
}
function isCancellationRow(row: CRSessionRow): boolean {
  const desc = `${row.procedure_code ?? ""} ${row.procedure_description ?? ""}`.toLowerCase();
  return desc.includes("cancel") || desc.includes("no show") || desc.includes("no-show");
}

export function useCentralReachOps(opts: { stateFilter?: string | null } = {}): CentralReachOps {
  const { stateFilter } = opts;
  const [rows, setRows] = useState<CRSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const refresh = useMemo(() => () => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const start = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000)
      .toISOString()
      .slice(0, 10);

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const all: CRSessionRow[] = [];
        for (let page = 0; ; page++) {
          const from = page * SESSION_PAGE_SIZE;
          const to = from + SESSION_PAGE_SIZE - 1;
          let q = supabase
            .from("bcba_billable_sessions")
            .select(
              "date_of_service,client_full,bcba_name,provider_full,procedure_code,procedure_description,hours,state,service_location,payor_name"
            )
            .gte("date_of_service", start)
            .order("date_of_service", { ascending: false })
            .range(from, to);
          if (stateFilter) q = q.eq("state", stateFilter);
          const { data, error: qErr } = await q;
          if (qErr) throw qErr;
          const chunk = (data ?? []) as CRSessionRow[];
          all.push(...chunk);
          if (chunk.length < SESSION_PAGE_SIZE) break;
          if (page > 60) break; // safety: 60k cap
        }
        if (!cancelled) setRows(all);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load operational data");
      } finally {
        if (!cancelled) {
          setLastSyncedAt(new Date().toISOString());
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stateFilter, nonce]);

  const derived = useMemo(() => derive(rows, loading, error), [rows, loading, error]);
  return { ...derived, lastSyncedAt, refresh };
}

function derive(rows: CRSessionRow[], loading: boolean, error: string | null): Omit<CentralReachOps, "lastSyncedAt" | "refresh"> {
  const now = Date.now();
  const start7 = now - 7 * 86_400_000;
  const start30 = now - 30 * 86_400_000;
  const start28 = now - 28 * 86_400_000;
  const windowStart = new Date(now - LOOKBACK_DAYS * 86_400_000).toISOString().slice(0, 10);

  const providerAgg = new Map<string, ProviderRosterEntry & { _bucket: "rbt" | "bcba" }>();
  const pairings = new Map<string, ClientPairing>();
  const clientCancellations = new Map<string, { d7: number; d30: number }>();

  const ensureProvider = (name: string, state: string | null, bucket: "rbt" | "bcba") => {
    const key = `${bucket}::${name}`;
    let p = providerAgg.get(key);
    if (!p) {
      p = {
        name,
        state,
        hoursLast7d: 0,
        hoursLast30d: 0,
        sessionsLast7d: 0,
        sessionsLast30d: 0,
        distinctClients: 0,
        lastSessionDate: null,
        clients: [],
        _bucket: bucket,
      };
      providerAgg.set(key, p);
    }
    return p;
  };

  const ensurePairing = (clientName: string, state: string | null): ClientPairing => {
    let pr = pairings.get(clientName);
    if (!pr) {
      pr = {
        clientName,
        state,
        rbtName: null,
        bcbaName: null,
        lastRbtSessionDate: null,
        lastBcbaSessionDate: null,
        rbtHoursLast7d: 0,
        rbtHoursLast30d: 0,
        weeklyPattern: DAY_LABELS.map((d) => ({ day: d, hours: 0 })),
        cancellationsLast30d: 0,
      };
      pairings.set(clientName, pr);
    } else if (!pr.state && state) {
      pr.state = state;
    }
    return pr;
  };

  for (const r of rows) {
    const client = (r.client_full ?? "").trim();
    if (!client) continue;
    const ts = r.date_of_service ? new Date(r.date_of_service).getTime() : NaN;
    if (Number.isNaN(ts)) continue;
    const hours = Number(r.hours ?? 0) || 0;
    const within7 = ts >= start7;
    const within30 = ts >= start30;
    const within28 = ts >= start28;

    if (isCancellationRow(r)) {
      const c = clientCancellations.get(client) ?? { d7: 0, d30: 0 };
      if (within7) c.d7 += 1;
      if (within30) c.d30 += 1;
      clientCancellations.set(client, c);
      continue;
    }

    const pairing = ensurePairing(client, r.state);

    if (isRbtCode(r.procedure_code) && r.provider_full) {
      const provider = ensureProvider(r.provider_full.trim(), r.state, "rbt");
      provider.sessionsLast30d += within30 ? 1 : 0;
      provider.hoursLast30d += within30 ? hours : 0;
      provider.sessionsLast7d += within7 ? 1 : 0;
      provider.hoursLast7d += within7 ? hours : 0;
      if (within30 && !provider.clients.includes(client)) provider.clients.push(client);
      const iso = r.date_of_service ?? null;
      if (iso && (!provider.lastSessionDate || iso > provider.lastSessionDate)) {
        provider.lastSessionDate = iso;
      }

      // pairing: use most recent (rows are date desc, but be safe)
      if (!pairing.lastRbtSessionDate || (iso && iso > pairing.lastRbtSessionDate)) {
        pairing.lastRbtSessionDate = iso;
        pairing.rbtName = r.provider_full.trim();
      }
      if (within30) pairing.rbtHoursLast30d += hours;
      if (within7) pairing.rbtHoursLast7d += hours;
      if (within28 && r.date_of_service) {
        const dow = new Date(r.date_of_service).getUTCDay();
        pairing.weeklyPattern[dow].hours += hours;
      }
    } else if (isBcbaCode(r.procedure_code) && (r.provider_full || r.bcba_name)) {
      const name = (r.provider_full || r.bcba_name || "").trim();
      const provider = ensureProvider(name, r.state, "bcba");
      provider.sessionsLast30d += within30 ? 1 : 0;
      provider.hoursLast30d += within30 ? hours : 0;
      provider.sessionsLast7d += within7 ? 1 : 0;
      provider.hoursLast7d += within7 ? hours : 0;
      if (within30 && !provider.clients.includes(client)) provider.clients.push(client);
      const iso = r.date_of_service ?? null;
      if (iso && (!provider.lastSessionDate || iso > provider.lastSessionDate)) {
        provider.lastSessionDate = iso;
      }
      if (!pairing.lastBcbaSessionDate || (iso && iso > pairing.lastBcbaSessionDate)) {
        pairing.lastBcbaSessionDate = iso;
        pairing.bcbaName = name;
      }
    }
  }

  // finalize providers
  const allProviders = Array.from(providerAgg.values()).map((p) => {
    p.distinctClients = p.clients.length;
    return p;
  });
  const rbtRoster = allProviders
    .filter((p) => p._bucket === "rbt")
    .sort((a, b) => b.hoursLast30d - a.hoursLast30d);
  const bcbaRoster = allProviders
    .filter((p) => p._bucket === "bcba")
    .sort((a, b) => b.distinctClients - a.distinctClients);

  // attach cancellations into pairings
  for (const [client, c] of clientCancellations.entries()) {
    const pr = pairings.get(client);
    if (pr) pr.cancellationsLast30d = c.d30;
  }

  // coverage risks
  const coverageRisks: CoverageRiskRow[] = [];
  for (const pr of pairings.values()) {
    const dSinceRbt = daysAgo(pr.lastRbtSessionDate, now);
    let level: CoverageRiskLevel = "covered";
    let reason = "Active RBT coverage in the last 7 days.";
    if (dSinceRbt === null) {
      level = "uncovered";
      reason = "No RBT direct sessions found in the last 60 days.";
    } else if (dSinceRbt >= 14) {
      level = "uncovered";
      reason = `No RBT session in ${dSinceRbt} days. Likely paused or unstaffed.`;
    } else if (dSinceRbt >= 7) {
      level = "at_risk";
      reason = `Last RBT session ${dSinceRbt} days ago. Coverage gap forming.`;
    } else if (pr.cancellationsLast30d >= 3) {
      level = "at_risk";
      reason = `${pr.cancellationsLast30d} cancellations in last 30 days.`;
    }
    if (level !== "covered") {
      coverageRisks.push({
        clientName: pr.clientName,
        state: pr.state,
        level,
        rbtName: pr.rbtName,
        bcbaName: pr.bcbaName,
        daysSinceLastRbt: dSinceRbt,
        lastSessionDate: pr.lastRbtSessionDate,
        reason,
      });
    }
  }
  coverageRisks.sort((a, b) => {
    const order = { uncovered: 0, at_risk: 1, covered: 2 } as const;
    if (order[a.level] !== order[b.level]) return order[a.level] - order[b.level];
    return (b.daysSinceLastRbt ?? 0) - (a.daysSinceLastRbt ?? 0);
  });

  let cancellationsLast7d = 0;
  let cancellationsLast30d = 0;
  for (const c of clientCancellations.values()) {
    cancellationsLast7d += c.d7;
    cancellationsLast30d += c.d30;
  }

  const activeClients = pairings.size;
  const coveredClients = activeClients - coverageRisks.length;
  const uncoveredClients = coverageRisks.filter((c) => c.level === "uncovered").length;
  const atRiskClients = coverageRisks.filter((c) => c.level === "at_risk").length;

  return {
    loading,
    error,
    totalSessions: rows.length,
    lookbackDays: LOOKBACK_DAYS,
    windowStart,
    rbtRoster,
    bcbaRoster,
    pairingsByClient: pairings,
    coverageRisks,
    cancellationsLast7d,
    cancellationsLast30d,
    counts: {
      activeClients,
      coveredClients,
      uncoveredClients,
      atRiskClients,
      rbtCount: rbtRoster.length,
      bcbaCount: bcbaRoster.length,
    },
  };
}
