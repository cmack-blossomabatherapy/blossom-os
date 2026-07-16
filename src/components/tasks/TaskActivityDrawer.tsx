import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIntakeTasksLive, type IntakeTaskRow } from "@/hooks/useIntakeTasksLive";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads } from "@/contexts/LeadsContext";
import { useClients } from "@/contexts/ClientsContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Link2, X, Activity, MessageSquare, Clock, ArrowRight, Loader2, User2, Inbox, StickyNote, Send } from "lucide-react";
import { relatedRecordChipLabel, resolveRelatedRecordHref } from "@/lib/tasks/relatedRecord";
import { Link as RouterLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CommRow = {
  id: string;
  communication_type: string;
  direction: string | null;
  subject: string | null;
  preview: string | null;
  logged_by_name: string | null;
  created_at: string;
};

type StatusEvent = { at: string | null; from?: string; to?: string; by?: string; raw: string };
type UserNote = { at: string | null; by?: string; body: string; raw: string };

/**
 * Parse status transition lines from `intake_tasks.notes`.
 * Expected format (produced by useIntakeTasksLive.setStatus):
 *   [2026-07-14T12:34:56.000Z] Status: Open → In Progress (by Ava Chen)
 * Falls back to a raw line entry if the pattern doesn't match.
 */
function parseNotes(notes: string | null): { events: StatusEvent[]; userNotes: UserNote[]; other: string[] } {
  if (!notes) return { events: [], userNotes: [], other: [] };
  const events: StatusEvent[] = [];
  const userNotes: UserNote[] = [];
  const other: string[] = [];
  const statusRe = /^\s*\[([^\]]+)\]\s*Status:\s*([^→\-]+?)\s*(?:→|->)\s*([^()]+?)(?:\s*\(by\s+([^)]+)\))?\s*$/i;
  const noteRe = /^\s*\[([^\]]+)\]\s*Note(?:\s*\(by\s+([^)]+)\))?\s*:\s*(.+)$/i;
  for (const line of notes.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const sm = t.match(statusRe);
    if (sm) {
      events.push({ at: sm[1], from: sm[2].trim(), to: sm[3].trim(), by: sm[4]?.trim(), raw: t });
      continue;
    }
    const nm = t.match(noteRe);
    if (nm) {
      userNotes.push({ at: nm[1], by: nm[2]?.trim(), body: nm[3].trim(), raw: t });
      continue;
    }
    other.push(t);
  }
  events.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  userNotes.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  return { events, userNotes, other };
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const COMM_META: Record<string, { label: string; tone: string }> = {
  call:  { label: "Call",  tone: "bg-sky-500/10 text-sky-700 dark:text-sky-200 border-sky-500/20" },
  sms:   { label: "SMS",   tone: "bg-violet-500/10 text-violet-700 dark:text-violet-200 border-violet-500/20" },
  email: { label: "Email", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border-emerald-500/20" },
  note:  { label: "Note",  tone: "bg-amber-500/10 text-amber-700 dark:text-amber-200 border-amber-500/20" },
};

const DOT_TONE: Record<string, string> = {
  call: "bg-sky-500",
  sms: "bg-violet-500",
  email: "bg-emerald-500",
  note: "bg-amber-500",
};

function initials(name: string | null | undefined) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "—";
}

export interface TaskDetailDrawerProps {
  task: IntakeTaskRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: IntakeTaskRow["status"][] = ["Open", "In Progress", "Blocked", "Completed"];

export function TaskDetailDrawer({ task, open, onOpenChange }: TaskDetailDrawerProps) {
  const { setStatus, updateFields, addNote, tasks } = useIntakeTasksLive();
  const { user, displayName } = useAuth();
  const { leads } = useLeads();
  const { clients } = useClients();
  const authorName = (displayName as string) || user?.email || "You";

  // Prefer the live version of the task from the shared hook, so edits
  // and notes reflect immediately after mutations.
  const live = useMemo(
    () => (task ? tasks.find((t) => t.id === task.id) ?? task : null),
    [task, tasks],
  );

  const [comms, setComms] = useState<CommRow[]>([]);
  const [loading, setLoading] = useState(false);

  const { events, userNotes, other } = useMemo(() => parseNotes(live?.notes ?? null), [live?.notes]);

  // Editable draft state
  const [draft, setDraft] = useState({
    title: live?.title ?? "",
    owner: live?.owner ?? "",
    due_date: live?.due_date ?? "",
    task_type: live?.task_type ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [postingNote, setPostingNote] = useState(false);
  const [linkKind, setLinkKind] = useState<"lead" | "client">("lead");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkSaving, setLinkSaving] = useState(false);

  useEffect(() => {
    if (!live) return;
    setDraft({
      title: live.title ?? "",
      owner: live.owner ?? "",
      due_date: live.due_date ?? "",
      task_type: live.task_type ?? "",
    });
  }, [live?.id]); // reset when switching tasks

  const dirty = live && (
    draft.title !== (live.title ?? "") ||
    (draft.owner ?? "") !== (live.owner ?? "") ||
    (draft.due_date ?? "") !== (live.due_date ?? "") ||
    (draft.task_type ?? "") !== (live.task_type ?? "")
  );

  useEffect(() => {
    if (!open || !live?.lead_id) { setComms([]); return; }
    let cancelled = false;
    setLoading(true);
    void supabase
      .from("intake_communications")
      .select("id, communication_type, direction, subject, preview, logged_by_name, created_at")
      .eq("lead_id", live.lead_id)
      .order("created_at", { ascending: false })
      .limit(25)
      .then(({ data }) => {
        if (cancelled) return;
        setComms((data ?? []) as CommRow[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, live?.lead_id, live?.notes]);

  const onSave = async () => {
    if (!live || !dirty) return;
    setSaving(true);
    try {
      await updateFields(live.id, {
        title: draft.title.trim() || live.title,
        owner: draft.owner.trim() || null,
        due_date: draft.due_date || null,
        task_type: draft.task_type.trim() || live.task_type,
      });
      toast.success("Task updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const onStatus = async (next: IntakeTaskRow["status"]) => {
    if (!live) return;
    try {
      await setStatus(live, next, { actor: authorName });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status");
    }
  };

  const onAddNote = async () => {
    if (!live || !noteBody.trim()) return;
    setPostingNote(true);
    try {
      await addNote(live, noteBody, authorName);
      setNoteBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add note");
    } finally {
      setPostingNote(false);
    }
  };

  // Resolve linked chip — prefer explicit related_record_*; fall back to lead_id.
  const linkedChip = useMemo(() => {
    if (!live) return null;
    if (live.related_record_type && (live.related_record_label || live.related_record_id)) {
      let label = live.related_record_label;
      if (!label && live.related_record_type === "lead" && live.related_record_id) {
        const l = leads.find((x) => x.id === live.related_record_id);
        label = l?.childName ?? null;
      }
      if (!label && live.related_record_type === "client" && live.related_record_id) {
        const c = clients.find((x) => x.id === live.related_record_id);
        label = c?.childName ?? null;
      }
      return {
        label: relatedRecordChipLabel({ ...live, related_record_label: label }) ?? "Linked",
        href: resolveRelatedRecordHref(live),
      };
    }
    if (live.lead_id) {
      const l = leads.find((x) => x.id === live.lead_id);
      return {
        label: `Lead${l?.childName ? ` · ${l.childName}` : ""}`,
        href: `/leads?view=pipeline&lead=${encodeURIComponent(live.lead_id)}`,
      };
    }
    return null;
  }, [live, leads, clients]);

  const applyLink = async (
    kind: "lead" | "client",
    id: string,
    label: string,
  ) => {
    if (!live) return;
    setLinkSaving(true);
    try {
      const patch = {
        lead_id: kind === "lead" ? id : null,
        related_record_type: kind,
        related_record_id: id,
        related_record_label: label,
        related_url:
          kind === "lead"
            ? `/leads?view=pipeline&lead=${encodeURIComponent(id)}`
            : `/os/clients?client=${encodeURIComponent(id)}`,
      } as const;
      await updateFields(live.id, patch);
      toast.success(`Linked to ${label}`);
      setLinkOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not link");
    } finally {
      setLinkSaving(false);
    }
  };

  const clearLink = async () => {
    if (!live) return;
    setLinkSaving(true);
    try {
      await updateFields(live.id, {
        lead_id: null,
        related_record_type: null,
        related_record_id: null,
        related_record_label: null,
        related_url: null,
      });
      toast.success("Link removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not unlink");
    } finally {
      setLinkSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-gradient-to-b from-background to-muted/20">
        <SheetHeader className="pb-1">
          <SheetTitle className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-3.5 w-3.5" />
            </span>
            Task detail
          </SheetTitle>
          <SheetDescription className="line-clamp-2">
            Edit, add notes, and follow the activity trail.
          </SheetDescription>
        </SheetHeader>

        {live && (
          <div className="mt-4 space-y-5 text-sm">
            {/* Editable header */}
            <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
                    {initials(draft.owner)}
                  </span>
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Task title"
                    className="h-9 text-sm font-medium bg-transparent border-transparent hover:border-border focus:border-border px-2"
                  />
                </div>
                <Select value={live.status} onValueChange={(v) => onStatus(v as IntakeTaskRow["status"])}>
                  <SelectTrigger className="h-8 w-[140px] text-xs rounded-full shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Owner</label>
                  <Input
                    value={draft.owner ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))}
                    placeholder="Unassigned"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Due</label>
                  <Input
                    type="date"
                    value={draft.due_date ? String(draft.due_date).slice(0, 10) : ""}
                    onChange={(e) => setDraft((d) => ({ ...d, due_date: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Type</label>
                  <Input
                    value={draft.task_type ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, task_type: e.target.value }))}
                    placeholder="task"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Updated {formatWhen(live.updated_at)}</div>
                {dirty && (
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setDraft({
                      title: live.title ?? "", owner: live.owner ?? "",
                      due_date: live.due_date ?? "", task_type: live.task_type ?? "",
                    })}>Cancel</Button>
                    <Button size="sm" className="h-7 px-3 text-xs" onClick={onSave} disabled={saving}>
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <section>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <StickyNote className="h-3 w-3" /> Notes
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/60 p-3 space-y-3">
                <div className="space-y-2">
                  <Textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="Add a note…"
                    rows={2}
                    className="text-xs resize-none"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" className="h-7 px-3 text-xs" onClick={onAddNote} disabled={postingNote || !noteBody.trim()}>
                      {postingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-1" /> Add note</>}
                    </Button>
                  </div>
                </div>
                {userNotes.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground text-center py-2">No notes yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {userNotes.map((n, i) => (
                      <li key={i} className="rounded-xl border border-border/50 bg-background/60 p-3">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                          <span className="inline-flex items-center gap-1"><User2 className="h-3 w-3" /> {n.by || "Unknown"}</span>
                          <span>{formatWhen(n.at)}</span>
                        </div>
                        <div className="text-xs text-foreground whitespace-pre-wrap">{n.body}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Status timeline */}
            <section>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Activity className="h-3 w-3" /> Status changes
              </div>
              {events.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
                  <Inbox className="h-3.5 w-3.5" /> No recorded status transitions yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
                  <ol className="relative space-y-4 pl-5 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-px before:bg-border/60">
                    {events.map((e, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[18px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">{e.from ?? "?"}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">{e.to ?? "?"}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {formatWhen(e.at)}{e.by ? ` · by ${e.by}` : ""}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>

            {/* Legacy freeform lines that don't match either format */}
            {other.length > 0 && (
              <section>
                <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Other</div>
                <ul className="space-y-1.5 text-xs text-foreground">
                  {other.map((n, i) => (
                    <li key={i} className="rounded-lg border border-border/50 bg-card px-3 py-2">{n}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Communications */}
            <section>
              <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <MessageSquare className="h-3 w-3" /> Related communications
              </div>
              {!live.lead_id ? (
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
                  <Inbox className="h-3.5 w-3.5" /> This task isn't linked to a lead.
                </div>
              ) : loading ? (
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                </div>
              ) : comms.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
                  <Inbox className="h-3.5 w-3.5" /> No communications logged for this lead yet.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {comms.map((c) => {
                    const meta = COMM_META[c.communication_type] ?? { label: c.communication_type, tone: "bg-muted text-foreground border-border/60" };
                    const dot = DOT_TONE[c.communication_type] ?? "bg-muted-foreground";
                    return (
                      <li key={c.id} className="rounded-xl border border-border/50 bg-card/70 backdrop-blur p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
                              meta.tone,
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                            {meta.label}{c.direction ? ` · ${c.direction}` : ""}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{formatWhen(c.created_at)}</span>
                        </div>
                        {c.subject && <div className="mt-2 text-sm font-medium text-foreground line-clamp-1">{c.subject}</div>}
                        {c.preview && <div className="mt-1 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{c.preview}</div>}
                        {c.logged_by_name && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <User2 className="h-3 w-3" /> {c.logged_by_name}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Back-compat alias for existing imports.
export const TaskActivityDrawer = TaskDetailDrawer;
export type TaskActivityDrawerProps = TaskDetailDrawerProps;