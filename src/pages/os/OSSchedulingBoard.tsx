import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarClock, Search, MapPin, Clock, Sparkles, ChevronRight,
  CheckCircle2, ArrowUpRight, ListChecks,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientsContext";
import { type Client } from "@/data/clients";
import { StartDateDialog } from "@/components/scheduling/SchedulingDialogs";

type Lane = "suggested" | "confirmed" | "active";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function laneOf(c: Client): Lane | null {
  const paired = !!c.bcba && !!c.rbt;
  const authOk = c.authStatus === "Approved";
  if (paired && authOk && !c.startDate) return "suggested";
  if (c.startDate && c.startDate >= todayIso() && c.stage !== "Active") return "confirmed";
  if (c.stage === "Active") return "active";
  return null;
}

const LANE_LABEL: Record<Lane, string> = {
  suggested: "Suggested · Needs Start Date",
  confirmed: "Confirmed · Upcoming",
  active: "Active",
};

const LANE_TONE: Record<Lane, string> = {
  suggested: "border-primary/50 bg-primary/5",
  confirmed: "border-info/40 bg-info/5",
  active: "border-success/40 bg-success/5",
};

export default function OSSchedulingBoard() {
  const { clients } = useClients();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [stateFilter, setStateFilter] = useState(params.get("state") ?? "all");
  const [startFor, setStartFor] = useState<Client | null>(null);

  const states = useMemo(
    () => Array.from(new Set(clients.map((c) => c.state))).sort(),
    [clients],
  );

  const lanes = useMemo(() => {
    const grouped: Record<Lane, Client[]> = { suggested: [], confirmed: [], active: [] };
    for (const c of clients) {
      const l = laneOf(c);
      if (!l) continue;
      if (stateFilter !== "all" && c.state !== stateFilter) continue;
      if (query && !`${c.childName} ${c.bcba ?? ""} ${c.rbt ?? ""} ${c.clinic}`.toLowerCase().includes(query.toLowerCase())) continue;
      grouped[l].push(c);
    }
    grouped.suggested.sort((a, b) => b.daysInStage - a.daysInStage);
    grouped.confirmed.sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
    grouped.active.sort((a, b) => a.childName.localeCompare(b.childName));
    return grouped;
  }, [clients, query, stateFilter]);

  const syncParams = (next: { q?: string; state?: string }) => {
    const p = new URLSearchParams(params);
    if (next.q !== undefined) { next.q ? p.set("q", next.q) : p.delete("q"); }
    if (next.state !== undefined) { next.state !== "all" ? p.set("state", next.state) : p.delete("state"); }
    setParams(p, { replace: true });
  };

  return (
    <OSShell>
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-8 space-y-6">
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground inline-flex items-center gap-3">
                <CalendarClock className="size-7 text-primary" /> Scheduling Board
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground max-w-2xl">
                Live-first view of paired clients moving toward services. The Suggested queue surfaces every client ready to receive a confirmed start date.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/scheduling-workspace" className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition text-sm font-medium inline-flex items-center gap-2">
                <ListChecks className="size-4" /> Coverage Workspace
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LaneChip label="Suggested" value={lanes.suggested.length} tone="primary" />
            <LaneChip label="Confirmed Upcoming" value={lanes.confirmed.length} tone="info" />
            <LaneChip label="Active" value={lanes.active.length} tone="success" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); syncParams({ q: e.target.value }); }}
                placeholder="Search client, BCBA, RBT, clinic"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-border text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); syncParams({ state: e.target.value }); }}
              className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm text-foreground"
            >
              <option value="all">All states</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {(Object.keys(lanes) as Lane[]).map((lane) => (
            <LaneColumn
              key={lane}
              lane={lane}
              clients={lanes[lane]}
              onSetStartDate={(c) => setStartFor(c)}
            />
          ))}
        </div>
      </div>

      <StartDateDialog
        open={!!startFor}
        onOpenChange={(o) => !o && setStartFor(null)}
        client={startFor ? { id: startFor.id, childName: startFor.childName, state: startFor.state, rbt: startFor.rbt, bcba: startFor.bcba } : undefined}
        onSaved={() => setStartFor(null)}
      />
    </OSShell>
  );
}

function LaneColumn({
  lane,
  clients,
  onSetStartDate,
}: {
  lane: Lane;
  clients: Client[];
  onSetStartDate: (c: Client) => void;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] overflow-hidden", LANE_TONE[lane])}>
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-card">
        <h2 className="text-sm font-semibold tracking-tight text-foreground inline-flex items-center gap-2">
          {lane === "suggested" && <Sparkles className="size-4 text-primary" />}
          {LANE_LABEL[lane]}
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md tabular-nums">{clients.length}</span>
      </div>
      <div className="max-h-[720px] overflow-y-auto divide-y divide-border/50">
        {clients.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {lane === "suggested"
              ? "No paired clients waiting on a start date."
              : lane === "confirmed"
              ? "No upcoming starts scheduled."
              : "No active clients in scope."}
          </p>
        ) : (
          clients.map((c) => (
            <BoardCard key={c.id} client={c} lane={lane} onSetStartDate={() => onSetStartDate(c)} />
          ))
        )}
      </div>
    </div>
  );
}

function BoardCard({ client, lane, onSetStartDate }: { client: Client; lane: Lane; onSetStartDate: () => void }) {
  const approved = client.approvedWeeklyHours ?? 0;
  const aging = client.daysInStage;
  return (
    <div className="p-3.5 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">{client.childName}</p>
            {lane === "suggested" && aging > 7 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive">
                {aging}d waiting
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{client.state} · {client.clinic}</span>
            {approved > 0 && <span className="inline-flex items-center gap-1"><Clock className="size-3" />{approved}h/wk</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-muted-foreground">BCBA: <span className="text-foreground">{client.bcba ?? "—"}</span></span>
            <span className="text-muted-foreground">RBT: <span className="text-foreground">{client.rbt ?? "—"}</span></span>
            {client.startDate && (
              <span className="inline-flex items-center gap-1 text-success">
                <CheckCircle2 className="size-3" /> Start {client.startDate}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {lane === "suggested" ? (
            <button
              onClick={onSetStartDate}
              className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition inline-flex items-center gap-1"
            >
              <CalendarClock className="size-3" /> Set Start Date
            </button>
          ) : (
            <button
              onClick={onSetStartDate}
              className="h-7 px-3 rounded-lg text-xs text-muted-foreground hover:bg-muted transition"
            >
              Adjust
            </button>
          )}
          <Link
            to={`/clients/${client.id}`}
            className="text-[11px] text-primary inline-flex items-center gap-1 hover:underline"
          >
            Open <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function LaneChip({ label, value, tone }: { label: string; value: number; tone: "primary" | "info" | "success" }) {
  const toneClass = tone === "primary" ? "text-primary" : tone === "info" ? "text-info" : "text-success";
  return (
    <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-card border border-border/70 text-sm">
      <span className={cn("font-semibold tabular-nums", toneClass)}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _ChevronRight = ChevronRight;