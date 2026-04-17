import { Lead, statusVariant, priorityVariant, getInlineAlert } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, AlertTriangle, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadTableViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const formVariant = (s: Lead["formStatus"]) =>
  s === "Completed" ? "success" : s === "Sent" || s === "Viewed" ? "warning" : "muted";
const consentVariant = (s: Lead["consentStatus"]) =>
  s === "Completed" ? "success" : s === "Sent" ? "warning" : "muted";
const reviewVariant = (s: Lead["formReviewStatus"]) =>
  s === "Complete" ? "success" : s === "Missing Information" ? "destructive" : "muted";
const vobVariant = (s: Lead["vobStatus"]) =>
  s === "Completed" || s === "Approved" ? "success" :
  s === "Issue" ? "destructive" :
  s === "Payment Plan Required" ? "warning" :
  s === "Sent" || s === "Received" ? "warning" : "muted";

export function LeadTableView({ leads, onSelectLead, selectedIds, onSelectionChange }: LeadTableViewProps) {
  const allSelected = leads.length > 0 && selectedIds.length === leads.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    onSelectionChange(allSelected ? [] : leads.map((l) => l.id));
  };
  const toggleOne = (id: string) => {
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur-md">
            <tr className="border-b border-border">
              <th className="w-10 px-3 py-2.5">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              {[
                { label: "ID", w: "w-[70px]" },
                { label: "Lead / Parent" },
                { label: "Phone" },
                { label: "State", w: "w-[55px]" },
                { label: "Source", w: "w-[80px]" },
                { label: "Status" },
                { label: "Coordinator" },
                { label: "Form" },
                { label: "Consent" },
                { label: "Review" },
                { label: "VOB" },
                { label: "Priority", w: "w-[70px]" },
                { label: "Days", w: "w-[55px]" },
                { label: "Last Contact", w: "w-[90px]" },
                { label: "Next Action" },
                { label: "Alerts", w: "w-[40px]" },
              ].map(({ label, w }) => (
                <th
                  key={label}
                  className={cn(
                    "text-left px-3 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wider whitespace-nowrap",
                    w,
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {["Status", "Days", "Priority"].includes(label) && (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={17} className="px-6 py-16 text-center">
                  <p className="text-sm text-muted-foreground">No leads match your filters</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Try clearing filters or adjusting your search</p>
                </td>
              </tr>
            )}
            {leads.map((lead) => {
              const alert = getInlineAlert(lead);
              const isSelected = selectedIds.includes(lead.id);
              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={cn(
                    "border-b border-border/40 cursor-pointer transition-colors group",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/30",
                  )}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(lead.id)} aria-label={`Select ${lead.id}`} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{lead.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-foreground text-sm leading-tight">{lead.childName}</div>
                    <div className="text-muted-foreground text-xs">{lead.parentName}</div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{lead.phone}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.state} variant="muted" /></td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{lead.source}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.status} variant={statusVariant(lead.status)} /></td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{lead.owner}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.formStatus} variant={formVariant(lead.formStatus)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.consentStatus} variant={consentVariant(lead.consentStatus)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.formReviewStatus} variant={reviewVariant(lead.formReviewStatus)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.vobStatus} variant={vobVariant(lead.vobStatus)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={lead.priority} variant={priorityVariant(lead.priority)} /></td>
                  <td className="px-3 py-2.5">
                    <span className={cn(
                      "text-xs font-medium",
                      lead.daysInStage >= 5 ? "text-destructive" : lead.daysInStage >= 3 ? "text-warning" : "text-muted-foreground",
                    )}>
                      {lead.daysInStage}d
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                    {lead.lastContacted
                      ? new Date(lead.lastContacted).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : <span className="text-destructive/70">Never</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px] truncate">{lead.nextAction}</td>
                  <td className="px-3 py-2.5">
                    {alert && (
                      <div className="group/alert relative">
                        {alert.type === "red"
                          ? <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          : <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                        <div className="absolute right-0 top-5 z-20 hidden group-hover/alert:block bg-foreground text-background text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                          {alert.message}
                        </div>
                      </div>
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
