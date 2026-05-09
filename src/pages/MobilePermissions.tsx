import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, CheckCircle2, AlertTriangle, Smartphone, Loader2, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  isPushSupported,
  isAllowedHostForPush,
  getCurrentSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/registerPush";

type PermissionState = NotificationPermission | "unsupported";

function detectPlatform() {
  if (typeof navigator === "undefined") return { isIOS: false, isAndroid: false, isStandalone: false };
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/i.test(ua);
  const isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    (navigator as any).standalone === true;
  return { isIOS, isAndroid, isStandalone };
}

function StatusRow({
  ok,
  label,
  value,
  hint,
}: { ok: boolean | "warn"; label: string; value: string; hint?: string }) {
  const Icon = ok === true ? CheckCircle2 : ok === "warn" ? AlertTriangle : BellOff;
  const tone =
    ok === true ? "text-emerald-600" : ok === "warn" ? "text-amber-600" : "text-destructive";
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      <div className={`flex items-center gap-1.5 shrink-0 text-sm ${tone}`}>
        <Icon className="h-4 w-4" />
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

export default function MobilePermissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<PermissionState>(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const supported = isPushSupported();
  const allowedHost = isAllowedHostForPush();
  const { isIOS, isAndroid, isStandalone } = detectPlatform();
  const iosNeedsInstall = isIOS && !isStandalone;

  async function refresh() {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
    if (supported && allowedHost) {
      const sub = await getCurrentSubscription();
      setEndpoint(sub?.endpoint ?? null);
    }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function handleEnable() {
    setBusy(true);
    const res = await subscribeToPush();
    if (!res.ok) {
      toast({ title: "Couldn't enable notifications", description: res.reason, variant: "destructive" });
    } else {
      toast({ title: "You're all set", description: "Critical alerts will be delivered to this device." });
    }
    await refresh();
    setBusy(false);
  }

  async function handleDisable() {
    setBusy(true);
    await unsubscribeFromPush();
    toast({ title: "Notifications disabled on this device" });
    await refresh();
    setBusy(false);
  }

  async function handleTest() {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setTesting(true);
    const { error } = await supabase.from("critical_alerts").insert({
      category: "test",
      severity: "critical",
      title: "Test critical alert",
      message: "If you see this, push is working on this device.",
      deep_link: "/mobile/permissions",
      due_at: new Date(Date.now() - 60_000).toISOString(),
      assignee_user_id: user.id,
    });
    if (error) {
      toast({ title: "Couldn't queue test alert", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Test queued", description: "It will arrive within ~5 minutes." });
    }
    setTesting(false);
  }

  const permissionLabel: Record<PermissionState, string> = {
    granted: "Granted",
    denied: "Blocked",
    default: "Not asked",
    unsupported: "Unsupported",
  };

  const permissionTone: Record<PermissionState, true | "warn" | false> = {
    granted: true,
    denied: false,
    default: "warn",
    unsupported: false,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 pt-8 pb-16">
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <BellRing className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Stay on top of critical alerts</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Allow notifications so we can ping you the moment something needs your attention — even when the app is closed.
          </p>
        </div>

        {/* iOS install hint */}
        {iosNeedsInstall && (
          <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Install Blossom to enable push</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    On iPhone, push notifications only work when the app is added to your Home Screen.
                    Tap <Share className="inline h-3.5 w-3.5 align-text-bottom" /> Share, then
                    <span className="inline-flex items-center gap-1 mx-1"><Plus className="h-3.5 w-3.5" /> Add to Home Screen</span>,
                    and open Blossom from there.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary action card */}
        <Card className="mb-4">
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">This device</div>
                <div className="text-xs text-muted-foreground">
                  {endpoint ? "Subscribed and ready" : "Not yet subscribed"}
                </div>
              </div>
              <Badge variant={endpoint && permission === "granted" ? "default" : "secondary"}>
                {endpoint && permission === "granted" ? "Active" : "Off"}
              </Badge>
            </div>

            {endpoint && permission === "granted" ? (
              <div className="space-y-2">
                <Button variant="outline" className="w-full h-11" onClick={handleDisable} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                  Turn off on this device
                </Button>
                <Button variant="ghost" className="w-full h-11" onClick={handleTest} disabled={testing}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
                  Send me a test alert
                </Button>
              </div>
            ) : (
              <Button
                className="w-full h-11"
                onClick={handleEnable}
                disabled={busy || !supported || !allowedHost || permission === "denied"}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
                {permission === "denied" ? "Notifications blocked" : "Allow notifications"}
              </Button>
            )}

            {permission === "denied" && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                You previously blocked notifications. Re-enable them in your browser site settings, then return here.
              </p>
            )}
            {!allowedHost && supported && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Open the published app from its real URL to subscribe — preview windows can't receive push.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status detail */}
        <Card>
          <CardContent className="pt-2 pb-2 divide-y divide-border">
            <StatusRow
              ok={supported}
              label="Browser support"
              value={supported ? "Supported" : "Unsupported"}
              hint={supported ? "Web Push & Notifications API available" : "This browser can't receive push notifications"}
            />
            <StatusRow
              ok={permissionTone[permission]}
              label="Notification permission"
              value={permissionLabel[permission]}
              hint={
                permission === "denied"
                  ? "Re-enable in browser settings"
                  : permission === "default"
                    ? "Tap Allow notifications above"
                    : permission === "granted"
                      ? "You'll see system-level alerts"
                      : undefined
              }
            />
            <StatusRow
              ok={!!endpoint}
              label="Device subscription"
              value={endpoint ? "Registered" : "None"}
              hint={endpoint ? "Your device is on the push list" : "Allow notifications to register"}
            />
            {(isIOS || isAndroid) && (
              <StatusRow
                ok={isIOS ? (isStandalone ? true : "warn") : true}
                label={isIOS ? "Installed as app" : "Mobile platform"}
                value={isIOS ? (isStandalone ? "Yes" : "No") : "Android"}
                hint={
                  isIOS
                    ? isStandalone
                      ? "iOS push is enabled for installed PWAs"
                      : "Required on iPhone for push to work"
                    : "Push works in Chrome and other supported browsers"
                }
              />
            )}
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
          You'll only be notified for alerts marked <span className="font-medium">critical</span>.
          Manage your devices anytime in Settings → Push Notifications.
        </p>
      </div>
    </div>
  );
}