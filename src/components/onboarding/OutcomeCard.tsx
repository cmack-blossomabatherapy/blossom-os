import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  bullets: string[];
  nextLabel?: string;
  nextPath?: string;
}

export function OutcomeCard({ title, bullets, nextLabel, nextPath }: Props) {
  return (
    <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />{b}</li>
        ))}
      </ul>
      {nextPath && nextLabel && (
        <Button asChild size="sm" className="gap-1.5">
          <Link to={nextPath}>{nextLabel} <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      )}
    </div>
  );
}