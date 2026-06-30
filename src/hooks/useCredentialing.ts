import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CredProviderType = "BCBA" | "RBT" | "Clinical Director" | "Other";
export type CredStatus =
  | "Not Started" | "Gathering Docs" | "Missing Info" | "Ready to Submit"
  | "Submitted" | "Payer Follow-Up" | "Approved" | "Effective"
  | "Expiring" | "Renewal In Progress" | "Denied" | "Blocked" | "Inactive";
export type CredType = "Initial" | "Recredentialing" | "Add State" | "Add Payer" | "Renewal";
export type CredPriority = "Low" | "Normal" | "High" | "Urgent";
export type CrSyncStatus = "Not Connected" | "Ready To Sync" | "Synced" | "Sync Error";

export const CRED_STATUSES: CredStatus[] = [
  "Not Started","Gathering Docs","Missing Info","Ready to Submit","Submitted",
  "Payer Follow-Up","Approved","Effective","Expiring","Renewal In Progress",
  "Denied","Blocked","Inactive",
];
export const CRED_TYPES: CredType[] = ["Initial","Recredentialing","Add State","Add Payer","Renewal"];
export const CRED_PRIORITIES: CredPriority[] = ["Low","Normal","High","Urgent"];
export const CRED_PROVIDER_TYPES: CredProviderType[] = ["BCBA","RBT","Clinical Director","Other"];
export const CRED_STATES = ["GA","NC","TN","VA","MD","NJ","SC","FL"];

export interface CredentialingProvider {
  id: string;
  employee_id: string | null;
  provider_name: string;
  provider_type: CredProviderType;
  email: string | null;
  phone: string | null;
  npi: string | null;
  caqh_id: string | null;
  license_number: string | null;
  license_state: string | null;
  license_expiration_date: string | null;
  centralreach_provider_id: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CredentialingRecord {
  id: string;
  provider_id: string;
  payer_name: string;
  state: string | null;
  plan_type: string | null;
  credentialing_type: CredType;
  status: CredStatus;
  priority: CredPriority;
  owner_id: string | null;
  owner_name: string | null;
  submitted_date: string | null;
  approved_date: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  reattestation_due_date: string | null;
  next_follow_up_date: string | null;
  last_follow_up_date: string | null;
  missing_items: string[];
  blocker_reason: string | null;
  payer_reference_number: string | null;
  source_system: string | null;
  centralreach_sync_status: CrSyncStatus;
  centralreach_external_id: string | null;
  centralreach_sync_error?: string | null;
  centralreach_last_readiness_at?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  legacy_monday_raw_id?: string | null;
}

export interface CredentialingActivity {
  id: string;
  credentialing_record_id: string | null;
  provider_id?: string | null;
  activity_type: string;
  message: string | null;
  old_status: string | null;
  new_status: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface CredentialingTask {
  id: string;
  credentialing_record_id: string | null;
  title: string;
  description: string | null;
  owner_id: string | null;
  owner_name: string | null;
  due_date: string | null;
  status: "Open" | "In Progress" | "Done" | "Blocked";
  created_at: string;
  updated_at: string;
}

export interface CredentialingDocument {
  id: string;
  provider_id: string | null;
  credentialing_record_id: string | null;
  document_type: string;
  file_name: string | null;
  storage_path: string | null;
  verification_status: "Needed" | "Received" | "Verified" | "Expired" | "Rejected";
  expiration_date: string | null;
  uploaded_by: string | null;
  created_at: string;
  notes?: string | null;
}

const TABLE_PROVIDERS = "credentialing_providers" as const;
const TABLE_RECORDS = "credentialing_records" as const;
const TABLE_ACTIVITY = "credentialing_activity" as const;
const TABLE_TASKS = "credentialing_tasks" as const;
const TABLE_DOCS = "credentialing_documents" as const;

// Use loose typing because these tables are newly added; types regen will catch up.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export function useCredentialingData() {
  const [providers, setProviders] = useState<CredentialingProvider[]>([]);
  const [records, setRecords] = useState<CredentialingRecord[]>([]);
  const [tasks, setTasks] = useState<CredentialingTask[]>([]);
  const [documents, setDocuments] = useState<CredentialingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, r, t, d] = await Promise.all([
          sb.from(TABLE_PROVIDERS).select("*").order("provider_name", { ascending: true }),
          sb.from(TABLE_RECORDS).select("*").order("updated_at", { ascending: false }),
          sb.from(TABLE_TASKS).select("*").order("due_date", { ascending: true, nullsFirst: false }),
          sb.from(TABLE_DOCS).select("*").order("created_at", { ascending: false }),
        ]);
        if (p.error) throw p.error;
        if (r.error) throw r.error;
        if (t.error) throw t.error;
        if (d.error) throw d.error;
        if (cancelled) return;
        setProviders((p.data ?? []) as CredentialingProvider[]);
        setRecords((r.data ?? []) as CredentialingRecord[]);
        setTasks((t.data ?? []) as CredentialingTask[]);
        setDocuments((d.data ?? []) as CredentialingDocument[]);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load credentialing data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const providerById = useMemo(() => {
    const m = new Map<string, CredentialingProvider>();
    providers.forEach((p) => m.set(p.id, p));
    return m;
  }, [providers]);

  return { providers, records, tasks, documents, providerById, loading, error, reload };
}

export function useCredentialingActivity(recordId: string | null) {
  const [items, setItems] = useState<CredentialingActivity[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!recordId) { setItems([]); return; }
    let cancelled = false;
    setLoading(true);
    sb.from(TABLE_ACTIVITY)
      .select("*")
      .eq("credentialing_record_id", recordId)
      .order("created_at", { ascending: false })
      .limit(100)
      .then((res: { data: CredentialingActivity[] | null; error: unknown }) => {
        if (cancelled) return;
        if (!res.error) setItems((res.data ?? []) as CredentialingActivity[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [recordId]);
  return { items, loading };
}

// ---- Mutations -------------------------------------------------------------

export async function createCredProvider(input: Partial<CredentialingProvider>) {
  const { data, error } = await sb.from(TABLE_PROVIDERS).insert(input).select("*").single();
  if (error) throw error;
  return data as CredentialingProvider;
}
export async function updateCredProvider(
  id: string,
  patch: Partial<CredentialingProvider>,
  activity?: { type: string; message: string; old?: string | null; new?: string | null },
) {
  const { data, error } = await sb.from(TABLE_PROVIDERS).update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  if (activity) {
    await sb.from(TABLE_ACTIVITY).insert({
      provider_id: id,
      credentialing_record_id: null,
      activity_type: activity.type,
      message: activity.message,
      old_status: activity.old ?? null,
      new_status: activity.new ?? null,
    });
  } else {
    // Auto-log a generic edit so provider history is always captured.
    await sb.from(TABLE_ACTIVITY).insert({
      provider_id: id,
      credentialing_record_id: null,
      activity_type: "provider_edit",
      message: `Provider updated (${Object.keys(patch).join(", ")})`,
    });
  }
  return data as CredentialingProvider;
}

export async function logCredProviderActivity(
  providerId: string,
  message: string,
  type = "note",
) {
  await sb.from(TABLE_ACTIVITY).insert({
    provider_id: providerId,
    credentialing_record_id: null,
    activity_type: type,
    message,
  });
}

export async function createCredRecord(input: Partial<CredentialingRecord>) {
  const { data, error } = await sb.from(TABLE_RECORDS).insert(input).select("*").single();
  if (error) throw error;
  return data as CredentialingRecord;
}
export type CredActivityInput =
  | string
  | {
      type: string;
      message: string;
      old?: string | null;
      new?: string | null;
    };

export async function updateCredRecord(
  id: string,
  patch: Partial<CredentialingRecord>,
  activity?: CredActivityInput,
) {
  const { data, error } = await sb.from(TABLE_RECORDS).update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  if (activity) {
    const entry =
      typeof activity === "string"
        ? { credentialing_record_id: id, activity_type: "note", message: activity }
        : {
            credentialing_record_id: id,
            activity_type: activity.type,
            message: activity.message,
            old_status: activity.old ?? null,
            new_status: activity.new ?? null,
          };
    await sb.from(TABLE_ACTIVITY).insert(entry);
  }
  return data as CredentialingRecord;
}
export async function logCredActivity(recordId: string, message: string, type = "note") {
  await sb.from(TABLE_ACTIVITY).insert({
    credentialing_record_id: recordId, activity_type: type, message,
  });
}

export async function createCredTask(input: Partial<CredentialingTask>) {
  const { data, error } = await sb.from(TABLE_TASKS).insert(input).select("*").single();
  if (error) throw error;
  if (input.credentialing_record_id) {
    await logCredActivity(input.credentialing_record_id, `Task added: ${input.title ?? "Untitled"}`, "task_added");
  }
  return data as CredentialingTask;
}

export async function updateCredTask(id: string, patch: Partial<CredentialingTask>) {
  const { data, error } = await sb.from(TABLE_TASKS).update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  if (data?.credentialing_record_id && patch.status === "Done") {
    await logCredActivity(data.credentialing_record_id, `Task completed: ${data.title}`, "task_completed");
  }
  return data as CredentialingTask;
}

export async function addCredDocument(input: Partial<CredentialingDocument>) {
  const { data, error } = await sb.from(TABLE_DOCS).insert(input).select("*").single();
  if (error) throw error;
  if (input.credentialing_record_id) {
    await logCredActivity(
      input.credentialing_record_id,
      `Document added: ${input.document_type}${input.file_name ? ` (${input.file_name})` : ""}`,
      "document_added",
    );
  }
  return data as CredentialingDocument;
}

/**
 * Upload a real file to the private `credentialing-documents` bucket and
 * create a matching credentialing_documents row pointing at the storage path.
 * Falls back gracefully — callers can still use {@link addCredDocument} for
 * metadata-only entries.
 */
export const CRED_DOC_BUCKET = "credentialing-documents";

export async function uploadCredDocumentFile(params: {
  file: File;
  document_type: string;
  provider_id: string | null;
  credentialing_record_id: string | null;
  verification_status?: CredentialingDocument["verification_status"];
  expiration_date?: string | null;
  notes?: string | null;
}): Promise<CredentialingDocument> {
  const safeName = params.file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const folder = params.credentialing_record_id ?? params.provider_id ?? "unsorted";
  const path = `${folder}/${Date.now()}-${safeName}`;
  const up = await sb.storage.from(CRED_DOC_BUCKET).upload(path, params.file, {
    cacheControl: "3600",
    upsert: false,
    contentType: params.file.type || undefined,
  });
  if (up.error) throw up.error;
  return addCredDocument({
    provider_id: params.provider_id,
    credentialing_record_id: params.credentialing_record_id,
    document_type: params.document_type,
    file_name: params.file.name,
    storage_path: path,
    verification_status: params.verification_status ?? "Received",
    expiration_date: params.expiration_date ?? null,
    notes: params.notes ?? null,
    mime_type: params.file.type || null,
    file_size_bytes: params.file.size,
  } as Partial<CredentialingDocument>);
}

export async function getCredDocumentSignedUrl(storage_path: string, expiresInSeconds = 300): Promise<string | null> {
  if (!storage_path) return null;
  const { data, error } = await sb.storage.from(CRED_DOC_BUCKET).createSignedUrl(storage_path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function updateCredDocument(id: string, patch: Partial<CredentialingDocument>) {
  const { data, error } = await sb.from(TABLE_DOCS).update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  if (data?.credentialing_record_id && patch.verification_status) {
    await logCredActivity(
      data.credentialing_record_id,
      `Document ${data.document_type} marked ${patch.verification_status}`,
      "document_status",
    );
  }
  return data as CredentialingDocument;
}

// ---- Legacy import from va_credentialing_raw ------------------------------
export interface LegacyRawRow {
  id: string;
  // raw legacy fields are flexible
  [key: string]: unknown;
}
export async function fetchLegacyRaw(limit = 500): Promise<LegacyRawRow[]> {
  const { data, error } = await sb.from("va_credentialing_raw").select("*").limit(limit);
  if (error) throw error;
  return (data ?? []) as LegacyRawRow[];
}

function pickField(row: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

export interface LegacyImportResult {
  providersCreated: number;
  recordsCreated: number;
  skipped: number;
}

export interface LegacyImportPreview {
  totalRows: number;
  alreadyImported: number;
  willCreateProviders: number;
  willCreateRecords: number;
  missingProviderOrPayer: number;
}

export async function previewLegacyImport(rows: LegacyRawRow[]): Promise<LegacyImportPreview> {
  const ids = rows.map((r) => r.id).filter(Boolean);
  const { data: existingRecs } = ids.length
    ? await sb.from(TABLE_RECORDS).select("legacy_monday_raw_id").in("legacy_monday_raw_id", ids)
    : { data: [] as Array<{ legacy_monday_raw_id: string }> };
  const importedSet = new Set<string>(
    (existingRecs ?? []).map((x: { legacy_monday_raw_id: string }) => x.legacy_monday_raw_id),
  );
  const { data: existingProvs } = await sb.from(TABLE_PROVIDERS).select("provider_name");
  const provSet = new Set<string>(
    (existingProvs ?? []).map((p: { provider_name: string }) => p.provider_name.toLowerCase()),
  );
  let alreadyImported = 0;
  let willCreateProviders = 0;
  let willCreateRecords = 0;
  let missingProviderOrPayer = 0;
  const planned = new Set<string>();
  for (const raw of rows) {
    if (importedSet.has(raw.id)) { alreadyImported += 1; continue; }
    const row = raw as Record<string, unknown>;
    const name = pickField(row, ["provider_name", "provider", "name", "bcba", "clinician"]);
    const payer = pickField(row, ["payer", "payer_name", "insurance", "plan"]);
    if (!name || !payer) { missingProviderOrPayer += 1; continue; }
    const lower = name.toLowerCase();
    if (!provSet.has(lower) && !planned.has(lower)) {
      planned.add(lower);
      willCreateProviders += 1;
    }
    willCreateRecords += 1;
  }
  return {
    totalRows: rows.length,
    alreadyImported,
    willCreateProviders,
    willCreateRecords,
    missingProviderOrPayer,
  };
}

export async function importLegacyRows(rows: LegacyRawRow[]): Promise<LegacyImportResult> {
  let providersCreated = 0;
  let recordsCreated = 0;
  let skipped = 0;

  // Cache existing providers by name (lowercased) for this run
  const { data: existing } = await sb.from(TABLE_PROVIDERS).select("id, provider_name");
  const byName = new Map<string, string>();
  (existing ?? []).forEach((p: { id: string; provider_name: string }) => {
    byName.set(p.provider_name.toLowerCase(), p.id);
  });

  // Find legacy raw ids that were already imported so we don't duplicate records.
  const ids = rows.map((r) => r.id).filter(Boolean);
  const { data: existingRecs } = ids.length
    ? await sb.from(TABLE_RECORDS).select("legacy_monday_raw_id").in("legacy_monday_raw_id", ids)
    : { data: [] as Array<{ legacy_monday_raw_id: string }> };
  const alreadyImported = new Set<string>(
    (existingRecs ?? []).map((x: { legacy_monday_raw_id: string }) => x.legacy_monday_raw_id),
  );

  for (const raw of rows) {
    if (alreadyImported.has(raw.id)) { skipped += 1; continue; }
    const row = raw as Record<string, unknown>;
    const name = pickField(row, ["provider_name", "provider", "name", "bcba", "clinician"]);
    const payer = pickField(row, ["payer", "payer_name", "insurance", "plan"]);
    if (!name || !payer) { skipped += 1; continue; }
    const state = pickField(row, ["state", "license_state"]);
    const status = pickField(row, ["status", "credentialing_status"]) ?? "Not Started";
    const notes = pickField(row, ["notes", "comments"]);

    let providerId = byName.get(name.toLowerCase());
    if (!providerId) {
      const created = await createCredProvider({
        provider_name: name,
        provider_type: "BCBA",
        active: true,
        notes: "Imported from legacy credentialing data",
      });
      providerId = created.id;
      byName.set(name.toLowerCase(), providerId);
      providersCreated += 1;
    }

    await createCredRecord({
      provider_id: providerId,
      payer_name: payer,
      state,
      status: (CRED_STATUSES as string[]).includes(status) ? (status as CredStatus) : "Not Started",
      credentialing_type: "Initial",
      priority: "Normal",
      source_system: "Legacy import",
      legacy_monday_raw_id: raw.id,
      notes,
    } as Partial<CredentialingRecord>);
    recordsCreated += 1;
  }

  return { providersCreated, recordsCreated, skipped };
}

// ---- Derived helpers -------------------------------------------------------
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86_400_000);
}

export function isExpiring(record: CredentialingRecord, windowDays = 90): boolean {
  const d = daysUntil(record.expiration_date);
  return d !== null && d <= windowDays && d >= 0;
}

export const ACTIVE_CRED_STATUSES: CredStatus[] = [
  "Gathering Docs","Missing Info","Ready to Submit","Submitted","Payer Follow-Up","Renewal In Progress",
];
export const APPROVED_CRED_STATUSES: CredStatus[] = ["Approved","Effective"];