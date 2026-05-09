import { Client, stageVariant, authVariant, staffingVariant, qaVariant, getClientAlert } from "@/data/clients";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      {/* Mobile accordion list */}
      <ul className="md:hidden divide-y divide-border/40">
        {clients.length === 0 && (
          <li className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No clients match your filters</p>
          </li>
        )}
        {clients.map((c) => {
          const alert = getClientAlert(c);
          const isOpen = expanded.has(c.id);
          const isSelected = selectedIds.includes(c.id);
          return (
            <li key={c.id} className={cn("transition-colors", isSelected && "bg-primary/5")}>
              <div className="flex items-start gap-2 px-3 py-3">
                <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(c.id)} aria-label={`Select ${c.id}`} />
                </div>
                <button
                  type="button"
                  onClick={() => toggleExpanded(c.id)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.childName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{c.parentName} · {c.state} · {c.clinic}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {alert && (alert.type === "red"
                        ? <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-warning" />)}
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={c.stage} variant={stageVariant(c.stage)} />
                    <StatusBadge status={c.authStatus} variant={authVariant(c.authStatus)} />
                    <span className={cn(
                      "text-[11px] font-medium",
                      c.daysInStage >= 7 ? "text-destructive" : c.daysInStage >= 4 ? "text-warning" : "text-muted-foreground",
                    )}>{c.daysInStage}d</span>
                  </div>
                </button>
              </div>
              {isOpen && (
                <div className="space-y-2.5 border-t border-border/40 bg-muted/20 px-3 py-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">BCBA</div>
                      <div className="text-foreground">{c.bcba || <span className="text-destructive font-medium">Unassigned</span>}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">RBT</div>
                      <div className="text-foreground">{c.rbt || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Start Date</div>
                      <div className="text-foreground">{c.startDate || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Records</div>
                      <div className="text-foreground">{c.authorizations.length} auth · {c.schedule.length} blocks</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={c.staffingStatus} variant={staffingVariant(c.staffingStatus)} />
                    <StatusBadge status={c.qaStatus} variant={qaVariant(c.qaStatus)} />
                    <StatusBadge
                      status={c.schedulingStatus ?? (c.schedule.length ? "Schedule Created" : "Pending Schedule")}
                      variant={c.schedule.length ? "success" : "warning"}
                    />
                  </div>
                  {c.nextAction && (
                    <div className="rounded-md bg-background/60 p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Next action</div>
                      <div className="text-foreground">{c.nextAction}</div>
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
                    onClick={() => onSelect(c)}
                    className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Open client
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
