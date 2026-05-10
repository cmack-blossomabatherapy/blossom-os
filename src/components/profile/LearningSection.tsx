import { GraduationCap, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function LearningSection({ academyPercent }: { academyPercent: number }) {
  const items = [
    { l: "Onboarding", v: 40, to: "/onboarding" },
    { l: "Required Training", v: 60, to: "/my-learning" },
    { l: "Role Academy", v: academyPercent, to: "/academy" },
  ];
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">My learning</h2>
        </div>
        <Button asChild size="sm" variant="ghost"><Link to="/my-learning">Open <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
      </div>
      <div className="space-y-4">
        {items.map((p) => (
          <Link key={p.l} to={p.to} className="block group">
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-foreground group-hover:text-primary">{p.l}</span>
              <span className="tabular-nums text-muted-foreground">{p.v}%</span>
            </div>
            <Progress value={p.v} className="h-1.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}