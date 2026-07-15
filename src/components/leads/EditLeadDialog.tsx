import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Lead } from "@/data/leads";
import { useLeads } from "@/contexts/LeadsContext";
import { supabase } from "@/integrations/supabase/client";
import { FAMILY_LEAD_PIPELINE_STAGES } from "@/lib/intake/intakeWorkflow";

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;
const PRIORITIES = ["Hot", "Warm", "Cold"] as const;
const CONTACT_METHODS = ["Phone", "Cell", "Text", "Email"] as const;

const schema = z.object({
  childName: z.string().trim().min(1, "Patient name required").max(120),
  parentName: z.string().trim().min(1, "Parent/guardian name required").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().max(160).optional().or(z.literal("")),
  parentCellPhone: z.string().trim().max(40).optional().or(z.literal("")),
  homePhone: z.string().trim().max(40).optional().or(z.literal("")),
  preferredContactMethod: z.string().optional(),
  state: z.string().min(2),
  priority: z.enum(PRIORITIES),
  pipelineStage: z.string().min(1),
  insurance: z.string().max(120).optional().or(z.literal("")),
  insuranceType: z.string().max(60).optional().or(z.literal("")),
  secondaryInsurance: z.string().max(120).optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  referralSource: z.string().max(160).optional().or(z.literal("")),
  referralPartner: z.string().max(160).optional().or(z.literal("")),
  nextAction: z.string().max(160).optional().or(z.literal("")),
  nextTaskDue: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  tags: z.string().max(400).optional().or(z.literal("")),
});

type FormShape = z.input<typeof schema>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function initialForm(lead: Lead): FormShape {
  const i = lead.intake ?? {};
  return {
    childName: lead.childName ?? "",
    parentName: lead.parentName ?? "",
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    parentCellPhone: i.parentCellPhone ?? "",
    homePhone: i.homePhone ?? "",
    preferredContactMethod: i.preferredContactMethod ?? "Phone",
    state: lead.state ?? "GA",
    priority: (lead.priority as (typeof PRIORITIES)[number]) ?? "Warm",
    pipelineStage: lead.status ?? "Lead Captured",
    insurance: lead.primaryInsurance ?? lead.insurance ?? "",
    insuranceType: lead.insuranceType ?? "",
    secondaryInsurance: lead.secondaryInsurance ?? i.secondaryInsurance ?? "",
    dob: i.dob ?? "",
    referralSource: i.referralSource ?? "",
    referralPartner: i.referralPartner ?? "",
    nextAction: lead.nextAction ?? "",
    nextTaskDue: lead.nextTaskDue ?? "",
    notes: lead.notes ?? "",
    tags: (lead.tags ?? []).join(", "),
  };
}

interface EditLeadDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLeadDialog({ lead, open, onOpenChange }: EditLeadDialogProps) {
  const { updateLead } = useLeads();
  const [form, setForm] = useState<FormShape>(() => initialForm(lead));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isPersisted = UUID_RE.test(lead.id);

  useEffect(() => {
    if (open) {
      setForm(initialForm(lead));
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead.id]);

  const update = <K extends keyof FormShape>(k: K, v: FormShape[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const errCls = (k: keyof FormShape) => (errors[k as string] ? "border-destructive" : "");

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      const first = parsed.error.issues[0];
      toast.error("Please fix the highlighted fields", {
        description: `${String(first?.path?.[0] ?? "form")}: ${first?.message ?? ""}`,
      });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const v = parsed.data;
      const tags = (v.tags || "").split(",").map((t) => t.trim()).filter(Boolean);

      // Update local context so the drawer + table reflect changes immediately.
      updateLead(lead.id, {
        childName: v.childName,
        parentName: v.parentName,
        phone: (v.phone || "").trim(),
        email: (v.email || "").trim(),
        state: v.state,
        priority: v.priority,
        status: v.pipelineStage as Lead["status"],
        insurance: v.insurance || "",
        primaryInsurance: v.insurance || "",
        insuranceType: v.insuranceType || "",
        secondaryInsurance: v.secondaryInsurance || "",
        nextAction: v.nextAction || lead.nextAction,
        nextTaskDue: v.nextTaskDue || lead.nextTaskDue,
        notes: v.notes || "",
        tags: tags.length ? tags : [],
        intake: {
          ...(lead.intake ?? {}),
          dob: v.dob || null,
          parentCellPhone: v.parentCellPhone || null,
          homePhone: v.homePhone || null,
          preferredContactMethod: v.preferredContactMethod || null,
          referralSource: v.referralSource || null,
          referralPartner: v.referralPartner || null,
          secondaryInsurance: v.secondaryInsurance || null,
        },
      });

      // Persist to intake_leads if this is a real DB record.
      if (isPersisted) {
        const patch: Record<string, unknown> = {
          child_name: v.childName,
          parent_name: v.parentName,
          phone: (v.phone || "").trim() || null,
          email: (v.email || "").trim() || null,
          parent_cell_phone: v.parentCellPhone || null,
          home_phone: v.homePhone || null,
          preferred_contact_method: v.preferredContactMethod || null,
          state: v.state,
          priority: v.priority,
          pipeline_stage: v.pipelineStage,
          insurance: v.insurance || null,
          insurance_type: v.insuranceType || null,
          secondary_insurance: v.secondaryInsurance || null,
          dob: v.dob || null,
          referral_source: v.referralSource || null,
          referral_partner: v.referralPartner || null,
          next_action: v.nextAction || null,
          next_task_due: v.nextTaskDue || null,
          notes: v.notes || null,
          tags,
        };
        const { error } = await supabase
          .from("intake_leads")
          .update(patch as never)
          .eq("id", lead.id);
        if (error) throw error;

        // Log the edit so it shows up in the activity tab.
        void supabase.from("intake_communications").insert({
          lead_id: lead.id,
          communication_type: "note",
          direction: "internal",
          subject: "Lead edited",
          preview: "Lead details updated from drawer.",
          logged_by_name: "Intake",
        } as never);
      }

      toast.success("Lead updated");
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error && e.message.length < 200 ? e.message : "Please try again.";
      toast.error("Could not save changes", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] h-[82vh] max-h-[820px] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit lead</DialogTitle>
          <DialogDescription>
            Update lead details. {isPersisted ? "Changes save to the database." : "Local changes only — this lead isn't synced yet."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-2 pr-1 space-y-5">
          <section className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Patient name</Label>
              <Input className={errCls("childName")} value={form.childName} onChange={(e) => update("childName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Parent / guardian</Label>
              <Input className={errCls("parentName")} value={form.parentName} onChange={(e) => update("parentName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Date of birth</Label>
              <Input type="date" value={form.dob ?? ""} onChange={(e) => update("dob", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>State</Label>
              <Select value={form.state} onValueChange={(v) => update("state", v)}>
                <SelectTrigger className={errCls("state")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Parent cell</Label>
              <Input value={form.parentCellPhone ?? ""} onChange={(e) => update("parentCellPhone", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Home phone</Label>
              <Input value={form.homePhone ?? ""} onChange={(e) => update("homePhone", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Preferred contact</Label>
              <Select value={form.preferredContactMethod ?? "Phone"} onValueChange={(v) => update("preferredContactMethod", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTACT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => update("priority", v as (typeof PRIORITIES)[number])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Pipeline stage</Label>
              <Select value={form.pipelineStage} onValueChange={(v) => update("pipelineStage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FAMILY_LEAD_PIPELINE_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Next action</Label>
              <Input value={form.nextAction ?? ""} onChange={(e) => update("nextAction", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Next task due</Label>
              <Input type="date" value={form.nextTaskDue ?? ""} onChange={(e) => update("nextTaskDue", e.target.value)} />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Primary insurance</Label>
              <Input value={form.insurance ?? ""} onChange={(e) => update("insurance", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Insurance type</Label>
              <Input value={form.insuranceType ?? ""} onChange={(e) => update("insuranceType", e.target.value)} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Secondary insurance</Label>
              <Input value={form.secondaryInsurance ?? ""} onChange={(e) => update("secondaryInsurance", e.target.value)} />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Referral source</Label>
              <Input value={form.referralSource ?? ""} onChange={(e) => update("referralSource", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Referral partner</Label>
              <Input value={form.referralPartner ?? ""} onChange={(e) => update("referralPartner", e.target.value)} />
            </div>
          </section>

          <section className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} />
          </section>
          <section className="space-y-1">
            <Label>Tags (comma separated)</Label>
            <Input value={form.tags ?? ""} onChange={(e) => update("tags", e.target.value)} />
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}