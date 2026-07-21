import { Link } from "react-router-dom";
import { Activity, ShieldAlert, Radio, Layers, AlertTriangle, HelpCircle, Bug, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useIntakeReviewStats,
  useProviderReadiness,
  classifyProviderReadiness,
  DISABLED_PROVIDER_KEYS,
} from "@/lib/intake/reviewDataLayer";

/**
 * Canonical Intake system-health strip for the Intake dashboard. Reads
 * only intake_review_stats() and intake_provider_readiness() through
 * the review data layer. No local derivations, no demo values.
 */
export function IntakeSystemHealthPanel() {
  const stats = useIntakeReviewStats();
  const providers = useProviderReadiness();

  const staged = stats.data?.promotion_states?.staged ?? 0;
  const ambiguous = stats.data?.promotion_states?.ambiguous_review ?? 0;
  const incomplete = stats.data?.promotion_states?.incomplete_review ?? 0;
  const errors = stats.data?.promotion_states?.error ?? 0;
  const unmatchedTracking = stats.data?.ctm_unmatched_tracking_numbers ?? 0;
  const mode = stats.data?.operating_mode ?? null;

  const inboundProviders = (providers.data ?? []).filter(
    (p) => !DISABLED_PROVIDER_KEYS.has(p.integration_id?.toLowerCase() ?? ""),
  );
  const disabledProviders = (providers.data ?? []).filter((p) =>
    DISABLED_PROVIDER_KEYS.has(p.integration_id?.toLowerCase() ?? ""),
  );

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4 space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center h-8 w-8 rounded-xl bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Intake system health</h2>
            <p className="text-[11px] text-muted-foreground">
              Canonical review counts and inbound provider status. Read-only.
            </p>
          </div>
        </div>
        {mode === "INGEST_ONLY" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            <ShieldAlert className="h-3 w-3" /> INGEST_ONLY — outbound actions blocked
          </span>
        )}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <ReviewTile icon={Layers} label="Lead Captured (unreviewed)" value={staged} to="/intake/review-queues" loading={stats.isLoading} error={!!stats.error} />
        <ReviewTile icon={HelpCircle} label="Incomplete promotion" value={incomplete} to="/intake/review-queues" loading={stats.isLoading} error={!!stats.error} />
        <ReviewTile icon={AlertTriangle} label="Ambiguous duplicate" value={ambiguous} to="/intake/review-queues" loading={stats.isLoading} error={!!stats.error} />
        <ReviewTile icon={Bug} label="Ingestion error" value={errors} to="/intake/review-queues" loading={stats.isLoading} error={!!stats.error} tone={errors > 0 ? "rose" : undefined} />
        <ReviewTile icon={PhoneOff} label="Unmatched CTM tracking #" value={unmatchedTracking} to="/intake/review-queues" loading={stats.isLoading} error={!!stats.error} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
          <Radio className="h-3.5 w-3.5" /> Inbound providers
        </div>
        {providers.isLoading ? (
          <div className="text-xs text-muted-foreground">Loading provider readiness…</div>
        ) : providers.error ? (
          <div className="text-xs text-destructive">Failed to load provider readiness.</div>
        ) : inboundProviders.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            No inbound providers registered yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {inboundProviders.map((p) => {
              const c = classifyProviderReadiness(p);
              return (
                <div key={p.integration_id} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px]">
                  <span className={cn("h-1.5 w-1.5 rounded-full",
                    c.label === "connected" ? "bg-emerald-500"
                    : c.label === "stale" ? "bg-amber-500"
                    : c.label === "error" ? "bg-destructive"
                    : "bg-slate-400",
                  )} />
                  <span className="font-medium">{p.display_name ?? p.integration_id}</span>
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="text-muted-foreground/80">· {c.detail}</span>
                </div>
              );
            })}
            {disabledProviders.map((p) => (
              <div key={p.integration_id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="font-medium">{p.display_name ?? p.integration_id}</span>
                <span>handoff-only</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewTile({
  icon: Icon, label, value, to, loading, error, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  to: string;
  loading: boolean;
  error: boolean;
  tone?: "rose";
}) {
  return (
    <Link
      to={to}
      className={cn(
        "rounded-xl border border-border/60 bg-background p-3 hover:bg-muted/40 transition-colors",
        tone === "rose" && "border-rose-300/60 bg-rose-50/40",
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className={cn("h-4 w-4", tone === "rose" ? "text-rose-600" : "text-muted-foreground")} />
        <span className={cn("text-lg font-semibold tabular-nums", tone === "rose" && "text-rose-700")}>
          {loading ? "…" : error ? "!" : value.toLocaleString()}
        </span>
      </div>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground line-clamp-2">{label}</p>
    </Link>
  );
}