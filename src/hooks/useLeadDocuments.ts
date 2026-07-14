import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeadDocumentRow {
  id: string;
  lead_id: string;
  label: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  created_at: string;
  signedUrl?: string | null;
}

const BUCKET = "lead-documents";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useLeadDocuments(leadId: string | null | undefined) {
  const [docs, setDocs] = useState<LeadDocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!leadId || !UUID_RE.test(leadId)) {
      setDocs([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("lead_documents")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setDocs([]);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as LeadDocumentRow[];
    // Sign urls (5 min)
    const signed = await Promise.all(
      rows.map(async (r) => {
        const { data: s } = await supabase.storage.from(BUCKET).createSignedUrl(r.storage_path, 300);
        return { ...r, signedUrl: s?.signedUrl ?? null };
      }),
    );
    setDocs(signed);
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const upload = useCallback(
    async (files: FileList | File[], label?: string) => {
      if (!leadId || !UUID_RE.test(leadId)) {
        throw new Error("This lead isn't synced to the database yet.");
      }
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      const displayName =
        (userRes.user?.user_metadata?.full_name as string | undefined) ||
        userRes.user?.email ||
        "Intake";
      const arr = Array.from(files);
      for (const file of arr) {
        const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
        const path = `${leadId}/${crypto.randomUUID()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("lead_documents").insert({
          lead_id: leadId,
          label: label || file.name,
          storage_path: path,
          mime_type: file.type || null,
          size_bytes: file.size,
          uploaded_by: uid,
          uploaded_by_name: displayName,
        } as never);
        if (insErr) throw insErr;
      }
      await refetch();
    },
    [leadId, refetch],
  );

  const remove = useCallback(
    async (doc: LeadDocumentRow) => {
      await supabase.storage.from(BUCKET).remove([doc.storage_path]);
      const { error: delErr } = await supabase.from("lead_documents").delete().eq("id", doc.id);
      if (delErr) throw delErr;
      await refetch();
    },
    [refetch],
  );

  return { docs, loading, error, refetch, upload, remove };
}