import { Lead, statusVariant, getInlineAlert } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertCircle, Phone, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

interface LeadQueueViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

interface QueueGroup {
  title: string;
  icon: React.ReactNode;
  color: string;
  leads: Lead[];
}

export function LeadQueueView({ leads, onSelectLead }: LeadQueueViewProps) {
  const groups: QueueGroup[] = [
    {
      title: "Contact Now",
      icon: <Phone className="h-4 w-4 text-destructive" />,
      color: "border-l-destructive",
      leads: leads.filter((l) => l.status === "New Lead" || (l.status === "In Contact" && l.daysInStage >= 1)),
    },
    {
      title: "Follow Up",
      icon: <Clock className="h-4 w-4 text-warning" />,
      color: "border-l-warning",
      leads: leads.filter((l) => ["Sent Form", "Missing Information"].includes(l.status)),
    },
    {
      title: "Ready to Process",
      icon: <CheckCircle2 className="h-4 w-4 text-success" />,
      color: "border-l-success",
      leads: leads.filter((l) => ["Form Received", "Sent to VOB", "VOB Completed"].includes(l.status) || l.financialStatus === "Approved" || l.paymentPlanSigned),
    },
    {
      title: "Problem Leads",
      icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
      color: "border-l-destructive",
      leads: leads.filter((l) => ["Can't Reach", "Can Not Submit Auth"].includes(l.status)),
    },
  ];

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <div className="flex items-center gap-2 mb-3">
            {group.icon}
            <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{group.leads.length}</span>
          </div>

          {group.leads.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-6">No leads in this group</p>
          ) : (
            <div className="space-y-2">
              {group.leads.map((lead) => {
                const alert = getInlineAlert(lead);
                return (
                  <button
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={`w-full text-left bg-card rounded-lg border border-border/60 p-3 hover:shadow-md transition-shadow border-l-[3px] ${group.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium text-foreground">{lead.childName}</span>
                          <span className="text-xs text-muted-foreground ml-2">{lead.parentName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={lead.status} variant={statusVariant(lead.status)} />
                        <span className="text-xs text-muted-foreground">{lead.daysInStage}d</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{lead.nextAction}</p>
                      {alert && (
                        <div className={`flex items-center gap-1 text-[10px] ${alert.type === "red" ? "text-destructive" : "text-warning"}`}>
                          <AlertCircle className="h-3 w-3" />
                          {alert.message}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {lead.formStatus} form · {lead.vobStatus} VOB · {lead.financialStatus} · {lead.paymentPlanStatus}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
