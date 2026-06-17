import { TrendingUp, ArrowRight } from "lucide-react";
import { GrowthPageShell, Section, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";

const STAGES = [
  { name: "New Lead", count: "—" },
  { name: "Parent Contact", count: "—" },
  { name: "Intake Forms", count: "—" },
  { name: "Benefits Verified", count: "—" },
  { name: "Authorization", count: "—" },
  { name: "Staffing", count: "—" },
  { name: "Active", count: "—" },
];

export default function LeadToActivePipeline() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Lead To Active Pipeline"
      description="Track every lead through the journey from first contact to active care."
      actions={[{ label: "Open Patient Lifetime Journey", to: "/patient-journey", icon: TrendingUp }]}
    >
      <Section title="Pipeline stages">
        <div className="overflow-x-auto">
          <div className="flex items-stretch gap-3 min-w-max pb-2">
            {STAGES.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="rounded-2xl border border-border/70 bg-card p-4 w-44">
                  <div className="text-xs text-muted-foreground">{s.name}</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground">{s.count}</div>
                </div>
                {i < STAGES.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <ReadyForDataNotice message="This workspace is ready for live data. Each stage will show live counts, owners, aging, and one-click actions to move leads forward." />
    </GrowthPageShell>
  );
}