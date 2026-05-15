import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ReferenceLine,
} from "recharts";
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Activity, AlertTriangle,
  Sparkles, Users, Clock, MapPin, UserCog, FileBarChart, ShieldAlert, Lightbulb, Target,
  Download, ChevronRight, Zap, CheckCircle2, AlertCircle, Minus, ExternalLink, Eye,
} from "lucide-react";
import { format, parseISO, startOfWeek, startOfMonth, startOfQuarter, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Session {
  id: string;
  date_of_service: string | null;
  client_full: string;
  bcba_name: string | null;
  provider_full: string;
  procedure_code: string | null;
  procedure_description: string | null;
  hours: number;
  raw_labels: string | null;
}

const UNASSIGNED = "Unassigned BCBA";

function normalizeCode(code: string | null | undefined): string {
  if (!code) return "—";
  const t = code.trim();
  if (/^97153(\b|\s)/i.test(t)) return "97153";
  if (/^97155(\b|\s)/i.test(t)) return "97155";
  return t;
}

function extractState(labels: string | null): string | null {
  if (!labels) return null;
  for (const part of labels.split(",")) {
    const t = part.trim();
    const m = t.match(/^([A-Za-z][A-Za-z .'-]+?)\s+Location$/i);
    if (m) return m[1].trim();
  }
  return null;
}

type Granularity = "weekly" | "monthly" | "quarterly";
type WindowKey = "30d" | "90d" | "6mo" | "12mo" | "all";
const WINDOW_LABELS: Record<WindowKey, string> = {
  "30d": "30 days", "90d": "90 days", "6mo": "6 months", "12mo": "12 months", all: "All",
};
const WINDOW_ORDER: WindowKey[] = ["30d", "90d", "6mo", "12mo", "all"];
function windowSinceISO(w: WindowKey): string | null {
  if (w === "all") return null;
  const days = w === "30d" ? 30 : w === "90d" ? 90 : w === "6mo" ? 183 : 365;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

// Estimated revenue per code (lightweight directional estimate, not billing-grade)
const REVENUE_PER_HOUR: Record<string, number> = {
  "97153": 65, "97155": 110, "97151": 130, "97152": 95, "97156": 100,
};
function revenueFor(code: string, hours: number) {
  return (REVENUE_PER_HOUR[code] ?? 60) * hours;
}

function bucketStart(date: Date, g: Granularity): Date {
  if (g === "weekly") return startOfWeek(date, { weekStartsOn: 1 });
  if (g === "monthly") return startOfMonth(date);
  return startOfQuarter(date);
}

function pctDelta(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
}

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--petal-purple, var(--primary)))",
  "hsl(var(--petal-sage, var(--accent)))",
  "hsl(var(--petal-orange, var(--primary)))",
  "hsl(var(--petal-pink, var(--accent)))",
  "hsl(var(--petal-yellow, var(--primary)))",
  "hsl(var(--petal-green, var(--accent)))",
];

export default function CeoDashboardV2Insights() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowKey, setWindowKey] = useState<WindowKey>("90d");
  const [granularity, setGranularity] = useState<Granularity>("weekly");
  const [bcbaFilter, setBcbaFilter] = useState<string>("all");
  const [codeFilter, setCodeFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  // ---- Cross-highlight (hover) + drill modal ----
  type HoverKey = { type: "bcba" | "code" | "state"; name: string } | null;
  const [hovered, setHovered] = useState<HoverKey>(null);
  type Drill = { type: "bcba" | "code" | "state" | "all"; name: string } | null;
  const [drill, setDrill] = useState<Drill>(null);

  // ---- URL <-> filter sync (two-way deep-link with V2 dashboard) ----
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAppliedRef = useRef(false);
  useEffect(() => {
    if (urlAppliedRef.current) return;
    urlAppliedRef.current = true;
    const w = searchParams.get("window") as WindowKey | null;
    const g = searchParams.get("granularity") as Granularity | null;
    const b = searchParams.get("bcba");
    const c = searchParams.get("code");
    const st = searchParams.get("state");
    if (w && (WINDOW_ORDER as string[]).includes(w)) setWindowKey(w);
    if (g && ["weekly", "monthly", "quarterly"].includes(g)) setGranularity(g);
    if (b) setBcbaFilter(b);
    if (c) setCodeFilter(c);
    if (st) setStateFilter(st);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!urlAppliedRef.current) return;
    const params = new URLSearchParams(searchParams);
    const set = (k: string, v: string, def: string) => {
      if (v && v !== def) params.set(k, v); else params.delete(k);
    };
    set("window", windowKey, "90d");
    set("granularity", granularity, "weekly");
    set("bcba", bcbaFilter, "all");
    set("code", codeFilter, "all");
    set("state", stateFilter, "all");
    const next = params.toString();
    if (next !== searchParams.toString()) setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowKey, granularity, bcbaFilter, codeFilter, stateFilter]);

  // Build a deep-link to V2 dashboard with current filters + optional drawer.
  function v2Link(extra: { bcba?: string; code?: string; state?: string; drawer?: string } = {}) {
    const p = new URLSearchParams();
    if (windowKey !== "90d") p.set("window", windowKey);
    const b = extra.bcba ?? (bcbaFilter !== "all" ? bcbaFilter : undefined);
    const c = extra.code ?? (codeFilter !== "all" ? codeFilter : undefined);
    const s = extra.state ?? (stateFilter !== "all" ? stateFilter : undefined);
    if (b) p.set("bcba", b);
    if (c) p.set("code", c);
    if (s) p.set("state", s);
    if (extra.drawer) p.set("drawer", extra.drawer);
    const qs = p.toString();
    return `/ceo-dashboard-v2${qs ? `?${qs}` : ""}`;
  }
  function openInV2(extra: Parameters<typeof v2Link>[0] = {}) {
    navigate(v2Link(extra));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: imps } = await supabase
          .from("bcba_billable_imports")
          .select("id")
          .eq("is_active", true);
        const ids = (imps ?? []).map((i: any) => i.id);
        if (ids.length === 0) { if (!cancelled) { setSessions([]); setLoading(false); } return; }
        const since = windowSinceISO(windowKey);
        const all: Session[] = [];
        const pageSize = 1000;
        let from = 0;
        while (true) {
          let q = supabase
            .from("bcba_billable_sessions")
            .select("id, date_of_service, client_full, bcba_name, provider_full, procedure_code, procedure_description, hours, raw_labels")
            .in("import_id", ids)
            .order("date_of_service", { ascending: false })
            .range(from, from + pageSize - 1);
          if (since) q = q.gte("date_of_service", since);
          const { data, error } = await q;
          if (error) { toast.error(error.message); break; }
          all.push(...((data ?? []) as Session[]));
          if (!data || data.length < pageSize) break;
          from += pageSize;
        }
        if (!cancelled) setSessions(all);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [windowKey]);

  const filtered = useMemo(() => sessions.filter((s) => {
    if (bcbaFilter !== "all" && (s.bcba_name ?? UNASSIGNED) !== bcbaFilter) return false;
    if (codeFilter !== "all" && normalizeCode(s.procedure_code) !== codeFilter) return false;
    if (stateFilter !== "all" && (extractState(s.raw_labels) ?? "Unknown") !== stateFilter) return false;
    return true;
  }), [sessions, bcbaFilter, codeFilter, stateFilter]);

  // -------------------- DERIVED METRICS --------------------

  const summary = useMemo(() => {
    const bcbas = new Set<string>();
    const clients = new Set<string>();
    let hours = 0;
    for (const s of filtered) {
      if (s.bcba_name) bcbas.add(s.bcba_name);
      if (s.client_full) clients.add(s.client_full);
      hours += Number(s.hours) || 0;
    }
    const sessionCount = filtered.length;
    return {
      hours,
      bcbas: bcbas.size,
      clients: clients.size,
      sessions: sessionCount,
      avgHoursPerBcba: bcbas.size ? hours / bcbas.size : 0,
      avgSessionsPerClient: clients.size ? sessionCount / clients.size : 0,
    };
  }, [filtered]);

  // Trend buckets for billable hours
  const trendData = useMemo(() => {
    const buckets = new Map<string, { date: string; ts: number; hours: number; sessions: number }>();
    for (const s of filtered) {
      if (!s.date_of_service) continue;
      const d = parseISO(s.date_of_service);
      const b = bucketStart(d, granularity);
      const key = b.toISOString().slice(0, 10);
      let entry = buckets.get(key);
      if (!entry) { entry = { date: key, ts: b.getTime(), hours: 0, sessions: 0 }; buckets.set(key, entry); }
      entry.hours += Number(s.hours) || 0;
      entry.sessions += 1;
    }
    const arr = Array.from(buckets.values()).sort((a, b) => a.ts - b.ts);
    // Rolling avg (3 periods)
    return arr.map((p, i) => {
      const slice = arr.slice(Math.max(0, i - 2), i + 1);
      const avg = slice.reduce((s, x) => s + x.hours, 0) / slice.length;
      return { ...p, rollingAvg: Math.round(avg * 10) / 10, label: format(new Date(p.ts), granularity === "monthly" ? "MMM yy" : granularity === "quarterly" ? "QQQ yy" : "MMM d") };
    });
  }, [filtered, granularity]);

  const trendStats = useMemo(() => {
    if (trendData.length < 2) return null;
    const half = Math.floor(trendData.length / 2);
    const prev = trendData.slice(0, half).reduce((s, x) => s + x.hours, 0);
    const curr = trendData.slice(half).reduce((s, x) => s + x.hours, 0);
    const high = trendData.reduce((m, x) => x.hours > m.hours ? x : m, trendData[0]);
    const low = trendData.reduce((m, x) => x.hours < m.hours ? x : m, trendData[0]);
    return { delta: pctDelta(curr, prev), high, low };
  }, [trendData]);

  // BCBA performance
  const bcbaPerformance = useMemo(() => {
    const m = new Map<string, { name: string; hours: number; sessions: number; clients: Set<string>; rbts: Set<string>; lastDate: number }>();
    for (const s of filtered) {
      const name = s.bcba_name ?? UNASSIGNED;
      if (name === UNASSIGNED) continue;
      let g = m.get(name);
      if (!g) { g = { name, hours: 0, sessions: 0, clients: new Set(), rbts: new Set(), lastDate: 0 }; m.set(name, g); }
      g.hours += Number(s.hours) || 0;
      g.sessions += 1;
      if (s.client_full) g.clients.add(s.client_full);
      if (s.provider_full) g.rbts.add(s.provider_full);
      if (s.date_of_service) g.lastDate = Math.max(g.lastDate, parseISO(s.date_of_service).getTime());
    }
    const arr = Array.from(m.values()).map((g) => ({
      name: g.name, hours: Math.round(g.hours * 10) / 10, sessions: g.sessions,
      clients: g.clients.size, rbts: g.rbts.size, lastDate: g.lastDate,
    })).sort((a, b) => b.hours - a.hours);
    const median = arr.length ? arr[Math.floor(arr.length / 2)].hours : 0;
    const now = Date.now();
    return arr.map((g, i) => ({
      ...g,
      rank: i + 1,
      percentile: arr.length ? Math.round(((arr.length - i) / arr.length) * 100) : 0,
      lowUtil: g.hours < median * 0.5,
      stale: g.lastDate > 0 && (now - g.lastDate) / 86400000 > 14,
    }));
  }, [filtered]);

  // Code distribution
  const codeDistribution = useMemo(() => {
    const m = new Map<string, { code: string; hours: number; sessions: number; revenue: number }>();
    for (const s of filtered) {
      const code = normalizeCode(s.procedure_code);
      let entry = m.get(code);
      if (!entry) { entry = { code, hours: 0, sessions: 0, revenue: 0 }; m.set(code, entry); }
      const h = Number(s.hours) || 0;
      entry.hours += h;
      entry.sessions += 1;
      entry.revenue += revenueFor(code, h);
    }
    const arr = Array.from(m.values()).sort((a, b) => b.hours - a.hours);
    const total = arr.reduce((s, x) => s + x.hours, 0);
    return arr.map((x) => ({ ...x, pct: total ? (x.hours / total) * 100 : 0 }));
  }, [filtered]);

  // Unassigned trend
  const unassignedTrend = useMemo(() => {
    const buckets = new Map<string, { ts: number; label: string; hours: number; sessions: number }>();
    for (const s of filtered) {
      if (s.bcba_name) continue;
      if (!s.date_of_service) continue;
      const b = bucketStart(parseISO(s.date_of_service), granularity);
      const key = b.toISOString().slice(0, 10);
      let entry = buckets.get(key);
      if (!entry) { entry = { ts: b.getTime(), label: format(b, granularity === "monthly" ? "MMM yy" : "MMM d"), hours: 0, sessions: 0 }; buckets.set(key, entry); }
      entry.hours += Number(s.hours) || 0;
      entry.sessions += 1;
    }
    return Array.from(buckets.values()).sort((a, b) => a.ts - b.ts);
  }, [filtered, granularity]);

  const unassignedStats = useMemo(() => {
    const totalHours = unassignedTrend.reduce((s, x) => s + x.hours, 0);
    const states = new Map<string, number>();
    const candidates = new Map<string, number>();
    for (const s of filtered) {
      if (s.bcba_name) continue;
      const st = extractState(s.raw_labels) ?? "Unknown";
      states.set(st, (states.get(st) ?? 0) + (Number(s.hours) || 0));
      if (s.raw_labels) {
        for (const p of s.raw_labels.split(",")) {
          const t = p.trim();
          if (/^[A-Za-z][A-Za-z'.\- ]+$/.test(t) && t.split(/\s+/).length >= 2 && !/Location$/i.test(t)) {
            candidates.set(t, (candidates.get(t) ?? 0) + 1);
          }
        }
      }
    }
    let delta = 0;
    if (unassignedTrend.length >= 2) {
      const half = Math.floor(unassignedTrend.length / 2);
      const prev = unassignedTrend.slice(0, half).reduce((s, x) => s + x.hours, 0);
      const curr = unassignedTrend.slice(half).reduce((s, x) => s + x.hours, 0);
      delta = pctDelta(curr, prev);
    }
    return {
      totalHours,
      delta,
      lostRevenue: totalHours * 75,
      topStates: Array.from(states.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topCandidates: Array.from(candidates.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n]) => n),
    };
  }, [filtered, unassignedTrend]);

  // Multi-BCBA clients (continuity)
  const continuity = useMemo(() => {
    const byClient = new Map<string, Map<string, number>>();
    for (const s of filtered) {
      if (!s.bcba_name || !s.client_full) continue;
      let m = byClient.get(s.client_full);
      if (!m) { m = new Map(); byClient.set(s.client_full, m); }
      m.set(s.bcba_name, (m.get(s.bcba_name) ?? 0) + (Number(s.hours) || 0));
    }
    const multi: { client: string; bcbas: { name: string; hours: number }[]; total: number }[] = [];
    for (const [client, m] of byClient) {
      if (m.size < 2) continue;
      const bcbas = Array.from(m.entries()).map(([name, hours]) => ({ name, hours })).sort((a, b) => b.hours - a.hours);
      multi.push({ client, bcbas, total: bcbas.reduce((s, x) => s + x.hours, 0) });
    }
    multi.sort((a, b) => b.total - a.total);
    // Distribution: how many BCBAs per client
    const dist = new Map<number, number>();
    for (const [, m] of byClient) {
      const n = m.size;
      dist.set(n, (dist.get(n) ?? 0) + 1);
    }
    return {
      multi,
      distribution: Array.from(dist.entries()).sort((a, b) => a[0] - b[0]).map(([k, v]) => ({ label: `${k} BCBA${k > 1 ? "s" : ""}`, count: v })),
    };
  }, [filtered]);

  // RBT support load
  const rbtLoad = useMemo(() => {
    const byBcba = new Map<string, { rbts: Set<string>; sessions: number; clients: Set<string> }>();
    for (const s of filtered) {
      const name = s.bcba_name;
      if (!name) continue;
      let g = byBcba.get(name);
      if (!g) { g = { rbts: new Set(), sessions: 0, clients: new Set() }; byBcba.set(name, g); }
      if (s.provider_full) g.rbts.add(s.provider_full);
      if (s.client_full) g.clients.add(s.client_full);
      g.sessions += 1;
    }
    const arr = Array.from(byBcba.entries()).map(([name, g]) => ({
      name,
      rbts: g.rbts.size,
      clients: g.clients.size,
      sessionsPerRbt: g.rbts.size ? Math.round((g.sessions / g.rbts.size) * 10) / 10 : 0,
    })).sort((a, b) => b.rbts - a.rbts);
    const avg = arr.length ? arr.reduce((s, x) => s + x.rbts, 0) / arr.length : 0;
    return arr.map((x) => ({ ...x, overloaded: x.rbts > avg * 1.6, underutilized: x.rbts > 0 && x.rbts < avg * 0.4, avg }));
  }, [filtered]);

  // State analytics
  const stateData = useMemo(() => {
    const m = new Map<string, { state: string; hours: number; sessions: number; clients: Set<string>; bcbas: Set<string>; unassignedHours: number }>();
    for (const s of filtered) {
      const st = extractState(s.raw_labels) ?? "Unknown";
      let g = m.get(st);
      if (!g) { g = { state: st, hours: 0, sessions: 0, clients: new Set(), bcbas: new Set(), unassignedHours: 0 }; m.set(st, g); }
      const h = Number(s.hours) || 0;
      g.hours += h;
      g.sessions += 1;
      if (s.client_full) g.clients.add(s.client_full);
      if (s.bcba_name) g.bcbas.add(s.bcba_name); else g.unassignedHours += h;
    }
    return Array.from(m.values()).map((g) => ({
      state: g.state, hours: Math.round(g.hours * 10) / 10, sessions: g.sessions,
      clients: g.clients.size, bcbas: g.bcbas.size, unassignedHours: Math.round(g.unassignedHours * 10) / 10,
    })).sort((a, b) => b.hours - a.hours);
  }, [filtered]);

  // -------------------- MOVERS (period-over-period) --------------------
  // Splits the filtered window into two equal halves by date and computes
  // hours delta per BCBA, code, and state. Powers the Improving / Declining widgets.
  const movers = useMemo(() => {
    const dated = filtered.filter((s) => s.date_of_service);
    if (dated.length < 4) return { bcbaUp: [], bcbaDown: [], codeUp: [], codeDown: [], stateUp: [], stateDown: [] };
    const times = dated.map((s) => parseISO(s.date_of_service!).getTime()).sort((a, b) => a - b);
    const mid = times[Math.floor(times.length / 2)];
    type Pair = { prev: number; curr: number };
    const bcba = new Map<string, Pair>();
    const code = new Map<string, Pair>();
    const state = new Map<string, Pair>();
    const add = (m: Map<string, Pair>, k: string, h: number, isCurr: boolean) => {
      let p = m.get(k);
      if (!p) { p = { prev: 0, curr: 0 }; m.set(k, p); }
      if (isCurr) p.curr += h; else p.prev += h;
    };
    for (const s of dated) {
      const t = parseISO(s.date_of_service!).getTime();
      const isCurr = t >= mid;
      const h = Number(s.hours) || 0;
      const name = s.bcba_name ?? UNASSIGNED;
      if (name !== UNASSIGNED) add(bcba, name, h, isCurr);
      add(code, normalizeCode(s.procedure_code), h, isCurr);
      add(state, extractState(s.raw_labels) ?? "Unknown", h, isCurr);
    }
    const toRows = (m: Map<string, Pair>) =>
      Array.from(m.entries()).map(([name, p]) => ({
        name, prev: p.prev, curr: p.curr,
        delta: p.curr - p.prev,
        deltaPct: pctDelta(p.curr, p.prev),
      }));
    const bRows = toRows(bcba).filter((r) => r.prev + r.curr >= 5);
    const cRows = toRows(code).filter((r) => r.prev + r.curr >= 5);
    const sRows = toRows(state).filter((r) => r.prev + r.curr >= 5 && r.name !== "Unknown");
    return {
      bcbaUp: [...bRows].filter((r) => r.delta > 0).sort((a, b) => b.deltaPct - a.deltaPct).slice(0, 4),
      bcbaDown: [...bRows].filter((r) => r.delta < 0).sort((a, b) => a.deltaPct - b.deltaPct).slice(0, 4),
      codeUp: [...cRows].filter((r) => r.delta > 0).sort((a, b) => b.deltaPct - a.deltaPct).slice(0, 3),
      codeDown: [...cRows].filter((r) => r.delta < 0).sort((a, b) => a.deltaPct - b.deltaPct).slice(0, 3),
      stateUp: [...sRows].filter((r) => r.delta > 0).sort((a, b) => b.deltaPct - a.deltaPct).slice(0, 3),
      stateDown: [...sRows].filter((r) => r.delta < 0).sort((a, b) => a.deltaPct - b.deltaPct).slice(0, 3),
    };
  }, [filtered]);

  // Drill-down: set a filter and scroll to the matching graph section.
  function drillTo(target: "bcba" | "code" | "state", value: string, anchor: string) {
    if (target === "bcba") setBcbaFilter(value);
    if (target === "code") setCodeFilter(value);
    if (target === "state") setStateFilter(value);
    requestAnimationFrame(() => {
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Forecast (linear projection from last 4 weekly buckets)
  const forecast = useMemo(() => {
    if (trendData.length < 3) return null;
    const tail = trendData.slice(-4);
    const avg = tail.reduce((s, x) => s + x.hours, 0) / tail.length;
    const first = tail[0].hours;
    const last = tail[tail.length - 1].hours;
    const growth = pctDelta(last, first);
    const projected = avg * (1 + growth / 100);
    const projectedSessions = bcbaPerformance.length ? Math.round((projected / Math.max(1, summary.hours / Math.max(1, summary.sessions))) ) : 0;
    const capacityRisk = growth > 15 ? "high" : growth > 5 ? "medium" : "low";
    return { avg, growth, projected, projectedSessions, capacityRisk };
  }, [trendData, bcbaPerformance, summary]);

  // -------------------- AI-STYLE INSIGHTS --------------------

  const aiInsights = useMemo(() => {
    const insights: { tone: "positive" | "warning" | "negative" | "neutral"; icon: any; title: string; body: string }[] = [];
    if (trendStats) {
      if (trendStats.delta > 5) {
        insights.push({ tone: "positive", icon: TrendingUp, title: `Billable hours up ${trendStats.delta.toFixed(1)}%`, body: `Compared to the first half of this window. Peak: ${trendStats.high.label} (${trendStats.high.hours.toFixed(0)}h).` });
      } else if (trendStats.delta < -5) {
        insights.push({ tone: "negative", icon: TrendingDown, title: `Billable hours down ${Math.abs(trendStats.delta).toFixed(1)}%`, body: `Lowest period: ${trendStats.low.label} (${trendStats.low.hours.toFixed(0)}h). Investigate scheduling or staffing.` });
      } else {
        insights.push({ tone: "neutral", icon: Activity, title: "Billable hours steady", body: `Within ±5% over the selected window. Stable production.` });
      }
    }
    if (unassignedStats.totalHours > 0) {
      const tone = unassignedStats.delta > 10 ? "negative" : unassignedStats.delta > 0 ? "warning" : "positive";
      const dir = unassignedStats.delta >= 0 ? "increased" : "decreased";
      insights.push({
        tone, icon: AlertTriangle,
        title: `Unassigned hours ${dir} ${Math.abs(unassignedStats.delta).toFixed(1)}%`,
        body: `${unassignedStats.totalHours.toFixed(0)}h unattributed · ~$${(unassignedStats.lostRevenue / 1000).toFixed(1)}k attribution risk.`,
      });
    }
    if (continuity.multi.length > 0) {
      insights.push({
        tone: continuity.multi.length > 5 ? "warning" : "neutral", icon: Users,
        title: `${continuity.multi.length} client${continuity.multi.length > 1 ? "s" : ""} split across multiple BCBAs`,
        body: continuity.multi.length > 0 ? `Top: ${continuity.multi[0].client} (${continuity.multi[0].bcbas.length} BCBAs).` : "",
      });
    }
    if (bcbaPerformance.length > 0) {
      const top = bcbaPerformance[0];
      const totalHours = summary.hours || 1;
      const pct = (top.hours / totalHours) * 100;
      if (pct > 25) {
        insights.push({ tone: "warning", icon: Target, title: `${top.name} carries ${pct.toFixed(0)}% of billable hours`, body: `Concentration risk — single point of failure if unavailable.` });
      }
      const lowUtil = bcbaPerformance.filter((b) => b.lowUtil).length;
      if (lowUtil > 0) {
        insights.push({ tone: "warning", icon: UserCog, title: `${lowUtil} BCBA${lowUtil > 1 ? "s" : ""} below 50% of median`, body: `Capacity available — review caseload assignments.` });
      }
    }
    if (codeDistribution.length > 0) {
      const total = codeDistribution.reduce((s, x) => s + x.hours, 0);
      const c97155 = codeDistribution.find((c) => c.code === "97155");
      if (c97155 && total > 0) {
        const ratio = (c97155.hours / total) * 100;
        if (ratio < 8) {
          insights.push({ tone: "warning", icon: ShieldAlert, title: `Supervision (97155) at ${ratio.toFixed(1)}% of hours`, body: `Industry guidance is 10–20%. Risk to clinical quality and audit compliance.` });
        }
      }
    }
    if (forecast) {
      const tone = forecast.growth > 10 ? "positive" : forecast.growth < -10 ? "negative" : "neutral";
      insights.push({
        tone, icon: Sparkles,
        title: `Next period projected ${forecast.projected.toFixed(0)}h`,
        body: `${forecast.growth >= 0 ? "+" : ""}${forecast.growth.toFixed(1)}% trend · capacity risk: ${forecast.capacityRisk}.`,
      });
    }
    return insights.slice(0, 8);
  }, [trendStats, unassignedStats, continuity, bcbaPerformance, codeDistribution, summary, forecast]);

  // -------------------- RISK ENGINE --------------------

  const risks = useMemo(() => {
    const out: { severity: "high" | "medium" | "low"; title: string; detail: string; action: string }[] = [];
    if (continuity.multi.length >= 5) {
      out.push({ severity: "high", title: `${continuity.multi.length} clients split across multiple BCBAs`, detail: "Continuity issues can affect outcomes and parent satisfaction.", action: "Review handoffs and consolidate primary BCBA assignments." });
    } else if (continuity.multi.length > 0) {
      out.push({ severity: "medium", title: `${continuity.multi.length} client(s) with multiple BCBAs`, detail: "Possible mid-period reassignment.", action: "Confirm intentional handoffs; correct stale tags." });
    }
    if (unassignedStats.totalHours > 50) {
      out.push({ severity: "high", title: `${unassignedStats.totalHours.toFixed(0)}h unassigned`, detail: `Estimated ~$${(unassignedStats.lostRevenue / 1000).toFixed(1)}k of attribution at risk.`, action: "Tag the BCBA in Hubstaff/CR and re-upload in Replace mode." });
    } else if (unassignedStats.totalHours > 0) {
      out.push({ severity: "low", title: `${unassignedStats.totalHours.toFixed(0)}h unassigned`, detail: "Minor attribution gap.", action: "Tag missing BCBAs at end of week." });
    }
    const lowUtil = bcbaPerformance.filter((b) => b.lowUtil);
    if (lowUtil.length >= 3) {
      out.push({ severity: "medium", title: `${lowUtil.length} BCBAs below half the median`, detail: lowUtil.slice(0, 3).map((b) => b.name).join(", ") + (lowUtil.length > 3 ? "…" : ""), action: "Rebalance caseloads or review availability." });
    }
    const stale = bcbaPerformance.filter((b) => b.stale);
    if (stale.length > 0) {
      out.push({ severity: "medium", title: `${stale.length} BCBA(s) inactive 14+ days`, detail: stale.map((b) => b.name).slice(0, 3).join(", "), action: "Confirm leave/separation status." });
    }
    if (trendStats && trendStats.delta < -15) {
      out.push({ severity: "high", title: `Production down ${Math.abs(trendStats.delta).toFixed(0)}%`, detail: "Significant decline in billable hours over this window.", action: "Audit scheduling, cancellations, and authorizations." });
    }
    const c97155 = codeDistribution.find((c) => c.code === "97155");
    const totalH = codeDistribution.reduce((s, x) => s + x.hours, 0);
    if (c97155 && totalH > 0 && (c97155.hours / totalH) * 100 < 8) {
      out.push({ severity: "high", title: "Supervision below 8% of hours", detail: "Below clinical guidance and audit risk threshold.", action: "Schedule additional 97155 supervision blocks this week." });
    }
    const overloaded = rbtLoad.filter((r) => r.overloaded);
    if (overloaded.length > 0) {
      out.push({ severity: "medium", title: `${overloaded.length} BCBA(s) supervising 60%+ above average RBTs`, detail: overloaded.slice(0, 2).map((r) => `${r.name} (${r.rbts})`).join(", "), action: "Redistribute RBT supervision load." });
    }
    return out.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]));
  }, [continuity, unassignedStats, bcbaPerformance, trendStats, codeDistribution, rbtLoad]);

  // Filter option lists
  const allBcbas = useMemo(() => Array.from(new Set(sessions.map((s) => s.bcba_name ?? UNASSIGNED))).sort(), [sessions]);
  const allCodes = useMemo(() => Array.from(new Set(sessions.map((s) => normalizeCode(s.procedure_code)))).sort(), [sessions]);
  const allStates = useMemo(() => Array.from(new Set(sessions.map((s) => extractState(s.raw_labels) ?? "Unknown"))).sort(), [sessions]);

  // Export CSV
  function exportCsv() {
    const rows = [["Date", "BCBA", "Client", "RBT", "Code", "Hours", "State"]];
    for (const s of filtered) {
      rows.push([
        s.date_of_service ?? "", s.bcba_name ?? "", s.client_full ?? "",
        s.provider_full ?? "", normalizeCode(s.procedure_code), String(s.hours ?? ""),
        extractState(s.raw_labels) ?? "",
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `insights-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  // -------------------- RENDER --------------------

  return (
    <div className="-mx-3 -mt-3 md:-mx-6 md:-mt-6 pb-12 animate-fade-in">
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 pt-5 pb-6 md:px-8 md:pt-8 md:pb-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 h-8 text-xs">
              <Link to="/ceo-dashboard-v2"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to CEO Dashboard V2</Link>
            </Button>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> Intelligence
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Insights & Trends</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Operational intelligence powered by billing and session data.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/60 backdrop-blur p-1">
              {WINDOW_ORDER.map((w) => (
                <button
                  key={w}
                  onClick={() => setWindowKey(w)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
                    windowKey === w ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >{WINDOW_LABELS[w]}</button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button asChild variant="default" size="sm" className="h-9 gap-1.5 rounded-xl">
              <Link to={v2Link()} title="Open the V2 dashboard with current filters applied">
                <ExternalLink className="h-3.5 w-3.5" /> Open in V2
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary tiles */}
        <div className="relative mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
          <SummaryTile icon={Clock} label="Billable hours" value={summary.hours.toLocaleString(undefined, { maximumFractionDigits: 1 })} />
          <SummaryTile icon={UserCog} label="Active BCBAs" value={summary.bcbas.toString()} />
          <SummaryTile icon={Users} label="Clients served" value={summary.clients.toString()} />
          <SummaryTile icon={FileBarChart} label="Sessions" value={summary.sessions.toLocaleString()} />
          <SummaryTile icon={Activity} label="Avg hrs / BCBA" value={summary.avgHoursPerBcba.toFixed(1)} />
          <SummaryTile icon={Target} label="Avg sessions / client" value={summary.avgSessionsPerClient.toFixed(1)} />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="px-4 pt-5 md:px-8">
        <Card className="flex flex-wrap items-center gap-2 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1">Filters</span>
          <Select value={bcbaFilter} onValueChange={setBcbaFilter}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72"><SelectItem value="all">All BCBAs</SelectItem>{allBcbas.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={codeFilter} onValueChange={setCodeFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72"><SelectItem value="all">All codes</SelectItem>{allCodes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72"><SelectItem value="all">All states</SelectItem>{allStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Granularity</span>
            <ToggleGroup type="single" value={granularity} onValueChange={(v) => v && setGranularity(v as Granularity)} size="sm">
              <ToggleGroupItem value="weekly" className="h-7 px-2 text-[11px]">Weekly</ToggleGroupItem>
              <ToggleGroupItem value="monthly" className="h-7 px-2 text-[11px]">Monthly</ToggleGroupItem>
              <ToggleGroupItem value="quarterly" className="h-7 px-2 text-[11px]">Quarterly</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="px-4 pt-5 md:px-8 grid gap-4 md:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
      ) : sessions.length === 0 ? (
        <div className="px-4 pt-10 md:px-8">
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No billing data loaded yet. Upload a BCBA Billable CSV from the CEO Dashboard V2 page.
          </Card>
        </div>
      ) : (
        <div className="px-4 pt-5 md:px-8 space-y-4">
          {/* EXECUTIVE INTELLIGENCE WIDGETS */}
          <div className="grid gap-4 lg:grid-cols-3">
            <MoverWidget
              tone="positive"
              icon={TrendingUp}
              title="Improving"
              subtitle="Period-over-period gains"
              empty="No upward movers yet."
              groups={[
                { label: "BCBAs", anchor: "bcba-perf", target: "bcba", rows: movers.bcbaUp },
                { label: "Codes", anchor: "code-mix", target: "code", rows: movers.codeUp },
                { label: "States", anchor: "state-perf", target: "state", rows: movers.stateUp },
              ]}
              onDrill={drillTo}
            />
            <MoverWidget
              tone="negative"
              icon={TrendingDown}
              title="Declining"
              subtitle="Largest period-over-period drops"
              empty="Nothing declining — momentum is strong."
              groups={[
                { label: "BCBAs", anchor: "bcba-perf", target: "bcba", rows: movers.bcbaDown },
                { label: "Codes", anchor: "code-mix", target: "code", rows: movers.codeDown },
                { label: "States", anchor: "state-perf", target: "state", rows: movers.stateDown },
              ]}
              onDrill={drillTo}
            />
            <RiskWidget risks={risks} />
          </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* MAIN COLUMN */}
          <div className="space-y-4 lg:col-span-2">
            {/* AI INSIGHT CARDS */}
            <Card className="p-4 md:p-5">
              <SectionHeader icon={Sparkles} title="Executive insights" subtitle="Auto-generated from current filters" />
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {aiInsights.map((ins, i) => (
                  <InsightCard key={i} {...ins} />
                ))}
              </div>
            </Card>

            {/* GRAPH 1 — TREND */}
            <Card className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <SectionHeader icon={TrendingUp} title="Billable hours trend" subtitle={`${trendData.length} ${granularity} buckets · rolling avg overlay`} />
                {trendStats && (
                  <DeltaPill value={trendStats.delta} />
                )}
              </div>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-hours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grad-hours)" />
                    <Line type="monotone" dataKey="rollingAvg" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {trendStats && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-success/10 px-3 py-2"><span className="text-muted-foreground">Peak </span><strong>{trendStats.high.label}</strong> · {trendStats.high.hours.toFixed(0)}h</div>
                  <div className="rounded-lg bg-destructive/10 px-3 py-2"><span className="text-muted-foreground">Low </span><strong>{trendStats.low.label}</strong> · {trendStats.low.hours.toFixed(0)}h</div>
                </div>
              )}
            </Card>

            {/* GRAPH 2 — BCBA PERFORMANCE */}
            <Card id="bcba-perf" className="p-4 md:p-5 scroll-mt-4">
              <div className="flex items-start justify-between gap-3">
                <SectionHeader icon={UserCog} title="BCBA performance ranking" subtitle="Hover to highlight · click for drill-down · arrow opens in dashboard" />
                <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-[11px]">
                  <Link to={v2Link()}><ExternalLink className="h-3 w-3" /> Open in V2</Link>
                </Button>
              </div>
              <div className="mt-4 space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {bcbaPerformance.slice(0, 20).map((b) => {
                  const max = bcbaPerformance[0]?.hours || 1;
                  const w = (b.hours / max) * 100;
                  const isHover = hovered?.type === "bcba" && hovered.name === b.name;
                  const dim = hovered?.type === "bcba" && hovered.name !== b.name;
                  return (
                    <div
                      key={b.name}
                      onMouseEnter={() => setHovered({ type: "bcba", name: b.name })}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => setDrill({ type: "bcba", name: b.name })}
                      className={cn(
                        "group cursor-pointer rounded-lg border bg-card/60 px-3 py-2.5 transition-all",
                        isHover ? "border-primary/60 bg-muted/60 shadow-sm" : "border-border/40 hover:border-primary/30",
                        dim && "opacity-40",
                      )}
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono text-muted-foreground w-6">#{b.rank}</span>
                          <span className="font-medium truncate">{b.name}</span>
                          {b.stale && <Badge variant="outline" className="text-[9px] border-warning/40 text-warning">inactive</Badge>}
                          {b.lowUtil && <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive">low util</Badge>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 tabular-nums text-[11px]">
                          <span className="text-muted-foreground">{b.clients}c · {b.rbts}r</span>
                          <span className="font-semibold">{b.hours.toFixed(0)}h</span>
                          <span className="text-muted-foreground">P{b.percentile}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); openInV2({ bcba: b.name, drawer: b.name }); }}
                            title="Open BCBA detail in V2 Dashboard"
                            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center h-5 w-5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* GRAPH 4 — UNASSIGNED */}
            <Card className="p-4 md:p-5 border-destructive/20">
              <div className="flex items-start justify-between gap-3">
                <SectionHeader icon={AlertTriangle} title="Unassigned hours trend" subtitle="Attribution gap & estimated revenue risk" tone="destructive" />
                <DeltaPill value={unassignedStats.delta} invert />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Stat label="Unassigned hours" value={`${unassignedStats.totalHours.toFixed(1)}h`} tone="destructive" />
                <Stat label="Attribution risk" value={`~$${(unassignedStats.lostRevenue / 1000).toFixed(1)}k`} tone="destructive" />
                <Stat label="Top state" value={unassignedStats.topStates[0]?.[0] ?? "—"} sub={unassignedStats.topStates[0] ? `${unassignedStats.topStates[0][1].toFixed(0)}h` : ""} />
              </div>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={unassignedTrend} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-unassigned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="hours" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#grad-unassigned)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {unassignedStats.topCandidates.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Most common candidate names</div>
                  <div className="flex flex-wrap gap-1.5">{unassignedStats.topCandidates.map((n) => <Badge key={n} variant="outline" className="font-normal text-[10px]">{n}</Badge>)}</div>
                </div>
              )}
            </Card>

            {/* GRAPH 5 — CONTINUITY */}
            <Card className="p-4 md:p-5">
              <SectionHeader icon={Users} title="Client continuity" subtitle="Distribution of BCBAs per client + multi-BCBA flags" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={continuity.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <RTooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {continuity.distribution.map((d, i) => (
                          <Cell key={i} fill={d.label.startsWith("1 ") ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Multi-BCBA clients</div>
                  {continuity.multi.length === 0 && <div className="text-xs text-muted-foreground">No continuity issues detected.</div>}
                  {continuity.multi.slice(0, 12).map((c) => (
                    <div key={c.client} className="rounded-lg border border-border/40 bg-card/60 px-3 py-2 text-xs">
                      <div className="font-medium truncate">{c.client}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {c.bcbas.map((b) => `${b.name} ${b.hours.toFixed(0)}h`).join(" · ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* GRAPH 6 — RBT LOAD */}
            <Card className="p-4 md:p-5">
              <SectionHeader icon={Users} title="RBT supervision load" subtitle={`Avg ${rbtLoad[0]?.avg?.toFixed(1) ?? 0} RBTs per BCBA`} />
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={rbtLoad.slice(0, 15)} margin={{ top: 5, right: 20, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={120} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <ReferenceLine x={rbtLoad[0]?.avg ?? 0} stroke="hsl(var(--accent))" strokeDasharray="4 3" label={{ value: "avg", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Bar dataKey="rbts" radius={[0, 6, 6, 0]}>
                      {rbtLoad.slice(0, 15).map((r, i) => (
                        <Cell key={i} fill={r.overloaded ? "hsl(var(--destructive))" : r.underutilized ? "hsl(var(--warning, var(--accent)))" : "hsl(var(--primary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* GRAPH 7 — STATE */}
            <Card id="state-perf" className="p-4 md:p-5 scroll-mt-4">
              <SectionHeader icon={MapPin} title="State / location performance" subtitle="Hours, sessions, and staffing by region" />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
                      <th className="text-left py-2 px-2">State</th>
                      <th className="text-right py-2 px-2">Hours</th>
                      <th className="text-right py-2 px-2">Sessions</th>
                      <th className="text-right py-2 px-2">Clients</th>
                      <th className="text-right py-2 px-2">BCBAs</th>
                      <th className="text-right py-2 px-2">Unassigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stateData.map((s) => (
                      <tr key={s.state} className="border-b border-border/30 hover:bg-muted/40 transition-colors">
                        <td className="py-2 px-2 font-medium">{s.state}</td>
                        <td className="py-2 px-2 text-right tabular-nums">{s.hours.toFixed(0)}h</td>
                        <td className="py-2 px-2 text-right tabular-nums">{s.sessions}</td>
                        <td className="py-2 px-2 text-right tabular-nums">{s.clients}</td>
                        <td className="py-2 px-2 text-right tabular-nums">{s.bcbas}</td>
                        <td className={cn("py-2 px-2 text-right tabular-nums", s.unassignedHours > 0 && "text-destructive font-semibold")}>{s.unassignedHours > 0 ? `${s.unassignedHours.toFixed(0)}h` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* RIGHT RAIL */}
          <div className="space-y-4">
            {/* GRAPH 3 — DONUT */}
            <Card id="code-mix" className="p-4 md:p-5 scroll-mt-4">
              <SectionHeader icon={FileBarChart} title="Billing code mix" subtitle="Hours & est. revenue weight" />
              <div className="mt-3 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={codeDistribution} dataKey="hours" nameKey="code" innerRadius={48} outerRadius={78} paddingAngle={2}>
                      {codeDistribution.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {codeDistribution.map((c, i) => (
                  <div key={c.code} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="font-mono">{c.code}</span>
                    </div>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-muted-foreground">{c.pct.toFixed(1)}%</span>
                      <span className="font-medium">{c.hours.toFixed(0)}h</span>
                      <span className="text-[10px] text-muted-foreground">~${(c.revenue / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* GRAPH 8 — FORECAST */}
            <Card className="p-4 md:p-5 bg-gradient-to-br from-primary/5 via-card to-accent/5">
              <SectionHeader icon={Sparkles} title="Forecast" subtitle="Lightweight projection from recent trend" />
              {forecast ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Next period projected</div>
                    <div className="mt-1 text-2xl font-bold tabular-nums">{forecast.projected.toFixed(0)}h</div>
                    <div className={cn("text-[11px] font-medium mt-0.5 inline-flex items-center gap-1", forecast.growth >= 0 ? "text-success" : "text-destructive")}>
                      {forecast.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {forecast.growth.toFixed(1)}% trend
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Stat label="Rolling avg" value={`${forecast.avg.toFixed(0)}h`} />
                    <Stat label="Capacity risk" value={forecast.capacityRisk.toUpperCase()} tone={forecast.capacityRisk === "high" ? "destructive" : forecast.capacityRisk === "medium" ? "warning" : "success"} />
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    {forecast.capacityRisk === "high"
                      ? "At current growth, BCBA capacity may be exceeded soon. Plan hiring or caseload rebalancing."
                      : forecast.capacityRisk === "medium"
                      ? "Modest growth — monitor staffing weekly."
                      : "Stable trajectory. No immediate capacity action required."}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">Not enough history to project.</p>
              )}
            </Card>

            {/* RISKS */}
            <Card id="operational-risks" className="p-4 md:p-5 scroll-mt-4">
              <SectionHeader icon={ShieldAlert} title="Operational risks" subtitle={`${risks.length} flagged`} />
              <div className="mt-3 space-y-2">
                {risks.length === 0 && <p className="text-xs text-muted-foreground">No risks flagged in this window. ✨</p>}
                {risks.map((r, i) => <RiskCard key={i} {...r} />)}
              </div>
            </Card>

            {/* INSIGHTS RAIL */}
            <Card className="p-4 md:p-5 bg-gradient-to-br from-accent/5 via-card to-primary/5">
              <SectionHeader icon={Lightbulb} title="Observations" subtitle="Pattern detection across the dataset" />
              <ul className="mt-3 space-y-2 text-xs">
                {bcbaPerformance.length > 0 && (
                  <li className="flex items-start gap-2"><Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>{bcbaPerformance[0].name} leads with <strong>{bcbaPerformance[0].hours.toFixed(0)}h</strong> ({((bcbaPerformance[0].hours / Math.max(1, summary.hours)) * 100).toFixed(0)}% of total).</span></li>
                )}
                {stateData.length > 0 && (
                  <li className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" /><span>Top region: <strong>{stateData[0].state}</strong> with {stateData[0].hours.toFixed(0)}h across {stateData[0].clients} clients.</span></li>
                )}
                {codeDistribution.length > 0 && (
                  <li className="flex items-start gap-2"><FileBarChart className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span><strong>{codeDistribution[0].code}</strong> dominates at {codeDistribution[0].pct.toFixed(0)}% of all hours.</span></li>
                )}
                {unassignedStats.totalHours > 0 && unassignedStats.topStates[0] && (
                  <li className="flex items-start gap-2"><AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" /><span>Unassigned hours concentrated in <strong>{unassignedStats.topStates[0][0]}</strong>.</span></li>
                )}
                {continuity.multi.length === 0 && (
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" /><span>Patient continuity is clean — no clients split across BCBAs.</span></li>
                )}
              </ul>
            </Card>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

/* ======================== HELPERS ======================== */

type MoverRow = { name: string; prev: number; curr: number; delta: number; deltaPct: number };
type MoverGroup = { label: string; anchor: string; target: "bcba" | "code" | "state"; rows: MoverRow[] };

function MoverWidget({
  tone, icon: Icon, title, subtitle, empty, groups, onDrill,
}: {
  tone: "positive" | "negative";
  icon: any;
  title: string;
  subtitle: string;
  empty: string;
  groups: MoverGroup[];
  onDrill: (target: "bcba" | "code" | "state", value: string, anchor: string) => void;
}) {
  const totalRows = groups.reduce((s, g) => s + g.rows.length, 0);
  const accent = tone === "positive" ? "success" : "destructive";
  const Arrow = tone === "positive" ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className={cn(
      "p-4 md:p-5 animate-fade-in border-t-2",
      tone === "positive" ? "border-t-success/60" : "border-t-destructive/60",
    )}>
      <div className="flex items-start justify-between gap-2">
        <SectionHeader icon={Icon} title={title} subtitle={subtitle} tone={tone === "negative" ? "destructive" : undefined} />
        <Badge variant="outline" className={cn("text-[10px]", `text-${accent} border-${accent}/30`)}>{totalRows}</Badge>
      </div>
      <div className="mt-3 space-y-3">
        {totalRows === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">{empty}</p>
        ) : groups.map((g) => g.rows.length > 0 && (
          <div key={g.label}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{g.label}</div>
            <div className="space-y-1">
              {g.rows.map((r) => (
                <button
                  key={r.name}
                  onClick={() => onDrill(g.target, r.name, g.anchor)}
                  className="group w-full flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-card/60 px-2.5 py-1.5 text-left hover:border-primary/40 hover:bg-muted/60 transition-all"
                  title="Filter and scroll to detail"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      {r.prev.toFixed(0)}h → {r.curr.toFixed(0)}h
                    </div>
                  </div>
                  <div className={cn("flex items-center gap-0.5 shrink-0 text-[11px] font-semibold tabular-nums",
                    tone === "positive" ? "text-success" : "text-destructive")}>
                    <Arrow className="h-3 w-3" />
                    {Math.abs(r.deltaPct).toFixed(0)}%
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RiskWidget({ risks }: { risks: { severity: "high" | "medium" | "low"; title: string; detail: string; action: string }[] }) {
  const high = risks.filter((r) => r.severity === "high").length;
  const med = risks.filter((r) => r.severity === "medium").length;
  return (
    <Card className="p-4 md:p-5 animate-fade-in border-t-2 border-t-warning/60">
      <div className="flex items-start justify-between gap-2">
        <SectionHeader icon={ShieldAlert} title="Emerging risks" subtitle={`${high} high · ${med} medium`} />
        <Link
          to="#operational-risks"
          onClick={(e) => { e.preventDefault(); document.getElementById("operational-risks")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
          className="text-[11px] text-primary hover:underline shrink-0 inline-flex items-center gap-0.5"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {risks.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">All clear — no risks flagged. ✨</p>}
        {risks.slice(0, 4).map((r, i) => (
          <button
            key={i}
            onClick={() => document.getElementById("operational-risks")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className={cn(
              "group w-full text-left rounded-lg border px-3 py-2 transition-all hover:scale-[1.01]",
              r.severity === "high" ? "border-destructive/40 bg-destructive/5"
              : r.severity === "medium" ? "border-warning/40 bg-warning/5"
              : "border-border/60 bg-muted/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-semibold leading-snug">{r.title}</div>
              <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider shrink-0",
                r.severity === "high" ? "bg-destructive text-destructive-foreground"
                : r.severity === "medium" ? "bg-warning text-warning-foreground"
                : "bg-muted text-muted-foreground",
              )}>{r.severity.toUpperCase()}</span>
            </div>
            <div className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground">
              <ChevronRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />
              <span className="text-foreground/75 line-clamp-2">{r.action}</span>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 11,
  padding: "6px 10px",
};

function SectionHeader({ icon: Icon, title, subtitle, tone }: { icon: any; title: string; subtitle?: string; tone?: "destructive" }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight">{title}</div>
        {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
      </div>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-3 hover:border-primary/30 transition-colors animate-scale-in">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />{label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function InsightCard({ tone, icon: Icon, title, body }: { tone: "positive" | "warning" | "negative" | "neutral"; icon: any; title: string; body: string }) {
  const cls = tone === "positive" ? "border-success/30 bg-success/5 text-success"
    : tone === "negative" ? "border-destructive/30 bg-destructive/5 text-destructive"
    : tone === "warning" ? "border-warning/30 bg-warning/5 text-warning"
    : "border-border/60 bg-card/60 text-primary";
  return (
    <div className={cn("rounded-xl border p-3 animate-fade-in transition-all hover:scale-[1.01]", cls)}>
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-foreground">{title}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{body}</div>
        </div>
      </div>
    </div>
  );
}

function DeltaPill({ value, invert }: { value: number; invert?: boolean }) {
  const positive = value >= 0;
  const good = invert ? !positive : positive;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", good ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
      <Icon className="h-3 w-3" />{Math.abs(value).toFixed(1)}%
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "destructive" | "warning" | "success" }) {
  const cls = tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "";
  return (
    <div className="rounded-lg border border-border/40 bg-card/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-base font-semibold tabular-nums", cls)}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function RiskCard({ severity, title, detail, action }: { severity: "high" | "medium" | "low"; title: string; detail: string; action: string }) {
  const cls = severity === "high" ? "border-destructive/40 bg-destructive/5"
    : severity === "medium" ? "border-warning/40 bg-warning/5"
    : "border-border/60 bg-muted/40";
  const label = severity === "high" ? "HIGH" : severity === "medium" ? "MED" : "LOW";
  const labelCls = severity === "high" ? "bg-destructive text-destructive-foreground"
    : severity === "medium" ? "bg-warning text-warning-foreground"
    : "bg-muted text-muted-foreground";
  return (
    <div className={cn("rounded-xl border p-3 animate-fade-in", cls)}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold leading-tight">{title}</div>
        <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider shrink-0", labelCls)}>{label}</span>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>
      <div className="mt-1.5 flex items-start gap-1 text-[11px]">
        <ChevronRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />
        <span className="text-foreground/80">{action}</span>
      </div>
    </div>
  );
}
