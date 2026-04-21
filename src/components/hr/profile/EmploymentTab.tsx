import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HR_STATES, type Department, type Employee, type EmployeeStatus } from "@/lib/hr/types";
import { useAuth } from "@/contexts/AuthContext";

export function EmploymentTab({ employee, department, onChange }: { employee: Employee; department: Department | null; onChange: () => void }) {
  const { hasPerm } = useAuth();
  const canEdit = hasPerm("hr.employees.edit");
  const [title, setTitle] = useState(employee.job_title);
  const [state, setState] = useState(employee.state);
  const [clinic, setClinic] = useState(employee.clinic ?? "");
  const [status, setStatus] = useState<EmployeeStatus>(employee.status);
  const [empType, setEmpType] = useState(employee.employment_type);
  const [payType, setPayType] = useState(employee.pay_type);
  const [workSetting, setWorkSetting] = useState(employee.work_setting);
  const [hireDate, setHireDate] = useState(employee.hire_date ?? "");
  const [startDate, setStartDate] = useState(employee.start_date ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("employees")
      .update({
        job_title: title,
        state,
        clinic: clinic || null,
        status,
        employment_type: empType,
        pay_type: payType,
        work_setting: workSetting,
        hire_date: hireDate || null,
        start_date: startDate || null,
      })
      .eq("id", employee.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await supabase.from("employee_timeline").insert({
      employee_id: employee.id,
      event_type: status !== employee.status ? "status_changed" : "updated",
      description: status !== employee.status ? `Status changed to ${status}` : "Employment details updated",
    });
    toast.success("Saved.");
    onChange();
  }

  return (
    <Card className="p-5 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Field label="Job title"><Input value={title} disabled={!canEdit} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Department"><Input value={department?.name ?? ""} disabled placeholder="—" /></Field>
        <Field label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as EmployeeStatus)} disabled={!canEdit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_start">Pending Start</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="resigned">Resigned</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="State">
          <Select value={state} onValueChange={setState} disabled={!canEdit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{HR_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Clinic"><Input value={clinic} disabled={!canEdit} onChange={(e) => setClinic(e.target.value)} /></Field>
        <Field label="Employment type">
          <Select value={empType} onValueChange={(v) => setEmpType(v as never)} disabled={!canEdit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full-time</SelectItem>
              <SelectItem value="part_time">Part-time</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="prn">PRN</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Pay type">
          <Select value={payType} onValueChange={(v) => setPayType(v as never)} disabled={!canEdit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="salaried">Salaried</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Work setting">
          <Select value={workSetting} onValueChange={(v) => setWorkSetting(v as never)} disabled={!canEdit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="clinic">Clinic</SelectItem>
              <SelectItem value="home">Home-based</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="field">Field</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Hire date"><Input type="date" value={hireDate} disabled={!canEdit} onChange={(e) => setHireDate(e.target.value)} /></Field>
        <Field label="Start date"><Input type="date" value={startDate} disabled={!canEdit} onChange={(e) => setStartDate(e.target.value)} /></Field>
      </div>
      {canEdit && (
        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      )}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      {children}
    </div>
  );
}