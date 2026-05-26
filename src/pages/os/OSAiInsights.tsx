import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain, AlertTriangle, CalendarClock, Users, FileCheck2, TrendingDown,
  Sparkles, ArrowRight,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOSRole } from "@/contexts/OSRoleContext";

type Insight = {
  id: string;
  severity: "crit" | "warn" | "info";
  title: string;
  detail: string;
  metric: string;
  cta: { label: string; to: string };
  icon: typeof Brain;
};

const sevTone = {
  crit: "bg-destructive/10 text-destructive ring-destructive/20",
  warn: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
  info: "bg-blue-500/10 text-blue-700 ring-blue-500/20",
} as const;

function days(date: string | null) {
  if (!date) return null;
  return Math.floor((new Date(date).getTime() - Date.now()) / 86400000);
}

export default function OSAiInsights() {
  const { activeState } = useOSRole();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  async function compute() {
    setLoading(true);
    const [clientsRes, authsRes, leadsRes, employeesRes] = await Promise.all([
      supabase.from("clients").select("id,state,bcba,rbt,staffing_status,qa_status,next_task_due,blockers,stage").limit(1500),
      supabase.from("client_authorizations").select("client_id,status,expiration_date,state").limit(2000),
      supabase.from("intake_leads").select("id,state,status,created_at,stage").limit(1500),
      supabase.from("employees").select("id,state,status,next_review_date").eq("status", "active").limit(1500),
    ]);

    const scope = (s: string | null | undefined) => !activeState || s === activeState;
    const clients = (clientsRes.data ?? []).filter((c) => scope(c.state) && c.stage === "Active");
    const auths = (authsRes.data ?? []).filter((a) => scope(a.state));
    const leads = (leadsRes.data ?? []).filter((l) => scope(l.state));
    const employees = (employeesRes.data ?? []).filter((e) => scope(e.state));

    const results: Insight[] = [];

    const expiredAuths = auths.filter((a) => {
      const d = days(a.expiration_date);
      return d !== null && d < 0;
    });
    if (expiredAuths.length > 0) {
      results.push({
        id: "auths-expired",
        severity: "crit",
        title: "Authorizations have expired",
        detail: `${expiredAuths.length} active authorization${expiredAuths.length > 1 ? "s have" : " has"} passed expiration. Sessions may be unbillable until renewed.`,
        metric: `${expiredAuths.length}`,
        cta: { label: "Open Authorizations", to: "/authorizations" },
        icon: FileCheck2,
      });
    }

    const expiringAuths = auths.filter((a) => {
      const d = days(a.expiration_date);
      return d !== null && d >= 0 && d <= 30;
    });
    if (expiringAuths.length > 0) {
      results.push({
        id: "auths-expiring",
        severity: "warn",
        title: "Authorizations expiring within 30 days",
        detail: `Submit re-auth packets now to avoid coverage gaps. ${expiringAuths.length} client${expiringAuths.length > 1 ? "s are" : " is"} affected.`,
        metric: `${expiringAuths.length}`,
        cta: { label: "Review re-auth queue", to: "/authorizations" },
        icon: CalendarClock,
      });
    }

    const noRbt = clients.filter((c) => !c.rbt || c.staffing_status === "Open");
    if (noRbt.length > 0) {
      results.push({
        id: "staffing-gap",
        severity: noRbt.length > 10 ? "crit" : "warn",
        title: "Active clients without RBT coverage",
        detail: `${noRbt.length} active client${noRbt.length > 1 ? "s lack" : " lacks"} an assigned RBT or have open staffing requests. Coordinate with the scheduling team.`,
        metric: `${noRbt.length}`,
        cta: { label: "Open scheduling", to: "/scheduling" },
        icon: Users,
      });
    }

    const qaFlagged = clients.filter((c) => c.qa_status === "Flagged" || c.qa_status === "Needs Review");
    if (qaFlagged.length > 0) {
      results.push({
        id: "qa-flagged",
        severity: "warn",
        title: "Clients flagged by QA",
        detail: `${qaFlagged.length} active case${qaFlagged.length > 1 ? "s have" : " has"} an open QA flag. Address before next supervision cycle.`,
        metric: `${qaFlagged.length}`,
        cta: { label: "Open Case Management", to: "/cases" },
        icon: AlertTriangle,
      });
    }

    const stalledLeads = leads.filter((l) => {
      const created = days(l.created_at);
      const isOpen = l.status !== "converted" && l.status !== "lost" && l.status !== "closed";
      return isOpen && created !== null && created < -14;
    });
    if (stalledLeads.length > 0) {
      results.push({
        id: "leads-stalled",
        severity: "warn",
        title: "Leads stalled over 14 days",
        detail: `${stalledLeads.length} intake lead${stalledLeads.length > 1 ? "s have" : " has"} sat untouched for more than 2 weeks. Conversion likelihood drops sharply after this point.`,
        metric: `${stalledLeads.length}`,
        cta: { label: "Review leads", to: "/leads" },
        icon: TrendingDown,
      });
    }

    const overdueReviews = employees.filter((e) => {
      const d = days(e.next_review_date);
      return d !== null && d < 0;
    });
    if (overdueReviews.length > 0) {
      results.push({
        id: "reviews-overdue",
        severity: "warn",
        title: "Staff evaluations overdue",
        detail: `${overdueReviews.length} active staff member${overdueReviews.length > 1 ? "s are" : " is"} past due for a performance review.`,
        metric: `${overdueReviews.length}`,
        cta: { label: "Open Evaluations", to: "/evaluations" },
        icon: Users,
      });
    }

    setInsights(results);
    setGeneratedAt(new Date());
    setLoading(false);
  }

  useEffect(() => { compute(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeState]);

  const counts = useMemo(() => ({
    crit: insights.filter((i) => i.severity === "crit").length,
    warn: insights.filter((i) => i.severity === "warn").length,
    total: insights.length,
  }), [insights]);

  return (
    <OSShell>
      <header className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(220_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[hsl(265_70%_70%/0.25)] blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="rounded-full bg-white/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_45%)]">
              State Director · {activeState}
            </Badge>
            <h1 className="mt-3 flex items-center gap-2 text-[28px] font-semibold tracking-tight md:text-[32px]">
              <Brain className="h-7 w-7 text-[hsl(265_70%_55%)]" /> AI Insights
            </h1>
            <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
              Operational recommendations generated from live Blossom data — re-computed every time you load this page.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button size="sm" variant="outline" onClick={compute} className="border-white/70 bg-white/70 backdrop-blur">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Re-analyze
            </Button>
            {generatedAt && (
              <span className="text-[11px] text-muted-foreground">Last run {generatedAt.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-3 gap-3">
        <Kpi label="Critical signals" value={counts.crit} tone="crit" />
        <Kpi label="Watch signals" value={counts.warn} tone="warn" />
        <Kpi label="Total insights" value={counts.total} />
      </section>

      <section className="mt-6 space-y-3">
        {loading && (
          <div className="rounded-2xl border border-foreground/[0.06] bg-white/60 p-8 text-center text-muted-foreground">
            Analyzing operational data…
          </div>
        )}
        {!loading && insights.length === 0 && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-emerald-600" />
            <p className="mt-2 text-[14px] font-semibold">All clear in {activeState}.</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">No critical or watch signals detected in current operational data.</p>
          </div>
        )}
        {!loading && insights.map((i) => (
          <article key={i.id} className="rounded-2xl border border-foreground/[0.06] bg-white/70 p-5 backdrop-blur">
            <div className="flex items-start gap-4">
              <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1", sevTone[i.severity])}>
                <i.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15px] font-semibold tracking-tight">{i.title}</h3>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1", sevTone[i.severity])}>
                    {i.severity === "crit" ? "Critical" : i.severity === "warn" ? "Watch" : "Info"}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">{i.detail}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[24px] font-semibold tabular-nums">{i.metric}</span>
                  <Button asChild size="sm" variant="outline" className="border-foreground/10 bg-white/70 backdrop-blur">
                    <Link to={i.cta.to}>{i.cta.label} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </OSShell>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "crit" | "warn" }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className={cn(
        "mt-1.5 text-[24px] font-semibold tabular-nums",
        tone === "crit" ? "text-destructive" : tone === "warn" ? "text-amber-700" : "",
      )}>{value}</div>
    </div>
  );
}