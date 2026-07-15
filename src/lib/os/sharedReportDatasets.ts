/**
 * Shared Report Datasets — admin-fed CSV/XLSX exports that power the
 * Authorization and Cancellation dashboards company-wide.
 *
 * Admins upload one file per report key. Every authenticated user then
 * automatically sees that file's data in the matching Reports page.
 */
import { supabase } from "@/integrations/supabase/client";

export type SharedReportKey =
  | "authorization"
  | "cancellation-scheduling"
  | "cancellation-billing"
  | "cancellation-authorization";

export const SHARED_REPORT_LABELS: Record<SharedReportKey, string> = {
  "authorization": "Authorization export (Analysis + Hour-Based Utilization)",
  "cancellation-scheduling": "Cancellation — Scheduling export (required)",
  "cancellation-billing": "Cancellation — Billing export",
  "cancellation-authorization": "Cancellation — Authorization export",
};

export interface SharedReportDataset {
  id: string;
  reportKey: SharedReportKey;
  storagePath: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  notes: string | null;
  uploadedBy: string | null;
  uploadedAt: string;
  isActive: boolean;
}

const BUCKET = "data-uploads";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): SharedReportDataset {
  return {
    id: r.id,
    reportKey: r.report_key,
    storagePath: r.storage_path,
    fileName: r.file_name,
    fileSize: r.file_size ?? null,
    mimeType: r.mime_type ?? null,
    notes: r.notes ?? null,
    uploadedBy: r.uploaded_by ?? null,
    uploadedAt: r.uploaded_at,
    isActive: !!r.is_active,
  };
}

export async function listSharedReportDatasets(
  key: SharedReportKey,
): Promise<SharedReportDataset[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("shared_report_datasets")
    .select("*")
    .eq("report_key", key)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map(mapRow as any);
}

export async function getActiveSharedReportDataset(
  key: SharedReportKey,
): Promise<SharedReportDataset | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("shared_report_datasets")
    .select("*")
    .eq("report_key", key)
    .eq("is_active", true)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function uploadSharedReportDataset(
  key: SharedReportKey,
  file: File,
  notes?: string,
): Promise<SharedReportDataset> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id ?? null;
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const storagePath = `shared-report-datasets/${key}/${Date.now()}-${safeName}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) throw upErr;
  // Deactivate previous active rows for this key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("shared_report_datasets")
    .update({ is_active: false })
    .eq("report_key", key)
    .eq("is_active", true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("shared_report_datasets")
    .insert({
      report_key: key,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      notes: notes || null,
      uploaded_by: userId,
      is_active: true,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteSharedReportDataset(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("shared_report_datasets")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (existing?.storage_path) {
    await supabase.storage.from(BUCKET).remove([existing.storage_path]);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("shared_report_datasets")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function downloadSharedReportDatasetFile(
  dataset: SharedReportDataset,
): Promise<File> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(dataset.storagePath);
  if (error || !data) throw error ?? new Error("Missing dataset file");
  return new File([data], dataset.fileName, {
    type: dataset.mimeType || "application/octet-stream",
  });
}
