import { Phone, MessageSquare, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  callParent,
  sendLeadSms,
  sendLeadEmail,
  notifyCommunicationResult,
} from "@/lib/integrations/communications/communicationAdapters";
import type { LeadCommunicationContext } from "@/lib/integrations/communications/communicationTypes";

export interface LeadContactActionsLead {
  id: string;
  phone?: string | null;
  email?: string | null;
  parentName?: string | null;
  childName?: string | null;
  state?: string | null;
  insurance?: string | null;
}

function toContext(lead: LeadContactActionsLead): LeadCommunicationContext {
  return {
    leadId: lead.id,
    phone: lead.phone ?? null,
    email: lead.email ?? null,
    parentName: lead.parentName ?? null,
    childName: lead.childName ?? null,
    state: lead.state ?? null,
    insurance: lead.insurance ?? null,
  };
}

async function runCall(lead: LeadContactActionsLead) {
  if (!lead.phone) {
    toast.error("No phone number on this lead");
    return;
  }
  notifyCommunicationResult(await callParent(toContext(lead)));
}
async function runSms(lead: LeadContactActionsLead) {
  if (!lead.phone) {
    toast.error("No phone number on this lead");
    return;
  }
  notifyCommunicationResult(await sendLeadSms(toContext(lead)));
}
async function runEmail(lead: LeadContactActionsLead) {
  if (!lead.email) {
    toast.error("No email on this lead");
    return;
  }
  notifyCommunicationResult(await sendLeadEmail(toContext(lead)));
}

/** Full-width Call / SMS / Email button row — used in lead detail surfaces. */
export function LeadContactActions({
  lead, className,
}: { lead: LeadContactActionsLead; className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      <button
        type="button"
        onClick={() => runCall(lead)}
        disabled={!lead.phone}
        className="flex items-center justify-center gap-2 h-10 rounded-xl border border-border/60 bg-card text-sm font-medium hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Phone className="h-4 w-4" /> Call
      </button>
      <button
        type="button"
        onClick={() => runSms(lead)}
        disabled={!lead.phone}
        className="flex items-center justify-center gap-2 h-10 rounded-xl border border-border/60 bg-card text-sm font-medium hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MessageSquare className="h-4 w-4" /> SMS
      </button>
      <button
        type="button"
        onClick={() => runEmail(lead)}
        disabled={!lead.email}
        className="flex items-center justify-center gap-2 h-10 rounded-xl border border-border/60 bg-card text-sm font-medium hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Mail className="h-4 w-4" /> Email
      </button>
    </div>
  );
}

/** Compact icon-only row for tables, queue cards, pipeline tiles. */
export function LeadContactIconActions({
  lead, className, size = "sm",
}: { lead: LeadContactActionsLead; className?: string; size?: "xs" | "sm" }) {
  const dim = size === "xs" ? "h-6 w-6" : "h-7 w-7";
  const icon = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  const stop = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); };
  return (
    <div className={cn("inline-flex items-center gap-1", className)} onClick={stop}>
      <button
        type="button"
        title={lead.phone ? `Call ${lead.phone}` : "No phone on file"}
        aria-label="Call parent"
        disabled={!lead.phone}
        onClick={(e) => { stop(e); void runCall(lead); }}
        className={cn(
          "grid place-items-center rounded-md border border-border/60 bg-card text-foreground hover:bg-muted transition",
          dim,
          !lead.phone && "opacity-40 cursor-not-allowed",
        )}
      >
        <Phone className={icon} />
      </button>
      <button
        type="button"
        title={lead.phone ? `Text ${lead.phone}` : "No phone on file"}
        aria-label="Send SMS"
        disabled={!lead.phone}
        onClick={(e) => { stop(e); void runSms(lead); }}
        className={cn(
          "grid place-items-center rounded-md border border-border/60 bg-card text-foreground hover:bg-muted transition",
          dim,
          !lead.phone && "opacity-40 cursor-not-allowed",
        )}
      >
        <MessageSquare className={icon} />
      </button>
      <button
        type="button"
        title={lead.email ? `Email ${lead.email}` : "No email on file"}
        aria-label="Send email"
        disabled={!lead.email}
        onClick={(e) => { stop(e); void runEmail(lead); }}
        className={cn(
          "grid place-items-center rounded-md border border-border/60 bg-card text-foreground hover:bg-muted transition",
          dim,
          !lead.email && "opacity-40 cursor-not-allowed",
        )}
      >
        <Mail className={icon} />
      </button>
    </div>
  );
}