/**
 * Shared hook for the canonical BCBA ownership index.
 *
 * Every non-V3 report that needs "which BCBA owns this client's hours" uses
 * this hook so all reports agree with the BCBA Productivity V3 report. The
 * heavy shared dataset is fetched once and cached by React Query.
 */
import { useQuery } from "@tanstack/react-query";
import {
  loadCanonicalOwnershipIndex,
  type CanonicalOwnershipIndex,
} from "@/lib/os/reports/crPrimary/ownership/v3Ownership";

export const BCBA_OWNERSHIP_QUERY_KEY = ["bcba-ownership-v3"] as const;

export function useBcbaOwnershipV3() {
  return useQuery<CanonicalOwnershipIndex>({
    queryKey: BCBA_OWNERSHIP_QUERY_KEY,
    queryFn: () => loadCanonicalOwnershipIndex(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
