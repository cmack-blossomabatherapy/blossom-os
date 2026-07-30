import { useState } from "react";
import { Loader2, Inbox, Check, X, MessageCircleQuestion, History, ChevronDown } from "lucide-react";
import {
  useStaffingHandoffs,
  useStaffingHandoffEvents,
  type HandoffStatus,
  type StaffingHandoff,
} from "@/hooks/useStaffingHandoff";
import { cn } from "@/lib/utils";
import { useOperatorDialogs } from "@/components/os/OperatorDialogs";

/**
 * Staffing / Operations review queue for manual recruiting handoffs.
 * Recruiting proposes; this is where the assignment decision is made —
 * approve, ask Recruiting for clarification, or decline. Every step is
 * audited in `recruiting_staffing_need_events` and readable inline.
 */

const STATUS_LABEL: Record<string, string> = {
  proposed: "Proposed",
  pending_review: "Awaiting decision",
  needs_clarification: "With Recruiting",
  accepted: "Approved",
  declined: "Declined",
  cancelled: "Cancelled",
};

const EVENT_LABEL: Record<string, string> = {
  handoff_proposed: "Proposed by Recruiting",
  handoff_pending_review: "Sent for staffing review",
  handoff_needs_clarification: "Clarification requested",
  handoff_accepted: "Approved and assigned",
  handoff_declined: "Declined",
  handoff_cancelled: "Cancelled",
};

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        status === "needs_clarification"
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : status === "accepted"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-muted text-muted-foreground",
      )}
    >
      {STATUS_LABEL[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

function AuditTrail({ needId }: { needId: string }) {
  const { events, loading } = useStaffingHandoffEvents(needId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-1 py-2 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Loading history…
      </div>
    );
  }
  if (events.length === 0) {
    return <p className="px-1 py-2 text-[11px] text-muted-foreground">No recorded activity yet.</p>;
  }
  return (
    <ol className="mt-1 space-y-2 border-l border-border/60 pl-3">
      {events.map((e) => (
        <li key={e.id} className="text-[11px]">
          <div className="font-medium text-foreground">
            {EVENT_LABEL[e.event_type] ?? e.event_type.replace(/_/g, " ")}
          </div>
          <div className="text-muted-foreground">
            {new Date(e.created_at).toLocaleString()}
            {e.from_status && e.to_status ? ` · ${STATUS_LABEL[e.from_status] ?? e.from_status} → ${STATUS_LABEL[e.to_status] ?? e.to_status}` : ""}
          </div>
          {e.note && <div className="mt-0.5 text-muted-foreground italic">“{e.note}”</div>}
        </li>
      ))}
    </ol>
  );
}

export function StaffingHandoffReviewQueue({ className }: { className?: string }) {
  const { handoffs, loading, decide, requestClarification } = useStaffingHandoffs();
  const { promptOperator, confirmOperator } = useOperatorDialogs();
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const openStatuses: HandoffStatus[] = ["pending_review", "proposed", "needs_clarification"];
  const open = handoffs.filter((h) => openStatuses.includes(h.handoff_status));
  const awaitingDecision = open.filter((h) => h.handoff_status !== "needs_clarification").length;

  const act = async (h: StaffingHandoff, to: "accepted" | "declined" | "needs_clarification") => {
    setBusy(h.id);
    try {
      if (to === "declined") {
        const input = await promptOperator({
          title: "Decline staffing proposal",
          description: "Recruiting will see this reason on the candidate record.",
          label: "Reason",
          multiline: true,
          required: true,
          submitLabel: "Decline proposal",
        });
        if (input === null) return;
        await decide(h.id, to, input);
        return;
      }
      if (to === "needs_clarification") {
        const input = await promptOperator({
          title: "Ask Recruiting for clarification",
          description: "The proposal stays open and returns to Recruiting with your question.",
          label: "What do you need clarified?",
          multiline: true,
          required: true,
          submitLabel: "Send to Recruiting",
        });
        if (input === null) return;
        await requestClarification(h.id, input);
        return;
      }
      const ok = await confirmOperator({
        title: "Approve staffing proposal",
        description: "This assigns the proposed match and closes the staffing need.",
        confirmLabel: "Approve and assign",
      });
      if (!ok) return;
      await decide(h.id, "accepted");
    } finally {
      setBusy(null);
    }
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
        <span className="text-[11px] text-muted-foreground">{awaitingDecision} awaiting decision</span>
      </div>
      <div className="divide-y divide-border/60">
        {loading && (
          <div className="flex items-center gap-2 px-4 py-6 text-xs text-muted-foreground">
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
          <div key={h.id} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{h.client_label}</span>
                  <StatusChip status={h.handoff_status} />
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {h.role_needed} · {h.state}{h.city ? ` · ${h.city}` : ""}
                  {h.service_setting ? ` · ${h.service_setting}` : ""}
                  {h.required_availability ? ` · ${h.required_availability}` : ""}
                  {h.desired_start_date ? ` · start ${h.desired_start_date}` : ""}
                </div>
                {h.handoff_blocker && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-400">{h.handoff_blocker}</div>
                )}
                {h.handoff_status === "needs_clarification" && h.decision_reason && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-400">
                    Waiting on Recruiting: {h.decision_reason}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Approve staffing proposal for ${h.client_label}`}
                  disabled={busy === h.id}
                  onClick={() => act(h, "accepted")}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  {busy === h.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Approve
                </button>
                <button
                  type="button"
                  aria-label={`Ask Recruiting for clarification on ${h.client_label}`}
                  disabled={busy === h.id}
                  onClick={() => act(h, "needs_clarification")}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/70 text-xs font-medium hover:bg-muted/40 disabled:opacity-50"
                >
                  <MessageCircleQuestion className="h-3 w-3" /> Clarify
                </button>
                <button
                  type="button"
                  aria-label={`Decline staffing proposal for ${h.client_label}`}
                  disabled={busy === h.id}
                  onClick={() => act(h, "declined")}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/70 text-xs font-medium hover:bg-muted/40 disabled:opacity-50"
                >
                  <X className="h-3 w-3" /> Decline
                </button>
              </div>
            </div>
            <button
              type="button"
              aria-expanded={expanded === h.id}
              aria-label={`History for ${h.client_label}`}
              onClick={() => setExpanded(expanded === h.id ? null : h.id)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <History className="h-3 w-3" aria-hidden />
              History
              <ChevronDown
                className={cn("h-3 w-3 transition-transform", expanded === h.id && "rotate-180")}
                aria-hidden
              />
            </button>
            {expanded === h.id && <AuditTrail needId={h.id} />}
          </div>
        ))}
      </div>
    </section>
  );
}
