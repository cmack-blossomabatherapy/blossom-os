import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterShell, ExceptionList } from "./shared/CommandCenterShell";
import { useClinicalFilters } from "./shared/useClinicalFilters";
import { buildFacets, matchesFilters } from "./shared/facets";
import { AssignActionDialog } from "./shared/AssignActionDialog";
import type { ExceptionRow } from "./shared/types";

export default function RbtSupervisionPage() {
  const { filters } = useClinicalFilters();
  const [logs, setLogs] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<string | null>(null);
  const [assign, setAssign] = useState<ExceptionRow | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const since = new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString();
      const { data } = await sb
        .from("bcba_supervision_logs")
        .select("id, bcba_id, provider_id, provider_name, client_id, client_name, occurred_at, minutes, observation_completed, next_supervision_date, followup_action, updated_at")
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: false })
        .limit(1000);
      setLogs((data ?? []) as any[]);
      setFreshness((data?.[0] as any)?.updated_at ?? null);
    })();
  }, []);

  const rows = useMemo(() => logs.map((l: any) => ({
    ...l,
    assigned_bcba_id: l.bcba_id,
    assigned_bcba_name: l.provider_name,
    state: null,
  })), [logs]);

  const filtered = useMemo(() => rows.filter((r: any) => matchesFilters(r, filters)), [rows, filters]);
  const facets = useMemo(() => buildFacets(rows), [rows]);

  const exceptions: ExceptionRow[] = useMemo(() => {
    const now = Date.now();
    return filtered
      .filter((l: any) => !l.observation_completed || (l.next_supervision_date && new Date(l.next_supervision_date).getTime() < now))
      .map((l: any) => ({
        id: l.id,
        title: `${l.provider_name ?? "RBT"} · ${l.client_name ?? "client"}`,
        subtitle: `${l.minutes ?? 0} min · ${l.observation_completed ? "observation done" : "observation missing"}`,
        owner: l.provider_name,
        ownerId: l.bcba_id,
        severity: !l.observation_completed ? "high" : "medium",
        dueDate: l.next_supervision_date,
        sourceLabel: "supervision logs",
        sourceDate: l.updated_at,
        detailPath: `/bcba/supervision`,
      }));
  }, [filtered]);

  const kpis = useMemo(() => ([
    { label: "Logs (45d)", value: filtered.length },
    { label: "Missing observation", value: exceptions.filter((e) => e.severity === "high").length, tone: "warn" as const },
    { label: "Overdue follow-up", value: filtered.filter((l: any) => l.next_supervision_date && new Date(l.next_supervision_date) < new Date()).length, tone: "warn" as const },
    { label: "Providers covered", value: new Set(filtered.map((l: any) => l.provider_id)).size },
  ]), [filtered, exceptions]);

  return (
    <CommandCenterShell
      scopeKey="rbt-supervision"
      title="RBT Supervision"
      description="Supervision logs, observation completion and follow-up status across BCBA / RBT pairs."
      kpis={kpis}
      exceptions={exceptions}
      facets={facets}
      auditPath="/bcba/supervision"
      freshness={{ source: "bcba_supervision_logs", lastSyncedAt: freshness }}
    >
      <ExceptionList title="Supervision items requiring attention" rows={exceptions} onAssign={setAssign} />
      <AssignActionDialog scopeKey="rbt-supervision" row={assign} open={!!assign} onOpenChange={(v) => !v && setAssign(null)} />
    </CommandCenterShell>
  );
}