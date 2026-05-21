import type { SupervisorRow } from "@/lib/analytics/stateOps";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/phi/redact";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  rows: SupervisorRow[];
}

/**
 * Top + bottom BCBAs by supervision-per-direct-hour ratio. This is the
 * Kate Saul vs Shana Roberts comparison Yosif asked for, made visual.
 * No patient names ever rendered.
 */
export function SupervisionLeaderboard({ rows }: Props) {
  if (!rows.length) {
    return (
      <div className="grid h-24 place-items-center rounded-2xl border border-dashed border-foreground/15 text-[12px] text-muted-foreground">
        No BCBA supervision data in this window.
      </div>
    );
  }
  const top = rows.slice(0, 5);
  const bottom = rows.slice(-5).reverse();
  const max = Math.max(...rows.map((r) => r.ratio), 0.001);

  const Row = ({ r, tone }: { r: SupervisorRow; tone: "good" | "bad" }) => {
    const pct = Math.min(100, (r.ratio / max) * 100);
    const Icon = tone === "good" ? ArrowUpRight : ArrowDownRight;
    const barClass = tone === "good" ? "bg-[hsl(155_60%_50%)]" : "bg-[hsl(355_75%_60%)]";
    return (
      <li className="flex items-center gap-3 py-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-foreground/[0.04] text-[11px] font-semibold text-foreground/70">
          {initials(r.bcba)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-medium leading-tight">{r.bcba}</p>
            <span className={cn("inline-flex items-center gap-0.5 text-[11.5px] font-semibold tabular-nums",
              tone === "good" ? "text-[hsl(155_55%_38%)]" : "text-[hsl(355_72%_52%)]")}>
              <Icon className="h-3 w-3" />
              {r.ratio.toFixed(2)}×
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.06]">
              <div className={cn("h-full rounded-full", barClass)} style={{ width: `${pct}%` }} />
            </div>
            <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground">
              {r.supervisionHours.toFixed(0)} sup · {r.directHours.toFixed(0)} dir · {r.uniqueClients} pts
            </span>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(155_55%_38%)]">
          Top supervisors
        </p>
        <p className="mb-2 text-[11px] text-muted-foreground">More supervision per direct hour = healthier ratio.</p>
        <ul className="divide-y divide-foreground/[0.05]">
          {top.map((r) => <Row key={r.bcba} r={r} tone="good" />)}
        </ul>
      </div>
      <div>
        <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(355_72%_52%)]">
          Needs attention
        </p>
        <p className="mb-2 text-[11px] text-muted-foreground">Underweight supervision — flag for coaching.</p>
        <ul className="divide-y divide-foreground/[0.05]">
          {bottom.map((r) => <Row key={r.bcba} r={r} tone="bad" />)}
        </ul>
      </div>
    </div>
  );
}