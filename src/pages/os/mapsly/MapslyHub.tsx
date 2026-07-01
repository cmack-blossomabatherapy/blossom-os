import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MapPin, RefreshCw, CheckCircle2, AlertTriangle, Users, Building2, UserPlus, ClipboardList } from "lucide-react";

type Status = "idle" | "ok" | "fail" | "needs-key";

export default function MapslyHub() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function testConnection() {
    setBusy(true);
    setStatus("idle");
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("mapsly-proxy", {
        body: { path: "/v1/me", method: "GET" },
      });
      if (error) throw error;
      const payload = data as { status?: number; ok?: boolean; needsSecret?: boolean; error?: string; data?: unknown };
      if (payload.needsSecret) {
        setStatus("needs-key");
        setMessage("MAPSLY_API_KEY is not set. Add it in project secrets to connect.");
        return;
      }
      if (payload.ok) {
        setStatus("ok");
        setMessage("Mapsly reachable. Foundation ready.");
      } else {
        setStatus("fail");
        setMessage(`Mapsly responded ${payload.status ?? "?"} — check the API key or endpoint.`);
      }
    } catch (e) {
      setStatus("fail");
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function stubSync(kind: string) {
    setBusy(true);
    try {
      await supabase.from("mapsly_sync_log").insert({
        direction: "push",
        entity_type: kind,
        status: "queued",
        message: `Manual ${kind} sync requested (Phase 1 stub — real push runs after MAPSLY_API_KEY is set).`,
      });
      toast({ title: "Sync queued", description: `${kind} sync recorded in log.` });
    } catch (e) {
      toast({ title: "Failed", description: String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><MapPin className="h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-semibold">Mapsly</h1>
          <p className="text-sm text-muted-foreground">The mapping backbone for BD, mileage, and recruiting.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Connection
            <StatusBadge status={status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Button onClick={testConnection} disabled={busy}>
              <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Test Connection
            </Button>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            Requests are proxied through the <code>mapsly-proxy</code> edge function using <code>MAPSLY_API_KEY</code>. The key is never exposed to the browser.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sync Blossom records into Mapsly</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SyncButton label="Clients" icon={Users} onClick={() => stubSync("client")} disabled={busy} />
          <SyncButton label="Employees" icon={UserPlus} onClick={() => stubSync("employee")} disabled={busy} />
          <SyncButton label="Leads" icon={ClipboardList} onClick={() => stubSync("lead")} disabled={busy} />
          <SyncButton label="Candidates" icon={Building2} onClick={() => stubSync("candidate")} disabled={busy} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Where Mapsly is used</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
          <LinkTile href="/mileage" title="Mileage" desc="BCBA/RBT trip capture + payroll export." />
          <LinkTile href="/bd/territories" title="BD Territories" desc="Territories, pins, route planning." />
          <LinkTile href="/recruiting/map" title="Recruiting Map" desc="Candidate proximity to clients." />
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "ok") return <Badge className="gap-1 bg-emerald-500/15 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>;
  if (status === "needs-key") return <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3" /> Key needed</Badge>;
  if (status === "fail") return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Failed</Badge>;
  return <Badge variant="outline">Not tested</Badge>;
}

function SyncButton({ label, icon: Icon, onClick, disabled }: { label: string; icon: React.ElementType; onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="outline" onClick={onClick} disabled={disabled} className="h-auto justify-start gap-3 py-4">
      <Icon className="h-4 w-4" />
      <div className="text-left">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">Queue push to Mapsly</div>
      </div>
    </Button>
  );
}

function LinkTile({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a href={href} className="rounded-lg border p-3 transition hover:border-primary/50 hover:bg-primary/5">
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </a>
  );
}