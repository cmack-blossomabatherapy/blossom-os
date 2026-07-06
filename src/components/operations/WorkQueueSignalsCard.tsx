/**
 * WorkQueueSignalsCard
 *
 * Persistent Work Queue signals for the Operations Command Center and
 * risk workspaces. Reads from `operations_work_items` via `useWorkQueue`
 * (Supabase-backed) and surfaces open / escalated / high-priority
 * counts with deep links into the Work Queue and Escalation Center.
 *
 * Empty state until real items are created — no mock data.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Flame, Inbox, ListChecks } from "lucide-react";
import { OpsCard, EmptyRow } from "@/pages/os/operations/_shared";
import { useWorkQueue } from "@/hooks/useWorkQueue";
import { cn } from "@/lib/utils";

export function WorkQueueSignalsCard({ compact = false }: { compact?: boolean }) {
  const { items, loading } = useWorkQueue();

  const CLOSED = new Set(["resolved", "closed", "ignored"]);
  const stats = useMemo(() => {
    const open = items.filter((i) => i.status === "open" || i.status === "in_progress" || i.status === "new");
    const escalated = items.filter((i) => i.status === "escalated" || i.escalatedAt);
    const urgent = items.filter((i) => i.priority === "urgent" || i.priority === "high");
    const overdue = items.filter(
      (i) => i.dueDate && new Date(i.dueDate) < new Date() && !CLOSED.has(i.status),
    );
    const recent = [...items]
      .filter((i) => !CLOSED.has(i.status))
      .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))
      .slice(0, compact ? 3 : 5);
    return { open, escalated, urgent, overdue, recent };
  }, [items, compact]);

  const tiles = [
    { id: "open", label: "Open", value: stats.open.length, icon: ListChecks, to: "/work-queue?status=active", tone: "neutral" as const },
    { id: "esc", label: "Escalated", value: stats.escalated.length, icon: AlertTriangle, to: "/work-queue/escalations", tone: stats.escalated.length > 0 ? "risk" as const : "neutral" as const },
    { id: "urg", label: "High / Urgent", value: stats.urgent.length, icon: Flame, to: "/work-queue?priority=urgent", tone: stats.urgent.length > 0 ? "attention" as const : "neutral" as const },
    { id: "over", label: "Overdue", value: stats.overdue.length, icon: Inbox, to: "/work-queue?view=overdue", tone: stats.overdue.length > 0 ? "attention" as const : "neutral" as const },
  ];

  return (
    <OpsCard
      title="Operations work queue"
      hint="Persistent · shared across leadership"
    >
      <div className="mb-3 flex justify-end">
        <Link
          to="/work-queue"
          className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-[11.5px] text-muted-foreground hover:border-border hover:text-foreground"
        >
          Open queue <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              to={t.to}
              className={cn(
                "group rounded-xl border border-border/60 bg-background/50 p-3 transition hover:-translate-y-0.5 hover:border-border",
                t.tone === "risk" && "border-rose-500/40",
                t.tone === "attention" && "border-amber-500/40",
              )}
            >
              <div className="flex items-center justify-between">
                <Icon
                  className={cn("h-3.5 w-3.5", {
                    "text-rose-500": t.tone === "risk",
                    "text-amber-500": t.tone === "attention",
                    "text-muted-foreground": t.tone === "neutral",
                  })}
                />
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="mt-2 text-[22px] font-semibold tabular-nums leading-none">{t.value}</div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">{t.label}</div>
            </Link>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Latest activity
          </div>
          {loading ? (
            <EmptyRow>Loading work items…</EmptyRow>
          ) : stats.recent.length === 0 ? (
            <EmptyRow>No active work items — the queue is clear.</EmptyRow>
          ) : (
            <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
              {stats.recent.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 bg-background/40 px-3 py-2 text-[13px]">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground/90">{i.title}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">
                      {[i.department, i.ownerName ?? "Unassigned", i.priority].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span
                    className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] uppercase tracking-wider", {
                      "bg-rose-500/10 text-rose-600 dark:text-rose-400": i.status === "escalated" || i.status === "blocked",
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400": i.status === "in_progress" || i.status === "waiting",
                      "bg-muted text-muted-foreground": i.status === "open" || i.status === "new",
                    })}
                  >
                    {i.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </OpsCard>
  );
}