import { GraduationCap } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { FunnelChart } from "@/components/intelligence/FunnelChart";
import { TrendLine } from "@/components/intelligence/TrendLine";
import { FilterBar } from "@/components/intelligence/FilterBar";
import { trainingFunnel, completionTrend, coursePerformance } from "@/data/blossomIntelligence";

export default function TrainingIntelligence() {
  const top = [...coursePerformance].sort((a, b) => b.completion - a.completion).slice(0, 3);
  const dropoff = [...coursePerformance].sort((a, b) => b.dropoff - a.dropoff).slice(0, 3);
  return (
    <GlassPageShell eyebrow="Training Intelligence" eyebrowIcon={GraduationCap}
      title="Learning analytics" description="Funnels, dropoff, engagement, and course performance.">
      <FilterBar />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Training funnel</h3>
          <FunnelChart stages={trainingFunnel} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Completion rate trend</h3>
          <TrendLine values={completionTrend} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-success">Top engaged courses</h3>
          <ul className="space-y-2">
            {top.map((c) => (
              <li key={c.title} className="flex items-center justify-between rounded-lg bg-success/[0.05] px-3 py-2 text-sm">
                <span className="font-medium">{c.title}</span>
                <span className="text-success font-semibold">{c.completion}%</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-destructive">Top dropoff courses</h3>
          <ul className="space-y-2">
            {dropoff.map((c) => (
              <li key={c.title} className="flex items-center justify-between rounded-lg bg-destructive/[0.05] px-3 py-2 text-sm">
                <span className="font-medium">{c.title}</span>
                <span className="text-destructive font-semibold">{c.dropoff}% dropoff</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 p-5 overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold">Course performance matrix</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr><th className="text-left py-2">Course</th><th className="text-center">Enrolled</th><th className="text-center">Completion</th><th className="text-center hidden sm:table-cell">Avg time</th><th className="text-center">Quiz pass</th><th className="text-center hidden sm:table-cell">Dropoff</th></tr>
          </thead>
          <tbody>
            {coursePerformance.map((c) => (
              <tr key={c.title} className="border-t border-border/40">
                <td className="py-2 font-medium">{c.title}</td>
                <td className="text-center">{c.enrolled}</td>
                <td className="text-center">{c.completion}%</td>
                <td className="text-center hidden sm:table-cell">{c.avgMinutes}m</td>
                <td className="text-center">{c.quizPassRate}%</td>
                <td className="text-center hidden sm:table-cell">{c.dropoff}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </GlassPageShell>
  );
}
