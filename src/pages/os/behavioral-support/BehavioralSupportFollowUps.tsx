import { useState } from "react";
import { OSShell } from "../OSShell";
import { Bell, Plus, RefreshCw, CheckCircle2 } from "lucide-react";
import { useBehavioralSupportData } from "./useBehavioralSupportData";
import { FU_TYPES, PRIORITIES, type BSFollowupType, type BSPriority } from "./behavioralSupportTypes";
import { BehavioralSupportFollowupCompleteDialog } from "./_dialogs";

export default function BehavioralSupportFollowUps() {
  const bs = useBehavioralSupportData();
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
  const endOfToday = new Date(now); endOfToday.setHours(23,59,59,999);

  const filter = (f: typeof bs.followups[number]) =>
    (typeFilter === "all" || f.followup_type === typeFilter)
    && (priorityFilter === "all" || f.priority === priorityFilter);

  const active = bs.followups.filter((f) => f.status !== "completed" && f.status !== "cancelled").filter(filter);
  const dueToday = active.filter((f) => { const d = new Date(f.due_at); return d >= startOfToday && d <= endOfToday; });
  const overdue = active.filter((f) => new Date(f.due_at) < startOfToday);
  const upcoming = active.filter((f) => new Date(f.due_at) > endOfToday);
  const completed = bs.followups.filter((f) => f.status === "completed").filter(filter).slice(0, 25);

  return (
    <OSShell>
      <div className="space-y-6 p-6 mx-auto w-full max-w-6xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Bell className="h-4 w-4" /> Behavioral Support
            </div>
            <h1 className="text-2xl font-semibold mt-1">Follow-Up Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">Family calls, BCBA check-ins, plan reviews, and crisis follow-ups.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void bs.refresh()} className="text-xs border border-border rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${bs.loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={() => setShowForm(true)} className="text-xs bg-primary text-primary-foreground rounded-md px-3 py-1.5 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Schedule follow-up
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Type:</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-background border border-border rounded px-2 py-1">
              <option value="all">All types</option>
              {FU_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Priority:</span>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-background border border-border rounded px-2 py-1">
              <option value="all">All priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>

        <Section title="Overdue" items={overdue} bs={bs} tone="red" />
        <Section title="Due today" items={dueToday} bs={bs} tone="amber" />
        <Section title="Upcoming" items={upcoming} bs={bs} tone="sky" />
        <Section title="Recently completed" items={completed} bs={bs} tone="muted" hideComplete />

        {showForm && <NewFollowupDialog onClose={() => setShowForm(false)} bs={bs} />}
      </div>
    </OSShell>
  );
}

function Section({ title, items, bs, tone, hideComplete }: {
  title: string;
  items: ReturnType<typeof useBehavioralSupportData>["followups"];
  bs: ReturnType<typeof useBehavioralSupportData>;
  tone: "red" | "amber" | "sky" | "muted";
  hideComplete?: boolean;
}) {
  const toneClass = tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : tone === "sky" ? "text-sky-600" : "text-muted-foreground";
  const [completeFor, setCompleteFor] = useState<typeof items[number] | null>(null);
  return (
    <section>
      <h2 className={`text-sm font-semibold mb-2 ${toneClass}`}>{title} ({items.length})</h2>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground text-center">None.</div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {items.map((f) => (
            <li key={f.id} className="p-3 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium">{f.client_name}</div>
                <div className="text-xs text-muted-foreground">
                  {f.followup_type.replace(/_/g," ")} • priority {f.priority} • due {new Date(f.due_at).toLocaleString()}
                </div>
                {f.outcome && <div className="text-xs text-muted-foreground mt-1">Outcome: {f.outcome}</div>}
              </div>
              {!hideComplete && (
                <button
                  onClick={() => setCompleteFor(f)}
                  className="text-xs bg-emerald-500/10 text-emerald-600 rounded-md px-2.5 py-1.5 flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <BehavioralSupportFollowupCompleteDialog
        open={!!completeFor}
        onOpenChange={(v) => !v && setCompleteFor(null)}
        clientName={completeFor?.client_name}
        onSubmit={async ({ outcome, resolved, nextStepNeeded, nextFollowupDueAt, note }) => {
          if (completeFor) {
            await bs.completeFollowup(completeFor.id, {
              outcome,
              resolved,
              nextFollowupDueAt: nextStepNeeded ? nextFollowupDueAt : null,
              note,
            });
          }
        }}
      />
    </section>
  );
}

function NewFollowupDialog({ onClose, bs }: { onClose: () => void; bs: ReturnType<typeof useBehavioralSupportData> }) {
  const [form, setForm] = useState({
    client_name: "",
    followup_type: "family_call" as BSFollowupType,
    priority: "medium" as BSPriority,
    due_at: "",
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg border border-border max-w-md w-full p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">New Follow-up</h2>
        <label className="text-xs space-y-1 block">
          <span className="text-muted-foreground">Client name *</span>
          <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs space-y-1 block">
            <span className="text-muted-foreground">Type</span>
            <select value={form.followup_type} onChange={(e) => setForm({ ...form, followup_type: e.target.value as BSFollowupType })} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm">
              {FU_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
            </select>
          </label>
          <label className="text-xs space-y-1 block">
            <span className="text-muted-foreground">Priority</span>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as BSPriority })} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
        <label className="text-xs space-y-1 block">
          <span className="text-muted-foreground">Due *</span>
          <input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm" />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm px-3 py-1.5 border border-border rounded">Cancel</button>
          <button
            disabled={!form.client_name || !form.due_at}
            onClick={async () => {
              await bs.createFollowup({
                client_name: form.client_name,
                followup_type: form.followup_type,
                priority: form.priority,
                due_at: new Date(form.due_at).toISOString(),
                status: "open",
              });
              onClose();
            }}
            className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded disabled:opacity-50"
          >Schedule</button>
        </div>
      </div>
    </div>
  );
}