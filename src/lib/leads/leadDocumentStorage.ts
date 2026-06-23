/**
 * Lead document storage helper — uploads files into the private
 * `lead-documents` bucket and returns the stored path. Used by the New Lead
 * dialog and the Lead Detail drawer so document uploads are real (not just
 * "pending storage connection").
 */
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "lead-documents";

/** Slugify a string for safe filenames. */
function slug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export interface UploadLeadDocumentInput {
  /** Lead UUID. When unknown (e.g. brand-new lead before save) pass `"pending"`. */
  leadId: string;
  /** Document classification (e.g. "Insurance Card"). */
  type?: string;
}

export interface UploadLeadDocumentResult {
  storagePath: string;
  size: number;
  /** Time-limited URL (1 hour) — re-sign on click for production use. */
  signedUrl?: string;
}

/** Upload a single file. Resolves with the stored object path. */
export async function uploadLeadDocument(
  file: File,
  { leadId, type }: UploadLeadDocumentInput,
): Promise<UploadLeadDocumentResult> {
  const stamp = Date.now();
  const folder = `${slug(leadId) || "pending"}/${slug(type ?? "uncategorized")}`;
  const path = `${folder}/${stamp}-${slug(file.name) || "file"}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) {
    throw new Error(error.message);
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);

  return { storagePath: path, size: file.size, signedUrl: signed?.signedUrl };
}

/** Generate a fresh signed URL for an already-stored object. */
export async function getLeadDocumentSignedUrl(
  storagePath: string,
  ttlSeconds = 60 * 60,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, ttlSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export const LEAD_DOCUMENTS_BUCKET = BUCKET;