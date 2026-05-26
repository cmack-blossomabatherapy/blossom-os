import { useEffect, useState } from "react";
import { AiAdminShell } from "@/components/admin/ai/AiAdminShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Activity, BookOpen, AlertTriangle, Users, Sparkles, Clock, CheckCircle2, Loader2 } from "lucide-react";

export default function AiDashboard() {
  const [stats, setStats] = useState({
    queriesToday: 0, users: 0, avgMs: 0, failed: 0, blocks: 0,
    docs: 0, ready: 0, processing: 0, chunks: 0,
  });
  const [topQueries, setTopQueries] = useState<{ prompt: string; n: number }[]>([]);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [recentFails, setRecentFails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sinceISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [audit, docs] = await Promise.all([
        supabase.from("ai_audit_log" as any).select("*").gte("created_at", sinceISO).limit(1000),
        supabase.from("knowledge_documents").select("id,title,category,ingest_status,chunk_count,created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      const rows = (audit.data ?? []) as any[];
      const dRows = (docs.data ?? []) as any[];

      const counts = new Map<string, number>();
      rows.forEach((r) => counts.set(r.prompt, (counts.get(r.prompt) ?? 0) + 1));
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([prompt, n]) => ({ prompt, n }));

      setStats({
        queriesToday: rows.length,
        users: new Set(rows.map((r) => r.user_id).filter(Boolean)).size,
        avgMs: rows.length ? Math.round(rows.reduce((a, r) => a + (r.duration_ms ?? 0), 0) / rows.length) : 0,
        failed: rows.filter((r) => r.status !== "ok").length,
        blocks: rows.filter((r) => (r.response_preview ?? "").toLowerCase().includes("restrict")).length,
        docs: dRows.length,
        ready: dRows.filter((d) => d.ingest_status === "ready").length,
        processing: dRows.filter((d) => ["processing", "pending"].includes(d.ingest_status)).length,
        chunks: dRows.reduce((s, d) => s + (d.chunk_count || 0), 0),
      });
      setTopQueries(top);
      setRecentUploads(dRows.slice(0, 5));
      setRecentFails(rows.filter((r) => r.status !== "ok").slice(0, 5));
      setLoading(false);
    })();
  }, []);

  return (
    <AiAdminShell>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Mission control for Blossom OS AI — usage, health, and what employees are asking right now.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Queries · 24h" value={stats.queriesToday} icon={Activity} />
          <Kpi label="Active users" value={stats.users} icon={Users} />
          <Kpi label="Avg latency" value={`${stats.avgMs}ms`} icon={Clock} />
          <Kpi label="Failed / blocked" value={stats.failed + stats.blocks} icon={AlertTriangle} tone="warn" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-primary" /><h2 className="font-semibold">Top questions · 24h</h2></div>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : topQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No queries yet.</p>
            ) : (
              <ul className="space-y-2">
                {topQueries.map((q) => (
                  <li key={q.prompt} className="flex items-start justify-between gap-3 text-sm">
                    <span className="truncate flex-1">{q.prompt}</span>
                    <Badge variant="secondary">{q.n}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4 text-primary" /><h2 className="font-semibold">Knowledge base health</h2></div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Mini label="Documents" value={stats.docs} />
              <Mini label="Ready" value={stats.ready} tone="good" />
              <Mini label="Processing" value={stats.processing} tone="warn" />
            </div>
            <div className="mt-4 text-xs text-muted-foreground">{stats.chunks.toLocaleString()} embedded chunks total.</div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h2 className="font-semibold mb-3">Recent uploads</h2>
            <ul className="space-y-2 text-sm">
              {recentUploads.length === 0 && <li className="text-muted-foreground">Nothing yet.</li>}
              {recentUploads.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">{d.title}</span>
                  <Badge variant="outline" className="text-[10px]">{d.category}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold mb-3">Recent failures</h2>
            <ul className="space-y-2 text-sm">
              {recentFails.length === 0 && <li className="text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />All clear.</li>}
              {recentFails.map((r) => (
                <li key={r.id} className="truncate text-muted-foreground">{r.prompt}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AiAdminShell>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: any; icon: any; tone?: "warn" }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-xl grid place-items-center ${tone === "warn" ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xl font-semibold tracking-tight">{value}</div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
        </div>
      </div>
    </Card>
  );
}
function Mini({ label, value, tone }: { label: string; value: any; tone?: "good" | "warn" }) {
  return (
    <div>
      <div className={`text-2xl font-semibold tabular-nums ${tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : ""}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}