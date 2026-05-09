import { ShieldCheck, Download, FileText } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/intelligence/ScoreRing";
import { TrendLine } from "@/components/intelligence/TrendLine";
import { FilterBar } from "@/components/intelligence/FilterBar";
import { complianceByState, expiringCertifications, complianceTrend, atRiskEmployees } from "@/data/blossomIntelligence";

export default function ComplianceIntelligence() {
  const orgScore = Math.round(complianceByState.reduce((a, s) => a + s.score, 0) / complianceByState.length);
  return (
    <GlassPageShell eyebrow="Compliance Intelligence" eyebrowIcon={ShieldCheck}
      title="Compliance oversight"
      description="Org compliance, expiring certifications, at-risk employees, and audit readiness."
      actions={<>
        <Button size="sm" variant="outline"><Download className="h-4 w-4" /> Export CSV</Button>
        <Button size="sm" variant="outline"><FileText className="h-4 w-4" /> Export PDF</Button>
      </>}>
      <FilterBar />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 flex flex-col items-center justify-center">
          <ScoreRing value={orgScore} label="Org compliance score" size={140} />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Compliance by state</h3>
          <div className="space-y-3">
            {complianceByState.map((s) => (
              <div key={s.state}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{s.state}</span>
                  <span className="text-muted-foreground">{s.score}% · {s.employees} emp</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Compliance trend (6 months)</h3>
          <TrendLine values={complianceTrend} height={140} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">At-risk employees</h3>
          <ul className="space-y-2">
            {atRiskEmployees.map((e) => {
              const tone = e.severity === "high" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning";
              return (
                <li key={e.name} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{e.name}</p>
                    <p className="text-[10px] text-muted-foreground">{e.department} · {e.risk}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}>{e.severity}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 p-5 overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold">Expiring certifications & missing requirements</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground"><tr><th className="text-left py-2">Employee</th><th className="text-left">Item</th><th className="text-left hidden sm:table-cell">State</th><th className="text-left">Expires</th><th className="text-left">Status</th></tr></thead>
          <tbody>
            {expiringCertifications.map((c) => {
              const tone = c.status === "Expired" || c.status === "Missing" ? "bg-destructive/15 text-destructive" : c.status === "Expiring" ? "bg-warning/15 text-warning" : "bg-success/15 text-success";
              return (
                <tr key={c.id} className="border-t border-border/40">
                  <td className="py-2 font-medium">{c.employee}</td>
                  <td className="py-2">{c.item}</td>
                  <td className="py-2 hidden sm:table-cell">{c.state}</td>
                  <td className="py-2">{c.expires}</td>
                  <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}>{c.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </GlassPageShell>
  );
}
