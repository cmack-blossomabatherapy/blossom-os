import { Lead, statusVariant, priorityVariant, getInlineAlert } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { LeadContactIconActions } from "@/components/leads/LeadContactActions";

export type SortField = "id" | "childName" | "state" | "status" | "owner" | "priority" | "daysInStage" | "lastContacted" | null;
export type SortDir = "asc" | "desc";

interface LeadTableViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
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

export function LeadTableView({
  leads, onSelectLead, selectedIds, onSelectionChange,
  sortField, sortDir, onSort,
}: LeadTableViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = leads.length > 0 && selectedIds.length === leads.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => onSelectionChange(allSelected ? [] : leads.map((l) => l.id));
  const toggleOne = (id: string) =>
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  const headers: { label: string; field: SortField; w?: string }[] = [
    { label: "ID", field: "id", w: "w-[70px]" },
    { label: "Lead / Parent", field: "childName" },
    { label: "Phone", field: null },
    { label: "State", field: "state", w: "w-[55px]" },
    { label: "Source", field: null, w: "w-[80px]" },
    { label: "Status", field: "status" },
    { label: "Coordinator", field: "owner" },
    { label: "Form", field: null },
    { label: "Consent", field: null },
    { label: "Review", field: null },
    { label: "Benefits", field: null },
    { label: "Priority", field: "priority", w: "w-[70px]" },
    { label: "Days", field: "daysInStage", w: "w-[55px]" },
    { label: "Last Contact", field: "lastContacted", w: "w-[90px]" },
    { label: "Next Action", field: null },
    { label: "Alerts", field: null, w: "w-[40px]" },
  ];

  const renderSortIcon = (field: SortField) => {
    if (!field) return null;
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
      {/* Mobile accordion list */}
      <ul className="md:hidden divide-y divide-border/40">
        {leads.length === 0 && (
          <li className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No leads match your filters</p>
          </li>
        )}
        {leads.map((lead) => {
          const alert = getInlineAlert(lead);
          const isOpen = expanded.has(lead.id);
          const isSelected = selectedIds.includes(lead.id);
          return (
            <li key={lead.id} className={cn("transition-colors", isSelected && "bg-primary/5")}>
              <div className="flex items-start gap-2 px-3 py-3">
                <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(lead.id)} aria-label={`Select ${lead.id}`} />
                </div>
                <button
                  type="button"
                  onClick={() => toggleExpanded(lead.id)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{lead.childName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{lead.parentName} · {lead.state}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {alert && (alert.type === "red"
                        ? <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-warning" />)}
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={lead.status} variant={statusVariant(lead.status)} />
                    <StatusBadge status={lead.priority} variant={priorityVariant(lead.priority)} />
                    <span className={cn(
                      "text-[11px] font-medium",
                      lead.daysInStage >= 5 ? "text-destructive" : lead.daysInStage >= 3 ? "text-warning" : "text-muted-foreground",
                    )}>{lead.daysInStage}d</span>
                  </div>
                </button>
              </div>
              {isOpen && (
                <div className="space-y-2.5 border-t border-border/40 bg-muted/20 px-3 py-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</div>
                      <div className="font-medium text-foreground">{lead.phone || "-"}</div>
                      <LeadContactIconActions className="mt-1" lead={lead} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coordinator</div>
                      <div className="text-foreground">{lead.owner}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Source</div>
                      <div className="text-foreground">{lead.source}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Contact</div>
                      <div className="text-foreground">
                        {lead.lastContacted
                          ? new Date(lead.lastContacted).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : <span className="text-destructive/80">Never</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={lead.formStatus} variant={formVariant(lead.formStatus)} />
                    <StatusBadge status={lead.consentStatus} variant={consentVariant(lead.consentStatus)} />
                    <StatusBadge status={lead.formReviewStatus} variant={reviewVariant(lead.formReviewStatus)} />
                    <StatusBadge status={lead.vobStatus} variant={vobVariant(lead.vobStatus)} />
                  </div>
                  {lead.nextAction && (
                    <div className="rounded-md bg-background/60 p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Next action</div>
                      <div className="text-foreground">{lead.nextAction}</div>
                    </div>
                  )}
                  {alert && (
                    <div className={cn(
                      "rounded-md px-2 py-1.5 text-[11px] font-medium",
                      alert.type === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
                    )}>
                      {alert.message}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectLead(lead)}
                    className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Open lead
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="hidden md:block overflow-x-auto">
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
              {headers.map(({ label, field, w }) => (
                <th
                  key={label}
                  onClick={() => field && onSort(field)}
                  className={cn(
                    "text-left px-3 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wider whitespace-nowrap",
                    field && "cursor-pointer hover:text-foreground select-none",
                    w,
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {renderSortIcon(field)}
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
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{lead.phone}</span>
                      <LeadContactIconActions lead={lead} size="xs" />
                    </div>
                  </td>
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
