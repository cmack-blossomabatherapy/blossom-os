import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { OSShell } from "@/pages/os/OSShell";
import { useOSRole } from "@/contexts/OSRoleContext";
import { supabase } from "@/integrations/supabase/client";
import { BlossomAIIngestPanel } from "@/components/resource-library/BlossomAIIngestPanel";
import { BlossomAIButton } from "@/components/ai/BlossomAIAssistant";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Database, FileWarning, ShieldAlert, Video, RefreshCw, AlertTriangle, MessageSquare, ShieldOff, ThumbsUp, ThumbsDown, Zap } from "lucide-react";
import { toast } from "sonner";

interface HealthMetrics {
  totalResources: number;
  ingested: number;
  pending: number;
  failed: number;
  missingFile: number;
  unsupportedType: number;
  transcriptMissing: number;
  restrictedAdminOnly: number;
  totalChunks: number;
  distinctResourcesIndexed: number;
  feedbackCount: number;
  accessDenials: number;
}

async function loadMetrics(): Promise<HealthMetrics> {
  const hr = () => supabase.from("hr_resources").select("*", { count: "exact", head: true });
  const [
    total, ingested, pending, failed, missing, unsupported, transcriptMissing, restricted, chunks,
  ] = await Promise.all([
    hr(),
    hr().eq("ingest_status", "ingested"),
    hr().eq("ingest_status", "pending"),
    hr().eq("ingest_status", "error"),
    hr().in("ingest_status", ["no_file", "missing_file"]),
    hr().eq("ingest_status", "unsupported_type"),
    hr().eq("ingest_status", "transcript_missing"),
    hr().eq("visibility_level", "admin_only"),
    supabase.from("knowledge_chunks").select("*", { count: "exact", head: true }),
  ]);

  const distinct = await supabase
    .from("knowledge_chunks")
    .select("resource_id", { count: "exact", head: false })
    .not("resource_id", "is", null);

  const distinctSet = new Set((distinct.data ?? []).map((r) => (r as { resource_id: string | null }).resource_id));

  return {
    totalResources: total.count ?? 0,
    ingested: ingested.count ?? 0,
    pending: pending.count ?? 0,
    failed: failed.count ?? 0,
    missingFile: missing.count ?? 0,
    unsupportedType: unsupported.count ?? 0,
    transcriptMissing: transcriptMissing.count ?? 0,
    restrictedAdminOnly: restricted.count ?? 0,
    totalChunks: chunks.count ?? 0,
    distinctResourcesIndexed: distinctSet.size,
    feedbackCount: 0,
    accessDenials: 0,
  };
}

function Tile({
  icon: Icon, label, value, tone = "neutral", hint,
}: {
  icon: typeof Sparkles;
  label: string;
  value: number | string;
  tone?: "neutral" | "good" | "warn" | "bad";
  hint?: string;
}) {
  const toneClass = {
    neutral: "text-foreground",
    good: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    bad: "text-rose-600 dark:text-rose-400",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground/70" />
      </div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

export default function OSBlossomAIManagement() {
  const { role } = useOSRole();
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedRows, setFailedRows] = useState<Array<{ id: string; title: string; ingest_error: string | null; storage_bucket: string | null }>>([]);
  const [recentAudit, setRecentAudit] = useState<Array<{
    id: string; created_at: string; user_email: string | null; role: string | null;
    prompt: string; response_preview: string | null; status: string; kb_hits: unknown;
  }>>([]);
  const [feedbackRows, setFeedbackRows] = useState<Array<{ id: string; rating: number; note: string | null; message_id: string | null; created_at: string }>>([]);
  const [nullEmbeddings, setNullEmbeddings] = useState<number | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState<{ processed: number; remaining: number } | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const m = await loadMetrics();
      setMetrics(m);
      const [failed, audit, feedback] = await Promise.all([
        supabase.from("hr_resources").select("id, title, ingest_error, storage_bucket")
          .eq("ingest_status", "error").order("updated_at", { ascending: false }).limit(15),
        supabase.from("ai_audit_log")
          .select("id, created_at, user_email, role, prompt, response_preview, status, kb_hits")
          .order("created_at", { ascending: false }).limit(30),
        supabase.from("ai_message_feedback")
          .select("id, rating, note, message_id, created_at")
          .order("created_at", { ascending: false }).limit(20),
      ]);
      setFailedRows((failed.data ?? []) as typeof failedRows);
      setRecentAudit((audit.data ?? []) as typeof recentAudit);
      setFeedbackRows((feedback.data ?? []) as typeof feedbackRows);
      const { count: nullCount } = await supabase
        .from("knowledge_chunks")
        .select("id", { count: "exact", head: true })
        .is("embedding", null);
      setNullEmbeddings(nullCount ?? 0);
    } finally {
      setLoading(false);
    }
  };

  const runBackfill = async () => {
    if (backfilling) return;
    setBackfilling(true);
    setBackfillProgress(null);
    let totalProcessed = 0;
    try {
      // Loop calls to the edge function until remaining hits 0 or an error stops us.
      // Each call embeds up to 96 chunks.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase.functions.invoke<{ processed: number; remaining: number; done: boolean; error?: string }>(
          "blossom-ai-embed-backfill",
          { body: { limit: 96 } },
        );
        if (error) throw error;
        if (!data || data.error) throw new Error(data?.error || "Backfill failed");
        totalProcessed += data.processed;
        setBackfillProgress({ processed: totalProcessed, remaining: data.remaining });
        if (data.done || data.processed === 0) break;
      }
      toast.success(`Embedded ${totalProcessed.toLocaleString()} chunks. Blossom AI can now answer from Resource Library.`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backfill failed — check function logs.");
    } finally {
      setBackfilling(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  if (role !== "super_admin" && role !== "systems_admin") {
    return <Navigate to="/" replace />;
  }

  const m = metrics;

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/60 bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-purple-700 dark:from-purple-950/30 dark:to-indigo-950/30 dark:text-purple-200 dark:border-purple-900/40">
              <Sparkles className="h-3 w-3" /> Blossom AI · Super Admin
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Blossom AI Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Knowledge index health, ingestion status, restricted resources, feedback, and safety signals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs hover:bg-muted/60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <BlossomAIButton
              surface="global"
              title="Test Blossom AI"
              hint="Ask anything — you're in super_admin, so results include every resource."
              label="Test AI"
            />
          </div>
        </header>

        {/* Embedding backfill banner — surfaces the #1 cause of "AI answers nothing". */}
        {nullEmbeddings !== null && nullEmbeddings > 0 && (
          <Card className="border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                  <Zap className="h-4 w-4" /> {nullEmbeddings.toLocaleString()} chunks missing embeddings
                </div>
                <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
                  Blossom AI can't retrieve from the Resource Library until these are embedded. This is safe to run — it only fills the empty vector column.
                </p>
                {backfillProgress && (
                  <p className="mt-1 text-xs font-medium text-amber-900 dark:text-amber-200">
                    Progress: {backfillProgress.processed.toLocaleString()} processed · {backfillProgress.remaining.toLocaleString()} remaining
                  </p>
                )}
              </div>
              <button
                onClick={runBackfill}
                disabled={backfilling}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 py-1.5 text-xs font-medium shadow-sm"
              >
                {backfilling ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                {backfilling ? "Backfilling…" : "Run embedding backfill"}
              </button>
            </div>
          </Card>
        )}
        {nullEmbeddings === 0 && (
          <Card className="border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-200">
            ✓ All knowledge chunks are embedded. Blossom AI can retrieve from the Resource Library.
          </Card>
        )}

        {loading && !m ? (
          <div className="text-sm text-muted-foreground">Loading metrics…</div>
        ) : m ? (
          <>
            {/* Index health */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Knowledge index</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Tile icon={Database} label="Total resources" value={m.totalResources.toLocaleString()} />
                <Tile icon={Sparkles} label="Indexed" value={m.ingested.toLocaleString()} tone="good"
                  hint={`${m.distinctResourcesIndexed.toLocaleString()} distinct in vector store`} />
                <Tile icon={RefreshCw} label="Pending" value={m.pending.toLocaleString()}
                  tone={m.pending > 0 ? "warn" : "good"} />
                <Tile icon={AlertTriangle} label="Failed" value={m.failed.toLocaleString()}
                  tone={m.failed > 0 ? "bad" : "good"} />
                <Tile icon={FileWarning} label="Missing text extraction" value={m.unsupportedType.toLocaleString()}
                  tone={m.unsupportedType > 0 ? "warn" : "good"}
                  hint="DOCX/XLSX not yet supported" />
                <Tile icon={Video} label="Missing video transcripts" value={m.transcriptMissing.toLocaleString()}
                  tone={m.transcriptMissing > 0 ? "warn" : "good"} />
                <Tile icon={FileWarning} label="Missing file" value={m.missingFile.toLocaleString()}
                  tone={m.missingFile > 0 ? "warn" : "good"} />
                <Tile icon={ShieldAlert} label="Admin-only resources" value={m.restrictedAdminOnly.toLocaleString()}
                  hint="Excluded from non-admin AI answers" />
                <Tile icon={Database} label="Vector chunks" value={m.totalChunks.toLocaleString()} />
                <Tile icon={MessageSquare} label="Feedback events" value={m.feedbackCount.toLocaleString()} />
                <Tile icon={ShieldOff} label="Access denials" value={m.accessDenials.toLocaleString()}
                  tone={m.accessDenials > 0 ? "warn" : "neutral"}
                  hint="Times AI refused due to RLS" />
              </div>
            </section>

            {/* Failed rows */}
            <section>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent failed ingestion</h2>
                <Link to="/resource-library/admin/qa" className="text-xs text-primary hover:underline">Open Import & QA →</Link>
              </div>
              {failedRows.length === 0 ? (
                <Card className="p-4 text-sm text-muted-foreground">No failed ingests — nice.</Card>
              ) : (
                <Card className="divide-y divide-border/60">
                  {failedRows.map((r) => (
                    <div key={r.id} className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <Link to={`/resource-library/resource/${r.id}`} className="text-sm font-medium hover:text-primary block truncate">
                          {r.title || r.id}
                        </Link>
                        <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {r.ingest_error || "Unknown error"}
                        </div>
                      </div>
                      {r.storage_bucket && (
                        <Badge variant="outline" className="text-[10px] shrink-0">{r.storage_bucket}</Badge>
                      )}
                    </div>
                  ))}
                </Card>
              )}
            </section>

            {/* Ingestion controls */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ingestion controls</h2>
              <BlossomAIIngestPanel />
            </section>

            {/* Recent AI usage */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent AI activity</h2>
              {recentAudit.length === 0 ? (
                <Card className="p-4 text-sm text-muted-foreground">No AI activity yet.</Card>
              ) : (
                <Card className="divide-y divide-border/60">
                  {recentAudit.map((r) => {
                    const hits = Array.isArray(r.kb_hits) ? r.kb_hits.length : 0;
                    const denied = r.status === "no_context" || r.status === "error";
                    return (
                      <div key={r.id} className="p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{r.user_email ?? "unknown"} · <span className="text-muted-foreground font-normal">{r.role ?? "—"}</span></span>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px]">{hits} hits</Badge>
                            <Badge variant={denied ? "destructive" : "secondary"} className="text-[10px]">{r.status}</Badge>
                            <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-foreground line-clamp-1"><span className="text-muted-foreground">Q:</span> {r.prompt}</div>
                        {r.response_preview && (
                          <div className="text-muted-foreground line-clamp-2"><span className="text-muted-foreground/70">A:</span> {r.response_preview}</div>
                        )}
                      </div>
                    );
                  })}
                </Card>
              )}
            </section>

            {/* Feedback */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Feedback</h2>
              {feedbackRows.length === 0 ? (
                <Card className="p-4 text-sm text-muted-foreground">No feedback submitted yet.</Card>
              ) : (
                <Card className="divide-y divide-border/60">
                  {feedbackRows.map((f) => (
                    <div key={f.id} className="flex items-start gap-2 p-3 text-xs">
                      {f.rating > 0 ? (
                        <ThumbsUp className="h-3.5 w-3.5 text-emerald-600 mt-0.5" />
                      ) : (
                        <ThumbsDown className="h-3.5 w-3.5 text-rose-600 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-muted-foreground">{new Date(f.created_at).toLocaleString()}</div>
                        {f.note && <div className="text-foreground mt-0.5">{f.note}</div>}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </section>
          </>
        ) : null}
      </div>
    </OSShell>
  );
}