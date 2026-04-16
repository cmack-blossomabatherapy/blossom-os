import { Authorization, daysUntil } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { CalendarClock } from "lucide-react";

interface Props {
  auths: Authorization[];
  onSelect: (a: Authorization) => void;
}

const buckets = [
  { label: "0–30 days", tone: "destructive" as const, range: [0, 30] as const },
  { label: "31–60 days", tone: "warning" as const, range: [31, 60] as const },
  { label: "61–90 days", tone: "default" as const, range: [61, 90] as const },
  { label: "90+ days", tone: "success" as const, range: [91, Infinity] as const },
];

export function AuthExpirationTimeline({ auths, onSelect }: Props) {
  const withExpiry = auths.filter((a) => a.expirationDate !== null);

  const grouped = buckets.map((b) => ({
    ...b,
    items: withExpiry
      .map((a) => ({ a, d: daysUntil(a.expirationDate)! }))
      .filter(({ d }) => d >= b.range[0] && d <= b.range[1])
      .sort((x, y) => x.d - y.d),
  }));

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Expiration Timeline</h3>
            <p className="text-xs text-muted-foreground">{withExpiry.length} active authorizations tracked for renewal</p>
          </div>
        </div>

        {/* Bucket strip */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {grouped.map((g) => (
            <div key={g.label} className={cn(
              "rounded-lg p-3 border",
              g.tone === "destructive" && "bg-destructive/5 border-destructive/20",
              g.tone === "warning" && "bg-warning/5 border-warning/20",
              g.tone === "default" && "bg-primary/5 border-primary/20",
              g.tone === "success" && "bg-success/5 border-success/20",
            )}>
              <p className={cn(
                "text-[10px] uppercase font-semibold tracking-wider",
                g.tone === "destructive" && "text-destructive",
                g.tone === "warning" && "text-warning",
                g.tone === "default" && "text-primary",
                g.tone === "success" && "text-success",
              )}>{g.label}</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{g.items.length}</p>
            </div>
          ))}
        </div>
      </div>

      {grouped.map((g) => (
        <div key={g.label} className="bg-card rounded-xl border border-border/60 overflow-hidden">
          <div className={cn(
            "px-4 py-2.5 border-b border-border/60 flex items-center justify-between",
            g.tone === "destructive" && "bg-destructive/5",
            g.tone === "warning" && "bg-warning/5",
            g.tone === "default" && "bg-primary/5",
            g.tone === "success" && "bg-success/5",
          )}>
            <h4 className={cn(
              "text-sm font-semibold",
              g.tone === "destructive" && "text-destructive",
              g.tone === "warning" && "text-warning",
              g.tone === "default" && "text-primary",
              g.tone === "success" && "text-success",
            )}>{g.label} ({g.items.length})</h4>
          </div>
          {g.items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">None in this window</p>
          ) : (
            <div className="divide-y divide-border/40">
              {g.items.map(({ a, d }) => (
                <button
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{a.clientName}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">{a.id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {a.payor} · {a.authType} · {a.hours || "—"} · expires {a.expirationDate}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className={cn(
                      "text-sm font-semibold",
                      g.tone === "destructive" && "text-destructive",
                      g.tone === "warning" && "text-warning",
                      g.tone === "default" && "text-primary",
                      g.tone === "success" && "text-success",
                    )}>{d}d left</p>
                    <p className="text-[10px] text-muted-foreground">{a.coordinator}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
