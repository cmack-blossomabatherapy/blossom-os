/**
 * Shared strict numeric parsing for report metrics.
 *
 * `Number(null)`, `Number("")`, `Number(false)` and `Number("  ")` all evaluate
 * to `0`, which turns "no value recorded" into a factual zero on an executive
 * report. Every metric that reads an optional numeric source field must use
 * {@link finiteNumberOrNull} so a missing value stays missing and a real zero
 * stays exactly zero.
 */
export function finiteNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
