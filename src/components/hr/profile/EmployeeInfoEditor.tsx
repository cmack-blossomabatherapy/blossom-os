import { useEffect, useState } from "react";
import { Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { employeeFullName, HR_STATES, type Department, type Employee, type EmployeeStatus, type EmploymentType, type PayType, type WorkSetting } from "@/lib/hr/types";
import { toast } from "sonner";

interface Props {
  employee: Employee;
  departments: Department[];
  canEditEmployee: boolean;
  canEditPayroll: boolean;
  onSaved: () => void;
}

export function EmployeeInfoEditor({ employee, departments, canEditEmployee, canEditPayroll, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => toForm(employee));

  useEffect(() => setForm(toForm(employee)), [employee]);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("employees").update({
      employee_code: form.employee_code.trim() || null,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      preferred_name: form.preferred_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      job_title: form.job_title.trim(),
      department_id: form.department_id === "none" ? null : form.department_id,
      state: form.state,
      clinic: form.clinic.trim() || null,
      employment_type: form.employment_type,
      pay_type: form.pay_type,
      work_setting: form.work_setting,
      status: form.status,
      hire_date: form.hire_date || null,
      start_date: form.start_date || null,
      termination_date: form.termination_date || null,
      next_review_date: form.next_review_date || null,
      last_review_date: form.last_review_date || null,
      pay_rate: form.pay_rate ? Number(form.pay_rate) : null,
      viventium_employee_id: form.viventium_employee_id.trim() || null,
      kiosk_pin: form.kiosk_pin.trim() || null,
      kiosk_enabled: form.kiosk_enabled,
      resource_hub_access: form.resource_hub_access,
      is_people_manager: form.is_people_manager,
      notes: form.notes.trim() || null,
    }).eq("id", employee.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await supabase.from("employee_timeline").insert({ employee_id: employee.id, event_type: "updated", description: "Employee profile updated by HR" });
    toast.success("Employee profile saved.");
    setOpen(false);
    onSaved();
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} disabled={!canEditEmployee}>
        <Edit3 className="h-4 w-4" /> Edit employee
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader><DialogTitle>Edit {employeeFullName(employee)}</DialogTitle></DialogHeader>
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Identity">
              <Field label="Employee code"><Input value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} /></Field>
              <Field label="First name"><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
              <Field label="Last name"><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
              <Field label="Preferred name"><Input value={form.preferred_name} onChange={(e) => setForm({ ...form, preferred_name: e.target.value })} /></Field>
              <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Avatar URL"><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} /></Field>
            </Section>

            <Section title="Employment">
              <Field label="Job title"><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></Field>
              <Field label="Department"><Select value={form.department_id} onValueChange={(department_id) => setForm({ ...form, department_id })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No department</SelectItem>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Status"><Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as EmployeeStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{employeeStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="State"><Select value={form.state} onValueChange={(state) => setForm({ ...form, state })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{HR_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Clinic"><Input value={form.clinic} onChange={(e) => setForm({ ...form, clinic: e.target.value })} /></Field>
              <Field label="Work setting"><Select value={form.work_setting} onValueChange={(work_setting) => setForm({ ...form, work_setting: work_setting as WorkSetting })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{workSettings.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Employment type"><Select value={form.employment_type} onValueChange={(employment_type) => setForm({ ...form, employment_type: employment_type as EmploymentType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{employmentTypes.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
            </Section>

            <Section title="Dates & reviews">
              <Field label="Hire date"><Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></Field>
              <Field label="Start date"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
              <Field label="Termination date"><Input type="date" value={form.termination_date} onChange={(e) => setForm({ ...form, termination_date: e.target.value })} /></Field>
              <Field label="Last review"><Input type="date" value={form.last_review_date} onChange={(e) => setForm({ ...form, last_review_date: e.target.value })} /></Field>
              <Field label="Next review"><Input type="date" value={form.next_review_date} onChange={(e) => setForm({ ...form, next_review_date: e.target.value })} /></Field>
            </Section>

            <Section title="Payroll & access">
              <Field label="Pay type"><Select value={form.pay_type} disabled={!canEditPayroll && !canEditEmployee} onValueChange={(pay_type) => setForm({ ...form, pay_type: pay_type as PayType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hourly">Hourly</SelectItem><SelectItem value="salaried">Salaried</SelectItem></SelectContent></Select></Field>
              <Field label="Pay rate"><Input type="number" step="0.01" value={form.pay_rate} disabled={!canEditPayroll && !canEditEmployee} onChange={(e) => setForm({ ...form, pay_rate: e.target.value })} /></Field>
              <Field label="Viventium employee ID"><Input value={form.viventium_employee_id} disabled={!canEditPayroll && !canEditEmployee} onChange={(e) => setForm({ ...form, viventium_employee_id: e.target.value })} /></Field>
              <Field label="Kiosk PIN"><Input value={form.kiosk_pin} onChange={(e) => setForm({ ...form, kiosk_pin: e.target.value })} /></Field>
              <Toggle label="Kiosk enabled" checked={form.kiosk_enabled} onCheckedChange={(kiosk_enabled) => setForm({ ...form, kiosk_enabled })} />
              <Toggle label="Resource Hub access" checked={form.resource_hub_access} onCheckedChange={(resource_hub_access) => setForm({ ...form, resource_hub_access })} />
              <Toggle label="People manager (can assign team goals)" checked={form.is_people_manager} onCheckedChange={(is_people_manager) => setForm({ ...form, is_people_manager })} />
            </Section>
          </div>
          <Field label="HR notes"><Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save employee"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const employeeStatuses = [
  { value: "pending_start", label: "Pending Start" }, { value: "active", label: "Active" }, { value: "on_leave", label: "On Leave" },
  { value: "on_hold", label: "On Hold" }, { value: "terminated", label: "Terminated" }, { value: "resigned", label: "Resigned" },
] as const;
const employmentTypes = [{ value: "full_time", label: "Full-time" }, { value: "part_time", label: "Part-time" }, { value: "contractor", label: "Contractor" }, { value: "prn", label: "PRN" }] as const;
const workSettings = [{ value: "clinic", label: "Clinic" }, { value: "home", label: "Home-based" }, { value: "hybrid", label: "Hybrid" }, { value: "admin", label: "Admin" }, { value: "field", label: "Field" }] as const;

function toForm(employee: Employee) {
  return {
    employee_code: employee.employee_code ?? "", first_name: employee.first_name, last_name: employee.last_name, preferred_name: employee.preferred_name ?? "",
    email: employee.email ?? "", phone: employee.phone ?? "", avatar_url: employee.avatar_url ?? "", job_title: employee.job_title,
    department_id: employee.department_id ?? "none", state: employee.state, clinic: employee.clinic ?? "", employment_type: employee.employment_type,
    pay_type: employee.pay_type, work_setting: employee.work_setting, status: employee.status, hire_date: employee.hire_date ?? "",
    start_date: employee.start_date ?? "", termination_date: employee.termination_date ?? "", next_review_date: employee.next_review_date ?? "",
    last_review_date: employee.last_review_date ?? "", pay_rate: employee.pay_rate?.toString() ?? "", viventium_employee_id: employee.viventium_employee_id ?? "",
    kiosk_pin: employee.kiosk_pin ?? "", kiosk_enabled: employee.kiosk_enabled, resource_hub_access: employee.resource_hub_access, notes: employee.notes ?? "",
    is_people_manager: employee.is_people_manager ?? false,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-border/50 bg-secondary/20 p-3"><h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3><div className="grid gap-3 sm:grid-cols-2">{children}</div></section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

function Toggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-md border border-border/50 bg-card px-3 py-2 text-sm text-foreground"><Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />{label}</label>;
}