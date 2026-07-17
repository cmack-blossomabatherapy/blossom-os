import { supabase } from "@/integrations/supabase/client";
import { parseAnyFile } from "@/lib/os/dashboardEngine/excelParser";

export type CrSyncTypeKey = "employees" | "clients" | "schedule" | "timesheets" | "authorizations";

export interface CrTemplate {
  id: string;
  type_key: CrSyncTypeKey;
  name: string;
  description: string | null;
  column_map: Record<string, string>;
  required_fields: string[];
  field_types: Record<string, string>;
  recognition_headers: string[];
  is_default: boolean;
  active: boolean;
}

export interface CrSyncType {
  key: CrSyncTypeKey;
  label: string;
  description: string | null;
  external_id_field: string;
  required_fields: string[];
}

export interface CrValidationError {
  row_number: number;
  external_id: string | null;
  field: string | null;
  error_code: string;
  error_message: string;
  raw_row: Record<string, unknown>;
}

export interface CrPreview {
  headers: string[];
  mapped_headers: string[];
  total_rows: number;
  valid_rows: number;
  rejected_rows: number;
  duplicate_rows: number;
  add_count: number;
  update_count: number;
  unchanged_count: number;
  sample: Record<string, unknown>[];
  errors: CrValidationError[];
  mapped_rows: Array<{ external_id: string; payload: Record<string, unknown> }>;
}

// ---------- Fingerprint (SHA-256 hex) ----------
export async function fileFingerprint(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ---------- Header normalization ----------
const norm = (s: string) => s.trim().toLowerCase().replace(/[_\s\-]+/g, " ");

export function recognizeTemplate(headers: string[], templates: CrTemplate[]): CrTemplate | null {
  const normalized = headers.map(norm);
  let best: { t: CrTemplate; score: number } | null = null;
  for (const t of templates) {
    if (!t.active) continue;
    const sig = t.recognition_headers.map(norm);
    if (sig.length === 0) continue;
    const hits = sig.filter(s => normalized.some(h => h.includes(s))).length;
    const score = hits / sig.length;
    if (score >= 0.6 && (!best || score > best.score)) best = { t, score };
  }
  return best?.t ?? null;
}

// Build a case-insensitive header→canonical field lookup from a template.
function buildFieldResolver(template: CrTemplate) {
  const map = new Map<string, string>();
  for (const [k, v] of Object.entries(template.column_map)) map.set(norm(k), v);
  return (header: string) => map.get(norm(header)) ?? null;
}

// ---------- Type validators ----------
function validateValue(value: unknown, type: string): { ok: boolean; normalized?: unknown; error?: string } {
  const s = value == null ? "" : String(value).trim();
  if (s === "") return { ok: true, normalized: null };
  switch (type) {
    case "string": return { ok: true, normalized: s };
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
        ? { ok: true, normalized: s }
        : { ok: false, error: `Invalid email "${s}"` };
    case "number": {
      const n = Number(s.replace(/,/g, ""));
      return Number.isFinite(n) ? { ok: true, normalized: n } : { ok: false, error: `Not a number: "${s}"` };
    }
    case "date": {
      const d = new Date(s);
      return isFinite(d.getTime()) ? { ok: true, normalized: d.toISOString().slice(0, 10) } : { ok: false, error: `Invalid date "${s}"` };
    }
    case "datetime": {
      const d = new Date(s);
      return isFinite(d.getTime()) ? { ok: true, normalized: d.toISOString() } : { ok: false, error: `Invalid datetime "${s}"` };
    }
    default: return { ok: true, normalized: s };
  }
}

// ---------- Preview (client-side; no DB writes) ----------
export async function buildPreview(
  file: File,
  type: CrSyncType,
  template: CrTemplate,
  existingIds: Set<string>,
): Promise<CrPreview> {
  const parts = await parseAnyFile(file);
  const parsed = parts[0]; // only first sheet for CR exports
  const resolve = buildFieldResolver(template);

  const mappedHeaders = parsed.headers.map(h => resolve(h) ?? "").filter(Boolean);
  const errors: CrValidationError[] = [];
  const seen = new Set<string>();
  const requiredAll = Array.from(new Set([...(type.required_fields ?? []), ...(template.required_fields ?? [])]));
  const mapped: Array<{ external_id: string; payload: Record<string, unknown> }> = [];
  let addCount = 0, updateCount = 0, duplicateCount = 0;

  parsed.rows.forEach((raw, i) => {
    const rowNum = i + 2; // account for header row in humans
    const payload: Record<string, unknown> = {};
    let rowErrors = 0;

    // Map + type-validate
    for (const header of parsed.headers) {
      const field = resolve(header);
      if (!field) continue;
      const type = template.field_types?.[field] ?? "string";
      const v = validateValue(raw[header], type);
      if (!v.ok) {
        errors.push({ row_number: rowNum, external_id: null, field, error_code: "TYPE", error_message: v.error!, raw_row: raw });
        rowErrors++;
        continue;
      }
      payload[field] = v.normalized;
    }

    // Required fields
    for (const req of requiredAll) {
      if (payload[req] == null || payload[req] === "") {
        errors.push({ row_number: rowNum, external_id: (payload[type.external_id_field] as string) ?? null, field: req, error_code: "REQUIRED", error_message: `Missing required "${req}"`, raw_row: raw });
        rowErrors++;
      }
    }

    const externalId = payload[type.external_id_field] as string | undefined;
    if (!externalId) {
      if (rowErrors === 0) errors.push({ row_number: rowNum, external_id: null, field: type.external_id_field, error_code: "NO_EXTERNAL_ID", error_message: `Missing ${type.external_id_field} — refusing to match by name`, raw_row: raw });
      return;
    }

    if (seen.has(externalId)) {
      duplicateCount++;
      errors.push({ row_number: rowNum, external_id: externalId, field: type.external_id_field, error_code: "DUPLICATE_IN_FILE", error_message: `Duplicate ${type.external_id_field} within file`, raw_row: raw });
      return;
    }
    seen.add(externalId);

    if (rowErrors > 0) return; // rejected

    if (existingIds.has(externalId)) updateCount++;
    else addCount++;
    mapped.push({ external_id: externalId, payload });
  });

  const validRows = mapped.length;
  const rejected = parsed.rows.length - validRows;

  return {
    headers: parsed.headers,
    mapped_headers: mappedHeaders,
    total_rows: parsed.rows.length,
    valid_rows: validRows,
    rejected_rows: rejected,
    duplicate_rows: duplicateCount,
    add_count: addCount,
    update_count: updateCount,
    unchanged_count: 0, // decided at commit
    sample: parsed.rows.slice(0, 8),
    errors: errors.slice(0, 500),
    mapped_rows: mapped,
  };
}

// ---------- Storage upload ----------
export async function uploadSourceFile(file: File, typeKey: CrSyncTypeKey, runId: string) {
  const path = `${typeKey}/${runId}/${file.name}`;
  const { error } = await supabase.storage.from("cr-sync-source").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function uploadErrorReport(runId: string, csv: string) {
  const path = `errors/${runId}.csv`;
  const { error } = await supabase.storage.from("cr-sync-source").upload(path, new Blob([csv], { type: "text/csv" }), { upsert: true });
  if (error) throw error;
  return path;
}

// ---------- Existing IDs (for add/update classification) ----------
export async function fetchExistingIds(typeKey: CrSyncTypeKey): Promise<Set<string>> {
  const out = new Set<string>();
  let from = 0;
  const size = 1000;
  // paginated fetch
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("cr_external_records")
      .select("external_id")
      .eq("type_key", typeKey)
      .range(from, from + size - 1);
    if (error) throw error;
    (data ?? []).forEach(r => out.add((r as { external_id: string }).external_id));
    if (!data || data.length < size) break;
    from += size;
  }
  return out;
}

// ---------- Commit ----------
export async function commitPreview(
  runId: string,
  typeKey: CrSyncTypeKey,
  mapped: Array<{ external_id: string; payload: Record<string, unknown> }>,
  onProgress?: (done: number, total: number) => void,
): Promise<{ added: number; updated: number; unchanged: number; failed: number }> {
  let added = 0, updated = 0, unchanged = 0, failed = 0;
  for (let i = 0; i < mapped.length; i++) {
    const r = mapped[i];
    const { data, error } = await supabase.rpc("cr_upsert_external_record", {
      _type_key: typeKey,
      _external_id: r.external_id,
      _payload: r.payload as unknown as never,
      _run_id: runId,
    });
    if (error) { failed++; }
    else if (data === "added") added++;
    else if (data === "updated") updated++;
    else unchanged++;
    if (onProgress && (i % 25 === 0 || i === mapped.length - 1)) onProgress(i + 1, mapped.length);
  }
  return { added, updated, unchanged, failed };
}

// ---------- Error CSV ----------
export function errorsToCsv(errors: CrValidationError[]): string {
  const header = "row,external_id,field,error_code,error_message";
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = errors.map(e => [e.row_number, e.external_id ?? "", e.field ?? "", e.error_code, e.error_message].map(esc).join(","));
  return [header, ...rows].join("\n");
}