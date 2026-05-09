import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { ReadinessGauge, Sparkline, TrendChip } from "@/components/enterprise/EnterpriseShared";
import {
  readinessScore,
  readinessDelta,
  readinessTrend,
  readinessFactors,
  complianceItems,
} from "@/data/blossomEnterprise";
import { useAuth } from "@/contexts/AuthContext";
import { ANALYTICS_ROLES } from "@/lib/navigationAccess";

export function ReadinessCard() {
  const { roles } = useAuth();
  const allowed = roles.some((r) => ANALYTICS_ROLES.includes(r as never));
  if (!allowed) return null;

  const trend = readinessDelta > 0 ? "up" : readinessDelta < 0 ? "down" : "flat";
  const topFactors = [...readinessFactors].sort((a, b) => a.score - b.score).slice(0, 3);
  const overdue = complianceItems.filter((c) => c.status === "Overdue").length;
  const dueSoon = complianceItems.filter((c) => c.status === "Due Soon").length;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Workforce Readiness
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Composite score across onboarding, compliance, competency, and engagement.
          </p>
        </div>
        <Link
          to="/enterprise/readiness"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Open <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <ReadinessGauge value={readinessScore} label="Composite" />
          <TrendChip trend={trend} delta={readinessDelta} />
          <Sparkline data={readinessTrend} height={36} />
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/enterprise/compliance"
              className="rounded-lg border border-border/60 bg-background/40 p-3 transition hover:border-primary/40"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                <AlertTriangle className="h-3 w-3" /> Overdue
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">{overdue}</div>
              <div className="text-[11px] text-muted-foreground">compliance items</div>
            </Link>
            <Link
              to="/enterprise/compliance"
              className="rounded-lg border border-border/60 bg-background/40 p-3 transition hover:border-primary/40"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-warning">
                Due Soon
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">{dueSoon}</div>
              <div className="text-[11px] text-muted-foreground">within 30 days</div>
            </Link>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Lowest factors
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {topFactors.map((f) => (
                <li key={f.key} className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${f.score}%` }}
                    />
                  </div>
                  <span className="w-40 truncate text-foreground">{f.label}</span>
                  <span className="w-8 text-right font-semibold tabular-nums text-muted-foreground">
                    {f.score}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}