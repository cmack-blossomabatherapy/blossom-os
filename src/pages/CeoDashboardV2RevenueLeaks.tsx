import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
} from "recharts";
import {
  ArrowLeft, AlertTriangle, Clock, CalendarClock, UserCog, DollarSign,
  TrendingDown, ShieldAlert, ChevronRight, FileWarning, Users, ExternalLink, Eye,
} from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Lightweight directional revenue estimates ($/hr) — same convention as Insights page.
const REVENUE_PER_HOUR: Record<string, number> = {
  "97153": 65, "97155": 110, "97151": 130, "97152": 95, "97156": 100,
};
const DEFAULT_RATE = 60;
const UNASSIGNED = "Unassigned BCBA";

function normalizeCode(code: string | null | undefined): string {
  if (!code) return "—";
  const t = code.trim();
  if (/^97153(\b|\s)/i.test(t)) return "97153";
  if (/^97155(\b|\s)/i.test(t)) return "97155";
  return t;
}

function fmtMoney(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

interface Session {
  date_of_service: string | null;
  client_full: string;
  bcba_name: string | null;
  provider_full: string;
  procedure_code: string | null;
  hours: number;
}

interface Auth {
  id: string;
  client_id: string | null;
  status: string | null;
  submitted_date: string | null;
  approved_date: string | null;
  expiration_date: string | null;
  approved_hours: number | null;
  payor: string | null;
  state: string | null;
  service_type: string | null;
  assigned_auth_coordinator: string | null;
  next_action: string | null;
  blockers: string[] | null;
}

type Severity = "high" | "medium" | "low";

export default function CeoDashboardV2RevenueLeaks() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [auths, setAuths] = useState<Auth[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [payorFilter, setPayorFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Pull active billable imports + last 90d sessions for capacity analysis.
        const { data: imps } = await supabase
          .from("bcba_billable_imports").select("id").eq("is_active", true);
        const ids = (imps ?? []).map((i: any) => i.id);
        const since = new Date(); since.setUTCDate(since.getUTCDate() - 90);
        const sinceISO = since.toISOString().slice(0, 10);

        const allSessions: Session[] = [];
        if (ids.length) {
          let from = 0;
          while (true) {
            const { data, error } = await supabase
              .from("bcba_billable_sessions")
              .select("date_of_service, client_full, bcba_name, provider_full, procedure_code, hours")
              .in("import_id", ids)
              .gte("date_of_service", sinceISO)
              .order("date_of_service", { ascending: false })
              .range(from, from + 999);
            if (error) { toast.error(error.message); break; }
            allSessions.push(...((data ?? []) as Session[]));
            if (!data || data.length < 1000) break;
            from += 1000;
          }
        }

        const { data: aData, error: aErr } = await supabase
          .from("client_authorizations")
          .select("id, client_id, status, submitted_date, approved_date, expiration_date, approved_hours, payor, state, service_type, assigned_auth_coordinator, next_action, blockers");
        if (aErr) toast.error(aErr.message);

        if (!cancelled) {
          setSessions(allSessions);
          setAuths((aData ?? []) as Auth[]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Filter option lists
  const allStates = useMemo(
    () => Array.from(new Set(auths.map((a) => a.state).filter(Boolean) as string[])).sort(),
    [auths]
  );
  const allPayors = useMemo(
    () => Array.from(new Set(auths.map((a) => a.payor).filter(Boolean) as string[])).sort(),
    [auths]
  );

  const filteredAuths = useMemo(() => auths.filter((a) => {
    if (stateFilter !== "all" && (a.state ?? "") !== stateFilter) return false;
    if (payorFilter !== "all" && (a.payor ?? "") !== payorFilter) return false;
    return true;
  }), [auths, stateFilter, payorFilter]);

  // -------------------- AUTHORIZATION DELAYS --------------------
  // An auth is "delayed" if it was submitted but not yet approved and is older
  // than 14 days. We surface days-since-submission and bucket by severity.
  const delays = useMemo(() => {
    const today = new Date();
    const open = filteredAuths.filter((a) => {
      const submitted = a.submitted_date ? parseISO(a.submitted_date) : null;
      const approved = !!a.approved_date;
      const status = (a.status ?? "").toLowerCase();
      const isClosed = approved || ["approved", "active", "denied", "closed", "complete"].some((s) => status.includes(s));
      return submitted && !isClosed;
    }).map((a) => {
      const submitted = parseISO(a.submitted_date!);
      const days = differenceInDays(today, submitted);
      const sev: Severity = days >= 30 ? "high" : days >= 14 ? "medium" : "low";
      const hours = Number(a.approved_hours) || 0;
      // Use directional service-type rate when available
      const rate = REVENUE_PER_HOUR[normalizeCode(a.service_type)] ?? DEFAULT_RATE;
      const valueAtRisk = hours * rate;
      return { auth: a, days, severity: sev, valueAtRisk };
    }).sort((a, b) => b.days - a.days);

    const byBucket = { high: 0, medium: 0, low: 0 };
    let totalValue = 0;
    for (const d of open) { byBucket[d.severity] += 1; totalValue += d.valueAtRisk; }

    return { rows: open, byBucket, totalValue, count: open.length };
  }, [filteredAuths]);

  // -------------------- EXPIRING AUTHORIZATIONS --------------------
  // Auths expiring in the next 60 days carry revenue risk if not re-authorized.
  const expiring = useMemo(() => {
    const today = new Date();
    const rows = filteredAuths
      .filter((a) => a.expiration_date)
      .map((a) => {
        const exp = parseISO(a.expiration_date!);
        const days = differenceInDays(exp, today);
        return { auth: a, days, expiration: exp };
      })
      .filter((r) => r.days <= 60)
      .sort((a, b) => a.days - b.days);

    const expired = rows.filter((r) => r.days < 0);
    const within30 = rows.filter((r) => r.days >= 0 && r.days <= 30);
    const within60 = rows.filter((r) => r.days > 30 && r.days <= 60);

    const valueOf = (rs: typeof rows) =>
      rs.reduce((s, r) => {
        const hrs = Number(r.auth.approved_hours) || 0;
        const rate = REVENUE_PER_HOUR[normalizeCode(r.auth.service_type)] ?? DEFAULT_RATE;
        return s + hrs * rate;
      }, 0);

    return {
      expired, within30, within60,
      valueExpired: valueOf(expired),
      value30: valueOf(within30),
      value60: valueOf(within60),
      total: rows.length,
    };
  }, [filteredAuths]);

  // -------------------- BCBA CAPACITY BOTTLENECKS --------------------
  // Three bottleneck categories:
  //   1. Concentration risk — single BCBA carries >25% of total billable hours.
  //   2. Overloaded — clients-per-BCBA above the 80th percentile.
  //   3. Unassigned — sessions without a BCBA = direct revenue attribution leak.
  const bottlenecks = useMemo(() => {
    const m = new Map<string, { hours: number; clients: Set<string>; rbts: Set<string>; revenue: number }>();
    let unassignedHours = 0;
    let unassignedRev = 0;
    let totalHours = 0;

    for (const s of sessions) {
      const h = Number(s.hours) || 0;
      const code = normalizeCode(s.procedure_code);
      const rev = (REVENUE_PER_HOUR[code] ?? DEFAULT_RATE) * h;
      totalHours += h;
      if (!s.bcba_name) {
        unassignedHours += h;
        unassignedRev += rev;
        continue;
      }
      let g = m.get(s.bcba_name);
      if (!g) { g = { hours: 0, clients: new Set(), rbts: new Set(), revenue: 0 }; m.set(s.bcba_name, g); }
      g.hours += h;
      g.revenue += rev;
      if (s.client_full) g.clients.add(s.client_full);
      if (s.provider_full) g.rbts.add(s.provider_full);
    }

    const arr = Array.from(m.entries()).map(([name, g]) => ({
      name,
      hours: g.hours,
      clients: g.clients.size,
      rbts: g.rbts.size,
      revenue: g.revenue,
      shareOfHours: totalHours ? (g.hours / totalHours) * 100 : 0,
    })).sort((a, b) => b.hours - a.hours);

    const sortedByClients = [...arr].map((x) => x.clients).sort((a, b) => a - b);
    const p80 = sortedByClients.length ? sortedByClients[Math.floor(sortedByClients.length * 0.8)] : 0;

    const concentration = arr.filter((b) => b.shareOfHours > 25);
    // Overloaded if clients ≥ p80 AND ≥ 5 clients (avoid noise on small datasets)
    const overloaded = arr.filter((b) => b.clients >= Math.max(p80, 5));

    return {
      bcbas: arr,
      concentration,
      overloaded,
      unassignedHours,
      unassignedRev,
      totalHours,
    };
  }, [sessions]);

  // Aggregate revenue at risk across all three categories.
  const totalLeak = delays.totalValue + expiring.valueExpired + expiring.value30 + bottlenecks.unassignedRev;

  // -------------------- DRILL-DOWN --------------------
  // The drill modal opens an in-page list of the underlying records for a
  // given bucket, with a deep-link back into the source dashboard
  // (Authorizations or V2) that matches the same filter.
  type DrillState =
    | { kind: "delays"; severity: Severity }
    | { kind: "expiring"; bucket: "expired" | "30" | "60" }
    | { kind: "bcba"; bcba: { name: string; hours: number; clients: number; rbts: number; revenue: number; shareOfHours: number }; reason: "concentration" | "overloaded" }
    | { kind: "unassigned" }
    | null;
  const [drill, setDrill] = useState<DrillState>(null);
  const navigate = useNavigate();

  // Build a deep-link URL into the existing Authorizations Dashboard.
  // It already supports ?kpi=<KpiFilter> via useDeepLink.
  function authsUrl(kpi: string, focus?: string) {
    const p = new URLSearchParams({ kpi });
    if (focus) p.set("focus", focus);
    return `/authorizations-dashboard?${p.toString()}`;
  }
  // Deep-link into V2 dashboard; we already wired ?bcba=&drawer= there.
  function v2Url(opts: { bcba?: string; drawer?: string } = {}) {
    const p = new URLSearchParams();
    if (opts.bcba) p.set("bcba", opts.bcba);
    if (opts.drawer) p.set("drawer", opts.drawer);
    const qs = p.toString();
    return `/ceo-dashboard-v2${qs ? `?${qs}` : ""}`;
  }

  // -------------------- RENDER --------------------
  if (loading) {
    return (
      <div className="px-4 py-6 md:px-8 space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="-mx-3 -mt-3 md:-mx-6 md:-mt-6 pb-12 animate-fade-in">
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-destructive/10 via-background to-warning/10 px-4 pt-5 pb-6 md:px-8 md:pt-8 md:pb-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-destructive/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 h-8 text-xs">
              <Link to="/ceo-dashboard-v2"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to CEO Dashboard V2</Link>
            </Button>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
              <ShieldAlert className="h-3 w-3" /> Revenue Leak Analysis
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Where revenue is leaking</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Authorization delays, expiring items, and BCBA capacity bottlenecks — ranked by directional revenue impact.
            </p>
          </div>
          <Card className="px-5 py-4 bg-card/80 backdrop-blur border-destructive/30">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total revenue at risk</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums text-destructive">{fmtMoney(totalLeak)}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Directional estimate from open auths + capacity gaps</div>
          </Card>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="px-4 pt-5 md:px-8">
        <Card className="flex flex-wrap items-center gap-2 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1">Filters</span>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All states</SelectItem>
              {allStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={payorFilter} onValueChange={setPayorFilter}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All payors</SelectItem>
              {allPayors.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {auths.length.toLocaleString()} auths · {sessions.length.toLocaleString()} sessions (last 90d)
          </span>
        </Card>
      </div>

      {/* TOP-LINE LEAK CARDS */}
      <div className="px-4 pt-4 md:px-8 grid gap-3 md:grid-cols-3">
        <LeakCard
          icon={Clock}
          tone="warning"
          label="Authorization delays"
          headline={delays.count.toString()}
          sub={`${delays.byBucket.high} critical (30+ days) · ${delays.byBucket.medium} aging (14–29 days)`}
          value={fmtMoney(delays.totalValue)}
          valueLabel="value at risk"
          onClick={() => setDrill({ kind: "delays", severity: delays.byBucket.high > 0 ? "high" : delays.byBucket.medium > 0 ? "medium" : "low" })}
        />
        <LeakCard
          icon={CalendarClock}
          tone="negative"
          label="Expiring authorizations"
          headline={(expiring.expired.length + expiring.within30.length).toString()}
          sub={`${expiring.expired.length} expired · ${expiring.within30.length} within 30 days · ${expiring.within60.length} within 60`}
          value={fmtMoney(expiring.valueExpired + expiring.value30)}
          valueLabel="immediate exposure"
          onClick={() => setDrill({ kind: "expiring", bucket: expiring.expired.length > 0 ? "expired" : expiring.within30.length > 0 ? "30" : "60" })}
        />
        <LeakCard
          icon={UserCog}
          tone="negative"
          label="Capacity bottlenecks"
          headline={(bottlenecks.concentration.length + bottlenecks.overloaded.length).toString()}
          sub={`${bottlenecks.concentration.length} concentration · ${bottlenecks.overloaded.length} overloaded · ${bottlenecks.unassignedHours.toFixed(0)}h unassigned`}
          value={fmtMoney(bottlenecks.unassignedRev)}
          valueLabel="unattributed revenue"
          onClick={() => bottlenecks.unassignedHours > 0 ? setDrill({ kind: "unassigned" }) : navigate(v2Url())}
        />
      </div>

      {/* MAIN SECTIONS */}
      <div className="px-4 pt-5 md:px-8 space-y-4">
        {/* SECTION 1 — AUTH DELAYS */}
        <Card className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <SectionHeader
              icon={Clock}
              title="Authorization delays"
              subtitle="Submitted but not yet approved · sorted by days outstanding"
              badge={delays.count > 0 ? `${delays.count} open` : undefined}
              tone={delays.byBucket.high > 0 ? "negative" : delays.byBucket.medium > 0 ? "warning" : "neutral"}
            />
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-[11px] shrink-0">
              <Link to={authsUrl("submitted")}><ExternalLink className="h-3 w-3" /> Open in Authorizations</Link>
            </Button>
          </div>
          {delays.rows.length === 0 ? (
            <EmptyState
              icon={Clock}
              text={
                auths.length === 0
                  ? "No authorization records loaded yet."
                  : "No open authorizations are aging — well managed."
              }
            />
          ) : (
            <Accordion type="multiple" className="mt-3">
              {(["high", "medium", "low"] as Severity[]).map((sev) => {
                const items = delays.rows.filter((d) => d.severity === sev);
                if (items.length === 0) return null;
                const bucketKpi = sev === "high" ? "submitted" : "awaiting";
                return (
                  <AccordionItem key={sev} value={sev} className="border-border/60">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2 flex-1">
                        <SevDot sev={sev} />
                        <span className="text-sm font-medium capitalize">{sev}</span>
                        <span className="text-xs text-muted-foreground">
                          ({items.length} · {fmtMoney(items.reduce((s, x) => s + x.valueAtRisk, 0))} at risk)
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDrill({ kind: "delays", severity: sev }); }}
                          className="ml-auto mr-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-foreground/60 hover:text-primary hover:bg-primary/5"
                        >
                          <Eye className="h-3 w-3" /> Drill
                        </button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1.5">
                        {items.slice(0, 25).map((d) => (
                          <DelayRow
                            key={d.auth.id}
                            d={d}
                            onOpen={() => navigate(authsUrl(bucketKpi, d.auth.id))}
                          />
                        ))}
                        {items.length > 25 && (
                          <button
                            onClick={() => setDrill({ kind: "delays", severity: sev })}
                            className="block w-full text-left text-[11px] text-primary hover:underline pt-1.5 pl-2"
                          >
                            + {items.length - 25} more — view all in drill modal
                          </button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </Card>

        {/* SECTION 2 — EXPIRING */}
        <Card className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <SectionHeader
              icon={CalendarClock}
              title="Expiring authorizations"
              subtitle="Auths expiring in the next 60 days · re-auth needed to protect revenue"
              badge={expiring.total > 0 ? `${expiring.total} flagged` : undefined}
              tone={expiring.expired.length > 0 ? "negative" : expiring.within30.length > 0 ? "warning" : "neutral"}
            />
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-[11px] shrink-0">
              <Link to={authsUrl("expiring")}><ExternalLink className="h-3 w-3" /> Open in Authorizations</Link>
            </Button>
          </div>
          {expiring.total === 0 ? (
            <EmptyState
              icon={CalendarClock}
              text={auths.length === 0 ? "No authorizations on file." : "Nothing expiring in the next 60 days."}
            />
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <ExpiringBucket
                label="Already expired" tone="negative"
                rows={expiring.expired} value={expiring.valueExpired}
                onDrill={() => setDrill({ kind: "expiring", bucket: "expired" })}
                onOpenRow={(id) => navigate(authsUrl("expiring", id))}
              />
              <ExpiringBucket
                label="Within 30 days" tone="warning"
                rows={expiring.within30} value={expiring.value30}
                onDrill={() => setDrill({ kind: "expiring", bucket: "30" })}
                onOpenRow={(id) => navigate(authsUrl("expiring", id))}
              />
              <ExpiringBucket
                label="30 – 60 days" tone="neutral"
                rows={expiring.within60} value={expiring.value60}
                onDrill={() => setDrill({ kind: "expiring", bucket: "60" })}
                onOpenRow={(id) => navigate(authsUrl("expiring", id))}
              />
            </div>
          )}
        </Card>

        {/* SECTION 3 — CAPACITY BOTTLENECKS */}
        <Card className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <SectionHeader
              icon={UserCog}
              title="BCBA capacity bottlenecks"
              subtitle="Concentration, overload, and attribution risk based on the last 90 days"
              badge={bottlenecks.bcbas.length > 0 ? `${bottlenecks.bcbas.length} BCBAs` : undefined}
              tone={
                bottlenecks.concentration.length > 0 || bottlenecks.unassignedHours > 50
                  ? "negative"
                  : bottlenecks.overloaded.length > 0
                    ? "warning"
                    : "neutral"
              }
            />
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-[11px] shrink-0">
              <Link to={v2Url()}><ExternalLink className="h-3 w-3" /> Open in V2 Dashboard</Link>
            </Button>
          </div>

          {/* Unassigned banner */}
          {bottlenecks.unassignedHours > 0 && (
            <div className="mt-3 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <FileWarning className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {bottlenecks.unassignedHours.toFixed(0)}h unassigned · {fmtMoney(bottlenecks.unassignedRev)} unattributed
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Tag the BCBA in Hubstaff/CR and re-upload in Replace mode to recover attribution.
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => setDrill({ kind: "unassigned" })}>
                  <Eye className="h-3 w-3" /> View sessions
                </Button>
                <Button asChild size="sm" variant="default" className="h-7 gap-1 text-[11px]">
                  <Link to={v2Url({ bcba: "Unassigned BCBA" })}><ExternalLink className="h-3 w-3" /> Open in V2</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Concentration */}
          <div className="mt-4">
            <SubHeader
              icon={TrendingDown}
              title="Concentration risk"
              hint="Single BCBA carries > 25% of billable hours — single point of failure"
            />
            {bottlenecks.concentration.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1.5">No concentration risk detected.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {bottlenecks.concentration.map((b) => (
                  <BottleneckRow
                    key={b.name}
                    name={b.name}
                    primary={`${b.shareOfHours.toFixed(1)}% of all hours`}
                    secondary={`${b.hours.toFixed(0)}h · ${b.clients} clients · ${fmtMoney(b.revenue)}`}
                    sev="high"
                    onDrill={() => setDrill({ kind: "bcba", bcba: b, reason: "concentration" })}
                    onOpenV2={() => navigate(v2Url({ bcba: b.name, drawer: b.name }))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Overloaded */}
          <div className="mt-4">
            <SubHeader
              icon={Users}
              title="Overloaded BCBAs"
              hint="Caseload at or above the 80th percentile of clients-per-BCBA"
            />
            {bottlenecks.overloaded.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1.5">No overloaded BCBAs.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {bottlenecks.overloaded.slice(0, 8).map((b) => (
                  <BottleneckRow
                    key={b.name}
                    name={b.name}
                    primary={`${b.clients} clients`}
                    secondary={`${b.hours.toFixed(0)}h · ${b.rbts} RBTs · ${b.shareOfHours.toFixed(1)}% of hours`}
                    sev="medium"
                    onDrill={() => setDrill({ kind: "bcba", bcba: b, reason: "overloaded" })}
                    onOpenV2={() => navigate(v2Url({ bcba: b.name, drawer: b.name }))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Top BCBAs chart */}
          {bottlenecks.bcbas.length > 0 && (
            <div className="mt-5">
              <SubHeader icon={UserCog} title="Top BCBAs by billable hours" hint="Last 90 days" />
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bottlenecks.bcbas.slice(0, 10).map((b) => ({ name: b.name.split(" ")[0], hours: Math.round(b.hours) }))} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// -------------------- SUBCOMPONENTS --------------------

function LeakCard({
  icon: Icon, tone, label, headline, sub, value, valueLabel, onClick,
}: {
  icon: any; tone: "warning" | "negative" | "neutral"; label: string;
  headline: string; sub: string; value: string; valueLabel: string;
  onClick?: () => void;
}) {
  const toneCls =
    tone === "negative" ? "text-destructive border-destructive/30 bg-destructive/5"
    : tone === "warning" ? "text-warning border-warning/30 bg-warning/5"
    : "text-muted-foreground border-border bg-card";
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 border transition-all",
        toneCls,
        onClick && "cursor-pointer hover:shadow-md hover:scale-[1.01]",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold tabular-nums text-foreground">{value}</div>
          <div className="text-[10px] text-muted-foreground">{valueLabel}</div>
        </div>
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{headline}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
      {onClick && (
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-foreground/70">
          <Eye className="h-3 w-3" /> View underlying records
        </div>
      )}
    </Card>
  );
}

function SectionHeader({
  icon: Icon, title, subtitle, badge, tone = "neutral",
}: {
  icon: any; title: string; subtitle?: string; badge?: string;
  tone?: "negative" | "warning" | "neutral";
}) {
  const dot =
    tone === "negative" ? "bg-destructive"
    : tone === "warning" ? "bg-warning"
    : "bg-muted-foreground/40";
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <Badge variant="outline" className="gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
          {badge}
        </Badge>
      )}
    </div>
  );
}

function SubHeader({ icon: Icon, title, hint }: { icon: any; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function SevDot({ sev }: { sev: Severity }) {
  const cls = sev === "high" ? "bg-destructive" : sev === "medium" ? "bg-warning" : "bg-muted-foreground/40";
  return <span className={cn("h-2 w-2 rounded-full", cls)} />;
}

function DelayRow({
  d, onOpen,
}: {
  d: { auth: Auth; days: number; severity: Severity; valueAtRisk: number };
  onOpen?: () => void;
}) {
  const a = d.auth;
  return (
    <div
      onClick={onOpen}
      className={cn(
        "group flex items-center justify-between rounded-md border border-border/60 bg-card/40 px-3 py-2 transition-colors",
        onOpen && "cursor-pointer hover:border-primary/40 hover:bg-card/80",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SevDot sev={d.severity} />
          <span className="truncate">{a.payor ?? "Unknown payor"} · {a.service_type ?? "—"}</span>
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
          Submitted {a.submitted_date ? format(parseISO(a.submitted_date), "MMM d") : "—"}
          {a.assigned_auth_coordinator ? ` · ${a.assigned_auth_coordinator}` : ""}
          {a.next_action ? ` · ${a.next_action}` : ""}
        </div>
      </div>
      <div className="text-right pl-3 flex items-center gap-3">
        <div>
        <div className="text-sm font-semibold tabular-nums">{d.days}d</div>
        <div className="text-[10px] text-muted-foreground">{fmtMoney(d.valueAtRisk)}</div>
        </div>
        {onOpen && (
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        )}
      </div>
    </div>
  );
}

function ExpiringBucket({
  label, tone, rows, value, onDrill, onOpenRow,
}: {
  label: string; tone: "negative" | "warning" | "neutral";
  rows: { auth: Auth; days: number; expiration: Date }[]; value: number;
  onDrill?: () => void;
  onOpenRow?: (id: string) => void;
}) {
  const toneCls =
    tone === "negative" ? "border-destructive/30 bg-destructive/5"
    : tone === "warning" ? "border-warning/30 bg-warning/5"
    : "border-border bg-card";
  return (
    <Card
      onClick={onDrill}
      className={cn(
        "p-3 border transition-all",
        toneCls,
        onDrill && rows.length > 0 && "cursor-pointer hover:shadow-md hover:scale-[1.005]",
      )}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold tabular-nums">{rows.length}</div>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{fmtMoney(value)} at risk</div>
      {rows.length > 0 && (
        <div className="mt-2 space-y-1">
          {rows.slice(0, 5).map((r) => (
            <button
              key={r.auth.id}
              onClick={(e) => { e.stopPropagation(); onOpenRow?.(r.auth.id); }}
              className="group w-full flex items-center justify-between text-[11px] rounded px-1 py-0.5 hover:bg-card/60"
            >
              <span className="truncate text-foreground">{r.auth.payor ?? "Unknown"} · {r.auth.service_type ?? "—"}</span>
              <span className="tabular-nums text-muted-foreground pl-2 inline-flex items-center gap-1">
                {r.days < 0 ? `${Math.abs(r.days)}d ago` : `${r.days}d`}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </button>
          ))}
          {rows.length > 5 && (
            <div className="text-[10px] text-primary pt-0.5 inline-flex items-center gap-1">
              <Eye className="h-3 w-3" /> + {rows.length - 5} more — click card to view all
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function BottleneckRow({
  name, primary, secondary, sev, onDrill, onOpenV2,
}: {
  name: string; primary: string; secondary: string; sev: Severity;
  onDrill?: () => void; onOpenV2?: () => void;
}) {
  return (
    <div
      onClick={onDrill}
      className={cn(
        "group flex items-center justify-between rounded-md border border-border/60 bg-card/40 px-3 py-2 transition-colors",
        onDrill && "cursor-pointer hover:border-primary/40 hover:bg-card/80",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <SevDot sev={sev} />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{secondary}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 pl-3 shrink-0">
        <div className="text-sm font-semibold tabular-nums whitespace-nowrap">{primary}</div>
        {onOpenV2 && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenV2(); }}
            title="Open BCBA in V2 Dashboard"
            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center h-6 w-6 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 py-8 text-center">
      <Icon className="h-5 w-5 text-muted-foreground/60" />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
