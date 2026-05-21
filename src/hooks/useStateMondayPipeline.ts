import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GroupCount { group: string; count: number }
export interface StateMondayPipeline {
  loading: boolean;
  error: string | null;
  clients: GroupCount[];
  leads: GroupCount[];
  authorizations: GroupCount[];
  approvals: GroupCount[];
  denials: GroupCount[];
  /** Count of clients in the Monday "Active" kanban group. */
  activeClients: number;
  /** Sum of all client rows for the state (any group). */
  totalClients: number;
}

const ACTIVE_GROUPS = new Set(["Active"]);

async function fetchGroups(table: string, state: string): Promise<GroupCount[]> {
  // Page through up to a few thousand rows; group counts client-side because
  // PostgREST doesn't expose aggregate counts via the JS client cleanly.
  const all: { monday_group: string | null }[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      // @ts-expect-error — dynamic table name
      .from(table)
      .select("monday_group")
      .eq("state", state)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...((data ?? []) as { monday_group: string | null }[]));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  const map = new Map<string, number>();
  for (const r of all) {
    const g = (r.monday_group ?? "—").trim() || "—";
    map.set(g, (map.get(g) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => b.count - a.count);
}

export function useStateMondayPipeline(stateCode: string): StateMondayPipeline {
  const [state, setState] = useState<StateMondayPipeline>({
    loading: true, error: null,
    clients: [], leads: [], authorizations: [], approvals: [], denials: [],
    activeClients: 0, totalClients: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const code = stateCode.toUpperCase();
        const [clients, leads, authorizations, approvals, denials] = await Promise.all([
          fetchGroups("monday_clients_raw", code),
          fetchGroups("monday_leads_raw", code),
          fetchGroups("monday_authorizations_raw", code),
          fetchGroups("monday_auth_approvals_raw", code),
          fetchGroups("monday_denials_raw", code),
        ]);
        const totalClients = clients.reduce((s, g) => s + g.count, 0);
        const activeClients = clients
          .filter((g) => ACTIVE_GROUPS.has(g.group))
          .reduce((s, g) => s + g.count, 0);
        if (!cancelled) {
          setState({
            loading: false, error: null,
            clients, leads, authorizations, approvals, denials,
            activeClients, totalClients,
          });
        }
      } catch (e: any) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: e?.message ?? "Failed to load pipeline" }));
      }
    })();
    return () => { cancelled = true; };
  }, [stateCode]);

  return state;
}