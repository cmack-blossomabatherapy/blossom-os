import { AlertTriangle, FileText } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type DocumentRecord, docStatusVariant, linkedRecordVariant, formatDocDate, daysUntil,
} from "@/data/documents";

interface Props {
  documents: DocumentRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DocumentTableView({ documents, selectedId, onSelect }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      {/* Mobile card list */}
      <ul className="md:hidden divide-y divide-border/40">
        {documents.length === 0 ? (
          <li className="px-4 py-8 text-center text-xs text-muted-foreground italic">
            No documents match this view
          </li>
        ) : (
          documents.map((d) => {
            const requiredDays = daysUntil(d.requiredBy);
            const overdue = requiredDays !== null && requiredDays < 0;
            const dueSoon = requiredDays !== null && requiredDays >= 0 && requiredDays <= 2;
            return (
              <li
                key={d.id}
                onClick={() => onSelect(d.id)}
                className={cn(
                  "px-3 py-3 cursor-pointer transition-colors active:bg-muted/30",
                  selectedId === d.id && "bg-primary/5",
                )}
              >
                <div className="flex items-start gap-2">
                  {d.status === "Missing" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {d.type} · {d.linkedRecordLabel}
                    </p>
                  </div>
                  <StatusBadge status={d.status} variant={docStatusVariant(d.status)} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="truncate">{d.owner} · {formatDocDate(d.uploadedAt)}</span>
                  {d.requiredBy ? (
                    <span className={cn(
                      "font-medium tabular-nums shrink-0",
                      overdue ? "text-destructive" : dueSoon ? "text-warning" : "text-muted-foreground",
                    )}>
                      Due {formatDocDate(d.requiredBy)}
                      {overdue && " · overdue"}
                      {dueSoon && !overdue && ` · ${requiredDays}d`}
                    </span>
                  ) : null}
                </div>
                {d.nextAction && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground truncate">→ {d.nextAction}</p>
                )}
              </li>
            );
          })
        )}
      </ul>

      {/* Desktop table */}
      <table className="hidden md:table w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Document", "Type", "Linked", "Status", "Owner", "Uploaded", "Required By", "Next Action"].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                No documents match this view
              </td>
            </tr>
          ) : (
            documents.map((d) => {
              const requiredDays = daysUntil(d.requiredBy);
              const overdue = requiredDays !== null && requiredDays < 0;
              const dueSoon = requiredDays !== null && requiredDays >= 0 && requiredDays <= 2;
              return (
                <tr
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className={cn(
                    "border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors",
                    selectedId === d.id && "bg-primary/5",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {d.status === "Missing" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm font-medium text-foreground truncate">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{d.type}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={d.linkedRecordType} variant={linkedRecordVariant(d.linkedRecordType)} />
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">{d.linkedRecordLabel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={d.status} variant={docStatusVariant(d.status)} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{d.owner}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDocDate(d.uploadedAt)}</td>
                  <td className="px-4 py-2.5">
                    {d.requiredBy ? (
                      <span className={cn(
                        "text-xs font-medium tabular-nums",
                        overdue ? "text-destructive" : dueSoon ? "text-warning" : "text-muted-foreground",
                      )}>
                        {formatDocDate(d.requiredBy)}
                        {overdue && " · overdue"}
                        {dueSoon && !overdue && ` · ${requiredDays}d`}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[180px]">
                    {d.nextAction ?? "—"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
