import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, CheckCircle2, ArrowRight, Sparkles, Clock, AlertCircle, Info } from "lucide-react";

type Notif = {
  id: string; title: string; body: string | null; link: string | null;
  category: string; action_label: string | null; read_at: string | null;
  created_at: string; kind: string;
};

const TABS = [
  { id: "action_required", label: "Action required", icon: AlertCircle },
  { id: "due_soon",        label: "Due soon",        icon: Clock },
  { id: "update",          label: "Update",          icon: Info },
  { id: "recognition",     label: "Recognition",     icon: Sparkles },
  { id: "completed",       label: "Completed",       icon: CheckCircle2 },
] as const;

export default function NotificationInbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_notifications")
      .select("id,title,body,link,category,action_label,read_at,created_at,kind")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
    setItems((data as any) ?? []);
  };
  useEffect(() => { load(); }, [user?.id]);

  const grouped = useMemo(() => {
    const g: Record<string, Notif[]> = {};
    items.forEach(n => { (g[n.category || "update"] ||= []).push(n); });
    return g;
  }, [items]);

  const markRead = async (id: string) => {
    await supabase.from("user_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    load();
  };
  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("user_notifications").update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id).is("read_at", null);
    load();
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 pb-16 sm:p-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Bell className="h-3.5 w-3.5" /> Inbox
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Your notifications</h1>
        </div>
        <Button size="sm" variant="outline" onClick={markAllRead}>Mark all read</Button>
      </header>

      <Tabs defaultValue="action_required">
        <TabsList className="flex-wrap">
          {TABS.map(t => {
            const n = grouped[t.id]?.filter(x => !x.read_at).length ?? 0;
            return (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                <t.icon className="h-3.5 w-3.5" />{t.label}
                {n > 0 && <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px]">{n}</Badge>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className="space-y-2">
            {(grouped[t.id] ?? []).length === 0 && (
              <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Nothing here.
              </p>
            )}
            {(grouped[t.id] ?? []).map(n => (
              <Card key={n.id} className={`flex items-start justify-between gap-3 p-4 ${n.read_at ? "opacity-70" : ""}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {n.link && (
                    <Button asChild size="sm" onClick={() => markRead(n.id)}>
                      <Link to={n.link}>{n.action_label || "Open"} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                    </Button>
                  )}
                  {!n.read_at && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}