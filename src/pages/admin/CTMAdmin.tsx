import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PhoneCall, RefreshCw, Trash2, Copy } from "lucide-react";
import {
  useCanonicalCtmCalls,
  useProviderReadiness,
  classifyProviderReadiness,
} from "@/lib/intake/reviewDataLayer";
import { CtmOperationsPanel } from "@/components/admin/CtmOperationsPanel";
import { CtmHistoricalImportDialog } from "@/components/admin/CtmHistoricalImportDialog";
import { CtmUnknownCallerReviewPanel } from "@/components/admin/CtmUnknownCallerReviewPanel";
import { History } from "lucide-react";

type Mapping = {
  id: string;
  tracking_number: string;
  friendly_name: string | null;
  state_code: string | null;
  marketing_source_id: string | null;
  marketing_campaign_id: string | null;
  is_active: boolean;
};

export default function CTMAdmin() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [healthRefreshKey, setHealthRefreshKey] = useState(0);
  const [syncOutcome, setSyncOutcome] = useState<string | null>(null);
  const [draft, setDraft] = useState({ tracking_number: "", friendly_name: "", state_code: "" });
  const projectId = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string) ?? "";
  const webhookBase = projectId ? `https://${projectId}.functions.supabase.co/ctm-webhook` : "";
  const webhookUrl = webhookBase ? `${webhookBase}?token=YOUR_CTM_WEBHOOK_TOKEN` : "";

  // Recent calls come from the PII-masked canonical view — same source as
  // /phone/calls. Admin identity is still required to reach this page.
  const { data: callsPage, isLoading: callsLoading, refetch: refetchCalls } =
    useCanonicalCtmCalls({ page: 1, pageSize: 50 });
  const calls = callsPage?.rows ?? [];

  const { data: providers, isLoading: provLoading, refetch: refetchProviderReadiness } = useProviderReadiness();
  const ctm = useMemo(
    () => providers?.find((p) => p.integration_id?.toLowerCase().includes("ctm")) ?? null,
    [providers],
  );
  const ctmReadiness = ctm ? classifyProviderReadiness(ctm) : null;

  async function load() {
    const m = await supabase.from("ctm_number_mapping").select("*").order("tracking_number");
    setMappings((m.data ?? []) as Mapping[]);
  }

  useEffect(() => {
    void load();
    const ch = supabase.channel("ctm-calls-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "ctm_call_events" }, () => void refetchCalls())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetchCalls]);

  async function addMapping() {
    if (!draft.tracking_number) return;
    const { error } = await supabase.from("ctm_number_mapping").insert({
      tracking_number: draft.tracking_number.trim(),
      friendly_name: draft.friendly_name.trim() || null,
      state_code: draft.state_code.trim().toUpperCase() || null,
    });
    if (error) { toast.error(error.message); return; }
    setDraft({ tracking_number: "", friendly_name: "", state_code: "" });
    toast.success("Mapping added");
    void load();
  }
  async function removeMapping(id: string) {
    const { error } = await supabase.from("ctm_number_mapping").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  }
  async function runSync() {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("ctm-sync", { body: {} });
    setSyncing(false);
    if (error) {
      setSyncOutcome(`Function error: ${error.message}`);
      setHealthRefreshKey((k) => k + 1);
      return toast.error(error.message);
    }
    const d = data as {
      ok?: boolean; status?: string; run_id?: string | null; pages?: number; fetched?: number;
      normalized?: number; upserted?: number; duplicates?: number; errors?: number; error?: string | null;
    };
    const message = `Run ${d?.run_id ?? "—"}: ${d?.status ?? "unknown"} · pages ${d?.pages ?? 0} · fetched ${d?.fetched ?? 0} · normalized ${d?.normalized ?? 0} · upserted ${d?.upserted ?? 0} · duplicates ${d?.duplicates ?? 0} · errors ${d?.errors ?? 0}`;
    setSyncOutcome(d?.error ? `${message} · ${d.error}` : message);
    if (d?.error) toast.error(d.error); else toast.success(`CTM sync ${d?.status ?? "completed"}: ${d?.upserted ?? 0} calls processed`);
    void load();
    void refetchCalls();
    void refetchProviderReadiness();
    setHealthRefreshKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">CTM (CallTrackingMetrics)</h1>
          <p className="text-sm text-muted-foreground">
            Live call tracking, tracking-number mapping, and backfill sync.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <History className="h-4 w-4 mr-2" /> Historical import
          </Button>
          <Button onClick={runSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Run backfill"}
          </Button>
        </div>
      </header>

      {syncOutcome && (
        <Card>
          <CardContent className="py-3 text-sm text-muted-foreground">
            {syncOutcome}
          </CardContent>
        </Card>
      )}

      <CtmOperationsPanel refreshKey={healthRefreshKey} />

      <CtmUnknownCallerReviewPanel />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Provider readiness</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {provLoading ? (
            <div className="text-muted-foreground">Loading provider status…</div>
          ) : !ctm ? (
            <div className="text-muted-foreground">CTM connection is not registered in the integration catalog.</div>
          ) : (
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                ctmReadiness?.label === "connected" ? "bg-emerald-100 text-emerald-800"
                : ctmReadiness?.label === "stale" ? "bg-amber-100 text-amber-800"
                : ctmReadiness?.label === "error" ? "bg-destructive/10 text-destructive"
                : "bg-slate-100 text-slate-700"
              }`}>
                {ctmReadiness?.label}
              </span>
              <span className="text-muted-foreground">{ctmReadiness?.detail}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Webhook setup</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            In CTM go to <strong>Settings → Integrations → Webhooks</strong> and add a webhook for
            <em> Call Started, Call Completed, Voicemail, SMS Received</em> pointing to:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all">{webhookUrl || "Loading…"}</code>
            <Button variant="outline" size="icon" onClick={() => {
              if (webhookUrl) { navigator.clipboard.writeText(webhookUrl); toast.success("Copied"); }
            }}><Copy className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Replace <code>YOUR_CTM_WEBHOOK_TOKEN</code> with the value you saved as the
            <code> CTM_WEBHOOK_TOKEN</code> secret. Only requests matching that token are accepted.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tracking number mapping</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Input placeholder="Tracking # (+18885551234)" value={draft.tracking_number}
              onChange={(e) => setDraft({ ...draft, tracking_number: e.target.value })} />
            <Input placeholder="Friendly name (Google Ads GA)" value={draft.friendly_name}
              onChange={(e) => setDraft({ ...draft, friendly_name: e.target.value })} />
            <Input placeholder="State (GA, NC, ...)" value={draft.state_code}
              onChange={(e) => setDraft({ ...draft, state_code: e.target.value })} />
            <Button onClick={addMapping}>Add mapping</Button>
          </div>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-2">Number</th><th className="p-2">Name</th><th className="p-2">State</th><th className="p-2 w-16" /></tr>
              </thead>
              <tbody>
                {mappings.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No mappings yet.</td></tr>}
                {mappings.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2 font-mono">{m.tracking_number}</td>
                    <td className="p-2">{m.friendly_name ?? "—"}</td>
                    <td className="p-2">{m.state_code ?? "—"}</td>
                    <td className="p-2 text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeMapping(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><PhoneCall className="h-4 w-4" /> Recent calls (live)</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-2">When</th><th className="p-2">From</th><th className="p-2">Tracking</th>
                  <th className="p-2">Source</th><th className="p-2">State</th><th className="p-2">Duration</th><th className="p-2">Lead</th>
                </tr>
              </thead>
              <tbody>
                {callsLoading && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!callsLoading && calls.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No CTM calls yet. Add tracking-number mappings above and run a backfill, or wait for the webhook to fire.
                  </td></tr>
                )}
                {calls.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.called_at ? new Date(c.called_at).toLocaleString() : "—"}</td>
                    <td className="p-2 font-mono">{c.from_number ?? "—"}</td>
                    <td className="p-2 font-mono">{c.tracking_number ?? "—"}</td>
                    <td className="p-2">{c.source_name ?? "—"}</td>
                    <td className="p-2">{c.resolved_state ?? "—"}</td>
                    <td className="p-2">{c.duration_seconds ?? 0}s</td>
                    <td className="p-2">
                      {c.intake_lead_id
                        ? <a className="text-primary hover:underline" href={`/leads/${c.intake_lead_id}`}>Open</a>
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CtmHistoricalImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}