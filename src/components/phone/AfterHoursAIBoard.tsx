import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { OperatorDiagnosticsGate } from "@/components/os/intake/OperatorDiagnosticsGate";
import { ExternalLink, RefreshCw, Search, Phone as PhoneIcon, Settings as SettingsIcon, Mail, Send, Plus, X, Sparkles, AlertTriangle, CheckCircle2, Building2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";



type Call = {
  id: string;
  retell_call_id: string;
  caller_name: string | null;
  caller_type: string | null;
  phone_number: string | null;
  state: string | null;
  insurance_provider: string | null;
  insurance_type: string | null;
  child_age: string | null;
  reason_for_call: string | null;
  call_summary: string | null;
  urgency_level: string | null;
  sentiment: string | null;
  emergency_flag: boolean | null;
  department_to_notify: string | null;
  preferred_callback_time: string | null;
  recording_url: string | null;
  transcript: string | null;
  follow_up_status: string | null;
  follow_up_notes: string | null;
  verification_status: string | null;
  source: string | null;
  call_started_at: string | null;
  created_at: string;
  caller_emotion: string | null;
  call_outcome: string | null;
  needs_intake_follow_up: boolean | null;
  custom_analysis_data: Record<string, any> | null;
  raw_retell_payload: Record<string, any> | null;
};

const STATUS_OPTIONS = ["new", "resolved", "no_action"] as const;

const STAGE_META: Record<(typeof STATUS_OPTIONS)[number], { label: string; tone: string; dot: string }> = {
  new: { label: "New", tone: "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground", dot: "bg-primary" },
  resolved: { label: "Resolved", tone: "data-[state=active]:bg-emerald-500 data-[state=active]:text-white", dot: "bg-emerald-500" },
  no_action: { label: "No action", tone: "data-[state=active]:bg-muted-foreground data-[state=active]:text-background", dot: "bg-muted-foreground" },
};

const DEPARTMENT_META: Record<string, { label: string; tone: string }> = {
  intake: { label: "Intake", tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  scheduling: { label: "Scheduling", tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30" },
  state_director: { label: "State Director", tone: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30" },
  hr: { label: "HR", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  urgent: { label: "Urgent", tone: "bg-destructive/10 text-destructive border-destructive/30" },
  unverified: { label: "Unverified — Manual review", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
};

function deptMeta(call: Pick<Call, "department_to_notify" | "call_summary" | "verification_status">) {
  const needsReview = call.verification_status === "unverified_failed" || (!call.call_summary);
  const key = needsReview ? "unverified" : (call.department_to_notify || "intake");
  return { key, ...(DEPARTMENT_META[key] ?? DEPARTMENT_META.intake) };
}

type Routing = {
  id: string;
  department: string;
  emails: string[];
  enabled: boolean;
  notes: string | null;
};

type TestSendResponse = {
  ok?: boolean;
  error?: string;
  resend?: {
    status?: number;
    id?: string | null;
    message?: string | null;
  };
};

function statusColor(s: string | null) {
  switch (s) {
    case "resolved": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "no_action": return "bg-muted text-muted-foreground";
    default: return "bg-primary/15 text-primary";
  }
}

export function AfterHoursAIBoard() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [rangeFilter, setRangeFilter] = useState<string>("7d");
  const [quickView, setQuickView] = useState<"all" | "open" | "urgent" | "unverified" | "today" | "resolved">("all");
  const [selected, setSelected] = useState<Call | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [routing, setRouting] = useState<Routing[]>([]);
  const [resending, setResending] = useState(false);
  const loadInFlightRef = useRef(false);
  const queuedLoadRef = useRef(false);
  const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncStartedRef = useRef(0);

  const load = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    if (loadInFlightRef.current) {
      queuedLoadRef.current = true;
      return;
    }

    loadInFlightRef.current = true;
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from("phone_ai_calls")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) toast.error(error.message);
      else setCalls((data as any) ?? []);
    } finally {
      loadInFlightRef.current = false;
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);

      if (queuedLoadRef.current) {
        queuedLoadRef.current = false;
        void load("refresh");
      }
    }
  }, []);

  useEffect(() => {
    void load("initial");
    const channel = supabase
      .channel("phone_ai_calls_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "phone_ai_calls" },
        () => {
          if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
          realtimeTimerRef.current = setTimeout(() => void load("refresh"), 1200);
        },
      )
      .subscribe();
    return () => {
      if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Deep-link: open a specific call via ?call=<id> (used by email CTA).
  //
  // Also honors filter deep-links used by notifications:
  //   ?dept=intake|scheduling|hr|state_director|urgent
  //   ?range=today|7d|30d|all
  //   ?view=all|open|urgent|unverified|today|resolved
  //
  // If ?call is set but the call falls outside the current range, we widen
  // the range to "all" so the drawer can actually surface it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dept = params.get("dept");
    if (dept && ["intake", "scheduling", "hr", "state_director", "urgent"].includes(dept)) {
      setDeptFilter(dept);
    }
    const range = params.get("range");
    if (range && ["today", "7d", "30d", "all"].includes(range)) setRangeFilter(range);
    const view = params.get("view");
    if (
      view &&
      ["all", "open", "urgent", "unverified", "today", "resolved"].includes(view)
    ) {
      setQuickView(view as typeof quickView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!calls.length) return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get("call");
    if (!target) return;
    const match = calls.find((c) => c.id === target || c.retell_call_id === target);
    if (!match) return;
    if (!inRange(match, rangeFilter)) setRangeFilter("all");
    setSelected(match);
  }, [calls, rangeFilter]);

  const isUrgent = (c: Call) => !!c.emergency_flag || (c.urgency_level ?? "").toLowerCase() === "high";
  const isOpen = (c: Call) => !["resolved", "no_action"].includes(c.follow_up_status ?? "new");
  const isToday = (c: Call) => {
    const d = new Date(c.call_started_at ?? c.created_at);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  };
  const inRange = (c: Call, range: string) => {
    if (range === "all") return true;
    const d = new Date(c.call_started_at ?? c.created_at).getTime();
    const now = Date.now();
    const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 9999;
    if (range === "today") return isToday(c);
    return now - d <= days * 86400000;
  };

  const rangeScoped = useMemo(() => calls.filter((c) => inRange(c, rangeFilter)), [calls, rangeFilter]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rangeScoped.filter((c) => {
      // quick view
      if (quickView === "open" && !isOpen(c)) return false;
      if (quickView === "urgent" && !isUrgent(c)) return false;
      if (quickView === "unverified" && c.verification_status !== "unverified" && !!c.call_summary) return false;
      if (quickView === "today" && !isToday(c)) return false;
      if (quickView === "resolved" && (c.follow_up_status ?? "new") !== "resolved") return false;
      // filters
      if (statusFilter !== "all" && (c.follow_up_status ?? "new") !== statusFilter) return false;
      if (deptFilter !== "all" && deptMeta(c).key !== deptFilter) return false;
      if (stateFilter !== "all" && (c.state ?? "") !== stateFilter) return false;
      if (urgencyFilter !== "all" && (c.urgency_level ?? "").toLowerCase() !== urgencyFilter) return false;
      if (!term) return true;
      return [c.caller_name, c.phone_number, c.state, c.reason_for_call, c.call_summary]
        .filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [rangeScoped, q, statusFilter, deptFilter, stateFilter, urgencyFilter, quickView]);

  const counts = useMemo(() => ({
    total: rangeScoped.length,
    open: rangeScoped.filter(isOpen).length,
    urgent: rangeScoped.filter(isUrgent).length,
    unverified: rangeScoped.filter((c) => c.verification_status === "unverified" || !c.call_summary).length,
    today: rangeScoped.filter(isToday).length,
    resolved: rangeScoped.filter((c) => (c.follow_up_status ?? "") === "resolved").length,
  }), [rangeScoped]);

  const stageCounts = useMemo(() => {
    const base: Record<string, number> = { all: rangeScoped.length, new: 0, resolved: 0, no_action: 0 };
    rangeScoped.forEach((c) => {
      const s = (c.follow_up_status ?? "new");
      const key = s === "resolved" || s === "no_action" ? s : "new";
      base[key] = (base[key] ?? 0) + 1;
    });
    return base;
  }, [rangeScoped]);

  const deptBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    rangeScoped.forEach((c) => {
      const k = deptMeta(c).key;
      map[k] = (map[k] ?? 0) + 1;
    });
    return map;
  }, [rangeScoped]);

  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    calls.forEach((c) => { if (c.state) set.add(c.state); });
    return Array.from(set).sort();
  }, [calls]);

  const clearFilters = () => {
    setQ(""); setStatusFilter("all"); setDeptFilter("all");
    setStateFilter("all"); setUrgencyFilter("all"); setQuickView("all");
  };
  const filtersActive = q || statusFilter !== "all" || deptFilter !== "all" ||
    stateFilter !== "all" || urgencyFilter !== "all" || quickView !== "all";

  const updateStatus = async (call: Call, status: string) => {
    const { error } = await supabase
      .from("phone_ai_calls")
      .update({ follow_up_status: status })
      .eq("id", call.id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
  };

  const updateNotes = async (call: Call, notes: string) => {
    const { error } = await supabase
      .from("phone_ai_calls")
      .update({ follow_up_notes: notes })
      .eq("id", call.id);
    if (error) return toast.error(error.message);
  };

  const runSync = async () => {
    const now = Date.now();
    if (syncing || now - lastSyncStartedRef.current < 10000) {
      toast.info("Sync is already running. Please wait a moment.");
      return;
    }
    lastSyncStartedRef.current = now;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("retell-sync", { body: {} });
      if (error) throw error;
      const result = data as { inserted?: number; skippedExisting?: number; fetched?: number } | null;
      toast.success("Retell sync complete", {
        description: `Fetched ${result?.fetched ?? 0}, added ${result?.inserted ?? 0}, skipped ${result?.skippedExisting ?? 0}.`,
      });
      await load("refresh");
    } catch (e: any) {
      toast.error(e.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const loadRouting = async () => {
    const { data, error } = await supabase
      .from("phone_ai_call_routing")
      .select("*")
      .order("department");
    if (error) toast.error(error.message);
    else setRouting((data as any) ?? []);
  };

  useEffect(() => { if (settingsOpen) loadRouting(); }, [settingsOpen]);

  const saveRouting = async (r: Routing, patch: Partial<Routing>) => {
    const next = { ...r, ...patch };
    setRouting((prev) => prev.map((x) => (x.id === r.id ? next : x)));
    const { error } = await supabase
      .from("phone_ai_call_routing")
      .update({ emails: next.emails, enabled: next.enabled, notes: next.notes })
      .eq("id", r.id);
    if (error) toast.error(error.message);
  };

  const resendNotification = async (call: Call) => {
    setResending(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      const { data, error } = await supabase.functions.invoke("notify-after-hours-call", {
        body: {
          call_id: call.id,
          force: true,
          triggered_by_user_id: user?.id ?? null,
          triggered_by_email: user?.email ?? null,
          triggered_by_name: (user?.user_metadata as any)?.display_name ?? user?.email ?? null,
        },
      });
      if (error) throw error;
      if ((data as any)?.skipped) {
        toast.warning(`Skipped: ${(data as any).reason}`);
      } else {
        toast.success(`Notification sent to ${(data as any)?.recipients?.length ?? 0} recipient(s)`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Send failed");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">After-Hours AI Calls</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inbound calls captured after business hours. Intake reviews and follows up here.
          </p>
        </div>
        <div className="flex gap-2">
          <OperatorDiagnosticsGate>
            <Button onClick={() => setSettingsOpen(true)} variant="outline" size="sm">
              <SettingsIcon className="mr-2 h-3.5 w-3.5" /> Routing & Notifications
            </Button>
            <Button onClick={runSync} disabled={syncing} variant="outline" size="sm">
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              Sync history
            </Button>
          </OperatorDiagnosticsGate>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="text-xs text-muted-foreground">
          Reception desk · showing <span className="font-medium text-foreground">{filtered.length}</span> of {counts.total}
          {refreshing && !loading ? <span className="ml-2">Refreshing…</span> : null}
        </div>
        <Tabs value={rangeFilter} onValueChange={setRangeFilter}>
          <TabsList className="h-8">
            <TabsTrigger value="today" className="text-xs px-2.5">Today</TabsTrigger>
            <TabsTrigger value="7d" className="text-xs px-2.5">7d</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-2.5">30d</TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-2.5">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <Scorecard label="All calls" value={counts.total} active={quickView === "all"} onClick={() => setQuickView("all")} />
        <Scorecard label="Today" value={counts.today} active={quickView === "today"} onClick={() => setQuickView("today")} accent="text-foreground" />
        <Scorecard label="Needs follow-up" value={counts.open} active={quickView === "open"} onClick={() => setQuickView("open")} accent="text-primary" />
        <Scorecard label="Urgent" value={counts.urgent} active={quickView === "urgent"} onClick={() => setQuickView("urgent")} accent="text-destructive" />
        <Scorecard label="Unverified / AI pending" value={counts.unverified} active={quickView === "unverified"} onClick={() => setQuickView("unverified")} accent="text-amber-600" />
        <Scorecard label="Resolved" value={counts.resolved} active={quickView === "resolved"} onClick={() => setQuickView("resolved")} accent="text-emerald-600" />
      </div>

      {/* Department drilldown */}
      <div className="mb-4 rounded-xl border border-border bg-card p-3">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2 px-1">
          Route by department
        </div>
        <div className="flex flex-wrap gap-1.5">
          <DeptChip label="All departments" count={counts.total} active={deptFilter === "all"} onClick={() => setDeptFilter("all")} />
          {Object.entries(DEPARTMENT_META).map(([key, meta]) => (
            <DeptChip
              key={key}
              label={meta.label}
              count={deptBreakdown[key] ?? 0}
              tone={meta.tone}
              active={deptFilter === key}
              onClick={() => setDeptFilter(key)}
            />
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search caller, phone, state, reason…" className="pl-9" />
        </div>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Urgency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All urgency</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {stateOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Stage tabs — simple workflow stages */}
      <div className="mb-3 inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        <StageTab label="All" count={stageCounts.all} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        {(STATUS_OPTIONS).map((s) => (
          <StageTab
            key={s}
            label={STAGE_META[s].label}
            count={stageCounts[s] ?? 0}
            dot={STAGE_META[s].dot}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No calls yet. New after-hours calls will appear here as they come in.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => {
                const status = c.follow_up_status ?? "new";
                const urgent = c.emergency_flag || (c.urgency_level ?? "").toLowerCase() === "high";
                const dept = deptMeta(c);
                const aiReviewed = !!c.call_summary;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="w-full text-left rounded-lg border border-border p-4 hover:bg-muted/30 transition"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {c.caller_name ?? "Unknown caller"}
                          </span>
                          {c.caller_type && <Badge variant="outline" className="text-[10px]">{c.caller_type}</Badge>}
                          {c.state && <Badge variant="secondary" className="text-[10px]">{c.state}</Badge>}
                          {urgent && <Badge className="text-[10px] bg-destructive text-destructive-foreground">Urgent</Badge>}
                          {c.verification_status === "unverified" && (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-600/40">unverified</Badge>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          {aiReviewed ? (
                            <Badge variant="outline" className="text-[10px] gap-1 border-primary/40 text-primary bg-primary/5">
                              <Sparkles className="h-2.5 w-2.5" /> AI Reviewed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/40 text-amber-600">
                              <AlertTriangle className="h-2.5 w-2.5" /> AI pending
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-[10px] gap-1 ${dept.tone}`}>
                            <Building2 className="h-2.5 w-2.5" /> Route → {dept.label}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{c.phone_number ?? "—"}</span>
                          {c.insurance_provider && <> · {c.insurance_provider}</>}
                          {" · "}{new Date(c.call_started_at ?? c.created_at).toLocaleString()}
                        </div>
                        {c.call_summary && (
                          <p className="mt-2 text-sm line-clamp-2">{c.call_summary}</p>
                        )}
                        {c.preferred_callback_time && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Callback preferred: <span className="font-medium text-foreground">{c.preferred_callback_time}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                        <Select value={status} onValueChange={(v) => updateStatus(c, v)}>
                          <SelectTrigger className={`w-[170px] h-8 ${statusColor(status)}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {c.phone_number && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-[170px] h-8 gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(c.phone_number!);
                              toast.success("Number copied to clipboard", {
                                description: c.phone_number!,
                              });
                            }}
                          >
                            <PhoneIcon className="h-3.5 w-3.5" />
                            Call back
                          </Button>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          {selected && (
            <CallDetail
              call={selected}
              resending={resending}
              onResend={() => resendNotification(selected)}
              onSaveNotes={async (notes) => { await updateNotes(selected, notes); }}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email Routing</SheetTitle>
          </SheetHeader>
          <div className="mt-2 text-xs text-muted-foreground">
            Each call is auto-classified by AI into a department. Add the email addresses that should be notified when a call comes in for that department. The <span className="font-medium">unverified</span> bucket also catches calls that could not be classified or verified.
          </div>
          <div className="mt-5 space-y-4">
            {routing.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">Loading routing…</div>
            )}
            {routing.map((r) => (
              <RoutingCard key={r.id} routing={r} onSave={saveRouting} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RoutingCard({ routing, onSave }: { routing: Routing; onSave: (r: Routing, patch: Partial<Routing>) => void }) {
  const [draft, setDraft] = useState("");
  const [testing, setTesting] = useState(false);
  const add = () => {
    const email = draft.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    if (routing.emails.includes(email)) {
      setDraft("");
      return;
    }
    onSave(routing, { emails: [...routing.emails, email] });
    setDraft("");
  };
  const remove = (email: string) => onSave(routing, { emails: routing.emails.filter((e) => e !== email) });
  const sendTest = async () => {
    setTesting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      const { data, error } = await supabase.functions.invoke("notify-after-hours-call", {
        body: {
          test: true,
          department: routing.department,
          to: "cmack@blossomabatherapy.com",
          triggered_by_user_id: user?.id ?? null,
          triggered_by_email: user?.email ?? null,
          triggered_by_name: (user?.user_metadata as any)?.display_name ?? user?.email ?? null,
        },
      });
      const result = data as TestSendResponse | null;
      const resend = result?.resend;
      const providerFailed = resend?.status >= 400 || result?.ok === false;
      const messageId = resend?.id ? String(resend.id) : null;
      if (error || result?.error || providerFailed) {
        toast.error(`Test failed: ${result?.error ?? resend?.message ?? error?.message ?? "unknown email provider error"}`);
      } else if (!messageId) {
        toast.warning("Provider accepted the request, but no message ID came back. Check routing logs.");
      } else {
        toast.success("Test accepted by email provider", {
          description: `Sent to cmack@blossomabatherapy.com · Message ${messageId}`,
        });
      }
    } catch (e: unknown) {
      toast.error(`Test failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setTesting(false);
    }
  };
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="font-medium capitalize text-sm">{routing.department}</div>
            {routing.notes && <div className="text-xs text-muted-foreground mt-0.5">{routing.notes}</div>}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={routing.enabled}
              onChange={(e) => onSave(routing, { enabled: e.target.checked })}
              className="h-3.5 w-3.5"
            />
            Enabled
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {routing.emails.length === 0 && (
            <span className="text-xs text-muted-foreground italic">No recipients configured</span>
          )}
          {routing.emails.map((e) => (
            <Badge key={e} variant="secondary" className="gap-1 pr-1">
              {e}
              <button onClick={() => remove(e)} className="ml-1 rounded hover:bg-muted-foreground/10 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder="name@blossomabatherapy.com"
            className="h-8 text-sm"
          />
          <Button size="sm" variant="outline" onClick={add}><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <div className="text-xs text-muted-foreground">Send a sample email to verify routing.</div>
          <Button size="sm" variant="secondary" onClick={sendTest} disabled={testing}>
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            {testing ? "Sending…" : "Send test"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatPill({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold mt-0.5 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}

function Scorecard({ label, value, active, onClick, accent }: { label: string; value: number; active?: boolean; onClick?: () => void; accent?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-sm ${
        active ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card hover:border-border"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-0.5 ${accent ?? "text-foreground"}`}>{value}</div>
    </button>
  );
}

function DeptChip({ label, count, tone, active, onClick }: { label: string; count: number; tone?: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : tone
            ? `${tone} hover:opacity-90`
            : "border-border bg-muted/40 text-foreground hover:bg-muted"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className={`tabular-nums ${active ? "opacity-90" : "text-muted-foreground"}`}>{count}</span>
    </button>
  );
}

function StageTab({ label, count, dot, active, onClick }: { label: string; count: number; dot?: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      <span>{label}</span>
      <span className={`tabular-nums text-[11px] ${active ? "opacity-80" : "text-muted-foreground/80"}`}>{count}</span>
    </button>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

function pick(c: Call, key: string): string | null {
  const v = c.custom_analysis_data?.[key] ?? c.raw_retell_payload?.call?.call_analysis?.custom_analysis_data?.[key];
  if (v === undefined || v === null || v === "") return null;
  return typeof v === "string" ? v : String(v);
}

function fmt(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-1">{title}</div>
      <div className="rounded-md bg-muted/40 p-3 text-sm">{children}</div>
    </div>
  );
}

function CallDetail({
  call,
  resending,
  onResend,
  onSaveNotes,
}: {
  call: Call;
  resending: boolean;
  onResend: () => void;
  onSaveNotes: (notes: string) => Promise<void> | void;
}) {
  const dept = deptMeta(call);
  const aiReviewed = !!call.call_summary;
  const urgent = call.emergency_flag || (call.urgency_level ?? "").toLowerCase() === "high";
  const [notes, setNotes] = useState(call.follow_up_notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  useEffect(() => { setNotes(call.follow_up_notes ?? ""); }, [call.id]);

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await onSaveNotes(notes);
      toast.success("Notes saved");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div>
      {/* Hero header */}
      <div className={`px-6 pt-6 pb-5 border-b border-border ${urgent ? "bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent" : "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"}`}>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
          <PhoneIcon className="h-3 w-3" /> After-Hours Call
          <span>·</span>
          <span>{new Date(call.call_started_at ?? call.created_at).toLocaleString()}</span>
        </div>
        <SheetHeader className="text-left space-y-1 p-0">
          <SheetTitle className="text-2xl font-semibold tracking-tight">
            {call.caller_name ?? "Unknown caller"}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {call.phone_number ? <span className="font-mono">{call.phone_number}</span> : "No callback number"}
            {call.state && <> · {call.state}</>}
            {call.caller_type && <> · {call.caller_type}</>}
          </p>
        </SheetHeader>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {aiReviewed ? (
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary bg-background">
              <Sparkles className="h-3 w-3" /> AI Reviewed
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600 bg-background">
              <AlertTriangle className="h-3 w-3" /> AI processing
            </Badge>
          )}
          <Badge variant="outline" className={`gap-1 ${dept.tone} bg-background`}>
            <Building2 className="h-3 w-3" /> Routes to {dept.label}
          </Badge>
          {urgent && (
            <Badge className="gap-1 bg-destructive text-destructive-foreground">
              <AlertTriangle className="h-3 w-3" /> Urgent
            </Badge>
          )}
          {call.verification_status && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              {call.verification_status === "verified" ? <CheckCircle2 className="h-3 w-3" /> : null}
              {call.verification_status}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* AI Summary card */}
        {call.call_summary && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-primary mb-2">
              <Sparkles className="h-3 w-3" /> AI Summary
            </div>
            <p className="text-sm leading-relaxed text-foreground">{call.call_summary}</p>
          </div>
        )}

        {/* Send notification CTA */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Notify {dept.label}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Manual send while we validate the AI. Recipients are configured in Routing & Notifications.
              </div>
            </div>
            <Button size="sm" disabled={resending} onClick={onResend}>
              <Send className="mr-2 h-3.5 w-3.5" /> {resending ? "Sending…" : "Send email notification"}
            </Button>
          </div>
        </div>

        {/* Key facts */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-3">Call details</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Info label="Call successful" value={fmt(pick(call, "call_successful") ?? call.call_outcome)} />
            <Info label="User sentiment" value={call.sentiment} />
            <Info label="Parent / caller" value={pick(call, "parent_or_caller_name") ?? call.caller_name} />
            <Info label="Callback number" value={pick(call, "callback_number") ?? call.phone_number} />
            <Info label="Preferred callback" value={call.preferred_callback_time} />
            <Info label="State" value={call.state} />
            <Info label="Child age" value={call.child_age} />
            <Info label="Insurance provider" value={call.insurance_provider} />
            <Info label="Insurance type" value={call.insurance_type} />
            <Info label="Urgency level" value={call.urgency_level} />
            <Info label="Needs intake follow-up" value={fmt(call.needs_intake_follow_up)} />
            <Info label="Emergency flag" value={fmt(call.emergency_flag)} />
            <Info label="Callback confirmed" value={fmt(pick(call, "callback_confirmed"))} />
            <Info label="Caller emotion" value={call.caller_emotion ?? pick(call, "caller_emotion")} />
            <Info label="Transcript quality" value={pick(call, "transcript_quality")} />
            <Info label="Intake readiness" value={pick(call, "intake_readiness")} />
            <Info label="Callback priority" value={pick(call, "callback_priority")} />
            <Info label="Source" value={call.source} />
          </div>
        </div>

        {call.reason_for_call && (
          <Section title="Reason">{call.reason_for_call}</Section>
        )}

        {call.transcript && (
          <Section title="Transcript">
            <pre className="whitespace-pre-wrap text-xs font-mono max-h-72 overflow-auto">{call.transcript}</pre>
          </Section>
        )}

        {call.recording_url && (
          <Button size="sm" variant="outline" asChild>
            <a href={call.recording_url} target="_blank" rel="noreferrer">
              Listen to recording <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}

        {/* Follow-up notes — proper textarea */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Follow-up notes
            </label>
            <span className="text-[11px] text-muted-foreground">{notes.length} chars</span>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document what happened on the callback, the family's response, next steps…"
            rows={5}
            className="resize-none text-sm"
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="outline" disabled={savingNotes || notes === (call.follow_up_notes ?? "")} onClick={saveNotes}>
              {savingNotes ? "Saving…" : "Save notes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}