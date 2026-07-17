import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OSShellPage } from "@/pages/os/OSShellPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

type Stage = {
  key: string;
  name: string;
  description: string | null;
  sort_order: number;
  employee_message: string | null;
  required_approver_role: string | null;
  is_terminal: boolean;
  is_active: boolean;
  allowed_next_keys: string[];
  required_gates: Array<{ key: string; label: string }>;
  menu_features: string[];
  color: string | null;
};

type SyntheticProfile = { id: string; display_name: string; stage_key: string; notes: string | null };
type LifecycleEvent = {
  id: string; employee_id: string; from_stage: string | null; to_stage: string;
  actor_id: string | null; reason: string | null; source: string; occurred_at: string;
};

export default function RbtLifecycle() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [synthetic, setSynthetic] = useState<SyntheticProfile[]>([]);
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Stage | null>(null);
  const [advancing, setAdvancing] = useState<SyntheticProfile | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, p, e] = await Promise.all([
      supabase.from("rbt_lifecycle_stages" as any).select("*").order("sort_order"),
      supabase.from("rbt_synthetic_test_profiles" as any).select("*").order("display_name"),
      supabase.from("rbt_lifecycle_events" as any).select("*").order("occurred_at", { ascending: false }).limit(50),
    ]);
    if (s.error) toast.error(s.error.message);
    setStages((s.data as any) ?? []);
    setSynthetic((p.data as any) ?? []);
    setEvents((e.data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stageByKey = useMemo(() => Object.fromEntries(stages.map((s) => [s.key, s])), [stages]);

  return (
    <OSShellPage>
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">RBT Lifecycle Engine</h1>
            <p className="text-sm text-muted-foreground">
              Configure stages, gates, and approvers. Every transition is audited.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </header>

        <Tabs defaultValue="stages">
          <TabsList>
            <TabsTrigger value="stages">Stages ({stages.length})</TabsTrigger>
            <TabsTrigger value="cohort">Test Cohort ({synthetic.length})</TabsTrigger>
            <TabsTrigger value="audit">Audit Log ({events.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="stages" className="mt-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading stages…
              </div>
            ) : (
              <div className="grid gap-3">
                {stages.map((s) => (
                  <Card key={s.key} className="p-4 flex items-start gap-4 hover:shadow-md transition">
                    <div className="w-10 text-xs text-muted-foreground font-mono">{s.sort_order}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{s.name}</span>
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.key}</code>
                        {s.is_terminal && <Badge variant="outline" className="text-xs">Terminal</Badge>}
                        {!s.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                        {s.required_approver_role && (
                          <Badge variant="secondary" className="text-xs">
                            <ShieldCheck className="h-3 w-3 mr-1" /> {s.required_approver_role}
                          </Badge>
                        )}
                      </div>
                      {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                      <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Gates: <b>{s.required_gates.length}</b></span>
                        <span>Next: <b>{s.allowed_next_keys.length}</b></span>
                        <span>Menu: <b>{s.menu_features.join(", ") || "—"}</b></span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>Edit</Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cohort" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Safe synthetic RBTs — one per stage. Use these to preview the RBT experience or test transitions.
            </p>
            <div className="grid gap-2">
              {synthetic.map((p) => {
                const cfg = stageByKey[p.stage_key];
                return (
                  <Card key={p.id} className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{p.display_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {cfg?.name ?? p.stage_key} · <code className="text-[10px]">{p.stage_key}</code>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setAdvancing(p)}>
                      Advance <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <div className="space-y-1">
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground">No transitions recorded yet.</p>
              )}
              {events.map((e) => (
                <div key={e.id} className="text-xs flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50">
                  <span className="text-muted-foreground w-40 shrink-0">
                    {new Date(e.occurred_at).toLocaleString()}
                  </span>
                  <code className="text-[10px] text-muted-foreground truncate w-32">{e.employee_id.slice(0, 8)}…</code>
                  <span>{e.from_stage ?? "—"}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium">{e.to_stage}</span>
                  <Badge variant="outline" className="text-[10px]">{e.source}</Badge>
                  {e.reason && <span className="text-muted-foreground italic truncate">"{e.reason}"</span>}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {editing && <StageEditor stage={editing} allStages={stages} onClose={() => setEditing(null)} onSaved={load} />}
      {advancing && (
        <AdvanceDialog
          profile={advancing}
          stages={stages}
          onClose={() => setAdvancing(null)}
          onDone={load}
        />
      )}
    </OSShellPage>
  );
}

function StageEditor({
  stage, allStages, onClose, onSaved,
}: { stage: Stage; allStages: Stage[]; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Stage>(stage);
  const [saving, setSaving] = useState(false);
  const [gatesText, setGatesText] = useState(JSON.stringify(draft.required_gates, null, 2));
  const [nextText, setNextText] = useState(draft.allowed_next_keys.join(", "));
  const [menuText, setMenuText] = useState(draft.menu_features.join(", "));

  const save = async () => {
    setSaving(true);
    let gates: any;
    try { gates = JSON.parse(gatesText); } catch { toast.error("Required gates must be valid JSON"); setSaving(false); return; }
    const patch = {
      name: draft.name,
      description: draft.description,
      sort_order: draft.sort_order,
      employee_message: draft.employee_message,
      required_approver_role: draft.required_approver_role || null,
      is_terminal: draft.is_terminal,
      is_active: draft.is_active,
      required_gates: gates,
      allowed_next_keys: nextText.split(",").map((s) => s.trim()).filter(Boolean),
      menu_features: menuText.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const { error } = await supabase.from("rbt_lifecycle_stages" as any).update(patch).eq("key", stage.key);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Stage saved");
    onSaved(); onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit stage · <code className="text-xs">{stage.key}</code></DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs">Name</label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><label className="text-xs">Sort order</label>
              <Input type="number" value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></div>
          </div>
          <div><label className="text-xs">Description</label>
            <Textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
          <div><label className="text-xs">Employee-facing message</label>
            <Textarea value={draft.employee_message ?? ""} onChange={(e) => setDraft({ ...draft, employee_message: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs">Required approver role</label>
              <Input value={draft.required_approver_role ?? ""} placeholder="admin / hr / scheduling…"
                onChange={(e) => setDraft({ ...draft, required_approver_role: e.target.value })} /></div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} /> Active
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={draft.is_terminal} onCheckedChange={(v) => setDraft({ ...draft, is_terminal: v })} /> Terminal
              </label>
            </div>
          </div>
          <div><label className="text-xs">Allowed next stages (comma-separated keys)</label>
            <Input value={nextText} onChange={(e) => setNextText(e.target.value)}
              placeholder={allStages.map((s) => s.key).slice(0, 3).join(", ")} /></div>
          <div><label className="text-xs">Menu features (comma-separated)</label>
            <Input value={menuText} onChange={(e) => setMenuText(e.target.value)}
              placeholder="home, schedule, learn, support, me" /></div>
          <div><label className="text-xs">Required gates (JSON array of {"{ key, label }"})</label>
            <Textarea rows={5} className="font-mono text-xs"
              value={gatesText} onChange={(e) => setGatesText(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdvanceDialog({
  profile, stages, onClose, onDone,
}: { profile: SyntheticProfile; stages: Stage[]; onClose: () => void; onDone: () => void }) {
  const current = stages.find((s) => s.key === profile.stage_key);
  const nextOptions = current
    ? stages.filter((s) => current.allowed_next_keys.includes(s.key))
    : stages;
  const [target, setTarget] = useState<string>(nextOptions[0]?.key ?? "");
  const [reason, setReason] = useState("");
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gateStatus, setGateStatus] = useState<Record<string, boolean>>({});

  const targetStage = stages.find((s) => s.key === target);

  useEffect(() => {
    if (!targetStage) return;
    (async () => {
      const { data } = await supabase
        .from("rbt_lifecycle_gate_completions" as any)
        .select("gate_key")
        .eq("employee_id", profile.id)
        .eq("stage_key", target);
      const done = new Set((data as any)?.map((r: any) => r.gate_key) ?? []);
      const map: Record<string, boolean> = {};
      for (const g of targetStage.required_gates) map[g.key] = done.has(g.key);
      setGateStatus(map);
    })();
  }, [target, profile.id, targetStage]);

  const completeGate = async (gateKey: string) => {
    const { error } = await supabase.from("rbt_lifecycle_gate_completions" as any).insert({
      employee_id: profile.id, stage_key: target, gate_key: gateKey,
    });
    if (error) return toast.error(error.message);
    setGateStatus((g) => ({ ...g, [gateKey]: true }));
  };

  const advance = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("advance_rbt_lifecycle" as any, {
      _employee_id: profile.id,
      _to_stage: target,
      _reason: reason || null,
      _override: override,
      _source: "admin_console",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Moved to ${targetStage?.name}`);
    onDone(); onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Advance · {profile.display_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Current: <b>{current?.name ?? profile.stage_key}</b>
          </div>
          <div>
            <label className="text-xs">Move to</label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(override ? stages : nextOptions).map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {targetStage && targetStage.required_gates.length > 0 && (
            <div className="rounded-md border p-3 space-y-1.5">
              <div className="text-xs font-medium">Required gates</div>
              {targetStage.required_gates.map((g) => (
                <div key={g.key} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${gateStatus[g.key] ? "text-emerald-600" : "text-muted-foreground/40"}`} />
                    {g.label}
                  </span>
                  {!gateStatus[g.key] && (
                    <Button size="sm" variant="ghost" onClick={() => completeGate(g.key)}>Mark complete</Button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div>
            <label className="text-xs">Reason (optional)</label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={override} onCheckedChange={setOverride} /> Admin override (bypass gates & allow-list)
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={advance} disabled={busy || !target}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Advance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}