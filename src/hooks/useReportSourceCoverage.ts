import { useEffect, useState } from "react";
import {
  fetchReportSourceCoverageFor,
  type CanonicalReportKey,
  type ReportSourceCoverage,
} from "@/lib/os/reporting/canonicalSource";

interface State {
  data: ReportSourceCoverage[] | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch source-coverage diagnostics for one or more report keys. Returns
 * loading/error/data. Cheap: aggregate RPC, no row-level PHI.
 */
export function useReportSourceCoverage(keys: CanonicalReportKey | CanonicalReportKey[]) {
  const arr = Array.isArray(keys) ? keys : [keys];
  const cacheKey = arr.slice().sort().join("|");
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fetchReportSourceCoverageFor(arr)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "Failed to load source coverage",
          });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return state;
}