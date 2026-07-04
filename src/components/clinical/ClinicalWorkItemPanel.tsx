import { useMemo, useState } from "react";
import { Plus, Activity as ActivityIcon, AlertTriangle, CheckCircle2, RotateCcw, Archive } from "lucide-react";
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
}

export function ClinicalWorkItemPanel(props: ClinicalWorkItemPanelProps) {
  const {
    sourceType, sourceRecordId = null, clientId = null, clientName = null,
    bcbaId = null, bcbaName = null, state = null,
    title = "Clinical Workflow", compact = false,
  } = props;

  const data = useClinicalDirectorData({
    state: state ?? null, bcbaId, clientId,
  });
  const actions = useClinicalDirectorActions();
  const [draft, setDraft] = useState("");
  const [priority, setPriority] = useState<ClinicalPriority>("normal");
  const [busy, setBusy] = useState(false);

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
      });
      setDraft(""); setPriority("normal");
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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">{scoped.length} open · {recent.length} recent</span>
      </header>

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="New clinical work item…"
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
            <p className="text-xs text-slate-500">No open clinical work items for this record.</p>
          ) : scoped.map((it) => (
            <div key={it.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-900">{it.title}</div>
                <div className="text-xs text-slate-500">
                  {it.status} · {it.priority}{it.owner_name ? ` · ${it.owner_name}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button title="Mark reviewed" onClick={() => updateStatus(it.id, "reviewed")} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <button title="Escalate" onClick={() => updateStatus(it.id, "escalated")} className="p-1 text-amber-600 hover:bg-amber-50 rounded">
                  <AlertTriangle className="h-4 w-4" />
                </button>
                <button title="Resolve" onClick={() => updateStatus(it.id, "resolved")} className="p-1 text-slate-700 hover:bg-slate-100 rounded">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button title="Archive" onClick={() => updateStatus(it.id, "archived")} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                  <Archive className="h-4 w-4" />
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