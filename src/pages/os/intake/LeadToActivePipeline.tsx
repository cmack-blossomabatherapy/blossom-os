import { useMemo } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { GrowthPageShell, Section, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import type { LeadStatus } from "@/data/leads";

const STAGES: LeadStatus[] = [
  "New Lead",
  "In Contact",
  "Sent Form",
  "Missing Information",
  "Form Received",
  "Sent to VOB",
  "VOB Completed",
  "Non-Qualified",
];

export default function LeadToActivePipeline() {
  const { leads, loading } = useLeads();

  const byStage = useMemo(() => {
    const map = new Map<LeadStatus, typeof leads>();
    STAGES.forEach((s) => map.set(s, []));
    leads.forEach((l) => {
      const arr = map.get(l.status as LeadStatus);
      if (arr) arr.push(l);
    });
    return map;
  }, [leads]);

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Lead To Active Pipeline"
      description="Track every lead through the journey from first contact to active care."
      actions={[
        { label: "Open Patient Lifetime Journey", to: "/patient-journey", icon: TrendingUp },
        { label: "Open Leads", to: "/leads?view=pipeline" },
      ]}
    >
      <Section title="Pipeline stages" description="Counts and recent leads per stage.">
        <div className="overflow-x-auto">
          <div className="flex items-stretch gap-3 min-w-max pb-2">
            {STAGES.map((stage) => {
              const items = byStage.get(stage) ?? [];
              return (
                <div key={stage} className="rounded-2xl border border-border/70 bg-card p-4 w-64 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{stage}</div>
                    <div className="text-lg font-semibold tabular-nums text-foreground">{items.length}</div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {items.slice(0, 6).map((l) => (
                      <Link
                        key={l.id}
                        to={`/leads/${l.id}`}
                        className="block rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                      >
                        <div className="font-medium truncate">{l.childName}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{l.owner || "Unassigned"} · {l.state}</div>
                      </Link>
                    ))}
                    {items.length === 0 && (
                      <div className="text-[11px] text-muted-foreground italic">No leads in stage</div>
                    )}
                    {items.length > 6 && (
                      <Link to={`/leads?view=pipeline`} className="text-[11px] text-primary hover:underline">
                        +{items.length - 6} more
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {leads.length === 0 && (
        <ReadyForDataNotice message={loading ? "Loading leads…" : "No leads yet. Add a lead or connect a source to populate the pipeline."} />
      )}
    </GrowthPageShell>
  );
}