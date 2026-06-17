import {
  defaultFinancialFields, FINANCIAL_OWNER, type Lead, type LeadSource, type LeadStatus,
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
}

function mapStage(stage: string | null): LeadStatus {
  const s = (stage || "").trim();
  // intake_pipeline_stage enum values map 1:1 to LeadStatus where possible.
  switch (s) {
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
    default:                       return "New Lead";
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

/** Convert a public.intake_leads row into the Lead shape the UI uses. */
export function intakeLeadRowToLead(row: IntakeLeadRow): Lead {
  const now = new Date().toISOString();
  const created = row.created_at ?? now;
  const updated = row.updated_at ?? created;
  const stage = mapStage(row.pipeline_stage);
  const owner = row.assigned_intake_coordinator || "Unassigned";

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
    childAge:   "—",
    formStatus:        "Not Sent",
    consentStatus:     "Not Sent",
    vobStatus:         "Not Started",
    formReviewStatus:  "Pending",
    insurance:      row.insurance      || "",
    insuranceType:  row.insurance_type || "",
    ...defaultFinancialFields(row.insurance || ""),
    financialOwner: FINANCIAL_OWNER,
    createdAt: created,
    updatedAt: updated,
    lastContacted: null,
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
    documents: [],
    communications: [],
    automationLog: [],
  };
}