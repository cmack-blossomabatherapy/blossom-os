import { Calendar, Heart, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchingInfo } from "@/data/journey";

interface Props {
  matching: MatchingInfo;
  variant: "ready" | "assigned";
}

export function MatchingPanel({ matching, variant }: Props) {
  const isAssigned = variant === "assigned";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">
          {isAssigned ? "Your case" : "Matching"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isAssigned ? "You've been matched. Get ready for your first session." : "You're now ready to be matched with a client."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ContactCard label="Staffing owner" name={matching.staffingOwner} role="Staffing Lead" icon={Users} tone="info" />
        {isAssigned && matching.assignedCaseManager ? (
          <ContactCard label="Case manager" name={matching.assignedCaseManager} role="Operations" icon={User} tone="primary" />
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Possible case managers</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matching.caseManagerOptions.map((cm) => (
                <span key={cm} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground">{cm}</span>
              ))}
            </div>
          </div>
        )}
        {isAssigned && matching.assignedBcba && (
          <ContactCard label="Connected BCBA" name={matching.assignedBcba} role="Clinical" icon={User} tone="success" />
        )}
        {isAssigned && matching.caregiverFamily && (
          <ContactCard label="Caregiver" name={matching.caregiverFamily} role="Family" icon={Heart} tone="warning" />
        )}
        {isAssigned && matching.startDate && (
          <ContactCard
            label="Start date"
            name={new Date(matching.startDate).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            role="First session"
            icon={Calendar}
            tone="primary"
          />
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold text-foreground mb-2">
          {isAssigned ? "First session prep" : "Next steps"}
        </p>
        <ul className="space-y-1.5">
          {matching.prepChecklist.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm">
              <div className={cn(
                "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                c.done ? "bg-primary border-primary" : "border-border",
              )}>
                {c.done && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
              </div>
              <span className={c.done ? "text-muted-foreground line-through" : "text-foreground"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ContactCard({ label, name, role, icon: Icon, tone }: { label: string; name: string; role: string; icon: typeof User; tone: "primary" | "info" | "success" | "warning" }) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  }[tone];
  return (
    <div className="rounded-xl border border-border/60 p-3 flex items-start gap-3">
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", toneCls)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}
