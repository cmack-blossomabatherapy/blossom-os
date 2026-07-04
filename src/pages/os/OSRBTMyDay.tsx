import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock, MapPin, Stethoscope, CheckCircle2, MessageSquare,
  LifeBuoy, GraduationCap, BellRing, AlertTriangle, ClipboardCheck,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useRbtWorkflow, type RbtSession } from "@/hooks/useRbtWorkflow";
import { RbtCentralReachSummaryBadge } from "@/components/rbt/RbtCentralReachBadge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

function fmtTime(t?: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const d = new Date(); d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function CRBadge({ status }: { status?: string | null }) {
  const label = !status ? "CentralReach pending connection"
    : status === "synced" ? "CentralReach synced"
    : status === "ready" ? "CentralReach import-ready"
    : status === "error" ? "CentralReach sync error"
    : `CentralReach ${status.replace(/_/g, " ")}`;
  const tone = status === "synced" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
    : status === "error" ? "bg-destructive/10 text-destructive border-destructive/20"
    : "bg-muted text-muted-foreground border-border/70";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px]", tone)}>
      {label}
    </span>
  );
}

function SessionRow({ s, onConfirm, onAck }: { s: RbtSession; onConfirm: () => void; onAck: () => void }) {
  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center gap-3 border-b border-border/70 last:border-b-0">
      <div className="w-28 shrink-0">
        <p className="text-[12px] font-medium tracking-tight">{fmtTime(s.start_time)}</p>
        <p className="text-[10.5px] text-muted-foreground">→ {fmtTime(s.end_time)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium tracking-tight truncate">{s.client_name}</p>
        <p className="text-[11.5px] text-muted-foreground truncate flex items-center gap-2 mt-0.5">
          <MapPin className="h-3 w-3" />{s.location || "Location TBD"}
          <Stethoscope className="h-3 w-3 ml-1" />{s.service_code || "—"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <CRBadge status={s.centralreach_sync_status} />
          {s.confirmed_by_rbt_at && (
            <span className="text-[10.5px] rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />Confirmed
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {!s.confirmed_by_rbt_at && (
          <button onClick={onConfirm} className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] bg-primary text-primary-foreground hover:opacity-90">
            Confirm
          </button>
        )}
        {!s.acknowledged_by_rbt_at && (
          <button onClick={onAck} className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] border border-border/70 bg-card hover:bg-muted">
            Acknowledge
          </button>
        )}
        <Link to={`/rbt/session-support?session=${s.id}`} className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] border border-border/70 bg-card hover:bg-muted">
          Support
        </Link>
      </div>
    </div>
  );
}

export default function OSRBTMyDay() {
  const wf = useRbtWorkflow();
  const [reason, setReason] = useState("");

  const supDueToday = useMemo(() => wf.supervision.filter((s) => s.supervision_date === new Date().toISOString().slice(0, 10)), [wf.supervision]);
  const openActions = wf.messages.filter((m) => m.action_required && !m.completed_at);
  const openHelp = wf.helpRequests.filter((h) => h.status !== "resolved" && h.status !== "closed");

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-6xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <CalendarClock className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">My Day</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Your sessions, action items, supervision, and training for today.
            </p>
            <div className="mt-2">
              <RbtCentralReachSummaryBadge pendingCount={wf.metrics.pendingCentralReachSync} />
            </div>
          </div>
        </header>

        {wf.loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Loading your day…</div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6 min-w-0">
              <section className="rounded-2xl border border-border/70 bg-card">
                <header className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                  <div>
                    <p className="text-[12.5px] font-medium tracking-tight">Today's sessions</p>
                    <p className="text-[11px] text-muted-foreground">{wf.todaySessions.length} scheduled</p>
                  </div>
                  <Link to="/rbt/schedule" className="text-[12px] text-primary hover:underline">Full schedule →</Link>
                </header>
                {wf.todaySessions.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No sessions scheduled today.</div>
                ) : (
                  wf.todaySessions.map((s) => (
                    <SessionRow key={s.id} s={s}
                      onConfirm={async () => { await wf.confirmSession(s.id); toast({ title: "Session confirmed" }); }}
                      onAck={async () => { await wf.acknowledgeSession(s.id); toast({ title: "Session acknowledged" }); }}
                    />
                  ))
                )}
              </section>

              <section className="rounded-2xl border border-border/70 bg-card">
                <header className="px-4 py-3 border-b border-border/70">
                  <p className="text-[12.5px] font-medium tracking-tight">Action items</p>
                  <p className="text-[11px] text-muted-foreground">{openActions.length} require your attention</p>
                </header>
                {openActions.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</div>
                ) : (
                  openActions.slice(0, 6).map((m) => (
                    <div key={m.id} className="px-4 py-3 border-b border-border/70 last:border-b-0 flex items-center gap-3">
                      <BellRing className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium tracking-tight truncate">{m.title}</p>
                        {m.body && <p className="text-[11.5px] text-muted-foreground truncate">{m.body}</p>}
                      </div>
                      <button onClick={async () => { await wf.markMessageComplete(m.id); toast({ title: "Marked complete" }); }}
                        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] border border-border/70 bg-card hover:bg-muted">
                        Complete
                      </button>
                    </div>
                  ))
                )}
              </section>

              {(supDueToday.length > 0 || openHelp.length > 0) && (
                <section className="rounded-2xl border border-border/70 bg-card">
                  <header className="px-4 py-3 border-b border-border/70">
                    <p className="text-[12.5px] font-medium tracking-tight">Reminders</p>
                  </header>
                  {supDueToday.map((s) => (
                    <div key={s.id} className="px-4 py-3 border-b border-border/70 last:border-b-0 flex items-center gap-3">
                      <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                      <p className="text-[12.5px] flex-1">Supervision today — {s.supervision_type || "check-in"}</p>
                      <Link to="/rbt/supervision" className="text-[12px] text-primary hover:underline">Open</Link>
                    </div>
                  ))}
                  {openHelp.slice(0, 3).map((h) => (
                    <div key={h.id} className="px-4 py-3 border-b border-border/70 last:border-b-0 flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <p className="text-[12.5px] flex-1 truncate">Open help: {h.category} — {h.description}</p>
                      <Link to="/rbt/help" className="text-[12px] text-primary hover:underline">View</Link>
                    </div>
                  ))}
                </section>
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Quick actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/rbt/help" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted">
                    <LifeBuoy className="h-3.5 w-3.5" />Request help
                  </Link>
                  <Link to="/rbt/messages" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted">
                    <MessageSquare className="h-3.5 w-3.5" />Messages
                  </Link>
                  <Link to="/rbt/training-academy" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted">
                    <GraduationCap className="h-3.5 w-3.5" />Training
                  </Link>
                  <Link to="/rbt/clients" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted">
                    <Stethoscope className="h-3.5 w-3.5" />My clients
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">CentralReach</p>
                <p className="text-[12px] text-muted-foreground">Session data is import-ready. Live CentralReach sync is not connected yet — sync status is shown per session.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
      {reason && null}
    </OSShell>
  );
}
