import { useState } from "react";
import { FileBarChart, Download, Mail, Save, Printer } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FilterBar } from "@/components/intelligence/FilterBar";
import { TrendLine } from "@/components/intelligence/TrendLine";
import { reportTemplates, availableMetrics, completionTrend } from "@/data/blossomIntelligence";
import { cn } from "@/lib/utils";

export default function ReportBuilder() {
  const [picked, setPicked] = useState<Set<string>>(new Set(["completion_by_dept", "compliance_pct"]));
  const [name, setName] = useState("Untitled Report");
  const toggle = (m: string) => setPicked((p) => { const n = new Set(p); n.has(m) ? n.delete(m) : n.add(m); return n; });
  return (
    <GlassPageShell eyebrow="Report Builder" eyebrowIcon={FileBarChart}
      title="Build your own report" description="Pick metrics, apply filters, preview — then save, export, or email."
      actions={<>
        <Button size="sm" variant="outline"><Save className="h-4 w-4" /> Save Template</Button>
        <Button size="sm" variant="outline"><Download className="h-4 w-4" /> CSV</Button>
        <Button size="sm" variant="outline"><Printer className="h-4 w-4" /> PDF</Button>
        <Button size="sm" variant="outline"><Mail className="h-4 w-4" /> Email</Button>
      </>}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Report name</p>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Metrics</p>
            <div className="flex flex-wrap gap-1.5">
              {availableMetrics.map((m) => (
                <button key={m} onClick={() => toggle(m)}
                  className={cn("rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
                    picked.has(m) ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40")}>
                  {m.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Templates</p>
            <ul className="space-y-1.5">
              {reportTemplates.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setPicked(new Set(t.metrics))}
                    className="w-full text-left rounded-lg border border-border/50 px-3 py-2 text-xs hover:border-primary/40 hover:bg-muted/30">
                    <p className="font-medium text-foreground">{t.title}</p>
                    <p className="text-muted-foreground line-clamp-1">{t.description}</p>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <FilterBar showRole />
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{name}</h3>
              <div className="flex flex-wrap gap-1">{[...picked].map((m) => <Badge key={m} variant="outline" className="text-[10px]">{m.replace(/_/g, " ")}</Badge>)}</div>
            </div>
            <TrendLine values={completionTrend} />
          </Card>
          <Card className="p-5 overflow-x-auto">
            <h3 className="mb-3 text-sm font-semibold">Preview data</h3>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr><th className="text-left py-2">Department</th>{[...picked].slice(0, 3).map((m) => <th key={m} className="text-center">{m.replace(/_/g, " ")}</th>)}</tr></thead>
              <tbody>
                {["Intake", "Authorizations", "QA", "Staffing", "HR"].map((d) => (
                  <tr key={d} className="border-t border-border/40">
                    <td className="py-2 font-medium">{d}</td>
                    {[...picked].slice(0, 3).map((m) => <td key={m} className="text-center">{Math.round(60 + Math.random() * 35)}%</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </GlassPageShell>
  );
}
