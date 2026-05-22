import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCentralReachOps, type ClientPairing } from "@/hooks/useCentralReachOps";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import type { Authorization } from "@/data/authorizations";
import { useAuth } from "@/contexts/AuthContext";

export type Severity = "crit" | "warn" | "info";

export interface AuthAlert {
  a: Authorization;
  sev: Severity;
  label: string;
  due: number | null;
}

export interface SupervisionAlert {
  p: ClientPairing;
  days: number | null;
  sev: Severity;
  label: string;
}

export interface PtAlert {
  p: ClientPairing;
  days: number;
}

/** Shared, caseload-scoped derivations for any BCBA-facing surface. */
export function useBcbaCaseload() {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [selectedBcba, setSelectedBcba] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setProfileName(data?.display_name ?? null);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const cr = useCentralReachOps();
  const auths = useLiveAuthorizations();

  const bcbaOptions = useMemo(
    () => cr.bcbaRoster.filter((b) => b.name && b.name.trim().length > 1),
    [cr.bcbaRoster]
  );

  const resolvedBcba = useMemo(() => {
    if (selectedBcba) return selectedBcba;
    if (profileName) {
      const lower = profileName.toLowerCase();
      const match = bcbaOptions.find((b) => b.name.toLowerCase() === lower);
      if (match) return match.name;
    }
    return bcbaOptions[0]?.name ?? null;
  }, [selectedBcba, profileName, bcbaOptions]);

  const profileMatched = useMemo(() => {
    if (!profileName) return false;
    return bcbaOptions.some((b) => b.name.toLowerCase() === profileName.toLowerCase());
  }, [profileName, bcbaOptions]);

  const caseload: ClientPairing[] = useMemo(() => {
    if (!resolvedBcba) return [];
    const list: ClientPairing[] = [];
    for (const p of cr.pairingsByClient.values()) {
      if (p.bcbaName && p.bcbaName.toLowerCase() === resolvedBcba.toLowerCase()) {
        list.push(p);
      }
    }
    return list.sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [cr.pairingsByClient, resolvedBcba]);

  const caseloadClientSet = useMemo(
    () => new Set(caseload.map((c) => c.clientName.toLowerCase())),
    [caseload]
  );

  const myAuths = useMemo(() => {
    if (!resolvedBcba) return [];
    const lower = resolvedBcba.toLowerCase();
    return auths.items.filter((a) => {
      const live = auths.bcbaById.get(a.id);
      if (live && live.toLowerCase() === lower) return true;
      if (caseloadClientSet.has(a.clientName.toLowerCase())) return true;
      return false;
    });
  }, [auths.items, auths.bcbaById, resolvedBcba, caseloadClientSet]);

  const authByClient = useMemo(() => {
    const m = new Map<string, Authorization>();
    for (const a of myAuths) {
      const k = a.clientName.toLowerCase();
      const existing = m.get(k);
      if (!existing) { m.set(k, a); continue; }
      // Prefer ones with the soonest next task due
      const cur = a.nextTaskDue ? new Date(a.nextTaskDue).getTime() : Infinity;
      const prev = existing.nextTaskDue ? new Date(existing.nextTaskDue).getTime() : Infinity;
      if (cur < prev) m.set(k, a);
    }
    return m;
  }, [myAuths]);

  const supervisionAlerts: SupervisionAlert[] = useMemo(() => {
    return caseload
      .map((p): SupervisionAlert | null => {
        const d = daysSince(p.lastBcbaSessionDate);
        if (d === null) return { p, days: null, sev: "crit", label: "No BCBA session in 60d window" };
        if (d >= 21) return { p, days: d, sev: "crit", label: `Last supervision ${d}d ago` };
        if (d >= 14) return { p, days: d, sev: "warn", label: `Last supervision ${d}d ago` };
        return null;
      })
      .filter((x): x is SupervisionAlert => !!x)
      .sort((a, b) => (b.days ?? 999) - (a.days ?? 999));
  }, [caseload]);

  const coverageAlerts = useMemo(
    () => cr.coverageRisks.filter((r) => caseloadClientSet.has(r.clientName.toLowerCase())),
    [cr.coverageRisks, caseloadClientSet]
  );

  const authAlerts: AuthAlert[] = useMemo(() => {
    return myAuths
      .map((a): AuthAlert | null => {
        const d = daysUntil(a.nextTaskDue);
        if (a.stage === "Denied") {
          return { a, sev: "crit", due: d, label: a.denialReason ? `Denied · ${a.denialReason}` : "Denied — address denial" };
        }
        if (a.stage === "Expiring Soon" || (d !== null && d <= 14)) {
          const sev: Severity = d !== null && d <= 7 ? "crit" : "warn";
          return { a, sev, due: d, label: d !== null ? `Due in ${d}d · ${a.nextAction ?? "Review"}` : a.nextAction ?? "Review" };
        }
        if (a.missingInfo) return { a, sev: "warn", due: d, label: "Missing information from Monday" };
        if (a.stage === "In QA Review") return { a, sev: "info", due: d, label: "In QA review" };
        return null;
      })
      .filter((x): x is AuthAlert => !!x)
      .sort((a, b) => {
        const order = { crit: 0, warn: 1, info: 2 } as const;
        if (order[a.sev] !== order[b.sev]) return order[a.sev] - order[b.sev];
        return (a.due ?? 999) - (b.due ?? 999);
      });
  }, [myAuths]);

  const ptAlerts: PtAlert[] = useMemo(() => {
    return caseload
      .map((p): PtAlert | null => {
        const d = daysSince(p.lastBcbaSessionDate);
        if (d !== null && d >= 30) return { p, days: d };
        return null;
      })
      .filter((x): x is PtAlert => !!x)
      .sort((a, b) => b.days - a.days);
  }, [caseload]);

  const cancellationAlerts = useMemo(
    () => caseload.filter((p) => p.cancellationsLast30d >= 2)
      .sort((a, b) => b.cancellationsLast30d - a.cancellationsLast30d),
    [caseload]
  );

  return {
    loading: cr.loading || auths.loading,
    error: cr.error ?? auths.error,
    profileName,
    profileMatched,
    bcbaOptions,
    resolvedBcba,
    selectedBcba,
    setSelectedBcba,
    caseload,
    caseloadClientSet,
    myAuths,
    authByClient,
    supervisionAlerts,
    coverageAlerts,
    authAlerts,
    ptAlerts,
    cancellationAlerts,
  };
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86_400_000);
}