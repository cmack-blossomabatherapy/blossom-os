import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadSource {
  source: string;
  volume: number;
  conversion: number;
  trend: "up" | "down" | "neutral";
}

const sources: LeadSource[] = [
  { source: "Organic", volume: 34, conversion: 62, trend: "up" },
  { source: "Google Ads", volume: 28, conversion: 48, trend: "neutral" },
  { source: "Referrals", volume: 22, conversion: 74, trend: "up" },
  { source: "Social Media", volume: 16, conversion: 35, trend: "down" },
];

const best = sources.reduce((a, b) => (b.conversion > a.conversion ? b : a));

export function GrowthInsights() {
  return (
    <div className="bg-card rounded-xl border border-border/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-success" />
        <h3 className="text-sm font-semibold text-foreground">Lead Sources & Growth</h3>
      </div>
      <div className="space-y-3">
        {sources.map((s) => (
          <div key={s.source} className="flex items-center gap-3 cursor-pointer group">
            <span className="text-xs text-muted-foreground w-24 shrink-0">{s.source}</span>
            <div className="flex-1 h-6 bg-muted/40 rounded-md overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-md flex items-center px-2 transition-all",
                  s.source === best.source ? "bg-success/70" : "bg-primary/50",
                )}
                style={{ width: `${(s.volume / 40) * 100}%`, minWidth: "2rem" }}
              >
                <span className="text-[10px] font-bold text-primary-foreground">{s.volume}</span>
              </div>
            </div>
            <span className={cn(
              "text-[11px] font-semibold w-12 text-right",
              s.conversion >= 60 ? "text-success" : s.conversion >= 45 ? "text-foreground" : "text-warning",
            )}>
              {s.conversion}%
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border/40">
        <p className="text-[11px] text-muted-foreground">
          Best performing: <span className="font-semibold text-success">{best.source}</span> at {best.conversion}% conversion
        </p>
      </div>
    </div>
  );
}
