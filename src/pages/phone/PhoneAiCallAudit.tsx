import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OSShell } from "@/pages/os/OSShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ArrowLeft, Mail, RefreshCw, Search, ShieldCheck, AlertTriangle,
  CheckCircle2, XCircle, Clock, User, Building2, Phone as PhoneIcon, FileText,
} from "lucide-react";
import { toast } from "sonner";

type AuditRow = {
  id: string;
  call_id: string | null;
  retell_call_id: string | null;
  department: string | null;
  recipients: string[];
  status: string;
  error: string | null;
  subject: string | null;
  trigger_source: string | null;
  triggered_by_user_id: string | null;
  triggered_by_email: string | null;
  triggered_by_name: string | null;
  resend_message_id: string | null;
  caller_snapshot: Record<string, any> | null;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; tone: string; Icon: any }> = {
  sent:      { label: "Sent",     tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", Icon: CheckCircle2 },
  failed:    { label: "Failed",   tone: "bg-destructive/15 text-destructive border-destructive/30",                       Icon: XCircle },
  skipped:   { label: "Skipped",  tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",         Icon: AlertTriangle },
};

const SOURCE_META: Record<string, { label: string; tone: string }> = {
  auto_webhook:  { label: "Auto · webhook",   tone: "bg-primary/10 text-primary border-primary/30" },
  manual_resend: { label: "Manual resend",    tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  test:          { label: "Test",             tone: "bg-muted text-muted-foreground border-border" },
};

export default function PhoneAiCallAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("phone_ai_call_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    else setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("phone_ai_notif_audit_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "phone_ai_call_notifications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const deptOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.department && s.add(r.department));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (sourceFilter !== "all" && (r.trigger_source ?? "auto_webhook") !== sourceFilter) return false;
      if (deptFilter !== "all" && (r.department ?? "") !== deptFilter) return false;
      if (!term) return true;
      const snap = r.caller_snapshot ?? {};
      return [
        r.subject, r.triggered_by_email, r.triggered_by_name, r.department,
        r.recipients?.join(" "), r.resend_message_id, r.retell_call_id, r.error,
        snap.caller_name, snap.phone_number, snap.state, snap.reason_for_call,
      ].filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [rows, q, statusFilter, sourceFilter, deptFilter]);

  const counts = useMemo(() => ({
    total: rows.length,
    sent: rows.filter((r) => r.status === "sent").length,
    failed: rows.filter((r) => r.status === "failed").length,
    skipped: rows.filter((r) => r.status === "skipped").length,
  }), [rows]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1400px] p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link to="/phone" className="hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Phone System
              </Link>
              <span>·</span>
              <span>After-Hours AI</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Email Audit Log
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Every notification email sent from After-Hours AI Calls — auto, manual, and test sends — with the user who triggered it and the caller context at send time.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Stat label="Total events" value={counts.total} />
          <Stat label="Sent" value={counts.sent} accent="text-emerald-600" />
          <Stat label="Failed" value={counts.failed} accent="text-destructive" />
          <Stat label="Skipped" value={counts.skipped} accent="text-amber-600" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search caller, recipient, user, dept, subject, message id…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="auto_webhook">Auto · webhook</SelectItem>
              <SelectItem value="manual_resend">Manual resend</SelectItem>
              <SelectItem value="test">Test</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {deptOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No email audit events yet. Emails sent from the After-Hours AI Calls page will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((r) => {
                  const sMeta = STATUS_META[r.status] ?? { label: r.status, tone: "bg-muted text-muted-foreground", Icon: Clock };
                  const srcMeta = SOURCE_META[r.trigger_source ?? "auto_webhook"] ?? { label: r.trigger_source ?? "—", tone: "bg-muted text-muted-foreground border-border" };
                  const snap = r.caller_snapshot ?? {};
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="w-full text-left rounded-lg border border-border p-4 hover:bg-muted/30 transition"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] gap-1 ${sMeta.tone}`}>
                              <sMeta.Icon className="h-2.5 w-2.5" /> {sMeta.label}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] ${srcMeta.tone}`}>{srcMeta.label}</Badge>
                            {r.department && (
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <Building2 className="h-2.5 w-2.5" /> {r.department}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1.5 text-sm font-medium truncate">
                            {r.subject ?? <span className="text-muted-foreground italic">(no subject — {r.status})</span>}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                            <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{r.recipients?.length ? r.recipients.join(", ") : "no recipients"}</span>
                            {(snap.caller_name || snap.phone_number) && (
                              <span className="inline-flex items-center gap-1">
                                <PhoneIcon className="h-3 w-3" />
                                {snap.caller_name ?? "Unknown"}
                                {snap.phone_number ? ` · ${snap.phone_number}` : ""}
                                {snap.state ? ` · ${snap.state}` : ""}
                              </span>
                            )}
                          </div>
                          {r.error && (
                            <div className="mt-1 text-xs text-destructive line-clamp-1">⚠ {r.error}</div>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground space-y-0.5 min-w-[180px]">
                          <div>{new Date(r.created_at).toLocaleString()}</div>
                          <div className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {r.triggered_by_name ?? r.triggered_by_email ?? <span className="italic">system</span>}
                          </div>
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
            {selected && <AuditDetail row={selected} />}
          </SheetContent>
        </Sheet>
      </div>
    </OSShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-0.5 ${accent ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}

function AuditDetail({ row }: { row: AuditRow }) {
  const sMeta = STATUS_META[row.status] ?? { label: row.status, tone: "bg-muted text-muted-foreground", Icon: Clock };
  const srcMeta = SOURCE_META[row.trigger_source ?? "auto_webhook"] ?? { label: row.trigger_source ?? "—", tone: "bg-muted text-muted-foreground border-border" };
  const snap = row.caller_snapshot ?? {};
  return (
    <div>
      <SheetHeader className="text-left space-y-1">
        <SheetTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Email Audit Entry
        </SheetTitle>
        <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
      </SheetHeader>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge variant="outline" className={`gap-1 ${sMeta.tone}`}><sMeta.Icon className="h-3 w-3" />{sMeta.label}</Badge>
        <Badge variant="outline" className={srcMeta.tone}>{srcMeta.label}</Badge>
        {row.department && <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{row.department}</Badge>}
      </div>

      <Section title="Email">
        <Row label="Subject" value={row.subject ?? "—"} />
        <Row label="Recipients" value={row.recipients?.length ? row.recipients.join(", ") : "—"} />
        <Row label="Provider message id" mono value={row.resend_message_id ?? "—"} />
        {row.error && <Row label="Error" value={row.error} tone="text-destructive" />}
      </Section>

      <Section title="Triggered by">
        <Row label="User" value={row.triggered_by_name ?? "—"} />
        <Row label="Email" value={row.triggered_by_email ?? "—"} />
        <Row label="User id" mono value={row.triggered_by_user_id ?? "—"} />
      </Section>

      <Section title="Linked call">
        <Row label="Caller" value={snap.caller_name ?? "—"} />
        <Row label="Caller type" value={snap.caller_type ?? "—"} />
        <Row label="Phone" mono value={snap.phone_number ?? "—"} />
        <Row label="State" value={snap.state ?? "—"} />
        <Row label="Insurance" value={[snap.insurance_provider, snap.insurance_type].filter(Boolean).join(" · ") || "—"} />
        <Row label="Child age" value={snap.child_age ?? "—"} />
        <Row label="Urgency" value={snap.urgency_level ?? "—"} />
        <Row label="Verification" value={snap.verification_status ?? "—"} />
        <Row label="Preferred callback" value={snap.preferred_callback_time ?? "—"} />
        <Row label="Reason" value={snap.reason_for_call ?? "—"} />
      </Section>

      <Section title="Connected records">
        <Row label="Patient ref" value={snap.patient_ref ?? "—"} />
        <Row label="Referral ref" value={snap.referral_ref ?? "—"} />
        <Row label="BCBA id" mono value={snap.bcba_id ?? "—"} />
        <Row label="RBT id" mono value={snap.rbt_id ?? "—"} />
        <Row label="Retell call id" mono value={row.retell_call_id ?? "—"} />
        {row.call_id && (
          <div className="pt-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/phone/ai-calls"><FileText className="h-3.5 w-3.5 mr-1.5" /> Open call on board</Link>
            </Button>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-xs text-muted-foreground shrink-0 pt-0.5">{label}</span>
      <span className={`text-right break-all ${mono ? "font-mono text-xs" : ""} ${tone ?? ""}`}>{value}</span>
    </div>
  );
}