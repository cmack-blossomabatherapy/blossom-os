import { Client, stageVariant, authVariant, staffingVariant, qaVariant, getClientAlert } from "@/data/clients";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClientSortField = "id" | "childName" | "state" | "clinic" | "stage" | "daysInStage" | "startDate" | null;
export type SortDir = "asc" | "desc";

interface Props {
  clients: Client[];
  onSelect: (c: Client) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  sortField: ClientSortField;
  sortDir: SortDir;
  onSort: (field: ClientSortField) => void;
}

export function ClientTableView({
  clients, onSelect, selectedIds, onSelectionChange, sortField, sortDir, onSort,
}: Props) {
  const allSelected = clients.length > 0 && selectedIds.length === clients.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => onSelectionChange(allSelected ? [] : clients.map((c) => c.id));
  const toggleOne = (id: string) =>
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  const headers: { label: string; field: ClientSortField; w?: string }[] = [
    { label: "ID", field: "id", w: "w-[70px]" },
    { label: "Client / Parent", field: "childName" },
    { label: "State", field: "state", w: "w-[55px]" },
    { label: "Clinic", field: "clinic" },
    { label: "BCBA", field: null },
    { label: "RBT", field: null },
    { label: "Stage", field: "stage" },
    { label: "Auth", field: null },
    { label: "Staffing", field: null },
    { label: "QA", field: null },
    { label: "Days", field: "daysInStage", w: "w-[55px]" },
    { label: "Sched", field: null },
    { label: "Start Date", field: "startDate", w: "w-[90px]" },
    { label: "Records", field: null },
    { label: "Next Action", field: null },
    { label: "Alerts", field: null, w: "w-[40px]" },
  ];

  const renderSortIcon = (field: ClientSortField) => {
    if (!field) return null;
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
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
            {clients.length === 0 && (
              <tr>
                <td colSpan={15} className="px-6 py-16 text-center">
                  <p className="text-sm text-muted-foreground">No clients match your filters</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Try clearing filters or adjusting your search</p>
                </td>
              </tr>
            )}
            {clients.map((c) => {
              const alert = getClientAlert(c);
              const isSelected = selectedIds.includes(c.id);
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={cn(
                    "border-b border-border/40 cursor-pointer transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/30",
                  )}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(c.id)} aria-label={`Select ${c.id}`} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-foreground text-sm leading-tight">{c.childName}</div>
                    <div className="text-muted-foreground text-xs">{c.parentName}</div>
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.state} variant="muted" /></td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{c.clinic}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.bcba ? <span className="text-xs text-foreground">{c.bcba}</span> : <span className="text-destructive text-xs font-medium">Unassigned</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.rbt ? <span className="text-xs text-foreground">{c.rbt}</span> : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.stage} variant={stageVariant(c.stage)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.authStatus} variant={authVariant(c.authStatus)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.staffingStatus} variant={staffingVariant(c.staffingStatus)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.qaStatus} variant={qaVariant(c.qaStatus)} /></td>
                  <td className="px-3 py-2.5">
                    <span className={cn(
                      "text-xs font-medium",
                      c.daysInStage >= 7 ? "text-destructive" : c.daysInStage >= 4 ? "text-warning" : "text-muted-foreground",
                    )}>
                      {c.daysInStage}d
                    </span>
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.schedulingStatus ?? (c.schedule.length ? "Schedule Created" : "Pending Schedule")} variant={c.schedule.length ? "success" : "warning"} /></td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{c.startDate || <span className="text-muted-foreground/60">—</span>}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{c.authorizations.length} auth · {c.schedule.length} blocks · {c.documents.length} docs</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px] truncate">{c.nextAction}</td>
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
