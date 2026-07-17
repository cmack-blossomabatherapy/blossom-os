import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AssigneePicker } from "@/components/tasks/AssigneePicker";

interface Instance {
  id: string; employee_id: string; checkpoint_key: string;
  scheduled_date: string; due_date: string; status: string;
  risk_level: string; risk_score: number;
  owner_employee_id: string | null; owner_role: string | null;
  resolution_status: string; resolution_note: string | null;
  followup_action: string | null; followup_due_date: string | null;
  employee?: { first_name: string; last_name: string; email: string | null } | null;
  owner?: { first_name: string; last_name: string } | null;
}

const RISK_TONE: Record<string, "default"|"secondary"|"destructive"|"outline"> = {
  normal: "outline", watch: "secondary", support_needed: "default", urgent_review: "destructive",
};

function riskLabel(r: string) {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RbtJourneyConsole() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"elevated"|"unowned"|"overdue"|"all">("elevated");
  const [openId, setOpenId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>({});
  const [followupAction, setFollowupAction] = useState<Record<string, string>>({});
  const [followupDate, setFollowupDate] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("rbt_journey_instances" as any).select(`
      *,
      employee:employees!rbt_journey_instances_employee_id_fkey(first_name,last_name,email),
      owner:employees!rbt_journey_instances_owner_employee_id_fkey(first_name,last_name)
    `).order("scheduled_date", { ascending: false }).limit(500);
    setRows(((data as any) ?? []) as Instance[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "elevated") return r.risk_level !== "normal" && r.resolution_status !== "resolved";
      if (filter === "unowned") return r.risk_level !== "normal" && !r.owner_employee_id && r.resolution_status !== "resolved";
      if (filter === "overdue") return r.status === "overdue" || (r.followup_due_date && r.followup_due_date < new Date().toISOString().slice(0, 10) && r.resolution_status !== "resolved");
      return true;
    });
  }, [rows, filter]);

  const trends = useMemo(() => {
    const total = rows.length;
    const byRisk = { normal: 0, watch: 0, support_needed: 0, urgent_review: 0 } as Record<string, number>;
    const byCkpt = new Map<string, { total: number; elevated: number }>();
    let unownedElevated = 0, openFollowups = 0;
    rows.forEach((r) => {
      byRisk[r.risk_level] = (byRisk[r.risk_level] ?? 0) + 1;
      const b = byCkpt.get(r.checkpoint_key) ?? { total: 0, elevated: 0 };
      b.total++; if (r.risk_level !== "normal") b.elevated++;
      byCkpt.set(r.checkpoint_key, b);
      if (r.risk_level !== "normal" && !r.owner_employee_id && r.resolution_status !== "resolved") unownedElevated++;
      if (r.resolution_status !== "resolved" && (r.status === "overdue" || r.risk_level !== "normal")) openFollowups++;
    });
    return { total, byRisk, byCkpt: Array.from(byCkpt.entries()), unownedElevated, openFollowups };
  }, [rows]);

  const setOwner = async (id: string, ownerId: string | null) => {
    const { error } = await supabase.from("rbt_journey_instances" as any).update({ owner_employee_id: ownerId }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Owner updated"); void load();
  };
  const setRisk = async (id: string, level: string) => {
    const inst = rows.find((r) => r.id === id);
    if (level !== "normal" && !inst?.owner_employee_id) {
      return toast.error("Assign an owner first — elevated risk requires accountability.");
    }
    const { error } = await supabase.from("rbt_journey_instances" as any).update({ risk_level: level }).eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };
  const saveFollowup = async (id: string) => {
    const { error } = await supabase.from("rbt_journey_instances" as any).update({
      followup_action: followupAction[id] || null,
      followup_due_date: followupDate[id] || null,
      resolution_status: "in_progress",
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Follow-up saved"); void load();
  };
  const resolve = async (id: string) => {
    const note = resolutionNote[id]?.trim();
    if (!note) return toast.error("Add a resolution note before closing.");
    const { error } = await supabase.from("rbt_journey_instances" as any).update({
      resolution_status: "resolved", resolution_note: note, resolved_by: user?.id,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked resolved"); void load();
  };
  const logOutreach = async (id: string, note: string, channel: string) => {
    const { error } = await supabase.from("rbt_journey_outreach" as any).insert({
      instance_id: id, actor_id: user?.id, channel, note, outcome: "reached",
    });
    if (error) return toast.error(error.message);
    toast.success("Outreach logged");
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">RBT First 90 Days</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Supportive check-ins during each new RBT's first 90 days. Elevated risk always requires an assigned owner.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active check-ins</p><p className="text-2xl font-semibold tracking-tight">{trends.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Support needed</p><p className="text-2xl font-semibold tracking-tight">{trends.byRisk.support_needed}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Urgent review</p><p className="text-2xl font-semibold tracking-tight text-destructive">{trends.byRisk.urgent_review}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Unowned elevated</p><p className={`text-2xl font-semibold tracking-tight ${trends.unownedElevated ? "text-destructive" : ""}`}>{trends.unownedElevated}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Trends by checkpoint</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            {trends.byCkpt.sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border/70 p-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{k.replace(/_/g, " ")}</p>
                <p className="text-sm mt-1"><span className="font-semibold">{v.elevated}</span> <span className="text-muted-foreground">of {v.total} elevated</span></p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="elevated">Elevated ({rows.filter((r) => r.risk_level !== "normal" && r.resolution_status !== "resolved").length})</TabsTrigger>
          <TabsTrigger value="unowned">Unowned ({trends.unownedElevated})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-4 space-y-2">
          {visible.length === 0 && <p className="text-sm text-muted-foreground">No check-ins match this filter.</p>}
          {visible.map((r) => {
            const isOpen = openId === r.id;
            return (
              <div key={r.id} className="rounded-xl border border-border/70">
                <button onClick={() => setOpenId(isOpen ? null : r.id)} className="w-full p-4 flex items-center gap-3 flex-wrap text-left">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.employee?.first_name} {r.employee?.last_name} <span className="text-muted-foreground font-normal">· {r.checkpoint_key.replace(/_/g, " ")}</span></p>
                    <p className="text-xs text-muted-foreground">
                      Scheduled {new Date(r.scheduled_date).toLocaleDateString()} · Due {new Date(r.due_date).toLocaleDateString()}
                      {r.owner?.first_name && ` · Owner ${r.owner.first_name} ${r.owner.last_name}`}
                    </p>
                  </div>
                  <Badge variant={RISK_TONE[r.risk_level] as any}>{riskLabel(r.risk_level)}</Badge>
                  <Badge variant="outline" className="capitalize">{r.status}</Badge>
                  <Badge variant={r.resolution_status === "resolved" ? "secondary" : "outline"} className="capitalize">{r.resolution_status.replace(/_/g, " ")}</Badge>
                </button>

                {isOpen && (
                  <div className="border-t border-border/70 p-4 space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Owner</p>
                        <AssigneePicker value={r.owner_employee_id ?? undefined} onChange={(id: any) => setOwner(r.id, id ?? null)} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Risk level</p>
                        <div className="flex flex-wrap gap-1.5">
                          {["normal","watch","support_needed","urgent_review"].map((l) => (
                            <Button key={l} size="sm" variant={r.risk_level === l ? "default" : "outline"} onClick={() => setRisk(r.id, l)}>
                              {riskLabel(l)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Follow-up due</p>
                        <Input type="date" value={followupDate[r.id] ?? r.followup_due_date ?? ""} onChange={(e) => setFollowupDate((d) => ({ ...d, [r.id]: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Follow-up action</p>
                      <Textarea rows={2} value={followupAction[r.id] ?? r.followup_action ?? ""} onChange={(e) => setFollowupAction((d) => ({ ...d, [r.id]: e.target.value }))} placeholder="What will you do to support this RBT?" />
                      <div className="flex justify-end mt-2"><Button size="sm" variant="outline" onClick={() => saveFollowup(r.id)}>Save follow-up</Button></div>
                    </div>
                    <OutreachLog instanceId={r.id} onLog={logOutreach} />
                    {r.resolution_status !== "resolved" && (
                      <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                        <Textarea rows={2} value={resolutionNote[r.id] ?? ""} onChange={(e) => setResolutionNote((n) => ({ ...n, [r.id]: e.target.value }))} placeholder="Resolution note (required to close)…" />
                        <div className="flex justify-end"><Button size="sm" onClick={() => resolve(r.id)}>Mark resolved</Button></div>
                      </div>
                    )}
                    {r.resolution_status === "resolved" && r.resolution_note && (
                      <p className="text-sm text-muted-foreground italic">Resolved: {r.resolution_note}</p>
                    )}
                    <AuditTrail instanceId={r.id} />
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OutreachLog({ instanceId, onLog }: { instanceId: string; onLog: (id: string, note: string, channel: string) => Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [note, setNote] = useState(""); const [channel, setChannel] = useState("call");
  useEffect(() => {
    void supabase.from("rbt_journey_outreach" as any).select("*").eq("instance_id", instanceId)
      .order("occurred_at", { ascending: false })
      .then(({ data }) => setRows((data as any) ?? []));
  }, [instanceId]);
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Outreach</p>
      <div className="flex gap-2 items-start">
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-md border bg-background text-sm h-9 px-2">
          <option value="call">Call</option><option value="text">Text</option><option value="email">Email</option><option value="in_person">In person</option>
        </select>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened?" />
        <Button size="sm" onClick={async () => { if (!note.trim()) return; await onLog(instanceId, note, channel); setNote(""); const { data } = await supabase.from("rbt_journey_outreach" as any).select("*").eq("instance_id", instanceId).order("occurred_at", { ascending: false }); setRows((data as any) ?? []); }}>Log</Button>
      </div>
      {rows.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {rows.slice(0, 6).map((o) => (
            <li key={o.id} className="text-muted-foreground"><span className="capitalize">{o.channel}</span> · {new Date(o.occurred_at).toLocaleString()} — {o.note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AuditTrail({ instanceId }: { instanceId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    void supabase.from("rbt_journey_audit" as any).select("*").eq("instance_id", instanceId)
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setRows((data as any) ?? []));
  }, [instanceId]);
  if (!rows.length) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">History</p>
      <ul className="text-xs space-y-1">
        {rows.map((a) => (
          <li key={a.id} className="text-muted-foreground">{new Date(a.created_at).toLocaleString()} — {a.event.replace(/_/g, " ")}</li>
        ))}
      </ul>
    </div>
  );
}