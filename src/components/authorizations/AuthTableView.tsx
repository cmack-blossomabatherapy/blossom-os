import { Authorization, stageVariant, qaVariant, daysUntil, expirationTone, getAuthAlert } from "@/data/authorizations";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertCircle, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  auths: Authorization[];
  onSelect: (a: Authorization) => void;
}

export function AuthTableView({ auths, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      {/* Mobile card list */}
      <ul className="md:hidden divide-y divide-border/40">
        {auths.map((a) => {
          const alert = getAuthAlert(a);
          const days = daysUntil(a.expirationDate);
          const tone = expirationTone(days);
          const docsComplete = a.documents.every((d) => !d.required || d.received);
          const isOpen = expanded.has(a.id);
          return (
            <li key={a.id} className="transition-colors">
              <button
                type="button"
                onClick={() => toggleExpanded(a.id)}
                aria-expanded={isOpen}
                className="w-full px-3 py-3 text-left active:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.clientName}</p>
                    <p className="font-mono text-[11px] text-muted-foreground truncate">
                      {a.id} · {a.payor} · {a.state}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge status={a.stage} variant={stageVariant(a.stage)} />
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <StatusBadge status={a.qaStatus} variant={qaVariant(a.qaStatus)} />
                  {days !== null && (
                    <span className={cn(
                      "ml-auto font-semibold",
                      tone === "destructive" && "text-destructive",
                      tone === "warning" && "text-warning",
                      tone === "success" && "text-success",
                    )}>
                      {days}d left
                    </span>
                  )}
                </div>
              </button>
              {isOpen && (
                <div className="space-y-2.5 border-t border-border/40 bg-muted/20 px-3 py-3 text-xs">
                  {alert && (
                    <div className={cn(
                      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                      alert.type === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
                    )}>
                      <AlertCircle className="h-3 w-3" />
                      {alert.message}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</div>
                      <div className="text-foreground">{a.authType}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coordinator</div>
                      <div className="text-foreground truncate">{a.coordinator}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Submitted</div>
                      <div className="text-foreground">{a.submittedDate || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Expires</div>
                      <div className="text-foreground">{a.expirationDate || "—"}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      Docs {docsComplete ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      TP {a.treatmentPlanReceived ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-muted-foreground/40" />}
                    </span>
                  </div>
                  {a.nextAction && (
                    <div className="rounded-md bg-background/60 p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Next action</div>
                      <div className="text-foreground">{a.nextAction}</div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect(a)}
                    className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Open authorization
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                "Auth ID", "Client", "State", "Payor", "Type", "Status",
                "QA", "Docs", "TP", "Submitted", "Expires", "Days Left", "Coordinator", "Next Action",
              ].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {auths.map((a) => {
              const alert = getAuthAlert(a);
              const days = daysUntil(a.expirationDate);
              const tone = expirationTone(days);
              const docsComplete = a.documents.every((d) => !d.required || d.received);
              return (
                <tr
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{a.id}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{a.clientName}</span>
                      {alert && (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                          alert.type === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                        )}>
                          <AlertCircle className="h-2.5 w-2.5" />
                          {alert.message}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={a.state} variant="muted" /></td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{a.payor}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.authType}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={a.stage} variant={stageVariant(a.stage)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={a.qaStatus} variant={qaVariant(a.qaStatus)} /></td>
                  <td className="px-3 py-2.5">
                    {docsComplete
                      ? <Check className="h-4 w-4 text-success" />
                      : <X className="h-4 w-4 text-destructive" />}
                  </td>
                  <td className="px-3 py-2.5">
                    {a.treatmentPlanReceived
                      ? <Check className="h-4 w-4 text-success" />
                      : <X className="h-4 w-4 text-muted-foreground/40" />}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{a.submittedDate || "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{a.expirationDate || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {days === null ? <span className="text-muted-foreground">—</span> : (
                      <span className={cn(
                        "font-semibold text-xs",
                        tone === "destructive" && "text-destructive",
                        tone === "warning" && "text-warning",
                        tone === "success" && "text-success",
                      )}>
                        {days}d
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{a.coordinator}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs max-w-[220px] truncate">{a.nextAction}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {auths.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No authorizations match your filters</p>
      )}
    </div>
  );
}
