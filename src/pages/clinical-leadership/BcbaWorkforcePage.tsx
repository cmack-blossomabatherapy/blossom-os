import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterShell, ExceptionList } from "./shared/CommandCenterShell";
import { useClinicalFilters } from "./shared/useClinicalFilters";
import { buildFacets, matchesFilters } from "./shared/facets";
import { AssignActionDialog } from "./shared/AssignActionDialog";
import type { ExceptionRow } from "./shared/types";

type Row = {
  bcba_id: string;
  assigned_bcba_id: string;
  assigned_bcba_name: string;
  state: string | null;
  clinic: string | null;
  lifecycle_stage: string | null;
  caseload: number;
  rbt_count: number;
  capacity_status: string | null;
  productivity_pct: number | null;
  credential_status: string | null;
  learning_pct: number | null;
  open_support: number;
  on_leave: boolean;
  growth_interest: boolean;
};

export default function BcbaWorkforcePage() {
  const { filters } = useClinicalFilters();
  const [rows, setRows] = useState<Row[]>([]);
  const [assignRow, setAssignRow] = useState<ExceptionRow | null>(null);
  const [freshness, setFreshness] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: cap }, { data: prod }, { data: life }, { data: support }] = await Promise.all([
        supabase.from("bcba_capacity_snapshots").select("bcba_id, bcba_name, state, active_clients, active_rbts, capacity_status, updated_at").order("updated_at", { ascending: false }),
        supabase.from("bcba_productivity_snapshots").select("bcba_id, bcba_name, state, updated_at, mtd_actual_hours, mtd_target_hours").order("updated_at", { ascending: false }),
        supabase.from("bcba_lifecycle_state").select("employee_id, stage"),
        supabase.from("bcba_support_requests").select("bcba_id, status"),
      ]);
      const stageById = new Map((life ?? []).map((l: any) => [l.employee_id, l.stage]));
      const prodMap = new Map<string, any>();
      for (const p of prod ?? []) if (!prodMap.has(p.bcba_id)) prodMap.set(p.bcba_id, p);
      const supportByBcba = new Map<string, number>();
      for (const s of (support ?? []) as Array<{ bcba_id: string; status: string }>) {
        if (["resolved", "closed"].includes(String(s.status))) continue;
        supportByBcba.set(s.bcba_id, (supportByBcba.get(s.bcba_id) ?? 0) + 1);
      }
      const seen = new Set<string>();
      const collected: Row[] = [];
      const source = cap ?? [];
      let latest: string | null = null;
      for (const c of source) {
        if (seen.has(c.bcba_id)) continue;
        seen.add(c.bcba_id);
        latest = latest ?? c.updated_at;
        const p = prodMap.get(c.bcba_id);
        const pct = p?.mtd_target_hours ? Math.round(100 * (p.mtd_actual_hours ?? 0) / p.mtd_target_hours) : null;
        collected.push({
          bcba_id: c.bcba_id,
          assigned_bcba_id: c.bcba_id,
          assigned_bcba_name: c.bcba_name,
          state: c.state,
          clinic: null,
          lifecycle_stage: stageById.get(c.bcba_id) ?? null,
          caseload: c.active_clients ?? 0,
          rbt_count: c.active_rbts ?? 0,
          capacity_status: c.capacity_status,
          productivity_pct: pct,
          credential_status: null,
          learning_pct: null,
          open_support: supportByBcba.get(c.bcba_id) ?? 0,
          on_leave: false,
          growth_interest: false,
        });
      }
      setRows(collected);
      setFreshness(latest);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter((r) => matchesFilters(r, filters, "bcba_id")), [rows, filters]);
  const facets = useMemo(() => buildFacets(rows, "assigned_bcba_name", "bcba_id"), [rows]);

  const exceptions: ExceptionRow[] = useMemo(() => filtered
    .filter((r) => r.capacity_status === "over" || r.capacity_status === "at" || r.open_support > 0 || (r.productivity_pct !== null && r.productivity_pct < 70))
    .map((r) => ({
      id: r.bcba_id,
      title: r.assigned_bcba_name,
      subtitle: `${r.caseload} clients · ${r.rbt_count} RBTs${r.productivity_pct !== null ? ` · ${r.productivity_pct}% target` : ""}`,
      status: r.capacity_status ?? undefined,
      severity: r.capacity_status === "over" ? "critical" : r.open_support > 0 ? "high" : "medium",
      owner: r.assigned_bcba_name,
      ownerId: r.bcba_id,
      sourceLabel: "capacity snapshot",
      sourceDate: freshness,
      detailPath: `/bcba/productivity?bcba=${r.bcba_id}`,
      meta: { caseload: r.caseload, rbts: r.rbt_count, support: r.open_support, productivity_pct: r.productivity_pct ?? "" },
    })), [filtered, freshness]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const over = filtered.filter((r) => r.capacity_status === "over").length;
    const at = filtered.filter((r) => r.capacity_status === "at").length;
    const lowProd = filtered.filter((r) => r.productivity_pct !== null && r.productivity_pct < 70).length;
    const openSupport = filtered.reduce((s, r) => s + r.open_support, 0);
    return [
      { label: "Active BCBAs", value: total },
      { label: "Over capacity", value: over, tone: over ? ("danger" as const) : undefined },
      { label: "At capacity", value: at, tone: at ? ("warn" as const) : undefined },
      { label: "Below 70% target", value: lowProd, tone: lowProd ? ("warn" as const) : undefined },
      { label: "Open support", value: openSupport },
    ];
  }, [filtered]);

  return (
    <CommandCenterShell
      scopeKey="bcba-workforce"
      title="BCBA Workforce"
      description="Active BCBAs with lifecycle, capacity, productivity, credential and learning signals."
      kpis={kpis}
      exceptions={exceptions}
      facets={facets}
      auditPath="/bcba/productivity"
      freshness={{ source: "bcba_capacity_snapshots", lastSyncedAt: freshness }}
    >
      <ExceptionList
        title="BCBAs requiring attention"
        rows={exceptions}
        emptyLabel="No workforce exceptions in the current filter."
        onAssign={(r) => setAssignRow(r)}
      />
      <AssignActionDialog scopeKey="bcba-workforce" row={assignRow} open={!!assignRow} onOpenChange={(v) => !v && setAssignRow(null)} />
    </CommandCenterShell>
  );
}