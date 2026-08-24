import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/** A flat bag of string filter values, e.g. `{ state: "NC", from: "2026-01-01" }`. */
export type StringFilters = Record<string, string>;

/**
 * Drop-in replacement for `useState<T>` that stores a flat bag of string
 * filters in the URL query string.
 *
 * Why: report pages remount for reasons outside their control (auth token
 * rotation, a reload, following a shared link). Keeping filters in the URL
 * makes the selection durable and shareable. Values equal to the default are
 * stripped so the querystring stays clean.
 */
export function useUrlFilterState<T extends object>(
  empty: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [params, setParams] = useSearchParams();

  const values = useMemo(() => {
    const out = { ...empty } as T;
    for (const key of Object.keys(empty)) {
      const raw = params.get(key);
      if (raw !== null) (out as unknown as StringFilters)[key] = raw;
    }
    return out;
  }, [params, empty]);

  const setValues = useCallback(
    (next: T | ((prev: T) => T)) => {
      setParams(
        (prev) => {
          const current = { ...empty } as T;
          for (const key of Object.keys(empty)) {
            const raw = prev.get(key);
            if (raw !== null) (current as unknown as StringFilters)[key] = raw;
          }
          const resolved = typeof next === "function" ? (next as (p: T) => T)(current) : next;
          const out = new URLSearchParams(prev);
          for (const key of Object.keys(empty)) {
            const v = String((resolved as unknown as StringFilters)[key] ?? "");
            if (!v || v === String((empty as unknown as StringFilters)[key] ?? "")) out.delete(key);
            else out.set(key, v);
          }
          return out;
        },
        { replace: true },
      );
    },
    [setParams, empty],
  );

  return [values, setValues];
}
