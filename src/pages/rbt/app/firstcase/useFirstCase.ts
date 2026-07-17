import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FirstCase {
  id: string; assignment_id: string; employee_id: string;
  bcba_id: string | null; support_contact_id: string | null;
  lead_rbt_id: string | null; lead_rbt_attending: boolean;
  start_date: string | null; session_window_local: string | null;
  location_type: string | null; cr_access_status: "pending"|"active"|"blocked"|"unknown";
  last_schedule_sync_at: string | null; centralreach_url: string | null;
  client_display: string | null; status: "upcoming"|"prepping"|"first_session_done"|"closed";
  readiness_acknowledged_at: string | null;
  bcba?: { first_name: string; last_name: string; email: string | null } | null;
  support?: { first_name: string; last_name: string; email: string | null } | null;
  lead?: { first_name: string; last_name: string } | null;
}
export interface ChecklistItem { key: string; label: string; description: string | null; order_index: number; }
export interface ChecklistState { id: string; item_key: string; done: boolean; done_at: string | null; notes: string | null; }

export function useFirstCase(employeeId: string | null | undefined) {
  const [cases, setCases] = useState<FirstCase[] | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [state, setState] = useState<Record<string, ChecklistState[]>>({});
  const [checkins, setCheckins] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    const { data: cs } = await supabase
      .from("rbt_first_case" as any)
      .select(`
        *,
        bcba:employees!rbt_first_case_bcba_id_fkey(first_name,last_name,email),
        support:employees!rbt_first_case_support_contact_id_fkey(first_name,last_name,email),
        lead:employees!rbt_first_case_lead_rbt_id_fkey(first_name,last_name)
      `)
      .eq("employee_id", employeeId)
      .neq("status", "closed")
      .order("start_date", { ascending: true });

    const rows = (cs as any[] ?? []) as FirstCase[];
    setCases(rows);

    const { data: def } = await supabase.from("rbt_first_session_checklist_items" as any)
      .select("*").eq("is_active", true).order("order_index");
    const defs = ((def as any[]) ?? []) as ChecklistItem[];
    setItems(defs);

    if (rows.length && defs.length) {
      const ids = rows.map((r) => r.id);
      const { data: st } = await supabase.from("rbt_first_session_checklist_state" as any)
        .select("*").in("first_case_id", ids);
      const grouped: Record<string, ChecklistState[]> = {};
      const existing = new Map<string, Set<string>>();
      ((st as any[]) ?? []).forEach((r: any) => {
        (grouped[r.first_case_id] ??= []).push(r);
        (existing.get(r.first_case_id) ?? existing.set(r.first_case_id, new Set()).get(r.first_case_id)!).add(r.item_key);
      });
      // seed missing rows for each case
      const toInsert: any[] = [];
      rows.forEach((c) => {
        const have = existing.get(c.id) ?? new Set<string>();
        defs.forEach((d) => {
          if (!have.has(d.key)) toInsert.push({
            first_case_id: c.id, employee_id: c.employee_id, item_key: d.key, done: false,
          });
        });
      });
      if (toInsert.length) {
        const { data: created } = await supabase.from("rbt_first_session_checklist_state" as any)
          .insert(toInsert).select("*");
        ((created as any[]) ?? []).forEach((r: any) => { (grouped[r.first_case_id] ??= []).push(r); });
      }
      setState(grouped);

      const { data: ck } = await supabase.from("rbt_first_session_checkins" as any)
        .select("first_case_id").in("first_case_id", ids);
      const counts: Record<string, number> = {};
      ((ck as any[]) ?? []).forEach((r: any) => { counts[r.first_case_id] = (counts[r.first_case_id] ?? 0) + 1; });
      setCheckins(counts);
    } else {
      setState({}); setCheckins({});
    }
    setLoading(false);
  }, [employeeId]);

  useEffect(() => { void load(); }, [load]);

  const primary = useMemo(() => cases?.[0] ?? null, [cases]);
  const primaryProgress = useMemo(() => {
    if (!primary) return { done: 0, total: items.length };
    const rows = state[primary.id] ?? [];
    return { done: rows.filter((r) => r.done).length, total: items.length };
  }, [primary, state, items]);

  return { cases: cases ?? [], items, state, checkins, loading, primary, primaryProgress, reload: load };
}