import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings as SettingsIcon, Save, GraduationCap, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { HRSetting } from "@/lib/hr/types";
import type { Json } from "@/integrations/supabase/types";

export default function HRSettings() {
  const { hasPerm, user } = useAuth();
  const canEdit = hasPerm("hr.settings.manage");
  const [settings, setSettings] = useState<Record<string, HRSetting>>({});
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("hr_settings").select("*");
    const map: Record<string, HRSetting> = {};
    const d: Record<string, Record<string, unknown>> = {};
    ((data ?? []) as HRSetting[]).forEach((s) => {
      map[s.key] = s;
      d[s.key] = { ...(s.value as Record<string, unknown>) };
    });
    setSettings(map);
    setDraft(d);
    setLoading(false);
  }

  async function save(key: string) {
    const { error } = await supabase.from("hr_settings").update({
      value: draft[key] as Json,
      updated_by: user?.id ?? null,
      updated_by_name: user?.email ?? null,
      updated_at: new Date().toISOString(),
    }).eq("key", key);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved.");
    void load();
  }

  function update(key: string, field: string, value: unknown) {
    setDraft((d) => ({ ...d, [key]: { ...(d[key] ?? {}), [field]: value } }));
  }

  if (loading) {
    return (
      <PageShell title="HR Settings" description="Configure HR module policies and behavior." icon={SettingsIcon}>
        <Skeleton className="h-64" />
      </PageShell>
    );
  }

  return (
    <PageShell title="HR Settings" description="Configure HR module policies and behavior." icon={SettingsIcon}>
      {/* Training — Role Journeys */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Manage Role Journeys</h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                Edit the Training Academy learning journey for each role — add, remove, reorder, and deeply edit modules.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/training/manage">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* PTO Accrual */}
      <SettingCard
        title="PTO Accrual Policy"
        description="How time-off accrues per pay period."
        canEdit={canEdit}
        onSave={() => save("pto.accrual")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Hours per pay period" type="number"
            value={String(draft["pto.accrual"]?.hours_per_pay_period ?? "")}
            onChange={(v) => update("pto.accrual", "hours_per_pay_period", parseFloat(v) || 0)}
            disabled={!canEdit} />
          <Field label="Max balance (hours)" type="number"
            value={String(draft["pto.accrual"]?.max_balance ?? "")}
            onChange={(v) => update("pto.accrual", "max_balance", parseFloat(v) || 0)}
            disabled={!canEdit} />
          <Field label="Year-end carryover (hours)" type="number"
            value={String(draft["pto.accrual"]?.carryover ?? "")}
            onChange={(v) => update("pto.accrual", "carryover", parseFloat(v) || 0)}
            disabled={!canEdit} />
        </div>
      </SettingCard>

      {/* Overtime */}
      <SettingCard
        title="Overtime Threshold"
        description="When overtime kicks in for hourly employees."
        canEdit={canEdit}
        onSave={() => save("overtime.threshold")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Weekly hours" type="number"
            value={String(draft["overtime.threshold"]?.weekly_hours ?? "")}
            onChange={(v) => update("overtime.threshold", "weekly_hours", parseFloat(v) || 0)}
            disabled={!canEdit} />
          <Field label="Daily hours (optional)" type="number"
            value={String(draft["overtime.threshold"]?.daily_hours ?? "")}
            onChange={(v) => update("overtime.threshold", "daily_hours", v ? parseFloat(v) : null)}
            disabled={!canEdit} />
          <Field label="Multiplier" type="number"
            value={String(draft["overtime.threshold"]?.multiplier ?? "")}
            onChange={(v) => update("overtime.threshold", "multiplier", parseFloat(v) || 1)}
            disabled={!canEdit} />
        </div>
      </SettingCard>

      {/* Kiosk Geofence */}
      <SettingCard
        title="Kiosk Geofencing"
        description="Restrict kiosk punches to clinic locations."
        canEdit={canEdit}
        onSave={() => save("kiosk.geofence")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
          <div className="flex items-center gap-3 pb-2">
            <Switch
              checked={Boolean(draft["kiosk.geofence"]?.enabled)}
              onCheckedChange={(v) => update("kiosk.geofence", "enabled", v)}
              disabled={!canEdit}
              id="geofence"
            />
            <Label htmlFor="geofence" className="text-sm">Enable geofencing</Label>
          </div>
          <Field label="Radius (meters)" type="number"
            value={String(draft["kiosk.geofence"]?.radius_meters ?? "")}
            onChange={(v) => update("kiosk.geofence", "radius_meters", parseInt(v) || 0)}
            disabled={!canEdit || !draft["kiosk.geofence"]?.enabled} />
        </div>
      </SettingCard>

      {/* Payroll Cycle */}
      <SettingCard
        title="Payroll Cycle"
        description="Default pay frequency and submission lead time."
        canEdit={canEdit}
        onSave={() => save("payroll.cycle")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Frequency</Label>
            <Select
              value={String(draft["payroll.cycle"]?.frequency ?? "biweekly")}
              onValueChange={(v) => update("payroll.cycle", "frequency", v)}
              disabled={!canEdit}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="semimonthly">Semi-monthly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="Submit lead time (days before pay date)" type="number"
            value={String(draft["payroll.cycle"]?.submit_lead_days ?? "")}
            onChange={(v) => update("payroll.cycle", "submit_lead_days", parseInt(v) || 0)}
            disabled={!canEdit} />
        </div>
      </SettingCard>
    </PageShell>
  );
}

function SettingCard({ title, description, children, canEdit, onSave }: {
  title: string; description: string; children: React.ReactNode; canEdit: boolean; onSave: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {canEdit && <Button size="sm" variant="outline" onClick={onSave}><Save className="h-3.5 w-3.5" /> Save</Button>}
      </div>
      {children}
    </Card>
  );
}

function Field({ label, value, onChange, type = "text", disabled }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  );
}