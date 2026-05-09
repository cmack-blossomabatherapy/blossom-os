import { useParams, Link } from "react-router-dom";
import { MapPin, ArrowLeft } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/intelligence/ScoreRing";
import { stateMetrics, expiringCertifications } from "@/data/blossomIntelligence";

export default function StateDashboardDetail() {
  const { id } = useParams();
  const s = stateMetrics.find((x) => x.id === id);
  if (!s) return <GlassPageShell title="Not found" description=""><Link to="/intelligence/states" className="text-sm text-primary">← Back</Link></GlassPageShell>;
  const certs = expiringCertifications.filter((c) => c.state === s.state);
  return (
    <GlassPageShell eyebrow={s.type} eyebrowIcon={MapPin} title={s.name}
      description={`${s.employees} employees · ${s.alerts} alerts`}
      actions={<Link to="/intelligence/states"><Button size="sm" variant="outline"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[["Onboarding", s.onboarding], ["Compliance", s.compliance], ["Training", s.training]].map(([l, v]) => (
          <Card key={l as string} className="p-5 flex flex-col items-center"><ScoreRing value={v as number} label={l as string} /></Card>
        ))}
      </div>
      <Card className="mt-4 p-5">
        <h3 className="mb-3 text-sm font-semibold">Expiring certifications in {s.state}</h3>
        {certs.length === 0 ? <p className="text-sm text-muted-foreground">None expiring.</p> : (
          <ul className="space-y-2">
            {certs.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                <span className="text-sm font-medium">{c.employee} · <span className="text-muted-foreground">{c.item}</span></span>
                <Badge variant="outline" className="text-[10px]">{c.expires}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </GlassPageShell>
  );
}
