import { Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  assignee: string;
  goals: string[];
  notes: string;
  done: boolean;
  onNotesChange: (text: string) => void;
  onComplete: () => void;
}

export function ShadowingCard({ assignee, goals, notes, done, onNotesChange, onComplete }: Props) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Shadowing</p>
      </div>
      <div className="rounded-xl bg-muted/40 p-3 text-xs">
        <p className="font-medium text-foreground">Assigned to:</p>
        <p className="mt-0.5 text-muted-foreground">{assignee}</p>
      </div>
      <ul className="space-y-1.5 text-xs">
        {goals.map((g) => (
          <li key={g} className="flex items-start gap-2 text-muted-foreground"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{g}</li>
        ))}
      </ul>
      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Observation notes</p>
        <Textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="What did you see? What stood out?" rows={3} className="resize-none text-sm" />
      </div>
      <Button size="sm" variant={done ? "secondary" : "default"} onClick={onComplete} className={cn("gap-1.5", done && "pointer-events-none")}>
        {done ? <><Check className="h-3.5 w-3.5" /> Shadowing complete</> : "Mark shadowing complete"}
      </Button>
    </div>
  );
}