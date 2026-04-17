import { Client, calculateClientKpis, ClientKpiKey } from "@/data/clients";
import { cn } from "@/lib/utils";
import {
  UserCog, FileSearch, ShieldCheck, CalendarCheck, ClipboardCheck,
  Hourglass, Users, CalendarClock, Activity, TrendingUp, Timer, Clock,
} from "lucide-react";

interface ClientKpiStripProps {
  clients: Client[];
  activeKpi: ClientKpiKey | null;
  onKpiClick: (key: ClientKpiKey) => void;
}

export function ClientKpiStrip({ clients, activeKpi, onKpiClick }: ClientKpiStripProps) {
  const k = calculateClientKpis(clients);

  type Card = { key: ClientKpiKey | "avgStart" | "avgQa" | "avgStaffing"; label: string; value: number | string; icon: typeof UserCog; tone: string; clickable: boolean };
  const cards: Card[] = [
    { key: "bcbaAssignment", label: "BCBA Assignment", value: k.bcbaAssignment, icon: UserCog, tone: "text-info bg-info/10", clickable: true },
    { key: "pendingInitialAuth", label: "Pending Initial Auth", value: k.pendingInitialAuth, icon: FileSearch, tone: "text-warning bg-warning/10", clickable: true },
    { key: "waitingConsent", label: "Waiting Consent", value: k.waitingConsent, icon: ShieldCheck, tone: "text-warning bg-warning/10", clickable: true },
    { key: "assessmentScheduled", label: "Assessment Set", value: k.assessmentScheduled, icon: CalendarCheck, tone: "text-primary bg-primary/10", clickable: true },
    { key: "inQa", label: "In QA", value: k.inQa, icon: ClipboardCheck, tone: "text-primary bg-primary/10", clickable: true },
    { key: "pendingTreatmentAuth", label: "Pending Tx Auth", value: k.pendingTreatmentAuth, icon: Hourglass, tone: "text-warning bg-warning/10", clickable: true },
    { key: "staffingNeeded", label: "Staffing Needed", value: k.staffingNeeded, icon: Users, tone: "text-destructive bg-destructive/10", clickable: true },
    { key: "pendingStart", label: "Pending Start", value: k.pendingStart, icon: CalendarClock, tone: "text-info bg-info/10", clickable: true },
    { key: "active", label: "Active", value: k.active, icon: Activity, tone: "text-success bg-success/10", clickable: true },
    { key: "avgStart", label: "Avg Time to Start", value: `${k.avgTimeToStart}d`, icon: TrendingUp, tone: "text-muted-foreground bg-muted", clickable: false },
    { key: "avgQa", label: "Avg Time in QA", value: `${k.avgTimeInQa}d`, icon: Timer, tone: "text-muted-foreground bg-muted", clickable: false },
    { key: "avgStaffing", label: "Avg Staffing Wait", value: `${k.avgTimeInStaffing}d`, icon: Clock, tone: "text-muted-foreground bg-muted", clickable: false },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2.5">
      {cards.map(({ key, label, value, icon: Icon, tone, clickable }) => {
        const isActive = clickable && activeKpi === key;
        return (
          <button
            key={key}
            disabled={!clickable}
            onClick={() => clickable && onKpiClick(key as ClientKpiKey)}
            className={cn(
              "group bg-card rounded-xl border text-left p-3 transition-all",
              clickable ? "hover:shadow-md hover:border-primary/40 cursor-pointer" : "cursor-default opacity-90",
              isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border/60",
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", tone)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {isActive && <span className="text-[9px] font-semibold text-primary uppercase tracking-wider">On</span>}
            </div>
            <p className="text-xl font-semibold text-foreground leading-none">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight line-clamp-1">{label}</p>
          </button>
        );
      })}
    </div>
  );
}
