import { Authorization, stageVariant, qaVariant, daysUntil, expirationTone, getAuthAlert } from "@/data/authorizations";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertCircle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  auths: Authorization[];
  onSelect: (a: Authorization) => void;
}

export function AuthTableView({ auths, onSelect }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      {/* Mobile card list */}
      <ul className="md:hidden divide-y divide-border/40">
        {auths.map((a) => {
          const alert = getAuthAlert(a);
          const days = daysUntil(a.expirationDate);
          const tone = expirationTone(days);
          const docsComplete = a.documents.every((d) => !d.required || d.received);
          return (
            <li
              key={a.id}
              onClick={() => onSelect(a)}
              className="px-3 py-3 cursor-pointer transition-colors active:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{a.clientName}</p>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">
                    {a.id} · {a.payor} · {a.state}
                  </p>
                </div>
                <StatusBadge status={a.stage} variant={stageVariant(a.stage)} />
              </div>
              {alert && (
                <div className={cn(
                  "mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                  alert.type === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
                )}>
                  <AlertCircle className="h-2.5 w-2.5" />
                  {alert.message}
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <StatusBadge status={a.qaStatus} variant={qaVariant(a.qaStatus)} />
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  Docs {docsComplete ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  TP {a.treatmentPlanReceived ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-muted-foreground/40" />}
                </span>
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
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="truncate">{a.coordinator}</span>
                <span className="shrink-0">{a.expirationDate ? `exp ${a.expirationDate}` : "—"}</span>
              </div>
              {a.nextAction && (
                <p className="mt-1 text-[11px] text-muted-foreground truncate">→ {a.nextAction}</p>
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
