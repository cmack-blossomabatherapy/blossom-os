import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, GraduationCap, Loader2, ShieldCheck, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/lib/hr/types";
import { ROLE_META, roleLabel, type AppRole } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function AccessTab({ employee }: { employee: Employee }) {
  const { isAdmin, hasPerm } = useAuth();
  const canManageRoles = isAdmin || hasPerm("settings.manage");
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!employee.user_id) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", employee.user_id)
      .then(({ data, error }) => {
        if (!error && data) setRoles(data.map((r) => r.role as AppRole));
        setLoading(false);
      });
  }, [employee.user_id]);

  const toggleRole = async (role: AppRole, next: boolean) => {
    if (!employee.user_id) {
      toast.error("This employee has no Blossom OS account yet — link one first.");
      return;
    }
    setSaving(true);
    if (next) {
      const { error } = await supabase.from("user_roles").insert({ user_id: employee.user_id, role });
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      setRoles((prev) => Array.from(new Set([...prev, role])));
      toast.success(`${roleLabel(role)} added`);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", employee.user_id)
        .eq("role", role);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      setRoles((prev) => prev.filter((r) => r !== role));
      toast.success(`${roleLabel(role)} removed`);
    }
    setSaving(false);
  };

  const items = [
    { label: "Blossom OS account", on: !!employee.user_id, hint: employee.user_id ? "Linked" : "Not linked" },
    { label: "Employee resource hub", on: employee.resource_hub_access, hint: employee.resource_hub_access ? "Granted" : "Disabled" },
    { label: "Clinic kiosk clock-in", on: employee.kiosk_enabled, hint: employee.kiosk_enabled ? "PIN active" : "Disabled" },
    { label: "Viventium payroll", on: !!employee.viventium_employee_id, hint: employee.viventium_sync_status ?? "Not connected" },
    { label: "CentralReach", on: false, hint: "Manual setup required" },
  ];

  const roleToggles: { key: AppRole; title: string; desc: string; icon: typeof GraduationCap }[] = [
    {
      key: "training_admin",
      title: "Training Admin access",
      desc: "Can assign trainings, track status, view training stats — adds Training Admin to the left menu.",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Module access &amp; roles</h3>
          {!employee.user_id && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              No login linked
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          {roleToggles.map((rt) => {
            const on = roles.includes(rt.key);
            const Icon = rt.icon;
            return (
              <div
                key={rt.key}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-2.5",
                  on ? "border-primary/30 bg-primary/5" : "border-border/40",
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    on ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{rt.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{rt.desc}</p>
                </div>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />
                ) : (
                  <Switch
                    checked={on}
                    onCheckedChange={(checked) => toggleRole(rt.key, checked)}
                    disabled={!canManageRoles || !employee.user_id || saving}
                    className="mt-0.5"
                  />
                )}
              </div>
            );
          })}

          {roles.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                All assigned roles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    {roleLabel(r)}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                <LinkIcon className="h-3 w-3" /> Manage every role from <strong className="ml-1">Team → Admin · Live members &amp; roles</strong>.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">System access</h3>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40">
              {it.on ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{it.label}</p>
                <p className={cn("text-[11px]", it.on ? "text-muted-foreground" : "text-muted-foreground/70")}>{it.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}