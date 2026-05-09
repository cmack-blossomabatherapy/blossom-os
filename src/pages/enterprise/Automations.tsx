import { Workflow, Play, Pause, Plus } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { automationTemplates } from "@/data/blossomEnterprise";
import { toast } from "sonner";

export default function AdvancedAutomations() {
  return (
    <GlassPageShell eyebrow="Enterprise" eyebrowIcon={Workflow} title="Advanced Automations"
      description="Multi-step workflows with triggers, branches, and escalation chains. Templates ship pre-wired to Blossom modules."
      actions={<Button className="gap-2" onClick={() => toast.message("Builder opening soon")}><Plus className="h-4 w-4" /> New automation</Button>}>
      <div className="grid lg:grid-cols-2 gap-3">
        {automationTemplates.map(a => (
          <Card key={a.id} className="bg-card/60 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">{a.name}</CardTitle>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{a.department} · {a.runs30d} runs / 30d</div>
                </div>
                <Switch checked={a.active} onCheckedChange={() => toast.success(a.active ? "Paused" : "Activated")} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Trigger</div>
              <Badge variant="outline" className="text-[11px]">{a.trigger}</Badge>
              <div className="space-y-1.5 pt-1">
                {a.steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                    <span className="text-foreground/85">{s}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-1.5 pt-2">
                <Button size="sm" variant="ghost" className="gap-1.5">{a.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {a.active ? "Pause" : "Run"}</Button>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </GlassPageShell>
  );
}