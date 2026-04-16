import { AlertTriangle, Link2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type PhoneCall,
  callTypeVariant,
  callStatusVariant,
  timeSinceCall,
  formatCallTime,
} from "@/data/calls";

interface Props {
  calls: PhoneCall[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CallTableView({ calls, selectedId, onSelect }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Caller", "Type", "Status", "Linked", "Owner", "Call Time", "Time Since", "Next Action"].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calls.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                No calls match this view
              </td>
            </tr>
          ) : (
            calls.map((c) => {
              const unlinked = !c.linkedLeadId && !c.linkedClientId;
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors",
                    selectedId === c.id && "bg-primary/5",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-foreground text-sm">{c.callerName ?? "Unknown"}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">{c.phoneNumber}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={c.type} variant={callTypeVariant(c.type)} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={c.status} variant={callStatusVariant(c.status)} />
                  </td>
                  <td className="px-4 py-2.5">
                    {unlinked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-destructive font-medium">
                        <AlertTriangle className="h-3 w-3" /> Unlinked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-foreground font-mono">
                        <Link2 className="h-3 w-3 text-primary" />
                        {c.linkedLeadId ?? c.linkedClientId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {c.assignedTo ?? <span className="italic">Unassigned</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{formatCallTime(c.callTime)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums">{timeSinceCall(c.callTime)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs truncate max-w-[180px]">
                    {c.nextAction ?? "—"}
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
