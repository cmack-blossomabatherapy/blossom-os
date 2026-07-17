import { useEffect, useMemo, useState } from "react";
import { OSShellPage } from "@/pages/os/OSShellPage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { SKILL_META, type SkillState, STEP_META, type PathwayStepStatus } from "@/pages/rbt/app/training/types";

const SKILL_STATES: SkillState[] = ["introduced","practiced","observed","demonstrated","needs_reinforcement","competent"];

export default function RbtEvaluatorConsole() {
  const { user } = useAuth();
  const [rbts, setRbts] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    void supabase.from("employees" as any)
      .select("id,first_name,last_name,role,email")
      .in("role", ["rbt","registered_behavior_technician"])
      .order("last_name")
      .limit(500)
      .then(({ data }) => setRbts((data as any[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rbts;
    return rbts.filter((r) => `${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(t));
  }, [rbts, q]);

  return (
    <OSShellPage title="RBT Evaluator Console" subtitle="Record skill evaluations, complete steps, assign remediation.">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-border/70 bg-card p-3">
          <Input placeholder="Search RBTs…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-2" />
          <ul className="max-h-[70vh] overflow-y-auto divide-y divide-border/70">
            {filtered.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelected(r)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/60 transition ${selected?.id === r.id ? "bg-muted" : ""}`}>
                  <p className="text-sm font-medium">{r.first_name} {r.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section>
          {selected ? <EvaluatorDetail employee={selected} evaluatorId={user!.id} /> : (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Select an RBT to view their program.
            </div>
          )}
        </section>
      </div>
    </OSShellPage>
  );
}

function EvaluatorDetail({ employee, evaluatorId }: { employee: any; evaluatorId: string }) {
  const [tab, setTab] = useState<"program" | "skills" | "remediation">("program");
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Employee</p>
        <p className="text-lg font-semibold tracking-tight">{employee.first_name} {employee.last_name}</p>
      </div>
      <div className="flex gap-2 border-b border-border">
        {(["program","skills","remediation"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-sm px-3 py-1.5 border-b-2 -mb-px capitalize ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "program" && <ProgramReview employeeId={employee.id} evaluatorId={evaluatorId} />}
      {tab === "skills" && <SkillsReview employeeId={employee.id} evaluatorId={evaluatorId} />}
      {tab === "remediation" && <RemediationPanel employeeId={employee.id} evaluatorId={evaluatorId} />}
    </div>
  );
}

function ProgramReview({ employeeId, evaluatorId }: { employeeId: string; evaluatorId: string }) {
  const [rows, setRows] = useState<any[] | null>(null);
  async function load() {
    const { data: assign } = await supabase.from("rbt_pathway_assignments" as any)
      .select("pathway_id, pathway:rbt_pathways!inner(name)").eq("employee_id", employeeId).eq("active", true).maybeSingle();
    if (!assign) { setRows([]); return; }
    const [{ data: steps }, { data: prog }] = await Promise.all([
      supabase.from("rbt_pathway_steps" as any).select("*").eq("pathway_id", (assign as any).pathway_id).order("order_index"),
      supabase.from("rbt_pathway_progress" as any).select("*").eq("employee_id", employeeId),
    ]);
    const pmap = new Map(((prog as any[]) ?? []).map((p) => [p.pathway_step_id, p]));
    setRows(((steps as any[]) ?? []).map((s) => ({ step: s, progress: pmap.get(s.id) })));
  }
  useEffect(() => { void load(); }, [employeeId]);

  async function setStatus(stepId: string, status: PathwayStepStatus, progressId: string | null) {
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (status === "complete") { payload.completed_at = new Date().toISOString(); payload.completed_by = evaluatorId; }
    const q = progressId
      ? supabase.from("rbt_pathway_progress" as any).update(payload).eq("id", progressId)
      : supabase.from("rbt_pathway_progress" as any).insert({ ...payload, employee_id: employeeId, pathway_step_id: stepId });
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Updated");
    void load();
  }

  if (rows === null) return <div className="h-32 bg-muted rounded-lg animate-pulse" />;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No pathway assigned.</p>;

  return (
    <ol className="divide-y divide-border/70">
      {rows.map(({ step, progress }) => {
        const status = (progress?.status ?? "not_started") as PathwayStepStatus;
        return (
          <li key={step.id} className="py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{step.title}</p>
              <p className="text-xs text-muted-foreground">
                <span className={STEP_META[status].tone}>{STEP_META[status].label}</span>
                {step.delivery_mode && <> · {step.delivery_mode.replace("_"," ")}</>}
              </p>
            </div>
            <Select value={status} onValueChange={(v) => setStatus(step.id, v as PathwayStepStatus, progress?.id ?? null)}>
              <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STEP_META) as PathwayStepStatus[]).map((k) => (
                  <SelectItem key={k} value={k}>{STEP_META[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </li>
        );
      })}
    </ol>
  );
}

function SkillsReview({ employeeId, evaluatorId }: { employeeId: string; evaluatorId: string }) {
  const [defs, setDefs] = useState<any[]>([]);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [openSkill, setOpenSkill] = useState<any | null>(null);

  async function load() {
    const [d, s] = await Promise.all([
      supabase.from("rbt_skill_definitions" as any).select("*").eq("is_active", true).order("sort_order"),
      supabase.from("rbt_skill_status" as any).select("skill_key,state").eq("employee_id", employeeId),
    ]);
    setDefs((d.data as any[]) ?? []);
    const map: Record<string, string> = {};
    ((s.data as any[]) ?? []).forEach((r) => { map[r.skill_key] = r.state; });
    setStatus(map);
  }
  useEffect(() => { void load(); }, [employeeId]);

  return (
    <>
      <ul className="divide-y divide-border/70">
        {defs.map((d) => {
          const st = (status[d.key] ?? "introduced") as SkillState;
          return (
            <li key={d.key} className="py-3 flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${SKILL_META[st].dot}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{d.label}</p>
                <p className={`text-xs ${SKILL_META[st].tone}`}>{SKILL_META[st].label}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setOpenSkill(d)}>Evaluate</Button>
            </li>
          );
        })}
      </ul>
      {openSkill && (
        <EvaluationDialog
          def={openSkill}
          employeeId={employeeId}
          evaluatorId={evaluatorId}
          onClose={() => setOpenSkill(null)}
          onSaved={() => { setOpenSkill(null); void load(); }}
        />
      )}
    </>
  );
}

function EvaluationDialog({ def, employeeId, evaluatorId, onClose, onSaved }:
  { def: any; employeeId: string; evaluatorId: string; onClose: () => void; onSaved: () => void }) {
  const [rating, setRating] = useState<SkillState>("practiced");
  const [context, setContext] = useState("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("rbt_skill_evaluations" as any).insert({
      employee_id: employeeId, evaluator_id: evaluatorId, skill_key: def.key,
      rating, context: context.trim() || null, notes: notes.trim() || null,
      follow_up_action: followUp.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Evaluation recorded");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Evaluate: {def.label}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Rating</label>
            <Select value={rating} onValueChange={(v) => setRating(v as SkillState)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SKILL_STATES.map((k) => <SelectItem key={k} value={k}>{SKILL_META[k].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Context</label>
            <Input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Session, role-play, competency, etc." />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Notes</label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Follow-up action</label>
            <Input value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>Save evaluation</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RemediationPanel({ employeeId, evaluatorId }: { employeeId: string; evaluatorId: string }) {
  const [items, setItems] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("rbt_remediation_assignments" as any)
      .select("*").eq("employee_id", employeeId).order("assigned_at", { ascending: false });
    setItems((data as any[]) ?? []);
  }
  useEffect(() => { void load(); }, [employeeId]);

  async function assign() {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("rbt_remediation_assignments" as any).insert({
      employee_id: employeeId, assigned_by: evaluatorId, title, reason: reason.trim() || null, status: "assigned",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Remediation assigned");
    setTitle(""); setReason(""); setOpen(false); void load();
  }

  async function complete(id: string) {
    const { error } = await supabase.from("rbt_remediation_assignments" as any)
      .update({ status: "complete", completed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>+ Assign remediation</Button>
      </div>
      {items?.length === 0 && <p className="text-sm text-muted-foreground">No remediation on record.</p>}
      <ul className="divide-y divide-border/70">
        {items?.map((r) => (
          <li key={r.id} className="py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{r.title}</p>
              {r.reason && <p className="text-xs text-muted-foreground truncate">{r.reason}</p>}
            </div>
            <span className="text-xs text-muted-foreground capitalize">{r.status.replace("_"," ")}</span>
            {r.status !== "complete" && <Button variant="outline" size="sm" onClick={() => complete(r.id)}>Complete</Button>}
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign remediation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title (e.g., Re-practice pairing)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea rows={3} placeholder="Reason / what to work on" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={assign} disabled={saving || !title.trim()}>Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}