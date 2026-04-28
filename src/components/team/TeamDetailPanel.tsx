import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X, Mail, Phone, MapPin, Calendar, TrendingUp, TrendingDown, Minus, MessageSquare, UserCog, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  type TeamMember,
  departmentVariant,
  statusVariant,
  workloadVariant,
  capacityColor,
  capacityTextColor,
  findMember,
} from "@/data/team";
import { toast } from "sonner";

interface Props {
  member: TeamMember | null;
  onClose: () => void;
}

interface EmployeeQuickRecord {
  id: string;
  user_id: string | null;
  pay_rate: number | null;
  pay_type: "hourly" | "salaried";
  viventium_employee_id: string | null;
  kiosk_pin: string | null;
  kiosk_enabled: boolean;
  resource_hub_access: boolean;
}

interface RelationshipRow {
  kind: string;
  related_employee_id: string;
  related: { first_name: string; last_name: string; preferred_name: string | null } | null;
}

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
}

export function TeamDetailPanel({ member, onClose }: Props) {
  const { hasPerm } = useAuth();
  const [employee, setEmployee] = useState<EmployeeQuickRecord | null>(null);
  const [relationships, setRelationships] = useState<RelationshipRow[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [loadingQuick, setLoadingQuick] = useState(false);
  const [savingQuick, setSavingQuick] = useState(false);

  useEffect(() => {
    if (!member) return;
    setLoadingQuick(true);
    void Promise.all([
      supabase.from("employees").select("id,user_id,pay_rate,pay_type,viventium_employee_id,kiosk_pin,kiosk_enabled,resource_hub_access").eq("id", member.id).maybeSingle(),
      supabase.from("employee_relationships").select("kind,related_employee_id").eq("employee_id", member.id),
      supabase.from("employees").select("id,first_name,last_name,preferred_name").neq("id", member.id).order("last_name"),
    ]).then(async ([employeeRes, relationshipRes, optionsRes]) => {
      setEmployee((employeeRes.data as EmployeeQuickRecord | null) ?? null);
      setEmployeeOptions((optionsRes.data ?? []) as EmployeeOption[]);
      const rows = (relationshipRes.data ?? []) as Array<Omit<RelationshipRow, "related">>;
      const relatedIds = rows.map((row) => row.related_employee_id);
      const relatedRes = relatedIds.length
        ? await supabase.from("employees").select("id,first_name,last_name,preferred_name").in("id", relatedIds)
        : { data: [] };
      const relatedById = new Map((relatedRes.data ?? []).map((row) => [row.id, row]));
      setRelationships(rows.map((row) => ({ ...row, related: relatedById.get(row.related_employee_id) ?? null })));
    }).finally(() => setLoadingQuick(false));
  }, [member]);

  if (!member) {
    return (
      <div className="bg-card rounded-xl border border-border/60 p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <UserCog className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Select a team member to view profile</p>
      </div>
    );
  }

  const manager = member.reportsTo ? findMember(member.reportsTo) : null;
  const canEditQuick = hasPerm("hr.employees.edit");
  const canEditPayroll = hasPerm("hr.payroll.edit") || hasPerm("hr.paychanges.manage");

  const saveQuickAccess = async (patch: Partial<EmployeeQuickRecord>) => {
    if (!employee) return;
    setSavingQuick(true);
    const { error } = await supabase.from("employees").update(patch).eq("id", employee.id);
    setSavingQuick(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmployee({ ...employee, ...patch });
    toast.success("Employee quick panel updated");
  };

  const directManager = useMemo(() => relationships.find((row) => row.kind === "direct_manager") ?? null, [relationships]);

  const updateDirectManager = async (managerId: string) => {
    if (!employee || !canEditQuick) return;
    setSavingQuick(true);
    await supabase.from("employee_relationships").delete().eq("employee_id", employee.id).eq("kind", "direct_manager");
    const { error } = await supabase.from("employee_relationships").insert({ employee_id: employee.id, related_employee_id: managerId, kind: "direct_manager" });
    setSavingQuick(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const related = employeeOptions.find((option) => option.id === managerId) ?? null;
    setRelationships((current) => [{ kind: "direct_manager", related_employee_id: managerId, related }, ...current.filter((row) => row.kind !== "direct_manager")]);
    toast.success("Manager updated");
  };

  return (
    <div className="bg-card rounded-xl border border-border/60 flex flex-col max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {member.initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{member.name}</h3>
            <p className="text-xs text-muted-foreground">{member.role}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <StatusBadge status={member.department} variant={departmentVariant(member.department)} />
              <StatusBadge status={member.status} variant={statusVariant(member.status)} />
              <StatusBadge status={member.workloadLevel} variant={workloadVariant(member.workloadLevel)} />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Contact strip */}
        <div className="px-4 py-3 border-b border-border/40 space-y-1.5 text-xs text-muted-foreground">
          <Row icon={Mail} value={member.email} />
          <Row icon={Phone} value={member.phone} />
          <Row icon={MapPin} value={member.states.join(", ")} />
          <Row icon={Calendar} value={`Joined ${new Date(member.hiredAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`} />
          {manager && <Row icon={UserCog} value={`Reports to ${manager.name}`} />}
        </div>

        <Section title="HR quick panel">
          {loadingQuick ? (
            <div className="flex items-center justify-center rounded-lg border border-border/40 bg-secondary/30 py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : employee ? (
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label className="text-[11px] text-muted-foreground">Direct manager</Label>
                <Select value={directManager?.related_employee_id ?? "none"} onValueChange={(value) => value !== "none" && updateDirectManager(value)} disabled={!canEditQuick || savingQuick}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No manager selected</SelectItem>
                    {employeeOptions.map((option) => <SelectItem key={option.id} value={option.id}>{formatEmployeeOption(option)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Pay type</Label>
                  <Select value={employee.pay_type} onValueChange={(value) => saveQuickAccess({ pay_type: value as EmployeeQuickRecord["pay_type"] })} disabled={!canEditPayroll || savingQuick}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="hourly">Hourly</SelectItem><SelectItem value="salaried">Salaried</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Pay rate</Label>
                  <Input type="number" value={employee.pay_rate ?? ""} onChange={(event) => setEmployee({ ...employee, pay_rate: event.target.value ? Number(event.target.value) : null })} onBlur={() => canEditPayroll && saveQuickAccess({ pay_rate: employee.pay_rate })} disabled={!canEditPayroll || savingQuick} className="h-8 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Viventium ID</Label>
                  <Input value={employee.viventium_employee_id ?? ""} onChange={(event) => setEmployee({ ...employee, viventium_employee_id: event.target.value })} onBlur={() => canEditQuick && saveQuickAccess({ viventium_employee_id: employee.viventium_employee_id })} disabled={!canEditQuick || savingQuick} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Kiosk PIN</Label>
                  <Input value={employee.kiosk_pin ?? ""} onChange={(event) => setEmployee({ ...employee, kiosk_pin: event.target.value })} onBlur={() => canEditQuick && saveQuickAccess({ kiosk_pin: employee.kiosk_pin })} disabled={!canEditQuick || savingQuick} className="h-8 text-xs" />
                </div>
              </div>
              <div className="grid gap-2">
                <QuickToggle label="Kiosk enabled" checked={employee.kiosk_enabled} disabled={!canEditQuick || savingQuick} onChange={(checked) => saveQuickAccess({ kiosk_enabled: checked })} />
                <QuickToggle label="Resource hub access" checked={employee.resource_hub_access} disabled={!canEditQuick || savingQuick} onChange={(checked) => saveQuickAccess({ resource_hub_access: checked })} />
              </div>
              <Button asChild variant="outline" size="sm" className="h-8 w-full text-xs">
                <Link to={`/hr/employees/${employee.id}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open full HR record</Link>
              </Button>
            </div>
          ) : (
            <p className="rounded-lg border border-border/40 bg-secondary/30 p-3 text-xs text-muted-foreground">No linked employee record found.</p>
          )}
        </Section>

        {/* Capacity / Snapshot */}
        <Section title="Workload Snapshot">
          <div className="bg-secondary/30 border border-border/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current capacity</p>
              <span className={cn("text-sm font-semibold tabular-nums", capacityTextColor(member.capacityPct))}>
                {member.capacityPct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
              <div
                className={cn("h-full rounded-full", capacityColor(member.capacityPct))}
                style={{ width: `${Math.min(member.capacityPct, 100)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Stat label="Open" value={member.workload.tasksOpen} />
            <Stat label="Overdue" value={member.workload.tasksOverdue} tone={member.workload.tasksOverdue > 0 ? "destructive" : "default"} />
            <Stat label="Done (mo)" value={member.workload.tasksCompletedMonth} tone="success" />
          </div>
        </Section>

        {/* Owned Work */}
        <Section title="Owned Work">
          <div className="grid grid-cols-2 gap-2">
            <OwnedRow label="Leads" value={member.workload.leads} />
            <OwnedRow label="Clients" value={member.workload.clients} />
            <OwnedRow label="Authorizations" value={member.workload.auths} />
            <OwnedRow label="QA Items" value={member.workload.qa} />
          </div>
        </Section>

        {/* Responsibilities */}
        <Section title="Responsibilities">
          <ul className="space-y-1">
            {member.responsibilities.map((r, i) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-2">
                <span className="h-1 w-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </Section>

        {/* Performance */}
        <Section title="Performance · last 30 days">
          <div className="space-y-1.5">
            {member.performance.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border/40 bg-secondary/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">{p.label}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground tabular-nums">{p.value}</p>
                  {p.trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-success" />}
                  {p.trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                  {p.trend === "neutral" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Actions */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-1.5">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <MessageSquare className="h-3 w-3 mr-1.5" /> Message
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <UserCog className="h-3 w-3 mr-1.5" /> Reassign Work
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-border/40 last:border-b-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Row({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground/70" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function formatEmployeeOption(employee: EmployeeOption) {
  return `${employee.preferred_name || employee.first_name} ${employee.last_name}`;
}

function QuickToggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-md border border-border/40 bg-secondary/30 px-3 py-2 text-xs text-foreground">
      <span>{label}</span>
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => onChange(value === true)} />
    </label>
  );
}

function Stat({
  label, value, tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "destructive";
}) {
  const cls = tone === "destructive" ? "text-destructive" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <div className="bg-secondary/30 border border-border/40 rounded-md p-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums mt-0.5", cls)}>{value}</p>
    </div>
  );
}

function OwnedRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/40 bg-secondary/30 px-3 py-2 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">{value || "—"}</span>
    </div>
  );
}
