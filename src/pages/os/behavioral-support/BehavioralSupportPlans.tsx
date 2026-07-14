import { useEffect, useState } from "react";
import { OSShell } from "../OSShell";
import { FileSignature, Plus, RefreshCw, Loader2 } from "lucide-react";
import { useBehavioralSupportData } from "./useBehavioralSupportData";
import { PLAN_STATUSES, TASK_STATUSES, type BSPlan, type BSPlanStatus, type BSTaskStatus } from "./behavioralSupportTypes";
import { BehavioralSupportTaskDialog } from "./_dialogs";

export default function BehavioralSupportPlans() {
  const bs = useBehavioralSupportData();
  const [showForm, setShowForm] = useState(false);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  const openPlan = bs.plans.find((p) => p.id === openPlanId) ?? null;

  return (
    <OSShell>
      <div className="space-y-6 p-6 mx-auto w-full max-w-6xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <FileSignature className="h-4 w-4" /> Behavioral Support
            </div>
            <h1 className="text-2xl font-semibold mt-1">Support Plans</h1>
            <p className="text-sm text-muted-foreground mt-1">Behavioral support plans with goals, strategies, and follow-up tasks.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void bs.refresh()} className="text-xs border border-border rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${bs.loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={() => setShowForm(true)} className="text-xs bg-primary text-primary-foreground rounded-md px-3 py-1.5 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New plan
            </button>
          </div>
        </header>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {bs.loading ? (
            <div className="p-4 space-y-2">{[0,1,2].map((i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}</div>
          ) : bs.plans.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">
              No support plans yet. Create one from a crisis, escalation, or directly here.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Plan</th>
                  <th className="px-3 py-2 text-left">Client</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">BCBA owner</th>
                  <th className="px-3 py-2 text-left">Review due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bs.plans.map((p) => (
                  <tr key={p.id} className="cursor-pointer hover:bg-accent/40" onClick={() => setOpenPlanId(p.id)}>
                    <td className="px-3 py-2 font-medium">{p.plan_title}</td>
                    <td className="px-3 py-2">{p.client_name}</td>
                    <td className="px-3 py-2">
                      <select
                        value={p.plan_status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => void bs.updatePlan(p.id, { plan_status: e.target.value as BSPlanStatus })}
                        className="bg-background border border-border rounded px-1.5 py-0.5 text-xs"
                      >
                        {PLAN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.bcba_owner ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.review_due_at ? new Date(p.review_due_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showForm && <NewPlanDialog onClose={() => setShowForm(false)} bs={bs} />}
        {openPlan && <PlanDrawer plan={openPlan} bs={bs} onClose={() => setOpenPlanId(null)} />}
      </div>
    </OSShell>
  );
}

function PlanDrawer({ plan, bs, onClose }: { plan: BSPlan; bs: ReturnType<typeof useBehavioralSupportData>; onClose: () => void }) {
  const tasks = bs.planTasks.filter((t) => t.plan_id === plan.id);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    plan_title: plan.plan_title,
    client_name: plan.client_name,
    bcba_owner: plan.bcba_owner ?? "",
    plan_status: plan.plan_status,
    review_due_at: plan.review_due_at ? plan.review_due_at.slice(0, 16) : "",
    reason_for_plan: plan.reason_for_plan ?? "",
    goals: plan.goals.join("\n"),
    strategies: plan.strategies.join("\n"),
    replacement_behaviors: plan.replacement_behaviors.join("\n"),
    family_guidance: plan.family_guidance ?? "",
    rbt_guidance: plan.rbt_guidance ?? "",
  });
  useEffect(() => {
    setForm({
      plan_title: plan.plan_title,
      client_name: plan.client_name,
      bcba_owner: plan.bcba_owner ?? "",
      plan_status: plan.plan_status,
      review_due_at: plan.review_due_at ? plan.review_due_at.slice(0, 16) : "",
      reason_for_plan: plan.reason_for_plan ?? "",
      goals: plan.goals.join("\n"),
      strategies: plan.strategies.join("\n"),
      replacement_behaviors: plan.replacement_behaviors.join("\n"),
      family_guidance: plan.family_guidance ?? "",
      rbt_guidance: plan.rbt_guidance ?? "",
    });
  }, [plan.id, plan.plan_title, plan.client_name, plan.bcba_owner, plan.plan_status, plan.review_due_at, plan.reason_for_plan, plan.goals, plan.strategies, plan.replacement_behaviors, plan.family_guidance, plan.rbt_guidance]);
  const splitLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const canSave = form.plan_title.trim() && form.client_name.trim();
  const savePlan = async () => {
    setSaving(true);
    try {
      await bs.updatePlan(plan.id, {
        plan_title: form.plan_title.trim(),
        client_name: form.client_name.trim(),
        bcba_owner: form.bcba_owner.trim() || null,
        plan_status: form.plan_status,
        review_due_at: form.review_due_at ? new Date(form.review_due_at).toISOString() : null,
        reason_for_plan: form.reason_for_plan.trim() || null,
        goals: splitLines(form.goals),
        strategies: splitLines(form.strategies),
        replacement_behaviors: splitLines(form.replacement_behaviors),
        family_guidance: form.family_guidance.trim() || null,
        rbt_guidance: form.rbt_guidance.trim() || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="bg-card w-full max-w-lg h-full overflow-auto p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{plan.plan_title}</h2>
            <div className="text-xs text-muted-foreground">{plan.client_name} • {plan.plan_status}</div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-xs border border-border rounded px-2 py-1 hover:bg-accent">Edit plan</button>
            ) : (
              <>
                <button
                  onClick={savePlan}
                  disabled={!canSave || saving}
                  className="text-xs bg-primary text-primary-foreground rounded px-2 py-1 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save
                </button>
                <button onClick={() => setEditing(false)} disabled={saving} className="text-xs border border-border rounded px-2 py-1">Cancel</button>
              </>
            )}
            <button onClick={onClose} className="text-sm ml-1">✕</button>
          </div>
        </div>
        {!editing ? (
          <>
            <Field label="Plan title">{plan.plan_title}</Field>
            <Field label="Client">{plan.client_name}</Field>
            <Field label="BCBA owner">{plan.bcba_owner ?? "—"}</Field>
            <Field label="Plan status">{plan.plan_status}</Field>
            <Field label="Review due">{plan.review_due_at ? new Date(plan.review_due_at).toLocaleString() : "—"}</Field>
            <Field label="Reason">{plan.reason_for_plan ?? "—"}</Field>
            <Field label="Goals">
              {plan.goals.length === 0 ? <span className="text-muted-foreground">—</span> : <ul className="list-disc pl-4 text-sm">{plan.goals.map((g, i) => <li key={i}>{g}</li>)}</ul>}
            </Field>
            <Field label="Strategies">
              {plan.strategies.length === 0 ? <span className="text-muted-foreground">—</span> : <ul className="list-disc pl-4 text-sm">{plan.strategies.map((g, i) => <li key={i}>{g}</li>)}</ul>}
            </Field>
            <Field label="Replacement behaviors">
              {plan.replacement_behaviors.length === 0 ? <span className="text-muted-foreground">—</span> : <ul className="list-disc pl-4 text-sm">{plan.replacement_behaviors.map((g, i) => <li key={i}>{g}</li>)}</ul>}
            </Field>
            <Field label="Family guidance">{plan.family_guidance ?? "—"}</Field>
            <Field label="RBT guidance">{plan.rbt_guidance ?? "—"}</Field>
          </>
        ) : (
          <div className="space-y-3">
            <EditInput label="Plan title *" value={form.plan_title} onChange={(v) => setForm({ ...form, plan_title: v })} />
            <EditInput label="Client name *" value={form.client_name} onChange={(v) => setForm({ ...form, client_name: v })} />
            <EditInput label="BCBA owner" value={form.bcba_owner} onChange={(v) => setForm({ ...form, bcba_owner: v })} />
            <label className="text-xs space-y-1 block">
              <span className="text-muted-foreground">Plan status</span>
              <select
                value={form.plan_status}
                onChange={(e) => setForm({ ...form, plan_status: e.target.value as BSPlanStatus })}
                className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
              >
                {PLAN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <EditInput label="Review due" type="datetime-local" value={form.review_due_at} onChange={(v) => setForm({ ...form, review_due_at: v })} />
            <EditTextarea label="Reason for plan" value={form.reason_for_plan} onChange={(v) => setForm({ ...form, reason_for_plan: v })} />
            <EditTextarea label="Goals (one per line)" value={form.goals} onChange={(v) => setForm({ ...form, goals: v })} />
            <EditTextarea label="Strategies (one per line)" value={form.strategies} onChange={(v) => setForm({ ...form, strategies: v })} />
            <EditTextarea label="Replacement behaviors (one per line)" value={form.replacement_behaviors} onChange={(v) => setForm({ ...form, replacement_behaviors: v })} />
            <EditTextarea label="Family guidance" value={form.family_guidance} onChange={(v) => setForm({ ...form, family_guidance: v })} />
            <EditTextarea label="RBT guidance" value={form.rbt_guidance} onChange={(v) => setForm({ ...form, rbt_guidance: v })} />
          </div>
        )}

        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Tasks</h3>
            <button
              onClick={() => setTaskOpen(true)}
              className="text-xs text-primary hover:underline"
            >+ Add task</button>
          </div>
          {tasks.length === 0 ? (
            <div className="text-xs text-muted-foreground">No tasks yet.</div>
          ) : (
            <ul className="space-y-1.5">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2 text-sm rounded-md border border-border/70 p-2">
                  <div className="min-w-0 flex-1">
                    <div className={t.status === "completed" ? "line-through text-muted-foreground" : "font-medium"}>{t.task_title}</div>
                    {t.task_description && <div className="text-xs text-muted-foreground mt-0.5">{t.task_description}</div>}
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                      {t.assigned_to_name && <span>Owner: {t.assigned_to_name}</span>}
                      {t.due_at && <span>Due: {new Date(t.due_at).toLocaleDateString()}</span>}
                      {t.status === "completed" && t.completed_at && <span>Completed: {new Date(t.completed_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <select
                    value={t.status}
                    onChange={(e) => void bs.updatePlanTask(t.id, {
                      status: e.target.value as BSTaskStatus,
                      ...(e.target.value === "completed"
                        ? { completed_at: new Date().toISOString() }
                        : t.status === "completed" ? { completed_at: null } : {}),
                    })}
                    className="bg-background border border-border rounded px-1.5 py-0.5 text-xs"
                  >
                    {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </div>
        <BehavioralSupportTaskDialog
          open={taskOpen}
          onOpenChange={setTaskOpen}
          onSubmit={async ({ title, description, due_at, assigned_to_name, status }) => {
            await bs.createPlanTask({
              plan_id: plan.id,
              case_id: plan.case_id,
              task_title: title,
              task_description: description ?? null,
              due_at: due_at ?? null,
              assigned_to_name: assigned_to_name ?? null,
              status: status ?? "open",
            });
          }}
        />
      </div>
    </div>
  );
}

function EditInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="text-xs space-y-1 block">
      <span className="text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm" />
    </label>
  );
}
function EditTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-xs space-y-1 block">
      <span className="text-muted-foreground">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm" />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function NewPlanDialog({ onClose, bs }: { onClose: () => void; bs: ReturnType<typeof useBehavioralSupportData> }) {
  const [form, setForm] = useState({
    plan_title: "",
    client_name: "",
    reason_for_plan: "",
    bcba_owner: "",
    goals: "",
    strategies: "",
    replacement_behaviors: "",
    family_guidance: "",
    rbt_guidance: "",
    review_due_at: "",
  });
  const splitLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg border border-border max-w-lg w-full p-5 space-y-3 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">New Support Plan</h2>
        <Input label="Plan title" value={form.plan_title} onChange={(v) => setForm({ ...form, plan_title: v })} />
        <Input label="Client name" value={form.client_name} onChange={(v) => setForm({ ...form, client_name: v })} />
        <Input label="BCBA owner" value={form.bcba_owner} onChange={(v) => setForm({ ...form, bcba_owner: v })} />
        <Textarea label="Reason for plan" value={form.reason_for_plan} onChange={(v) => setForm({ ...form, reason_for_plan: v })} />
        <Textarea label="Goals (one per line)" value={form.goals} onChange={(v) => setForm({ ...form, goals: v })} />
        <Textarea label="Strategies (one per line)" value={form.strategies} onChange={(v) => setForm({ ...form, strategies: v })} />
        <Textarea label="Replacement behaviors (one per line)" value={form.replacement_behaviors} onChange={(v) => setForm({ ...form, replacement_behaviors: v })} />
        <Textarea label="Family guidance" value={form.family_guidance} onChange={(v) => setForm({ ...form, family_guidance: v })} />
        <Textarea label="RBT guidance" value={form.rbt_guidance} onChange={(v) => setForm({ ...form, rbt_guidance: v })} />
        <Input label="Review due" type="datetime-local" value={form.review_due_at} onChange={(v) => setForm({ ...form, review_due_at: v })} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded">Cancel</button>
          <button
            disabled={!form.plan_title || !form.client_name}
            onClick={async () => {
              await bs.createPlan({
                plan_title: form.plan_title,
                client_name: form.client_name,
                bcba_owner: form.bcba_owner || null,
                reason_for_plan: form.reason_for_plan || null,
                goals: splitLines(form.goals),
                strategies: splitLines(form.strategies),
                replacement_behaviors: splitLines(form.replacement_behaviors),
                family_guidance: form.family_guidance || null,
                rbt_guidance: form.rbt_guidance || null,
                review_due_at: form.review_due_at ? new Date(form.review_due_at).toISOString() : null,
                plan_status: "draft",
              });
              onClose();
            }}
            className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded disabled:opacity-50"
          >Create</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="text-xs space-y-1 block">
      <span className="text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm" />
    </label>
  );
}
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-xs space-y-1 block">
      <span className="text-muted-foreground">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm" />
    </label>
  );
}