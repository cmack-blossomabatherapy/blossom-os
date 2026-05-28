import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import type { EvalRule, StaffRole, EvalType } from "./types";
import type { EvaluationsData } from "./useEvaluationsData";

const TYPE_ORDER: EvalType[] = ["30-Day", "Quarterly", "Annual"];

function TypeLabel({ t }: { t: EvalType }) {
  return (
    <span className="text-xs font-medium">
      {t === "30-Day" ? "30-Day Review" : t === "Quarterly" ? "Quarterly Review" : "Annual Review"}
    </span>
  );
}

function RoleCard({
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
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">{role} Rules</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Auto-generates each {role}'s evaluation schedule from their hire date.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {TYPE_ORDER.map((t) => {
          const r = ofRole.find((x) => x.eval_type === t);
          if (!r) return null;
          return (
            <div key={r.id} className="rounded-xl border border-border/60 bg-background/60 p-3 space-y-3">
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
                      placeholder={t === "30-Day" ? "Once only" : ""}
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
    <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold">Evaluation Rules</h2>
          <p className="text-[11.5px] text-muted-foreground mt-1 max-w-xl">
            Every staff member's evaluation schedule is built automatically from their hire date and these rules.
            No more manually creating cycles — when someone is hired, their reviews are scheduled instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!canEdit || saving} onClick={() => save(false)}>
            Save
          </Button>
          <Button size="sm" disabled={!canEdit || saving || regenerating} onClick={() => save(true)}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
            Save & regenerate future schedules
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RoleCard role="BCBA" rules={local} onChange={update} disabled={!canEdit} />
        <RoleCard role="RBT" rules={local} onChange={update} disabled={!canEdit} />
      </div>
    </div>
  );
}