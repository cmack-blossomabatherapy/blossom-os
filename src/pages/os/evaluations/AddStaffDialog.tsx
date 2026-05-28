import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { EvalStaff } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supervisors: EvalStaff[];
  onCreated: () => void;
  initial?: Partial<EvalStaff>;
}

const STATES = ["GA", "NC", "TN", "VA", "MD"];

export default function AddStaffDialog({ open, onOpenChange, supervisors, onCreated, initial }: Props) {
  const [first, setFirst] = useState(initial?.first_name ?? "");
  const [last, setLast] = useState(initial?.last_name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [role, setRole] = useState<"BCBA" | "RBT">((initial?.role as any) ?? "RBT");
  const [state, setState] = useState(initial?.state ?? "");
  const [supervisorId, setSupervisorId] = useState<string>(initial?.supervisor_id ?? "");
  const [hireDate, setHireDate] = useState(initial?.hire_date ?? "");
  const [active, setActive] = useState(initial?.active_status ?? true);
  const [frequency, setFrequency] = useState<"Quarterly" | "Annual" | "Both">((initial?.evaluation_frequency as any) ?? "Both");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!first.trim() || !last.trim() || !email.trim()) {
      toast({ title: "Missing fields", description: "First name, last name, and email are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const sup = supervisors.find((s) => s.id === supervisorId);
    const { error } = await supabase.from("evaluation_staff").insert({
      first_name: first.trim(),
      last_name: last.trim(),
      email: email.trim(),
      phone: phone || null,
      role,
      state: state || null,
      supervisor_id: supervisorId || null,
      supervisor_name: sup ? `${sup.first_name} ${sup.last_name}` : null,
      hire_date: hireDate || null,
      active_status: active,
      evaluation_frequency: frequency,
      notes: notes || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to add staff", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Staff added", description: `${first} ${last} added to evaluations.` });
    onCreated();
    onOpenChange(false);
    setFirst(""); setLast(""); setEmail(""); setPhone(""); setSupervisorId(""); setHireDate(""); setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input value={first} onChange={(e) => setFirst(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input value={last} onChange={(e) => setLast(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BCBA">BCBA</SelectItem>
                  <SelectItem value="RBT">RBT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Select value={state ?? ""} onValueChange={setState}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hire date</Label>
              <Input type="date" value={hireDate ?? ""} onChange={(e) => setHireDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Supervisor / Reviewer</Label>
              <Select value={supervisorId} onValueChange={setSupervisorId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {supervisors.length === 0 && <SelectItem value="_none" disabled>No staff yet</SelectItem>}
                  {supervisors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Evaluation frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive staff are hidden from evaluation cycles.</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Optional internal notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Add staff member"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}