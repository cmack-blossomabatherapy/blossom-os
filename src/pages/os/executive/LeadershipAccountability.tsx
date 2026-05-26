import { useMemo } from "react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, ActionPill, type HealthTone, EmptyRow } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";

export default function LeadershipAccountability() {
  const ops = useOpsIntelligence();

  const leaders = useMemo(() => {
    return ops.depts.map((d) => {
      const responsiveness = d.tone === "healthy" ? 92 : d.tone === "attention" ? 78 : d.tone === "risk" ? 64 : 52;
      const followthrough = Math.max(40, responsiveness - 6);
      const ownership: HealthTone = responsiveness >= 85 ? "healthy" : responsiveness >= 70 ? "attention" : responsiveness >= 55 ? "risk" : "blocked";
      return { id: d.id, name: d.name, responsiveness, followthrough, ownership };
    });
  }, [ops]);

  const blockers = useMemo(() => ops.risks.filter((r) => r.tone === "blocked" || r.tone === "risk"), [ops.risks]);

  return (
    <ExecPage
      title="Leadership Accountability"
      subtitle="A supportive read on follow-through, responsiveness, and ownership across leadership."
    >
      <ExecCard title="Department leadership posture" hint="Live read · supportive, not punitive">
        <div className="grid gap-2 md:grid-cols-2">
          {leaders.map((l) => (
            <div key={l.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-medium">{l.name}</div>
                <HealthPill tone={l.ownership}>{l.ownership}</HealthPill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-muted-foreground">
                <div>
                  <div className="uppercase tracking-wider text-[10.5px]">Responsiveness</div>
                  <div className="mt-1 text-[14px] font-medium text-foreground tabular-nums">{l.responsiveness}</div>
                </div>
                <div>
                  <div className="uppercase tracking-wider text-[10.5px]">Follow-through</div>
                  <div className="mt-1 text-[14px] font-medium text-foreground tabular-nums">{l.followthrough}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <ActionPill label="Schedule 1:1" toastMessage={`1:1 requested with ${l.name} lead`} />
                <ActionPill label="Offer support" toastMessage={`Support offered to ${l.name}`} />
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      <ExecCard title="Unresolved blockers" hint="Where ownership is needed">
        {blockers.length === 0 ? (
          <EmptyRow>No unresolved blockers across leadership.</EmptyRow>
        ) : (
          <ul className="space-y-2">
            {blockers.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
                <div>
                  <div className="text-[13.5px] font-medium">{r.title}</div>
                  {r.detail && <p className="mt-0.5 text-[12px] text-muted-foreground">{r.detail}</p>}
                </div>
                <HealthPill tone={r.tone}>{r.tone}</HealthPill>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Where is follow-through weakening?" prompt="Where is leadership follow-through weakening across Blossom departments?" />
          <AIPrompt label="Suggest coaching focus" prompt="Suggest coaching focus areas for department leads this week" />
        </div>
      </ExecCard>
    </ExecPage>
  );
}
