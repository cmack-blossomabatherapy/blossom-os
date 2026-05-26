import { OpsPage, OpsCard, HealthPill, EmptyRow } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";

export default function OpsLeadershipBriefing() {
  const ops = useOpsIntelligence();
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const wins = [
    ops.auths.expiring7.length === 0 && "No authorizations expiring in the next 7 days.",
    ops.auths.qaStalled.length === 0 && "QA review queue is clear.",
    ops.recruiting.stalledCandidates.length === 0 && "All candidates moved within the last 14 days.",
  ].filter(Boolean) as string[];

  return (
    <OpsPage title="Leadership Briefing" subtitle={today}>
      <div className="grid gap-4 lg:grid-cols-3">
        <OpsCard title="Attention today" className="lg:col-span-2">
          {ops.risks.length === 0 ? (
            <EmptyRow>No items requiring leadership attention today.</EmptyRow>
          ) : (
            <ul className="space-y-2">
              {ops.risks.map((r) => (
                <li key={r.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13.5px] font-medium text-foreground">{r.title}</div>
                    <HealthPill tone={r.tone}>{r.area}</HealthPill>
                  </div>
                  <div className="mt-1 text-[12px] text-muted-foreground">{r.detail}</div>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        <OpsCard title="Wins">
          {wins.length === 0 ? (
            <EmptyRow>No green flags yet today.</EmptyRow>
          ) : (
            <ul className="space-y-2 text-[13px] text-foreground/90">
              {wins.map((w, i) => (
                <li key={i} className="rounded-xl bg-emerald-50/60 border border-emerald-200/60 px-3 py-2">{w}</li>
              ))}
            </ul>
          )}
        </OpsCard>
      </div>

      <OpsCard title="Department posture">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ops.depts.map((d) => (
            <div key={d.id} className="rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-foreground">{d.name}</span>
                <HealthPill tone={d.tone}>{d.tone}</HealthPill>
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">{d.signal}</div>
            </div>
          ))}
        </div>
      </OpsCard>
    </OpsPage>
  );
}