import { useParams, Link } from "react-router-dom";
import { Building2, ArrowLeft } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/intelligence/ScoreRing";
import { TrendLine } from "@/components/intelligence/TrendLine";
import { Heatmap } from "@/components/intelligence/Heatmap";
import { departmentReadiness, competencyAreas, completionTrend } from "@/data/blossomIntelligence";

export default function DepartmentAnalyticsDetail() {
  const { id } = useParams();
  const dept = departmentReadiness.find((d) => d.department.toLowerCase() === id?.toLowerCase());
  if (!dept) return <GlassPageShell title="Not found" description=""><Link to="/intelligence/departments" className="text-sm text-primary">← Back</Link></GlassPageShell>;
  return (
    <GlassPageShell eyebrow="Department Analytics" eyebrowIcon={Building2} title={dept.department}
      description="Readiness, competency breakdown, compliance, training engagement."
      actions={<Link to="/intelligence/departments"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 flex items-center justify-center"><ScoreRing value={dept.overall} label="Department readiness" size={140} /></Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Completion trend</h3>
          <TrendLine values={completionTrend.slice(0, 10)} height={140} />
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <h3 className="mb-3 text-sm font-semibold">Competency breakdown</h3>
        <Heatmap rows={[{ label: dept.department, values: dept.competencies }]} columns={competencyAreas} />
      </Card>
      <Card className="mt-4 p-5">
        <h3 className="mb-3 text-sm font-semibold">Recent activity</h3>
        <ul className="text-sm space-y-2 text-muted-foreground">
          <li>· Sarah completed HIPAA Foundations</li>
          <li>· Marcus enrolled in Authorizations Academy</li>
          <li>· Department review meeting completed</li>
          <li>· New SOP published</li>
        </ul>
      </Card>
    </GlassPageShell>
  );
}
