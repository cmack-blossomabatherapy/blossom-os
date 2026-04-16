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
    (i) => i.status === "Unscheduled Assessment" || (i.status === "Ready to Schedule" && i.client.schedule.length === 0),
  );
  const readyToStart = items.filter(
    (i) => i.client.authStatus === "Approved" && i.client.rbt && i.client.schedule.length === 0 && i.client.stage !== "Active",
  );
  const blocked = items.filter((i) => i.status === "Blocked");
  const upcoming = assessments.filter((a) => a.status === "Scheduled" && a.date);

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

      <Section title="Ready to Start" icon={CheckCircle2} tone="success" count={readyToStart.length}>
        {readyToStart.length === 0 ? (
          <Empty label="No clients ready" />
        ) : (
          readyToStart.map((i) => (
            <Row
              key={i.client.id}
              item={i}
              onSelect={onSelect}
              subtitle={`Auth approved · RBT ${i.client.rbt} · No schedule`}
            />
          ))
        )}
      </Section>

      <Section title="Blocked Scheduling" icon={AlertTriangle} tone="warning" count={blocked.length}>
        {blocked.length === 0 ? (
          <Empty label="No blockers" />
        ) : (
          blocked.map((i) => (
            <Row key={i.client.id} item={i} onSelect={onSelect} subtitle={i.blockers.join(" · ")} />
          ))
        )}
      </Section>

      <Section title="Upcoming Assessments" icon={Clock} tone="info" count={upcoming.length}>
        {upcoming.length === 0 ? (
          <Empty label="No upcoming assessments" />
        ) : (
          upcoming.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a.clientId)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40 hover:border-primary/40 transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.clientName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {a.bcba} · {a.state}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-foreground">{a.date}</p>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </div>
            </button>
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
