import { useState } from "react";
import { Loader2, Inbox, Check, X } from "lucide-react";
import { useStaffingHandoffs } from "@/hooks/useStaffingHandoff";
import { cn } from "@/lib/utils";
import { useOperatorDialogs } from "@/components/os/OperatorDialogs";

/**
 * Staffing / Operations review queue for manual recruiting handoffs.
 * Recruiting proposes; this is where the final assignment decision is made
 * and audited (recruiting_staffing_need_events).
 */
export function StaffingHandoffReviewQueue({ className }: { className?: string }) {
  const { handoffs, loading, decide } = useStaffingHandoffs();
  const { promptOperator, confirmOperator } = useOperatorDialogs();
  const [busy, setBusy] = useState<string | null>(null);
  const open = handoffs.filter((h) => h.handoff_status === "pending_review" || h.handoff_status === "proposed");

  const act = async (id: string, to: "accepted" | "declined" | "cancelled") => {
    setBusy(id);
    let reason: string | undefined;
    if (to === "declined") {
      const input = await promptOperator({
        title: "Decline staffing proposal",
        description: "Recruiting will see this reason on the candidate record.",
        label: "Reason",
        multiline: true,
        required: true,
        submitLabel: "Decline proposal",
      });
      if (input === null) { setBusy(null); return; }
      reason = input;
    } else if (to === "accepted") {
      const ok = await confirmOperator({
        title: "Accept staffing proposal",
        description: "This assigns the proposed match and closes the staffing need.",
        confirmLabel: "Accept and assign",
      });
      if (!ok) { setBusy(null); return; }
    }
    await decide(id, to, reason);
    setBusy(null);
  };

  return (
    <section className={cn("rounded-2xl border border-border/70 bg-card", className)}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold">Recruiting staffing proposals</h3>
          <p className="text-[11px] text-muted-foreground">
            Manual handoffs from Recruiting awaiting a staffing decision.
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground">{open.length} pending</span>
      </div>
      <div className="divide-y divide-border/60">
        {loading && (
          <div className="px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading proposals…
          </div>
        )}
        {!loading && open.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            <Inbox className="h-4 w-4 mx-auto mb-1.5" aria-hidden />
            No staffing proposals waiting on review.
          </div>
        )}
        {open.map((h) => (
          <div key={h.id} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{h.client_label}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {h.role_needed} · {h.state}{h.city ? ` · ${h.city}` : ""}
                {h.service_setting ? ` · ${h.service_setting}` : ""}
                {h.required_availability ? ` · ${h.required_availability}` : ""}
                {h.desired_start_date ? ` · start ${h.desired_start_date}` : ""}
              </div>
              {h.handoff_blocker && (
                <div className="text-[11px] text-amber-700 dark:text-amber-400">{h.handoff_blocker}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Accept staffing proposal for ${h.client_label}`}
                disabled={busy === h.id}
                onClick={() => act(h.id, "accepted")}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
              >
                {busy === h.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Accept
              </button>
              <button
                type="button"
                aria-label={`Decline staffing proposal for ${h.client_label}`}
                disabled={busy === h.id}
                onClick={() => act(h.id, "declined")}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/70 text-xs font-medium hover:bg-muted/40 disabled:opacity-50"
              >
                <X className="h-3 w-3" /> Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
