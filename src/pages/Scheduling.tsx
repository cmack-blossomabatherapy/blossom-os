import { PageShell } from "@/components/shared/PageShell";
import { Calendar, Clock } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

const assessments = [
  { client: "Aiden Patel", bcba: "Dr. Lee", state: "TX", status: "Unscheduled", requestDate: "2026-04-12" },
  { client: "Noah Williams", bcba: "Dr. Kim", state: "TX", status: "Unscheduled", requestDate: "2026-04-14" },
  { client: "Liam Chen", bcba: "Dr. Patel", state: "AZ", status: "Scheduled", requestDate: "2026-04-08", date: "2026-04-22" },
  { client: "Olivia Brown", bcba: "Dr. Lee", state: "GA", status: "Scheduled", requestDate: "2026-04-05", date: "2026-04-18" },
];

const pendingStarts = [
  { client: "Emma Thompson", state: "GA", clinic: "Peachtree Corners", rbt: "Taylor S.", targetDate: "2026-04-28" },
  { client: "Sofia Garcia", state: "GA", clinic: "Riverdale", rbt: "Jordan M.", targetDate: "2026-05-02" },
];

export default function Scheduling() {
  return (
    <PageShell title="Scheduling" description="Assessments, start dates, and client schedules" icon={Calendar}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border/60 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Assessment Scheduling
          </h3>
          <div className="space-y-2">
            {assessments.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.client}</p>
                  <p className="text-xs text-muted-foreground">{a.bcba} · {a.state}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={a.status} variant={a.status === "Scheduled" ? "success" : "warning"} />
                  {a.date && <p className="text-xs text-muted-foreground mt-1">{a.date}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" /> Pending Start Dates
          </h3>
          <div className="space-y-2">
            {pendingStarts.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.client}</p>
                  <p className="text-xs text-muted-foreground">{p.clinic} · {p.state}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{p.targetDate}</p>
                  <p className="text-xs text-muted-foreground">{p.rbt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
