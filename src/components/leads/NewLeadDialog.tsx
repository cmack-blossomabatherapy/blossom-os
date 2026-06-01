import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ResponsiveSheet, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/responsive-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultFinancialFields, Lead, LeadSource, Priority } from "@/data/leads";
import { useLeads } from "@/contexts/LeadsContext";
import { toast } from "sonner";

const schema = z.object({
  childName: z.string().trim().min(1, "Child name required").max(80),
  parentName: z.string().trim().min(1, "Parent name required").max(80),
  phone: z.string().trim().min(7, "Phone required").max(20),
  email: z.string().trim().email("Invalid email").max(120),
  state: z.string().min(2).max(3),
  source: z.string(),
  priority: z.string(),
  childAge: z.string().trim().max(20),
  insurance: z.string().trim().min(1, "Insurance required").max(60),
  insuranceType: z.string().trim().max(40),
  notes: z.string().max(500).optional(),
});

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (lead: Lead) => void;
}

const sources: LeadSource[] = ["Website", "Phone", "Facebook", "Referral", "Ads", "Organic", "Digital", "Insurance"];
const priorities: Priority[] = ["Hot", "Warm", "Cold"];
const states = ["GA", "NC", "VA", "TN", "MD", "NJ"];
const owners = ["Sarah M.", "James R.", "Maya P."];

export function NewLeadDialog({ open, onOpenChange, onCreated }: NewLeadDialogProps) {
  const isMobile = useIsMobile();
  const { addLead } = useLeads();
  const [form, setForm] = useState({
    childName: "", parentName: "", phone: "", email: "",
    state: "GA", source: "Website" as LeadSource, priority: "Warm" as Priority,
    childAge: "", insurance: "", insuranceType: "PPO", notes: "",
    owner: owners[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    const id = `L-${Math.floor(1100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const newLead: Lead = {
      id,
      childName: form.childName.trim(),
      parentName: form.parentName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      state: form.state,
      source: form.source,
      status: "New Lead",
      owner: form.owner,
      priority: form.priority,
      childAge: form.childAge || "—",
      formStatus: "Not Sent",
      consentStatus: "Not Sent",
      vobStatus: "Not Started",
      formReviewStatus: "Pending",
      insurance: form.insurance.trim(),
      insuranceType: form.insuranceType,
      ...defaultFinancialFields(form.insurance.trim()),
      createdAt: now,
      updatedAt: now,
      lastContacted: null,
      daysInStage: 0,
      nextAction: "Make first contact",
      nextTaskDue: now.split("T")[0],
      lastActivity: "Lead created manually",
      payor: form.insurance.trim(),
      coverageType: form.insuranceType,
      paymentPlanNeeded: false,
      initialFormLink: `https://app.pandadoc.com/intake/${id}`,
      notes: form.notes,
      tags: [],
      timeline: [{ id: "t1", type: "system", description: "Lead created manually", timestamp: now, user: form.owner }],
      tasks: [],
      documents: [],
      communications: [],
      automationLog: ["Lead created manually"],
    };
    addLead(newLead);
    toast.success(`Lead created: ${newLead.childName}`, { description: `${newLead.id} · assigned to ${newLead.owner}` });
    onCreated?.(newLead);
    onOpenChange(false);
    setForm({
      childName: "", parentName: "", phone: "", email: "",
      state: "GA", source: "Website", priority: "Warm",
      childAge: "", insurance: "", insuranceType: "PPO", notes: "", owner: owners[0],
    });
  };

  return (
    isMobile ? (
      <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
        <div className="flex h-full flex-col overflow-hidden">
          <SheetHeader className="px-5 pb-2 pt-3 text-left">
            <SheetTitle>New lead</SheetTitle>
            <SheetDescription className="text-xs">
              Manually create a lead. Form starts in <strong>New Lead</strong> stage.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto border-t border-border/60 px-5 py-4">
            <FormBody form={form} update={update} errors={errors} />
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-border/60 bg-background px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1" onClick={submit}>Create lead</Button>
          </SheetFooter>
        </div>
      </ResponsiveSheet>
    ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
          <DialogDescription>Manually create a lead. Form starts in <strong>New Lead</strong> stage.</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <FormBody form={form} update={update} errors={errors} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    )
  );
}

function FormBody({ form, update, errors }: { form: any; update: (k: any, v: any) => void; errors: Record<string, string> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Child name *</Label>
            <Input value={form.childName} onChange={(e) => update("childName", e.target.value)} className="h-9" />
            {errors.childName && <p className="text-[11px] text-destructive mt-1">{errors.childName}</p>}
          </div>
          <div>
            <Label className="text-xs">Parent name *</Label>
            <Input value={form.parentName} onChange={(e) => update("parentName", e.target.value)} className="h-9" />
            {errors.parentName && <p className="text-[11px] text-destructive mt-1">{errors.parentName}</p>}
          </div>
          <div>
            <Label className="text-xs">Phone *</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(404) 555-0100" className="h-9" />
            {errors.phone && <p className="text-[11px] text-destructive mt-1">{errors.phone}</p>}
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input value={form.email} onChange={(e) => update("email", e.target.value)} className="h-9" />
            {errors.email && <p className="text-[11px] text-destructive mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label className="text-xs">Child age</Label>
            <Input value={form.childAge} onChange={(e) => update("childAge", e.target.value)} placeholder="3y 4m" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">State</Label>
            <Select value={form.state} onValueChange={(v) => update("state", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Source</Label>
            <Select value={form.source} onValueChange={(v) => update("source", v as LeadSource)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Priority</Label>
            <Select value={form.priority} onValueChange={(v) => update("priority", v as Priority)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{priorities.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Insurance *</Label>
            <Input value={form.insurance} onChange={(e) => update("insurance", e.target.value)} placeholder="BCBS" className="h-9" />
            {errors.insurance && <p className="text-[11px] text-destructive mt-1">{errors.insurance}</p>}
          </div>
          <div>
            <Label className="text-xs">Insurance type</Label>
            <Input value={form.insuranceType} onChange={(e) => update("insuranceType", e.target.value)} placeholder="PPO" className="h-9" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Assigned coordinator</Label>
            <Select value={form.owner} onValueChange={(v) => update("owner", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{owners.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
  );
}
