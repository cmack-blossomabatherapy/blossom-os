import { useEffect, useRef, useState } from "react";
import { Upload, X as XIcon, FileText as FileTextIcon } from "lucide-react";
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
import {
  LEAD_SOURCE_OPTIONS,
  getLeadSourceOption,
} from "@/lib/leads/leadSourceConfig";
import { FAMILY_LEAD_PIPELINE_STAGES } from "@/lib/intake/intakeWorkflow";
import {
  getRecommendedNextActionForStage,
  getStageDueOffsetDays,
} from "@/lib/intake/intakeWorkflow";
import { IntakeCoordinatorPicker } from "@/components/leads/IntakeCoordinatorPicker";
import { uploadLeadDocument } from "@/lib/leads/leadDocumentStorage";

/**
 * Export 85 — manual lead creation uses the canonical Family / Lead Workflow
 * stages. Legacy Monday-era stages remain readable for imported records but
 * are no longer offered as primary creation options.
 */
const PIPELINE_STAGES = FAMILY_LEAD_PIPELINE_STAGES;

/** ISO yyyy-mm-dd for `today + offsetDays`, local time. */
function offsetDateISO(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}
const TODAY_ISO = () => new Date().toISOString().split("T")[0];

const LEAD_SOURCES = LEAD_SOURCE_OPTIONS.map((o) => o.value);

/** Lead sources where a named referring person/partner should be captured. */
const REFERRAL_PARTNER_SOURCES = new Set([
  "Referral",
  "Referral Partner",
  "Pediatrician",
  "BCBA Referral",
  "Insurance",
  "Business Development",
  "Community Outreach",
]);

/** Lead sources where UTM / campaign attribution is meaningful. */
const UTM_SOURCES = new Set([
  "Website",
  "Google Ads",
  "Facebook Ads",
  "Mailchimp",
  "LeadTrap",
  "Organic",
  "Other",
]);

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;
const PRIORITIES = ["Hot", "Warm", "Cold"] as const;
const CONTACT_METHODS = ["Phone", "Cell", "Text", "Email"] as const;

/** Document categories Intake commonly uploads when creating a lead. */
export const LEAD_DOCUMENT_TYPES = [
  "Insurance Card",
  "Diagnosis",
  "Referral",
  "Intake Packet",
  "Consent Form",
  "Parent Provided Document",
  "Other",
] as const;
export type LeadDocumentType = typeof LEAD_DOCUMENT_TYPES[number];

/** Pending document metadata captured during manual lead creation. */
export interface PendingLeadDocument {
  name: string;
  type: LeadDocumentType;
  size?: number;
  uploadedAt: string;
  storageStatus: "pending_storage_connection" | "uploading" | "uploaded" | "failed";
  storagePath?: string;
  signedUrl?: string;
  errorMessage?: string;
  /**
   * Raw File kept in memory only until the lead is created. Uploaded
   * post-create against the real lead id so a storage failure can never
   * block lead creation.
   */
  file?: File;
}

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
    assignedIntakeCoordinatorUserId:     z.string().uuid().optional().or(z.literal("")),
    assignedIntakeCoordinatorEmployeeId: z.string().uuid().optional().or(z.literal("")),
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

export const EMPTY: FormShape = {
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
  assignedIntakeCoordinatorUserId: "",
  assignedIntakeCoordinatorEmployeeId: "",
  priority: "Warm",
  insurance: "", insuranceType: "", secondaryInsurance: "",
  pipelineStage: "Lead Captured",
  nextAction: getRecommendedNextActionForStage("Lead Captured"),
  nextTaskDue: offsetDateISO(getStageDueOffsetDays("Lead Captured")),
  regularCallLog: "", etCallLog: "", messageComments: "",
  lastContactDate: TODAY_ISO(),
  notes: "", tags: "",
};

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (lead: Lead) => void;
  /** Pre-fill values when the dialog opens (e.g. from a marketing source page). */
  defaults?: Partial<FormShape> & {
    /** Free-form source attribution payload persisted on the new lead. */
    sourceMetadata?: Record<string, unknown>;
  };
}

export function NewLeadDialog({ open, onOpenChange, onCreated, defaults }: NewLeadDialogProps) {
  const isMobile = useIsMobile();
  const { createLead } = useLeads();
  const [form, setForm] = useState<FormShape>({ ...EMPTY, ...defaults });
  // Re-seed when opening so each launch reflects the latest defaults.
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...defaults });
      setDocuments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<PendingLeadDocument[]>([]);

  const update = <K extends keyof FormShape>(k: K, v: FormShape[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  /**
   * When the pipeline stage changes, auto-fill Next Action and Next Task Due
   * from the canonical workflow — but only if the user hasn't manually edited
   * those fields away from the previous stage's auto values.
   */
  const updateStage = (nextStage: string) => {
    setForm((f) => {
      const prevAutoAction = getRecommendedNextActionForStage(f.pipelineStage);
      const prevAutoDue = offsetDateISO(getStageDueOffsetDays(f.pipelineStage));
      const nextAutoAction = getRecommendedNextActionForStage(nextStage);
      const nextAutoDue = offsetDateISO(getStageDueOffsetDays(nextStage));
      const actionIsAuto = !f.nextAction || f.nextAction === prevAutoAction;
      const dueIsAuto = !f.nextTaskDue || f.nextTaskDue === prevAutoDue;
      return {
        ...f,
        pipelineStage: nextStage,
        nextAction: actionIsAuto ? nextAutoAction : f.nextAction,
        nextTaskDue: dueIsAuto ? nextAutoDue : f.nextTaskDue,
      };
    });
  };

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      const first = parsed.error.issues[0];
      const label = first?.path?.[0] ? String(first.path[0]) : "form";
      toast.error("Please fix the highlighted fields", {
        description: `${label}: ${first?.message ?? "Missing or invalid value"}`,
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const v = parsed.data;
      const tags = (v.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
      // Strip the raw File before serializing into source_metadata. The lead
      // is saved first; documents are uploaded post-create (best-effort).
      const stagedDocsMeta = documents.map(({ file: _f, ...rest }) => rest);
      const lead = await createLead({
        patientFirstName: v.patientFirstName || undefined,
        patientLastName:  v.patientLastName  || undefined,
        childName:        v.childName,
        dob:              v.dob || undefined,
        diagnosisStatus:  v.diagnosisStatus || undefined,
        dxNeeded:         v.dxNeeded,

        parentFirstName:  v.parentFirstName  || undefined,
        parentLastName:   v.parentLastName   || undefined,
        parentName:       v.parentName,
        parent2Name:      v.parent2Name      || undefined,
        parent2Email:     v.parent2Email     || undefined,
        phone:            (v.phone || "").trim(),
        parentCellPhone:  v.parentCellPhone  || undefined,
        homePhone:        v.homePhone        || undefined,
        email:            (v.email || "").trim(),
        preferredContactMethod: v.preferredContactMethod || undefined,

        state:        v.state,
        leadSource:   v.leadSource,
        leadType:     v.leadType        || undefined,
        referralSource:   v.referralSource   || undefined,
        referralPartner:  v.referralPartner  || undefined,
        utmSource:    v.utmSource       || undefined,
        utmMedium:    v.utmMedium       || undefined,
        utmCampaign:  v.utmCampaign     || undefined,
        originationDate: v.originationDate || undefined,
        assignedIntakeCoordinator: v.assignedIntakeCoordinator || undefined,
        assignedIntakeCoordinatorUserId:     v.assignedIntakeCoordinatorUserId     || undefined,
        assignedIntakeCoordinatorEmployeeId: v.assignedIntakeCoordinatorEmployeeId || undefined,
        priority: v.priority,

        insurance:        v.insurance         || undefined,
        insuranceType:    v.insuranceType     || undefined,
        secondaryInsurance: v.secondaryInsurance || undefined,

        pipelineStage: v.pipelineStage,
        nextAction:    v.nextAction || undefined,
        nextTaskDue:   v.nextTaskDue || undefined,

        regularCallLog:  v.regularCallLog  || undefined,
        etCallLog:       v.etCallLog       || undefined,
        messageComments: v.messageComments || undefined,
        lastContactDate: v.lastContactDate || undefined,

        notes: v.notes || undefined,
        tags:  tags.length ? tags : undefined,

        documents: stagedDocsMeta.length ? stagedDocsMeta : undefined,

        sourceMetadata: {
          ...(defaults?.sourceMetadata as Record<string, unknown> | undefined),
          created_via:
            (defaults?.sourceMetadata as Record<string, unknown> | undefined)?.created_via ??
            "manual",
          created_at_client: new Date().toISOString(),
          attached_documents: documents.length,
        } as Record<string, unknown>,
      });
      toast.success(`Lead created: ${lead.childName}`, {
        description: `${lead.id.slice(0, 8)} · ${lead.state} · ${lead.source}`,
      });

      // Best-effort: upload any staged files against the real lead id.
      // Failures never invalidate the lead — surface a non-blocking warning
      // toast and leave the failed document metadata in source_metadata so
      // Intake can retry manually.
      const stagedFiles = documents.filter((d) => d.file);
      if (stagedFiles.length) {
        let failures = 0;
        await Promise.all(
          stagedFiles.map(async (d) => {
            try {
              await uploadLeadDocument(d.file as File, { leadId: lead.id, type: d.type });
            } catch (err) {
              failures += 1;
              // eslint-disable-next-line no-console
              console.warn("[leads] post-create document upload failed", d.name, err);
            }
          }),
        );
        if (failures > 0) {
          toast.warning(
            "Lead created. Some documents could not upload and can be added later.",
            { description: `${failures} of ${stagedFiles.length} file(s) failed to upload.` },
          );
        }
      }

      onCreated?.(lead);
      onOpenChange(false);
      setForm(EMPTY);
      setDocuments([]);
    } catch (e: any) {
      // Never leak raw Edge Function / RLS messages here. createLead already
      // throws a user-safe error string; anything else falls back to a
      // generic message.
      const msg = typeof e?.message === "string" && e.message.length < 200
        ? e.message
        : "Please check required fields and try again.";
      toast.error("Could not save lead", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const body = (
    <FormTabs
      form={form}
      update={update}
      updateStage={updateStage}
      errors={errors}
      documents={documents}
      setDocuments={setDocuments}
    />
  );
  const footer = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
      <Button onClick={submit} disabled={submitting}>{submitting ? "Saving…" : "Create lead"}</Button>
    </>
  );

  if (isMobile) {
    return (
      <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
        <div className="flex h-full flex-col overflow-hidden">
          <SheetHeader className="px-5 pb-2 pt-3 text-left">
            <SheetTitle>New lead</SheetTitle>
            <SheetDescription className="text-xs">
              Manually create a lead. Saved to Blossom OS intake.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto border-t border-border/60 px-5 py-4">
            <div className="min-h-[420px]">{body}</div>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-border/60 bg-background px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {footer}
          </SheetFooter>
        </div>
      </ResponsiveSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] h-[82vh] max-h-[820px] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
          <DialogDescription>
            Captures full lead attribution. Persists to Blossom OS intake.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto py-2 pr-1">{body}</div>
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Tabbed form body ---------------------------- */

interface FormBodyProps {
  form: FormShape;
  update: <K extends keyof FormShape>(k: K, v: FormShape[K]) => void;
  updateStage: (stage: string) => void;
  errors: Record<string, string>;
  documents: PendingLeadDocument[];
  setDocuments: (updater: (prev: PendingLeadDocument[]) => PendingLeadDocument[]) => void;
}

function FormTabs({ form, update, updateStage, errors, documents, setDocuments }: FormBodyProps) {
  return (
    <Tabs defaultValue="source" className="w-full">
      <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 h-auto">
        <TabsTrigger value="source"        className="text-[11px]">Source</TabsTrigger>
        <TabsTrigger value="patient"       className="text-[11px]">Patient</TabsTrigger>
        <TabsTrigger value="parent"        className="text-[11px]">Parent</TabsTrigger>
        <TabsTrigger value="insurance"     className="text-[11px]">Insurance</TabsTrigger>
        <TabsTrigger value="workflow"      className="text-[11px]">Workflow</TabsTrigger>
        <TabsTrigger value="communication" className="text-[11px]">Comms</TabsTrigger>
        <TabsTrigger value="documents"     className="text-[11px]">Docs</TabsTrigger>
        <TabsTrigger value="notes"         className="text-[11px]">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="source" className="mt-4">
        <SourceAttributionSummary value={form.leadSource} />
        <Grid>
          <Field label="Lead Source *" error={errors.leadSource}>
            <SelectInput value={form.leadSource} onChange={(v) => update("leadSource", v)} options={LEAD_SOURCES as unknown as string[]} />
          </Field>
          <Field label="Lead Type"><Input className="h-9" value={form.leadType} onChange={(e) => update("leadType", e.target.value)} placeholder="Self-Pay, Insurance, …" /></Field>
          <Field label="State *" error={errors.state}>
            <SelectInput value={form.state} onChange={(v) => update("state", v)} options={STATES as unknown as string[]} />
          </Field>
          <Field label="Priority"><SelectInput value={form.priority} onChange={(v) => update("priority", v as FormShape["priority"])} options={PRIORITIES as unknown as string[]} /></Field>
          <Field label="Origination Date"><Input type="date" className="h-9" value={form.originationDate || ""} onChange={(e) => update("originationDate", e.target.value)} /></Field>
          <Field label="Assigned Intake Coordinator">
            <IntakeCoordinatorPicker
              value={form.assignedIntakeCoordinator || ""}
              onChange={(name, member) => {
                update("assignedIntakeCoordinator", name);
                update("assignedIntakeCoordinatorUserId",     (member?.userId ?? "") as any);
                update("assignedIntakeCoordinatorEmployeeId", (member?.id ?? "") as any);
              }}
              invalid={!!errors.assignedIntakeCoordinator}
            />
            {form.assignedIntakeCoordinator && !form.assignedIntakeCoordinatorEmployeeId && (
              <p className="mt-1 text-[11px] text-amber-600">
                Pick a result from the list so the lead links to the staff member’s user record.
              </p>
            )}
          </Field>
        </Grid>

        {REFERRAL_PARTNER_SOURCES.has(form.leadSource) && (
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Referral attribution</div>
            <Grid>
              <Field label="Referral Partner / Practice">
                <Input className="h-9" value={form.referralPartner || ""} onChange={(e) => update("referralPartner", e.target.value)} placeholder="e.g. Atlanta Pediatrics" />
              </Field>
              <Field label="Referring Contact Name">
                <Input className="h-9" value={form.referralSource || ""} onChange={(e) => update("referralSource", e.target.value)} placeholder="e.g. Dr. Smith" />
              </Field>
            </Grid>
          </div>
        )}

        {UTM_SOURCES.has(form.leadSource) && (
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Campaign attribution (UTM)</div>
            <Grid>
              <Field label="UTM Source"><Input className="h-9" value={form.utmSource || ""} onChange={(e) => update("utmSource", e.target.value)} placeholder="google, facebook, mailchimp…" /></Field>
              <Field label="UTM Medium"><Input className="h-9" value={form.utmMedium || ""} onChange={(e) => update("utmMedium", e.target.value)} placeholder="cpc, paid_social, email…" /></Field>
              <Field label="UTM Campaign" colSpan2><Input className="h-9" value={form.utmCampaign || ""} onChange={(e) => update("utmCampaign", e.target.value)} placeholder="spring-2026-georgia" /></Field>
            </Grid>
          </div>
        )}
      </TabsContent>

      <TabsContent value="patient" className="mt-4">
        <Grid>
          <Field label="Patient First Name"><Input className="h-9" value={form.patientFirstName || ""} onChange={(e) => update("patientFirstName", e.target.value)} /></Field>
          <Field label="Patient Last Name"><Input className="h-9" value={form.patientLastName || ""} onChange={(e) => update("patientLastName", e.target.value)} /></Field>
          <Field label="Name of Patient *" colSpan2 error={errors.childName}><Input className="h-9" value={form.childName} onChange={(e) => update("childName", e.target.value)} placeholder="Full patient name (as known)" /></Field>
          <Field label="Date of Birth"><Input type="date" className="h-9" value={form.dob || ""} onChange={(e) => update("dob", e.target.value)} /></Field>
          <Field label="Diagnosis Status"><Input className="h-9" value={form.diagnosisStatus || ""} onChange={(e) => update("diagnosisStatus", e.target.value)} placeholder="Diagnosed / In Progress / None" /></Field>
          <Field label="DX Needed"><label className="inline-flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={!!form.dxNeeded} onChange={(e) => update("dxNeeded", e.target.checked)} /> Patient needs a diagnosis</label></Field>
        </Grid>
      </TabsContent>

      <TabsContent value="parent" className="mt-4">
        <Grid>
          <Field label="Parents Full Name *" colSpan2 error={errors.parentName}><Input className="h-9" value={form.parentName} onChange={(e) => update("parentName", e.target.value)} /></Field>
          <Field label="Parent First Name"><Input className="h-9" value={form.parentFirstName || ""} onChange={(e) => update("parentFirstName", e.target.value)} /></Field>
          <Field label="Parent Last Name"><Input className="h-9" value={form.parentLastName || ""} onChange={(e) => update("parentLastName", e.target.value)} /></Field>
          <Field label="Parent 2 Name"><Input className="h-9" value={form.parent2Name || ""} onChange={(e) => update("parent2Name", e.target.value)} /></Field>
          <Field label="Parent 2 Email"><Input className="h-9" value={form.parent2Email || ""} onChange={(e) => update("parent2Email", e.target.value)} /></Field>
          <Field label="Phone" error={errors.phone}><Input className="h-9" value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="(404) 555-0100" /></Field>
          <Field label="Parent Cell Phone"><Input className="h-9" value={form.parentCellPhone || ""} onChange={(e) => update("parentCellPhone", e.target.value)} /></Field>
          <Field label="Home Phone"><Input className="h-9" value={form.homePhone || ""} onChange={(e) => update("homePhone", e.target.value)} /></Field>
          <Field label="Email"><Input className="h-9" value={form.email || ""} onChange={(e) => update("email", e.target.value)} /></Field>
          <Field label="Preferred Contact"><SelectInput value={form.preferredContactMethod || "Phone"} onChange={(v) => update("preferredContactMethod", v)} options={CONTACT_METHODS as unknown as string[]} /></Field>
        </Grid>
      </TabsContent>

      <TabsContent value="insurance" className="mt-4">
        <Grid>
          <Field label="Primary Insurance"><Input className="h-9" value={form.insurance || ""} onChange={(e) => update("insurance", e.target.value)} placeholder="BCBS, Aetna, Cigna…" /></Field>
          <Field label="Insurance Type"><Input className="h-9" value={form.insuranceType || ""} onChange={(e) => update("insuranceType", e.target.value)} placeholder="PPO / HMO" /></Field>
          <Field label="Secondary Insurance" colSpan2><Input className="h-9" value={form.secondaryInsurance || ""} onChange={(e) => update("secondaryInsurance", e.target.value)} /></Field>
        </Grid>
      </TabsContent>

      <TabsContent value="workflow" className="mt-4">
        <div className="mb-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          Next Action and Next Task Due auto-fill from the pipeline stage. Edit either field to override.
        </div>
        <Grid>
          <Field label="Pipeline Stage *" error={errors.pipelineStage}>
            <SelectInput
              value={form.pipelineStage}
              onChange={(v) => updateStage(v)}
              options={PIPELINE_STAGES as unknown as string[]}
            />
          </Field>
          <Field
            label="Next Action"
            badge={
              form.nextAction === getRecommendedNextActionForStage(form.pipelineStage) ? "Auto" : undefined
            }
          >
            <Input
              className="h-9"
              value={form.nextAction || ""}
              onChange={(e) => update("nextAction", e.target.value)}
              placeholder={getRecommendedNextActionForStage(form.pipelineStage)}
            />
          </Field>
          <Field
            label="Next Task Due"
            badge={
              form.nextTaskDue === offsetDateISO(getStageDueOffsetDays(form.pipelineStage))
                ? `Auto · ${getStageDueOffsetDays(form.pipelineStage)}d SLA`
                : undefined
            }
          >
            <Input
              type="date"
              className="h-9"
              value={form.nextTaskDue || ""}
              onChange={(e) => update("nextTaskDue", e.target.value)}
            />
          </Field>
          <Field label="Last Contact Date" badge="Auto">
            <Input
              type="date"
              className="h-9 bg-muted/40 cursor-not-allowed"
              value={form.lastContactDate || TODAY_ISO()}
              disabled
              readOnly
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Set automatically — this is the contact being created.
            </p>
          </Field>
        </Grid>
      </TabsContent>

      <TabsContent value="communication" className="mt-4">
        <div className="space-y-3">
          <Field label="Regular Call Log"><Textarea rows={3} value={form.regularCallLog || ""} onChange={(e) => update("regularCallLog", e.target.value)} placeholder="Notes from standard intake calls." /></Field>
          <Field label="E/T Call Log"><Textarea rows={3} value={form.etCallLog || ""} onChange={(e) => update("etCallLog", e.target.value)} placeholder="Evening / after-hours call notes." /></Field>
          <Field label="Message / Comments"><Textarea rows={3} value={form.messageComments || ""} onChange={(e) => update("messageComments", e.target.value)} placeholder="Internal context about the family." /></Field>
        </div>
      </TabsContent>

      <TabsContent value="documents" className="mt-4">
        <DocumentsTab documents={documents} setDocuments={setDocuments} />
      </TabsContent>

      <TabsContent value="notes" className="mt-4">
        <div className="space-y-3">
          <Field label="Internal Notes"><Textarea rows={5} value={form.notes || ""} onChange={(e) => update("notes", e.target.value)} placeholder="Anything the intake team should know." /></Field>
          <Field label="Tags (comma-separated)"><Input className="h-9" value={form.tags || ""} onChange={(e) => update("tags", e.target.value)} placeholder="vip, spanish-speaking, …" /></Field>
        </div>
      </TabsContent>
    </Tabs>
  );
}

/* ------------------------------ tiny helpers ------------------------------ */

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  children,
  error,
  colSpan2,
  badge,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  colSpan2?: boolean;
  badge?: string;
}) {
  return (
    <div className={colSpan2 ? "sm:col-span-2" : ""}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        {badge && (
          <span className="text-[10px] uppercase tracking-wide font-medium text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-1">{children}</div>
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function SourceAttributionSummary({ value }: { value: string }) {
  const opt = getLeadSourceOption(value);
  if (!opt) return null;
  const connector = opt.integrationId ? `Future connector: ${opt.integrationId}` : "Future connector: manual";
  const origin = opt.journeyOrigin ?? "Manual";
  return (
    <div className="mb-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
      <span className="font-medium text-foreground">Source: {opt.label}</span>
      <span className="mx-2">·</span>
      <span>{connector}</span>
      <span className="mx-2">·</span>
      <span>Patient Lifetime Journey origin: {origin}</span>
      {opt.description && <div className="mt-1 text-[11px]">{opt.description}</div>}
    </div>
  );
}

/* ------------------------- Document upload (Docs tab) ------------------------- */

function formatBytes(n?: number) {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsTab({
  documents,
  setDocuments,
}: {
  documents: PendingLeadDocument[];
  setDocuments: (updater: (prev: PendingLeadDocument[]) => PendingLeadDocument[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stagedType, setStagedType] = useState<LeadDocumentType>("Insurance Card");

  /**
   * Stage files locally only. The lead does not exist yet, so we never call
   * storage here — that removes the "pending" leadId upload path entirely.
   * Files are uploaded post-create in `submit()` against the real lead id.
   */
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const now = new Date().toISOString();
    const queued: PendingLeadDocument[] = Array.from(files).map((f) => ({
      name: f.name,
      type: stagedType,
      size: f.size,
      uploadedAt: now,
      storageStatus: "pending_storage_connection",
      file: f,
    }));
    setDocuments((prev) => [...prev, ...queued]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground">
        Files are recorded against this lead now. Permanent storage will activate
        once the document storage connection is enabled — current status: <strong>pending storage connection</strong>.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr]">
        <div>
          <Label className="text-xs">Document type</Label>
          <Select value={stagedType} onValueChange={(v) => setStagedType(v as LeadDocumentType)}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAD_DOCUMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Files</Label>
          <div
            className="mt-1 flex h-9 cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed border-border/70 bg-card px-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
            onClick={() => inputRef.current?.click()}
          >
            <span className="inline-flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Add files</span>
            <span className="text-[10px]">PDF, JPG, PNG, DOCX…</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
          No documents attached yet. Pick a document type and add files above.
        </div>
      ) : (
        <ul className="space-y-2">
          {documents.map((d, i) => (
            <li
              key={`${d.name}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                  <FileTextIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground" title={d.name}>{d.name}</p>
                  <p className="text-[10.5px] text-muted-foreground">
                    {d.type}{d.size ? ` · ${formatBytes(d.size)}` : ""} ·{" "}
                    {d.storageStatus === "uploaded"
                      ? "Stored securely"
                      : d.storageStatus === "uploading"
                        ? "Uploading…"
                        : d.storageStatus === "failed"
                          ? <span className="text-destructive">Upload failed{d.errorMessage ? ` — ${d.errorMessage}` : ""}</span>
                          : "Pending"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setDocuments((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${d.name}`}
              >
                <XIcon className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
