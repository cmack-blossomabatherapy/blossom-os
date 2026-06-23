import {
  defaultFinancialFields, FINANCIAL_OWNER, type Lead, type LeadIntakeFields, type LeadSource, type LeadStatus,
  type Priority,
} from "@/data/leads";

/** Subset of public.intake_leads we read for the leads UI. */
export interface IntakeLeadRow {
  id: string;
  child_name: string | null;
  parent_name: string | null;
  phone: string | null;
  email: string | null;
  state: string | null;
  lead_source: string | null;
  pipeline_stage: string | null;
  assigned_intake_coordinator: string | null;
  priority: string | null;
  notes: string | null;
  insurance: string | null;
  insurance_type: string | null;
  next_action: string | null;
  next_task_due: string | null;
  created_at: string | null;
  updated_at: string | null;
  stage_entered_at: string | null;
  monday_item_id: string | null;
  monday_group: string | null;
  tags: string[] | null;
  source_metadata: Record<string, unknown> | null;
  original_column_data: Record<string, unknown> | null;

  // Monday-board–style extended columns.
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  dob?: string | null;
  parent_first_name?: string | null;
  parent_last_name?: string | null;
  parent_2_name?: string | null;
  parent_2_email?: string | null;
  parent_cell_phone?: string | null;
  home_phone?: string | null;
  preferred_contact_method?: string | null;
  lead_type?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referral_source?: string | null;
  referral_partner?: string | null;
  origination_date?: string | null;
  last_contact_date?: string | null;
  regular_call_log?: string | null;
  et_call_log?: string | null;
  message_comments?: string | null;
  secondary_insurance?: string | null;
  diagnosis_status?: string | null;
  dx_needed?: boolean | null;
}

function mapStage(stage: string | null): LeadStatus {
  const s = (stage || "").trim();
  // intake_pipeline_stage enum values map 1:1 to LeadStatus where possible.
  // Export 85 — every canonical Family / Lead Workflow stage is preserved
  // 1:1 alongside the legacy Monday-era stages. Unknown/null values default
  // to the canonical entry point "Lead Captured" (NOT "New Lead").
  switch (s) {
    // Canonical Family / Lead Workflow stages (Export 78+).
    case "Lead Captured":                       return "Lead Captured";
    case "First Contact Attempt":               return "First Contact Attempt";
    case "Engagement Track":                    return "Engagement Track";
    case "Qualification":                       return "Qualification";
    case "Intake Packet Sent":                  return "Intake Packet Sent";
    case "Intake Packet Follow Up":             return "Intake Packet Follow Up";
    case "Intake Packet Follow up":             return "Intake Packet Follow Up";
    case "Intake Complete":                     return "Intake Complete";
    case "Benefits Verification":               return "Benefits Verification";
    case "Assessment Scheduling":               return "Assessment Scheduling";
    case "QA / Treatment Plan Authorization":   return "QA / Treatment Plan Authorization";
    case "Authorization Pending":               return "Authorization Pending";
    case "Staffing Match":                      return "Staffing Match";
    case "Ready to Start Services":             return "Ready to Start Services";
    // Legacy Monday-era stages (preserved for imported records).
    case "New Lead":               return "New Lead";
    case "In Contact":             return "In Contact";
    case "Sent Form":              return "Sent Form";
    case "Missing Information":    return "Missing Information";
    case "Form Received":          return "Form Received";
    case "Sent to VOB":            return "Sent to VOB";
    case "VOB Completed":          return "VOB Completed";
    case "Can't Reach":            return "Can't Reach";
    case "Can Not Submit Auth":    return "Can Not Submit Auth";
    case "Sent Packet - Can't Reach": return "Sent Packet - Can't Reach";
    case "Non-Qualified":          return "Non-Qualified";
    case "Getting DX":             return "Getting DX";
    case "Needs DX":               return "Needs DX";
    default:                       return "Lead Captured";
  }
}

function mapSource(s: string | null): LeadSource {
  const v = (s || "").toLowerCase();
  if (v.includes("referral"))    return "Referral";
  if (v.includes("facebook") || v.includes("meta")) return "Facebook";
  if (v.includes("organic"))     return "Organic";
  if (v.includes("ad"))          return "Ads";
  if (v.includes("phone") || v.includes("call")) return "Phone";
  if (v.includes("insurance"))   return "Insurance";
  if (v.includes("digital"))     return "Digital";
  return "Website";
}

function mapPriority(p: string | null): Priority {
  const v = (p || "").toLowerCase();
  if (v === "hot")  return "Hot";
  if (v === "cold") return "Cold";
  return "Warm";
}

/**
 * Export 84 — read sanitized attached-document metadata that
 * `LeadsContext.createLead` stashes in `source_metadata.attached_documents`
 * until Cloud Storage is connected. Returns documents in the Lead shape.
 */
export function extractAttachedDocuments(
  sourceMetadata: Record<string, unknown> | null | undefined,
): { name: string; type: string; url?: string; uploadedAt?: string }[] {
  const raw = sourceMetadata && (sourceMetadata as Record<string, unknown>)["attached_documents"];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
    .map((d) => ({
      name: String(d.name ?? "Untitled document"),
      type: String(d.type ?? "Other"),
      uploadedAt: typeof d.uploadedAt === "string" ? d.uploadedAt : undefined,
    }));
}

/** Convert a public.intake_leads row into the Lead shape the UI uses. */
export function intakeLeadRowToLead(row: IntakeLeadRow): Lead {
  const now = new Date().toISOString();
  const created = row.created_at ?? now;
  const updated = row.updated_at ?? created;
  const stage = mapStage(row.pipeline_stage);
  const owner = row.assigned_intake_coordinator || "Unassigned";

  const intake: LeadIntakeFields = {
    patientFirstName: row.patient_first_name ?? null,
    patientLastName: row.patient_last_name ?? null,
    dob: row.dob ?? null,
    parentFirstName: row.parent_first_name ?? null,
    parentLastName: row.parent_last_name ?? null,
    parent2Name: row.parent_2_name ?? null,
    parent2Email: row.parent_2_email ?? null,
    parentCellPhone: row.parent_cell_phone ?? null,
    homePhone: row.home_phone ?? null,
    preferredContactMethod: row.preferred_contact_method ?? null,
    leadType: row.lead_type ?? null,
    utmSource: row.utm_source ?? null,
    utmMedium: row.utm_medium ?? null,
    utmCampaign: row.utm_campaign ?? null,
    referralSource: row.referral_source ?? null,
    referralPartner: row.referral_partner ?? null,
    originationDate: row.origination_date ?? null,
    lastContactDate: row.last_contact_date ?? null,
    regularCallLog: row.regular_call_log ?? null,
    etCallLog: row.et_call_log ?? null,
    messageComments: row.message_comments ?? null,
    secondaryInsurance: row.secondary_insurance ?? null,
    diagnosisStatus: row.diagnosis_status ?? null,
    dxNeeded: row.dx_needed ?? null,
    mondayItemId: row.monday_item_id ?? null,
    mondayGroup: row.monday_group ?? null,
    sourceMetadata: row.source_metadata ?? null,
    originalColumnData: row.original_column_data ?? null,
  };

  return {
    id: row.id,
    childName:  row.child_name  || "—",
    parentName: row.parent_name || "—",
    phone:      row.phone       || "",
    email:      row.email       || "",
    state:      row.state       || "GA",
    source:     mapSource(row.lead_source),
    status:     stage,
    owner,
    priority:   mapPriority(row.priority),
    childAge:   row.dob ?? "—",
    formStatus:        "Not Sent",
    consentStatus:     "Not Sent",
    vobStatus:         "Not Started",
    formReviewStatus:  "Pending",
    insurance:      row.insurance      || "",
    insuranceType:  row.insurance_type || "",
    ...defaultFinancialFields(row.insurance || ""),
    secondaryInsurance: row.secondary_insurance ?? undefined,
    financialOwner: FINANCIAL_OWNER,
    createdAt: created,
    updatedAt: updated,
    lastContacted: row.last_contact_date ?? null,
    daysInStage: row.stage_entered_at
      ? Math.max(0, Math.round((Date.now() - new Date(row.stage_entered_at).getTime()) / 86_400_000))
      : 0,
    nextAction:  row.next_action    || "Contact Lead",
    nextTaskDue: row.next_task_due  || null,
    lastActivity: row.monday_item_id ? "Imported from Monday" : "Created in Blossom OS",
    payor:        row.insurance      || "",
    coverageType: row.insurance_type || "",
    paymentPlanNeeded: false,
    notes: row.notes || "",
    tags: row.tags || (row.monday_item_id ? ["Imported"] : ["Blossom OS"]),
    timeline: [{
      id: `tl-${row.id}`,
      type: "system",
      description: row.monday_item_id ? "Imported from Monday" : "Lead created in Blossom OS",
      timestamp: created,
      user: owner,
    }],
    tasks: [],
    documents: extractAttachedDocuments(row.source_metadata),
    communications: [],
    automationLog: [],
    intake,
  };
}