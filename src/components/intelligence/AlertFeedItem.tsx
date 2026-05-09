import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function AlertFeedItem({ title, severity, detail, time, category }: {
  title: string; severity: "low" | "medium" | "high"; detail: string; time: string; category: string;
}) {
  const Icon = severity === "high" ? AlertTriangle : severity === "medium" ? AlertCircle : Info;
  const tone = severity === "high" ? "text-destructive bg-destructive/10" : severity === "medium" ? "text-warning bg-warning/10" : "text-primary bg-primary/10";
  return (
    <div className="flex items-start gap-3 border-b border-border/50 py-3 last:border-0">
      <div className={cn("rounded-lg p-1.5", tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
        <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-muted-foreground">{category}</span>
      </div>
    </div>
  );
}
