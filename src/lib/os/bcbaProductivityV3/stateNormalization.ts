/**
 * Shared US state normalization for BCBA Productivity V3.
 *
 * Source state values from CentralReach are inconsistent:
 *   "GA", "Georgia", "georgia", "TN", "Tennessee", "NC", "VA", blank...
 *
 * normalizeUsState() collapses any recognized full-name or abbreviation
 * into a USPS two-letter code (uppercase). Unknown / blank values return "".
 *
 * resolveRowState() applies the agreed row-level column fallback for a raw
 * CentralReach billing row:
 *   ClientLocationStateProvince -> ServiceLocationStateProvince ->
 *   ClientState -> ServiceState -> State
 * It returns the first non-blank normalized value found.
 *
 * This helper does NOT touch BCBA ownership, assignment history, supervision,
 * or productivity calculations. It is a pure data-normalization utility.
 */

const US_STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC", "washington dc": "DC",
  "washington d.c.": "DC", "puerto rico": "PR",
};

const US_STATE_CODES = new Set<string>(Object.values(US_STATE_NAME_TO_CODE));

export function normalizeUsState(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (upper.length === 2 && US_STATE_CODES.has(upper)) return upper;
  const key = raw.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  if (US_STATE_NAME_TO_CODE[key]) return US_STATE_NAME_TO_CODE[key];
  // Last-chance: maybe a 2-letter code with extra whitespace/punctuation.
  const stripped = upper.replace(/[^A-Z]/g, "");
  if (stripped.length === 2 && US_STATE_CODES.has(stripped)) return stripped;
  return "";
}

export const STATE_FALLBACK_COLUMNS = [
  "ClientLocationStateProvince",
  "ServiceLocationStateProvince",
  "ClientState",
  "ServiceState",
  "State",
] as const;

/** Case-insensitive lookup for a raw column value. */
function readRawColumn(raw: Record<string, unknown> | null | undefined, col: string): unknown {
  if (!raw) return undefined;
  if (col in raw) return (raw as any)[col];
  const target = col.toLowerCase();
  for (const k of Object.keys(raw)) {
    if (k.toLowerCase() === target) return (raw as any)[k];
  }
  return undefined;
}

/**
 * Resolve a row's state using the fallback column order, returning a
 * normalized USPS two-letter code (or "" if none of the columns yield one).
 */
export function resolveRowState(raw: Record<string, unknown> | null | undefined): string {
  if (!raw) return "";
  for (const col of STATE_FALLBACK_COLUMNS) {
    const v = readRawColumn(raw, col);
    const norm = normalizeUsState(v);
    if (norm) return norm;
  }
  return "";
}