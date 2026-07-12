import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RoleJourneyOverrides } from "@/lib/training/roleJourneyAssignments";

export interface RoleJourneyRow {
  role_slug: string;
  path_slug: string;
  notes: string | null;
  updated_at: string;
}

interface UseRoleJourneyAssignments {
  rows: RoleJourneyRow[];
  overrides: RoleJourneyOverrides;
  loading: boolean;
  save: (roleSlug: string, pathSlug: string, notes?: string | null) => Promise<{ ok: boolean; error?: string }>;
  clear: (roleSlug: string) => Promise<{ ok: boolean; error?: string }>;
  clearAll: () => Promise<{ ok: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export function useRoleJourneyAssignments(): UseRoleJourneyAssignments {
  const [rows, setRows] = useState<RoleJourneyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("training_role_journey_assignments")
      .select("role_slug,path_slug,notes,updated_at");
    if (!error && data) setRows(data as RoleJourneyRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("training-role-journey-assignments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "training_role_journey_assignments" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const save = useCallback(
    async (roleSlug: string, pathSlug: string, notes?: string | null) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("training_role_journey_assignments")
        .upsert(
          {
            role_slug: roleSlug,
            path_slug: pathSlug,
            notes: notes ?? null,
            updated_by: userRes.user?.id ?? null,
          },
          { onConflict: "role_slug" },
        );
      if (error) return { ok: false, error: error.message };
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  const clear = useCallback(
    async (roleSlug: string) => {
      const { error } = await supabase
        .from("training_role_journey_assignments")
        .delete()
        .eq("role_slug", roleSlug);
      if (error) return { ok: false, error: error.message };
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  const clearAll = useCallback(async () => {
    const { error } = await supabase
      .from("training_role_journey_assignments")
      .delete()
      .not("role_slug", "is", null);
    if (error) return { ok: false, error: error.message };
    await refresh();
    return { ok: true };
  }, [refresh]);

  const overrides: RoleJourneyOverrides = {};
  for (const r of rows) overrides[r.role_slug] = r.path_slug;

  return { rows, overrides, loading, save, clear, clearAll, refresh };
}