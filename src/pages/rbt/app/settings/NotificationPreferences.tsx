import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Rule = { id: string; event_key: string; domain: string; title_template: string; channels: string[]; required: boolean; };
type Pref = { event_key: string; channel: string; enabled: boolean; quiet_hours_start: string | null; quiet_hours_end: string | null };

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [prefs, setPrefs] = useState<Record<string, Pref>>({});
  const [quiet, setQuiet] = useState<{ start: string; end: string }>({ start: "", end: "" });

  const load = async () => {
    if (!user) return;
    const [r, p] = await Promise.all([
      supabase.from("rbt_notification_rules").select("id,event_key,domain,title_template,channels,required").eq("active", true).order("domain"),
      supabase.from("rbt_notification_preferences").select("event_key,channel,enabled,quiet_hours_start,quiet_hours_end").eq("user_id", user.id),
    ]);
    setRules((r.data as any) ?? []);
    const map: Record<string, Pref> = {};
    (p.data as any[] ?? []).forEach(x => { map[`${x.event_key}:${x.channel}`] = x; });
    setPrefs(map);
    const first = (p.data as any[])?.find(x => x.quiet_hours_start);
    if (first) setQuiet({ start: first.quiet_hours_start, end: first.quiet_hours_end });
  };
  useEffect(() => { load(); }, [user?.id]);

  const toggle = async (rule: Rule, channel: string, enabled: boolean) => {
    if (!user || rule.required) return;
    const { error } = await supabase.from("rbt_notification_preferences").upsert({
      user_id: user.id, event_key: rule.event_key, channel, enabled,
      quiet_hours_start: quiet.start || null, quiet_hours_end: quiet.end || null,
    }, { onConflict: "user_id,event_key,channel" });
    if (error) toast.error(error.message); else load();
  };

  const saveQuietHours = async () => {
    if (!user) return;
    // update all existing prefs; if none, users' first channel toggle will pick these up
    await supabase.from("rbt_notification_preferences").update({
      quiet_hours_start: quiet.start || null, quiet_hours_end: quiet.end || null,
    }).eq("user_id", user.id);
    toast.success("Quiet hours saved");
  };

  const byDomain = useMemo(() => {
    const g: Record<string, Rule[]> = {};
    rules.forEach(r => { (g[r.domain] ||= []).push(r); });
    return g;
  }, [rules]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notification preferences</h1>
        <p className="text-sm text-muted-foreground">Turn off nonrequired notifications. Compliance and safety alerts always stay on.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-sm">Quiet hours</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Start</Label><Input type="time" value={quiet.start} onChange={e => setQuiet({ ...quiet, start: e.target.value })} /></div>
          <div><Label className="text-xs">End</Label><Input type="time" value={quiet.end} onChange={e => setQuiet({ ...quiet, end: e.target.value })} /></div>
          <button className="col-span-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" onClick={saveQuietHours}>Save quiet hours</button>
        </CardContent>
      </Card>

      {Object.entries(byDomain).map(([domain, list]) => (
        <Card key={domain}>
          <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">{domain.replace("_", " ")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {list.map(r => (
              <div key={r.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.title_template}</span>
                      {r.required && <Badge variant="secondary" className="text-[10px]">Required</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.channels.join(" · ")}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {r.channels.map(ch => {
                    const key = `${r.event_key}:${ch}`;
                    const enabled = prefs[key]?.enabled ?? true;
                    return (
                      <label key={ch} className="flex items-center gap-2 text-sm">
                        <Switch checked={enabled} disabled={r.required} onCheckedChange={(v) => toggle(r, ch, v)} />
                        <span className="capitalize">{ch.replace("_", " ")}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}