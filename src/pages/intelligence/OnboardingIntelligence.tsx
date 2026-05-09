import { Compass, Clock } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/intelligence/ScoreRing";
import { FilterBar } from "@/components/intelligence/FilterBar";
import { onboardingStages, onboardingByDept, newHireProgress } from "@/data/blossomIntelligence";

export default function OnboardingIntelligence() {
  return (
    <GlassPageShell eyebrow="Onboarding Intelligence" eyebrowIcon={Compass}
      title="New hire velocity & flow" description="Time-to-completion, stuck stages, and per-department onboarding leaderboard.">
      <FilterBar />

      <Card className="mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold">Onboarding flow</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {onboardingStages.map((s, i) => (
            <div key={s.stage} className="rounded-xl border border-border/60 bg-card p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Step {i + 1}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{s.count}</p>
              <p className="text-xs text-foreground">{s.stage}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 flex flex-col items-center justify-center">
          <Clock className="h-5 w-5 text-primary mb-1" />
          <p className="text-3xl font-semibold tracking-tight">11.4d</p>
          <p className="text-xs text-muted-foreground">Avg time to completion · target 10d</p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Department onboarding leaderboard</h3>
          <div className="space-y-2">
            {onboardingByDept.map((d) => (
              <div key={d.department} className="flex items-center gap-3">
                <span className="text-sm font-medium w-32 truncate">{d.department}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${d.completion}%` }} />
                </div>
                <span className="text-xs font-semibold w-10 text-right">{d.completion}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h3 className="mb-3 text-sm font-semibold">New hires in progress</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {newHireProgress.map((n) => (
            <div key={n.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
              <ScoreRing value={n.progress} size={64} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{n.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{n.role} · {n.department} · {n.state}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant={n.stage === "Stuck" ? "destructive" : "outline"} className="text-[10px]">{n.stage}</Badge>
                  <span className="text-[10px] text-muted-foreground">Day {n.daysSinceHire}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </GlassPageShell>
  );
}
