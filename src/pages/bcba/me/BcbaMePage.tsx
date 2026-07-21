import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowRight, BadgeCheck, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import { useBcbaIdentity } from "../useBcbaIdentity";
import { BcbaPreviewBanner } from "../BcbaPreviewBanner";
import { BcbaMappingDiagnostic } from "../BcbaMappingDiagnostic";

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return d as string; }
}

/** Credential expiry bucket. Exported for tests. */
export function credentialBucket(expiration: string | null | undefined, now: Date = new Date()):
  "expired" | "expiring_soon" | "current" | "unknown" {
  if (!expiration) return "unknown";
  const d = new Date(expiration).getTime();
  if (Number.isNaN(d)) return "unknown";
  const diffDays = Math.floor((d - now.getTime()) / 86_400_000);
  if (diffDays < 0) return "expired";
  if (diffDays <= 60) return "expiring_soon";
  return "current";
}

const BUCKET_LABEL: Record<ReturnType<typeof credentialBucket>, string> = {
  expired: "Expired",
  expiring_soon: "Expiring soon",
  current: "Current",
  unknown: "No expiry",
};

const BUCKET_TONE: Record<ReturnType<typeof credentialBucket>, string> = {
  expired: "bg-rose-50 text-rose-800 border-rose-200",
  expiring_soon: "bg-amber-50 text-amber-800 border-amber-200",
  current: "bg-emerald-50 text-emerald-800 border-emerald-200",
  unknown: "bg-slate-50 text-slate-700 border-slate-200",
};

function useCredentials(employeeId: string | null) {
  return useQuery({
    queryKey: ["bcba-me-credentials", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data: providers, error: pErr } = await supabase
        .from("credentialing_providers")
        .select("id, provider_name, provider_type, license_number, license_state, license_expiration_date, npi, caqh_id, active")
        .eq("employee_id", employeeId!);
      if (pErr) throw pErr;
      const provIds = (providers ?? []).map((p: any) => p.id);
      let records: any[] = [];
      if (provIds.length) {
        const { data, error } = await supabase
          .from("credentialing_records")
          .select("id, provider_id, payer_name, state, status, effective_date, expiration_date, reattestation_due_date, blocker_reason")
          .in("provider_id", provIds)
          .order("expiration_date", { ascending: true });
        if (error) throw error;
        records = data ?? [];
      }
      return { providers: providers ?? [], records };
    },
  });
}

function useGrowth(userId: string | null, employeeId: string | null) {
  return useQuery({
    queryKey: ["bcba-me-growth", userId, employeeId],
    enabled: !!(userId || employeeId),
    queryFn: async () => {
      const [academyR, trainingR, fellowR] = await Promise.all([
        userId
          ? supabase.from("bcba_academy_progress")
              .select("section_key, status, progress_pct, is_required, last_viewed_at, completed_at")
              .eq("user_id", userId)
          : Promise.resolve({ data: [], error: null } as any),
        employeeId
          ? supabase.from("employee_trainings")
              .select("id, course_id, status, due_date, completed_at, expires_on, score")
              .eq("employee_id", employeeId)
              .order("due_date", { ascending: true })
              .limit(50)
          : Promise.resolve({ data: [], error: null } as any),
        userId
          ? supabase.from("bcba_fellowship_fellows")
              .select("id, stage_key, start_date, target_completion_date, coursework_status, fieldwork_status, restricted_hours, unrestricted_hours, supervision_status, readiness_status")
              .eq("user_id", userId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
      ]);
      if (academyR.error) throw academyR.error;
      if (trainingR.error) throw trainingR.error;
      if (fellowR.error && (fellowR as any).error?.code !== "PGRST116") throw fellowR.error;
      return {
        academy: (academyR.data ?? []) as any[],
        trainings: (trainingR.data ?? []) as any[],
        fellow: (fellowR as any).data ?? null,
      };
    },
  });
}

export default function BcbaMePage() {
  const identity = useBcbaIdentity();
  const creds = useCredentials(identity.employeeId);
  const growth = useGrowth(identity.scopedAuthUserId, identity.employeeId);

  const summary = useMemo(() => {
    const records = creds.data?.records ?? [];
    const buckets = { expired: 0, expiring_soon: 0, current: 0, unknown: 0 };
    for (const r of records) buckets[credentialBucket(r.expiration_date)]++;
    return buckets;
  }, [creds.data]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
      <BcbaPreviewBanner />
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Me</h1>
        <p className="text-sm text-muted-foreground mt-1">Credentials, growth, and preferences for {identity.displayName}.</p>
      </header>

      <BcbaMappingDiagnostic onRetry={() => { creds.refetch(); growth.refetch(); }} />

      {/* Credentials */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-primary" /> Credentials
          </CardTitle>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{summary.expired} expired</span>·
            <span>{summary.expiring_soon} expiring</span>·
            <span>{summary.current} current</span>
            <Button variant="ghost" size="sm" className="h-7" onClick={() => creds.refetch()} disabled={creds.isFetching}>
              <RefreshCw className={"h-3.5 w-3.5 " + (creds.isFetching ? "animate-spin" : "")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {creds.isLoading ? (
            <div className="space-y-2"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
          ) : creds.isError ? (
            <div className="text-sm text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Couldn't load credentials.
              <Button size="sm" variant="ghost" onClick={() => creds.refetch()}>Retry</Button>
            </div>
          ) : (creds.data?.providers.length ?? 0) === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-xs text-muted-foreground">
              No credentialing record on file. Ask the credentialing team to add your provider profile in{" "}
              <Link to="/admin/credentialing" className="underline">Admin → Credentialing</Link>.
            </div>
          ) : (
            <div className="space-y-4">
              {creds.data!.providers.map((p: any) => {
                const rows = creds.data!.records.filter((r: any) => r.provider_id === p.id);
                return (
                  <div key={p.id} className="rounded-xl border">
                    <div className="flex items-center justify-between p-3 border-b">
                      <div>
                        <div className="text-sm font-medium">{p.provider_name || identity.displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.provider_type ?? "BCBA"} · License {p.license_number ?? "—"} ({p.license_state ?? "—"}) · Expires {fmtDate(p.license_expiration_date)}
                        </div>
                      </div>
                      <Badge variant="outline" className={"text-[10px] " + BUCKET_TONE[credentialBucket(p.license_expiration_date)]}>
                        {BUCKET_LABEL[credentialBucket(p.license_expiration_date)]}
                      </Badge>
                    </div>
                    {rows.length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground">No payer credentialing records yet.</div>
                    ) : (
                      <ul className="divide-y">
                        {rows.map((r: any) => (
                          <li key={r.id} className="p-3 flex items-start justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{r.payer_name ?? "—"} <span className="text-muted-foreground font-normal">· {r.state ?? "—"}</span></div>
                              <div className="text-muted-foreground">
                                Status {r.status ?? "—"} · Effective {fmtDate(r.effective_date)} · Reattest {fmtDate(r.reattestation_due_date)}
                              </div>
                              {r.blocker_reason && <div className="text-rose-700 mt-0.5">Blocker: {r.blocker_reason}</div>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={"text-[10px] " + BUCKET_TONE[credentialBucket(r.expiration_date)]}>
                                {BUCKET_LABEL[credentialBucket(r.expiration_date)]}
                              </Badge>
                              <span className="text-muted-foreground">exp {fmtDate(r.expiration_date)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Source: credentialing_providers, credentialing_records
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Growth */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Growth
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => growth.refetch()} disabled={growth.isFetching}>
            <RefreshCw className={"h-3.5 w-3.5 " + (growth.isFetching ? "animate-spin" : "")} />
          </Button>
        </CardHeader>
        <CardContent>
          {growth.isLoading ? (
            <Skeleton className="h-20" />
          ) : growth.isError ? (
            <div className="text-sm text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Couldn't load growth data.
              <Button size="sm" variant="ghost" onClick={() => growth.refetch()}>Retry</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Fellowship */}
              <div className="rounded-xl border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Fellowship</div>
                {growth.data?.fellow ? (
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Stage:</span> {growth.data.fellow.stage_key ?? "—"} · <span className="text-muted-foreground">Readiness {growth.data.fellow.readiness_status ?? "—"}</span></div>
                    <div className="text-xs text-muted-foreground">
                      Coursework {growth.data.fellow.coursework_status ?? "—"} · Fieldwork {growth.data.fellow.fieldwork_status ?? "—"} · Supervision {growth.data.fellow.supervision_status ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Restricted {growth.data.fellow.restricted_hours ?? 0}h · Unrestricted {growth.data.fellow.unrestricted_hours ?? 0}h · Target {fmtDate(growth.data.fellow.target_completion_date)}
                    </div>
                    <div className="pt-1">
                      <Link to="/bcba/fellowship" className="text-xs text-primary inline-flex items-center gap-1">Open fellowship <ArrowRight className="h-3 w-3" /></Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Not enrolled in the fellowship program.</div>
                )}
              </div>

              {/* Academy */}
              <div className="rounded-xl border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">BCBA Academy</div>
                  <Link to="/bcba/academy" className="text-xs text-primary inline-flex items-center gap-1">Open academy <ArrowRight className="h-3 w-3" /></Link>
                </div>
                {(growth.data?.academy?.length ?? 0) === 0 ? (
                  <div className="text-xs text-muted-foreground">No academy activity yet.</div>
                ) : (
                  <ul className="text-xs divide-y">
                    {growth.data!.academy.slice(0, 6).map((a: any, i: number) => (
                      <li key={i} className="py-1.5 flex items-center justify-between gap-2">
                        <span className="truncate">{a.section_key}{a.is_required ? " ·" : ""}{a.is_required && <span className="text-muted-foreground"> required</span>}</span>
                        <span className="text-muted-foreground">{a.status ?? "—"} · {a.progress_pct ?? 0}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* HR trainings */}
              <div className="rounded-xl border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">HR trainings</div>
                {(growth.data?.trainings?.length ?? 0) === 0 ? (
                  <div className="text-xs text-muted-foreground">No assigned trainings.</div>
                ) : (
                  <ul className="text-xs divide-y">
                    {growth.data!.trainings.slice(0, 8).map((t: any) => (
                      <li key={t.id} className="py-1.5 flex items-center justify-between gap-2">
                        <span className="truncate">{t.course_id}</span>
                        <span className="text-muted-foreground">
                          {t.status ?? "—"} · due {fmtDate(t.due_date)}{t.completed_at && <> · done {fmtDate(t.completed_at)}</>}
                          {t.expires_on && <> · exp {fmtDate(t.expires_on)}</>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences link */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Preferences</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Notification preferences, quiet hours, and channel routing.</span>
          <Button asChild size="sm" variant="outline">
            <Link to="/bcba/settings/notifications">Open preferences <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}