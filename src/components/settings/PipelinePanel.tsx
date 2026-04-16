import { ChevronRight, GripVertical } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockPipelineStages, type PipelineStage } from "@/data/settings";

export function PipelinePanel() {
  const lead = mockPipelineStages.filter((s) => s.pipeline === "Lead").sort((a, b) => a.order - b.order);
  const client = mockPipelineStages.filter((s) => s.pipeline === "Client").sort((a, b) => a.order - b.order);

  return (
    <SettingsPanel
      title="Pipeline Stages"
      description="Edit Lead and Client lifecycle stages — automations and tasks reference these names"
      primaryAction={{ label: "Add Stage" }}
    >
      <div className="space-y-6">
        <PipelineGroup title="Lead Pipeline" stages={lead} />
        <PipelineGroup title="Client Pipeline" stages={client} />
      </div>
    </SettingsPanel>
  );
}

function PipelineGroup({ title, stages }: { title: string; stages: PipelineStage[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-stretch gap-1 shrink-0">
            <div className="rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-2 flex items-center gap-2 min-w-[140px]">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <StatusBadge status={s.label} variant={s.color} />
                {s.terminal && <p className="text-[10px] text-muted-foreground mt-1">Terminal stage</p>}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div className="flex items-center text-muted-foreground/30">
                <ChevronRight className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
