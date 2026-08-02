/**
 * Tolerant field extraction for normalized CentralReach rows.
 *
 * Normalized `cr_*` rows are populated from operator-supplied exports, so a
 * typed column may be null while the same value is present inside the raw
 * payload columns (`raw_row`, `source_payload`, `metadata`, `data`) under a
 * differently-cased header. These helpers read the typed column first, then
 * fall back into the raw payloads so reports never blank out a value that
 * exists in the source data.
 *
 * No PHI is logged here — the helpers only read and return field values.
 */

const RAW_CONTAINERS = ["raw_row", "source_payload", "metadata", "data", "raw"] as const;

type AnyRow = Record<string, unknown> | null | undefined;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isBlank(value: unknown): boolean {
  return (
    value == null ||
    (typeof value === "string" && value.trim() === "") ||
    (typeof value === "number" && Number.isNaN(value))
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{")) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Direct (case/punctuation-insensitive) lookup on a single flat object. */
function lookupFlat(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (!isBlank(row[key])) return row[key];
  }
  const wanted = new Set(keys.map(normalizeKey));
  for (const [k, v] of Object.entries(row)) {
    if (wanted.has(normalizeKey(k)) && !isBlank(v)) return v;
  }
  return undefined;
}

/**
 * Reads the first non-blank value for `keys`, preferring typed columns and
 * falling back into the row's raw payload containers.
 */
export function pickField(row: AnyRow, keys: string[]): unknown {
  if (!row) return undefined;
  const direct = lookupFlat(row, keys);
  if (!isBlank(direct)) return direct;
  for (const container of RAW_CONTAINERS) {
    const nested = asRecord(row[container]);
    if (!nested) continue;
    const value = lookupFlat(nested, keys);
    if (!isBlank(value)) return value;
  }
  return undefined;
}

/** Tolerant string read; returns `fallback` when nothing usable is present. */
export function pickText(row: AnyRow, keys: string[], fallback = ""): string {
  const value = pickField(row, keys);
  if (isBlank(value)) return fallback;
  return String(value).trim();
}

/** Tolerant numeric read that strips currency/commas/percent signs. */
export function pickNumber(row: AnyRow, keys: string[], fallback = 0): number {
  const value = pickField(row, keys);
  if (isBlank(value)) return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const cleaned = String(value).replace(/[$,%\s]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}
