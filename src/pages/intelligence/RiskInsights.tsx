import { AlertTriangle } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { InsightCard } from "@/components/intelligence/InsightCard";
import { riskInsights } from "@/data/blossomIntelligence";

export default function RiskInsights() {
  return (
    <GlassPageShell eyebrow="Risk & Insights" eyebrowIcon={AlertTriangle}
      title="Predictive insights" description="Where attention is needed before issues escalate.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {riskInsights.map((r) => <InsightCard key={r.id} insight={r} />)}
      </div>
    </GlassPageShell>
  );
}
