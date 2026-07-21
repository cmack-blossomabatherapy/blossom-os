import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, HelpCircle, PhoneOff, RefreshCw, Bug, Layers, Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useIntakeOperatingMode } from "@/lib/intake/operatingMode";
import { formatDistanceToNow } from "date-fns";
import {
  useCanonicalPromotions,
  reprocessNormalizedRecord,
  type PromotionState,
} from "@/lib/intake/reviewDataLayer";
import { toast } from "sonner";

/**
 * Blossom OS — Intake Promotion Review Queues
 *
 * Admin/Intake operator surface for reviewing every canonical inbound
 * state that requires human judgment before the ingestion pipeline can
 * finish. Reads only:
 *   - public.intake_promotion_state (staged | ambiguous_review | incomplete_review | error)
 *   - public.ctm_unmatched_tracking_numbers view
 *   - public.intake_lead_source_events (provenance drilldown)
 *
 * No mutations happen here. "Retry" simply asks the server to re-run
 * the idempotent promote_normalized_record RPC against the SAME
 * normalized record — replay never duplicates.
 */
type PromotionRow = {
  id: string;
  normalized_record_id: string;
  state: string;
  reason: string | null;
  candidate_lead_ids: string[] | null;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
};

type UnmatchedTrackingRow = {
  tracking_number: string | null;
  last_seen: string | null;
  event_count: number | null;
  source_name: string | null;
};

const QUEUE_TABS = [
  { id: "staged", label: "Lead Captured (unreviewed)", icon: Layers },
  { id: "incomplete_review", label: "Incomplete promotion", icon: HelpCircle },
  { id: "ambiguous_review", label: "Ambiguous duplicate", icon: AlertTriangle },
  { id: "error", label: "Ingestion error", icon: Bug },
  { id: "ctm_unmatched", label: "Unmatched CTM tracking #", icon: PhoneOff },
] as const;
type QueueId = (typeof QUEUE_TABS)[number]["id"];

export default function IntakePromotionReviewQueues() {
  const { data: mode } = useIntakeOperatingMode();
  const [tab, setTab] = useState<QueueId>("staged");
  const [filter, setFilter] = useState("");

  // All promotion queues read through the canonical review data layer.
  const promotion = useCanonicalPromotions(
    tab === "ctm_unmatched"
      ? { pageSize: 1 }
      : { state: tab as PromotionState, pageSize: 500, search: filter.trim() || undefined },
  );

  const unmatched = useQuery({
    queryKey: ["ctm-unmatched-tracking"],
    enabled: tab === "ctm_unmatched",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ctm_unmatched_tracking_numbers")
        .select("*")
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as UnmatchedTrackingRow[];
    },
  });

  const filteredPromotion = useMemo(
    () => (promotion.data?.rows ?? []) as unknown as PromotionRow[],
    [promotion.data],
  );

  const filteredUnmatched = useMemo(() => {
    const rows = unmatched.data ?? [];
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r) =>
      [r.tracking_number, r.source_name].some((v) => (v ?? "").toString().toLowerCase().includes(q)),
    );
  }, [unmatched.data, filter]);

  const retry = async (recordId: string) => {
    try {
      const res = await reprocessNormalizedRecord(recordId);
      toast.success(
        `Retry ${res.status}${res.leadId ? ` → lead ${res.leadId.slice(0, 8)}…` : ""}`,
      );
      await promotion.refetch();
    } catch (e) {
      toast.error(`Retry failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="p-6 space-y-6" data-page="intake-review-queues">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Intake review queues</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every inbound record awaiting an operator decision — Lead
            Captured backlog, ambiguous duplicates, incomplete data,
            ingestion errors and unmatched CTM tracking numbers. All
            data is read directly from canonical tables and views; no
            mock or seeded records.
          </p>
        </div>
        {mode?.mode === "INGEST_ONLY" && (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
            Preview only — Intake actions are not enabled
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {QUEUE_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              tab === id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by reason / id / tracking #"
            className="h-8 w-64"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => (tab === "ctm_unmatched" ? unmatched.refetch() : promotion.refetch())}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        {tab === "ctm_unmatched" ? (
          <UnmatchedTable
            loading={unmatched.isLoading}
            error={unmatched.error as Error | null}
            rows={filteredUnmatched}
          />
        ) : (
          <PromotionTable
            loading={promotion.isLoading}
            error={promotion.error as Error | null}
            rows={filteredPromotion}
            tab={tab}
            onRetry={retry}
          />
        )}
      </Card>
    </div>
  );
}

function EmptyOrError({
  loading, error, empty,
}: { loading: boolean; error: Error | null; empty: string }) {
  if (loading) return <div className="text-sm text-muted-foreground p-6">Loading canonical rows…</div>;
  if (error) return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/[0.06] p-3 text-sm text-destructive">
      {error.message}
    </div>
  );
  return <div className="text-sm text-muted-foreground p-6">{empty}</div>;
}

function PromotionTable({
  loading, error, rows, tab, onRetry,
}: {
  loading: boolean; error: Error | null; rows: PromotionRow[];
  tab: QueueId; onRetry: (id: string) => Promise<void>;
}) {
  if (loading || error || rows.length === 0) {
    return (
      <EmptyOrError
        loading={loading}
        error={error}
        empty={
          tab === "staged"
            ? "No Lead Captured records waiting for review."
            : tab === "ambiguous_review"
              ? "No ambiguous duplicates in the queue."
              : tab === "incomplete_review"
                ? "No incomplete promotions."
                : "No ingestion errors."
        }
      />
    );
  }
  return (
    <div className="divide-y">
      {rows.map((r) => (
        <div key={r.id} className="py-3 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {r.reason ?? "(no reason)"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              normalized_record_id · <code>{r.normalized_record_id}</code>
              {r.lead_id ? <> · lead_id · <code>{r.lead_id}</code></> : null}
              {r.candidate_lead_ids && r.candidate_lead_ids.length > 1 ? (
                <> · {r.candidate_lead_ids.length} candidate(s)</>
              ) : null}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              updated {formatDistanceToNow(new Date(r.updated_at), { addSuffix: true })}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => onRetry(r.normalized_record_id)}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry (idempotent)
          </Button>
        </div>
      ))}
    </div>
  );
}

function UnmatchedTable({
  loading, error, rows,
}: { loading: boolean; error: Error | null; rows: UnmatchedTrackingRow[] }) {
  if (loading || error || rows.length === 0) {
    return <EmptyOrError loading={loading} error={error} empty="No unmatched CTM tracking numbers." />;
  }
  return (
    <div className="divide-y">
      {rows.map((r, i) => (
        <div key={r.tracking_number ?? i} className="py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-sm font-medium">{r.tracking_number ?? "(none)"}</div>
            <div className="text-xs text-muted-foreground">
              {r.source_name ?? "unknown source"} · {r.event_count ?? 0} events
              {r.last_seen ? <> · last seen {formatDistanceToNow(new Date(r.last_seen), { addSuffix: true })}</> : null}
            </div>
          </div>
          <Badge variant="outline">needs mapping</Badge>
        </div>
      ))}
    </div>
  );
}