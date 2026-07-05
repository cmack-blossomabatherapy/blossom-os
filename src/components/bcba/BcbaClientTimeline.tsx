import { useMemo, useState } from "react";
import { ClipboardList, ClipboardCheck, HeartHandshake, FileSignature, StickyNote, Filter } from "lucide-react";
import { useBcbaWorkflow, type BcbaWorkflowScope } from "@/hooks/useBcbaWorkflow";
import { BcbaCentralReachBadge } from "@/components/bcba/BcbaCentralReachBadge";
import { cn } from "@/lib/utils";

/**
 * Unified BCBA client timeline — merges the five BCBA workflow record types
 * (notes, tasks, supervision, parent training, treatment-plan items) into a
 * single, chronological feed for a client. Honest about CentralReach status:
 * every row surfaces its import/sync state via BcbaCentralReachBadge.
 *
 * Reused across every BCBA-facing surface (dashboard, clients, workspace,
 * supervision, parent training, scheduling, authorizations) so a BCBA sees
 * the same client story everywhere.
 */

export type BcbaTimelineKind = "note" | "task" | "supervision" | "parent_training" | "plan_item";

interface TimelineItem {
  id: string;
  kind: BcbaTimelineKind;
  title: string;
  summary?: string | null;
  when: string;
  owner?: string | null;
  status?: string | null;
  syncStatus?: string | null;
}

const KIND_META: Record<BcbaTimelineKind, { label: string; icon: any; tone: string }> = {
  note:            { label: "Note",             icon: StickyNote,     tone: "text-slate-600 bg-slate-100" },
  task:            { label: "Task",             icon: ClipboardList,  tone: "text-violet-700 bg-violet-100" },
  supervision:     { label: "Supervision",      icon: ClipboardCheck, tone: "text-sky-700 bg-sky-100" },
  parent_training: { label: "Parent training",  icon: HeartHandshake, tone: "text-rose-700 bg-rose-100" },
  plan_item:       { label: "Treatment plan",   icon: FileSignature,  tone: "text-emerald-700 bg-emerald-100" },
};

const KINDS: BcbaTimelineKind[] = ["note", "task", "supervision", "parent_training", "plan_item"];

export function BcbaClientTimeline({
  scope,
  title = "Client activity",
  emptyHint = "Log a note, task, supervision, parent training or treatment plan item to start this client's operational timeline.",
  className,
}: {
  scope: BcbaWorkflowScope;
  title?: string;
  emptyHint?: string;
  className?: string;
}) {
  const wf = useBcbaWorkflow(scope);
  const isBroad = scope?.broad === true && !scope?.clientId && !scope?.clientName && !scope?.centralreachClientId;
  const [kindFilter, setKindFilter] = useState<BcbaTimelineKind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const items: TimelineItem[] = useMemo(() => {
    const rows: TimelineItem[] = [
      ...wf.notes.map((n) => ({
        id: `note:${n.id}`, kind: "note" as const, title: n.note_type ? `${cap(n.note_type)} note` : "Note",
        summary: n.body, when: n.created_at, owner: n.author_id, status: n.visibility ?? null,
        syncStatus: n.centralreach_sync_status ?? "pending_import",
      })),
      ...wf.tasks.map((t) => ({
        id: `task:${t.id}`, kind: "task" as const, title: t.title,
        summary: t.description, when: t.created_at, owner: t.assigned_bcba ?? t.assigned_to ?? t.created_by,
        status: t.status, syncStatus: t.centralreach_sync_status ?? "pending_import",
      })),
      ...wf.supervisionLogs.map((s) => ({
        id: `sup:${s.id}`, kind: "supervision" as const,
        title: `Supervision · ${s.modality ?? "overlap"}${s.minutes ? ` · ${s.minutes} min` : ""}`,
        summary: s.notes ?? s.next_action, when: s.occurred_at, owner: s.provider_name ?? s.bcba_id,
        status: s.service_code, syncStatus: s.centralreach_sync_status ?? "pending_import",
      })),
      ...wf.ptLogs.map((p) => ({
        id: `pt:${p.id}`, kind: "parent_training" as const,
        title: `Parent training${p.caregiver_name ? ` · ${p.caregiver_name}` : ""}`,
        summary: p.notes ?? p.next_session_plan, when: p.occurred_at, owner: p.bcba_id,
        status: p.participation_level, syncStatus: p.centralreach_sync_status ?? "pending_import",
      })),
      ...wf.planItems.map((pi) => ({
        id: `plan:${pi.id}`, kind: "plan_item" as const,
        title: `Treatment plan${pi.due_date ? ` · due ${pi.due_date}` : ""}`,
        summary: pi.qa_notes, when: pi.last_touched_at ?? pi.updated_at ?? pi.created_at,
        owner: pi.bcba_id, status: pi.status, syncStatus: pi.centralreach_sync_status ?? "pending_import",
      })),
    ];
    return rows
      .filter((r) => kindFilter === "all" || r.kind === kindFilter)
      .filter((r) => statusFilter === "all" || (r.status ?? "").toLowerCase() === statusFilter)
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
  }, [wf.notes, wf.tasks, wf.supervisionLogs, wf.ptLogs, wf.planItems, kindFilter, statusFilter]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of [...wf.tasks, ...wf.planItems]) if (r.status) set.add(String(r.status).toLowerCase());
    return Array.from(set).sort();
  }, [wf.tasks, wf.planItems]);

  return (
    <section className={cn("rounded-2xl border border-border/70 bg-card p-5 space-y-4", className)}>
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            {title}
            {isBroad && <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">(broad view)</span>}
          </h3>
          <p className="text-xs text-muted-foreground">
            {wf.loading ? "Loading activity…" : `${items.length} event${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-muted-foreground" />
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as any)}
            className="h-8 text-xs rounded-lg bg-muted/60 border border-border/70 px-2"
          >
            <option value="all">All types</option>
            {KINDS.map((k) => <option key={k} value={k}>{KIND_META[k].label}</option>)}
          </select>
          {statusOptions.length > 0 && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 text-xs rounded-lg bg-muted/60 border border-border/70 px-2"
            >
              <option value="all">Any status</option>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </header>

      {wf.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">
          Couldn't load activity: {wf.error}
        </div>
      )}

      {!wf.loading && items.length === 0 && !wf.error && (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/40 p-6 text-center">
          <p className="text-sm text-foreground">No activity for this client yet.</p>
          <p className="text-xs text-muted-foreground mt-1">{emptyHint}</p>
        </div>
      )}

      {items.length > 0 && (
        <ol className="space-y-3">
          {items.map((it) => {
            const meta = KIND_META[it.kind];
            const Icon = meta.icon;
            return (
              <li key={it.id} className="rounded-xl border border-border/60 bg-background/60 p-3">
                <div className="flex items-start gap-3">
                  <span className={cn("shrink-0 grid place-items-center size-8 rounded-lg", meta.tone)}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-sm font-medium leading-snug truncate">{it.title}</div>
                      <div className="flex items-center gap-1.5">
                        {it.status && (
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{it.status}</span>
                        )}
                        <BcbaCentralReachBadge status={it.syncStatus} />
                      </div>
                    </div>
                    {it.summary && (
                      <p className="mt-1 text-[13px] text-muted-foreground line-clamp-3">{it.summary}</p>
                    )}
                    <div className="mt-1.5 text-[11px] text-muted-foreground">
                      {meta.label} · {formatWhen(it.when)}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}