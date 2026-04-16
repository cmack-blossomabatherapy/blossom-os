import { AlertTriangle, Phone, PhoneOff, PhoneIncoming, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { type PhoneCall, callTypeVariant, timeSinceCall } from "@/data/calls";

interface Props {
  calls: PhoneCall[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CallQueueView({ calls, selectedId, onSelect }: Props) {
  const newCalls = calls.filter((c) => c.status === "New");
  const needsFollowup = calls.filter(
    (c) => c.status === "Attempted" || (c.status === "Connected" && !c.nextAction),
  );
  const unlinked = calls.filter((c) => !c.linkedLeadId && !c.linkedClientId);
  const connected = calls.filter((c) => c.status === "Connected" && c.nextAction);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Section
        title="New Calls"
        subtitle="Incoming · not yet handled"
        icon={PhoneIncoming}
        tone="destructive"
        items={newCalls}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <Section
        title="Unlinked Calls"
        subtitle="No lead or client attached"
        icon={AlertTriangle}
        tone="destructive"
        priority
        items={unlinked}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <Section
        title="Needs Follow-Up"
        subtitle="Attempted or no next action"
        icon={PhoneOff}
        tone="warning"
        items={needsFollowup}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <Section
        title="Connected · Logged"
        subtitle="Successfully handled"
        icon={CheckCircle2}
        tone="success"
        items={connected}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}

function Section({
  title, subtitle, icon: Icon, tone, items, selectedId, onSelect, priority,
}: {
  title: string;
  subtitle: string;
  icon: typeof Phone;
  tone: "destructive" | "warning" | "success";
  items: PhoneCall[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  priority?: boolean;
}) {
  const toneClass =
    tone === "destructive" ? "text-destructive bg-destructive/10" :
    tone === "warning" ? "text-warning bg-warning/10" :
    "text-success bg-success/10";

  return (
    <div className={cn(
      "bg-card rounded-xl border overflow-hidden",
      priority ? "border-destructive/40" : "border-border/60",
    )}>
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", toneClass)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
              {title}
              {priority && <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">High Priority</span>}
            </h3>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-background border border-border/60 px-2 py-0.5 rounded-md">
          {items.length}
        </span>
      </div>
      <div className="divide-y divide-border/30 max-h-[420px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground italic text-center">All clear</p>
        ) : (
          items.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full text-left px-4 py-2.5 hover:bg-muted/20 transition-colors flex items-center gap-3",
                selectedId === c.id && "bg-primary/5",
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {c.callerName ?? "Unknown caller"}
                  </span>
                  <StatusBadge status={c.type} variant={callTypeVariant(c.type)} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                  {c.phoneNumber} · {timeSinceCall(c.callTime)}
                  {c.attempts > 1 && (
                    <span className="text-destructive font-medium ml-1.5">· {c.attempts} attempts</span>
                  )}
                </div>
              </div>
              {c.nextAction && (
                <div className="text-[11px] text-muted-foreground text-right max-w-[140px] truncate">
                  {c.nextAction}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
