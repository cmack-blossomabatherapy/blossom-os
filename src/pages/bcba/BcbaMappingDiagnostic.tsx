import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBcbaIdentity, shouldShowMappingDiagnostic } from "./useBcbaIdentity";

/**
 * Actionable clinician-mapping banner. Shown whenever the current BCBA
 * subject either has no employee row or was matched via unverified name
 * fallback. Guides admins to the CentralReach Clinician Identity console
 * instead of leaving the page with a misleading empty state.
 */
export function BcbaMappingDiagnostic({ onRetry }: { onRetry?: () => void }) {
  const id = useBcbaIdentity();
  const kind = shouldShowMappingDiagnostic(id);
  if (!kind) return null;

  const title =
    kind === "missing"
      ? "We couldn't link this account to an employee record"
      : "This account is matched by name — please verify";
  const detail =
    kind === "missing"
      ? "Caseload, RBTs and supervision data are scoped to your employee record. Without a link, we won't show partial or misleading results."
      : "Blossom OS matched this login to an employee by normalized name. Confirm the CentralReach provider mapping so imported billing, sessions and supervision route correctly.";

  return (
    <div
      role="alert"
      data-testid="bcba-mapping-diagnostic"
      data-diagnostic-kind={kind}
      className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3"
    >
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">{title}</div>
        <p className="text-xs text-amber-900/80 dark:text-amber-100/80 mt-1">{detail}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline" className="gap-1">
            <Link to="/admin/centralreach-sync">
              <ExternalLink className="h-3.5 w-3.5" /> Open Clinician Identity
            </Link>
          </Button>
          {onRetry && (
            <Button size="sm" variant="ghost" onClick={onRetry} className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}