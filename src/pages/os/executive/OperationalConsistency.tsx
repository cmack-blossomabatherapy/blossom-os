import { useMemo } from "react";
import { Workflow, BookOpen, GraduationCap } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";

export default function OperationalConsistency() {
  const ops = useOpsIntelligence();

  const adoption = useMemo(() => {
    return [
      { id: "sop", label: "SOP adoption", value: 86, hint: "Across departments" },
      { id: "workflow", label: "Workflow consistency", value: 82, hint: "Department alignment" },
      { id: "onboarding", label: "Onboarding quality", value: 88, hint: "New hire ramp-up" },
      { id: "training", label: "Training reinforcement", value: 84, hint: "Re-engagement rate" },
      { id: "execution", label: "Execution consistency", value: 80, hint: "Cross-state" },
      { id: "drift", label: "Operational drift", value: 100 - Math.min(60, ops.risks.length * 10), hint: "Lower drift = healthier" },
    ].map((d) => {
      const tone: HealthTone = d.value >= 85 ? "healthy" : d.value >= 70 ? "attention" : d.value >= 55 ? "risk" : "blocked";
      return { ...d, tone };
    });
  }, [ops.risks]);

  return (
    <ExecPage
      title="Operational Consistency"
      subtitle="The signal of stable execution at scale — SOPs, workflows, training, and drift."
    >
      <ExecCard title="Consistency dimensions" hint="Live read">
        <div className="grid gap-2 md:grid-cols-2">
          {adoption.map((a) => (
            <div key={a.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-medium">{a.label}</span>
                <HealthPill tone={a.tone}>{a.value}</HealthPill>
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">{a.hint}</div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={
                  a.tone === "healthy" ? "h-full bg-emerald-500"
                  : a.tone === "attention" ? "h-full bg-amber-500"
                  : a.tone === "risk" ? "h-full bg-orange-500" : "h-full bg-rose-500"
                } style={{ width: `${a.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      <ExecCard title="Departmental alignment" hint="From operational signals">
        <div className="grid gap-2 sm:grid-cols-2">
          {ops.depts.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3 py-2.5">
              <span className="text-[13px] font-medium">{d.name}</span>
              <HealthPill tone={d.tone}>{d.tone}</HealthPill>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Where is drift highest?" prompt="Where is operational drift highest across Blossom departments?" />
          <AIPrompt label="Suggest reinforcement" prompt="Suggest workflow reinforcement priorities for the next 30 days" />
          <AIPrompt label="Summarize consistency" prompt="Summarize Blossom's operational consistency for the CEO" />
        </div>
      </ExecCard>
    </ExecPage>
  );
}
