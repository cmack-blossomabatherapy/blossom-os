/**
 * LeadershipEscalationsPanel
 *
 * Persistent leadership-owned escalations (category="escalation") that
 * complements the derived operational blocker view on
 * /operations/escalations. Leadership can log an escalation with owner
 * + due date, and mark it resolved.
 */
import { useMemo, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ExecCard } from "@/pages/os/executive/_shared";
import { useExecutiveWorkItems } from "@/hooks/useExecutiveWorkItems";

export function LeadershipEscalationsPanel() {
  const { data, isLoading, create, update } = useExecutiveWorkItems({ limit: 100 });
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("high");

  const items = useMemo(
    () =>
      (data ?? []).filter(
        (i) => i.category === "escalation" && i.status !== "completed" && i.status !== "resolved",
      ),
    [data],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    try {
      await create.mutateAsync({
        title: t,
        category: "escalation",
        priority,
        status: "open",
        owner_name: owner || null,
        due_date: due || null,
        source_page: "operations/escalations",
      });
      setTitle("");
      setOwner("");
      setDue("");
      setPriority("high");
      toast.success("Escalation logged");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not log escalation");
    }
  };

  const resolve = async (id: string) => {
    try {
      await update.mutateAsync({ id, patch: { status: "resolved" } });
      toast.success("Marked resolved");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update");
    }
  };

  return (
    <ExecCard
      title="Leadership escalations"
      hint="Persisted · logged by leadership for coordination"
    >
      <form
        onSubmit={submit}
        className="mb-4 rounded-xl border border-border/60 bg-background/40 p-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Log a leadership escalation…"
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
          />
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Owner"
            className="w-28 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
            aria-label="Due"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
          >
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
          <button
            type="submit"
            disabled={!title.trim() || create.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-[12px] font-medium text-background transition hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Log
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center text-[13px] text-muted-foreground">
          No open leadership escalations.
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((i) => (
            <li key={i.id} className="flex items-start gap-3 py-2.5 first:pt-0">
              <button
                onClick={() => resolve(i.id)}
                aria-label="Resolve"
                className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:bg-emerald-500/10 hover:text-emerald-600"
              >
                <Check className="h-3 w-3" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-foreground/90">{i.title}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted-foreground">
                  <span className="uppercase tracking-wide">{i.priority}</span>
                  {i.owner_name && <span>· {i.owner_name}</span>}
                  {i.due_date && <span>· due {i.due_date}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ExecCard>
  );
}