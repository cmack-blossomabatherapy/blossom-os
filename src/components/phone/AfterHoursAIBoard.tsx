import { useEffect, useMemo, useState } from "react";
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
import { ExternalLink, RefreshCw, Search, Phone as PhoneIcon, Copy } from "lucide-react";

const WEBHOOK_URL = "https://uvkhjfjknnndunxcdbel.functions.supabase.co/retell-webhook";

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

const STATUS_OPTIONS = ["new", "in_progress", "called_back", "resolved", "no_action"] as const;

function statusColor(s: string | null) {
  switch (s) {
    case "resolved": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "called_back": return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "in_progress": return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "no_action": return "bg-muted text-muted-foreground";
    default: return "bg-primary/15 text-primary";
  }
}

export function AfterHoursAIBoard() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Call | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("phone_ai_calls")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    else setCalls((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("phone_ai_calls_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "phone_ai_calls" },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return calls.filter((c) => {
      if (statusFilter !== "all" && (c.follow_up_status ?? "new") !== statusFilter) return false;
      if (!term) return true;
      return [c.caller_name, c.phone_number, c.state, c.reason_for_call, c.call_summary]
        .filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [calls, q, statusFilter]);

  const counts = useMemo(() => ({
    total: calls.length,
    open: calls.filter((c) => !["resolved", "no_action"].includes(c.follow_up_status ?? "new")).length,
    urgent: calls.filter((c) => c.emergency_flag || (c.urgency_level ?? "").toLowerCase() === "high").length,
    unverified: calls.filter((c) => c.verification_status === "unverified").length,
  }), [calls]);

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
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("retell-sync", { body: {} });
      if (error) throw error;
      toast.success(`Synced ${data?.inserted ?? 0} calls`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">After-Hours AI Calls</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Retell AI captures inbound calls outside business hours. Intake follows up here.
          </p>
        </div>
        <Button onClick={runSync} disabled={syncing} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          Sync from Retell
        </Button>
      </div>

      <Card className="mb-4 border-primary/30 bg-primary/5">
        <CardContent className="py-3 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <div className="text-xs font-medium text-foreground">Retell Webhook URL</div>
            <div className="text-[11px] text-muted-foreground mb-1">
              Paste this into Retell → Agent <span className="font-mono">agent_fb8aaca447d2a6c6703d40d77a</span> → Webhook settings. Event: <span className="font-mono">call_analyzed</span>.
            </div>
            <code className="text-[11px] font-mono break-all text-foreground">{WEBHOOK_URL}</code>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(WEBHOOK_URL);
              toast.success("Webhook URL copied");
            }}
          >
            <Copy className="mr-2 h-3.5 w-3.5" /> Copy
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatPill label="Total calls" value={counts.total} />
        <StatPill label="Needs follow-up" value={counts.open} accent="text-primary" />
        <StatPill label="Urgent" value={counts.urgent} accent="text-destructive" />
        <StatPill label="Unverified webhook" value={counts.unverified} accent="text-amber-600" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search caller, phone, state, reason…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No calls yet. Calls will appear here as Retell sends webhooks, or use Sync to pull history.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => {
                const status = c.follow_up_status ?? "new";
                const urgent = c.emergency_flag || (c.urgency_level ?? "").toLowerCase() === "high";
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
                          <a href={`tel:${c.phone_number}`} className="text-xs text-primary inline-flex items-center gap-1">
                            <PhoneIcon className="h-3 w-3" /> Call back
                          </a>
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
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.caller_name ?? "Unknown caller"}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Info label="Call successful" value={fmt(pick(selected, "call_successful") ?? selected.call_outcome)} />
                  <Info label="User sentiment" value={selected.sentiment} />
                  <Info label="Caller type" value={selected.caller_type} />
                  <Info label="Parent / caller name" value={pick(selected, "parent_or_caller_name") ?? selected.caller_name} />
                  <Info label="Callback number" value={pick(selected, "callback_number") ?? selected.phone_number} />
                  <Info label="Preferred callback time" value={selected.preferred_callback_time} />
                  <Info label="State" value={selected.state} />
                  <Info label="Child age" value={selected.child_age} />
                  <Info label="Insurance provider" value={selected.insurance_provider} />
                  <Info label="Insurance type" value={selected.insurance_type} />
                  <Info label="Urgency level" value={selected.urgency_level} />
                  <Info label="Needs intake follow-up" value={fmt(selected.needs_intake_follow_up)} />
                  <Info label="Emergency flag" value={fmt(selected.emergency_flag)} />
                  <Info label="Callback confirmed" value={fmt(pick(selected, "callback_confirmed"))} />
                  <Info label="Caller emotion" value={selected.caller_emotion ?? pick(selected, "caller_emotion")} />
                  <Info label="Transcript quality" value={pick(selected, "transcript_quality")} />
                  <Info label="Intake readiness" value={pick(selected, "intake_readiness")} />
                  <Info label="Callback priority" value={pick(selected, "callback_priority")} />
                  <Info label="Call outcome" value={selected.call_outcome ?? pick(selected, "call_outcome")} />
                  <Info label="Department" value={selected.department_to_notify} />
                  <Info label="Source" value={selected.source} />
                  <Info label="Verification" value={selected.verification_status} />
                </div>
                {selected.reason_for_call && (
                  <Section title="Reason">{selected.reason_for_call}</Section>
                )}
                {selected.call_summary && (
                  <Section title="AI summary">{selected.call_summary}</Section>
                )}
                {selected.transcript && (
                  <Section title="Transcript">
                    <pre className="whitespace-pre-wrap text-xs font-mono">{selected.transcript}</pre>
                  </Section>
                )}
                {selected.recording_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={selected.recording_url} target="_blank" rel="noreferrer">
                      Listen to recording <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Follow-up notes</label>
                  <Input
                    defaultValue={selected.follow_up_notes ?? ""}
                    onBlur={(e) => updateNotes(selected, e.target.value)}
                    placeholder="Add internal notes…"
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
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