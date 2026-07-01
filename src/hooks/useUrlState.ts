import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Persist a piece of view state in the URL search params so views are
 * shareable and survive reloads. `defaultValue` is stripped from the URL
 * to keep the querystring clean.
 */
export function useUrlState(
  key: string,
  defaultValue: string,
): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;
  const setValue = useCallback(
    (v: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!v || v === defaultValue) next.delete(key);
          else next.set(key, v);
          return next;
        },
        { replace: true },
      );
    },
    [key, defaultValue, setParams],
  );
  return [value, setValue];
}

/** Clear a batch of URL param keys in one setParams call. */
export function useClearUrlKeys(): (keys: string[]) => void {
  const [, setParams] = useSearchParams();
  return useCallback(
    (keys: string[]) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const k of keys) next.delete(k);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
}