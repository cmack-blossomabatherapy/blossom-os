import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, AlertCircle, Smartphone, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  isPushSupported,
  isAllowedHostForPush,
  getCurrentSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/registerPush";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ListChecks } from "lucide-react";

const ALERT_CATEGORIES: { key: string; label: string; description: string }[] = [
  { key: "authorizations", label: "Authorizations", description: "Auth approvals, expirations and reauth blockers" },
  { key: "qa", label: "QA / Clinical", description: "QA review escalations and missing documentation" },
  { key: "staffing", label: "Staffing", description: "Coverage gaps, callouts, RBT shortages" },
  { key: "intake", label: "Intake", description: "Lead SLAs and stuck intake stages" },
  { key: "billing", label: "Billing", description: "Claim denials and unbilled sessions" },
  { key: "compliance", label: "Compliance", description: "Credentialing, training and document expirations" },
  { key: "tasks", label: "Tasks", description: "Overdue tasks assigned to me" },
  { key: "test", label: "Test alerts", description: "Used by the 'Send me a test alert' button" },
];

interface DeviceRow {
  id: string;
  endpoint: string;
  user_agent: string | null;
  created_at: string;
}

function shortDevice(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/iPhone|iPad|iOS/i.test(ua)) return "iPhone / iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  return "Browser";
}

export function PushNotificationsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [seedBusy, setSeedBusy] = useState(false);
  const [thisDeviceEndpoint, setThisDeviceEndpoint] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  const supported = isPushSupported();
  const allowedHost = isAllowedHostForPush();

  async function loadDevices() {
    if (!user) return;
    const { data } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, user_agent, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDevices((data ?? []) as DeviceRow[]);
  }

  async function loadPrefs() {
    if (!user) return;
    const { data } = await supabase
      .from("push_notification_preferences")
      .select("category, enabled")
      .eq("user_id", user.id);
    const map: Record<string, boolean> = {};
    for (const row of data ?? []) map[(row as any).category] = (row as any).enabled;
    setPrefs(map);
  }

  async function togglePref(category: string, enabled: boolean) {
    if (!user) return;
    setPrefs((p) => ({ ...p, [category]: enabled }));
    const { error } = await supabase
      .from("push_notification_preferences")
      .upsert(
        { user_id: user.id, category, enabled },
        { onConflict: "user_id,category" },
      );
    if (error) {
      toast({ title: "Couldn't save preference", description: error.message, variant: "destructive" });
      await loadPrefs();
    }
  }

  async function refreshLocal() {
    if (!supported) return;
    const sub = await getCurrentSubscription();
    setThisDeviceEndpoint(sub?.endpoint ?? null);
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }

  useEffect(() => {
    refreshLocal();
    loadDevices();
    loadPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function handleEnable() {
    setBusy(true);
    const res = await subscribeToPush();
    if (!res.ok) {
      toast({ title: "Couldn't enable push", description: res.reason, variant: "destructive" });
    } else {
      toast({ title: "Push notifications enabled on this device" });
    }
    await refreshLocal();
    await loadDevices();
    setBusy(false);
  }

  async function handleDisableThisDevice() {
    setBusy(true);
    await unsubscribeFromPush();
    toast({ title: "Disabled on this device" });
    await refreshLocal();
    await loadDevices();
    setBusy(false);
  }

  async function handleRemoveDevice(endpoint: string) {
    if (!user) return;
    await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
    await loadDevices();
    toast({ title: "Device removed" });
  }

  async function handleSeedTest() {
    if (!user) return;
    setSeedBusy(true);
    const { error } = await supabase.from("critical_alerts").insert({
      category: "test",
      severity: "critical",
      title: "Test critical alert",
      message: "This is a test push generated from Settings.",
      deep_link: "/index",
      due_at: new Date(Date.now() - 60_000).toISOString(),
      assignee_user_id: user.id,
    });
    if (error) {
      toast({ title: "Couldn't create test alert", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Test alert created", description: "It will be pushed within ~5 minutes by the scanner." });
    }
    setSeedBusy(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Critical alert push notifications</CardTitle>
          <CardDescription>
            Get a push notification when an alert with severity <strong>critical</strong> becomes overdue.
            On iPhone, install this app to your Home Screen first — push only works when launched as an installed app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!supported && (
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>This browser doesn't support web push notifications.</span>
            </div>
          )}
          {supported && !allowedHost && (
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>Open the published app (or your custom domain) to enable push. The Lovable preview window can't subscribe.</span>
            </div>
          )}
          {supported && allowedHost && (
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={permission === "granted" ? "default" : "secondary"}>
                Permission: {permission}
              </Badge>
              <Badge variant={thisDeviceEndpoint ? "default" : "outline"}>
                {thisDeviceEndpoint ? "This device subscribed" : "Not subscribed on this device"}
              </Badge>
              {thisDeviceEndpoint ? (
                <Button variant="outline" size="sm" onClick={handleDisableThisDevice} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
                  <span className="ml-2">Disable on this device</span>
                </Button>
              ) : (
                <Button size="sm" onClick={handleEnable} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  <span className="ml-2">Enable push notifications</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSeedTest} disabled={seedBusy}>
                {seedBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span className="ml-2">Send me a test alert</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscribed devices</CardTitle>
          <CardDescription>One row per browser/device that will receive your alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-sm text-muted-foreground">No devices yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{shortDevice(d.user_agent)}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Added {new Date(d.created_at).toLocaleString()}
                        {d.endpoint === thisDeviceEndpoint ? " · this device" : ""}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveDevice(d.endpoint)}>Remove</Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}