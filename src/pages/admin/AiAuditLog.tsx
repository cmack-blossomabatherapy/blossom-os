import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, RefreshCw, Search, ShieldCheck, Loader2 } from "lucide-react";

type AuditRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  role: string | null;
  conversation_id: string | null;
  prompt: string;
  response_preview: string | null;
  kb_hits: Array<{ title: string; similarity?: number | null; category?: string | null }>;
  tools_called: string[];
  model: string | null;
  duration_ms: number | null;
  status: string;
  created_at: string;
};

export default function AiAuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AuditRow | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_audit_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error) setRows((data ?? []) as unknown as AuditRow[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      r.prompt.toLowerCase().includes(term) ||
      (r.user_email ?? "").toLowerCase().includes(term) ||
      (r.role ?? "").toLowerCase().includes(term) ||
      (r.response_preview ?? "").toLowerCase().includes(term),
    );
  }, [rows, q]);

  const stats = useMemo(() => ({
    total: rows.length,
    users: new Set(rows.map((r) => r.user_id).filter(Boolean)).size,
    avgMs: rows.length ? Math.round(rows.reduce((a, r) => a + (r.duration_ms ?? 0), 0) / rows.length) : 0,
    failed: rows.filter((r) => r.status !== "ok").length,
  }), [rows]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">AI Audit Log</h1>
            <p className="text-sm text-muted-foreground">Every Ask Blossom AI query — HIPAA-aware oversight for Super Admins.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total queries" value={stats.total.toString()} />
        <StatCard label="Unique users" value={stats.users.toString()} />
        <StatCard label="Avg latency" value={`${stats.avgMs} ms`} />
        <StatCard label="Failed / no-answer" value={stats.failed.toString()} />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompt, user, role…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md"
          />
          <Badge variant="outline" className="ml-auto">{filtered.length} shown</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">When</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="w-[120px]">Role</TableHead>
              <TableHead>Prompt</TableHead>
              <TableHead className="w-[120px]">Sources</TableHead>
              <TableHead className="w-[90px]">Latency</TableHead>
              <TableHead className="w-[90px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No AI queries yet.</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-xs truncate max-w-[180px]" title={r.user_email ?? r.user_id ?? ""}>{r.user_email ?? r.user_id?.slice(0, 8) ?? "—"}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{r.role ?? "—"}</Badge></TableCell>
                <TableCell className="text-xs truncate max-w-[420px]" title={r.prompt}>{r.prompt}</TableCell>
                <TableCell className="text-xs">{r.kb_hits?.length ?? 0}</TableCell>
                <TableCell className="text-xs">{r.duration_ms ?? "—"} ms</TableCell>
                <TableCell>
                  <Badge variant={r.status === "ok" ? "secondary" : "destructive"} className="text-[10px]">{r.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {selected && (
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h2 className="font-semibold">Query detail</h2>
              <Badge variant="outline">{new Date(selected.created_at).toLocaleString()}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Prompt</p>
              <ScrollArea className="h-32 rounded-md border p-2 text-xs whitespace-pre-wrap">{selected.prompt}</ScrollArea>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Response preview</p>
              <ScrollArea className="h-32 rounded-md border p-2 text-xs whitespace-pre-wrap">{selected.response_preview ?? "—"}</ScrollArea>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Tools called</p>
              <div className="flex flex-wrap gap-1">
                {selected.tools_called?.length ? selected.tools_called.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                )) : <span className="text-xs text-muted-foreground">None</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Knowledge base hits</p>
              <div className="space-y-1">
                {selected.kb_hits?.length ? selected.kb_hits.map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border px-2 py-1 text-xs">
                    <span className="truncate">{h.title}</span>
                    {typeof h.similarity === "number" && <Badge variant="secondary" className="text-[10px] ml-2">{Math.round(h.similarity * 100)}%</Badge>}
                  </div>
                )) : <span className="text-xs text-muted-foreground">None</span>}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
    </Card>
  );
}