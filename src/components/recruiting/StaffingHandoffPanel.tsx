import { useState } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useStaffingHandoffs } from "@/hooks/useStaffingHandoff";
import { StaffingHandoffDialog, staffingBlockerFor, type HandoffCandidate } from "./StaffingHandoffDialog";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  proposed: "Proposed (blocked)",
  pending_review: "Pending staffing review",
  accepted: "Accepted / assigned",
  declined: "Declined",
  cancelled: "Cancelled",
};

/**
 * Recruiter-side view of manual staffing handoffs for one candidate.
 * Read-only history + a "Propose staffing match" action. Staffing and
 * Operations own the accept/decline decision in their own queues.
 */
export function StaffingHandoffPanel({
  candidate, roleNeeded, className,
}: {
  candidate: HandoffCandidate;
  roleNeeded: "RBT" | "BCBA";
  className?: string;
}) {
  const { handoffs, loading } = useStaffingHandoffs(candidate.id);
  const [open, setOpen] = useState(false);
  const blocker = staffingBlockerFor(candidate);

  return (
    <div className={cn("rounded-xl border border-border/70 bg-card", className)}>
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/60">
        <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground">Staffing handoff</h4>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border/70 text-[11px] font-medium hover:bg-muted/40 transition"
        >
          <ArrowRightLeft className="h-3 w-3" aria-hidden />
          Propose staffing match
        </button>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {loading && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading handoffs…
          </div>
        )}
        {!loading && handoffs.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            No staffing proposals yet for this candidate.
          </p>
        )}
        {handoffs.map((h) => (
          <div key={h.id} className="flex items-start justify-between gap-3 text-[11px]">
            <div className="min-w-0">
              <div className="font-medium truncate">{h.client_label}</div>
              <div className="text-muted-foreground truncate">
                {h.role_needed} · {h.state}{h.city ? ` · ${h.city}` : ""}
                {h.desired_start_date ? ` · starts ${h.desired_start_date}` : ""}
              </div>
              {h.handoff_blocker && (
                <div className="text-amber-700 dark:text-amber-400">{h.handoff_blocker}</div>
              )}
            </div>
            <span className="shrink-0 rounded-full border border-border/70 px-2 py-0.5">
              {STATUS_LABEL[h.handoff_status] ?? h.handoff_status}
            </span>
          </div>
        ))}
        {blocker && (
          <p className="text-[11px] text-muted-foreground pt-1">
            Not staffing-ready yet — a proposal will be saved as a future match.
          </p>
        )}
      </div>

      <StaffingHandoffDialog
        open={open}
        onOpenChange={setOpen}
        candidate={candidate}
        roleNeeded={roleNeeded}
      />
    </div>
  );
}
