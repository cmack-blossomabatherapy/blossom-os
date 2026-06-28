import { Lead, calculateKpis, KpiKey } from "@/data/leads";
import { cn } from "@/lib/utils";
import { Sparkles, PhoneOff, Send, AlertTriangle, FileCheck2, CheckCircle2, PhoneMissed, Clock, Timer } from "lucide-react";

interface LeadKpiStripProps {
  leads: Lead[];
  activeKpi: KpiKey | null;
  onKpiClick: (key: KpiKey) => void;
}

export function LeadKpiStrip({ leads, activeKpi, onKpiClick }: LeadKpiStripProps) {
  const kpis = calculateKpis(leads);

  const cards: { key: KpiKey | "avgContact" | "avgVob"; label: string; value: number | string; icon: typeof Sparkles; tone: string; clickable: boolean }[] = [
    { key: "newToday", label: "New Today", value: kpis.newToday, icon: Sparkles, tone: "text-info bg-info/10", clickable: true },
    { key: "notContacted", label: "Not Contacted", value: kpis.notContacted, icon: PhoneOff, tone: "text-destructive bg-destructive/10", clickable: true },
    { key: "sentForm", label: "Intake Packet Sent", value: kpis.sentForm, icon: Send, tone: "text-primary bg-primary/10", clickable: true },
    { key: "missingInfo", label: "Packet Follow Up / Missing Info", value: kpis.missingInfo, icon: AlertTriangle, tone: "text-warning bg-warning/10", clickable: true },
    { key: "sentVob", label: "Benefits Verification", value: kpis.sentVob, icon: FileCheck2, tone: "text-primary bg-primary/10", clickable: true },
    { key: "vobCompleted", label: "Assessment Scheduling", value: kpis.vobCompleted, icon: CheckCircle2, tone: "text-success bg-success/10", clickable: true },
    { key: "cantReach", label: "Can't Reach", value: kpis.cantReach, icon: PhoneMissed, tone: "text-destructive bg-destructive/10", clickable: true },
    { key: "avgContact", label: "Avg Time to Contact", value: kpis.avgTimeToContact + "h", icon: Clock, tone: "text-muted-foreground bg-muted", clickable: false },
    { key: "avgVob", label: "Avg Time to Benefits Verification", value: kpis.avgTimeToVob + "d", icon: Timer, tone: "text-muted-foreground bg-muted", clickable: false },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
      {cards.map(({ key, label, value, icon: Icon, tone, clickable }) => {
        const isActive = clickable && activeKpi === key;
        return (
          <button
            key={key}
            disabled={!clickable}
            onClick={() => clickable && onKpiClick(key as KpiKey)}
            className={cn(
              "group relative bg-card rounded-2xl border text-left p-3.5 transition-all overflow-hidden",
              clickable
                ? "hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40 cursor-pointer"
                : "cursor-default opacity-90",
              isActive ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30" : "border-border/60",
            )}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", tone)}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              {isActive && <span className="text-[9px] font-semibold text-primary uppercase tracking-wider">On</span>}
            </div>
            <p className="text-2xl font-semibold tracking-tight text-foreground leading-none tabular-nums">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-2 leading-snug line-clamp-2">{label}</p>
          </button>
        );
      })}
    </div>
  );
}
