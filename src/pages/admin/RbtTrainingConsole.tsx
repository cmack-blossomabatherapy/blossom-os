import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Pathway { id: string; key: string; name: string; description: string | null; is_active: boolean; }

export default function RbtTrainingConsole() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"assignments" | "rules">("assignments");
  const [pathways, setPathways] = useState<Pathway[]>([]);

  useEffect(() => {
    void supabase.from("rbt_pathways" as any).select("*").order("name")
      .then(({ data }) => setPathways(((data as any[]) ?? []) as Pathway[]));
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">RBT Training</h1>
        <p className="text-sm text-muted-foreground">
          Assign pathways, configure eligibility rules, and monitor journeys.
        </p>
      </div>
      <div className="flex gap-2 border-b border-border">
        {(["assignments","rules"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-sm px-3 py-1.5 border-b-2 -mb-px capitalize ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>
            {t === "assignments" ? "Assignments" : "Eligibility rules"}
          </button>
        ))}
      </div>
      {tab === "assignments" && <Assignments pathways={pathways} adminId={user!.id} />}
      {tab === "rules" && <Rules pathways={pathways} />}
    </div>
  );
}

function Assignments({ pathways, adminId }: { pathways: Pathway[]; adminId: string }) {
  const [rbts, setRbts] = useState<any[]>([]);
  const [assigns, setAssigns] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<any | null>(null);

  async function load() {
    const [{ data: emp }, { data: a }] = await Promise.all([
      supabase.from("employees" as any).select("id,first_name,last_name,email,role")
        .in("role", ["rbt","registered_behavior_technician"]).order("last_name").limit(500),
      supabase.from("rbt_pathway_assignments" as any)
        .select("employee_id,pathway_id,active,assigned_at,pathway:rbt_pathways!inner(name)").eq("active", true),
    ]);
    setRbts((emp as any[]) ?? []);
    setAssigns((a as any[]) ?? []);
  }
  useEffect(() => { void load(); }, []);

  const map = useMemo(() => {
    const m = new Map<string, any>();
    assigns.forEach((a) => m.set(a.employee_id, a));
    return m;
  }, [assigns]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rbts;
    return rbts.filter((r) => `${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(t));
  }, [rbts, q]);

  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      <div className="p-3 border-b border-border/70">
        <Input placeholder="Search RBTs…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ul className="divide-y divide-border/70 max-h-[70vh] overflow-y-auto">
        {filtered.map((r) => {
          const cur = map.get(r.id);
          return (
            <li key={r.id} className="px-4 py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{r.first_name} {r.last_name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.email}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                {cur ? cur.pathway.name : "No pathway"}
              </div>
              <Button variant="outline" size="sm" onClick={() => setTarget(r)}>
                {cur ? "Change" : "Assign"}
              </Button>
            </li>
          );
        })}
      </ul>
      {target && (
        <AssignDialog
          employee={target} pathways={pathways} adminId={adminId} current={map.get(target.id) ?? null}
          onClose={() => setTarget(null)}
          onSaved={() => { setTarget(null); void load(); }}
        />
      )}
    </div>
  );
}

function AssignDialog({ employee, pathways, adminId, current, onClose, onSaved }:
  { employee: any; pathways: Pathway[]; adminId: string; current: any | null; onClose: () => void; onSaved: () => void }) {
  const [pid, setPid] = useState<string>(current?.pathway_id ?? pathways[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!pid) return;
    setSaving(true);
    if (current) {
      await supabase.from("rbt_pathway_assignments" as any)
        .update({ active: false }).eq("employee_id", employee.id).eq("active", true);
    }
    const { error } = await supabase.from("rbt_pathway_assignments" as any).insert({
      employee_id: employee.id, pathway_id: pid, assigned_by: adminId, notes: notes.trim() || null, active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Pathway assigned");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign pathway to {employee.first_name} {employee.last_name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={pid} onValueChange={setPid}>
            <SelectTrigger><SelectValue placeholder="Pathway" /></SelectTrigger>
            <SelectContent>
              {pathways.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Assignment notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving || !pid}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Rules({ pathways }: { pathways: Pathway[] }) {
  const [rules, setRules] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  async function load() {
    const { data } = await supabase.from("rbt_pathway_eligibility_rules" as any)
      .select("*, pathway:rbt_pathways!inner(name)").order("priority");
    setRules((data as any[]) ?? []);
  }
  useEffect(() => { void load(); }, []);

  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      <div className="p-3 border-b border-border/70 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Rules run in priority order. First match wins for auto-assignment.
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>+ New rule</Button>
      </div>
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center p-8">No rules configured.</p>
      ) : (
        <ul className="divide-y divide-border/70">
          {rules.map((r) => (
            <li key={r.id} className="px-4 py-3 flex items-center gap-3">
              <span className="text-xs tabular-nums w-8 text-muted-foreground">{r.priority}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">→ {r.pathway.name}</p>
              </div>
              <span className={`text-xs ${r.is_active ? "text-emerald-600" : "text-muted-foreground"}`}>
                {r.is_active ? "Active" : "Inactive"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {creating && <RuleDialog pathways={pathways} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); void load(); }} />}
    </div>
  );
}

function RuleDialog({ pathways, onClose, onSaved }: { pathways: Pathway[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [pid, setPid] = useState(pathways[0]?.id ?? "");
  const [priority, setPriority] = useState(100);
  const [criteria, setCriteria] = useState('{"experience_level":"experienced"}');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim() || !pid) return;
    let parsed: any = {};
    try { parsed = JSON.parse(criteria); } catch { return toast.error("Criteria must be valid JSON."); }
    setSaving(true);
    const { error } = await supabase.from("rbt_pathway_eligibility_rules" as any).insert({
      name, pathway_id: pid, priority, criteria: parsed, is_active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Rule created");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New eligibility rule</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Rule name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={pid} onValueChange={setPid}>
            <SelectTrigger><SelectValue placeholder="Pathway" /></SelectTrigger>
            <SelectContent>
              {pathways.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Priority (lower = earlier)</label>
            <Input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Criteria (JSON)</label>
            <textarea rows={4}
              className="w-full rounded-md border border-border bg-background p-2 text-sm font-mono"
              value={criteria} onChange={(e) => setCriteria(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}