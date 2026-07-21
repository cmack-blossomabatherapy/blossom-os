import { useQuery } from "@tanstack/react-query";
import {
  type CanonicalRowFilter,
  type CanonicalScope,
  fetchCanonicalClientSummary,
  fetchCanonicalProviderSummary,
  fetchCanonicalSessionRows,
  fetchCanonicalUnmappedProviders,
  summarizeProviderRows,
} from "@/lib/os/reporting/canonicalConsumer";

function scopeKey(s: CanonicalScope) {
  return [
    s.authUserId ?? "any",
    s.employeeId ?? "any",
    s.start ?? "any",
    s.end ?? "any",
  ];
}

/**
 * Provider-scoped aggregates. Callers that need a company-wide roll-up (e.g.
 * Reports) may pass an empty scope. Clinician surfaces (BCBA/RBT) should pass
 * `scopedAuthUserId` so preview mode never leaks outside the previewed user.
 */
export function useCanonicalProviderSummary(scope: CanonicalScope, enabled = true) {
  return useQuery({
    queryKey: ["canonical-provider-summary", ...scopeKey(scope)],
    enabled,
    queryFn: () => fetchCanonicalProviderSummary(scope),
    select: (rows) => ({ rows, totals: summarizeProviderRows(rows) }),
    staleTime: 60_000,
  });
}

export function useCanonicalClientSummary(scope: CanonicalScope, enabled = true) {
  return useQuery({
    queryKey: ["canonical-client-summary", ...scopeKey(scope)],
    enabled,
    queryFn: () => fetchCanonicalClientSummary(scope),
    staleTime: 60_000,
  });
}

export function useCanonicalSessionRows(filter: CanonicalRowFilter, enabled = true) {
  return useQuery({
    queryKey: [
      "canonical-session-rows",
      ...scopeKey(filter),
      filter.clientId ?? "any",
      (filter.kinds ?? []).join(",") || "all",
      filter.limit ?? 500,
    ],
    enabled,
    queryFn: () => fetchCanonicalSessionRows(filter),
    staleTime: 60_000,
  });
}

export function useCanonicalUnmappedProviders(limit = 25, enabled = true) {
  return useQuery({
    queryKey: ["canonical-unmapped-providers", limit],
    enabled,
    queryFn: () => fetchCanonicalUnmappedProviders(limit),
    staleTime: 300_000,
  });
}