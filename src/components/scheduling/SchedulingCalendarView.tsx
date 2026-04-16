import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type AssessmentSlot } from "@/data/scheduling";
import { type SchedulingClientStatus } from "@/data/scheduling";

interface Props {
  assessments: AssessmentSlot[];
  items: SchedulingClientStatus[];
  onSelect: (clientId: string) => void;
}

type Mode = "day" | "week" | "month";

export function SchedulingCalendarView({ assessments, items, onSelect }: Props) {
  const [mode, setMode] = useState<Mode>("week");
  const [refDate] = useState(new Date(2026, 3, 20)); // Apr 20 2026 (Monday)

  // Build week days starting on Monday
  const weekStart = new Date(refDate);
  const dayOfWeek = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const fmtIso = (d: Date) => d.toISOString().slice(0, 10);

  const eventsByDay = (d: Date) => {
    const iso = fmtIso(d);
    const assessEvents = assessments
      .filter((a) => a.date === iso)
      .map((a) => ({
        id: a.id, clientId: a.clientId, label: a.clientName, time: a.time || "—", color: "info" as const,
      }));
    const sessions = items
      .filter((i) => i.client.stage === "Active")
      .flatMap((i) =>
        i.client.schedule.map((s) => ({
          id: `${i.client.id}-${s.day}-${s.start}`,
          clientId: i.client.id,
          label: i.client.childName,
          time: `${s.start}-${s.end}`,
          day: s.day,
          color: "success" as const,
        })),
      )
      .filter((s) => {
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
        return s.day === dayName;
      });
    return [...assessEvents, ...sessions];
  };

  return (
    <div className="bg-card rounded-xl border border-border/60 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold text-foreground">
            {weekStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          {(["day", "week", "month"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2.5 h-7 text-xs font-medium rounded capitalize transition-colors",
                mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((d) => {
          const events = eventsByDay(d);
          const isToday = fmtIso(d) === fmtIso(new Date(2026, 3, 20));
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "min-h-[180px] rounded-lg border p-2 space-y-1.5",
                isToday ? "border-primary/40 bg-primary/5" : "border-border/40 bg-background",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className={cn("text-sm font-semibold", isToday ? "text-primary" : "text-foreground")}>
                  {d.getDate()}
                </span>
              </div>
              {events.length === 0 && <p className="text-[10px] text-muted-foreground italic">—</p>}
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onSelect(e.clientId)}
                  className={cn(
                    "w-full text-left p-1.5 rounded text-[11px] leading-tight border transition-colors",
                    e.color === "info"
                      ? "bg-info/10 border-info/30 text-info hover:bg-info/15"
                      : "bg-success/10 border-success/30 text-success hover:bg-success/15",
                  )}
                >
                  <p className="font-medium truncate">{e.label}</p>
                  <p className="opacity-80">{e.time}</p>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-info" /> Assessment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-success" /> Active session
        </span>
      </div>
    </div>
  );
}
