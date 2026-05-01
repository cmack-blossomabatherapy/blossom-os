import { Check, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TrainingModule } from "@/data/journey";

interface Props {
  modules: TrainingModule[];
  completed: Record<string, boolean>;
  onToggle: (id: string) => void;
}

const CATEGORY_TONE: Record<TrainingModule["category"], string> = {
  Compliance: "bg-warning/10 text-warning border-warning/30",
  Clinical: "bg-info/10 text-info border-info/30",
  Operations: "bg-primary/10 text-primary border-primary/30",
  Methodology: "bg-success/10 text-success border-success/30",
};

export function TrainingModulesGrid({ modules, completed, onToggle }: Props) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Training modules</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Required Blossom courses for your role.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modules.map((m) => {
          const isDone = !!completed[m.id];
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border p-4 transition-all",
                isDone ? "border-primary/30 bg-primary/5" : "border-border/60 hover:border-primary/30 hover:shadow-sm",
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", CATEGORY_TONE[m.category])}>
                  {m.category}
                </span>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full",
                  isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  {isDone ? "Completed" : "Not started"}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">{m.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>Assigned by <span className="font-medium text-foreground">{m.assignedBy}</span></span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {m.estMinutes} min</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant={isDone ? "outline" : "default"} className="rounded-lg" onClick={() => onToggle(m.id)}>
                  {isDone ? <><Check className="h-3.5 w-3.5" /> Completed</> : <><Play className="h-3.5 w-3.5" /> Start</>}
                </Button>
                {isDone && (
                  <button onClick={() => onToggle(m.id)} className="text-[11px] text-muted-foreground hover:text-foreground">
                    Mark incomplete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
