import { useEffect, useRef, useState } from "react";
import {
  X, Phone, Mail, MapPin, Calendar, FileText, Activity, Sparkles,
  CheckCircle2, AlertCircle, ChevronRight, ExternalLink, StickyNote,
  Send, ShieldCheck, Ban, UserX, ListChecks, Plus, MailPlus,
  Upload, Trash2, CalendarClock, Building2, User as UserIcon, Link2, Unlink,
} from "lucide-react";
import type { Lead } from "@/data/leads";
import { useLeads } from "@/contexts/LeadsContext";
import { useLeadUpdates } from "@/hooks/useLeadUpdates";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  findBenefitsCheatSheetForLead,
  mapCheatSheetStatusToTone,
} from "@/lib/intake/leadBenefitsCheatSheets";
import {
  notifyCommunicationResult,
  sendLeadEmail,
} from "@/lib/integrations/communications/communicationAdapters";
import type { EmailTemplateKey } from "@/lib/integrations/communications/communicationTypes";
import { LeadContactActions } from "@/components/leads/LeadContactActions";
import {
  FAMILY_LEAD_PIPELINE_STAGES,
  canonicalFamilyLeadStage,
} from "@/lib/intake/intakeWorkflow";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";
import { IntakeCoordinatorPicker } from "@/components/leads/IntakeCoordinatorPicker";
import { AddLeadNoteDialog } from "@/components/leads/AddLeadNoteDialog";
import { CreateLeadTaskDialog } from "@/components/leads/CreateLeadTaskDialog";
import { LinkReferralDialog } from "@/components/leads/LinkReferralDialog";
import { useLeadDocuments } from "@/hooks/useLeadDocuments";
import { useLeadReferralLink } from "@/hooks/useLeadReferralLink";
import { Button } from "@/components/ui/button";

const STAGE_DETAILS: Record<string, { what: string; involves: string[]; owner: string }> = {
  "Lead Captured": {
    what: "Inquiry received from a parent, referral source, or marketing channel.",
    involves: ["Source attribution logged", "Auto-assigned to intake coordinator", "Welcome SMS/email queued"],
    owner: "Intake Coordinator",
  },
  "First Contact Attempt": {
    what: "Initial outreach within the SLA (call + email + SMS).",
    involves: ["First call attempt", "Voicemail + follow-up text", "Logged in activity timeline"],
    owner: "Intake Coordinator",
  },
  "Engagement Track": {
    what: "Family is responsive; nurturing toward qualification.",
    involves: ["Discovery conversation", "Cadenced touchpoints", "Education on ABA process"],
    owner: "Intake Coordinator",
  },
  "Qualification": {
    what: "Confirm diagnosis, insurance, and service area fit.",
    involves: ["Diagnosis confirmation", "Insurance captured", "State / region eligibility"],
    owner: "Intake Coordinator",
  },
  "Intake Packet Sent": {
    what: "Digital intake packet delivered to the family.",
    involves: ["Packet emailed", "Reminders scheduled", "Tracking link active"],
    owner: "Intake Coordinator",
  },
  "Intake Packet Follow Up": {
    what: "Chasing missing documents or signatures.",
    involves: ["Daily follow-up cadence", "Document checklist review", "Escalation if stalled 5+ days"],
    owner: "Intake Coordinator",
  },
  "Intake Complete": {
    what: "All required intake documents collected and verified.",
    involves: ["Packet QA review", "Hand-off to Benefits Verification", "Family notified"],
    owner: "Intake Coordinator",
  },
  "Benefits Verification": {
    what: "Insurance benefits verified and summarized for the family.",
    involves: ["VOB submitted via Solum", "Benefit summary built", "Financial responsibility communicated"],
    owner: "Benefits Team",
  },
  "Assessment Scheduling": {
    what: "Initial assessment booked with a BCBA.",
    involves: ["BCBA matched", "Family availability confirmed", "Assessment on calendar"],
    owner: "Scheduling Team",
  },
  "QA / Treatment Plan Authorization": {
    what: "Assessment complete; treatment plan in QA before submission.",
    involves: ["BCBA writes treatment plan", "QA review", "Plan ready for auth submission"],
    owner: "QA / Authorization",
  },
  "Authorization Pending": {
    what: "Treatment plan submitted to payer; awaiting authorization.",
    involves: ["Auth submitted", "Payer follow-up cadence", "Auth window tracked"],
    owner: "Authorization Team",
  },
  "Staffing Match": {
    what: "Authorization received; matching RBT(s) to the client.",
    involves: ["RBT match by availability + skill", "Family availability confirmed", "Schedule drafted"],
    owner: "Staffing Team",
  },
  "Ready to Start Services": {
    what: "Client fully onboarded and ready for first session.",
    involves: ["Start date confirmed", "Welcome packet sent", "Hand-off to clinical team"],
    owner: "Clinical Operations",
  },
};

type Tab = "overview" | "insurance" | "documents" | "activity" | "actions";

function relTime(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < 60 * 1000) return "just now";
  if (diff < 60 * 60 * 1000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d ago`;
  return d.toLocaleDateString();
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || <span className="text-muted-foreground">-</span>}</p>
    </div>
  );
}

function ActionButton({
  icon: Icon, label, onClick, tone = "default",
}: { icon: any; label: string; onClick: () => void; tone?: "default" | "danger" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 h-11 text-sm font-medium",
        "hover:bg-muted transition",
        tone === "danger" && "text-destructive hover:bg-destructive/5",
      )}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

export function LeadDetailDrawer({
  leadId, onClose, focusStage,
}: { leadId: string | null; onClose: () => void; focusStage?: string | null }) {
  const { leads, updateLead } = useLeads();
  const lead = leads.find((l) => l.id === leadId) ?? null;
  const [tab, setTab] = useState<Tab>("overview");
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null);
  const { updates, loading: updatesLoading } = useLeadUpdates(lead?.childName, lead?.id ?? null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState<false | "task" | "follow_up">(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    docs: uploadedDocs,
    loading: docsLoading,
    upload: uploadDoc,
    remove: removeDoc,
  } = useLeadDocuments(lead?.id ?? null);
  const { link: referralLink, linkReferral, unlink: unlinkReferral } = useLeadReferralLink(lead?.id ?? null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch raw monday data blob for richer fields not on the Lead type.
  useEffect(() => {
    if (!lead) { setRaw(null); return; }
    setTab("overview");
    supabase
      .from("monday_leads_raw")
      .select("data")
      .eq("monday_item_id", lead.id)
      .maybeSingle()
      .then(({ data }) => setRaw((data?.data as Record<string, unknown>) ?? null));
  }, [lead?.id]);

  if (!lead) return null;

  const str = (k: string) => {
    const v = raw?.[k];
    if (v === null || v === undefined) return "";
    return String(v).trim();
  };
  // Prefer the structured intake_leads value; fall back to the monday raw blob.
  const fallback = (intakeValue: string | null | undefined, mondayKey: string) => {
    const v = (intakeValue ?? "").toString().trim();
    if (v) return v;
    return str(mondayKey);
  };
  const i = lead.intake ?? {};
  const link = (k: string) => {
    const v = str(k);
    return v && /^https?:\/\//i.test(v) ? v : null;
  };

  // Export 84 — merge legacy Monday URL fields with Blossom OS attached
  // documents from `lead.documents` (which may not have a URL yet while
  // Cloud Storage is still being wired in).
  type DrawerDoc = {
    label: string;
    url: string | null;
    type?: string | null;
    uploadedAt?: string | null;
    storageStatus?: "pending_storage_connection" | "uploaded" | null;
  };
  const mondayDocs: DrawerDoc[] = [
    { label: "Insurance card (front)", url: link("Primary Insurance Card - Front") },
    { label: "Insurance card (back)", url: link("Primary Insurance Card - Back") },
    { label: "Secondary card (front)", url: link("Secondary Insurance Card - Front") },
    { label: "Secondary card (back)", url: link("Secondary Insurance Card - Back") },
    { label: "Intake packet", url: link("Intake Packet") },
    { label: "Consent form", url: link("Consent Form Link") },
    { label: "VOB", url: link("VOB") },
  ].filter((d) => d.url);
  const attachedDocs: DrawerDoc[] = (lead.documents ?? []).map((d) => ({
    label: d.name,
    url: d.url ?? null,
    type: d.type,
    uploadedAt: d.uploadedAt ?? null,
    storageStatus: d.url ? "uploaded" : "pending_storage_connection",
  }));
  const documents: DrawerDoc[] = [...mondayDocs, ...attachedDocs];

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isPersisted = UUID_RE.test(lead.id);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!isPersisted) {
      toast.error("This lead isn't synced to the database yet.");
      return;
    }
    setUploading(true);
    try {
      await uploadDoc(files);
      toast.success("Document uploaded");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Lead details for ${lead.childName}`}
        className={cn(
          "fixed right-0 top-0 z-50 h-screen w-full max-w-[560px] flex flex-col",
          "bg-background border-l border-border shadow-2xl",
          "animate-in slide-in-from-right duration-300",
        )}
      >
        {/* Header */}
        <header className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary font-medium">
              {lead.childName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold tracking-tight truncate">{lead.childName}</h2>
              <p className="text-xs text-muted-foreground truncate">
                {lead.parentName || "-"} · {lead.state || "-"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">Owner</span>
                <div className="min-w-[200px] max-w-[280px] flex-1">
                  <IntakeCoordinatorPicker
                    value={lead.owner || ""}
                    onChange={(name, member) => {
                      updateLead(lead.id, {
                        owner: name || "Unassigned",
                        automationLog: [
                          `Intake: assigned to ${name || "Unassigned"}`,
                          ...lead.automationLog,
                        ],
                      });
                      if (isPersisted) {
                        void supabase.from("intake_leads").update({
                          assigned_intake_coordinator: name || null,
                          assigned_intake_coordinator_employee_id: member?.id ?? null,
                          assigned_intake_coordinator_user_id: member?.userId ?? null,
                        } as never).eq("id", lead.id);
                        void supabase.from("intake_communications").insert({
                          lead_id: lead.id,
                          communication_type: "note",
                          direction: "internal",
                          subject: "Assignment changed",
                          preview: `Assigned to ${name || "Unassigned"}`,
                          logged_by_name: "Intake",
                        } as never);
                      }
                      toast.success(name ? `Assigned to ${name}` : "Unassigned");
                    }}
                    placeholder="Assign intake staff"
                  />
                </div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full size-9 grid place-items-center hover:bg-muted transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-foreground font-medium">
              {lead.status}
            </span>
            <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
              Form: {lead.formStatus}
            </span>
            <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
              Benefits: {lead.vobStatus}
            </span>
            {lead.notQualifiedReason && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                Not qualified
              </span>
            )}
          </div>

          {/* Pipeline progress strip */}
          <PipelineProgress status={lead.status} focusStage={focusStage ?? null} />

          {/* Quick contact */}
          <LeadContactActions
            className="mt-4"
            lead={{
              id: lead.id,
              phone: lead.phone,
              email: lead.email,
              parentName: lead.parentName,
              childName: lead.childName,
              state: lead.state,
            }}
          />
        </header>

        {/* Tabs */}
        <nav className="px-6 pt-3 border-b border-border/60 flex items-center gap-1 overflow-x-auto">
          {([
            ["overview", "Overview"],
            ["insurance", "Insurance / Benefits"],
            ["documents", "Documents"],
            ["activity", "Activity"],
            ["actions", "Actions"],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "px-3 py-2 text-[13px] font-medium rounded-lg transition whitespace-nowrap",
                tab === id ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {tab === "overview" && (
            <>
              <section className="grid grid-cols-2 gap-4">
                <Field label="Patient" value={lead.childName} />
                <Field label="DOB / Age" value={`${fallback(i.dob, "DOB") || "-"}${lead.childAge && lead.childAge !== "-" ? ` - ${lead.childAge}` : ""}`} />
                <Field label="Gender" value={str("Gender")} />
                <Field label="State" value={lead.state} />
                <Field label="Parent name" value={lead.parentName} />
                <Field label="Relationship" value={str("Relationship to Patient")} />
                <Field label="Cell phone" value={fallback(i.parentCellPhone, "Parent Cell Phone") || lead.phone} />
                <Field label="Home phone" value={fallback(i.homePhone, "Home Phone")} />
                <Field label="Email" value={lead.email} />
                <Field label="Zip" value={str("Zip Code")} />
              </section>
              <Field label="Address" value={str("Address")} />

              <section className="rounded-2xl bg-muted/60 border border-border/60 p-4 space-y-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Parent / Guardian</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Parent 1 first" value={i.parentFirstName} />
                  <Field label="Parent 1 last" value={i.parentLastName} />
                  <Field label="Parent 2 name" value={i.parent2Name} />
                  <Field label="Parent 2 email" value={i.parent2Email} />
                  <Field label="Preferred contact" value={i.preferredContactMethod} />
                </div>
              </section>

              <section className="rounded-2xl bg-muted/60 border border-border/60 p-4 space-y-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Intake</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Lead type" value={fallback(i.leadType, "Lead Type")} />
                  <Field label="Source" value={fallback(i.referralSource, "How did you hear about us") || lead.source} />
                  <Field label="UTM source" value={fallback(i.utmSource, "UTM Source")} />
                  <Field label="Intake person" value={lead.owner} />
                  <Field label="Origination" value={fallback(i.originationDate, "Origination Date")} />
                  <Field label="Last contact" value={fallback(i.lastContactDate, "Last Contact") || (lead.lastContacted ? new Date(lead.lastContacted).toLocaleDateString() : "-")} />
                </div>
                <Field label="E/T Call Log" value={fallback(i.etCallLog, "E/T Call Log")} />
                <Field label="Reg Call Log" value={fallback(i.regularCallLog, "Reg Call Log")} />
                <Field label="Next action" value={lead.nextAction} />
              </section>

              <section className="rounded-2xl bg-muted/60 border border-border/60 p-4 space-y-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Source & Attribution</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Lead source" value={lead.source} />
                  <Field label="Lead type" value={i.leadType} />
                  <Field label="UTM source" value={i.utmSource} />
                  <Field label="UTM medium" value={i.utmMedium} />
                  <Field label="UTM campaign" value={i.utmCampaign} />
                  <Field label="Referral source" value={i.referralSource} />
                  <Field label="Referral partner" value={i.referralPartner} />
                  <Field label="Created via" value={i.mondayItemId ? "Monday import" : "Blossom OS"} />
                </div>
              </section>

              {(fallback(i.messageComments, "Message/Comments")) && (
                <section className="rounded-2xl border border-border/60 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{fallback(i.messageComments, "Message/Comments")}</p>
                </section>
              )}
            </>
          )}

          {tab === "insurance" && (
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Primary insurance" value={lead.primaryInsurance} />
                <Field label="Primary ID" value={str("Primary Insurance ID")} />
                <Field label="Insurance type" value={lead.insuranceType} />
                <Field label="Secondary insurance" value={lead.secondaryInsurance || i.secondaryInsurance} />
                <Field label="Secondary ID" value={str("Secondary Insurance ID")} />
                <Field label="Policyholder" value={str("Name of Insured Policyholder")} />
                <Field label="Diagnosis status" value={i.diagnosisStatus} />
                <Field label="DX needed" value={i.dxNeeded == null ? undefined : i.dxNeeded ? "Yes" : "No"} />
              </div>
              <BenefitsCheatSheetMatchPanel
                insurance={
                  lead.primaryInsurance ||
                  (lead as unknown as { insurance?: string }).insurance ||
                  str("Primary Insurance") ||
                  str("Insurance")
                }
                state={lead.state || str("State")}
              />
              <div className="rounded-2xl bg-muted/60 border border-border/60 p-4 space-y-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Benefits Verification</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Benefits status" value={lead.vobStatus} />
                  <Field label="Payment plan" value={lead.paymentPlanNeeded ? "Required" : "Not required"} />
                  <Field label="Form status" value={lead.formStatus} />
                  <Field label="Form review" value={lead.formReviewStatus} />
                  <Field label="Consent" value={lead.consentStatus} />
                  <Field label="DX" value={str("DX")} />
                </div>
                {str("Missing Information") && (
                  <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm text-amber-900 dark:text-amber-200 flex gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Packet follow up / missing info:</span> {str("Missing Information")}</span>
                  </div>
                )}
                {lead.notQualifiedReason && (
                  <div className="mt-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive flex gap-2">
                    <Ban className="h-4 w-4 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Not qualified:</span> {lead.notQualifiedReason}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "documents" && (
            <section className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">No documents on file.</p>
              ) : documents.map((d, idx) => {
                const meta = [
                  d.type,
                  d.uploadedAt ? `Uploaded ${new Date(d.uploadedAt).toLocaleDateString()}` : null,
                ].filter(Boolean).join(" · ");
                if (d.url) {
                  return (
                    <a
                      key={`${d.label}-${idx}`}
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 h-12 hover:bg-muted transition"
                    >
                      <span className="flex items-center gap-2.5 text-sm min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{d.label}</span>
                        {meta && <span className="text-[11px] text-muted-foreground truncate">· {meta}</span>}
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  );
                }
                return (
                  <div
                    key={`${d.label}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-2.5"
                  >
                    <span className="flex items-center gap-2.5 text-sm min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{d.label}</span>
                      {meta && <span className="text-[11px] text-muted-foreground truncate">· {meta}</span>}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                      Storage pending
                    </span>
                  </div>
                );
              })}
              <DocumentRequestsBlock lead={lead} existingLabels={documents.map((d) => d.label.toLowerCase())} />
            </section>
          )}

          {tab === "activity" && (
            <section className="space-y-3">
              {updatesLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />)}
                </div>
              )}
              {!updatesLoading && updates.length === 0 && (
                <p className="text-sm text-muted-foreground py-12 text-center">No activity recorded.</p>
              )}
              {!updatesLoading && updates.map((u) => (
                <div key={u.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">{u.author || "Unknown"}</span>
                      {u.source && (
                        <span
                          className={
                            "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border " +
                            (u.source === "journey_event"
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : u.source === "intake_comm"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "border-border/60 bg-muted text-muted-foreground")
                          }
                        >
                          {u.source === "journey_event"
                            ? "Automation"
                            : u.source === "intake_comm"
                              ? (u.kind || "note")
                              : "Monday"}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{relTime(u.posted_at)}</span>
                  </div>
                  {u.subject && u.source === "intake_comm" && (
                    <p className="text-[12px] font-medium text-foreground mb-0.5">{u.subject}</p>
                  )}
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">{u.body || ""}</p>
                  {u.source === "journey_event" && u.metadata && (
                    <pre className="mt-2 text-[10.5px] leading-snug text-muted-foreground bg-muted/60 rounded-md p-2 overflow-x-auto">
{JSON.stringify(u.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </section>
          )}

          {tab === "actions" && (
            <section className="space-y-2">
              <ActionButton
                icon={StickyNote}
                label="Add Note"
                onClick={() => toast("Notes are read-only in this view (Monday source)")}
              />
              <ActionButton
                icon={Send}
                label="Send Intake Packet"
                onClick={() => { updateLead(lead.id, { formStatus: "Sent" }); toast.success("Marked intake packet sent"); }}
              />
              <ActionButton
                icon={ShieldCheck}
                label="Send Consent Forms"
                onClick={() => { updateLead(lead.id, { consentStatus: "Sent" }); toast.success("Consent forms marked sent"); }}
              />
              <ActionButton
                icon={AlertCircle}
                label="Flag Packet Follow Up / Missing Info"
                onClick={() => {
                  updateLead(lead.id, {
                    status: "Intake Packet Follow Up",
                    formReviewStatus: "Missing Information",
                  });
                  toast.success("Moved to Intake Packet Follow Up");
                }}
              />
              <ActionButton
                icon={CheckCircle2}
                label="Move to Benefits Verification"
                onClick={() => {
                  updateLead(lead.id, { status: "Benefits Verification" });
                  toast.success("Moved to Benefits Verification");
                }}
              />
              <ActionButton
                icon={UserX}
                label="Mark Cannot Reach"
                onClick={() => { updateLead(lead.id, { status: "Can't Reach" }); toast("Marked cannot reach"); }}
                tone="danger"
              />
              <ActionButton
                icon={Ban}
                label="Mark Non Qualified"
                onClick={() => { updateLead(lead.id, { status: "Non-Qualified" }); toast("Marked non-qualified"); }}
                tone="danger"
              />
              <ActionButton
                icon={ListChecks}
                label="Create Task"
                onClick={() => toast("Task creation coming next")}
              />
            </section>
          )}
        </div>
      </aside>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Benefits Cheat Sheet Match Panel                                            */
/* -------------------------------------------------------------------------- */

const CONFIDENCE_LABEL = {
  exact: "Exact match",
  strong: "Strong match",
  possible: "Possible match",
  none: "No match",
} as const;

export function BenefitsCheatSheetMatchPanel({
  insurance,
  state,
  leadId,
  secondaryInsurance,
  rawInsurance,
}: {
  insurance?: string | null;
  state?: string | null;
  leadId?: string;
  secondaryInsurance?: string | null;
  rawInsurance?: string | null;
}) {
  const { updateLead, leads } = useLeads();
  const resolvedLead = leadId ? leads.find((l) => l.id === leadId) : undefined;
  const candidates = [insurance, secondaryInsurance, rawInsurance].filter(
    (v) => v && String(v).trim(),
  ) as string[];
  const hasInsurance = candidates.length > 0;
  // Try each candidate; keep the best confidence.
  const match = candidates.length === 0
    ? findBenefitsCheatSheetForLead({ insurance: null, state })
    : candidates
        .map((ins) => findBenefitsCheatSheetForLead({ insurance: ins, state }))
        .sort((a, b) => {
          const order = { exact: 0, strong: 1, possible: 2, none: 3 } as const;
          return order[a.confidence] - order[b.confidence];
        })[0];

  const requestMissingInfo = () => {
    if (resolvedLead) {
      updateLead(resolvedLead.id, {
        formReviewStatus: "Missing Information",
        automationLog: [
          `Intake: requested missing insurance info from parent`,
          ...resolvedLead.automationLog,
        ],
      });
    }
    toast.success("Requested missing insurance info from parent");
  };

  const createBenefitsReviewTask = () => {
    if (resolvedLead) {
      updateLead(resolvedLead.id, {
        nextAction: "Review benefits cheat sheet",
        nextTaskDue: new Date().toISOString().slice(0, 10),
        automationLog: [
          `Intake Task: Review benefits cheat sheet`,
          ...resolvedLead.automationLog,
        ],
      });
    }
    toast.success("Intake task created: Review benefits cheat sheet");
  };

  const markNeedsBenefitsReview = () => {
    if (resolvedLead) {
      updateLead(resolvedLead.id, {
        vobStatus: "Issue",
        automationLog: [
          `Intake: flagged for benefits review (cheat sheet match)`,
          ...resolvedLead.automationLog,
        ],
      });
    }
    toast.success("Flagged: needs benefits review");
  };

  if (!hasInsurance) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Benefits Cheat Sheet Match</p>
        </div>
        <p className="text-xs text-muted-foreground">
          No insurance listed yet. Add insurance to see payer guidance.
        </p>
        <div className="mt-3">
          <button
            onClick={requestMissingInfo}
            className="text-[11px] rounded-md border border-border/60 px-2 py-1 hover:bg-muted transition"
          >
            Request missing insurance info
          </button>
        </div>
      </div>
    );
  }

  if (!match.sheet) {
    const searchTerm = candidates[0] ?? "";
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Benefits Cheat Sheet Match</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          No payer match found for <span className="font-medium text-foreground">{searchTerm}</span>
          {state ? <> in <span className="font-medium text-foreground">{state}</span></> : null}.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={requestMissingInfo}
            className="text-[11px] rounded-md border border-border/60 px-2 py-1 hover:bg-muted transition"
          >
            Request missing insurance info
          </button>
          <button
            onClick={createBenefitsReviewTask}
            className="text-[11px] rounded-md border border-border/60 px-2 py-1 hover:bg-muted transition"
          >
            Create Intake Task: Review benefits cheat sheet
          </button>
          <Link
            to={`/intake/benefits-cheat-sheets?q=${encodeURIComponent(searchTerm)}`}
            className="text-[11px] rounded-md border border-border/60 px-2 py-1 hover:bg-muted transition inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" /> Open full cheat sheet
          </Link>
        </div>
      </div>
    );
  }

  const tone = mapCheatSheetStatusToTone(match.sheet.intakeStatus);
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Benefits Cheat Sheet Match</p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {match.sheet.payer} - {match.sheet.state} - {match.sheet.insuranceCategory}
          </p>
        </div>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap", tone.className)}>
          {tone.label}
        </span>
      </div>
      {!match.sameState && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 text-amber-900 px-2.5 py-1.5 text-[11px] flex gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{match.reason}</span>
        </div>
      )}
      {match.sheet.notes && (
        <p className="text-xs text-foreground/90">{match.sheet.notes}</p>
      )}
      <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Recommended action</p>
        <p className="text-xs text-foreground/90">{tone.recommendation}</p>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Confidence: {CONFIDENCE_LABEL[match.confidence]}</span>
        {match.sheet.mondayItemId && <span className="font-mono">#{match.sheet.mondayItemId}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            const text = `${match.sheet!.payer} (${match.sheet!.state}) - ${match.sheet!.intakeStatus}\n${match.sheet!.notes}\nRecommendation: ${tone.recommendation}`;
            navigator.clipboard.writeText(text).then(
              () => toast.success("Guidance copied"),
              () => toast.error("Could not copy"),
            );
          }}
          className="text-[11px] rounded-md border border-border/60 px-2 py-1 hover:bg-muted transition"
        >
          Copy guidance
        </button>
        <button
          onClick={markNeedsBenefitsReview}
          className="text-[11px] rounded-md border border-border/60 px-2 py-1 hover:bg-muted transition"
        >
          Mark needs benefits review
        </button>
        <button
          onClick={createBenefitsReviewTask}
          className="text-[11px] rounded-md border border-border/60 px-2 py-1 hover:bg-muted transition"
        >
          Create Intake Task: Review benefits cheat sheet
        </button>
        <button
          onClick={requestMissingInfo}
          className="text-[11px] rounded-md border border-border/60 px-2 py-1 hover:bg-muted transition"
        >
          Request missing insurance info
        </button>
        <Link
          to={`/intake/benefits-cheat-sheets?q=${encodeURIComponent(match.sheet.payer)}`}
          className="text-[11px] rounded-md border border-border/60 px-2 py-1 hover:bg-muted transition inline-flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" /> Open full cheat sheet
        </Link>
      </div>
    </div>
  );
}
/* ------------------------ Document follow-up requests ----------------------- */

interface DocRequestOption {
  label: string;
  template: EmailTemplateKey;
  matchTokens: string[];
}

const DOC_REQUEST_OPTIONS: DocRequestOption[] = [
  { label: "Insurance Card", template: "document-request-insurance-card", matchTokens: ["insurance card", "insurance"] },
  { label: "Diagnosis", template: "document-request-diagnosis", matchTokens: ["diagnosis", "dx"] },
  { label: "Consent Form", template: "document-request-consent-form", matchTokens: ["consent"] },
  { label: "Intake Packet", template: "document-request-intake-packet", matchTokens: ["intake packet"] },
];

function DocumentRequestsBlock({
  lead,
  existingLabels,
}: {
  lead: Lead;
  existingLabels: string[];
}) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const handleRequest = async (opt: DocRequestOption) => {
    setPendingKey(opt.template);
    try {
      const result = await sendLeadEmail(
        {
          leadId: lead.id,
          email: lead.email ?? null,
          phone: lead.phone ?? null,
          parentName: lead.parentName ?? null,
          childName: lead.childName ?? null,
          state: lead.state ?? null,
          insurance: lead.insurance ?? null,
        },
        opt.template,
      );
      notifyCommunicationResult(result);
      if (result.success) {
        try {
          await supabase.from("intake_communications").insert({
            lead_id: lead.id,
            channel: "email",
            direction: "outbound",
            subject: `Requested ${opt.label} from parent`,
            body: `Sent automated request for ${opt.label} via template "${opt.template}".`,
          } as never);
        } catch {
          /* non-fatal — toast already shown */
        }
      }
    } finally {
      setPendingKey(null);
    }
  };

  const missing = DOC_REQUEST_OPTIONS.filter(
    (o) => !existingLabels.some((l) => o.matchTokens.some((t) => l.includes(t))),
  );

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground">Request a document from parent</p>
        <span className="text-[10px] text-muted-foreground">Sends a human-sounding email</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {(missing.length ? missing : DOC_REQUEST_OPTIONS).map((opt) => (
          <button
            key={opt.template}
            onClick={() => handleRequest(opt)}
            disabled={pendingKey === opt.template}
            className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 h-9 text-xs hover:bg-muted transition disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <MailPlus className="h-3.5 w-3.5 text-primary" />
              Request {opt.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {pendingKey === opt.template ? "Sending…" : "Send"}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10.5px] text-muted-foreground">
        Templates live under Admin → Automated Emails.
      </p>
    </div>
  );
}

function PipelineProgress({
  status,
  focusStage,
}: {
  status: string;
  focusStage?: string | null;
}) {
  const canonical = canonicalFamilyLeadStage(status);
  const stages = FAMILY_LEAD_PIPELINE_STAGES;
  const currentIdx = stages.indexOf(canonical as typeof stages[number]);
  const total = stages.length;
  const focusIdx = focusStage
    ? stages.indexOf(canonicalFamilyLeadStage(focusStage) as typeof stages[number])
    : -1;
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (focusIdx >= 0) {
      setOpenIdx(focusIdx);
      barRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusIdx]);
  return (
    <div ref={barRef} className="mt-4 rounded-xl border border-border/60 bg-muted/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          Pipeline progress
        </span>
        <span className="text-[11px] font-medium text-foreground">
          {currentIdx < 0 ? "Off-pipeline" : `${currentIdx + 1} of ${total} · ${canonical}`}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {stages.map((s, i) => {
          const state =
            currentIdx < 0
              ? "future"
              : i < currentIdx
              ? "done"
              : i === currentIdx
              ? "current"
              : "future";
          const details = STAGE_DETAILS[s];
          const isFocused = i === focusIdx;
          return (
            <Popover
              key={s}
              open={openIdx === i ? true : undefined}
              onOpenChange={(v) => {
                if (!v && openIdx === i) setOpenIdx(null);
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Stage ${i + 1}: ${s}`}
                  className={cn(
                    "flex-1 h-2 rounded-full transition-all cursor-pointer hover:h-3 focus:outline-none focus:ring-2 focus:ring-primary/40",
                    state === "done" && "bg-primary/70 hover:bg-primary",
                    state === "current" && "bg-primary ring-2 ring-primary/30",
                    state === "future" && "bg-muted-foreground/20 hover:bg-muted-foreground/40",
                    isFocused && "h-3 ring-2 ring-primary ring-offset-1 ring-offset-background",
                  )}
                />
              </PopoverTrigger>
              <PopoverContent side="top" align="center" className="w-72 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                    Step {i + 1} of {total}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      state === "done" && "bg-primary/15 text-primary",
                      state === "current" && "bg-primary text-primary-foreground",
                      state === "future" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {state === "done" ? "Completed" : state === "current" ? "In progress" : "Upcoming"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  {state === "done" && <Check className="h-3.5 w-3.5 text-primary" />}
                  <h4 className="text-sm font-semibold text-foreground">{s}</h4>
                </div>
                {details ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">{details.what}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
                      What's involved
                    </p>
                    <ul className="space-y-1 mb-2">
                      {details.involves.map((it) => (
                        <li key={it} className="flex items-start gap-1.5 text-xs text-foreground">
                          <span className="mt-1 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">Owner:</span> {details.owner}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No detail available.</p>
                )}
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </div>
  );
}
