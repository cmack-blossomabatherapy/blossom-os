import { formatDistanceToNowStrict } from "date-fns";

export type Freshness = { label: string; stale: boolean; missing: boolean };

/** Compute a source-freshness label and stale flag. */
export function freshness(
  lastAt?: string | null,
  staleAfterHours = 24,
): Freshness {
  if (!lastAt) return { label: "Not updated yet", stale: true, missing: true };
  const d = new Date(lastAt);
  const ageHrs = (Date.now() - d.getTime()) / 36e5;
  return {
    label: `Updated ${formatDistanceToNowStrict(d, { addSuffix: true })}`,
    stale: ageHrs > staleAfterHours,
    missing: false,
  };
}

export function FreshnessPill({ f }: { f: Freshness }) {
  const tone = f.missing
    ? "bg-destructive/10 text-destructive"
    : f.stale
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
    : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}>
      {f.label}
    </span>
  );
}