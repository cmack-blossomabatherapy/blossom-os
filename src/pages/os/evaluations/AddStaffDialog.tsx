import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface InternalStaffOption {
  id: string;
  name: string;
  email: string | null;
  job_title: string | null;
  department: string | null;
}

export default function AddStaffDialog({ open, onOpenChange, supervisors, onCreated, initial }: Props) {
  const [first, setFirst] = useState(initial?.first_name ?? "");
  const [last, setLast] = useState(initial?.last_name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [role, setRole] = useState<"BCBA" | "RBT" | "Office">((initial?.role as any) ?? "RBT");
  const [state, setState] = useState(initial?.state ?? "");
  const [supervisorId, setSupervisorId] = useState<string>(initial?.supervisor_id ?? "");
  const [hireDate, setHireDate] = useState(initial?.hire_date ?? "");
  const [active, setActive] = useState(initial?.active_status ?? true);
  const [frequency, setFrequency] = useState<"Quarterly" | "Annual" | "Both">((initial?.evaluation_frequency as any) ?? "Both");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [internalStaff, setInternalStaff] = useState<InternalStaffOption[]>([]);
  const [supervisorName, setSupervisorName] = useState<string>(
    initial?.supervisor_name ?? ""
  );
  const [supervisorPickerOpen, setSupervisorPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, job_title, department, active")
        .eq("active", true)
        .order("display_name", { ascending: true });
      if (cancelled) return;
      setInternalStaff(
        (data ?? []).map((p: any) => ({
          id: p.user_id,
          name: p.display_name || p.email || "Unnamed",
          email: p.email,
          job_title: p.job_title,
          department: p.department,
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const reviewerOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; meta: string }>();
    internalStaff.forEach((s) => {
      map.set(s.id, {
        id: s.id,
        name: s.name,
        meta: [s.job_title, s.department, s.email].filter(Boolean).join(" · "),
      });
    });
    supervisors.forEach((s) => {
      if (!map.has(s.id)) {
        map.set(s.id, {
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          meta: [s.role, s.email].filter(Boolean).join(" · "),
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [internalStaff, supervisors]);

  const selectedReviewerLabel = useMemo(() => {
    if (supervisorId) {
      const found = reviewerOptions.find((o) => o.id === supervisorId);
      if (found) return found.name;
    }
    return supervisorName || "";
  }, [supervisorId, supervisorName, reviewerOptions]);

  async function submit() {
    if (!first.trim() || !last.trim() || !email.trim()) {
      toast({ title: "Missing fields", description: "First name, last name, and email are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const supFromEval = supervisors.find((s) => s.id === supervisorId);
    const supFromInternal = internalStaff.find((s) => s.id === supervisorId);
    const resolvedSupervisorName = supFromEval
      ? `${supFromEval.first_name} ${supFromEval.last_name}`
      : supFromInternal?.name ?? supervisorName ?? null;
    const { error } = await supabase.from("evaluation_staff").insert({
      first_name: first.trim(),
      last_name: last.trim(),
      email: email.trim(),
      phone: phone || null,
      role,
      state: state || null,
      supervisor_id: supFromEval ? supervisorId : null,
      supervisor_name: resolvedSupervisorName || null,
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
    setFirst(""); setLast(""); setEmail(""); setPhone(""); setSupervisorId(""); setSupervisorName(""); setHireDate(""); setNotes("");
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
                  <SelectItem value="Office">Office Staff</SelectItem>
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
              <Popover open={supervisorPickerOpen} onOpenChange={setSupervisorPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal",
                      !selectedReviewerLabel && "text-muted-foreground"
                    )}
                  >
                    {selectedReviewerLabel || "Search internal staff…"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name, title, email…" />
                    <CommandList>
                      <CommandEmpty>No staff found.</CommandEmpty>
                      <CommandGroup heading="Internal staff">
                        {reviewerOptions.length === 0 && (
                          <div className="px-2 py-3 text-xs text-muted-foreground">
                            No internal staff available.
                          </div>
                        )}
                        {reviewerOptions.map((o) => (
                          <CommandItem
                            key={o.id}
                            value={`${o.name} ${o.meta}`}
                            onSelect={() => {
                              setSupervisorId(o.id);
                              setSupervisorName(o.name);
                              setSupervisorPickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                supervisorId === o.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm">{o.name}</span>
                              {o.meta && (
                                <span className="text-xs text-muted-foreground">{o.meta}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {supervisorId && (
                        <CommandGroup heading="Actions">
                          <CommandItem
                            onSelect={() => {
                              setSupervisorId("");
                              setSupervisorName("");
                              setSupervisorPickerOpen(false);
                            }}
                          >
                            Clear selection
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              <p className="text-xs text-muted-foreground">Inactive staff are excluded from upcoming evaluations.</p>
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