import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, GraduationCap, ClipboardList, Building2 } from "lucide-react";
import type { EvalRule, StaffRole, EvalType } from "./types";
import type { EvaluationsData } from "./useEvaluationsData";

const TYPE_ORDER: EvalType[] = ["10-Day", "30-Day", "90-Day", "Quarterly", "Annual"];

const ROLE_META: Record<StaffRole, { label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  BCBA: { label: "BCBA", description: "Board Certified Behavior Analysts", icon: GraduationCap },
  RBT: { label: "RBT", description: "Registered Behavior Technicians", icon: ClipboardList },
  Office: { label: "Office Staff", description: "Admin, intake, scheduling, billing, HR and all non-clinical roles", icon: Building2 },
};
const ROLES: StaffRole[] = ["BCBA", "RBT", "Office"];

function TypeLabel({ t }: { t: EvalType }) {
  const label =
    t === "10-Day" ? "10-Day Review"
    : t === "30-Day" ? "30-Day Review"
    : t === "90-Day" ? "90-Day Review"
    : t === "Quarterly" ? "Quarterly Review"
    : "Annual Review";
  return <span className="text-xs font-medium">{label}</span>;
}

function RoleRules({
  role,
  rules,
  onChange,
  disabled,
}: {
  role: StaffRole;
  rules: EvalRule[];
  onChange: (rule: EvalRule) => void;
  disabled: boolean;
}) {
  const ofRole = rules.filter((r) => r.role === role);
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-start gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{meta.label} Schedule</h3>
          <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-relaxed">{meta.description}. Schedule auto-generates from each person's hire date.</p>
        </div>
      </div>
      <div className="space-y-3">
        {TYPE_ORDER.map((t) => {
          const r = ofRole.find((x) => x.eval_type === t);
          if (!r) return null;
          return (
            <div key={r.id} className="rounded-xl border border-border/50 bg-background/60 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <TypeLabel t={t} />
                <Switch
                  checked={r.enabled}
                  disabled={disabled}
                  onCheckedChange={(v) => onChange({ ...r, enabled: v })}
                />
              </div>
              {r.enabled && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[10.5px] uppercase tracking-wide text-muted-foreground">First due (days after hire)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={r.first_offset_days}
                      disabled={disabled}
                      onChange={(e) => onChange({ ...r, first_offset_days: Number(e.target.value) || 0 })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Repeats every (days)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder={t === "10-Day" || t === "30-Day" || t === "90-Day" ? "Once only" : ""}
                      value={r.cadence_days ?? ""}
                      disabled={disabled}
                      onChange={(e) =>
                        onChange({ ...r, cadence_days: e.target.value === "" ? null : Number(e.target.value) || 0 })
                      }
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Reminder (days before)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={r.reminder_days_before}
                      disabled={disabled}
                      onChange={(e) => onChange({ ...r, reminder_days_before: Number(e.target.value) || 0 })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EvaluationRulesSection({
  data,
  canEdit,
}: {
  data: EvaluationsData;
  canEdit: boolean;
}) {
  const [local, setLocal] = useState<EvalRule[]>(data.rules);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => { setLocal(data.rules); }, [data.rules]);

  function update(rule: EvalRule) {
    setLocal((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
  }

  async function save(regenerate: boolean) {
    if (!canEdit) return;
    setSaving(true);
    const updates = local.map((r) =>
      (supabase.from as any)("evaluation_rules")
        .update({
          enabled: r.enabled,
          first_offset_days: r.first_offset_days,
          cadence_days: r.cadence_days,
          reminder_days_before: r.reminder_days_before,
        })
        .eq("id", r.id),
    );
    const results = await Promise.all(updates);
    setSaving(false);
    const firstErr = results.find((r: any) => r.error)?.error;
    if (firstErr) {
      toast({ title: "Save failed", description: firstErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "Rules saved" });

    if (regenerate) {
      setRegenerating(true);
      const activeStaff = data.staff.filter((s) => s.active_status && s.hire_date);
      let total = 0;
      for (const s of activeStaff) {
        const { data: count } = await (supabase as any).rpc("regenerate_staff_evaluations", { _staff_id: s.id });
        total += Number(count ?? 0);
      }
      setRegenerating(false);
      toast({ title: "Schedules regenerated", description: `Created ${total} new evaluations for ${activeStaff.length} staff.` });
    }
    data.refresh();
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 space-y-5 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-16px_hsl(220_30%_20%/0.08)]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Evaluation Schedule Rules</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
            Configure how often each role gets evaluated. Every staff member's review schedule is built automatically from their hire date — no manual scheduling required.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!canEdit || saving} onClick={() => save(false)}>
            Save
          </Button>
          <Button size="sm" disabled={!canEdit || saving || regenerating} onClick={() => save(true)}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
            Save & regenerate schedules
          </Button>
        </div>
      </div>
      <Tabs defaultValue="BCBA" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          {ROLES.map((r) => (
            <TabsTrigger key={r} value={r}>{ROLE_META[r].label}</TabsTrigger>
          ))}
        </TabsList>
        {ROLES.map((r) => (
          <TabsContent key={r} value={r} className="mt-4">
            <RoleRules role={r} rules={local} onChange={update} disabled={!canEdit} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}