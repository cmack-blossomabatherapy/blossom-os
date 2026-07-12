import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, PhoneMissed, Clock } from "lucide-react";
import { useCallStats } from "@/hooks/useCallStats";

function fmtHM(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function CallStatsCard({ userId, title = "My Calls" }: { userId?: string | null; title?: string }) {
  const s = useCallStats(userId);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Phone className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {s.loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-semibold">{s.today}</div>
              <div className="text-[10px] uppercase text-muted-foreground">Today</div>
            </div>
            <div>
              <div className="text-xl font-semibold">{s.week}</div>
              <div className="text-[10px] uppercase text-muted-foreground">7 days</div>
            </div>
            <div>
              <div className="text-xl font-semibold flex items-center justify-center gap-1">
                <PhoneMissed className="h-3 w-3 text-destructive" /> {s.missed}
              </div>
              <div className="text-[10px] uppercase text-muted-foreground">Missed</div>
            </div>
            <div className="col-span-3 text-xs text-muted-foreground flex items-center justify-center gap-1 pt-1 border-t">
              <Clock className="h-3 w-3" /> Talk time this week: {fmtHM(s.talkTimeSeconds)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CallStatsCard;
