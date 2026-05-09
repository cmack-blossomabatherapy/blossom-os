import { Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  role: string;
  initials: string;
  message: string;
  done: boolean;
  onComplete: () => void;
}

export function LeaderCard({ name, role, initials, message, done, onComplete }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-4 sm:flex-row sm:items-start">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">
        {initials}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{role}</p>
        </div>
        <p className="flex items-start gap-1.5 rounded-xl bg-background/70 p-2.5 text-xs italic leading-relaxed text-muted-foreground">
          <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>"{message}"</span>
        </p>
        <Button size="sm" variant={done ? "secondary" : "default"} onClick={onComplete} className={cn("gap-1.5", done && "pointer-events-none")}>
          {done ? <><Check className="h-3.5 w-3.5" /> Meeting complete</> : "Mark meeting complete"}
        </Button>
      </div>
    </div>
  );
}