import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/intelligence/ScoreRing";
import { Badge } from "@/components/ui/badge";
import { departmentReadiness } from "@/data/blossomIntelligence";

export default function DepartmentAnalytics() {
  return (
    <GlassPageShell eyebrow="Department Analytics" eyebrowIcon={Building2}
      title="Per-department performance" description="Readiness, completion, alerts across every team.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {departmentReadiness.map((d) => (
          <Link key={d.department} to={`/intelligence/departments/${encodeURIComponent(d.department.toLowerCase())}`}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{d.department}</h3>
              <Badge variant="outline" className="text-[10px]">{d.overall >= 85 ? "Strong" : d.overall >= 70 ? "Steady" : "Needs focus"}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ScoreRing value={d.overall} size={72} />
              <div className="text-xs space-y-1 text-muted-foreground">
                <div>Open tasks · <span className="text-foreground font-semibold">{Math.round((100 - d.overall) / 6)}</span></div>
                <div>Alerts · <span className="text-foreground font-semibold">{d.overall < 75 ? 2 : 0}</span></div>
                <div>Engagement · <span className="text-foreground font-semibold">{d.overall >= 80 ? "High" : "Medium"}</span></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </GlassPageShell>
  );
}
