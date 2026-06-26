import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// Shared, cross-page Intake state filter. Set on the Intake Dashboard
// (or any intake page) and every other intake page reads/updates the
// same value via localStorage + a window event so changes propagate
// instantly without a reload.
export const INTAKE_SUPPORTED_STATES = ["GA", "TN", "MD", "NC", "VA"] as const;
export type IntakeStateFilter = "ALL" | (typeof INTAKE_SUPPORTED_STATES)[number];
const STORAGE_KEY = "intake.dashboard.stateFilter";
const EVENT = "intake:state-filter-changed";

export function normalizeIntakeState(raw?: string | null): string {
  if (!raw) return "";
  const s = raw.trim().toUpperCase();
  const map: Record<string, string> = {
    GEORGIA: "GA", TENNESSEE: "TN", MARYLAND: "MD",
    "NORTH CAROLINA": "NC", VIRGINIA: "VA",
  };
  return map[s] ?? s;
}

function readStored(): IntakeStateFilter {
  if (typeof window === "undefined") return "ALL";
  const v = window.localStorage.getItem(STORAGE_KEY) as IntakeStateFilter | null;
  return v && (v === "ALL" || (INTAKE_SUPPORTED_STATES as readonly string[]).includes(v)) ? v : "ALL";
}

export function useIntakeStateFilter() {
  const [stateFilter, setStateFilter] = useState<IntakeStateFilter>(readStored);

  useEffect(() => {
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<IntakeStateFilter>).detail ?? readStored();
      setStateFilter(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setStateFilter(readStored());
    };
    window.addEventListener(EVENT, onChange as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setFilter = useCallback((next: IntakeStateFilter) => {
    setStateFilter(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch {}
    try { window.dispatchEvent(new CustomEvent(EVENT, { detail: next })); } catch {}
  }, []);

  const matches = useCallback(
    (state?: string | null) => stateFilter === "ALL" || normalizeIntakeState(state) === stateFilter,
    [stateFilter],
  );

  return { stateFilter, setStateFilter: setFilter, matches };
}

export function IntakeStateFilterToggle({
  className,
}: { className?: string }) {
  const { stateFilter, setStateFilter } = useIntakeStateFilter();
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border border-border/70 bg-card/60 p-0.5 shadow-sm",
      className,
    )}>
      {(["ALL", ...INTAKE_SUPPORTED_STATES] as const).map((s) => {
        const active = stateFilter === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => setStateFilter(s)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-full transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
            aria-pressed={active}
            title={s === "ALL" ? "Show all states" : `Filter to ${s}`}
          >
            {s === "ALL" ? "All States" : s}
          </button>
        );
      })}
    </div>
  );
}