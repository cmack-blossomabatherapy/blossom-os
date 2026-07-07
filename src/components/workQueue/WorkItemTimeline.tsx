/**
 * WorkItemTimeline — read-only event feed + note composer for a
 * single work item. Reads from `operations_work_item_events` via the
 * useWorkItemEvents hook and inserts `note_added` events when the user
 * submits an internal note.
 */
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, MessageSquare,
  Plus, Send, Sparkles, UserPlus, Workflow, StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWorkItemEvents } from "@/hooks/useWorkItemEvents";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  work_item_created: Plus,
  work_item_updated: Workflow,
  work_item_assigned: UserPlus,
  work_item_status_changed: Workflow,
  work_item_snoozed: Clock,
  work_item_escalated: Sparkles,
  work_item_escalation_resolved: CheckCircle2,
  work_item_completed: CheckCircle2,
  note_added: StickyNote,
};

const ICON_TONE: Record<string, string> = {
  work_item_escalated: "text-red-600 bg-red-50",
  work_item_completed: "text-emerald-600 bg-emerald-50",
  work_item_escalation_resolved: "text-emerald-600 bg-emerald-50",
  note_added: "text-primary bg-primary/10",
};

function eventLabel(type: string): string {
  const map: Record<string, string> = {
    work_item_created: "Created",
    work_item_updated: "Updated",
    work_item_assigned: "Assigned",
    work_item_status_changed: "Status changed",
    work_item_snoozed: "Snoozed",
    work_item_escalated: "Escalated",
    work_item_escalation_resolved: "Escalation resolved",
    work_item_completed: "Completed",
    note_added: "Note",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

export function WorkItemTimeline({ workItemId }: { workItemId: string }) {
  const { events, loading, error, addNote } = useWorkItemEvents(workItemId);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!note.trim() || sending) return;
    setSending(true);
    await addNote(note);
    setNote("");
    setSending(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Activity className="h-3 w-3" /> Activity timeline
        {loading && <span className="text-[10px] ml-1">(loading…)</span>}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-[11px] text-red-700 inline-flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> {error}
        </div>
      )}

      <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2.5">
        {events.length === 0 && !loading && (
          <div className="text-[11px] text-muted-foreground italic py-2">
            No activity yet for this work item.
          </div>
        )}
        {events.slice().reverse().map((e) => {
          const Icon = ICONS[e.eventType] ?? MessageSquare;
          const tone = ICON_TONE[e.eventType] ?? "text-muted-foreground bg-muted";
          return (
            <div key={e.id} className="flex items-start gap-2">
              <div className={`shrink-0 mt-0.5 h-6 w-6 rounded-full inline-flex items-center justify-center ${tone}`}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-foreground flex items-center gap-1.5 flex-wrap">
                  <span>{eventLabel(e.eventType)}</span>
                  <span className="text-muted-foreground font-normal">
                    · {e.actorName ?? "system"}
                  </span>
                  <span className="text-muted-foreground font-normal ml-auto text-[10px]">
                    {(() => {
                      try { return formatDistanceToNow(new Date(e.createdAt), { addSuffix: true }); }
                      catch { return new Date(e.createdAt).toLocaleString(); }
                    })()}
                  </span>
                </div>
                {e.message && (
                  <div className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
                    {e.message}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 pt-1 border-t border-border/60">
        <label className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <StickyNote className="h-3 w-3" /> Add internal note
        </label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Add context, decisions, or handoff notes…"
          className="text-xs"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={submit} disabled={!note.trim() || sending}>
            <Send className="h-3 w-3 mr-1" />
            {sending ? "Saving…" : "Add note"}
          </Button>
        </div>
      </div>
    </div>
  );
}