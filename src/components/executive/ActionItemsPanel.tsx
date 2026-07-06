/**
 * ActionItemsPanel
 *
 * Reusable card for creating and working leadership action items
 * (executive_work_items). Drop into any executive page and pass a
 * `sourcePage` string so the item is linked back to its origin.
 *
 * Renders:
 *   - list of open items with owner, priority, due, complete action
 *   - a compact "Add action item" inline form (title + priority + due)
 *   - empty state
 */
import { useState } from "react";
import { ArrowUpRight, Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ExecCard } from "@/pages/os/executive/_shared";
import { useExecutiveWorkItems } from "@/hooks/useExecutiveWorkItems";
import { cn } from "@/lib/utils";

type Props = {
  sourcePage: string;
  department?: string;
  stateCode?: string;
  title?: string;
  hint?: string;
  limit?: number;
  className?: string;
};

const PRIORITY_TONE: Record<string, string> = {
  urgent: "bg-rose-500/10 text-rose-700 border-rose-200",
  high: "bg-amber-500/10 text-amber-700 border-amber-200",
  normal: "bg-muted/60 text-foreground/70 border-border/60",
  low: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
};

export function ActionItemsPanel({
  sourcePage,
  department,
  stateCode,
  title = "Leadership action items",
  hint = "Open · assigned by leadership",
  limit = 20,
  className,
}: Props) {
  const { data, isLoading, create, update } = useExecutiveWorkItems({
    status: "open",
    department,
    state_code: stateCode,
    limit,
  });
  const [newTitle, setNewTitle] = useState("");
  const [priority, setPriority] = useState("normal");
  const [due, setDue] = useState("");

  const items = data ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = newTitle.trim();
    if (!t) return;
    try {
      await create.mutateAsync({
        title: t,
        priority,
        due_date: due || null,
        department: department ?? null,
        state_code: stateCode ?? null,
        source_page: sourcePage,
        status: "open",
      });
      setNewTitle("");
      setPriority("normal");
      setDue("");
      toast.success("Action item created");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not create action item");
    }
  };

  const complete = async (id: string) => {
    try {
      await update.mutateAsync({ id, patch: { status: "completed" } });
      toast.success("Marked complete");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update");
    }
  };

  return (
    <ExecCard title={title} hint={hint} className={className}>
      <form onSubmit={handleCreate} className="mb-4 rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add leadership action item…"
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
            aria-label="Priority"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
            aria-label="Due date"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || create.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-[12px] font-medium text-background transition hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center">
          <div className="text-[13px] font-medium text-foreground/80">No open action items.</div>
          <div className="mt-1 text-[12px] text-muted-foreground">You're all caught up.</div>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0">
              <button
                onClick={() => complete(item.id)}
                aria-label="Mark complete"
                className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:bg-emerald-500/10 hover:text-emerald-600"
              >
                <Check className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-[13.5px] font-medium leading-snug text-foreground/90">
                    {item.title}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                      PRIORITY_TONE[item.priority] ?? PRIORITY_TONE.normal,
                    )}
                  >
                    {item.priority}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted-foreground">
                  {item.due_date && <span>Due {item.due_date}</span>}
                  {item.department && <span>· {item.department}</span>}
                  {item.state_code && <span>· {item.state_code}</span>}
                  {item.source_page && (
                    <span className="inline-flex items-center gap-0.5">
                      · from {item.source_page}
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ExecCard>
  );
}