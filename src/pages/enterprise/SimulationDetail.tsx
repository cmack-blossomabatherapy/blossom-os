import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Gamepad2, ChevronLeft, CheckCircle2, Trophy } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { simulations, simulationStepsByScenario } from "@/data/blossomEnterprise";
import { cn } from "@/lib/utils";

export default function SimulationDetail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const sim = simulations.find(s => s.id === id) ?? simulations[0];
  const steps = simulationStepsByScenario[sim.id] ?? simulationStepsByScenario["sim-intake"];
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [stepIdx, setStepIdx] = useState(0);
  const done = stepIdx >= steps.length;
  const totalScore = Object.entries(picks).reduce((acc, [sid, idx]) => {
    const st = steps.find(s => s.id === sid); return acc + (st?.options[idx]?.score ?? 0);
  }, 0);
  const avgScore = Object.keys(picks).length ? Math.round(totalScore / Object.keys(picks).length) : 0;

  return (
    <GlassPageShell eyebrow="Enterprise" eyebrowIcon={Gamepad2} title={sim.title} description={sim.scenario}
      actions={<Button variant="outline" size="sm" className="gap-1.5" onClick={() => nav("/enterprise/simulations")}><ChevronLeft className="h-4 w-4" /> Back</Button>}>
      {!done ? (
        <Card className="bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <Badge variant="outline" className="w-fit text-[10px]">Step {stepIdx + 1} of {steps.length}</Badge>
            <CardTitle className="text-base leading-snug mt-2">{steps[stepIdx].prompt}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps[stepIdx].options.map((o, i) => {
              const picked = picks[steps[stepIdx].id] === i;
              return (
                <button key={i} onClick={() => { setPicks(p => ({ ...p, [steps[stepIdx].id]: i })); }}
                  className={cn("w-full text-left rounded-xl border p-3 transition-all hover:bg-muted/40",
                    picked ? "border-primary bg-primary/5" : "border-border/60 bg-background/40")}>
                  <div className="text-sm font-medium">{o.label}</div>
                  {picked && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="text-foreground/85">Outcome:</span> {o.outcome}
                      <span className="ml-2 inline-block rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">+{o.score}</span>
                    </div>
                  )}
                </button>
              );
            })}
            <p className="text-[11px] text-muted-foreground pt-2"><strong>Coaching tip:</strong> {steps[stepIdx].coachingTip}</p>
            <div className="flex justify-end pt-2">
              <Button size="sm" disabled={picks[steps[stepIdx].id] === undefined} onClick={() => setStepIdx(i => i + 1)}>
                {stepIdx === steps.length - 1 ? "Finish" : "Next step"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/60 backdrop-blur-xl">
          <CardContent className="p-8 flex flex-col items-center text-center gap-3">
            <Trophy className="h-10 w-10 text-success" />
            <div className="text-3xl font-bold tabular-nums">{avgScore}<span className="text-base text-muted-foreground">/100</span></div>
            <p className="text-sm text-muted-foreground">Scenario complete — {avgScore >= 85 ? "excellent judgment." : avgScore >= 70 ? "solid run, room to grow." : "review the coaching tips and retry."}</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setPicks({}); setStepIdx(0); }}>Retry</Button>
              <Button onClick={() => nav("/enterprise/simulations")} className="gap-1.5"><CheckCircle2 className="h-4 w-4" /> Done</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </GlassPageShell>
  );
}