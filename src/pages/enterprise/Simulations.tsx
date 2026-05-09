import { useNavigate } from "react-router-dom";
import { Gamepad2, Clock, Trophy, Users } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { simulations } from "@/data/blossomEnterprise";
import { cn } from "@/lib/utils";

const DIFF_TONE = { Beginner: "bg-success/10 text-success", Intermediate: "bg-primary/10 text-primary", Advanced: "bg-warning/10 text-warning" } as const;

export default function Simulations() {
  const nav = useNavigate();
  return (
    <GlassPageShell eyebrow="Enterprise" eyebrowIcon={Gamepad2} title="Simulation Training"
      description="Branching, scenario-based training that builds judgment — intake calls, family conversations, insurance walkthroughs, scheduling triage, QA coaching, and leadership decisions.">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {simulations.map(s => (
          <Card key={s.id} className="bg-card/60 backdrop-blur-xl hover:border-primary/40 transition-all cursor-pointer" onClick={() => nav(`/enterprise/simulations/${s.id}`)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
                <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5", DIFF_TONE[s.difficulty])}>{s.difficulty}</span>
              </div>
              <CardTitle className="text-base leading-snug mt-2">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground line-clamp-2">{s.scenario}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{s.durationMin}m</span>
                <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3" />{s.avgScore}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{s.attempts}</span>
              </div>
              <Button size="sm" className="w-full">Start scenario</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </GlassPageShell>
  );
}