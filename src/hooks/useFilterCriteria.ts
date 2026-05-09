import { useCallback, useMemo, useState } from "react";
import type { FilterCriterion } from "@/components/shared/FilterBar";

export type FilterValue = string | number | boolean | string[] | null | undefined;
export type FilterValues = Record<string, FilterValue>;

export interface FilterFieldDef {
  /** Field key, e.g. "status". */
  key: string;
  /** Display label, e.g. "Status". */
  label: string;
  /** Optional formatter for the chip value (defaults to String(value)). */
  format?: (value: FilterValue) => string;
}

/**
 * Manage a small bag of filter values + derive removable chips for FilterBar.
 *
 * Usage:
 *   const { values, setValue, criteria, clearAll } = useFilterCriteria(
 *     [{ key: "status", label: "Status" }, { key: "owner", label: "Owner" }],
 *     {},
 *   );
 *   <FilterBar criteria={criteria} onClearAll={clearAll} ... />
 *
 * Removing a chip clears only that one key — date range / saved view live
 * outside this hook so they're never touched.
 */
export function useFilterCriteria(fields: FilterFieldDef[], initial: FilterValues = {}) {
  const [values, setValues] = useState<FilterValues>(initial);

  const setValue = useCallback((key: string, value: FilterValue) => {
    setValues((prev) => {
      if (value === undefined || value === null || value === "" ||
          (Array.isArray(value) && value.length === 0)) {
        if (!(key in prev)) return prev;
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  const clearKey = useCallback((key: string) => setValue(key, null), [setValue]);
  const clearAll = useCallback(() => setValues({}), []);

  const criteria: FilterCriterion[] = useMemo(() => {
    const out: FilterCriterion[] = [];
    for (const f of fields) {
      const v = values[f.key];
      if (v === undefined || v === null || v === "" ||
          (Array.isArray(v) && v.length === 0)) continue;
      const display = f.format ? f.format(v) : Array.isArray(v) ? v.join(", ") : String(v);
      out.push({
        id: `${f.key}:${display}`,
        field: f.label,
        value: display,
        onRemove: () => clearKey(f.key),
      });
    }
    return out;
  }, [fields, values, clearKey]);

  return { values, setValue, setValues, clearKey, clearAll, criteria };
}