import { OpsPage, OpsCard, HealthPill } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";

export default function OpsDepartmentHealth() {
  const ops = useOpsIntelligence();
  return (
    <OpsPage title="Department Health" subtitle="A lightweight operational score for each department, derived from live signals.">
      <div className="grid gap-3 md:grid-cols-2">
        {ops.depts.map((d) => (
          <OpsCard key={d.id} className="!p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[15px] font-semibold tracking-tight text-foreground">{d.name}</div>
                <div className="mt-1 text-[12.5px] text-muted-foreground">{d.signal}</div>
              </div>
              <div className="text-right">
                <div className="text-[22px] font-semibold tracking-tight tabular-nums text-foreground">
                  {Math.round(d.score)}
                </div>
                <div className="mt-1"><HealthPill tone={d.tone}>{d.tone}</HealthPill></div>
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground/70"
                style={{ width: `${Math.min(100, Math.max(8, d.score))}%` }}
              />
            </div>
          </OpsCard>
        ))}
      </div>
    </OpsPage>
  );
}