import { Link } from "react-router-dom";
import { AlertTriangle, Plus, LifeBuoy, Users2, ChevronRight, ShieldAlert } from "lucide-react";
import { CardFrame } from "../CardFrame";
import { useMyTickets, STATUS_LABEL, URGENCY_LABEL } from "./useSupport";
import { RetentionSupportPanel } from "./RetentionSupportPanel";

function StatusPill({ status }: { status: string }) {
  const map: Record<string,string> = {
    submitted:"bg-blue-500/10 text-blue-700 dark:text-blue-300",
    received:"bg-blue-500/10 text-blue-700 dark:text-blue-300",
    in_progress:"bg-amber-500/10 text-amber-700 dark:text-amber-300",
    waiting_for_you:"bg-orange-500/10 text-orange-700 dark:text-orange-300",
    resolved:"bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    closed:"bg-muted text-muted-foreground",
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export default function SupportHome() {
  const { tickets } = useMyTickets();
  const openTickets = (tickets ?? []).filter(t => !["resolved","closed"].includes(t.status));
  const recentClosed = (tickets ?? []).filter(t => ["resolved","closed"].includes(t.status)).slice(0,5);
  const waitingOnYou = openTickets.filter(t => t.status === "waiting_for_you");

  return (
    <div className="space-y-4 pb-8">
      {/* Urgent path — prominent */}
      <Link
        to="/rbt/app/support/urgent"
        className="block rounded-2xl border-2 border-red-500/40 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent p-5 hover:border-red-500/60 transition"
      >
        <div className="flex items-start gap-3">
          <span className="shrink-0 rounded-xl bg-red-500/15 p-2.5 text-red-600 dark:text-red-400">
            <ShieldAlert className="h-6 w-6" strokeWidth={2} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-red-700 dark:text-red-300">Urgent clinical or safety concern</h3>
            </div>
            <p className="text-sm text-red-900/80 dark:text-red-100/70 mt-1 leading-snug">
              For a safety concern, incident, or urgent clinical situation. <span className="font-medium">Not for emergencies — call 911.</span>
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-red-500 shrink-0 mt-1" />
        </div>
      </Link>

      {/* Primary CTAs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/rbt/app/support/new"
          className="rounded-2xl border border-border/70 bg-card p-4 hover:bg-muted/50 transition flex items-center gap-3 min-h-16">
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Plus className="h-5 w-5" strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">New support request</p>
            <p className="text-xs text-muted-foreground">We'll route it to the right person</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/rbt/app/support/team"
          className="rounded-2xl border border-border/70 bg-card p-4 hover:bg-muted/50 transition flex items-center gap-3 min-h-16">
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Users2 className="h-5 w-5" strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">My Support Team</p>
            <p className="text-xs text-muted-foreground">Your BCBA, scheduling, and more</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      {waitingOnYou.length > 0 && (
        <CardFrame title="Waiting for you" subtitle="A teammate needs a response" state="success">
          <ul className="divide-y divide-border/70">
            {waitingOnYou.map(t => <TicketRow key={t.id} t={t} />)}
          </ul>
        </CardFrame>
      )}

      <RetentionSupportPanel />

      <CardFrame
        title="Open requests"
        subtitle={openTickets.length ? `${openTickets.length} in progress` : undefined}
        state={tickets === null ? "loading" : openTickets.length === 0 ? "empty" : "success"}
        emptyLabel="You have no open requests. You're all set."
      >
        <ul className="divide-y divide-border/70">
          {openTickets.map(t => <TicketRow key={t.id} t={t} />)}
        </ul>
      </CardFrame>

      {recentClosed.length > 0 && (
        <CardFrame title="Recently closed" state="success">
          <ul className="divide-y divide-border/70">
            {recentClosed.map(t => <TicketRow key={t.id} t={t} />)}
          </ul>
        </CardFrame>
      )}
    </div>
  );
}

function TicketRow({ t }: { t: ReturnType<typeof useMyTickets>["tickets"] extends (infer U)[] | null ? U : never }) {
  return (
    <li>
      <Link to={`/rbt/app/support/${t!.id}`} className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition">
        <span className={`shrink-0 rounded-lg p-2 ${t!.is_urgent_safety ? "bg-red-500/10 text-red-600" : "bg-muted text-foreground/70"}`}>
          {t!.is_urgent_safety ? <AlertTriangle className="h-4 w-4" /> : <LifeBuoy className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{t!.subject || t!.category.replace(/_/g," ")}</p>
            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{t!.ticket_number}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {URGENCY_LABEL[t!.urgency] ?? t!.urgency} · {new Date(t!.updated_at).toLocaleDateString()}
          </p>
        </div>
        <StatusPill status={t!.status} />
      </Link>
    </li>
  );
}