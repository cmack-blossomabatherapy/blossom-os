import { useMemo, useState } from "react";
import { ShieldCheck, Download, FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatChip, SeverityDot, Section } from "@/components/enterprise/EnterpriseShared";
import { complianceItems, auditPackets, type ComplianceItem } from "@/data/blossomEnterprise";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<ComplianceItem["status"], string> = {
  "On Track": "bg-success/10 text-success border-success/30",
  "Due Soon": "bg-warning/10 text-warning border-warning/30",
  "Overdue": "bg-destructive/10 text-destructive border-destructive/30",
  "Complete": "bg-muted/40 text-muted-foreground border-border",
};

export default function Compliance() {
  const [tab, setTab] = useState<"all" | ComplianceItem["category"]>("all");
  const filtered = useMemo(() => tab === "all" ? complianceItems : complianceItems.filter(c => c.category === tab), [tab]);

  const overdue = complianceItems.filter(c => c.status === "Overdue").length;
  const dueSoon = complianceItems.filter(c => c.status === "Due Soon").length;
  const onTrack = complianceItems.filter(c => c.status === "On Track").length;
  const complete = complianceItems.filter(c => c.status === "Complete").length;

  return (
    <GlassPageShell
      eyebrow="Enterprise"
      eyebrowIcon={ShieldCheck}
      title="Compliance & Audit Center"
      description="Audit-readiness in one place — certifications, policy acknowledgements, signature queues, retraining, and downloadable audit packets."
      actions={
        <Button onClick={() => toast.success("Audit packet queued for export")} className="gap-2">
          <Download className="h-4 w-4" /> Export audit packet
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip icon={AlertTriangle} label="Overdue" value={overdue} />
        <StatChip icon={Clock} label="Due soon" value={dueSoon} />
        <StatChip icon={ShieldCheck} label="On track" value={onTrack} />
        <StatChip icon={CheckCircle2} label="Complete (90d)" value={complete} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="bg-card/60 backdrop-blur-xl">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Certification">Certifications</TabsTrigger>
          <TabsTrigger value="Policy">Policy</TabsTrigger>
          <TabsTrigger value="Signature">Signatures</TabsTrigger>
          <TabsTrigger value="Retraining">Retraining</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card className="bg-card/60 backdrop-blur-xl">
            <CardContent className="p-0 divide-y divide-border/40">
              {filtered.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                  <SeverityDot s={c.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.title}</div>
                    <div className="text-[11px] text-muted-foreground">{c.category} · {c.owner} · due {c.dueDate}</div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", STATUS_TONE[c.status])}>{c.status}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => toast.success("Reminder sent")}>Remind</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Section title="Historical audit packets" action={<Button size="sm" variant="ghost" onClick={() => toast.message("Generation queued")}><FileText className="h-4 w-4 mr-1" /> Generate new</Button>}>
        <div className="grid md:grid-cols-3 gap-3">
          {auditPackets.map(p => (
            <Card key={p.id} className="bg-card/60 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-[11px] text-muted-foreground">Generated {p.generated} · {p.size}</div>
                <p className="text-xs">{p.scope}</p>
                <div className="flex items-center justify-between pt-1">
                  <Badge variant="outline" className="text-[10px]">{p.items} items</Badge>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success("Download starting…")}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </GlassPageShell>
  );
}