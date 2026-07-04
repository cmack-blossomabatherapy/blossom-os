import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, ChevronRight, MapPin, Stethoscope, CheckCircle2, AlertTriangle } from "lucide-react";
import { OSShell } from "./OSShell";
import { useRbtWorkflow } from "@/hooks/useRbtWorkflow";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Range = "today" | "week" | "all";

function fmtTime(t?: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const d = new Date(); d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function OSRBTSchedule() {
  const wf = useRbtWorkflow();
  const [params] = useSearchParams();
  const clientFilter = params.get("client");
  const [range, setRange] = useState<Range>("week");

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);
    return wf.sessions.filter((s) => {
      if (clientFilter && s.client_id !== clientFilter) return false;
      if (range === "today") return s.session_date === today;
      if (range === "week") return s.session_date >= today && s.session_date <= weekEndStr;
      return true;
    });
  }, [wf.sessions, range, clientFilter]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    filtered.forEach((s) => { const a = m.get(s.session_date) ?? []; a.push(s); m.set(s.session_date, a); });
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-6xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <Calendar className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">My Schedule</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Sessions imported from Blossom OS scheduling. CentralReach IDs are preserved for future sync.
            </p>
          </div>
        </header>

        <div className="mb-4 flex items-center gap-2">
          {(["today", "week", "all"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={cn("h-9 px-3 rounded-xl text-[12.5px] border", range === r ? "bg-primary text-primary-foreground border-primary" : "border-border/70 bg-card hover:bg-muted")}>
              {r === "today" ? "Today" : r === "week" ? "This week" : "All upcoming"}
            </button>
          ))}
          <Link to="/rbt/help?category=schedule" className="ml-auto text-[12px] text-primary hover:underline flex items-center gap-1">
            Report schedule issue <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {wf.loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Loading schedule…</div>
        ) : grouped.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
            No sessions in this range.
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, rows]) => (
              <section key={date}>
                <h2 className="text-[12.5px] font-medium tracking-tight mb-2">{fmtDate(date)}</h2>
                <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
                  {rows.map((s) => (
                    <div key={s.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="w-28 shrink-0">
                        <p className="text-[12px] font-medium tracking-tight">{fmtTime(s.start_time)}</p>
                        <p className="text-[10.5px] text-muted-foreground">→ {fmtTime(s.end_time)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium truncate">{s.client_name}</p>
                        <p className="text-[11.5px] text-muted-foreground truncate flex items-center gap-2">
                          <MapPin className="h-3 w-3" />{s.location || "Location TBD"}
                          <Stethoscope className="h-3 w-3 ml-1" />{s.service_code || "—"}
                        </p>
                        {s.session_status === "canceled" && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10.5px] rounded-full border border-destructive/20 bg-destructive/10 text-destructive px-2 py-0.5">
                            <AlertTriangle className="h-3 w-3" />Canceled{s.cancellation_reason ? ` — ${s.cancellation_reason}` : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!s.confirmed_by_rbt_at && s.session_status !== "canceled" && (
                          <button onClick={async () => { await wf.confirmSession(s.id); toast({ title: "Confirmed" }); }}
                            className="h-8 px-2.5 rounded-lg text-[12px] bg-primary text-primary-foreground hover:opacity-90">Confirm</button>
                        )}
                        {s.confirmed_by_rbt_at && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5">
                            <CheckCircle2 className="h-3 w-3" />Confirmed
                          </span>
                        )}
                        <Link to={`/rbt/session-support?session=${s.id}`} className="h-8 px-2.5 rounded-lg text-[12px] border border-border/70 bg-card hover:bg-muted inline-flex items-center">
                          Support
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </OSShell>
  );
}
