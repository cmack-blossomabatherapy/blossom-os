import { useMemo, useState } from "react";
import { OSShell } from "../OSShell";
import { Flame, Plus, RefreshCw } from "lucide-react";
import { useBehavioralSupportData } from "./useBehavioralSupportData";
import {
  ESCALATION_TYPES, ESC_STATUSES, SEVERITY_STYLE,
  type BSEscalation, type BSEscalationStatus, type BSEscalationType, type BSSeverity,
} from "./behavioralSupportTypes";
import { BehavioralSupportNoteDialog } from "./_dialogs";

export default function BehavioralSupportEscalations() {
  const bs = useBehavioralSupportData();
  const [statusFilter, setStatusFilter] = useState<BSEscalationStatus | "all">("all");
  const [sevFilter, setSevFilter] = useState<BSSeverity | "all">("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);

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
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
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
                  <EscalationRow key={e.id} row={e} bs={bs} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showForm && <NewEscalationDialog onClose={() => setShowForm(false)} bs={bs} />}
      </div>
    </OSShell>
  );
}

function EscalationRow({ row, bs }: { row: BSEscalation; bs: ReturnType<typeof useBehavioralSupportData> }) {
  const [noteOpen, setNoteOpen] = useState(false);
  return (
    <tr>
      <td className="px-3 py-2">
        <div className="font-medium">{row.client_name}</div>
        <div className="text-xs text-muted-foreground truncate max-w-xs">{row.description}</div>
      </td>
      <td className="px-3 py-2 capitalize">{row.escalation_type.replace(/_/g," ")}</td>
      <td className="px-3 py-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLE[row.severity]}`}>{row.severity}</span>
      </td>
      <td className="px-3 py-2">
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
      <td className="px-3 py-2 text-right">
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