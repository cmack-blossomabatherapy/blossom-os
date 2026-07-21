import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Database, Loader2 } from "lucide-react";
import {
  useCanonicalClientSummary,
  useCanonicalProviderSummary,
} from "@/hooks/useCanonicalSessions";
import {
  resolvePrecedence,
  type CanonicalScope,
  type CanonicalSessionKind,
} from "@/lib/os/reporting/canonicalConsumer";

interface Props {
  title?: string;
  scope: CanonicalScope;
  /**
   * When set, the card is only rendered as a *fallback* — i.e. it renders when
   * the role-specific data source is empty. Pass the role's row count (e.g.
   * `sessions.length`) so precedence follows role → canonical → missing.
   */
  roleRowCount?: number;
  /** Kinds to highlight in the per-client breakdown (defaults to all). */
  highlightKinds?: CanonicalSessionKind[];
  /** Show the per-client breakdown table. */
  showClients?: boolean;
  /**
   * If true (default for clinician surfaces), require a mapped provider scope.
   * Reports at company scope can pass `false`.
   */
  requireScope?: boolean;
  className?: string;
}

const KIND_LABEL: Record<CanonicalSessionKind, string> = {
  direct: "Direct",
  supervision: "Supervision",
  parent_training: "Parent training",
  assessment: "Assessment",
  cancellation: "Cancellation",
  admin: "Admin",
  other: "Other",
};

function fmtDateRange(min: string | null, max: string | null): string {
  if (!min && !max) return "—";
  if (min && max && min === max) return min;
  return `${min ?? "?"} → ${max ?? "?"}`;
}

/**
 * Additive canonical-data panel. Consumes v_cr_canonical_sessions via the
 * RLS-safe RPCs. Never writes back to CentralReach. Shows source and
 * freshness on every value; when the provider is not reconciled it renders an
 * actionable diagnostic instead of a misleading zero state.
 */
export function CanonicalSessionsCard({
  title = "CentralReach imported sessions",
  scope,
  roleRowCount = 0,
  highlightKinds,
  showClients = true,
  requireScope = true,
  className,
}: Props) {
  const enabled = !requireScope || !!(scope.authUserId || scope.employeeId);
  const summary = useCanonicalProviderSummary(scope, enabled);
  const clients = useCanonicalClientSummary(scope, enabled && showClients);

  const totals = summary.data?.totals;
  const canonicalRowCount = totals?.rowCount ?? 0;

  const precedence = resolvePrecedence({
    roleRowCount,
    canonicalRowCount,
    scope,
    requireScope,
  });

  // When role data exists we still render — but as a supplementary panel.
  const isSupplementary = precedence.source === "role";

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4 text-muted-foreground" />
          {title}
          {isSupplementary && (
            <Badge variant="outline" className="text-[10px] font-normal">
              supplementary source
            </Badge>
          )}
          {precedence.source === "canonical" && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              auto-loaded (imported)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {summary.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading canonical dataset…
          </div>
        ) : summary.isError ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> Failed to load canonical data.
            <button
              type="button"
              className="underline text-xs"
              onClick={() => summary.refetch()}
            >
              Retry
            </button>
          </div>
        ) : precedence.reason === "unmapped_provider" ? (
          <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <div className="font-medium">Provider not reconciled to CentralReach yet.</div>
              <div className="text-xs text-muted-foreground">
                Owner: Admin → CentralReach Data Hub → Clinician Identity. Reports and
                calculations will use the canonical dataset automatically once the mapping is
                saved.
              </div>
            </div>
          </div>
        ) : canonicalRowCount === 0 ? (
          <div className="text-xs text-muted-foreground">
            No canonical rows in scope. Upload or sync a CentralReach billing export in the
            CentralReach Data Hub, or narrow filters.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Source: v_cr_canonical_sessions ·{" "}
                <span className="text-foreground font-medium">
                  {totals?.rowCount.toLocaleString()} rows
                </span>
              </span>
              <span>DOS range: {fmtDateRange(totals?.minServiceDate ?? null, totals?.maxServiceDate ?? null)}</span>
              <span>Clients: {totals?.distinctClients ?? 0}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(summary.data?.rows ?? []).map((r) => (
                <div
                  key={r.sessionKind}
                  className={`rounded-md border p-2 ${
                    highlightKinds?.includes(r.sessionKind)
                      ? "border-primary/40 bg-primary/5"
                      : ""
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {KIND_LABEL[r.sessionKind]}
                  </div>
                  <div className="text-lg font-semibold">
                    {r.hours.toFixed(1)}
                    <span className="text-[11px] text-muted-foreground ml-1">hrs</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {r.rowCount.toLocaleString()} rows · {r.distinctClients} clients
                  </div>
                </div>
              ))}
            </div>

            {showClients && clients.data && clients.data.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                  Top clients in scope
                </div>
                <div className="grid gap-1">
                  {(() => {
                    const roll = new Map<
                      string,
                      { name: string | null; hours: number; kinds: Set<string> }
                    >();
                    for (const c of clients.data ?? []) {
                      const cur = roll.get(c.crClientId) ?? {
                        name: c.clientName,
                        hours: 0,
                        kinds: new Set<string>(),
                      };
                      cur.hours += c.hours;
                      cur.kinds.add(c.sessionKind);
                      cur.name = cur.name ?? c.clientName;
                      roll.set(c.crClientId, cur);
                    }
                    const top = Array.from(roll.entries())
                      .sort((a, b) => b[1].hours - a[1].hours)
                      .slice(0, 8);
                    return top.map(([id, v]) => (
                      <div
                        key={id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="truncate">{v.name ?? id}</span>
                        <span className="font-mono text-muted-foreground">
                          {v.hours.toFixed(1)}h · {Array.from(v.kinds).join(", ")}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default CanonicalSessionsCard;