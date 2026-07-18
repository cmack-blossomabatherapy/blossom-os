import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ClinicalFilters } from "./types";

export function useClinicalFilters(): {
  filters: ClinicalFilters;
  setFilter: (key: keyof ClinicalFilters, value: string | null) => void;
  reset: () => void;
  applyFilters: (next: Partial<ClinicalFilters>) => void;
} {
  const [params, setParams] = useSearchParams();
  const filters = useMemo<ClinicalFilters>(
    () => ({
      state: params.get("state") || null,
      clinic: params.get("clinic") || null,
      bcbaId: params.get("bcba") || null,
    }),
    [params],
  );

  const setFilter = useCallback(
    (key: keyof ClinicalFilters, value: string | null) => {
      const next = new URLSearchParams(params);
      const paramKey = key === "bcbaId" ? "bcba" : key;
      if (value) next.set(paramKey, value);
      else next.delete(paramKey);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const reset = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete("state");
    next.delete("clinic");
    next.delete("bcba");
    setParams(next, { replace: true });
  }, [params, setParams]);

  const applyFilters = useCallback(
    (nextValues: Partial<ClinicalFilters>) => {
      const next = new URLSearchParams(params);
      const keys: Array<[keyof ClinicalFilters, string]> = [
        ["state", "state"],
        ["clinic", "clinic"],
        ["bcbaId", "bcba"],
      ];
      for (const [k, p] of keys) {
        if (k in nextValues) {
          const v = nextValues[k];
          if (v) next.set(p, v);
          else next.delete(p);
        }
      }
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  return { filters, setFilter, reset, applyFilters };
}

export function applyClientFilters<T extends { state?: string | null; clinic?: string | null; bcba_id?: string | null; assigned_bcba_id?: string | null }>(
  rows: T[],
  filters: ClinicalFilters,
): T[] {
  return rows.filter((r) => {
    if (filters.state && (r.state ?? "") !== filters.state) return false;
    if (filters.clinic && (r.clinic ?? "") !== filters.clinic) return false;
    if (filters.bcbaId) {
      const id = r.bcba_id ?? r.assigned_bcba_id ?? null;
      if (id !== filters.bcbaId) return false;
    }
    return true;
  });
}