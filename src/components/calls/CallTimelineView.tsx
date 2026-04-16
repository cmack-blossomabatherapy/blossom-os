import { Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type PhoneCall,
  callStatusVariant,
  callTypeVariant,
  formatCallTime,
} from "@/data/calls";

interface Props {
  calls: PhoneCall[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CallTimelineView({ calls, selectedId, onSelect }: Props) {
  // Group by day
  const groups = new Map<string, PhoneCall[]>();
  calls
    .slice()
    .sort((a, b) => new Date(b.callTime).getTime() - new Date(a.callTime).getTime())
    .forEach((c) => {
      const day = new Date(c.callTime).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day)!.push(c);
    });

  return (
    <div className="space-y-5">
      {Array.from(groups.entries()).map(([day, items]) => (
        <div key={day}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            {day}
          </h3>
          <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
            <div className="divide-y divide-border/30">
              {items.map((c) => {
                const Icon = c.direction === "Inbound" ? PhoneIncoming : PhoneOutgoing;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors flex items-center gap-3",
                      selectedId === c.id && "bg-primary/5",
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      c.direction === "Inbound" ? "bg-info/10 text-info" : "bg-primary/10 text-primary",
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {c.callerName ?? "Unknown"}
                        </span>
                        <StatusBadge status={c.type} variant={callTypeVariant(c.type)} />
                        <StatusBadge status={c.status} variant={callStatusVariant(c.status)} />
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                        {c.phoneNumber} · {c.lastAction}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                      {formatCallTime(c.callTime)}
                      <div className="text-right">{c.duration}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
