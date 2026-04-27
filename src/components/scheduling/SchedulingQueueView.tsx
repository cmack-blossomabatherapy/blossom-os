import { AlertCircle, CheckCircle2, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { type SchedulingClientStatus, schedulingVariant } from "@/data/scheduling";
import { type AssessmentSlot } from "@/data/scheduling";

interface Props {
  items: SchedulingClientStatus[];
  assessments: AssessmentSlot[];
  onSelect: (clientId: string) => void;
}

export function SchedulingQueueView({ items, assessments, onSelect }: Props) {
  const needsScheduling = items.filter(
    (i) => i.status === "Unscheduled Assessment" || (i.status === "Pending Schedule" && i.client.schedule.length === 0),
  );
  const readyToStart = items.filter((i) => i.client.schedule.length > 0 && !i.client.startDate && i.client.stage !== "Active");
  const startingSoon = items.filter((i) => i.status === "Starting Soon" || i.status === "Pending Start");
  const delayed = items.filter((i) => i.status === "Delayed" || i.alerts.some((alert) => alert.includes("Delayed")) || i.blockers.length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Section
        title="Needs Scheduling Now"
        icon={AlertCircle}
        tone="destructive"
        count={needsScheduling.length}
      >
        {needsScheduling.length === 0 ? (
          <Empty label="All caught up" />
        ) : (
          needsScheduling.map((i) => (
            <Row key={i.client.id} item={i} onSelect={onSelect} subtitle={i.client.nextAction} />
          ))
        )}
      </Section>

      <Section title="Ready for Start" icon={CheckCircle2} tone="success" count={readyToStart.length}>
        {readyToStart.length === 0 ? (
          <Empty label="No clients ready" />
        ) : (
          readyToStart.map((i) => (
            <Row
              key={i.client.id}
              item={i}
              onSelect={onSelect}
              subtitle={`Schedule done · ${i.weeklyHours}h/wk · start date missing`}
            />
          ))
        )}
      </Section>

      <Section title="Starting Soon" icon={Clock} tone="info" count={startingSoon.length}>
        {startingSoon.length === 0 ? (
          <Empty label="No upcoming starts" />
        ) : (
          startingSoon.map((i) => (
            <Row key={i.client.id} item={i} onSelect={onSelect} subtitle={`${i.client.startDate ?? "No date"} · ${i.daysUntilStart ?? "—"}d until start`} />
          ))
        )}
      </Section>

      <Section title="Delayed / Blocked" icon={AlertTriangle} tone="warning" count={delayed.length}>
        {delayed.length === 0 ? (
          <Empty label="No delayed starts" />
        ) : (
          delayed.map((i) => (
            <Row key={i.client.id} item={i} onSelect={onSelect} subtitle={[...i.blockers, ...i.alerts].join(" · ")} />
          ))
        )}
      </Section>
    </div>
  );
}

function Section({
  title, icon: Icon, tone, count, children,
}: {
  title: string;
  icon: typeof AlertCircle;
  tone: "destructive" | "warning" | "success" | "info";
  count: number;
  children: React.ReactNode;
}) {
  const toneClass = {
    destructive: "text-destructive",
    warning: "text-warning",
    success: "text-success",
    info: "text-info",
  }[tone];
  return (
    <div className="bg-card rounded-xl border border-border/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Icon className={`h-4 w-4 ${toneClass}`} />
          {title}
        </h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  item, onSelect, subtitle,
}: {
  item: SchedulingClientStatus;
  onSelect: (id: string) => void;
  subtitle: string;
}) {
  return (
    <button
      onClick={() => onSelect(item.client.id)}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40 hover:border-primary/40 transition-colors text-left group"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.client.childName}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        <p className="mt-1 text-[11px] text-muted-foreground truncate">{item.client.bcba ?? "No BCBA"} · {item.client.rbt ?? "No RBT"} · {item.weeklyHours}/{item.approvedHours}h</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={item.status} variant={schedulingVariant(item.status)} />
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
      </div>
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-xs text-muted-foreground italic px-1 py-2">{label}</p>;
}
