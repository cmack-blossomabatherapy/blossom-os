import { Users } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Heatmap } from "@/components/intelligence/Heatmap";
import { FilterBar } from "@/components/intelligence/FilterBar";
import { Badge } from "@/components/ui/badge";
import { departmentReadiness, competencyAreas, competencyGaps, engagementScores } from "@/data/blossomIntelligence";

export default function WorkforceIntelligence() {
  return (
    <GlassPageShell
      eyebrow="Workforce Intelligence"
      eyebrowIcon={Users}
      title="Readiness, gaps, engagement"
      description="See where the workforce is strong, where the gaps are, and who needs attention."
    >
      <FilterBar showRole />

      <Card className="mt-4 p-5">
        <h3 className="mb-3 text-sm font-semibold">Department readiness heatmap</h3>
        <Heatmap rows={departmentReadiness.map((r) => ({ label: r.department, values: r.competencies }))} columns={competencyAreas} />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Competency gaps</h3>
          <div className="space-y-3">
            {competencyGaps.map((g) => (
              <div key={g.area}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{g.area}</span>
                  <span className="text-muted-foreground">{g.gap}% gap</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-warning" style={{ width: `${g.gap * 4}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Engagement scores</h3>
          <div className="space-y-2">
            {engagementScores.map((e) => {
              const tone = e.engagement === "High" ? "bg-success/15 text-success" : e.engagement === "Medium" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive";
              return (
                <div key={e.name} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{e.name}</p>
                    <p className="text-[10px] text-muted-foreground">{e.department} · {e.lastActive}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{e.completion}%</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}>{e.engagement}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </GlassPageShell>
  );
}
