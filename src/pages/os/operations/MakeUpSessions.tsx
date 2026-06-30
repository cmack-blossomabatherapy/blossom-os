import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, RefreshCcw } from "lucide-react";
import { useSchedulingActions } from "@/hooks/useSchedulingActions";
import { CRSyncBadge } from "@/components/scheduling/SchedulingDialogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Status = "needed" | "offered" | "scheduled" | "completed" | "declined";
const STATUSES: { key: Status; label: string }[] = [
  { key: "needed", label: "Needed" },
  { key: "offered", label: "Offered" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
  { key: "declined", label: "Declined" },
];

type Row = {
  id: string;
  client_id: string | null;
  session_date: string | null;
  start_time: string | null;
  end_time: string | null;
  state: string | null;
  rbt_name: string | null;
  bcba_name: string | null;
  reason: string | null;
  make_up_status: Status;
  make_up_date: string | null;
  family_notified: boolean | null;
  bcba_notified: boolean | null;
  centralreach_sync_status: string | null;
};

export default function MakeUpSessions() {
  const { listMakeUpCancellations, updateMakeUp } = useSchedulingActions();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await listMakeUpCancellations();
    setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  }, [listMakeUpCancellations]);

  useEffect(() => { void reload(); }, [reload]);

  const counts = useMemo(() => {
    const m: Record<Status, number> = { needed: 0, offered: 0, scheduled: 0, completed: 0, declined: 0 };
    for (const r of rows) m[r.make_up_status] = (m[r.make_up_status] ?? 0) + 1;
    return m;
  }, [rows]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.make_up_status === filter);

  const setStatus = async (id: string, status: Status, makeUpDate?: string) => {
    await updateMakeUp(id, { make_up_status: status, ...(makeUpDate ? { make_up_date: makeUpDate } : {}) });
    toast.success(`Marked ${status}.`);
    void reload();
  };

  const notify = async (id: string, who: "family" | "bcba") => {
    await updateMakeUp(id, who === "family" ? { family_notified: true } : { bcba_notified: true });
    toast.success(`${who === "family" ? "Family" : "BCBA"} notified.`);
    void reload();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-8 space-y-6">
      <header className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Scheduling</p>
          <h1 className="text-3xl font-semibold tracking-tight inline-flex items-center gap-2"><CalendarPlus className="size-6 text-primary" /> Make-Up Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Live make-up workflow driven by scheduling_cancellations where make_up_required = true.
            CentralReach API not connected yet — confirmed make-ups are queued for future sync.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reload}><RefreshCcw className="size-3.5 mr-1.5" /> Refresh</Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter("all")} className={`text-xs px-3 h-8 rounded-full border ${filter === "all" ? "bg-primary text-primary-foreground" : "border-border/70"}`}>All · {rows.length}</button>
        {STATUSES.map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)} className={`text-xs px-3 h-8 rounded-full border ${filter === s.key ? "bg-primary text-primary-foreground" : "border-border/70"}`}>
            {s.label} · {counts[s.key] ?? 0}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Client</th>
                <th className="text-left font-medium px-4 py-2.5">Missed</th>
                <th className="text-left font-medium px-4 py-2.5">Make-up</th>
                <th className="text-left font-medium px-4 py-2.5">RBT / BCBA</th>
                <th className="text-left font-medium px-4 py-2.5">Reason</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-left font-medium px-4 py-2.5">CR Sync</th>
                <th className="text-right font-medium px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Loading make-ups…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No make-up sessions required right now.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-foreground">{r.client_id ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.session_date ?? "—"} {r.start_time ?? ""}</td>
                  <td className="px-4 py-2.5">
                    <DateCell value={r.make_up_date ?? ""} onChange={(v) => setStatus(r.id, "scheduled", v)} />
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.rbt_name ?? "—"}<br/>{r.bcba_name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs max-w-xs truncate">{r.reason ?? "—"}</td>
                  <td className="px-4 py-2.5"><span className="text-[11px] font-medium px-2 py-0.5 rounded bg-muted">{r.make_up_status}</span></td>
                  <td className="px-4 py-2.5"><CRSyncBadge status={r.centralreach_sync_status} /></td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex flex-wrap gap-1 justify-end">
                      <button onClick={() => setStatus(r.id, "offered")} className="text-[11px] px-2 h-7 rounded-md border border-border/70 hover:bg-muted">Mark Offered</button>
                      <button onClick={() => setStatus(r.id, "scheduled")} className="text-[11px] px-2 h-7 rounded-md border border-border/70 hover:bg-muted">Scheduled</button>
                      <button onClick={() => setStatus(r.id, "completed")} className="text-[11px] px-2 h-7 rounded-md border border-border/70 hover:bg-muted">Completed</button>
                      <button onClick={() => setStatus(r.id, "declined")} className="text-[11px] px-2 h-7 rounded-md border border-border/70 hover:bg-muted">Declined</button>
                      <button onClick={() => notify(r.id, "family")} className={`text-[11px] px-2 h-7 rounded-md border ${r.family_notified ? "bg-success/10 text-success border-success/30" : "border-border/70 hover:bg-muted"}`}>Notify Family</button>
                      <button onClick={() => notify(r.id, "bcba")} className={`text-[11px] px-2 h-7 rounded-md border ${r.bcba_notified ? "bg-success/10 text-success border-success/30" : "border-border/70 hover:bg-muted"}`}>Notify BCBA</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DateCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [v, setV] = useState(value ?? "");
  return (
    <Input type="date" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v && v !== value && onChange(v)} className="h-7 text-xs w-36" />
  );
}