import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/intelligence/ScoreRing";
import { stateMetrics } from "@/data/blossomIntelligence";

export default function StateDashboards() {
  const states = stateMetrics.filter((s) => s.type === "State");
  const clinics = stateMetrics.filter((s) => s.type === "Clinic");
  return (
    <GlassPageShell eyebrow="State & Location" eyebrowIcon={MapPin}
      title="State and clinic visibility" description="Operational visibility across every state and clinic.">
      {[{ title: "States", items: states }, { title: "Clinics", items: clinics }].map((g) => (
        <section key={g.title} className="space-y-3 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((s) => (
              <Link key={s.id} to={`/intelligence/states/${s.id}`}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{s.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{s.employees} employees</p>
                  </div>
                  {s.alerts > 0 && <Badge variant="destructive" className="text-[10px]">{s.alerts} alerts</Badge>}
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <ScoreRing value={s.compliance} size={64} />
                  <div className="text-xs space-y-1">
                    <div className="text-muted-foreground">Onboarding · <span className="text-foreground font-semibold">{s.onboarding}%</span></div>
                    <div className="text-muted-foreground">Compliance · <span className="text-foreground font-semibold">{s.compliance}%</span></div>
                    <div className="text-muted-foreground">Training · <span className="text-foreground font-semibold">{s.training}%</span></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </GlassPageShell>
  );
}
