import { OpsPage, OpsCard, HealthPill, EmptyRow } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";

export default function OpsEscalations() {
  const ops = useOpsIntelligence();
  const critical = ops.risks.filter((r) => r.tone === "blocked");
  const high = ops.risks.filter((r) => r.tone === "risk");
  const watch = ops.risks.filter((r) => r.tone === "attention");

  const Section = ({ title, list, empty }: { title: string; list: typeof ops.risks; empty: string }) => (
    <OpsCard title={title} hint={`${list.length} item${list.length === 1 ? "" : "s"}`}>
      {list.length === 0 ? (
        <EmptyRow>{empty}</EmptyRow>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
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
  );

  return (
    <OpsPage title="Escalations & Blockers" subtitle="Unresolved operational issues that need leadership awareness.">
      <div className="grid gap-4">
        <Section title="Critical — blocked" list={critical} empty="Nothing critical right now." />
        <Section title="At risk" list={high} empty="No active risk items." />
        <Section title="Watch list" list={watch} empty="Nothing on the watch list." />
      </div>
    </OpsPage>
  );
}