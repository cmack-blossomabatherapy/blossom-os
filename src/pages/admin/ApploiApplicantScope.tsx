import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Super Admin — Apploi applicant scope status.
 *
 * Answers one operational question honestly: does the Apploi partner key
 * expose applicant (candidate) records, and if not, exactly what is blocking
 * it. All probing happens server-side in the `apploi-applicant-scope` edge
 * function; no Apploi credential is ever read in the browser.
 */

type Scope = "granted" | "blocked" | "unknown";

interface Probe {
  endpoint: string;
  httpStatus: number | null;
  ok: boolean;
  recordCount: number | null;
  reportedTotal: number | null;
  error: string | null;
  bodySnippet: string | null;
}

interface ScopeReport {
  checkedAt: string;
  credentials: {
    apiKeyConfigured: boolean;
    teamIdConfigured: boolean;
    teamId: string | null;
    baseUrl: string;
  };
  scope: Scope;
  reasonCode: string;
  reason: string;
  nextStep: string;
  probes: { applicantStatuses: Probe; applicants: Probe; jobs: Probe };
}

const SCOPE_META: Record<Scope, { label: string; icon: typeof CheckCircle2; tone: string; ring: string }> = {
  granted: {
    label: "Applicant scope granted",
    icon: CheckCircle2,
    tone: "text-emerald-600 dark:text-emerald-400",
    ring: "border-emerald-500/40 bg-emerald-500/5",
  },
  blocked: {
    label: "Applicant scope blocked",
    icon: XCircle,
    tone: "text-destructive",
    ring: "border-destructive/40 bg-destructive/5",
  },
  unknown: {
    label: "Applicant scope unconfirmed",
    icon: HelpCircle,
    tone: "text-amber-600 dark:text-amber-400",
    ring: "border-amber-500/40 bg-amber-500/5",
  },
};

export default function ApploiApplicantScope() {
  const [report, setReport] = useState<ScopeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("apploi-applicant-scope", {
      body: {},
    });
    if (fnError || !data?.ok) {
      setReport(null);
      setError(
        fnError?.message?.includes("403") || data?.error === "Forbidden"
          ? "This check is restricted to Super Admins."
          : "The applicant scope check could not complete. Try again shortly.",
      );
    } else {
      setReport(data as ScopeReport);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void run(); }, [run]);

  const meta = report ? SCOPE_META[report.scope] : null;
  const Icon = meta?.icon ?? Loader2;

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/admin/integrations?connector=apploi"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="size-3.5" /> Integrations
          </Link>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight">Apploi applicant scope</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Live, read-only check of whether the Apploi partner key is provisioned to return
            applicant records — and the exact reason when it is not. Job posting sync is separate
            and unaffected.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <ShieldCheck className="size-3" /> Super Admin only
          </Badge>
          <Button size="sm" variant="outline" onClick={() => { void run(); }} disabled={loading}>
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Re-run check
          </Button>
        </div>
      </div>

      {error && (
        <Card className="rounded-2xl border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-destructive mt-0.5" />
            <p className="text-sm text-foreground">{error}</p>
          </div>
        </Card>
      )}

      {loading && !report && (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      )}

      {report && meta && (
        <>
          <Card className={cn("rounded-2xl p-5", meta.ring)}>
            <div className="flex items-start gap-3">
              <Icon className={cn("size-5 mt-0.5 shrink-0", meta.tone)} strokeWidth={1.75} />
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight">{meta.label}</h2>
                <p className="mt-1.5 text-sm text-foreground/90">{report.reason}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">What to do: </span>
                  {report.nextStep}
                </p>
                <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Reason code {report.reasonCode} · checked {new Date(report.checkedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/60 p-5">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold tracking-tight">Partner key configuration</h3>
            </div>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <ConfigRow label="Partner API key" value={report.credentials.apiKeyConfigured ? "Configured" : "Missing"} good={report.credentials.apiKeyConfigured} />
              <ConfigRow label="Team ID" value={report.credentials.teamId ?? "Missing"} good={report.credentials.teamIdConfigured} />
              <ConfigRow label="API base" value={report.credentials.baseUrl} good />
              <ConfigRow label="Direction" value="Read-only ingest" good />
            </dl>
            <p className="mt-3 text-[11px] text-muted-foreground">
              The key value itself is never sent to the browser — only whether it is present.
            </p>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/60 p-5">
            <h3 className="text-sm font-semibold tracking-tight">Endpoint evidence</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Exactly what Apploi returned for each probe used to reach the verdict above.
            </p>
            <div className="mt-3 divide-y divide-border/60">
              <ProbeRow title="Applicants" probe={report.probes.applicants} />
              <ProbeRow title="Applicant statuses" probe={report.probes.applicantStatuses} />
              <ProbeRow title="Job postings" probe={report.probes.jobs} />
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(JSON.stringify(report, null, 2));
                toast.success("Diagnostic copied — safe to send to Apploi support.");
              }}
            >
              Copy diagnostic for Apploi support
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/admin/integrations?connector=apploi">Back to Apploi connector</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ConfigRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm font-medium truncate", good ? "text-foreground" : "text-destructive")}>{value}</dd>
    </div>
  );
}

function ProbeRow({ title, probe }: { title: string; probe: Probe }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-[11px] text-muted-foreground truncate">{probe.endpoint}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant={probe.ok ? "outline" : "destructive"}>
            {probe.httpStatus != null ? `HTTP ${probe.httpStatus}` : probe.error ?? "no response"}
          </Badge>
          {probe.recordCount != null && (
            <span className="text-muted-foreground">
              {probe.recordCount} record{probe.recordCount === 1 ? "" : "s"}
              {probe.reportedTotal != null ? ` · total ${probe.reportedTotal}` : ""}
            </span>
          )}
        </div>
      </div>
      {probe.bodySnippet && (
        <p className="mt-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[11px] font-mono text-muted-foreground break-all">
          {probe.bodySnippet}
        </p>
      )}
    </div>
  );
}
