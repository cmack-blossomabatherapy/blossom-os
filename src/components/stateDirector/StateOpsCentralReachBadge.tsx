import { Badge } from "@/components/ui/badge";
import { CloudUpload, CheckCircle2 } from "lucide-react";

/** Honest CentralReach sync summary for the State Ops workspace. */
export function StateOpsCentralReachSummaryBadge({
  pendingCount,
  className,
}: {
  pendingCount: number;
  className?: string;
}) {
  if (pendingCount <= 0) {
    return (
      <Badge variant="outline" className={`gap-1 border bg-emerald-50 text-emerald-700 border-emerald-200 ${className ?? ""}`}>
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        <span className="text-[11px] font-medium">State ops records ready for CentralReach import</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`gap-1 border bg-amber-50 text-amber-800 border-amber-200 ${className ?? ""}`}>
      <CloudUpload className="h-3 w-3" aria-hidden />
      <span className="text-[11px] font-medium">
        {pendingCount} state ops record{pendingCount === 1 ? "" : "s"} pending CentralReach import
      </span>
    </Badge>
  );
}