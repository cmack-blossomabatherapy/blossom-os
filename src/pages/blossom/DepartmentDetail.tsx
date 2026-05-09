import { useParams, Link } from "react-router-dom";
import { Building2, ArrowLeft, BookOpen, FileText, Folder, BarChart3, Calendar, Cog, Link2 } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { blossomDepartments, blossomUsers } from "@/data/blossomOS";

export default function DepartmentDetail() {
  const { id } = useParams();
  const dept = blossomDepartments.find((d) => d.id === id);
  if (!dept) {
    return (
      <GlassPageShell title="Department not found" description="">
        <Link to="/blossom/departments" className="text-sm text-primary">← Back to Departments</Link>
      </GlassPageShell>
    );
  }
  const team = blossomUsers.filter((u) => u.department.toLowerCase() === dept.name.toLowerCase()).slice(0, 6);

  return (
    <GlassPageShell
      eyebrow="Department"
      eyebrowIcon={Building2}
      title={dept.name}
      description={dept.description}
      actions={<Link to="/blossom/departments"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />KPIs</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["Members", dept.memberCount], ["Trainings", dept.trainings], ["Resources", dept.resources]].map(([l, v]) => (
                <div key={l as string} className="rounded-xl bg-muted/40 p-3">
                  <div className="text-2xl font-semibold">{v}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Live KPI metrics coming in Phase 2.</p>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Related trainings</h3>
            <ul className="space-y-2 text-sm">
              <li>· {dept.name} Onboarding</li>
              <li>· {dept.name} Standards & SOPs</li>
              <li>· {dept.name} Tools & Systems</li>
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Related SOPs & resources</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
              <span>· {dept.name} SOP Library</span>
              <span>· Daily checklists</span>
              <span>· Phone scripts</span>
              <span>· Templates</span>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Meetings</h3>
            <p className="text-xs text-muted-foreground">Weekly L10 cadence · Monthly review · Quarterly planning</p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Department owner</h3>
            <p className="text-sm font-medium">{dept.owner}</p>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Team members</h3>
            {team.length === 0 ? (
              <p className="text-xs text-muted-foreground">Team list coming soon.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {team.map((m) => <li key={m.id}>· {m.name} <span className="text-muted-foreground">({m.role})</span></li>)}
              </ul>
            )}
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Cog className="h-4 w-4 text-primary" />Systems used</h3>
            <div className="flex flex-wrap gap-1.5">
              {dept.systems.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" />Helpful links</h3>
            <ul className="space-y-1.5 text-xs text-primary">
              <li><Link to="/resources">Resource Hub</Link></li>
              <li><Link to="/training">Blossom Training</Link></li>
              <li><Link to="/blossom/academy">Operations Academy</Link></li>
            </ul>
          </Card>
        </div>
      </div>
    </GlassPageShell>
  );
}
