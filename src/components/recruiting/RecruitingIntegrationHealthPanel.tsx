import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plug,
  RefreshCw,
  Users,
} from "lucide-react";
import { describeIdentitySource } from "@/lib/recruiting/apploiNormalizedIdentity";

type ApploiReadiness = "connected" | "not_configured" | "loading";

interface ImportErrorRow {
  id: string;
  event_type: string;
  created_at: string;
  to_value: string | null;
  candidate_id: string | null;
  payload: Record<string, unknown> | null;
}

interface OnboardingBlockerBucket {
  candidateId: string;
  candidateName: string;
  overdue: number;
  incomplete: number;
  nextTaskTitle: string | null;
  nextTaskDue: string | null;
}

interface PanelState {
  apploi: ApploiReadiness;
  apploiLastSync: string | null;
  apploiEnabled: boolean | null;
  apploiStatusRaw: string | null;
  importErrors: ImportErrorRow[];
  importErrorTotal: number;
  onboardingBlockers: OnboardingBlockerBucket[];
  totalOverdueOnboardingTasks: number;
  totalOnboardingBlockedCandidates: number;
  loading: boolean;
  refreshing: boolean;
}

const INITIAL: PanelState = {
  apploi: "loading",
  apploiLastSync: null,
  apploiEnabled: null,
  apploiStatusRaw: null,
  importErrors: [],
  importErrorTotal: 0,
  onboardingBlockers: [],
  totalOverdueOnboardingTasks: 0,
  totalOnboardingBlockedCandidates: 0,
  loading: true,
  refreshing: false,
};

const IMPORT_ERROR_EVENTS = [
  "apploi_import_skipped",
  "apploi_import_failed",
  "apploi_import_error",
];

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 60_000) return "just now";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function describeSkipReason(row: ImportErrorRow): string {
  const p = (row.payload ?? {}) as Record<string, unknown>;
  const reason = typeof p.reason === "string" ? p.reason : row.event_type;
  const detail = typeof p.reason_detail === "string" ? p.reason_detail : null;
  const src = typeof p.external_id_source === "string"
    ? describeIdentitySource(p.external_id_source as any)
    : null;
  return [reason.replaceAll("_", " "), detail, src].filter(Boolean).join(" · ");
}

function pickCandidateEmail(row: ImportErrorRow): string | null {
  const p = (row.payload ?? {}) as Record<string, unknown>;
  const email = typeof p.email === "string" ? p.email : null;
  return email || row.to_value || null;
}

export function RecruitingIntegrationHealthPanel() {
  const [state, setState] = useState<PanelState>(INITIAL);

  const load = useCallback(async (isRefresh = false) => {
    setState((s) => ({ ...s, loading: !isRefresh, refreshing: isRefresh }));

    // Apploi readiness ---------------------------------------------------
    let apploi: ApploiReadiness = "not_configured";
    let apploiLastSync: string | null = null;
    let apploiEnabled: boolean | null = null;
    let apploiStatusRaw: string | null = null;
    try {
      const { data: cat } = await supabase
        .from("integration_catalog")
        .select("id")
        .eq("id", "apploi")
        .maybeSingle();
      if (cat) {
        const { data: conn } = await supabase
          .from("integration_connections")
          .select("id,status,enabled")
          .eq("integration_id", "apploi")
          .maybeSingle();
        apploiEnabled = (conn as any)?.enabled ?? null;
        apploiStatusRaw = (conn as any)?.status ?? null;
        const ok = !!conn && (conn as any).status === "connected" && (conn as any).enabled !== false;
        apploi = ok ? "connected" : "not_configured";
        if (conn) {
          const { data: run } = await supabase
            .from("integration_sync_runs")
            .select("started_at,completed_at,status")
            .eq("connection_id", (conn as any).id)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          apploiLastSync = (run as any)?.completed_at ?? (run as any)?.started_at ?? null;
        }
      }
    } catch (e) {
      console.warn("apploi readiness check failed", e);
    }

    // Recent import errors ----------------------------------------------
    let importErrors: ImportErrorRow[] = [];
    let importErrorTotal = 0;
    try {
      const { data, count } = await supabase
        .from("recruiting_activity_events")
        .select("id,event_type,created_at,to_value,candidate_id,payload", { count: "exact" })
        .in("event_type", IMPORT_ERROR_EVENTS)
        .order("created_at", { ascending: false })
        .limit(6);
      importErrors = (data ?? []) as ImportErrorRow[];
      importErrorTotal = count ?? importErrors.length;
    } catch (e) {
      console.warn("apploi import error load failed", e);
    }

    // Onboarding readiness blockers -------------------------------------
    let onboardingBlockers: OnboardingBlockerBucket[] = [];
    let totalOverdueOnboardingTasks = 0;
    let totalOnboardingBlockedCandidates = 0;
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      const { data: overdue } = await supabase
        .from("recruiting_onboarding_tasks")
        .select("id,candidate_id,title,due_date")
        .eq("completed", false)
        .not("due_date", "is", null)
        .lte("due_date", todayIso)
        .order("due_date", { ascending: true })
        .limit(200);
      const rows = (overdue ?? []) as Array<{
        id: string;
        candidate_id: string;
        title: string;
        due_date: string | null;
      }>;
      totalOverdueOnboardingTasks = rows.length;
      const byCandidate = new Map<string, OnboardingBlockerBucket>();
      for (const r of rows) {
        const b = byCandidate.get(r.candidate_id) ?? {
          candidateId: r.candidate_id,
          candidateName: r.candidate_id.slice(0, 8),
          overdue: 0,
          incomplete: 0,
          nextTaskTitle: null,
          nextTaskDue: null,
        };
        b.overdue += 1;
        if (!b.nextTaskTitle) {
          b.nextTaskTitle = r.title;
          b.nextTaskDue = r.due_date;
        }
        byCandidate.set(r.candidate_id, b);
      }
      totalOnboardingBlockedCandidates = byCandidate.size;

      const ids = Array.from(byCandidate.keys()).slice(0, 6);
      if (ids.length) {
        const { data: cands } = await supabase
          .from("recruiting_candidates")
          .select("id,first_name,last_name,email")
          .in("id", ids);
        for (const c of (cands ?? []) as any[]) {
          const b = byCandidate.get(c.id);
          if (b) {
            const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
            b.candidateName = name || c.email || b.candidateName;
          }
        }
      }
      onboardingBlockers = ids
        .map((id) => byCandidate.get(id))
        .filter(Boolean) as OnboardingBlockerBucket[];
    } catch (e) {
      console.warn("onboarding blockers load failed", e);
    }

    setState({
      apploi,
      apploiLastSync,
      apploiEnabled,
      apploiStatusRaw,
      importErrors,
      importErrorTotal,
      onboardingBlockers,
      totalOverdueOnboardingTasks,
      totalOnboardingBlockedCandidates,
      loading: false,
      refreshing: false,
    });
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const apploiPill = useMemo(() => {
    if (state.apploi === "loading") return { label: "Checking…", cls: "bg-muted text-muted-foreground" };
    if (state.apploi === "connected") {
      return { label: "Connected", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
    }
    return { label: "Not connected", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  }, [state.apploi]);

  return (
    <Card className="rounded-2xl border-border/70 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-border/60 bg-indigo-500/10 text-indigo-500">
            <Users className="size-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight">Recruiting integration health</h3>
              <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-wider">
                Apploi
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provider readiness, onboarding blockers, and recent import errors.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => load(true)}
          disabled={state.loading || state.refreshing}
          className="h-8 gap-1.5"
        >
          {state.refreshing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {/* Provider readiness ---------------------------------------------- */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <Plug className="size-3.5" /> Apploi connection
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                apploiPill.cls,
              )}
            >
              <span className={cn(
                "size-1.5 rounded-full",
                state.apploi === "connected" ? "bg-emerald-500" : "bg-amber-500",
              )} />
              {apploiPill.label}
            </span>
            {state.apploiEnabled === false && (
              <span className="text-[11px] text-amber-600">disabled</span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Last sync: <span className="text-foreground">{timeAgo(state.apploiLastSync)}</span>
          </div>
          {state.apploi !== "connected" && (
            <p className="mt-2 text-[11px] text-amber-700">
              Configure the Apploi connection above to enable candidate import.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <AlertTriangle className="size-3.5" /> Import errors (30d)
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {state.importErrorTotal}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Skipped or failed Apploi normalized records.
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <CheckCircle2 className="size-3.5" /> Onboarding blockers
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {state.totalOnboardingBlockedCandidates}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {state.totalOverdueOnboardingTasks} overdue tasks across candidates.
          </div>
        </div>
      </div>

      {/* Import errors detail ------------------------------------------- */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Recent Apploi import errors</h4>
          {state.importErrors.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              Showing {state.importErrors.length} of {state.importErrorTotal}
            </span>
          )}
        </div>
        {state.loading ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Loading…
          </div>
        ) : state.importErrors.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No Apploi import errors recorded. Re-running an import will surface any new skips here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20">
            {state.importErrors.map((row) => {
              const p = (row.payload ?? {}) as Record<string, unknown>;
              const email = pickCandidateEmail(row);
              const nrId = typeof p.normalized_record_id === "string" ? p.normalized_record_id : null;
              const profileUrl = typeof p.profile_url === "string" ? p.profile_url : null;
              return (
                <li key={row.id} className="px-3 py-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {email ?? "(no email)"}
                        </span>
                        <Badge variant="secondary" className="rounded-full text-[10px]">
                          {row.event_type.replace("apploi_import_", "")}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-muted-foreground truncate">
                        {describeSkipReason(row)}
                      </div>
                      {nrId && (
                        <div className="mt-0.5 text-[10.5px] text-muted-foreground/80">
                          normalized_record_id: <code>{nrId}</code>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{timeAgo(row.created_at)}</span>
                      {profileUrl && (
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-indigo-500 hover:underline"
                        >
                          Profile <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Onboarding blockers detail ------------------------------------- */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Onboarding readiness blockers</h4>
          <Link
            to="/recruiting/onboarding"
            className="text-[11px] font-medium text-indigo-500 hover:underline"
          >
            Open onboarding →
          </Link>
        </div>
        {state.loading ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Loading…
          </div>
        ) : state.onboardingBlockers.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No candidates have overdue onboarding tasks.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20">
            {state.onboardingBlockers.map((b) => (
              <li key={b.candidateId} className="px-3 py-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{b.candidateName}</div>
                    <div className="text-muted-foreground mt-0.5 truncate">
                      Next: {b.nextTaskTitle ?? "—"}
                      {b.nextTaskDue && ` · due ${b.nextTaskDue}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <Badge variant="secondary" className="rounded-full bg-amber-500/10 text-amber-700">
                      {b.overdue} overdue
                    </Badge>
                    <Link
                      to={`/recruiting/candidates/${b.candidateId}`}
                      className="inline-flex items-center gap-1 text-indigo-500 hover:underline"
                    >
                      Open <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default RecruitingIntegrationHealthPanel;