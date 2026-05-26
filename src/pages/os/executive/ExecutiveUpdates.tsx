import { useMemo } from "react";
import { Megaphone, Pin } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, ActionPill, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";

export default function ExecutiveUpdates() {
  const ops = useOpsIntelligence();

  const updates = useMemo(() => {
    const out: { id: string; title: string; body: string; tone: HealthTone; tag: string }[] = [];
    if (ops.risks.some((r) => r.tone === "blocked"))
      out.push({ id: "u1", title: "Workflow reinforcement required", body: "Active blockers detected across departments. Leads asked to align and coordinate this week.", tone: "blocked", tag: "Priority" });
    if (ops.recruiting.stalledCandidates.length > 4)
      out.push({ id: "u2", title: "Recruiting pipeline acceleration", body: `${ops.recruiting.stalledCandidates.length} stalled candidates — Recruiting and HR coordinating on outreach this week.`, tone: "attention", tag: "Staffing" });
    if (ops.auths.expiring14.length > 0)
      out.push({ id: "u3", title: "Authorization renewal window open", body: `${ops.auths.expiring14.length} authorizations expire ≤14d. Auth team coordinating with QA on reauth packets.`, tone: "attention", tag: "Operations" });
    out.push({ id: "u4", title: "Weekly leadership rhythm", body: "Department leads to publish weekly progress notes by Friday EOD.", tone: "neutral", tag: "Cadence" });
    out.push({ id: "u5", title: "Quarterly priorities", body: "Focus areas: staffing stability, QA throughput, multi-state readiness, AI-native operations.", tone: "healthy", tag: "Strategic" });
    return out;
  }, [ops]);

  return (
    <ExecPage
      title="Executive Updates"
      subtitle="Centralized leadership direction — priorities, alignment, and operational rhythm."
    >
      <ExecCard title="Active priorities" hint="Published">
        <div className="space-y-2">
          {updates.map((u) => (
            <div key={u.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Pin className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-[14px] font-medium">{u.title}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted-foreground max-w-2xl">{u.body}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <HealthPill tone={u.tone}>{u.tag}</HealthPill>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <ActionPill label="Acknowledge" toastMessage={`Acknowledged: ${u.title}`} />
                <ActionPill label="Share with leads" toastMessage={`${u.title} shared with leadership`} />
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      <ExecCard title="AI communication intelligence" hint="Drafting & alignment">
        <div className="flex flex-wrap gap-1.5">
          <AIPrompt label="Draft leadership update" prompt="Draft a brief leadership update for the executive team based on today's signals" variant="card" />
          <AIPrompt label="Summarize organizational changes" prompt="Summarize the organizational changes leadership should be aware of this week" variant="card" />
          <AIPrompt label="Detect communication gaps" prompt="Where are communication gaps appearing across Blossom departments?" variant="card" />
          <AIPrompt label="Recommend reinforcement messaging" prompt="Recommend reinforcement messaging for emerging operational priorities" variant="card" />
        </div>
      </ExecCard>
    </ExecPage>
  );
}
