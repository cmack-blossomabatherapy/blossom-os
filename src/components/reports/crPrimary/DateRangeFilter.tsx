import { CalendarRange } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DateRangePreset {
  id: string;
  label: string;
  /** Returns the inclusive `YYYY-MM-DD` range for the preset. */
  range: () => { from: string; to: string };
}

const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const daysBack = (n: number) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (n - 1));
  return { from: key(from), to: key(to) };
};

export const DATE_PRESETS: DateRangePreset[] = [
  { id: "30d", label: "Last 30 days", range: () => daysBack(30) },
  { id: "90d", label: "Last 90 days", range: () => daysBack(90) },
  {
    id: "mtd",
    label: "This month",
    range: () => {
      const now = new Date();
      return { from: key(new Date(now.getFullYear(), now.getMonth(), 1)), to: key(now) };
    },
  },
  {
    id: "ytd",
    label: "This year",
    range: () => {
      const now = new Date();
      return { from: key(new Date(now.getFullYear(), 0, 1)), to: key(now) };
    },
  },
  { id: "all", label: "All dates", range: () => ({ from: "", to: "" }) },
];

/**
 * Date-of-service range control shared by every CentralReach report.
 * Two explicit day inputs plus one-click presets — the presets exist because
 * operators kept typing partial dates, which produced an inert filter.
 */
export function DateRangeFilter({
  from,
  to,
  onChange,
  className,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
  className?: string;
}) {
  const activePreset = DATE_PRESETS.find((p) => {
    const r = p.range();
    return r.from === from && r.to === to;
  });

  return (
    <div className={cn("space-y-2", className)}>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <CalendarRange className="h-3.5 w-3.5" /> Date of service
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          aria-label="From date"
          value={from}
          max={to || undefined}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className="h-9 w-[150px] text-xs"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          aria-label="To date"
          value={to}
          min={from || undefined}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className="h-9 w-[150px] text-xs"
        />
        <div className="flex flex-wrap items-center gap-1">
          {DATE_PRESETS.map((p) => {
            const active = activePreset?.id === p.id;
            return (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={active ? "secondary" : "ghost"}
                aria-pressed={active}
                className={cn("h-7 rounded-full px-2.5 text-[11px]", active && "font-semibold")}
                onClick={() => onChange(p.range())}
              >
                {p.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
