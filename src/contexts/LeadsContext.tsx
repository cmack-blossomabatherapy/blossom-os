import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { createIntakeTask, FINANCIAL_OWNER, INTAKE_COORDINATORS, Lead, LeadStatus, TimelineEvent } from "@/data/leads";
import { supabase } from "@/integrations/supabase/client";
import { mondayRowToLead, type MondayLeadRow } from "@/lib/leads/mondayMapper";
import { intakeLeadRowToLead, type IntakeLeadRow } from "@/lib/leads/intakeLeadMapper";

/** Columns selected from public.intake_leads — must include every extended field
 *  read by IntakeLeadRow / intakeLeadRowToLead so the round-trip is lossless. */
const INTAKE_LEADS_SELECT =
  "id, child_name, parent_name, phone, email, state, lead_source, pipeline_stage, " +
  "assigned_intake_coordinator, priority, notes, insurance, insurance_type, next_action, " +
  "next_task_due, created_at, updated_at, stage_entered_at, monday_item_id, monday_group, " +
  "tags, source_metadata, original_column_data, " +
  // Monday board–style extended columns (Phase D round-trip).
  "patient_first_name, patient_last_name, dob, parent_first_name, parent_last_name, " +
  "parent_2_name, parent_2_email, parent_cell_phone, home_phone, preferred_contact_method, " +
  "lead_type, utm_source, utm_medium, utm_campaign, referral_source, referral_partner, " +
  "origination_date, last_contact_date, regular_call_log, et_call_log, message_comments, " +
  "secondary_insurance, diagnosis_status, dx_needed";

/** Input accepted by createLead — mirrors the Monday Leads board fields. */
export interface CreateLeadInput {
  // Patient
  patientFirstName?: string;
  patientLastName?: string;
  childName: string;            // "Name of Patient" (required)
  dob?: string;                 // ISO date
  diagnosisStatus?: string;
  dxNeeded?: boolean;

  // Parent / Guardian
  parentFirstName?: string;
  parentLastName?: string;
  parentName: string;           // "Parents Full Name" (required)
  parent2Name?: string;
  parent2Email?: string;
  phone: string;                // either phone or email required
  parentCellPhone?: string;
  homePhone?: string;
  email: string;
  preferredContactMethod?: string;

  // Lead source / ownership
  state: string;
  leadSource: string;
  leadType?: string;
  referralSource?: string;
  referralPartner?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  originationDate?: string;
  assignedIntakeCoordinator?: string;
  priority?: "Hot" | "Warm" | "Cold";

  // Insurance
  insurance?: string;
  insuranceType?: string;
  secondaryInsurance?: string;

  // Workflow
  pipelineStage: string;
  nextAction?: string;
  nextTaskDue?: string;

  // Communication
  regularCallLog?: string;
  etCallLog?: string;
  messageComments?: string;
  lastContactDate?: string;

  // Notes / tags
  notes?: string;
  tags?: string[];

  /**
   * Optional documents captured during manual lead creation. These are
   * front-end metadata only until Cloud Storage is connected — see
   * `storageStatus: "pending_storage_connection"`.
   */
  documents?: Array<{
    name: string;
    type: string;
    size?: number;
    uploadedAt: string;
    storageStatus?: "pending_storage_connection" | "uploaded";
  }>;

  // Source attribution payload for future integrations.
  sourceMetadata?: Record<string, unknown>;
  originalColumnData?: Record<string, unknown>;
}

interface LeadsContextValue {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getLead: (id: string) => Lead | undefined;
  /** @deprecated local-only insert kept for legacy callers — use createLead. */
  addLead: (lead: Lead) => void;
  /** Persist a new lead to public.intake_leads + first task / communication. */
  createLead: (input: CreateLeadInput) => Promise<Lead>;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  bulkUpdate: (ids: string[], patch: Partial<Lead>) => void;
  moveStage: (ids: string[], status: LeadStatus) => void;
  revertStage: (
    id: string,
    previousStatus: LeadStatus,
    previousDaysInStage: number,
    automationLogEntry: string,
  ) => void;
  assignOwner: (ids: string[], owner: string) => void;
  addTag: (ids: string[], tag: string) => void;
  deleteLeads: (ids: string[]) => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

const makeTimelineEvent = (description: string): TimelineEvent => ({
  id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: "system",
  description,
  timestamp: new Date().toISOString(),
  user: "You",
});

/**
 * Phase F — write a lightweight activity row to `intake_communications`. Best
 * effort: monday/imported leads have no `intake_leads` row so the FK insert
 * will fail, and that's fine — we swallow errors here so UI flow never breaks.
 */
function logLeadActivity(
  leadId: string,
  communicationType: "call" | "sms" | "email" | "note",
  preview: string,
  loggedByName?: string,
) {
  // Skip non-UUID ids (monday-imported leads, mock data).
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(leadId)) return;
  void supabase
    .from("intake_communications")
    .insert({
      lead_id: leadId,
      communication_type: communicationType,
      direction: "outbound",
      preview,
      logged_by_name: loggedByName ?? "Blossom OS",
    } as never)
    .then(() => undefined, () => undefined);
}

/** Phase D — fire-and-forget persistence helper for intake_leads updates. */
function persistLeadPatch(leadId: string, patch: Record<string, unknown>) {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(leadId)) return;
  void supabase.from("intake_leads").update(patch as never).eq("id", leadId)
    .then(() => undefined, () => undefined);
}

const leastLoadedCoordinator = (leads: Lead[]) => {
  const counts = INTAKE_COORDINATORS.map((owner) => ({ owner, count: leads.filter((lead) => lead.owner === owner).length }));
  return counts.sort((a, b) => a.count - b.count)[0]?.owner ?? INTAKE_COORDINATORS[0];
};

const withIntakeAutomation = (lead: Lead, patch: Partial<Lead>): Lead => {
  const next: Lead = { ...lead, ...patch, updatedAt: new Date().toISOString() };
  const tasks = [...next.tasks];
  const log: string[] = [];

  if (patch.formStatus === "Sent") {
    next.status = "Sent Form";
    next.nextAction = "Follow up on intake packet";
    log.push("PandaDoc intake form sent");
  }
  if (patch.formStatus === "Complete" || patch.formStatus === "Completed") {
    next.status = "Form Received";
    next.nextAction = "Review intake packet";
    ["Review Intake Packet", "Set Insurance", "Set Form Review Status"].forEach((title) => tasks.push(createIntakeTask(title, next.owner)));
    log.push("Intake form completed — review tasks created");
  }
  if (patch.formReviewStatus === "Missing Info" || patch.formReviewStatus === "Missing Information") {
    next.status = "Missing Information";
    next.nextAction = "Collect missing info";
    tasks.push(createIntakeTask("Collect Missing Info", next.owner, 1));
    log.push("Missing information loop started");
  }
  if (patch.formReviewStatus === "Complete" && next.status === "Form Received") {
    next.status = "Sent to VOB";
    next.vobStatus = next.vobStatus === "Not Started" ? "Sent" : next.vobStatus;
    next.nextAction = "Add to Eligipro and CentralReach";
    tasks.push(createIntakeTask("Add to Eligipro", next.owner), createIntakeTask("Add to CentralReach", next.owner));
    log.push("Form review complete — sent to VOB");
  }
  if (patch.vobStatus === "Received") {
    next.status = "VOB Completed";
    next.nextAction = "Review VOB decision";
    log.push("VOB received");
  }
  if (patch.vobStatus === "Approved" || patch.vobStatus === "Payment Plan Required") {
    next.status = "VOB Completed";
    next.paymentPlanNeeded = patch.vobStatus === "Payment Plan Required";
    next.nextAction = "Ready for client conversion";
    log.push("Ready for client conversion");
  }
  if (patch.status === "Can Not Submit Auth") {
    tasks.push(createIntakeTask("Collect Missing Documentation", next.owner, 1));
    next.nextAction = "Collect missing documentation";
  }

  if (patch.status === "Sent to VOB") {
    next.vobStatus = "Sent";
    next.financialOwner = FINANCIAL_OWNER;
    next.nextAction = "Submit to Solum, Eligipro, and CentralReach";
    tasks.push(createIntakeTask("Submit to Solum", FINANCIAL_OWNER), createIntakeTask("Add to Eligipro", FINANCIAL_OWNER), createIntakeTask("Add to CentralReach", FINANCIAL_OWNER));
    log.push("VOB sent — financial gate tasks created");
  }
  if (patch.vobStatus === "Received" || patch.vobFile) {
    next.vobStatus = "Received";
    next.financialStatus = "Pending Review";
    next.nextAction = "Financial review by Gabi";
    log.push("VOB received — moved to financial review");
  }
  if (patch.financialStatus === "Approved") {
    next.status = "VOB Completed";
    next.vobStatus = next.vobStatus === "Not Started" ? "Received" : next.vobStatus;
    next.paymentPlanNeeded = false;
    next.paymentPlanStatus = "Not Required";
    next.nextAction = "Move to Client Pipeline";
    log.push("Financial decision approved — ready for client pipeline");
  }
  if (patch.financialStatus === "Payment Plan Required") {
    next.paymentPlanNeeded = true;
    next.paymentPlanStatus = next.paymentPlanSent ? "Awaiting Signature" : "Not Required";
    next.nextAction = "Send payment plan and confirm signature";
    tasks.push(createIntakeTask("Send Payment Plan", FINANCIAL_OWNER), createIntakeTask("Follow Up with Family", FINANCIAL_OWNER, 2), createIntakeTask("Confirm Payment Plan Signed", FINANCIAL_OWNER, 3));
    log.push("Payment plan required — finance tasks created");
  }
  if (patch.financialStatus === "Not Viable") {
    next.status = "Non-Qualified";
    next.notQualifiedReason = next.financialDecisionNotes || "Financially not viable";
    next.nextAction = "Notify intake and leadership";
    log.push("Case rejected as not viable");
  }
  if (patch.paymentPlanSent) {
    next.paymentPlanStatus = "Awaiting Signature";
    next.nextAction = "Follow up with family on payment plan";
  }
  if (patch.paymentPlanSigned) {
    next.paymentPlanStatus = "Signed";
    next.financialStatus = "Approved";
    next.status = "VOB Completed";
    next.nextAction = "Move to Client Pipeline";
    log.push("Payment plan signed — ready for client pipeline");
  }

  if (patch.status && patch.status !== lead.status) next.daysInStage = 0;
  return {
    ...next,
    tasks,
    timeline: log.length ? [makeTimelineEvent(log[log.length - 1]), ...next.timeline] : next.timeline,
    automationLog: log.length ? [...next.automationLog, ...log] : next.automationLog,
  };
};

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Load canonical Blossom OS intake_leads first (newest first).
      const intakeRes = await supabase
        .from("intake_leads")
        .select(INTAKE_LEADS_SELECT)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (intakeRes.error) throw intakeRes.error;
      const intakeLeads = (intakeRes.data ?? []).map((r) => intakeLeadRowToLead(r as unknown as IntakeLeadRow));

      // 2) Load Monday imports (legacy staging). Page through up to ~5k rows.
      const mondayRows: MondayLeadRow[] = [];
      const pageSize = 1000;
      let from = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error: qErr } = await supabase
          .from("monday_leads_raw")
          .select("id, monday_item_id, monday_group, name, state, status, owner, data, imported_at, updated_at")
          .order("imported_at", { ascending: false })
          .range(from, from + pageSize - 1);
        if (qErr) throw qErr;
        const rows = (data ?? []) as unknown as MondayLeadRow[];
        mondayRows.push(...rows);
        if (rows.length < pageSize || mondayRows.length >= 5000) break;
        from += pageSize;
      }

      // 3) De-dupe — drop Monday rows already converted into intake_leads
      // (matched by monday_item_id, or by phone+email+child name fingerprint).
      const seenMondayIds = new Set(
        intakeLeads.map((l) => (l as Lead & { _mondayId?: string })._mondayId).filter(Boolean) as string[],
      );
      const seenFingerprints = new Set(
        intakeLeads.map((l) => `${l.phone}|${l.email}|${l.childName}`.toLowerCase()),
      );
      const mondayLeads = mondayRows
        .filter((r) => !(r.monday_item_id && seenMondayIds.has(r.monday_item_id)))
        .map(mondayRowToLead)
        .filter((l) => !seenFingerprints.has(`${l.phone}|${l.email}|${l.childName}`.toLowerCase()));

      setLeads([...intakeLeads, ...mondayLeads]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load leads");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const getLead = useCallback((id: string) => leads.find((l) => l.id === id), [leads]);

  const addLead = useCallback((lead: Lead) => {
    setLeads((prev) => {
      const owner = lead.owner || leastLoadedCoordinator(prev);
      const created = withIntakeAutomation({ ...lead, owner, status: "New Lead", nextAction: "Contact Lead", tasks: lead.tasks.length ? lead.tasks : [createIntakeTask("Contact Lead", owner)] }, {});
      return [created, ...prev];
    });
  }, []);

  const createLead = useCallback(async (input: CreateLeadInput): Promise<Lead> => {
    // Compose the row exactly as the intake_leads schema expects.
    const today = new Date().toISOString().split("T")[0];
    // Export 84 — sanitize attached-document metadata into source_metadata so
    // it survives a page refresh until Cloud Storage / a docs table exists.
    const sanitizedAttachedDocs = (input.documents ?? []).map((d) => ({
      name: d.name,
      type: d.type,
      size: typeof d.size === "number" ? d.size : undefined,
      uploadedAt: d.uploadedAt,
      storageStatus: d.storageStatus ?? "pending_storage_connection",
    }));
    const mergedSourceMetadata: Record<string, unknown> = {
      ...(input.sourceMetadata ?? {}),
      ...(sanitizedAttachedDocs.length
        ? { attached_documents: sanitizedAttachedDocs }
        : {}),
    };
    const insertPayload: Record<string, unknown> = {
      child_name:  input.childName.trim(),
      parent_name: input.parentName.trim(),
      phone:       input.phone.trim(),
      email:       input.email.trim(),
      state:       input.state,
      lead_source: input.leadSource,
      pipeline_stage: input.pipelineStage,
      priority:    input.priority ?? "Warm",
      assigned_intake_coordinator: input.assignedIntakeCoordinator ?? null,
      insurance:      input.insurance ?? null,
      insurance_type: input.insuranceType ?? null,
      notes:          input.notes ?? null,
      next_action:    input.nextAction ?? "Contact Lead",
      next_task_due:  input.nextTaskDue ?? today,

      // New Monday-board–style columns.
      patient_first_name: input.patientFirstName ?? null,
      patient_last_name:  input.patientLastName ?? null,
      dob:                input.dob ?? null,
      parent_first_name:  input.parentFirstName ?? null,
      parent_last_name:   input.parentLastName ?? null,
      parent_2_name:      input.parent2Name ?? null,
      parent_2_email:     input.parent2Email ?? null,
      parent_cell_phone:  input.parentCellPhone ?? null,
      home_phone:         input.homePhone ?? null,
      preferred_contact_method: input.preferredContactMethod ?? null,
      lead_type:          input.leadType ?? null,
      utm_source:         input.utmSource ?? null,
      utm_medium:         input.utmMedium ?? null,
      utm_campaign:       input.utmCampaign ?? null,
      referral_source:    input.referralSource ?? null,
      referral_partner:   input.referralPartner ?? null,
      origination_date:   input.originationDate ?? today,
      last_contact_date:  input.lastContactDate ?? null,
      regular_call_log:   input.regularCallLog ?? null,
      et_call_log:        input.etCallLog ?? null,
      message_comments:   input.messageComments ?? null,
      secondary_insurance: input.secondaryInsurance ?? null,
      diagnosis_status:   input.diagnosisStatus ?? null,
      dx_needed:          input.dxNeeded ?? false,
      tags:               input.tags && input.tags.length ? input.tags : ["Blossom OS"],
      source_metadata:    mergedSourceMetadata,
      original_column_data: input.originalColumnData ?? {},
    };

    const { data, error: insErr } = await supabase
      .from("intake_leads")
      .insert(insertPayload as never)
      .select(INTAKE_LEADS_SELECT)
      .single();
    if (insErr || !data) {
      throw insErr ?? new Error("Failed to create lead");
    }
    const row = data as unknown as IntakeLeadRow;
    const baseLead = intakeLeadRowToLead(row);
    const lead: Lead = input.documents && input.documents.length
      ? {
          ...baseLead,
          documents: [
            ...(baseLead.documents ?? []),
            ...input.documents.map((d) => ({
              name: d.name,
              type: d.type,
              uploadedAt: d.uploadedAt,
              // url is omitted until Cloud Storage is connected.
            })),
          ],
          automationLog: [
            ...baseLead.automationLog,
            ...input.documents.map((d) => `Document attached: ${d.name} (${d.type})`),
          ],
        }
      : baseLead;

    // Best-effort first task + communication. These are optional — RLS errors
    // shouldn't block the new lead from showing up.
    void supabase.from("intake_tasks").insert({
      lead_id: row.id,
      title: "Contact Lead",
      owner: input.assignedIntakeCoordinator ?? null,
      due_date: input.nextTaskDue ?? today,
      workflow_step: "New Lead",
    } as never).then(() => undefined, () => undefined);

    const commPreview =
      input.regularCallLog || input.etCallLog || input.messageComments;
    if (commPreview) {
      void supabase.from("intake_communications").insert({
        lead_id: row.id,
        communication_type: input.regularCallLog || input.etCallLog ? "call" : "note",
        direction: "outbound",
        preview: commPreview,
        logged_by_name: input.assignedIntakeCoordinator ?? "Intake",
      } as never).then(() => undefined, () => undefined);
    }

    // Lead created — activity event for the lifetime journey.
    logLeadActivity(row.id, "note", `Lead created via Blossom OS (${input.leadSource})`, input.assignedIntakeCoordinator ?? "Intake");

    setLeads((prev) => [lead, ...prev]);
    return lead;
  }, []);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? withIntakeAutomation(l, patch) : l)));
  }, []);

  const bulkUpdate = useCallback((ids: string[], patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)));
  }, []);

  const moveStage = useCallback((ids: string[], status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => {
      if (!ids.includes(l.id)) return l;
      const event = makeTimelineEvent(`Stage moved to ${status}`);
      logLeadActivity(l.id, "note", `Stage moved from ${l.status} → ${status}`);
      persistLeadPatch(l.id, { pipeline_stage: status });
      return {
        ...l,
        status,
        daysInStage: 0,
        automationLog: [...l.automationLog, `Stage moved to ${status} (manual)`],
        timeline: [event, ...l.timeline],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const revertStage = useCallback((
    id: string,
    previousStatus: LeadStatus,
    previousDaysInStage: number,
    automationLogEntry: string,
  ) => {
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const log = [...l.automationLog];
      const idx = log.lastIndexOf(automationLogEntry);
      if (idx >= 0) log.splice(idx, 1);
      log.push(`Stage move undone — restored to ${previousStatus}`);
      const event = makeTimelineEvent(`Move undone — restored to ${previousStatus}`);
      return {
        ...l,
        status: previousStatus,
        daysInStage: previousDaysInStage,
        automationLog: log,
        timeline: [event, ...l.timeline],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const assignOwner = useCallback((ids: string[], owner: string) => {
    setLeads((prev) => prev.map((l) => {
      if (!ids.includes(l.id)) return l;
      logLeadActivity(l.id, "note", `Owner reassigned: ${l.owner || "Unassigned"} → ${owner}`);
      persistLeadPatch(l.id, { assigned_intake_coordinator: owner });
      return { ...l, owner, automationLog: [...l.automationLog, `Reassigned to ${owner}`] };
    }));
  }, []);

  const addTag = useCallback((ids: string[], tag: string) => {
    setLeads((prev) => prev.map((l) => {
      if (!ids.includes(l.id)) return l;
      const next = Array.from(new Set([...(l.tags ?? []), tag]));
      if (next.length !== (l.tags ?? []).length) {
        logLeadActivity(l.id, "note", `Tag added: ${tag}`);
        persistLeadPatch(l.id, { tags: next });
      }
      return { ...l, tags: next };
    }));
  }, []);

  const deleteLeads = useCallback((ids: string[]) => {
    setLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
  }, []);

  const value = useMemo(
    () => ({ leads, loading, error, refresh, getLead, addLead, createLead, updateLead, bulkUpdate, moveStage, revertStage, assignOwner, addTag, deleteLeads }),
    [leads, loading, error, refresh, getLead, addLead, createLead, updateLead, bulkUpdate, moveStage, revertStage, assignOwner, addTag, deleteLeads],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within <LeadsProvider>");
  return ctx;
}
