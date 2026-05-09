import { Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleCheckIn } from "@/lib/onboarding/storage";

interface Props {
  who: "chad" | "shira";
  label: string;
  cadence: "weekly" | "daily";
  cells: number;
  done: string[];
}

export function CheckInTracker({ who, label, cadence, cells, done }: Props) {
  const items = Array.from({ length: cells }, (_, i) => `${who}-${i + 1}`);
  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">{label}</p>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{cadence}</span>
      </div>
      <div className={cn("grid gap-1.5", cadence === "daily" ? "grid-cols-7" : "grid-cols-4")}>
        {items.map((id, i) => {
          const isDone = done.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggleCheckIn(who, id)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border text-[11px] font-medium transition-colors",
                isDone ? "border-primary/50 bg-primary text-primary-foreground" : "border-border/60 bg-background hover:bg-muted",
              )}
              aria-label={`Toggle ${cadence} check-in ${i + 1}`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">{done.length}/{cells} logged</p>
    </div>
  );
}