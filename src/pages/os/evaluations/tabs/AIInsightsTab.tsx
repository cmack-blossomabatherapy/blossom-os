import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, Info, AlertOctagon, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { EvaluationsData } from "../useEvaluationsData";
import type { EvalAIInsight } from "../types";

function Icon({ s }: { s: string }) {
  if (s === "crit") return <AlertOctagon className="h-4 w-4 text-destructive" />;
  if (s === "warn") return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
  return <Info className="h-4 w-4 text-primary" />;
}

function tone(s: string) {
  if (s === "crit") return "border-destructive/30 bg-destructive/5";
  if (s === "warn") return "border-amber-500/30 bg-amber-500/5";
  return "border-primary/20 bg-primary/5";
}

export default function AIInsightsTab({ data }: { data: EvaluationsData }) {
  const [running, setRunning] = useState(false);
  const visible = data.insights.filter((i) => !i.dismissed);

  async function generate() {
    setRunning(true);
    const { error } = await supabase.functions.invoke("evaluations-ai-insights", { body: {} });
    setRunning(false);
    if (error) {
      const msg = (error as any).message || String(error);
      return toast({
        title: "AI insights failed",
        description: msg.includes("402") ? "AI credits exhausted. Add credits in Settings → Workspace → Usage."
          : msg.includes("429") ? "Rate limited. Try again in a minute."
          : msg,
        variant: "destructive",
      });
    }
    toast({ title: "Insights refreshed" });
    data.refresh();
  }

  async function dismiss(insight: EvalAIInsight) {
    await (supabase.from as any)("evaluation_ai_insights").update({ dismissed: true }).eq("id", insight.id);
    data.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 to-transparent p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Insights — Evaluation Insights</h3>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            AI analyzes evaluation completion, performance scores, open risk flags, goals, and coaching plans
            to surface trends and risks. Insights are operational only — never used for employment decisions.
          </p>
        </div>
        <Button onClick={generate} disabled={running} size="sm">
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", running && "animate-spin")} />
          {running ? "Analyzing…" : "Refresh insights"}
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center">
          <p className="text-sm font-medium">No insights yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Refresh insights" to have Lovable AI analyze your evaluation data.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((i) => (
            <div key={i.id} className={cn("rounded-2xl border p-4 relative", tone(i.severity))}>
              <button
                onClick={() => dismiss(i)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              ><X className="h-3.5 w-3.5" /></button>
              <div className="flex items-center gap-2 mb-2">
                <Icon s={i.severity} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{i.scope}</span>
              </div>
              <h4 className="text-sm font-semibold leading-snug pr-6">{i.title}</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{i.body}</p>
              {i.recommended_action && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Recommended action</div>
                  <p className="text-xs">{i.recommended_action}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}