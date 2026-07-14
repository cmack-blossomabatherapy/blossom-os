import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { IntakeTaskRow } from "@/hooks/useIntakeTasksLive";
import { Activity, MessageSquare, Clock, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

/**
 * Parse status transition lines from `intake_tasks.notes`.
 * Expected format (produced by useIntakeTasksLive.setStatus):
 *   [2026-07-14T12:34:56.000Z] Status: Open → In Progress (by Ava Chen)
 * Falls back to a raw line entry if the pattern doesn't match.
 */
function parseNotes(notes: string | null): { events: StatusEvent[]; other: string[] } {
  if (!notes) return { events: [], other: [] };
  const events: StatusEvent[] = [];
  const other: string[] = [];
  const re = /^\s*\[([^\]]+)\]\s*Status:\s*([^→\-]+?)\s*(?:→|->)\s*([^()]+?)(?:\s*\(by\s+([^)]+)\))?\s*$/i;
  for (const line of notes.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(re);
    if (m) {
      events.push({ at: m[1], from: m[2].trim(), to: m[3].trim(), by: m[4]?.trim(), raw: t });
    } else {
      other.push(t);
    }
  }
  events.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  return { events, other };
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const COMM_META: Record<string, { label: string; tone: string }> = {
  call:  { label: "Call",  tone: "bg-sky-500/10 text-sky-700 dark:text-sky-200 border-sky-500/30" },
  sms:   { label: "SMS",   tone: "bg-violet-500/10 text-violet-700 dark:text-violet-200 border-violet-500/30" },
  email: { label: "Email", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border-emerald-500/30" },
  note:  { label: "Note",  tone: "bg-amber-500/10 text-amber-700 dark:text-amber-200 border-amber-500/30" },
};

export interface TaskActivityDrawerProps {
  task: IntakeTaskRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskActivityDrawer({ task, open, onOpenChange }: TaskActivityDrawerProps) {
  const [comms, setComms] = useState<CommRow[]>([]);
  const [loading, setLoading] = useState(false);

  const { events, other } = useMemo(() => parseNotes(task?.notes ?? null), [task?.notes]);

  useEffect(() => {
    if (!open || !task?.lead_id) { setComms([]); return; }
    let cancelled = false;
    setLoading(true);
    void supabase
      .from("intake_communications")
      .select("id, communication_type, direction, subject, preview, logged_by_name, created_at")
      .eq("lead_id", task.lead_id)
      .order("created_at", { ascending: false })
      .limit(25)
      .then(({ data }) => {
        if (cancelled) return;
        setComms((data ?? []) as CommRow[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, task?.lead_id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Task activity
          </SheetTitle>
          <SheetDescription className="line-clamp-2">
            {task?.title ?? "Recent status changes and related communications"}
          </SheetDescription>
        </SheetHeader>

        {task && (
          <div className="mt-4 space-y-6 text-sm">
            {/* Meta */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> Created {formatWhen(task.created_at)}</div>
              <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> Updated {formatWhen(task.updated_at)}</div>
              <div>Owner: <span className="text-foreground">{task.owner || "Unassigned"}</span></div>
              <div>Current status: <span className="text-foreground">{task.status}</span></div>
            </div>

            {/* Status timeline */}
            <section>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Status changes</div>
              {events.length === 0 ? (
                <div className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 p-3">
                  No recorded status transitions yet.
                </div>
              ) : (
                <ol className="relative border-l border-border/60 pl-4 space-y-3">
                  {events.map((e, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[7px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <span className="font-medium">{e.from ?? "?"}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{e.to ?? "?"}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {formatWhen(e.at)}{e.by ? ` · by ${e.by}` : ""}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Freeform notes */}
            {other.length > 0 && (
              <section>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notes</div>
                <ul className="space-y-1.5 text-xs text-foreground">
                  {other.map((n, i) => (
                    <li key={i} className="rounded-md border border-border/60 bg-card px-2.5 py-1.5">{n}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Communications */}
            <section>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" /> Related communications
              </div>
              {!task.lead_id ? (
                <div className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 p-3">
                  This task isn't linked to a lead, so no communications are attached.
                </div>
              ) : loading ? (
                <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>
              ) : comms.length === 0 ? (
                <div className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 p-3">
                  No communications logged for this lead yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {comms.map((c) => {
                    const meta = COMM_META[c.communication_type] ?? { label: c.communication_type, tone: "bg-muted text-foreground border-border/60" };
                    return (
                      <li key={c.id} className="rounded-xl border border-border/60 bg-card p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className={cn("text-[10px]", meta.tone)}>
                            {meta.label}{c.direction ? ` · ${c.direction}` : ""}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{formatWhen(c.created_at)}</span>
                        </div>
                        {c.subject && <div className="mt-1.5 text-sm font-medium text-foreground line-clamp-1">{c.subject}</div>}
                        {c.preview && <div className="mt-0.5 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{c.preview}</div>}
                        {c.logged_by_name && <div className="mt-1 text-[11px] text-muted-foreground">by {c.logged_by_name}</div>}
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