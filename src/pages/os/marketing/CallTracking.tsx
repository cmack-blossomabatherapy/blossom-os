import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow, HealthPill } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";
import { mockPhoneCalls, timeSinceCall } from "@/data/calls";
import { useMemo } from "react";

export default function CallTracking() {
  const mi = useMarketingIntelligence();

  const byState = useMemo(() => {
    const map = new Map<string, number>();
    mockPhoneCalls.forEach((c) => {
      if (!c.state) return;
      map.set(c.state, (map.get(c.state) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const recent = [...mockPhoneCalls]
    .sort((a, b) => new Date(b.callTime).getTime() - new Date(a.callTime).getTime())
    .slice(0, 6);

  return (
    <MktgPage
      title="Call Tracking"
      subtitle="Inbound call activity by state — marketing-generated calls, missed calls, and intake conversion."
      actions={<AIPrompt label="Where are calls increasing?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Inbound · 24h" value={mi.calls.last24h} tone={mi.calls.last24h > 0 ? "healthy" : "neutral"} />
        <MetricTile label="Need return" value={mi.calls.missed} tone={mi.calls.missed === 0 ? "healthy" : mi.calls.missed <= 2 ? "attention" : "risk"} />
        <MetricTile label="Total inbound" value={mi.calls.inbound} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MktgCard title="Calls by state">
          {byState.length === 0 ? (
            <EmptyRow>No call data yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-border/60">
              {byState.map((s) => (
                <div key={s.state} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="font-medium text-foreground">{s.state}</span>
                  <span className="text-muted-foreground tabular-nums">{s.count} calls</span>
                </div>
              ))}
            </div>
          )}
        </MktgCard>

        <MktgCard title="Most recent">
          {recent.length === 0 ? (
            <EmptyRow>No recent calls.</EmptyRow>
          ) : (
            <div className="divide-y divide-border/60">
              {recent.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5 text-[13px]">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{c.callerName ?? c.phoneNumber}</div>
                    <div className="text-[11.5px] text-muted-foreground">{c.state ?? "—"} · {timeSinceCall(c.callTime)}</div>
                  </div>
                  <HealthPill tone={c.status === "Connected" ? "healthy" : c.status === "New" ? "attention" : "neutral"}>
                    {c.status}
                  </HealthPill>
                </div>
              ))}
            </div>
          )}
        </MktgCard>
      </div>
    </MktgPage>
  );
}