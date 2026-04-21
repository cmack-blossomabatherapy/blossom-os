import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Plus } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ONBOARDING_STAGES, employeeFullName, type Employee, type OnboardingStatus } from "@/lib/hr/types";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface OnbRow {
  id: string; status: OnboardingStatus; employee_id: string; updated_at: string;
}
interface Template { id: string; name: string; role_target: string }

export default function OnboardingCenter() {
  const { hasPerm } = useAuth();
  const canManage = hasPerm("hr.onboarding.manage");
  const [rows, setRows] = useState<OnbRow[]>([]);
  const [employees, setEmployees] = useState<Map<string, Employee>>(new Map());
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [empId, setEmpId] = useState("");
  const [tplId, setTplId] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [onb, emp, tpl] = await Promise.all([
      supabase.from("employee_onboarding").select("id, status, employee_id, updated_at").order("updated_at", { ascending: false }),
      supabase.from("employees").select("*").order("last_name"),
      supabase.from("onboarding_templates").select("id, name, role_target").eq("is_active", true).order("name"),
    ]);
    setRows((onb.data ?? []) as OnbRow[]);
    const m = new Map<string, Employee>();
    (emp.data ?? []).forEach((e) => m.set(e.id, e as Employee));
    setEmployees(m);
    setTemplates(tpl.data ?? []);
    setLoading(false);
  }

  async function create() {
    if (!empId || !tplId) { toast.error("Pick an employee and a template."); return; }
    const { data: onb, error } = await supabase
      .from("employee_onboarding")
      .insert({ employee_id: empId, template_id: tplId, status: "new_hire_pending" })
      .select("id").single();
    if (error || !onb) { toast.error(error?.message ?? "Could not start onboarding."); return; }
    // copy template tasks into per-employee tasks
    const { data: tplTasks } = await supabase.from("onboarding_template_tasks").select("*").eq("template_id", tplId).order("position");
    if (tplTasks?.length) {
      const today = new Date();
      const toInsert = tplTasks.map((t) => ({
        onboarding_id: onb.id,
        position: t.position,
        category: t.category,
        title: t.title,
        description: t.description,
        owner_role: t.default_owner_role,
        is_required: t.is_required,
        due_date: t.due_offset_days ? new Date(today.getTime() + t.due_offset_days * 86400000).toISOString().slice(0, 10) : null,
      }));
      await supabase.from("employee_onboarding_tasks").insert(toInsert);
    }
    await supabase.from("employee_timeline").insert({
      employee_id: empId, event_type: "onboarding_advanced", description: "Onboarding workflow started",
    });
    toast.success("Onboarding started.");
    setOpen(false); setEmpId(""); setTplId("");
    void load();
  }

  async function moveStage(rowId: string, status: OnboardingStatus) {
    if (!canManage) return;
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, status } : r));
    const { error } = await supabase.from("employee_onboarding").update({ status, stage_entered_at: new Date().toISOString() }).eq("id", rowId);
    if (error) { toast.error(error.message); void load(); }
  }

  return (
    <PageShell
      title="Onboarding Center"
      description="Drag through stages to move new hires from offer to active."
      icon={GraduationCap}
      actions={canManage ? <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Start onboarding</Button> : null}
    >
      {loading ? <Skeleton className="h-64" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {ONBOARDING_STAGES.slice(0, 8).map((stage) => {
            const stageRows = rows.filter((r) => r.status === stage.key);
            return (
              <Card key={stage.key} className={cn("p-3 min-h-[200px]", stage.tone)}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground">{stage.label}</p>
                  <span className="text-[10px] tabular-nums text-muted-foreground bg-background/60 px-1.5 rounded">{stageRows.length}</span>
                </div>
                <div className="space-y-1.5">
                  {stageRows.map((r) => {
                    const emp = employees.get(r.employee_id);
                    if (!emp) return null;
                    return (
                      <div key={r.id} className="p-2 rounded-md bg-background/80 border border-border/40">
                        <Link to={`/hr/employees/${emp.id}`} className="flex items-center gap-2">
                          <EmployeeAvatar employee={emp} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{employeeFullName(emp)}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{emp.job_title} · {emp.state}</p>
                          </div>
                        </Link>
                        {canManage && (
                          <Select value={r.status} onValueChange={(v) => moveStage(r.id, v as OnboardingStatus)}>
                            <SelectTrigger className="h-6 w-full mt-1.5 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ONBOARDING_STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    );
                  })}
                  {stageRows.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-3">Empty</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start onboarding</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Employee</Label>
              <Select value={empId} onValueChange={setEmpId}>
                <SelectTrigger><SelectValue placeholder="Select employee…" /></SelectTrigger>
                <SelectContent>
                  {Array.from(employees.values()).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{employeeFullName(e)} · {e.job_title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Template</Label>
              <Select value={tplId} onValueChange={setTplId}>
                <SelectTrigger><SelectValue placeholder="Select template…" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Start</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}