import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type BcbaOnbStatus =
  | "not_started" | "in_progress" | "waiting_on_bcba" | "waiting_on_owner"
  | "submitted"   | "approved"    | "completed"       | "blocked"          | "skipped";

export type BcbaOnbOwner =
  | "bcba" | "credentialing" | "hr" | "clinical_leadership"
  | "training" | "systems" | "state_leadership" | "super_admin";

export type BcbaOnbEvidence =
  | "none" | "checkbox" | "file_upload" | "external_link" | "approval" | "comment";

export interface TemplateItem {
  id: string;
  section_key: string;
  section_label: string;
  lifecycle_stage: string;
  sort_order: number;
  title: string;
  employee_instructions: string | null;
  internal_instructions: string | null;
  owner_role: BcbaOnbOwner;
  required: boolean;
  evidence_type: BcbaOnbEvidence;
  requires_approval: boolean;
  external_link_hint: string | null;
  due_offset_days: number | null;
  depends_on_item_id: string | null;
  is_completion_gate: boolean;
  enabled: boolean;
}

export interface OnboardingItem {
  id: string;
  bcba_user_id: string;
  template_item_id: string;
  status: BcbaOnbStatus;
  assigned_owner_user_id: string | null;
  due_date: string | null;
  external_url: string | null;
  file_path: string | null;
  approved_by: string | null;
  approved_at: string | null;
  completed_at: string | null;
  template?: TemplateItem;
}

/* -------------------------------------------------------------------------- */
/*  Hook: for a single BCBA (self by default)                                 */
/* -------------------------------------------------------------------------- */

export function useBcbaOnboarding(bcbaUserId?: string) {
  const [me, setMe] = useState<string | null>(null);
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [gates, setGates] = useState<{ total: number; cleared: number; blocked: string[] }>({
    total: 0, cleared: 0, blocked: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetId = bcbaUserId ?? me;

  const load = useCallback(async () => {
    if (!targetId) return;
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase
        .from("bcba_onboarding_items")
        .select("*, template:bcba_onboarding_template_items(*)")
        .eq("bcba_user_id", targetId);
      if (e) throw e;
      const list = (data ?? []) as OnboardingItem[];
      list.sort((a, b) => {
        const ta = a.template, tb = b.template;
        if (!ta || !tb) return 0;
        return ta.lifecycle_stage.localeCompare(tb.lifecycle_stage)
          || ta.sort_order - tb.sort_order;
      });
      setItems(list);

      const { data: g } = await supabase.rpc("bcba_caseload_activation_status", {
        _bcba_user_id: targetId,
      });
      const row = Array.isArray(g) ? g[0] : g;
      setGates({
        total:   row?.total_gates ?? 0,
        cleared: row?.cleared_gates ?? 0,
        blocked: (row?.blocked_titles ?? []) as string[],
      });
    } catch (err: any) {
      setError(err?.message ?? "Failed to load onboarding");
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u.user?.id ?? null);
    })();
  }, []);

  useEffect(() => { void load(); }, [load]);

  const start = useCallback(async () => {
    if (!targetId) return;
    await supabase.rpc("start_bcba_onboarding", { _bcba_user_id: targetId });
    await load();
  }, [targetId, load]);

  const updateStatus = useCallback(
    async (itemId: string, status: BcbaOnbStatus) => {
      const { error: e } = await supabase
        .from("bcba_onboarding_items")
        .update({ status })
        .eq("id", itemId);
      if (!e) await load();
      return e;
    },
    [load],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, OnboardingItem[]>();
    for (const it of items) {
      const key = it.template?.section_label ?? "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  const progress = useMemo(() => {
    if (!items.length) return 0;
    const done = items.filter(i => i.status === "completed" || i.status === "approved").length;
    return Math.round((done / items.length) * 100);
  }, [items]);

  return { items, grouped, gates, progress, loading, error, targetId, start, updateStatus, refresh: load };
}