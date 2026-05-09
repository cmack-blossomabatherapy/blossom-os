import { Check, PlayCircle, FileText, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  blurb: string;
  videoLabel?: string;
  sopLabel?: string;
  tangoLabel?: string;
  done: boolean;
  onComplete: () => void;
}

export function SystemTrainingCard({ name, blurb, videoLabel, sopLabel, tangoLabel, done, onComplete }: Props) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{blurb}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {videoLabel && (
          <Button size="sm" variant="outline" className="gap-1.5 rounded-xl"><PlayCircle className="h-3.5 w-3.5" /> {videoLabel}</Button>
        )}
        {sopLabel && (
          <Button size="sm" variant="outline" className="gap-1.5 rounded-xl"><FileText className="h-3.5 w-3.5" /> {sopLabel}</Button>
        )}
        {tangoLabel && (
          <Button size="sm" variant="outline" className="gap-1.5 rounded-xl"><Wand2 className="h-3.5 w-3.5" /> {tangoLabel}</Button>
        )}
      </div>
      <Button size="sm" variant={done ? "secondary" : "default"} onClick={onComplete} className={cn("gap-1.5", done && "pointer-events-none")}>
        {done ? <><Check className="h-3.5 w-3.5" /> Training complete</> : "Mark training complete"}
      </Button>
    </div>
  );
}