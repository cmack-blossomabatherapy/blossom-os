import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StateSession } from "@/lib/analytics/stateOps";

export type WindowKey = "4w" | "12w" | "26w" | "ytd";

function windowSince(w: WindowKey): string {
  const d = new Date();
  if (w === "ytd") {
    d.setMonth(0, 1);
  } else {
    const weeks = w === "4w" ? 4 : w === "12w" ? 12 : 26;
    d.setDate(d.getDate() - weeks * 7);
  }
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// Map payor-name patterns to a state code so legacy rows without `state`
// still attribute to the right director.
function inferStateFromPayor(payor: string | null | undefined): string | null {
  if (!payor) return null;
  const p = payor.toLowerCase();
  if (p.includes("trillium") || p.includes("partners health") || p.includes("vaya") || p.includes("nc medicaid") || p.includes("north carolina")) return "NC";
  if (p.includes("georgia") || p.includes(" ga ")) return "GA";
  if (p.includes("virginia") || p.includes(" va ")) return "VA";
  if (p.includes("tennessee") || p.includes(" tn ")) return "TN";
  if (p.includes("florida") || p.includes(" fl ")) return "FL";
  if (p.includes("texas") || p.includes(" tx ")) return "TX";
  return null;
}

interface Result {
  sessions: StateSession[];
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
  hasAnyData: boolean;
}

export function useStateOps(stateCode: string, windowKey: WindowKey): Result {
  const [sessions, setSessions] = useState<StateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const since = windowSince(windowKey);
        const all: any[] = [];
        const pageSize = 1000;
        let from = 0;
        // Page through active imports for the date window
        const { data: importsList } = await supabase
          .from("bcba_billable_imports")
          .select("id")
          .eq("is_active", true);
        const importIds = (importsList ?? []).map((i: any) => i.id);
        if (importIds.length === 0) {
          if (!cancelled) {
            setSessions([]);
            setFetchedAt(Date.now());
          }
          return;
        }
        while (true) {
          const { data, error: qErr } = await supabase
            .from("bcba_billable_sessions")
            .select(
              "id,date_of_service,bcba_name,provider_full,client_full,procedure_code,hours,state,service_location,payor_name,payor_type,units,charges_total,amount_paid,amount_owed,is_billable",
            )
            .in("import_id", importIds)
            .gte("date_of_service", since)
            .order("date_of_service", { ascending: false })
            .range(from, from + pageSize - 1);
          if (qErr) throw qErr;
          all.push(...(data ?? []));
          if (!data || data.length < pageSize) break;
          from += pageSize;
        }
        // Filter by state — prefer the explicit column, fall back to payor inference
        const filtered = all.filter((s) => {
          const st = (s.state || inferStateFromPayor(s.payor_name) || "").toUpperCase();
          return st === stateCode.toUpperCase();
        }) as StateSession[];
        if (!cancelled) {
          setSessions(filtered);
          setFetchedAt(Date.now());
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load sessions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stateCode, windowKey]);

  const hasAnyData = useMemo(() => sessions.length > 0, [sessions]);

  return { sessions, loading, error, fetchedAt, hasAnyData };
}