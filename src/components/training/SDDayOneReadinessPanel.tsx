/**
 * SD Day-One Readiness — learner-facing compact panel.
 *
 * Display-only progress signals saved locally (this device) so a new State
 * Director can mark the small first-day signals as they happen. Not yet
 * synced to the backend — the panel says so honestly.
 */
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Compass, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SD_DAY_ONE_ITEMS,
  loadSdDayOneState,
  saveSdDayOneState,
  type SdDayOneItemId,
} from "@/lib/training/sdDayOneReadiness";

interface Props {
  welcomeReviewedFromAcademy?: boolean;
}

export function SDDayOneReadinessPanel({ welcomeReviewedFromAcademy }: Props) {
  const [state, setState] = useState<Record<SdDayOneItemId, boolean>>(() =>
    loadSdDayOneState(),
  );

  useEffect(() => {
    // Mirror the academy welcome signal into local state if it's already known.
    if (welcomeReviewedFromAcademy && !state["welcome-reviewed"]) {
      const next = { ...state, "welcome-reviewed": true };
      setState(next);
      saveSdDayOneState(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeReviewedFromAcademy]);

  const toggle = (id: SdDayOneItemId) => {
    const next = { ...state, [id]: !state[id] };
    setState(next);
    saveSdDayOneState(next);
  };

  const doneCount = SD_DAY_ONE_ITEMS.filter((i) => state[i.id]).length;

  return (
    <section
      data-testid="sd-day-one-readiness-panel"
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Compass className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Day-One readiness
            </p>
            <h3 className="mt-0.5 text-[15px] font-semibold tracking-tight text-foreground">
              Six small signals you had a real first day
            </h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              Tick these as they happen. Bring the ones in your own words to your first mentor check-in.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {doneCount}/{SD_DAY_ONE_ITEMS.length}
        </span>
      </header>

      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {SD_DAY_ONE_ITEMS.map((item) => {
          const done = state[item.id];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                data-testid={`sd-day-one-item-${item.id}`}
                aria-pressed={done}
                className={cn(
                  "w-full rounded-2xl border bg-background/60 px-3 py-2.5 text-left transition-colors",
                  done
                    ? "border-emerald-200/70 bg-emerald-50/40 dark:bg-emerald-950/10"
                    : "border-border/60 hover:bg-muted/40",
                )}
              >
                <div className="flex items-start gap-2">
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-snug text-foreground">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                      {item.helper}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        data-testid="sd-day-one-local-only"
        className="mt-4 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-[11.5px] text-muted-foreground"
      >
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Saved on this device for now. Backend sync for day-one signals is on the roadmap — for the
          moment, mention what you marked in your first mentor check-in.
        </span>
      </div>
    </section>
  );
}
