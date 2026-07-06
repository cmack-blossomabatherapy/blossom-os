/**
 * LogDecisionCard — persist leadership decisions to executive_decisions.
 */
import { useState } from "react";
import { Gavel, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ExecCard } from "@/pages/os/executive/_shared";
import { useExecutiveDecisions } from "@/hooks/useExecutiveWorkItems";

export function LogDecisionCard() {
  const { data, isLoading, create } = useExecutiveDecisions();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [department, setDepartment] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await create.mutateAsync({
        title: title.trim(),
        summary: summary || null,
        department: department || null,
      });
      setTitle("");
      setSummary("");
      setDepartment("");
      toast.success("Decision logged");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not log decision");
    }
  };

  const items = (data ?? []).slice(0, 8);

  return (
    <ExecCard title="Log leadership decision" hint="Persisted to leadership decision log">
      <form onSubmit={submit} className="mb-4 space-y-2 rounded-xl border border-border/60 bg-background/40 p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Decision headline…"
          className="w-full bg-transparent px-2 py-1.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Short summary (optional)"
          rows={2}
          className="w-full resize-none rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[12.5px] outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department (optional)"
            className="w-40 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
          />
          <button
            type="submit"
            disabled={!title.trim() || create.isPending}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-[12px] font-medium text-background transition hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Gavel className="h-3 w-3" />}
            Log decision
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center">
          <div className="text-[13px] font-medium text-foreground/80">No recorded decisions yet.</div>
          <div className="mt-1 text-[12px] text-muted-foreground">Log the first leadership decision above.</div>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((d: any) => (
            <li key={d.id} className="py-2.5 first:pt-0">
              <div className="text-[13.5px] font-medium leading-snug">{d.title}</div>
              {d.summary && (
                <div className="mt-0.5 text-[12.5px] text-muted-foreground leading-relaxed">{d.summary}</div>
              )}
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {d.department ? `${d.department} · ` : ""}{d.decision_date}
              </div>
            </li>
          ))}
        </ul>
      )}
    </ExecCard>
  );
}