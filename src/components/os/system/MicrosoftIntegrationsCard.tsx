import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Mail, Calendar, MessageSquare, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import {
  getEmailCcSettings,
  setEmailCcSetting,
  type EmailCcSettings,
  type EmailCcSettingKey,
} from "@/lib/os/emailCommand/settings";
import type { OAuthConnectionRow } from "@/lib/os/integrations/backend";

interface Props {
  conn: OAuthConnectionRow | null;
  isAdmin: boolean;
  onReconnect: () => void;
  reconnectBusy?: boolean;
}

const REQUIRED_SCOPES = {
  mail: ["Mail.ReadWrite", "Mail.Send"],
  calendar: ["Calendars.ReadWrite"],
  teams: ["ChannelMessage.Send"],
} as const;

function scopeSet(conn: OAuthConnectionRow | null): Set<string> {
  const raw = ((conn as unknown as { scopes?: string[] | string | null })?.scopes) ?? [];
  if (Array.isArray(raw)) return new Set(raw);
  if (typeof raw === "string") return new Set(raw.split(/[\s,]+/).filter(Boolean));
  return new Set();
}

function hasAll(scopes: Set<string>, required: readonly string[]): boolean {
  return required.every((s) => scopes.has(s));
}

function ScopePill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? "outline" : "secondary"} className={ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
      {ok ? <CheckCircle2 className="mr-1 size-3" /> : <AlertTriangle className="mr-1 size-3" />}
      {label}
    </Badge>
  );
}

export function MicrosoftIntegrationsCard({ conn, isAdmin, onReconnect, reconnectBusy }: Props) {
  const [settings, setSettings] = useState<EmailCcSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<EmailCcSettingKey | null>(null);
  const connected = conn?.status === "connected";
  const scopes = scopeSet(conn);
  const mailOk = connected && hasAll(scopes, REQUIRED_SCOPES.mail);
  const calendarScopeOk = connected && hasAll(scopes, REQUIRED_SCOPES.calendar);
  const teamsScopeOk = connected && hasAll(scopes, REQUIRED_SCOPES.teams);

  async function refresh() {
    setLoading(true);
    const s = await getEmailCcSettings();
    setSettings(s);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function toggle(key: EmailCcSettingKey, next: boolean) {
    setSavingKey(key);
    const res = await setEmailCcSetting(key, next);
    setSavingKey(null);
    if (res.ok) {
      setSettings(res.row);
      toast.success(next ? "Enabled" : "Disabled");
    } else {
      toast.error(`Could not update: ${res.error}`);
    }
  }

  const teamsOn = !!settings?.teams_write_enabled;
  const calOn = !!settings?.calendar_write_enabled;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Microsoft Integrations</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Control which Microsoft 365 write actions the Email Command Center can perform. Reads (Outlook sync) are always on once connected; writes are admin-gated.
          </p>
        </div>
        {!isAdmin && (
          <Badge variant="outline" className="bg-muted text-muted-foreground">Admin-only controls hidden</Badge>
        )}
      </div>

      <div className="mt-4 divide-y divide-border rounded-xl border border-border">
        {/* Outlook Mail */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <Mail className="size-4 text-primary" />
            <div>
              <div className="text-sm font-medium">Outlook Mail</div>
              <div className="text-xs text-muted-foreground">Send, forward, archive, categorize.</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ScopePill ok={mailOk} label={mailOk ? "Mail.Send · Mail.ReadWrite" : "Mail scopes missing"} />
            <Badge variant={connected ? "outline" : "secondary"} className={connected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
              {connected ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </div>

        {/* Outlook Calendar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <Calendar className="size-4 text-primary" />
            <div>
              <div className="text-sm font-medium">Outlook Calendar — write</div>
              <div className="text-xs text-muted-foreground">
                Create approved Outlook Calendar events / reminders from email actions.
              </div>
              {settings?.updated_at && (
                <div className="mt-0.5 text-[11px] text-muted-foreground">Last changed {new Date(settings.updated_at).toLocaleString()}</div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ScopePill ok={calendarScopeOk} label={calendarScopeOk ? "Calendars.ReadWrite" : "Calendars.ReadWrite missing"} />
            {isAdmin && (
              <div className="flex items-center gap-2">
                {savingKey === "calendar_write_enabled" && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                <Switch
                  checked={calOn}
                  disabled={loading || !calendarScopeOk || savingKey === "calendar_write_enabled"}
                  onCheckedChange={(v) => toggle("calendar_write_enabled", v)}
                />
                <span className="text-xs text-muted-foreground">{calOn ? "On" : "Off"}</span>
              </div>
            )}
          </div>
        </div>
        {isAdmin && !calendarScopeOk && (
          <div className="bg-amber-50/60 px-3 py-2 text-[11px] text-amber-800">
            Reconnect Microsoft 365 with the <code>Calendars.ReadWrite</code> scope to enable this toggle.
            <Button size="sm" variant="link" className="ml-1 h-auto p-0 text-amber-900" onClick={onReconnect} disabled={reconnectBusy}>
              Reconnect <ExternalLink className="ml-1 size-3" />
            </Button>
          </div>
        )}

        {/* Teams */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <MessageSquare className="size-4 text-primary" />
            <div>
              <div className="text-sm font-medium">Microsoft Teams — write</div>
              <div className="text-xs text-muted-foreground">
                Post approved Teams channel follow-ups from email actions.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ScopePill ok={teamsScopeOk} label={teamsScopeOk ? "ChannelMessage.Send" : "ChannelMessage.Send missing"} />
            {isAdmin && (
              <div className="flex items-center gap-2">
                {savingKey === "teams_write_enabled" && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                <Switch
                  checked={teamsOn}
                  disabled={loading || !teamsScopeOk || savingKey === "teams_write_enabled"}
                  onCheckedChange={(v) => toggle("teams_write_enabled", v)}
                />
                <span className="text-xs text-muted-foreground">{teamsOn ? "On" : "Off"}</span>
              </div>
            )}
          </div>
        </div>
        {isAdmin && !teamsScopeOk && (
          <div className="bg-amber-50/60 px-3 py-2 text-[11px] text-amber-800">
            Teams sends require the <code>ChannelMessage.Send</code> Graph permission (admin-consent in Entra). After consent, reconnect Microsoft 365 to refresh scopes.
            <Button size="sm" variant="link" className="ml-1 h-auto p-0 text-amber-900" onClick={onReconnect} disabled={reconnectBusy}>
              Reconnect <ExternalLink className="ml-1 size-3" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}