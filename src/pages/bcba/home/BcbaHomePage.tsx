import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, Clock, HeartPulse, ShieldAlert, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { REASON_LABELS, type ActionItem, type EscalationLevel } from "./priority";
import { useBcbaHomeDataFor } from "./useBcbaHomeData";
import { useBcbaIdentity } from "../useBcbaIdentity";
import { BcbaMappingDiagnostic } from "../BcbaMappingDiagnostic";

/* -------------------------------------------------------------------------- */

function escalationTone(level: EscalationLevel) {
  switch (level) {
    case "critical":  return "bg-red-100 text-red-800 border-red-200";
    case "urgent":    return "bg-orange-100 text-orange-800 border-orange-200";
    case "attention": return "bg-amber-100 text-amber-800 border-amber-200";
    default:          return "bg-muted text-muted-foreground border-border";
  }
}

function Stat({ label, value, tone, unavailableHint }: {
  label: string;
  value: number | string | null;
  tone?: string;
  unavailableHint?: string;
}) {
  if (value === null) {
    return (
      <div className="rounded-xl border bg-card/60 backdrop-blur-sm px-4 py-3" title={unavailableHint}>
        <div className="text-2xl font-semibold text-muted-foreground">—</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
        {unavailableHint && (
          <div className="text-[10px] text-muted-foreground/80 mt-0.5">{unavailableHint}</div>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card/60 backdrop-blur-sm px-4 py-3">
      <div className={`text-2xl font-semibold ${tone ?? ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Icon className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Action Item row                                                            */
/* -------------------------------------------------------------------------- */

function ActionRow({ item }: { item: ActionItem }) {
  const body = (
    <div className="group flex items-start justify-between gap-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 px-3 py-2.5 transition">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${escalationTone(item.escalation)}`}>
            {item.escalation}
          </span>
          <div className="text-sm font-medium truncate">{item.title}</div>
        </div>
        {item.clientName && (
          <div className="text-xs text-muted-foreground mt-0.5">{item.clientName}</div>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.reasons.slice(0, 4).map((r) => (
            <Badge key={r} variant="secondary" className="text-[10px] font-normal">
              {REASON_LABELS[r]}
            </Badge>
          ))}
        </div>
        {item.explanations.length > 0 && (
          <div className="text-[11px] text-muted-foreground mt-1.5 truncate">
            {item.explanations.join(" · ")}
          </div>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition" />
    </div>
  );
  return item.deepLink ? <Link to={item.deepLink}>{body}</Link> : body;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function BcbaHomePage() {
  const isMobile = useIsMobile();
  const identity = useBcbaIdentity();
  const { data, isLoading, error, refetch } = useBcbaHomeDataFor(identity.scopedAuthUserId);

  if (identity.mappingMissing) {
    return (
      <div className="mx-auto w-full max-w-6xl px-2 md:px-4 py-6 space-y-4">
        <BcbaMappingDiagnostic onRetry={() => refetch()} />
      </div>
    );
  }

  if (identity.loading || (isLoading && identity.scopedAuthUserId)) {
    return (
      <div className="mx-auto w-full max-w-6xl px-2 md:px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-56" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-2 md:px-4 py-6">
        <BcbaMappingDiagnostic onRetry={() => refetch()} />
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          Couldn't load your home dashboard. Please refresh.
        </CardContent></Card>
      </div>
    );
  }

  const { today, queue, caseload, rbtTeam, month, support } = data;

  return (
    <div className="mx-auto w-full max-w-6xl px-2 md:px-4 py-4 md:py-8 space-y-5">
      <div>
        <h1 className={isMobile ? "text-2xl font-semibold tracking-tight" : "text-3xl font-semibold tracking-tight"}>
          Good to see you
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Prioritized by what matters — every item shows why it's here.
        </p>
      </div>

      {/* Two-column layout on desktop */}
      <div className={isMobile ? "space-y-5" : "grid grid-cols-1 lg:grid-cols-3 gap-5"}>
        {/* Left column: Today + Queue */}
        <div className="lg:col-span-2 space-y-5">
          {/* A. Today */}
          <SectionCard icon={Calendar} title="Today" subtitle={today.length === 0 ? "Nothing scheduled" : `${today.length} on your plate`}>
            {today.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                You're clear for the day. Focus on your queue.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {today.slice(0, 8).map((e) => (
                  <div key={e.id} className="py-2 flex items-center gap-3">
                    <div className="text-xs text-muted-foreground w-16 shrink-0">
                      {e.time ? new Date(e.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{e.title}</div>
                      {e.clientName && <div className="text-xs text-muted-foreground">{e.clientName}</div>}
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{e.kind.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* B. Next Best Actions */}
          <SectionCard
            icon={Sparkles}
            title="Next best actions"
            subtitle={queue.length === 0 ? "You're caught up" : `${queue.length} ranked by urgency + reason`}
          >
            {queue.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                All clear — no priority actions.
              </div>
            ) : (
              <div className="space-y-1">
                {queue.slice(0, isMobile ? 6 : 10).map((it) => (
                  <ActionRow key={it.sourceId} item={it} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column: health snapshots */}
        <div className="space-y-5">
          {/* C. Caseload health */}
          <SectionCard icon={HeartPulse} title="Caseload health" subtitle={`${caseload.total} client${caseload.total === 1 ? "" : "s"}`}>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="On track" value={caseload.onTrack} tone="text-emerald-600" />
              <Stat label="Attention" value={caseload.attentionNeeded} tone="text-amber-600" />
              <Stat label="Auth risk" value={caseload.authorizationRisk} tone={caseload.authorizationRisk ? "text-orange-600" : ""} />
              <Stat label="Doc risk" value={caseload.documentationRisk} />
              <Stat label="Parent training" value={caseload.parentTrainingConcern} />
              <Stat label="Staffing risk" value={caseload.staffingRisk} unavailableHint="Needs staffing feed" />
            </div>
          </SectionCard>

          {/* D. My RBT team */}
          <SectionCard icon={Users} title="My RBT team" subtitle={`${rbtTeam.total} RBT${rbtTeam.total === 1 ? "" : "s"}`}>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="On track" value={rbtTeam.onTrack} tone="text-emerald-600" />
              <Stat label="Need supervision" value={rbtTeam.needSupervision} tone={rbtTeam.needSupervision ? "text-amber-600" : ""} />
              <Stat label="New to case" value={rbtTeam.newToCase} unavailableHint="Needs first-case tracker" />
              <Stat label="Requested support" value={rbtTeam.requestedSupport} unavailableHint="Needs support-ticket feed" />
            </div>
          </SectionCard>

          {/* E. My month */}
          <SectionCard icon={Clock} title="My month">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Clinical hours" value={month.clinicalHours} />
              <Stat label="Supervision" value={month.supervision} />
              <Stat label="Parent training" value={month.parentTraining} />
              <Stat label="QA returns" value={month.qaReturns} />
              <Stat label="Doc timeliness" value={`${month.documentationTimelinessPct}%`}
                    tone={month.documentationTimelinessPct >= 90 ? "text-emerald-600" : "text-amber-600"} />
              <Stat label="Open risks" value={month.openRisks} />
              <Stat label="Assessments" value={month.assessments} unavailableHint="Needs assessment feed" />
              <Stat label="Reports submitted" value={month.reportsSubmitted} unavailableHint="Needs reports feed" />
            </div>
            {month.filledFromCanonical && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Hours filled from CentralReach billing (no clinical logs recorded in Blossom OS this month).
              </p>
            )}
          </SectionCard>

          {/* F. Support & alerts */}
          <SectionCard icon={ShieldAlert} title="Support & alerts">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Open tickets" value={support.openTickets} />
              <Stat label="Urgent" value={support.urgentIssues} tone={support.urgentIssues ? "text-red-600" : ""} />
              <Stat label="Credential" value={support.credentialAlerts} />
              <Stat label="System" value={support.systemAlerts} />
            </div>
            {support.freshness.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Data freshness</div>
                <div className="space-y-1">
                  {support.freshness.slice(0, 4).map((f) => (
                    <div key={f.key} className="flex items-center justify-between text-xs">
                      <span className="capitalize truncate">{f.label}</span>
                      <span className={f.isStale ? "text-amber-600 flex items-center gap-1" : "text-muted-foreground"}>
                        {f.isStale && <AlertTriangle className="h-3 w-3" />}
                        {f.minutesSinceSync != null ? `${f.minutesSinceSync}m` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}