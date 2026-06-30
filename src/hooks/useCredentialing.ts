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
  notes: string | null;
  created_at: string;
  updated_at: string;
  legacy_monday_raw_id?: string | null;
}

export interface CredentialingActivity {
  id: string;
  credentialing_record_id: string;
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
export async function updateCredProvider(id: string, patch: Partial<CredentialingProvider>) {
  const { data, error } = await sb.from(TABLE_PROVIDERS).update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as CredentialingProvider;
}

export async function createCredRecord(input: Partial<CredentialingRecord>) {
  const { data, error } = await sb.from(TABLE_RECORDS).insert(input).select("*").single();
  if (error) throw error;
  return data as CredentialingRecord;
}
export async function updateCredRecord(id: string, patch: Partial<CredentialingRecord>, actorNote?: string) {
  const { data, error } = await sb.from(TABLE_RECORDS).update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  if (actorNote) {
    await sb.from(TABLE_ACTIVITY).insert({
      credentialing_record_id: id, activity_type: "note", message: actorNote,
    });
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

  for (const raw of rows) {
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