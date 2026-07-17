import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminHub } from "@/lib/adminAccess";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bell, Pause, Play, AlertTriangle, History } from "lucide-react";

type Rule = {
  id: string; event_key: string; domain: string; category: string;
  title_template: string; body_template: string; channels: string[];
  required: boolean; respect_quiet_hours: boolean; dedupe_window_minutes: number;
  active: boolean; paused_at: string | null; paused_reason: string | null;
  action_label: string | null; deep_link_template: string | null;
};

export default function RbtNotificationEngine() {
  const { user, roles } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [failed, setFailed] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const [r, d, a] = await Promise.all([
      supabase.from("rbt_notification_rules").select("*").order("domain").order("event_key"),
      supabase.from("rbt_notification_deliveries").select("*").in("status", ["failed", "pending"]).order("created_at", { ascending: false }).limit(100),
      supabase.from("rbt_notification_audit").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setRules((r.data as any) ?? []);
    setFailed(d.data ?? []);
    setAudit(a.data ?? []);
  };
  useEffect(() => { load(); }, []);

  if (!canAccessAdminHub(user, roles)) return <Navigate to="/" replace />;

  const filtered = useMemo(
    () => rules.filter(r => !q || r.event_key.includes(q.toLowerCase()) || r.title_template.toLowerCase().includes(q.toLowerCase())),
    [rules, q]
  );
  const byDomain = useMemo(() => {
    const m: Record<string, Rule[]> = {};
    filtered.forEach(r => { (m[r.domain] ||= []).push(r); });
    return m;
  }, [filtered]);

  const togglePause = async (r: Rule) => {
    const paused = !!r.paused_at;
    const { error } = await supabase.from("rbt_notification_rules").update({
      paused_at: paused ? null : new Date().toISOString(),
      paused_by: paused ? null : user?.id ?? null,
    }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("rbt_notification_audit").insert({
      actor_id: user?.id, action: paused ? "resume" : "pause", rule_id: r.id,
      details: { event_key: r.event_key },
    });
    toast.success(paused ? "Rule resumed" : "Rule paused");
    load();
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 sm:p-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Bell className="h-3.5 w-3.5" /> RBT Notification Engine
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Notifications & automations</h1>
          <p className="text-sm text-muted-foreground">Configure rules, pause automations, and monitor failed deliveries.</p>
        </div>
      </header>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Rules ({rules.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed / Pending ({failed.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit ({audit.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Input placeholder="Search event key or title…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
          {Object.entries(byDomain).map(([domain, list]) => (
            <Card key={domain}>
              <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">{domain.replace("_", " ")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {list.map(r => (
                  <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{r.title_template}</span>
                        <Badge variant="outline" className="text-[10px]">{r.category.replace("_", " ")}</Badge>
                        {r.required && <Badge className="text-[10px]" variant="destructive">Required</Badge>}
                        {r.paused_at && <Badge className="text-[10px]" variant="secondary">Paused</Badge>}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        <code>{r.event_key}</code> • {r.channels.join(", ")} • dedupe {r.dedupe_window_minutes}m
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => togglePause(r)}>
                      {r.paused_at ? <><Play className="mr-1 h-3.5 w-3.5" /> Resume</> : <><Pause className="mr-1 h-3.5 w-3.5" /> Pause</>}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="failed">
          <Card>
            <CardHeader><CardTitle className="text-sm"><AlertTriangle className="mr-2 inline h-4 w-4" /> Failed & pending deliveries</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {failed.length === 0 && <p className="text-sm text-muted-foreground">Nothing failing right now.</p>}
              {failed.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border/60 p-2 text-xs">
                  <div><span className="font-medium">{d.channel}</span> · {d.status}{d.error ? ` · ${d.error}` : ""}</div>
                  <span className="text-muted-foreground">{new Date(d.created_at).toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle className="text-sm"><History className="mr-2 inline h-4 w-4" /> Automation audit</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {audit.map((a: any) => (
                <div key={a.id} className="rounded-lg border border-border/60 p-2 text-xs">
                  <div className="font-medium">{a.action}</div>
                  <div className="text-muted-foreground">{new Date(a.created_at).toLocaleString()} · {JSON.stringify(a.details)}</div>
                </div>
              ))}
              {audit.length === 0 && <p className="text-sm text-muted-foreground">No audit entries yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}