import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/contexts/ClientsContext";
import type { Database } from "@/integrations/supabase/types";

export type QAReviewStatus = Database["public"]["Enums"]["qa_review_status"];
export type QAReviewRow = Database["public"]["Tables"]["client_qa_reviews"]["Row"];

export type QAReviewItem = QAReviewRow & {
  clientName: string;
  clientState: string | null;
  clientStage: string | null;
  bcba: string | null;
  daysInStage: number;
};

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

export function useQAReviews() {
  const { clients } = useClients();
  const [rows, setRows] = useState<QAReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientById = useMemo(() => {
    const map = new Map<string, (typeof clients)[number]>();
    for (const c of clients) map.set(c.id, c);
    return map;
  }, [clients]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("client_qa_reviews")
      .select("*")
      .order("stage_entered_at", { ascending: true });
    if (error) setError(error.message);
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
    const channel = supabase
      .channel("client_qa_reviews_board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_qa_reviews" },
        () => { fetchRows(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRows]);

  const items: QAReviewItem[] = useMemo(
    () =>
      rows.map((r) => {
        const c = clientById.get(r.client_id);
        return {
          ...r,
          clientName: c?.childName ?? "Unknown client",
          clientState: c?.state ?? null,
          clientStage: c?.stage ?? null,
          bcba: r.assigned_bcba ?? c?.bcba ?? null,
          daysInStage: daysSince(r.stage_entered_at),
        };
      }),
    [rows, clientById],
  );

  const updateStatus = useCallback(
    async (id: string, status: QAReviewStatus, extra?: Partial<QAReviewRow>) => {
      const patch: Partial<QAReviewRow> = {
        status,
        stage_entered_at: new Date().toISOString(),
        ...extra,
      };
      if (status === "In Review" && !extra?.qa_start_date) {
        patch.qa_start_date = new Date().toISOString().slice(0, 10);
      }
      if (status === "Submitted to Auth" && !extra?.qa_completed_date) {
        patch.qa_completed_date = new Date().toISOString().slice(0, 10);
      }
      const { error } = await supabase
        .from("client_qa_reviews")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
      await fetchRows();
    },
    [fetchRows],
  );

  const assignOwner = useCallback(
    async (id: string, owner: string | null) => {
      const { error } = await supabase
        .from("client_qa_reviews")
        .update({ assigned_qa_owner: owner })
        .eq("id", id);
      if (error) throw error;
      await fetchRows();
    },
    [fetchRows],
  );

  const patchRow = useCallback(
    async (id: string, patch: Partial<QAReviewRow>) => {
      const { error } = await supabase
        .from("client_qa_reviews")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
      await fetchRows();
    },
    [fetchRows],
  );

  return { items, rows, loading, error, refresh: fetchRows, updateStatus, assignOwner, patchRow };
}