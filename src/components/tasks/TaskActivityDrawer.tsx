import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { IntakeTaskRow } from "@/hooks/useIntakeTasksLive";
import { Activity, MessageSquare, Clock, ArrowRight, Loader2, User2, Inbox } from "lucide-react";
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
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-gradient-to-b from-background to-muted/20">
        <SheetHeader className="pb-1">
          <SheetTitle className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-3.5 w-3.5" />
            </span>
            Task activity
          </SheetTitle>
          <SheetDescription className="line-clamp-2">
            {task?.title ?? "Recent status changes and related communications"}
          </SheetDescription>
        </SheetHeader>

        {task && (
          <div className="mt-4 space-y-5 text-sm">
            {/* Meta */}
            <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
                    {initials(task.owner)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Owner</div>
                    <div className="text-sm font-medium text-foreground truncate">{task.owner || "Unassigned"}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {task.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Created {formatWhen(task.created_at)}</div>
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Updated {formatWhen(task.updated_at)}</div>
              </div>
            </div>

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

            {/* Freeform notes */}
            {other.length > 0 && (
              <section>
                <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</div>
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
              {!task.lead_id ? (
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