import type { ParsedFile } from "./types";

/**
 * Robust CSV parser. Handles:
 *  - quoted fields with embedded commas / newlines
 *  - escaped quotes ("")
 *  - CRLF and LF line endings
 *  - trailing whitespace and BOM
 * Returns rows as objects keyed by header. Empty headers are skipped.
 */
export function parseCSVText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const out: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { cur.push(field); field = ""; continue; }
    if (ch === "\n" || ch === "\r") {
      if (field.length || cur.length) { cur.push(field); out.push(cur); cur = []; field = ""; }
      if (ch === "\r" && text[i + 1] === "\n") i++;
      continue;
    }
    field += ch;
  }
  if (field.length || cur.length) { cur.push(field); out.push(cur); }

  if (!out.length) return { headers: [], rows: [] };
  const rawHeaders = out[0].map(h => h.trim());
  // De-duplicate empty headers
  const headers = rawHeaders.map((h, i) => h || `column_${i + 1}`);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < out.length; i++) {
    const r = out[i];
    // Skip fully empty rows
    if (r.every(c => !c || !c.trim())) continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (r[c] ?? "").trim();
    }
    rows.push(obj);
  }
  return { headers, rows };
}

/** Try to parse a value as a date; return ISO yyyy-mm-dd or null. */
export function parseDateValue(v: string | undefined | null): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  // Common ISO / US / EU formats
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    // Guard against obvious junk like "1" being parsed
    if (d.getFullYear() > 1900 && d.getFullYear() < 2200) {
      return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

/** Find a date range across rows by trying any column that looks date-like. */
export function detectDateRange(rows: Record<string, string>[], headers: string[]): { min: string; max: string } | null {
  const dateLike = headers.filter(h => /date|dos|service|appointment|session/i.test(h));
  const candidates = dateLike.length ? dateLike : headers;
  let min: string | null = null, max: string | null = null;
  for (const r of rows) {
    for (const h of candidates) {
      const iso = parseDateValue(r[h]);
      if (iso) {
        if (!min || iso < min) min = iso;
        if (!max || iso > max) max = iso;
        break;
      }
    }
  }
  return min && max ? { min, max } : null;
}

export async function parseCSVFile(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const { headers, rows } = parseCSVText(text);
  const dateRange = detectDateRange(rows, headers);
  return {
    fileName: file.name,
    headers,
    rows,
    rowCount: rows.length,
    dateRange,
  };
}

/** Parse a numeric value, tolerant of currency / commas / blank. Returns 0 on failure. */
export function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const s = String(v).replace(/[$,\s]/g, "").trim();
  if (!s) return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}