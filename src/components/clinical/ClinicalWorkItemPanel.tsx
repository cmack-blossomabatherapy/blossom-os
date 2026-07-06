import { useEffect, useMemo, useState } from "react";
import { Plus, Activity as ActivityIcon, AlertTriangle, CheckCircle2, RotateCcw, Archive, StickyNote, UserPlus, CalendarClock, Link2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useClinicalDirectorData, type ClinicalSourceType, type ClinicalPriority, type ClinicalStatus } from "@/hooks/useClinicalDirectorData";
import { useClinicalDirectorActions } from "@/hooks/useClinicalDirectorActions";

/**
 * Reusable Clinical Director work-item + activity panel.
 *
 * Wired on every Clinical Director page so BCBA oversight, supervision,
 * treatment plans, progress reports, evaluations, and escalations all share
 * one durable workflow (`clinical_work_items` + `clinical_activity_log`).
 *
 * Reads via `useClinicalDirectorData` and writes via `useClinicalDirectorActions`
 * (which mirrors auth-linked events into `authorization_activity`).
 */
export interface ClinicalWorkItemPanelProps {
  sourceType: ClinicalSourceType;
  sourceRecordId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  bcbaId?: string | null;
  bcbaName?: string | null;
  state?: string | null;
  title?: string;
  compact?: boolean;
  /** Prefill for the create form. */
  defaultTitle?: string;
  defaultPriority?: ClinicalPriority;
  defaultDueAt?: string | null;
  /** Structured operational context stored on clinical_work_items.metadata. */
  metadata?: Record<string, unknown>;
}

export function ClinicalWorkItemPanel(props: ClinicalWorkItemPanelProps) {
  const {
    sourceType, sourceRecordId = null, clientId = null, clientName = null,
    bcbaId = null, bcbaName = null, state = null,
    title = "Clinical Workflow", compact = false,
    defaultTitle = "", defaultPriority = "normal", defaultDueAt = null,
    metadata = {},
  } = props;

  const data = useClinicalDirectorData({
    state: state ?? null, bcbaId, clientId,
  });
  const actions = useClinicalDirectorActions();
  const [draft, setDraft] = useState(defaultTitle);
  const [priority, setPriority] = useState<ClinicalPriority>(defaultPriority);
  const [dueAt, setDueAt] = useState<string>(defaultDueAt ?? "");
  const [busy, setBusy] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});

  useEffect(() => { setDraft(defaultTitle); }, [defaultTitle]);
  useEffect(() => { setPriority(defaultPriority); }, [defaultPriority]);
  useEffect(() => { setDueAt(defaultDueAt ?? ""); }, [defaultDueAt]);

  const scoped = useMemo(() => data.items.filter((it) => {
    if (it.source_type !== sourceType) return false;
    if (sourceRecordId && it.source_record_id !== sourceRecordId) return false;
    return true;
  }), [data.items, sourceType, sourceRecordId]);

  const recent = useMemo(() => data.activity.filter((a) => {
    if (a.source_type && a.source_type !== sourceType) return false;
    if (sourceRecordId && a.source_record_id !== sourceRecordId) return false;
    return true;
  }).slice(0, 8), [data.activity, sourceType, sourceRecordId]);

  const isRecordLevel = !!sourceRecordId;
  const centralReachId = (metadata as Record<string, unknown>)["centralReachClientId"] ?? null;

  async function handleCreate() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await actions.createWorkItem({
        title: draft.trim(),
        source_type: sourceType,
        source_record_id: sourceRecordId,
        client_id: clientId, client_name: clientName,
        bcba_id: bcbaId, bcba_name: bcbaName,
        state, priority,
        due_at: dueAt || null,
        metadata,
      });
      setDraft(defaultTitle); setPriority(defaultPriority); setDueAt(defaultDueAt ?? "");
      await data.reload();
      toast.success("Clinical work item created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create");
    } finally { setBusy(false); }
  }

  async function updateStatus(id: string, status: ClinicalStatus) {
    try {
      if (status === "reviewed") await actions.markReviewed(id);
      else if (status === "escalated") await actions.escalate(id);
      else if (status === "resolved") await actions.resolve(id);
      else if (status === "archived") await actions.archive(id);
      else await actions.reopen(id);
      await data.reload();
      toast.success(`Marked ${status.replace("_", " ")}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  }

  async function addNoteFor(id: string, current: string | null) {
    const text = (noteDrafts[id] ?? "").trim();
    if (!text) return;
    try {
      await actions.addNote(id, text, {
        source_type: sourceType, source_record_id: sourceRecordId,
        client_id: clientId, bcba_id: bcbaId, notes: current ?? null,
      });
      setNoteDrafts((m) => ({ ...m, [id]: "" }));
      await data.reload();
      toast.success("Note added");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not add note"); }
  }

  async function assignOwnerFor(id: string) {
    const name = (ownerDrafts[id] ?? "").trim();
    if (!name) return;
    try {
      // owner user id is optional — normalize blank to null so the UUID column
      // does not receive an empty string. Real UUID linking comes later.
      await actions.assignOwner(id, null, name);
      setOwnerDrafts((m) => ({ ...m, [id]: "" }));
      await data.reload();
      toast.success(`Assigned to ${name}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not assign"); }
  }

  async function changePriorityFor(id: string, p: ClinicalPriority) {
    try { await actions.changePriority(id, p); await data.reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not update priority"); }
  }

  async function changeDueDateFor(id: string, value: string) {
    try {
      const iso = value ? new Date(value).toISOString() : null;
      await actions.changeDueDate(id, iso);
      await data.reload();
      toast.success(iso ? "Due date updated" : "Due date cleared");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update due date"); }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${isRecordLevel ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
            {isRecordLevel ? "Record-level workflow" : "Page-level workflow"}
          </span>
        </div>
        <span className="text-xs text-slate-500">{scoped.length} open · {recent.length} recent</span>
      </header>

      {centralReachId ? (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] text-emerald-700">
          <Link2 className="h-3 w-3" /> CentralReach linked ({String(centralReachId)})
        </div>
      ) : sourceType !== "manual" && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] text-amber-700">
          <AlertTriangle className="h-3 w-3" /> No CentralReach client id · sync pending
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={defaultTitle || "New clinical work item…"}
          className="flex-1 min-w-[200px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as ClinicalPriority)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <input
          type="date"
          value={dueAt ? dueAt.slice(0, 10) : ""}
          onChange={(e) => setDueAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          title="Due date"
        />
        <button
          onClick={handleCreate}
          disabled={busy || !draft.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> Create
        </button>
      </div>

      {compact ? null : (
        <div className="space-y-2">
          {scoped.length === 0 ? (
            <p className="text-xs text-slate-500">
              {isRecordLevel ? "No open clinical work items for this record." : "No open clinical work items on this page yet."}
            </p>
          ) : scoped.map((it) => (
            <div key={it.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm space-y-2">
              <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-900">{it.title}</div>
                <div className="text-xs text-slate-500">
                  {it.status} · {it.priority}{it.owner_name ? ` · ${it.owner_name}` : ""}
                  {it.due_at ? ` · due ${new Date(it.due_at).toLocaleDateString()}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={it.priority}
                  onChange={(e) => changePriorityFor(it.id, e.target.value as ClinicalPriority)}
                  className="text-[11px] rounded border border-slate-200 px-1 py-0.5"
                  title="Change priority"
                >
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
                <button title="Mark reviewed" onClick={() => updateStatus(it.id, "reviewed")} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <button title="Escalate" onClick={() => updateStatus(it.id, "escalated")} className="p-1 text-amber-600 hover:bg-amber-50 rounded">
                  <AlertTriangle className="h-4 w-4" />
                </button>
                <button title="Resolve" onClick={() => updateStatus(it.id, "resolved")} className="p-1 text-slate-700 hover:bg-slate-100 rounded">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button title="Reopen" onClick={() => updateStatus(it.id, "open")} className="p-1 text-slate-600 hover:bg-slate-100 rounded">
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button title="Archive" onClick={() => updateStatus(it.id, "archived")} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                  <Archive className="h-4 w-4" />
                </button>
              </div>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <input
                  value={ownerDrafts[it.id] ?? ""}
                  onChange={(e) => setOwnerDrafts((m) => ({ ...m, [it.id]: e.target.value }))}
                  placeholder="Assign owner name…"
                  className="flex-1 min-w-[140px] rounded border border-slate-200 px-2 py-1 text-[11px]"
                />
                <button
                  onClick={() => assignOwnerFor(it.id)}
                  className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px]"
                >
                  <UserPlus className="h-3 w-3" /> Assign
                </button>
                <label className="inline-flex items-center gap-1 text-[11px] text-slate-500" title="Edit due date">
                  <CalendarClock className="h-3 w-3" />
                  <input
                    type="date"
                    value={it.due_at ? it.due_at.slice(0, 10) : ""}
                    onChange={(e) => changeDueDateFor(it.id, e.target.value)}
                    className="rounded border border-slate-200 px-1 py-0.5 text-[11px]"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 items-start">
                <textarea
                  value={noteDrafts[it.id] ?? ""}
                  onChange={(e) => setNoteDrafts((m) => ({ ...m, [it.id]: e.target.value }))}
                  placeholder="Add clinical note…"
                  rows={1}
                  className="flex-1 min-w-[160px] rounded border border-slate-200 px-2 py-1 text-[11px]"
                />
                <button
                  onClick={() => addNoteFor(it.id, it.notes)}
                  className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px]"
                >
                  <StickyNote className="h-3 w-3" /> Note
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-slate-100 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
          <ActivityIcon className="h-3 w-3" /> Recent clinical activity
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-slate-400">No activity yet.</p>
        ) : (
          <ul className="space-y-1">
            {recent.map((a) => (
              <li key={a.id} className="text-xs text-slate-600">
                <span className="font-medium text-slate-800">{a.event_type}</span>
                {a.summary ? ` — ${a.summary}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ClinicalWorkItemPanel;