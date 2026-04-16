import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Bottleneck {
  message: string;
  severity: "critical" | "warning";
  metric?: string;
}

const bottlenecks: Bottleneck[] = [
  { message: "32 leads stuck in Sent Form > 3 days", severity: "critical", metric: "↑ 12 from last week" },
  { message: "18 clients waiting for staffing", severity: "critical", metric: "Avg wait: 8 days" },
  { message: "12 auths pending submission > 5 days", severity: "warning", metric: "3 past deadline" },
  { message: "QA backlog increased 40% this week", severity: "warning", metric: "9 items total" },
  { message: "6 assessments not yet scheduled", severity: "warning", metric: "Oldest: 12 days" },
  { message: "4 clients stuck in BCBA Assignment > 7 days", severity: "critical", metric: "2 in GA" },
];

export function BottleneckPanel() {
  return (
    <div className="bg-card rounded-xl border border-border/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">Bottleneck Detection</h3>
      </div>
      <div className="space-y-2">
        {bottlenecks.map((b, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-colors group",
              b.severity === "critical" ? "bg-destructive/5 hover:bg-destructive/10" : "bg-warning/5 hover:bg-warning/10",
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn(
                "h-2 w-2 rounded-full shrink-0",
                b.severity === "critical" ? "bg-destructive" : "bg-warning",
              )} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{b.message}</p>
                {b.metric && <p className="text-[10px] text-muted-foreground">{b.metric}</p>}
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
}
