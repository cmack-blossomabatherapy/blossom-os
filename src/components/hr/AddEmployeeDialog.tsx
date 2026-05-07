import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HR_STATES, OFFICE_WORK_SETTINGS, FIELD_WORK_SETTINGS, WORK_SETTING_LABELS, type Department } from "@/lib/hr/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  departments: Department[];
  onCreated: () => void;
}

export function AddEmployeeDialog({ open, onOpenChange, departments, onCreated }: Props) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [state, setState] = useState<string>("GA");
  const [clinic, setClinic] = useState("");
  const [deptId, setDeptId] = useState<string>("");
  const [empType, setEmpType] = useState("full_time");
  const [payType, setPayType] = useState("hourly");
  const [workSetting, setWorkSetting] = useState("clinic");
  const [startDate, setStartDate] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setFirst(""); setLast(""); setEmail(""); setTitle(""); setClinic("");
    setDeptId(""); setEmpType("full_time"); setPayType("hourly"); setWorkSetting("clinic");
    setStartDate("");
  }

  async function save() {
    if (!first || !last || !title || !state) {
      toast.error("First name, last name, title and state are required.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("employees")
      .insert({
        first_name: first.trim(),
        last_name: last.trim(),
        email: email.trim() || null,
        job_title: title.trim(),
        state,
        clinic: clinic.trim() || null,
        department_id: deptId || null,
        employment_type: empType as never,
        pay_type: payType as never,
        work_setting: workSetting as never,
        start_date: startDate || null,
        hire_date: startDate || null,
        status: "pending_start",
      })
      .select("id")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not create employee.");
      return;
    }
    await supabase.from("employee_timeline").insert({
      employee_id: data.id,
      event_type: "created",
      description: `Employee record created for ${first} ${last}`,
    });
    toast.success("Employee added.");
    if (email.trim()) {
      // Best-effort: provision an auth account so the Access tab is ready to send a sign-in link.
      const { error: linkErr } = await supabase.functions.invoke("admin-employee-magic-link", {
        body: { employeeId: data.id, siteUrl: window.location.origin, skipEmail: true },
      });
      if (linkErr) {
        toast.warning("Employee created, but couldn't auto-create their login. You can still send a sign-in link from the Access tab.");
      }
    }
    reset();
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Add employee</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name *"><Input value={first} onChange={(e) => setFirst(e.target.value)} /></Field>
          <Field label="Last name *"><Input value={last} onChange={(e) => setLast(e.target.value)} /></Field>
          <Field label="Job title *" full><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. RBT, BCBA, Clinic Admin" /></Field>
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Department">
            <Select value={deptId} onValueChange={setDeptId}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="State *">
            <Select value={state} onValueChange={setState}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{HR_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Clinic"><Input value={clinic} onChange={(e) => setClinic(e.target.value)} placeholder="e.g. Atlanta" /></Field>
          <Field label="Employment type">
            <Select value={empType} onValueChange={setEmpType}>
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
            <Select value={payType} onValueChange={setPayType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="salaried">Salaried</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Work setting">
            <Select value={workSetting} onValueChange={setWorkSetting}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Field staff</div>
                {FIELD_WORK_SETTINGS.map((v) => (
                  <SelectItem key={v} value={v}>{WORK_SETTING_LABELS[v]}</SelectItem>
                ))}
                <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Office &amp; Leadership</div>
                {OFFICE_WORK_SETTINGS.map((v) => (
                  <SelectItem key={v} value={v}>{WORK_SETTING_LABELS[v]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Start date"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Add employee"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      {children}
    </div>
  );
}