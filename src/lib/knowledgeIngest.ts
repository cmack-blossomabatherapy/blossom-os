import { supabase } from "@/integrations/supabase/client";

export async function ingestKnowledge(body: {
  source_type: string;
  source_id?: string | null;
  source_title: string;
  source_url?: string | null;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!body.content?.trim()) return;
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return;
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch {
    // non-blocking
  }
}

export async function extractAndIngestPdf(body: {
  bucket: string;
  storage_path: string;
  source_type: string;
  source_id?: string | null;
  source_title: string;
  source_url?: string | null;
}): Promise<{ inserted?: number; error?: string }> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return { error: "Not authenticated" };
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return await resp.json();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown" };
  }
}
