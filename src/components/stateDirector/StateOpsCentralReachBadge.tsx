import { Badge } from "@/components/ui/badge";
import { Link2Off } from "lucide-react";

/**
 * Honest CentralReach connection status for the State Ops workspace.
 *
 * CentralReach is the clinical EMR/source-of-truth. Blossom OS State Ops
 * records (tasks, escalations, handoffs) are NOT imported into CentralReach —
 * they link to CentralReach *client / service context* once that integration
 * is live. Until then we surface a neutral "not connected" badge.
 *
 * `pendingCount` is accepted for backward compatibility with existing call
 * sites but is intentionally not surfaced as "pending import" copy.
 */
export function StateOpsCentralReachSummaryBadge({
  pendingCount: _pendingCount,
  className,
}: {
  pendingCount?: number;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={`gap-1 border bg-muted/40 text-muted-foreground border-border/60 ${className ?? ""}`}
    >
      <Link2Off className="h-3 w-3" aria-hidden />
      <span className="text-[11px] font-medium">
        CentralReach context: not connected yet — State Ops records will link to CentralReach client context once the connector is live.
      </span>
    </Badge>
  );
}