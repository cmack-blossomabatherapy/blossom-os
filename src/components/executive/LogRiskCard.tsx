/**
 * LogRiskCard — inline creator for executive_risks.
 * Persists via useExecutiveRisks and shows the last N logged risks.
 */
import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { ExecCard } from "@/pages/os/executive/_shared";
import { useExecutiveRisks } from "@/hooks/useExecutiveWorkItems";
import { cn } from "@/lib/utils";

const SEV_TONE: Record<string, string> = {
  critical: "text-rose-700 bg-rose-500/10 border-rose-200",
  high: "text-amber-700 bg-amber-500/10 border-amber-200",
  medium: "text-foreground/80 bg-muted/60 border-border/60",
  low: "text-emerald-700 bg-emerald-500/10 border-emerald-200",
};

export function LogRiskCard() {
  const { data, isLoading, create } = useExecutiveRisks("open");
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("high");
  const [department, setDepartment] = useState("");
  const [stateCode, setStateCode] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await create.mutateAsync({
        title: title.trim(),
        severity,
        department: department || null,
        state_code: stateCode || null,
      });
      setTitle("");
      setDepartment("");
      setStateCode("");
      setSeverity("high");
      toast.success("Strategic risk logged");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not log risk");
    }
  };

  const items = (data ?? []).slice(0, 6);

  return (
    <ExecCard title="Log strategic risk" hint="Persisted to leadership risk log">
      <form onSubmit={submit} className="mb-4 rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Risk headline…"
            className="min-w-[220px] flex-1 bg-transparent px-2 py-1.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
          />
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Dept"
            className="w-24 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
          />
          <input
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="ST"
            className="w-14 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px] uppercase"
          />
          <button
            type="submit"
            disabled={!title.trim() || create.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-[12px] font-medium text-background transition hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3" />}
            Log risk
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center">
          <div className="text-[13px] font-medium text-foreground/80">No open strategic risks logged.</div>
          <div className="mt-1 text-[12px] text-muted-foreground">Log one above when leadership identifies a new risk.</div>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((r: any) => (
            <li key={r.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium leading-snug">{r.title}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted-foreground">
                  {r.department && <span>{r.department}</span>}
                  {r.state_code && <span>· {r.state_code}</span>}
                  <span>· logged {new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                  SEV_TONE[r.severity] ?? SEV_TONE.medium,
                )}
              >
                {r.severity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ExecCard>
  );
}