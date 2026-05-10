import { Award, Compass, GraduationCap, Sparkles, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { resetOnboarding, setPreviewLocked } from "@/lib/onboarding/storage";

interface Props {
  ob: any;
  badges: { e: string; l: string; earned: boolean }[];
}

export function OverviewSection({ ob, badges }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Onboarding journey</h2>
          </div>
          <Badge variant={ob.status === "completed" ? "default" : "outline"} className="text-[10px]">
            {ob.status === "completed" ? "Completed" : ob.status === "in_progress" ? "In progress" : "Not started"}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Journey</span>
            <span className="tabular-nums text-foreground">{ob.completedCount}/{ob.totalRequired} · {ob.percent}%</span>
          </div>
          <Progress value={ob.percent} className="h-1.5" />
          {!ob.isComplete && ob.nextStep && (
            <p className="text-[11px] text-muted-foreground">Next: <span className="text-foreground">{ob.nextStep.title}</span></p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!ob.isComplete && (
            <Button asChild size="sm"><Link to={ob.nextPhase?.path || "/onboarding"}>Continue onboarding</Link></Button>
          )}
          {ob.status === "completed" && (
            <Button asChild size="sm" variant="outline"><Link to="/onboarding/graduation">View certificate</Link></Button>
          )}
        </div>
        {ob.phaseProgress?.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {ob.phaseProgress.filter((p: any) => p.phase.id !== "graduation").map((p: any) => (
              <div key={p.phase.id}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{p.phase.weekLabel} — {p.phase.title}</span>
                  <span className="tabular-nums text-muted-foreground">{p.done}/{p.total}</span>
                </div>
                <Progress value={p.percent} className="h-1" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Badges</h2>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {badges.map((b, i) => (
            <div key={i} className={`flex flex-col items-center gap-1 rounded-xl border border-border/50 p-2 text-[10px] ${b.earned ? "" : "opacity-40"}`}>
              <span className="text-xl">{b.e}</span>
              <span className="text-muted-foreground">{b.l}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}