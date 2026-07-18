import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterShell, ExceptionList } from "./shared/CommandCenterShell";
import { useClinicalFilters } from "./shared/useClinicalFilters";
import { buildFacets, matchesFilters } from "./shared/facets";
import { AssignActionDialog } from "./shared/AssignActionDialog";
import type { ExceptionRow } from "./shared/types";

export default function CapacityPage() {
  const { filters } = useClinicalFilters();
  const [rows, setRows] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<string | null>(null);
  const [assign, setAssign] = useState<ExceptionRow | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const { data } = await sb
        .from("bcba_capacity_snapshots")
        .select("id, bcba_id, bcba_name, state, active_clients, active_rbts, supervision_load_hours, new_assessments, reports_due, projected_service_hours, capacity_status, reasoning, updated_at, source_dates")
        .order("updated_at", { ascending: false })
        .limit(1000);
      const seen = new Set<string>();
      const dedup: any[] = [];
      for (const r of (data ?? []) as any[]) if (!seen.has(r.bcba_id)) { seen.add(r.bcba_id); dedup.push(r); }
      setRows(dedup.map((r) => ({ ...r, assigned_bcba_id: r.bcba_id, assigned_bcba_name: r.bcba_name })));
      setFreshness((data?.[0] as any)?.updated_at ?? null);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter((r) => matchesFilters(r, filters)), [rows, filters]);
  const facets = useMemo(() => buildFacets(rows), [rows]);

  const bucket = (s?: string) => String(s ?? "").toLowerCase();
  const counts = useMemo(() => {
    const c: Record<string, number> = { available: 0, approaching: 0, at: 0, over: 0, review_required: 0 };
    for (const r of filtered) c[bucket(r.capacity_status)] = (c[bucket(r.capacity_status)] ?? 0) + 1;
    return c;
  }, [filtered]);

  const exceptions: ExceptionRow[] = filtered
    .filter((r) => ["at","over","review_required"].includes(bucket(r.capacity_status)))
    .map((r: any) => ({
      id: r.bcba_id,
      title: `${r.bcba_name} · ${r.capacity_status}`,
      subtitle: `${r.active_clients} clients · ${r.active_rbts} RBTs · ${r.new_assessments ?? 0} new assessments · ${r.reports_due ?? 0} reports due`,
      owner: r.bcba_name,
      ownerId: r.bcba_id,
      severity: bucket(r.capacity_status) === "over" ? "critical" : "high",
      sourceLabel: "capacity snapshot",
      sourceDate: r.updated_at,
      detailPath: `/bcba/productivity?bcba=${r.bcba_id}`,
    }));

  const kpis = [
    { label: "Available", value: counts.available, tone: "good" as const },
    { label: "Approaching", value: counts.approaching },
    { label: "At capacity", value: counts.at, tone: counts.at ? ("warn" as const) : undefined },
    { label: "Over capacity", value: counts.over, tone: counts.over ? ("danger" as const) : undefined },
    { label: "Review required", value: counts.review_required, tone: counts.review_required ? ("warn" as const) : undefined },
  ];

  return (
    <CommandCenterShell
      scopeKey="capacity"
      title="BCBA Capacity"
      description="Advisory capacity distribution with projected 30-day load, assessment backlog and supervision load."
      kpis={kpis}
      exceptions={exceptions}
      facets={facets}
      auditPath="/bcba/productivity"
      freshness={{ source: "bcba_capacity_snapshots", lastSyncedAt: freshness }}
    >
      <ExceptionList title="BCBAs at or over capacity" rows={exceptions} onAssign={setAssign} />
      <AssignActionDialog scopeKey="capacity" row={assign} open={!!assign} onOpenChange={(v) => !v && setAssign(null)} />
    </CommandCenterShell>
  );
}