import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Users, ArrowUpRight, ArrowDownLeft, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { OSShell } from "./OSShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * Recruiting-facing Apploi page: applicants only (job postings are retired)
 * plus the outbound status push-back queue, so recruiters can see exactly
 * what flows in from Apploi and what is waiting to flow back.
 */

interface QueueRow {
  id: string;
  external_candidate_id: string;
  from_stage: string | null;
  to_stage: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
}

const STATUS_TONE: Record<string, string> = {
  sent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  blocked_scope: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  skipped: "bg-muted text-muted-foreground border-border",
};

export default function OSRecruitingApploi() {
  const qc = useQueryClient();

  const applicants = useQuery({
    queryKey: ["apploi-applicants"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("integration_normalized_records")
        .select("id", { count: "exact", head: true })
        .eq("provider", "apploi")
        .eq("record_kind", "candidate");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const queue = useQuery({
    queryKey: ["apploi-outbound-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apploi_outbound_status_queue")
        .select("id, external_candidate_id, from_stage, to_stage, status, attempts, last_error, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as QueueRow[];
    },
  });

  const counts = useMemo(() => {
    const rows = queue.data ?? [];
    return {
      total: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      blocked: rows.filter((r) => r.status === "blocked_scope").length,
      sent: rows.filter((r) => r.status === "sent").length,
      failed: rows.filter((r) => r.status === "failed").length,
    };
  }, [queue.data]);

  async function runPush() {
    const { data, error } = await supabase.functions.invoke("apploi-status-push");
    if (error) {
      toast.error("Could not run the Apploi push-back right now.");
      return;
    }
    const res = data as { sent?: number; blocked?: number; failed?: number } | null;
    toast.success(
      `Push-back run complete — ${res?.sent ?? 0} sent, ${res?.blocked ?? 0} waiting on Apploi write access, ${res?.failed ?? 0} failed.`,
    );
    void qc.invalidateQueries({ queryKey: ["apploi-outbound-queue"] });
  }

  return (
    <OSShell>
      <div className="space-y-6 p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Apploi</h1>
            <p className="text-sm text-muted-foreground">
              Applicants sync into Blossom OS, and candidate stage changes queue back to Apploi.
            </p>
          </div>
          <Button variant="outline" onClick={runPush}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run push-back now
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ArrowDownLeft className="h-4 w-4" /> Applicants synced in
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{applicants.data ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ArrowUpRight className="h-4 w-4" /> Stage changes sent back
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{counts.sent}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" /> Waiting on Apploi access
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{counts.pending + counts.blocked}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="h-4 w-4" /> Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{counts.failed}</CardContent>
          </Card>
        </div>

        {applicants.data === 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex gap-3 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>
                Apploi is connected and authenticated, but the partner API key currently returns no applicant
                records for this team. Applicants will appear here automatically once Apploi grants applicant
                read access to the key — nothing else needs to change on our side.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Outbound status queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {queue.isLoading && <p className="text-sm text-muted-foreground">Loading queue…</p>}
            {!queue.isLoading && counts.total === 0 && (
              <p className="text-sm text-muted-foreground">
                No candidate stage changes queued yet. Every stage change on an Apploi-sourced candidate is
                recorded here with a full audit trail.
              </p>
            )}
            {(queue.data ?? []).map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {row.from_stage ?? "—"} → {row.to_stage}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Apploi applicant {row.external_candidate_id} ·{" "}
                    {new Date(row.created_at).toLocaleString()}
                    {row.last_error ? ` · ${row.last_error}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className={STATUS_TONE[row.status] ?? ""}>
                  {row.status === "sent" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                  {row.status === "blocked_scope" ? "waiting on access" : row.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </OSShell>
  );
}
