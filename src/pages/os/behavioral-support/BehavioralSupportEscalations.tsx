import { useMemo, useState } from "react";
import { OSShell } from "../OSShell";
import { Flame, Plus, RefreshCw, X } from "lucide-react";
import { useBehavioralSupportData } from "./useBehavioralSupportData";
import {
  ESCALATION_TYPES, ESC_STATUSES, SEVERITY_STYLE,
  type BSEscalation, type BSEscalationStatus, type BSEscalationType, type BSSeverity,
} from "./behavioralSupportTypes";
import {
  BehavioralSupportNoteDialog,
  BehavioralSupportFollowupDialog,
  BehavioralSupportPlanDialog,
} from "./_dialogs";

export default function BehavioralSupportEscalations() {
  const bs = useBehavioralSupportData();
  const [statusFilter, setStatusFilter] = useState<BSEscalationStatus | "all">("all");
  const [sevFilter, setSevFilter] = useState<BSSeverity | "all">("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const openRow = bs.escalations.find((e) => e.id === openId) ?? null;

  const states = useMemo(() => {
    return Array.from(new Set(bs.escalations.map((e) => e.state).filter(Boolean))) as string[];
  }, [bs.escalations]);

  const filtered = bs.escalations.filter((e) =>
    (statusFilter === "all" || e.status === statusFilter)
    && (sevFilter === "all" || e.severity === sevFilter)
    && (stateFilter === "all" || e.state === stateFilter)
  );

  return (
    <OSShell>
      <div className="space-y-6 p-6 mx-auto w-full max-w-6xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Flame className="h-4 w-4" /> Behavioral Support
            </div>
            <h1 className="text-2xl font-semibold mt-1">Behavior Escalations</h1>
            <p className="text-sm text-muted-foreground mt-1">Triage, assign, and resolve escalations.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void bs.refresh()} className="text-xs border border-border rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${bs.loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={() => setShowForm(true)} className="text-xs bg-primary text-primary-foreground rounded-md px-3 py-1.5 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New escalation
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 text-xs">
          <Select label="Status" value={statusFilter} onChange={(v) => setStatusFilter(v as BSEscalationStatus | "all")}
            options={[["all","All statuses"], ...ESC_STATUSES.map((s) => [s, s.replace(/_/g," ")] as [string,string])]} />
          <Select label="Severity" value={sevFilter} onChange={(v) => setSevFilter(v as BSSeverity | "all")}
            options={[["all","All severities"],["low","low"],["medium","medium"],["high","high"],["crisis","crisis"]]} />
          <Select label="State" value={stateFilter} onChange={setStateFilter}
            options={[["all","All states"], ...states.map((s) => [s, s] as [string, string])]} />
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {bs.loading ? (
            <div className="p-4 space-y-2">{[0,1,2,3].map((i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}</div>
          ) : bs.error ? (
            <div className="p-6 text-sm text-destructive">{bs.error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">
              {bs.escalations.length === 0
                ? "No escalations logged yet. Open one when a behavior situation needs support."
                : "No escalations match these filters."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Client</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Severity</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">BCBA</th>
                  <th className="px-3 py-2 text-left">Due</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((e) => (
                  <EscalationRow key={e.id} row={e} bs={bs} onOpen={() => setOpenId(e.id)} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showForm && <NewEscalationDialog onClose={() => setShowForm(false)} bs={bs} />}
        {openRow && <EscalationDetailDrawer row={openRow} bs={bs} onClose={() => setOpenId(null)} />}
      </div>
    </OSShell>
  );
}

function EscalationRow({ row, bs, onOpen }: { row: BSEscalation; bs: ReturnType<typeof useBehavioralSupportData>; onOpen: () => void }) {
  const [noteOpen, setNoteOpen] = useState(false);
  return (
    <tr className="cursor-pointer hover:bg-accent/40" onClick={onOpen}>
      <td className="px-3 py-2">
        <div className="font-medium">{row.client_name}</div>
        <div className="text-xs text-muted-foreground truncate max-w-xs">{row.description}</div>
      </td>
      <td className="px-3 py-2 capitalize">{row.escalation_type.replace(/_/g," ")}</td>
      <td className="px-3 py-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLE[row.severity]}`}>{row.severity}</span>
      </td>
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <select
          value={row.status}
          onChange={(e) => void bs.updateEscalation(row.id, { status: e.target.value as BSEscalationStatus, ...(e.target.value === "resolved" ? { resolved_at: new Date().toISOString() } : {}) })}
          className="bg-background border border-border rounded px-1.5 py-0.5 text-xs"
        >
          {ESC_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{row.bcba_name ?? "—"}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{row.due_at ? new Date(row.due_at).toLocaleDateString() : "—"}</td>
      <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setNoteOpen(true)}
          className="text-xs text-primary hover:underline"
        >
          Add note
        </button>
        <BehavioralSupportNoteDialog
          open={noteOpen}
          onOpenChange={setNoteOpen}
          title={`Note on ${row.client_name}`}
          onSubmit={(body) => bs.addNote({ escalation_id: row.id, case_id: row.case_id, title: `Note on ${row.client_name}`, body })}
        />
      </td>
    </tr>
  );
}

function EscalationDetailDrawer({
  row,
  bs,
  onClose,
}: {
  row: BSEscalation;
  bs: ReturnType<typeof useBehavioralSupportData>;
  onClose: () => void;
}) {
  const linkedCase = bs.cases.find((c) => c.id === row.case_id) ?? null;
  const linkedPlans = bs.plans.filter((p) => p.case_id === row.case_id);
  const linkedFollowups = bs.followups.filter((f) => f.escalation_id === row.id || (row.case_id && f.case_id === row.case_id));
  const timeline = bs.activity.filter((a) => a.escalation_id === row.id || (row.case_id && a.case_id === row.case_id)).slice(0, 20);
  const [noteOpen, setNoteOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [fuOpen, setFuOpen] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="bg-card w-full max-w-xl h-full overflow-auto p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Escalation · {row.client_name}</h2>
            <div className="text-xs text-muted-foreground">
              {row.escalation_type.replace(/_/g," ")} • {row.status.replace(/_/g," ")} • severity {row.severity}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Fld label="Client">{row.client_name}</Fld>
          <Fld label="State">{row.state ?? "—"}</Fld>
          <Fld label="BCBA">{row.bcba_name ?? "—"}</Fld>
          <Fld label="Due">{row.due_at ? new Date(row.due_at).toLocaleString() : "—"}</Fld>
        </div>
        <Fld label="Description">{row.description}</Fld>
        <Fld label="Immediate action">{row.immediate_action ?? "—"}</Fld>

        <div className="flex flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Status:</span>
            <select
              value={row.status}
              onChange={(e) => void bs.updateEscalation(row.id, {
                status: e.target.value as BSEscalationStatus,
                ...(e.target.value === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
              })}
              className="bg-background border border-border rounded px-2 py-1"
            >
              {ESC_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
            </select>
          </label>
          <button onClick={() => setNoteOpen(true)} className="border border-border rounded px-2 py-1 hover:bg-accent">Add note</button>
          <button onClick={() => setPlanOpen(true)} className="border border-border rounded px-2 py-1 hover:bg-accent">Create support plan</button>
          <button onClick={() => setFuOpen(true)} className="border border-border rounded px-2 py-1 hover:bg-accent">Create follow-up</button>
          <button
            onClick={() => void bs.updateEscalation(row.id, { status: "resolved", resolved_at: new Date().toISOString() })}
            className="border border-emerald-500/40 text-emerald-600 rounded px-2 py-1 hover:bg-emerald-500/10"
          >
            Resolve escalation
          </button>
        </div>

        <Fld label="Linked case">{linkedCase ? `${linkedCase.client_name} · ${linkedCase.status.replace(/_/g," ")}` : "—"}</Fld>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Linked support plans ({linkedPlans.length})</div>
          {linkedPlans.length === 0 ? (
            <div className="text-xs text-muted-foreground">None yet.</div>
          ) : (
            <ul className="text-xs list-disc pl-4 text-muted-foreground space-y-0.5">
              {linkedPlans.map((p) => <li key={p.id}>{p.plan_title} · {p.plan_status}</li>)}
            </ul>
          )}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Linked follow-ups ({linkedFollowups.length})</div>
          {linkedFollowups.length === 0 ? (
            <div className="text-xs text-muted-foreground">None yet.</div>
          ) : (
            <ul className="text-xs list-disc pl-4 text-muted-foreground space-y-0.5">
              {linkedFollowups.map((f) => <li key={f.id}>{f.followup_type.replace(/_/g," ")} · due {new Date(f.due_at).toLocaleDateString()} · {f.status.replace(/_/g," ")}</li>)}
            </ul>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Activity timeline</div>
          {timeline.length === 0 ? (
            <div className="text-xs text-muted-foreground">No activity yet.</div>
          ) : (
            <ul className="text-xs space-y-1.5">
              {timeline.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.title}</div>
                    {a.body && <div className="text-muted-foreground truncate">{a.body}</div>}
                  </div>
                  <div className="text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <BehavioralSupportNoteDialog
          open={noteOpen}
          onOpenChange={setNoteOpen}
          title={`Note on ${row.client_name}`}
          onSubmit={(body) => bs.addNote({ escalation_id: row.id, case_id: row.case_id, title: `Note on ${row.client_name}`, body })}
        />
        <BehavioralSupportPlanDialog
          open={planOpen}
          onOpenChange={setPlanOpen}
          clientName={row.client_name}
          onSubmit={async ({ plan_title, notes }) => {
            await bs.createPlan({
              case_id: row.case_id,
              client_name: row.client_name,
              plan_title,
              plan_status: "draft",
              reason_for_plan: notes ?? row.description ?? null,
              goals: [],
              strategies: [],
              replacement_behaviors: [],
              bcba_owner: row.bcba_name,
            });
          }}
        />
        <BehavioralSupportFollowupDialog
          open={fuOpen}
          onOpenChange={setFuOpen}
          clientName={row.client_name}
          onSubmit={async ({ due_at, followup_type, priority, assigned_to_name, notes }) => {
            await bs.createFollowup({
              case_id: row.case_id,
              escalation_id: row.id,
              client_name: row.client_name,
              followup_type,
              priority,
              assigned_to_name: assigned_to_name ?? null,
              due_at,
              status: "open",
            });
            if (notes) {
              await bs.addNote({ escalation_id: row.id, case_id: row.case_id, title: `Follow-up notes for ${row.client_name}`, body: notes });
            }
          }}
        />
      </div>
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function NewEscalationDialog({ onClose, bs }: { onClose: () => void; bs: ReturnType<typeof useBehavioralSupportData> }) {
  const [form, setForm] = useState({
    client_name: "",
    state: "",
    escalation_type: "crisis" as BSEscalationType,
    severity: "medium" as BSSeverity,
    description: "",
    immediate_action: "",
    bcba_name: "",
    due_at: "",
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg border border-border max-w-lg w-full p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">New Escalation</h2>
        <Input label="Client name" value={form.client_name} onChange={(v) => setForm({ ...form, client_name: v })} required />
        <div className="grid grid-cols-2 gap-2">
          <Input label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
          <Input label="BCBA" value={form.bcba_name} onChange={(v) => setForm({ ...form, bcba_name: v })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs space-y-1 block">
            <span className="text-muted-foreground">Type</span>
            <select value={form.escalation_type} onChange={(e) => setForm({ ...form, escalation_type: e.target.value as BSEscalationType })} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm">
              {ESCALATION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
            </select>
          </label>
          <label className="text-xs space-y-1 block">
            <span className="text-muted-foreground">Severity</span>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as BSSeverity })} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm">
              {(["low","medium","high","crisis"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <label className="text-xs space-y-1 block">
          <span className="text-muted-foreground">Description</span>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm" />
        </label>
        <Input label="Immediate action" value={form.immediate_action} onChange={(v) => setForm({ ...form, immediate_action: v })} />
        <Input label="Due (date)" type="datetime-local" value={form.due_at} onChange={(v) => setForm({ ...form, due_at: v })} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded">Cancel</button>
          <button
            disabled={!form.client_name || !form.description}
            onClick={async () => {
              await bs.createEscalation({
                ...form,
                due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
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

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-background border border-border rounded px-2 py-1">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function Input({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="text-xs space-y-1 block">
      <span className="text-muted-foreground">{label}{required && " *"}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm" />
    </label>
  );
}