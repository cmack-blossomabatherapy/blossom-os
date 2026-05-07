import { Progress } from "@/components/ui/progress";

interface Props {
  percent: number;
  completed: number;
  total: number;
  remainingMinutes: number;
}

export function ProgressSummary({ percent, completed, total, remainingMinutes }: Props) {
  return (
    <div className="glass-surface rounded-3xl p-5 md:p-6">
      <h3 className="text-base font-semibold text-foreground">Progress</h3>
      <p className="text-xs text-muted-foreground mt-0.5">A quick look at where you are.</p>
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Overall</span>
            <span className="font-semibold text-foreground tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Completed" value={`${completed}`} />
          <Stat label="Remaining" value={`${total - completed}`} />
          <Stat label="Est. left" value={formatTime(remainingMinutes)} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
      <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function formatTime(mins: number) {
  if (mins <= 0) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 8); // approx workdays
  return `${d}d`;
}
