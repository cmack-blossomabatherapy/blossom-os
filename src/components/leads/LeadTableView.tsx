import { Lead, statusVariant, priorityVariant, getInlineAlert } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface LeadTableViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export function LeadTableView({ leads, onSelectLead }: LeadTableViewProps) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs w-[70px]">ID</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Lead Name</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Phone</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs w-[50px]">State</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs w-[60px]">Priority</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Owner</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Form</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">VOB</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs w-[50px]">Days</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Next Action</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const alert = getInlineAlert(lead);
              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/20"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{lead.id}</td>
                  <td className="px-3 py-2.5">
                    <div>
                      <span className="font-medium text-foreground">{lead.childName}</span>
                      <span className="text-muted-foreground ml-1 text-xs">({lead.parentName})</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{lead.phone}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.state} variant="muted" /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.status} variant={statusVariant(lead.status)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.priority} variant={priorityVariant(lead.priority)} /></td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{lead.owner}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.formStatus} variant={lead.formStatus === "Completed" ? "success" : lead.formStatus === "Sent" || lead.formStatus === "Viewed" ? "warning" : "muted"} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.vobStatus} variant={lead.vobStatus === "Completed" ? "success" : lead.vobStatus === "Sent" ? "warning" : lead.vobStatus === "Issue" ? "destructive" : "muted"} /></td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{lead.daysInStage}d</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[160px] truncate">{lead.nextAction}</td>
                  <td className="px-3 py-2.5">
                    {alert && (
                      alert.type === "red"
                        ? <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
