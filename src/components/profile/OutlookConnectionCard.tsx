import { useEffect, useState } from "react";
import { Mail, RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  listUserOAuthConnections,
  startOutlookOAuth,
  probeOutlookConnection,
  type OAuthConnectionRow,
} from "@/lib/os/integrations/backend";
import { useAuth } from "@/contexts/AuthContext";

export function OutlookConnectionCard() {
  const { user } = useAuth();
  const [conn, setConn] = useState<OAuthConnectionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"connect" | "test" | null>(null);

  async function refresh() {
    if (!user?.id) return;
    setLoading(true);
    const rows = await listUserOAuthConnections(user.id);
    setConn(rows.find((r) => r.integration_id === "ms365") ?? null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [user?.id]);

  async function handleConnect() {
    setBusy("connect");
    const res = await startOutlookOAuth();
    setBusy(null);
    if (res.error || !res.authorizeUrl) {
      toast.error(res.error ?? "Could not start Outlook OAuth");
      return;
    }
    window.open(res.authorizeUrl, "outlook-oauth", "width=520,height=720");
  }

  async function handleTest() {
    setBusy("test");
    const res = await probeOutlookConnection();
    setBusy(null);
    if (res.ok) {
      toast.success(`Outlook OK · ${res.provider_email ?? "connected"}`);
      refresh();
    } else {
      toast.error(`Outlook check failed: ${res.error ?? "unknown error"}`);
    }
  }

  const status = conn?.status ?? "not_connected";
  const connected = status === "connected";

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:col-span-2">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Microsoft Outlook</h2>
          {loading ? (
            <Loader2 className="ml-1 size-3.5 animate-spin text-muted-foreground" />
          ) : connected ? (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
              <CheckCircle2 className="size-3" /> Connected
            </span>
          ) : status === "needs_attention" ? (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
              <AlertTriangle className="size-3" /> Needs attention
            </span>
          ) : (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Not connected
            </span>
          )}
        </div>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Connect your work Outlook so Blossom OS can read your mail and calendar
        on your behalf. Tokens are encrypted at rest and never returned to your
        browser.
      </p>
      {connected && conn ? (
        <div className="mb-3 grid gap-1 text-xs text-foreground/90">
          <div>
            <span className="text-muted-foreground">Account:</span>{" "}
            {conn.provider_email ?? "—"}
          </div>
          {conn.display_name && (
            <div>
              <span className="text-muted-foreground">Name:</span> {conn.display_name}
            </div>
          )}
          {conn.expires_at && (
            <div>
              <span className="text-muted-foreground">Token expires:</span>{" "}
              {new Date(conn.expires_at).toLocaleString()}
            </div>
          )}
          {conn.scopes?.length > 0 && (
            <div className="text-muted-foreground">
              Scopes: {conn.scopes.join(", ")}
            </div>
          )}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleConnect} disabled={busy === "connect"}>
          {busy === "connect" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Mail className="size-3.5" />
          )}
          {connected ? "Reconnect Outlook" : "Connect Outlook"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={!conn || busy === "test"}
        >
          {busy === "test" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Test connection
        </Button>
      </div>
    </section>
  );
}