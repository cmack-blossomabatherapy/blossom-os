import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ResponsiveSheet, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/responsive-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lead } from "@/data/leads";
import { useLeads } from "@/contexts/LeadsContext";
import { toast } from "sonner";

const PIPELINE_STAGES = [
  "New Lead", "In Contact", "Sent Form", "Missing Information", "Form Received",
  "Sent to VOB", "VOB Completed", "Can't Reach", "Sent Packet - Can't Reach",
  "Can Not Submit Auth", "Getting DX", "Needs DX", "Non-Qualified",
] as const;

const LEAD_SOURCES = [
  "Website", "Phone", "Facebook", "Referral", "Ads", "Organic", "Digital",
  "Insurance", "Google Ads", "LeadTrap", "CTM",
] as const;

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;
const PRIORITIES = ["Hot", "Warm", "Cold"] as const;
const CONTACT_METHODS = ["Phone", "Cell", "Text", "Email"] as const;

const schema = z
  .object({
    // Patient
    patientFirstName: z.string().trim().max(80).optional().or(z.literal("")),
    patientLastName:  z.string().trim().max(80).optional().or(z.literal("")),
    childName:        z.string().trim().min(1, "Patient name required").max(120),
    dob:              z.string().optional().or(z.literal("")),
    diagnosisStatus:  z.string().max(80).optional().or(z.literal("")),
    dxNeeded:         z.boolean().optional(),
    // Parent
    parentFirstName:  z.string().trim().max(80).optional().or(z.literal("")),
    parentLastName:   z.string().trim().max(80).optional().or(z.literal("")),
    parentName:       z.string().trim().min(1, "Parent/guardian name required").max(160),
    parent2Name:      z.string().trim().max(160).optional().or(z.literal("")),
    parent2Email:     z.string().trim().email("Invalid email").optional().or(z.literal("")),
    phone:            z.string().trim().max(40).optional().or(z.literal("")),
    parentCellPhone:  z.string().trim().max(40).optional().or(z.literal("")),
    homePhone:        z.string().trim().max(40).optional().or(z.literal("")),
    email:            z.string().trim().max(160).optional().or(z.literal("")),
    preferredContactMethod: z.string().optional(),
    // Source / ownership
    state:        z.string().min(2),
    leadSource:   z.string().min(1, "Lead source required"),
    leadType:     z.string().max(80).optional().or(z.literal("")),
    referralSource:   z.string().max(160).optional().or(z.literal("")),
    referralPartner:  z.string().max(160).optional().or(z.literal("")),
    utmSource:    z.string().max(160).optional().or(z.literal("")),
    utmMedium:    z.string().max(160).optional().or(z.literal("")),
    utmCampaign:  z.string().max(160).optional().or(z.literal("")),
    originationDate: z.string().optional().or(z.literal("")),
    assignedIntakeCoordinator: z.string().max(160).optional().or(z.literal("")),
    priority: z.enum(PRIORITIES),
    // Insurance
    insurance:        z.string().max(120).optional().or(z.literal("")),
    insuranceType:    z.string().max(60).optional().or(z.literal("")),
    secondaryInsurance: z.string().max(120).optional().or(z.literal("")),
    // Workflow
    pipelineStage: z.string().min(1, "Pipeline stage required"),
    nextAction:    z.string().max(160).optional().or(z.literal("")),
    nextTaskDue:   z.string().optional().or(z.literal("")),
    // Communication
    regularCallLog:  z.string().max(2000).optional().or(z.literal("")),
    etCallLog:       z.string().max(2000).optional().or(z.literal("")),
    messageComments: z.string().max(2000).optional().or(z.literal("")),
    lastContactDate: z.string().optional().or(z.literal("")),
    // Notes
    notes: z.string().max(2000).optional().or(z.literal("")),
    tags:  z.string().max(400).optional().or(z.literal("")),
  })
  .refine((v) => (v.phone && v.phone.length >= 7) || (v.email && v.email.includes("@")), {
    message: "Phone or email required",
    path: ["phone"],
  });

type FormShape = z.input<typeof schema>;

const EMPTY: FormShape = {
  patientFirstName: "", patientLastName: "", childName: "", dob: "",
  diagnosisStatus: "", dxNeeded: false,
  parentFirstName: "", parentLastName: "", parentName: "",
  parent2Name: "", parent2Email: "",
  phone: "", parentCellPhone: "", homePhone: "", email: "",
  preferredContactMethod: "Phone",
  state: "GA", leadSource: "Website", leadType: "",
  referralSource: "", referralPartner: "",
  utmSource: "", utmMedium: "", utmCampaign: "",
  originationDate: new Date().toISOString().split("T")[0],
  assignedIntakeCoordinator: "",
  priority: "Warm",
  insurance: "", insuranceType: "", secondaryInsurance: "",
  pipelineStage: "New Lead", nextAction: "Contact Lead", nextTaskDue: "",
  regularCallLog: "", etCallLog: "", messageComments: "", lastContactDate: "",
  notes: "", tags: "",
};

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (lead: Lead) => void;
}

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
