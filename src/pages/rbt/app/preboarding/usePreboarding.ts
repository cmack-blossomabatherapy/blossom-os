import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PreboardingItem, PreboardingRequirement } from "./types";

export interface PreboardingRow {
  item: PreboardingItem;
  requirement: PreboardingRequirement;
}

export function usePreboarding(employeeId: string | null | undefined) {
  const [rows, setRows] = useState<PreboardingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setError(null);
    const [{ data: items, error: iErr }, { data: reqs, error: rErr }] = await Promise.all([
      supabase.from("rbt_preboarding_items" as any).select("*").eq("employee_id", employeeId),
      supabase.from("rbt_preboarding_requirements" as any).select("*").eq("is_active", true),
    ]);
    if (iErr || rErr) { setError((iErr ?? rErr)!.message); setRows([]); return; }

    // Auto-initialize if empty
    if ((items ?? []).length === 0) {
      await supabase.rpc("initialize_rbt_preboarding" as any, { _employee_id: employeeId });
      const { data: seeded } = await supabase.from("rbt_preboarding_items" as any).select("*").eq("employee_id", employeeId);
      const byKey = new Map<string, PreboardingRequirement>((reqs ?? []).map((r: any) => [r.key, r]));
      setRows((seeded ?? []).map((i: any) => ({ item: i, requirement: byKey.get(i.requirement_key)! })).filter((r: any) => r.requirement).sort((a: any, b: any) => a.requirement.sort_order - b.requirement.sort_order));
      return;
    }

    const byKey = new Map<string, PreboardingRequirement>((reqs ?? []).map((r: any) => [r.key, r]));
    setRows((items ?? [])
      .map((i: any) => ({ item: i, requirement: byKey.get(i.requirement_key)! }))
      .filter((r) => r.requirement)
      .sort((a, b) => a.requirement.sort_order - b.requirement.sort_order));
  }, [employeeId]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const list = rows ?? [];
    const req = list.filter((r) => r.requirement.is_required);
    const done = req.filter((r) => ["approved", "complete", "waived"].includes(r.item.status));
    return {
      total: req.length,
      complete: done.length,
      percent: req.length ? Math.round((done.length / req.length) * 100) : 0,
      overdue: list.filter((r) => r.item.due_at && new Date(r.item.due_at) < new Date() && !["approved","complete","waived"].includes(r.item.status)),
      next: list.find((r) => r.requirement.owner_role === "rbt" && !["approved","complete","waived","submitted"].includes(r.item.status)),
    };
  }, [rows]);

  return { rows, stats, error, reload: load };
}