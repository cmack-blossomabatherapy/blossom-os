import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ShieldCheck, CalendarClock, Search, FolderKanban,
  ChevronRight, Activity, Users,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOSRole } from "@/contexts/OSRoleContext";
import { buildClientDetailHref } from "@/lib/os/reporting/clientRouteBuilder";

type ClientRow = {
  id: string;
  child_name: string;
  state: string;
  bcba: string | null;
  rbt: string | null;
  stage: string;
  auth_status: string;
  qa_status: string;
  staffing_status: string;
  next_task_due: string | null;
  blockers: string[] | null;
};

type AuthRow = {
  client_id: string;
  status: string;
  expiration_date: string | null;
};

type Tone = "ok" | "warn" | "crit";
const toneClasses: Record<Tone, string> = {
  ok: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
  crit: "bg-destructive/10 text-destructive ring-destructive/20",
};

function daysFromNow(date: string | null) {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default function OSCaseManagement() {
  const { activeState } = useOSRole();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [auths, setAuths] = useState<AuthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "at_risk" | "needs_staff" | "auth_expiring" | "qa">("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const cQ = supabase
        .from("clients")
        .select("id,child_name,state,bcba,rbt,stage,auth_status,qa_status,staffing_status,next_task_due,blockers")
        .eq("stage", "Active")
        .order("child_name", { ascending: true })
        .limit(1000);
      const aQ = supabase
        .from("client_authorizations")
        .select("client_id,status,expiration_date")
        .limit(2000);
      const [{ data: cd }, { data: ad }] = await Promise.all([cQ, aQ]);
      if (!alive) return;
      const filteredClients = (cd ?? []).filter((c: ClientRow) =>
        !activeState ? true : c.state === activeState,
      );
      setClients(filteredClients);
      setAuths((ad ?? []) as AuthRow[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [activeState]);

  const enriched = useMemo(() => {
    const authByClient = new Map<string, AuthRow[]>();
    auths.forEach((a) => {
      const list = authByClient.get(a.client_id) ?? [];
      list.push(a);
      authByClient.set(a.client_id, list);
    });
    return clients.map((c) => {
      const cAuths = authByClient.get(c.id) ?? [];
      const expiring = cAuths
        .map((a) => daysFromNow(a.expiration_date))
        .filter((d): d is number => d !== null && d <= 30 && d >= 0);
      const expired = cAuths.some((a) => {
        const d = daysFromNow(a.expiration_date);
        return d !== null && d < 0;
      });
      const overdueTask = c.next_task_due
        ? (daysFromNow(c.next_task_due) ?? 0) < 0
        : false;
      const blockerCount = (c.blockers ?? []).length;
      const needsStaff = !c.rbt || c.staffing_status === "Open";
      const qaIssue = c.qa_status === "Needs Review" || c.qa_status === "Flagged";
      const risk: Tone =
        expired || blockerCount > 0
          ? "crit"
          : expiring.length > 0 || overdueTask || needsStaff || qaIssue
          ? "warn"
          : "ok";
      return { ...c, risk, expiringIn: expiring[0] ?? null, expired, overdueTask, needsStaff, qaIssue, blockerCount };
    });
  }, [clients, auths]);

  const kpis = useMemo(() => ({
    total: enriched.length,
    atRisk: enriched.filter((c) => c.risk === "crit").length,
    watch: enriched.filter((c) => c.risk === "warn").length,
    needsStaff: enriched.filter((c) => c.needsStaff).length,
    expiringAuths: enriched.filter((c) => c.expiringIn !== null || c.expired).length,
  }), [enriched]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((c) => {
      if (q && !c.child_name.toLowerCase().includes(q) && !(c.bcba ?? "").toLowerCase().includes(q)) return false;
      if (filter === "at_risk") return c.risk === "crit";
      if (filter === "needs_staff") return c.needsStaff;
      if (filter === "auth_expiring") return c.expiringIn !== null || c.expired;
      if (filter === "qa") return c.qaIssue;
      return true;
    });
  }, [enriched, search, filter]);

  return (
    <OSShell>
      <header className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(220_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[hsl(265_70%_70%/0.25)] blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="rounded-full bg-white/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_45%)]">
              State Director · {activeState}
            </Badge>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">Case Management</h1>
            <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
              Active client oversight with clinical, operational, and authorization risk indicators.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="border-white/70 bg-white/70 backdrop-blur">
            <Link to="/clients"><Users className="mr-1.5 h-3.5 w-3.5" /> Full client list</Link>
          </Button>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Active cases" value={kpis.total} icon={FolderKanban} />
        <Kpi label="At risk" value={kpis.atRisk} icon={AlertTriangle} tone="crit" />
        <Kpi label="Watch" value={kpis.watch} icon={Activity} tone="warn" />
        <Kpi label="Needs staffing" value={kpis.needsStaff} icon={Users} tone="warn" />
        <Kpi label="Auths expiring" value={kpis.expiringAuths} icon={CalendarClock} tone="warn" />
      </section>

      <section className="mt-6 rounded-[24px] border border-foreground/[0.06] bg-white/70 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by client or BCBA…" className="h-9 pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([
              ["all", `All (${kpis.total})`],
              ["at_risk", `At risk (${kpis.atRisk})`],
              ["needs_staff", `Needs staff (${kpis.needsStaff})`],
              ["auth_expiring", `Auth expiring (${kpis.expiringAuths})`],
              ["qa", "QA flagged"],
            ] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition",
                  filter === k ? "bg-foreground text-background" : "bg-foreground/[0.04] text-foreground/70 hover:bg-foreground/[0.08]",
                )}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-foreground/[0.05]">
          <table className="w-full text-[13px]">
            <thead className="bg-foreground/[0.03] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Client</th>
                <th className="px-4 py-2.5 text-left">BCBA / RBT</th>
                <th className="px-4 py-2.5 text-left">Risk</th>
                <th className="px-4 py-2.5 text-left">Indicators</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.05] bg-white/40">
              {loading && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Loading cases…</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No cases match the current filter.</td></tr>
              )}
              {!loading && visible.slice(0, 200).map((c) => (
                <tr key={c.id} className="hover:bg-foreground/[0.02]">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{c.child_name}</div>
                    <div className="text-[11.5px] text-muted-foreground">{c.state}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div>{c.bcba ?? <span className="text-muted-foreground">Unassigned</span>}</div>
                    <div className="text-[11.5px] text-muted-foreground">{c.rbt ?? "No RBT"}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1", toneClasses[c.risk])}>
                      {c.risk === "crit" ? "At risk" : c.risk === "warn" ? "Watch" : "Healthy"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {c.expired && <Chip tone="crit">Auth expired</Chip>}
                      {!c.expired && c.expiringIn !== null && <Chip tone="warn">Auth in {c.expiringIn}d</Chip>}
                      {c.needsStaff && <Chip tone="warn">Needs staffing</Chip>}
                      {c.qaIssue && <Chip tone="warn">QA: {c.qa_status}</Chip>}
                      {c.overdueTask && <Chip tone="crit">Task overdue</Chip>}
                      {c.blockerCount > 0 && <Chip tone="crit">{c.blockerCount} blocker{c.blockerCount > 1 ? "s" : ""}</Chip>}
                      {!c.expired && c.expiringIn === null && !c.needsStaff && !c.qaIssue && !c.overdueTask && c.blockerCount === 0 && (
                        <Chip tone="ok"><ShieldCheck className="mr-1 h-3 w-3" /> Clean</Chip>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {(() => {
                      const href = buildClientDetailHref(c.id);
                      if (!href) {
                        return (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        );
                      }
                      return (
                        <Button asChild size="sm" variant="ghost" className="h-7">
                          <Link to={href}>Open <ChevronRight className="ml-0.5 h-3.5 w-3.5" /></Link>
                        </Button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length > 200 && (
          <p className="mt-2 text-center text-[11.5px] text-muted-foreground">Showing first 200 of {visible.length}. Narrow your filter to see more.</p>
        )}
      </section>
    </OSShell>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof FolderKanban; tone?: Tone }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <Icon className={cn("h-4 w-4", tone === "crit" ? "text-destructive" : tone === "warn" ? "text-amber-600" : "text-muted-foreground")} />
      </div>
      <div className="mt-1.5 text-[24px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ring-1", toneClasses[tone])}>
      {children}
    </span>
  );
}