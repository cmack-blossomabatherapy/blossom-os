/**
 * useIntegrationCatalog
 *
 * Live-loads the `integration_catalog` table so admins can manage the
 * canonical set of integration registry keys (add/edit/disable). Downstream
 * dropdowns (IntegrationRegistrySelect) read from here so any change in
 * Settings > Integration Registry immediately affects the options users see.
 *
 * Falls back to the static BLOSSOM_INTEGRATIONS registry if the backend
 * fetch fails or has not returned yet, so the UI never appears empty.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BLOSSOM_INTEGRATIONS } from "@/lib/os/integrations/integrationRegistry";

export interface IntegrationCatalogRow {
  id: string;
  display_name: string;
  category: string;
  owner_department: string | null;
  criticality: string;
  methods: string[];
  status: string;
  source_of_truth_for: string[];
  dependent_modules: string[];
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyClient = supabase as any;

/** All catalog rows including disabled entries (for the management screen). */
export function useIntegrationCatalog() {
  const [rows, setRows] = useState<IntegrationCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await anyClient
      .from("integration_catalog")
      .select("*")
      .order("display_name", { ascending: true });
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setError(null);
      setRows((data ?? []) as IntegrationCatalogRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upsert = useCallback(
    async (row: Partial<IntegrationCatalogRow> & { id: string; display_name: string; category: string; criticality: string; status: string }) => {
      const payload = {
        ...row,
        methods: row.methods ?? [],
        source_of_truth_for: row.source_of_truth_for ?? [],
        dependent_modules: row.dependent_modules ?? [],
      };
      const { error } = await anyClient
        .from("integration_catalog")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;
      await load();
    },
    [load],
  );

  const setStatus = useCallback(
    async (id: string, status: string) => {
      const { error } = await anyClient
        .from("integration_catalog")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await anyClient
        .from("integration_catalog")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  return { rows, loading, error, reload: load, upsert, setStatus, remove };
}

/**
 * Options for the dropdown selector. Filters out disabled entries so users
 * can never pick a retired integration. Falls back to the static registry
 * while the initial fetch is in-flight or on error.
 */
export function useIntegrationCatalogOptions() {
  const [options, setOptions] = useState<{ id: string; label: string }[]>(
    BLOSSOM_INTEGRATIONS
      .filter((i) => !i.internalOnly && i.status !== "disabled")
      .map((i) => ({ id: i.id, label: i.displayName ?? i.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await anyClient
        .from("integration_catalog")
        .select("id, display_name, status")
        .neq("status", "disabled")
        .order("display_name", { ascending: true });
      if (cancelled) return;
      if (!error && Array.isArray(data) && data.length > 0) {
        setOptions(
          data.map((r: { id: string; display_name: string }) => ({
            id: r.id,
            label: r.display_name,
          })),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return options;
}