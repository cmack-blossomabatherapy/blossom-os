import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, last7: 0, avgMs: 0, failed: 0, up: 0, down: 0 });
  const [topQueries, setTopQueries] = useState<{ prompt: string; count: number }[]>([]);
  const [byRole, setByRole] = useState<{ role: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [{ data: rows }, { data: fb }] = await Promise.all([
        supabase.from("ai_audit_log" as any).select("prompt,role,duration_ms,status,created_at").limit(1000),
        supabase.from("ai_message_feedback" as any).select("rating"),
      ]);
      const list = (rows ?? []) as any[];
      const last7 = list.filter((r) => r.created_at >= since).length;
      const avgMs = list.length ? Math.round(list.reduce((a, r) => a + (r.duration_ms ?? 0), 0) / list.length) : 0;
      const failed = list.filter((r) => r.status !== "ok").length;
      const fbList = (fb ?? []) as any[];
      setStats({
        total: list.length, last7, avgMs, failed,
        up: fbList.filter((f) => f.rating === "up").length,
        down: fbList.filter((f) => f.rating === "down").length,
      });
      const promptCounts = new Map<string, number>();
      const roleCounts = new Map<string, number>();
      list.forEach((r) => {
        const k = (r.prompt ?? "").toLowerCase().slice(0, 80);
        promptCounts.set(k, (promptCounts.get(k) ?? 0) + 1);
        const role = r.role ?? "unknown";
        roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
      });
      setTopQueries([...promptCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([prompt, count]) => ({ prompt, count })));
      setByRole([...roleCounts.entries()].sort((a, b) => b[1] - a[1]).map(([role, count]) => ({ role, count })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-muted-foreground text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  const totalFb = stats.up + stats.down;
  const satisfaction = totalFb ? Math.round((stats.up / totalFb) * 100) : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">AI Analytics</h2>
        <p className="text-sm text-muted-foreground">How Insights is being used across the company.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total queries" value={stats.total} icon={BarChart3} />
        <Stat label="Last 7 days" value={stats.last7} icon={TrendingUp} />
        <Stat label="Avg latency" value={`${stats.avgMs} ms`} />
        <Stat label="Satisfaction" value={satisfaction === null ? "—" : `${satisfaction}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3">Top queries (last 1000)</h3>
          {topQueries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No queries yet.</p>
          ) : (
            <div className="space-y-2">
              {topQueries.map((q, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate flex-1" title={q.prompt}>{q.prompt || "—"}</span>
                  <Badge variant="outline" className="text-[10px]">{q.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3">Usage by role</h3>
          {byRole.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data.</p>
          ) : (
            <div className="space-y-2">
              {byRole.map((r, i) => {
                const max = byRole[0].count;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize">{r.role}</span>
                      <span className="text-muted-foreground">{r.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3">Feedback signal</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-green-600" /><span className="text-sm">{stats.up} positive</span></div>
          <div className="flex items-center gap-2"><ThumbsDown className="h-4 w-4 text-red-600" /><span className="text-sm">{stats.down} negative</span></div>
          <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">{stats.failed} failed / no-answer</div>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon?: any }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
    </Card>
  );
}