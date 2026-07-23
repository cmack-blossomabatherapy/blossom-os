import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDeepLink, useConsumeDeepLink, useDeepLinkHighlight } from "@/lib/deepLink";
import { statusVariant, priorityVariant, getInlineAlert, pipelineStages, LeadStatus } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CallHistoryList } from "@/components/phone/CallHistoryList";
import {
  ArrowLeft, Phone, Mail, MessageSquare, FileText, ArrowRight, UserPlus,
  CheckCircle2, Circle, Clock, Zap, FileIcon, ShieldCheck, Calendar,
  AlertCircle, MoreHorizontal, Copy, ExternalLink, Send, Upload,
  StickyNote, Trash2, Sparkles, Ban, UserX, ListChecks, CalendarClock,
  Link2, Unlink, Building2, User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { OSShell } from "@/pages/os/OSShell";
import {
  BenefitsCheatSheetMatchPanel,
  PipelineProgress,
  DocumentRequestsBlock,
  STAGE_DETAILS,
} from "@/components/leads/LeadDetailDrawer";
import { LeadContactActions } from "@/components/leads/LeadContactActions";
import { IntakeCoordinatorPicker } from "@/components/leads/IntakeCoordinatorPicker";
import { EditLeadDialog } from "@/components/leads/EditLeadDialog";
import { AddLeadNoteDialog } from "@/components/leads/AddLeadNoteDialog";
import { CreateLeadTaskDialog } from "@/components/leads/CreateLeadTaskDialog";
import { LinkReferralDialog } from "@/components/leads/LinkReferralDialog";
import { useLeadDocuments } from "@/hooks/useLeadDocuments";
import { useLeadReferralLink } from "@/hooks/useLeadReferralLink";
import { useLeadUpdates } from "@/hooks/useLeadUpdates";
import { useBlossomAI } from "@/components/ai/BlossomAIAssistant";
import { supabase } from "@/integrations/supabase/client";
import {
  FAMILY_LEAD_PIPELINE_STAGES,
  canonicalFamilyLeadStage,
  getLeadNextStep,
  getLeadBlocker,
} from "@/lib/intake/intakeWorkflow";
import {
  callParent, sendLeadEmail, sendLeadSms, sendIntakePacket,
  sendMissingInfoReminder, sendVobUpdate, notifyCommunicationResult,
} from "@/lib/integrations/communications/communicationAdapters";

const TAB_KEYS = [
  "overview", "family", "insurance", "documents", "tasks", "communications", "actions",
] as const;
type LeadTabKey = typeof TAB_KEYS[number];

const LEGACY_TAB_MAP: Record<string, LeadTabKey> = {
  timeline: "communications",
  automation: "communications",
  forms: "insurance",
  insurance: "insurance",
  documents: "documents",
  tasks: "tasks",
  task: "tasks",
  communications: "communications",
  overview: "overview",
  family: "family",
  actions: "actions",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function relTime(iso: string | null | undefined) {
  if (!iso) return "never";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d ago`;
  return d.toLocaleDateString();
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  const v = value === 0 ? "0" : value ? String(value) : "";
  return (
    <div className="space-y-0.5 min-w-0">
      <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground break-words">{v || <span className="text-muted-foreground">—</span>}</p>
    </div>
  );
}

function ActionRow({
  icon: Icon, label, onClick, tone = "default", disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "primary";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 h-11 text-sm font-medium",
        "hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed",
        tone === "danger" && "text-destructive hover:bg-destructive/5",
        tone === "primary" && "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10",
      )}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getLead, updateLead, moveStage, assignOwner, deleteLeads } = useLeads();
  const lead = id ? getLead(id) : undefined;
  const blossom = useBlossomAI();

  const isPersisted = !!lead && UUID_RE.test(lead.id);

  // Real doc/referral/updates hooks (replace metadata-only uploads).
  const {
    docs: uploadedDocs,
    loading: docsLoading,
    upload: uploadDoc,
    remove: removeDoc,
  } = useLeadDocuments(lead?.id ?? null);
  const { link: referralLink, linkReferral, unlink: unlinkReferral } = useLeadReferralLink(lead?.id ?? null);
  const { updates, loading: updatesLoading } = useLeadUpdates(lead?.childName, lead?.id ?? null);

  // Dialog state.
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState<false | "task" | "follow_up">(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw Monday blob for extended fields + document URLs.
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (!lead) { setRaw(null); return; }
    supabase
      .from("monday_leads_raw")
      .select("data")
      .eq("monday_item_id", lead.id)
      .maybeSingle()
      .then(({ data }) => setRaw((data?.data as Record<string, unknown>) ?? null));
  }, [lead?.id]);

  // Deep-link → tab resolution (?tab=… + legacy focus=…).
  const deepLink = useDeepLink();
  useConsumeDeepLink();
  const urlTab = searchParams.get("tab");
  const resolveTab = (v?: string | null): LeadTabKey => {
    if (!v) return "overview";
    return LEGACY_TAB_MAP[v.toLowerCase()] ?? "overview";
  };
  const initialTab = resolveTab(
    urlTab ?? deepLink.tab ?? deepLink.focus ?? (deepLink.task ? "tasks" : undefined),
  );
  const [activeTab, setActiveTab] = useState<LeadTabKey>(initialTab);
  useDeepLinkHighlight(deepLink.task ? `task-${deepLink.task}` : null, !!lead);

  // Keep URL <-> state in sync so tabs are addressable & shareable.
  useEffect(() => {
    if (!lead) return;
    const current = searchParams.get("tab");
    if (activeTab === "overview" && !current) return;
    if (current === activeTab) return;
    const next = new URLSearchParams(searchParams);
    if (activeTab === "overview") next.delete("tab");
    else next.set("tab", activeTab);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, lead?.id]);

  useEffect(() => {
    if (lead && deepLink.alert) toast.message?.("Opened from alert");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const goBack = () => {
    // Prefer app history when we came from another Blossom route.
    if (typeof window !== "undefined" && window.history.length > 1) {
      const ref = document.referrer;
      const sameOrigin = !ref || ref.startsWith(window.location.origin);
      if (sameOrigin) { navigate(-1); return; }
    }
    navigate("/leads");
  };

  // ----- Loading / not-found states ---------------------------------------
  if (!id) {
    return (
      <OSShell>
        <NotFoundState onBack={() => navigate("/leads")} message="No lead id provided" />
      </OSShell>
    );
  }
  if (!lead) {
    return (
      <OSShell>
        <NotFoundState
          onBack={() => navigate("/leads")}
          message={
            UUID_RE.test(id)
              ? "This lead hasn't finished syncing yet, or you don't have access to it."
              : `We couldn't find a lead for id ${id}.`
          }
        />
      </OSShell>
    );
  }

  const alert = getInlineAlert(lead);
  const blocker = getLeadBlocker(lead);
  const nextStep = getLeadNextStep(lead);
  const canonicalStage = canonicalFamilyLeadStage(lead.status);
  const stageDetail = STAGE_DETAILS[canonicalStage] ?? null;

  const rawStr = (k: string) => {
    const v = raw?.[k];
    return v === null || v === undefined ? "" : String(v).trim();
  };
  const rawLink = (k: string) => {
    const v = rawStr(k);
    return v && /^https?:\/\//i.test(v) ? v : null;
  };

  // Merge Monday document URL fields with attached docs.
  const mondayDocs = [
    { label: "Insurance card (front)", url: rawLink("Primary Insurance Card - Front") },
    { label: "Insurance card (back)", url: rawLink("Primary Insurance Card - Back") },
    { label: "Secondary card (front)", url: rawLink("Secondary Insurance Card - Front") },
    { label: "Secondary card (back)", url: rawLink("Secondary Insurance Card - Back") },
    { label: "Intake packet", url: rawLink("Intake Packet") },
    { label: "Consent form", url: rawLink("Consent Form Link") },
    { label: "VOB", url: rawLink("VOB") },
  ].filter((d) => d.url) as { label: string; url: string }[];

  const attachedDocs = (lead.documents ?? []).map((d) => ({
    label: d.name,
    url: d.url ?? null,
    type: d.type,
    uploadedAt: d.uploadedAt ?? null,
  }));

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const commContext = {
    leadId: lead.id,
    phone: lead.phone,
    email: lead.email,
    parentName: lead.parentName,
    childName: lead.childName,
    state: lead.state,
    insurance: lead.insurance,
  };

  const askBlossomAboutLead = () => {
    blossom.open({
      surface: "page-help",
      title: `Ask Blossom AI · ${lead.childName}`,
      contextText: [
        `Lead: ${lead.childName} (${lead.state})`,
        `Parent: ${lead.parentName}`,
        `Stage: ${lead.status}`,
        `Insurance: ${lead.insurance || "—"}`,
        `Next step: ${nextStep}`,
        blocker ? `Blocker: ${blocker.label} — ${blocker.reasons.join("; ")}` : null,
      ].filter(Boolean).join("\n"),
      initialPrompt: `Give the intake coordinator a concise action plan for ${lead.childName}.`,
      suggestions: [
        "What should Intake do next?",
        "Draft a family message.",
        "Explain the benefits situation.",
      ],
    });
  };

  const setTab = (t: LeadTabKey) => setActiveTab(t);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 pb-16 space-y-6 animate-fade-in">
        {/* Breadcrumb / back */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={askBlossomAboutLead}>
              <Sparkles className="h-3.5 w-3.5" /> Ask Blossom AI
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-[10px]">Record</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => copy(`${window.location.origin}/leads/${lead.id}`, "Lead link")}>
                  <Copy className="h-3.5 w-3.5 mr-2" /> Copy record link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <FileText className="h-3.5 w-3.5 mr-2" /> Edit lead
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() =>
                  updateLead(lead.id, { priority: lead.priority === "Hot" ? "Warm" : "Hot" })
                }>
                  <AlertCircle className="h-3.5 w-3.5 mr-2" /> Toggle priority
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (window.confirm(`Delete ${lead.childName}? This cannot be undone.`)) {
                      deleteLeads([lead.id]);
                      toast.success("Lead deleted");
                      navigate("/leads");
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* HERO */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary text-lg font-semibold">
              {initials(lead.childName)}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground truncate">
                  {lead.childName}
                </h1>
                <span className="text-sm text-muted-foreground truncate">
                  {lead.parentName || "—"} · {lead.state || "—"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={lead.status} variant={statusVariant(lead.status)} />
                <StatusBadge status={lead.priority} variant={priorityVariant(lead.priority)} />
                <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  Source · {lead.source}
                </span>
                <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  In stage {lead.daysInStage}d
                </span>
                <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  Last touch · {relTime(lead.lastContacted)}
                </span>
                {blocker && (
                  <span
                    className={cn(
                      "text-[11px] px-2 py-1 rounded-full border",
                      blocker.tone === "urgent"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : blocker.tone === "risk"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                          : "bg-muted text-muted-foreground border-border/60",
                    )}
                    title={blocker.reasons.join(" • ")}
                  >
                    Blocker: {blocker.label}
                  </span>
                )}
                <span
                  className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 max-w-[320px] truncate"
                  title={nextStep}
                >
                  Next · {nextStep}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground mb-1">
                    Intake coordinator
                  </p>
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
                      }
                      toast.success(name ? `Assigned to ${name}` : "Unassigned");
                    }}
                    placeholder="Assign intake staff"
                  />
                </div>
                <LeadContactActions
                  lead={{
                    id: lead.id,
                    phone: lead.phone,
                    email: lead.email,
                    parentName: lead.parentName,
                    childName: lead.childName,
                    state: lead.state,
                    insurance: lead.insurance,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Canonical 13-step family pipeline */}
          <div className="mt-5">
            <PipelineProgress status={lead.status} focusStage={null} />
          </div>

          {alert && (
            <div className={cn(
              "mt-5 rounded-xl border px-4 py-2.5 flex items-center gap-2 text-sm",
              alert.type === "red"
                ? "bg-destructive/5 border-destructive/30 text-destructive"
                : "bg-warning/5 border-warning/30 text-warning",
            )}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{alert.message}</span>
            </div>
          )}
        </section>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as LeadTabKey)}>
          <TabsList className="bg-muted/50 flex-wrap h-auto w-full justify-start">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="family" className="text-xs">Family & Contact</TabsTrigger>
            <TabsTrigger value="insurance" className="text-xs">Insurance / Benefits</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">
              Documents ({uploadedDocs.length + attachedDocs.length + mondayDocs.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tasks ({lead.tasks.length})</TabsTrigger>
            <TabsTrigger value="communications" className="text-xs">
              Communications / Activity
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
          </TabsList>

          {/* --- Overview --- */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                {stageDetail && (
                  <div className="rounded-2xl border border-border/60 bg-card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">Stage: {canonicalStage}</h3>
                      <span className="text-[11px] text-muted-foreground">Owner · {stageDetail.owner}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stageDetail.what}</p>
                    <ul className="mt-3 space-y-1">
                      {stageDetail.involves.map((step) => (
                        <li key={step} className="text-xs text-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-primary/70" /> {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <BenefitsCheatSheetMatchPanel
                  insurance={lead.insurance || lead.primaryInsurance}
                  state={lead.state}
                  leadId={lead.id}
                />

                <div className="rounded-2xl border border-border/60 bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Referral source</h3>
                    {referralLink ? (
                      <button
                        onClick={() => void unlinkReferral().then(() => toast.success("Referral unlinked"))}
                        className="text-[11px] text-muted-foreground hover:text-destructive transition inline-flex items-center gap-1"
                      >
                        <Unlink className="h-3 w-3" /> Unlink
                      </button>
                    ) : (
                      <button
                        onClick={() => setReferralOpen(true)}
                        disabled={!isPersisted}
                        className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 disabled:text-muted-foreground disabled:no-underline"
                      >
                        <Link2 className="h-3 w-3" /> Link referral
                      </button>
                    )}
                  </div>
                  {referralLink ? (
                    <div className="space-y-1.5 text-sm">
                      {referralLink.company && (
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Link
                            to={`/referrals/companies/${referralLink.company.id}`}
                            className="text-foreground hover:underline truncate"
                          >
                            {referralLink.company.company_name}
                          </Link>
                        </div>
                      )}
                      {referralLink.contact && (
                        <div className="flex items-center gap-2 min-w-0">
                          <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Link
                            to={`/referrals/contacts/${referralLink.contact.id}`}
                            className="text-foreground hover:underline truncate"
                          >
                            {referralLink.contact.full_name
                              || [referralLink.contact.first_name, referralLink.contact.last_name].filter(Boolean).join(" ")
                              || referralLink.contact.email}
                          </Link>
                        </div>
                      )}
                      {referralLink.notes && (
                        <p className="text-xs text-muted-foreground pt-1 whitespace-pre-wrap">
                          {referralLink.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {isPersisted
                        ? "Not linked. Connect this lead to a doctor's office, referral partner, or specific contact."
                        : "Available after this lead syncs to the database."}
                    </p>
                  )}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
                  <h4 className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Snapshot</h4>
                  <Field label="Age" value={lead.childAge} />
                  <Field label="Created" value={new Date(lead.createdAt).toLocaleDateString()} />
                  <Field label="Last contact" value={relTime(lead.lastContacted)} />
                  <Field label="Days in stage" value={`${lead.daysInStage}d`} />
                  <Field label="Next task due" value={lead.nextTaskDue ? new Date(lead.nextTaskDue).toLocaleDateString() : null} />
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <h4 className="text-[10.5px] uppercase tracking-wide text-primary mb-1">Next action</h4>
                  <p className="text-sm font-medium text-foreground">{nextStep}</p>
                </div>
              </aside>
            </div>
          </TabsContent>

          {/* --- Family & Contact --- */}
          <TabsContent value="family" className="mt-4">
            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-5">
              <section>
                <h3 className="text-sm font-semibold mb-3">Patient</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Patient" value={lead.childName} />
                  <Field label="Age" value={lead.childAge} />
                  <Field label="State" value={lead.state} />
                  <Field label="DOB" value={lead.intake?.dob || rawStr("DOB")} />
                  <Field label="Gender" value={rawStr("Gender")} />
                  <Field label="Zip" value={rawStr("Zip Code")} />
                </div>
              </section>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold mb-3">Parent / Guardian</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Parent" value={lead.parentName} />
                  <Field label="Cell phone" value={lead.intake?.parentCellPhone || lead.phone} />
                  <Field label="Home phone" value={lead.intake?.homePhone || rawStr("Home Phone")} />
                  <Field label="Email" value={lead.email} />
                  <Field label="Preferred contact" value={lead.intake?.preferredContactMethod} />
                  <Field label="Relationship" value={rawStr("Relationship to Patient")} />
                  <Field label="Parent 2" value={lead.intake?.parent2Name} />
                  <Field label="Parent 2 email" value={lead.intake?.parent2Email} />
                  <Field label="Address" value={rawStr("Address")} />
                </div>
              </section>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold mb-3">Source & attribution</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Lead source" value={lead.source} />
                  <Field label="Lead type" value={lead.intake?.leadType} />
                  <Field label="UTM source" value={lead.intake?.utmSource} />
                  <Field label="UTM medium" value={lead.intake?.utmMedium} />
                  <Field label="UTM campaign" value={lead.intake?.utmCampaign} />
                  <Field label="Referral partner" value={lead.intake?.referralPartner} />
                </div>
              </section>
            </div>
          </TabsContent>

          {/* --- Insurance / Benefits --- */}
          <TabsContent value="insurance" className="mt-4 space-y-4">
            <BenefitsCheatSheetMatchPanel
              insurance={lead.insurance || lead.primaryInsurance}
              state={lead.state}
              leadId={lead.id}
              secondaryInsurance={lead.secondaryInsurance || lead.intake?.secondaryInsurance}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Insurance details</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ["Primary insurance", lead.primaryInsurance || lead.insurance],
                    ["Primary ID", rawStr("Primary Insurance ID")],
                    ["Type", lead.insuranceType],
                    ["Payor", lead.payor],
                    ["Coverage", lead.coverageType],
                    ["Secondary insurance", lead.secondaryInsurance || lead.intake?.secondaryInsurance],
                    ["Policyholder", rawStr("Name of Insured Policyholder")],
                    ["Payment plan", lead.paymentPlanNeeded ? "Required" : "Not required"],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground font-medium text-right">{value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Benefits verification</h3>
                  <StatusBadge
                    status={lead.vobStatus}
                    variant={
                      lead.vobStatus === "Completed" || lead.vobStatus === "Approved"
                        ? "success"
                        : lead.vobStatus === "Issue"
                          ? "destructive"
                          : lead.vobStatus === "Not Started" ? "muted" : "warning"
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Benefits status" value={lead.vobStatus} />
                  <Field label="Form status" value={lead.formStatus} />
                  <Field label="Form review" value={lead.formReviewStatus} />
                  <Field label="Consent" value={lead.consentStatus} />
                </div>
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm" variant="outline" className="gap-1.5"
                    onClick={async () => {
                      const res = await sendVobUpdate(commContext);
                      notifyCommunicationResult(res);
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Send benefits update
                  </Button>
                  <Button
                    size="sm" variant="outline" className="gap-1.5"
                    onClick={() => {
                      updateLead(lead.id, {
                        status: "Benefits Verification",
                        automationLog: [...lead.automationLog, "Moved to Benefits Verification"],
                      });
                      toast.success("Moved to Benefits Verification");
                    }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" /> Move to Benefits Verification
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* --- Documents --- */}
          <TabsContent value="documents" className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold">Documents</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isPersisted
                      ? "Upload insurance cards, packets, signed forms, or other lead docs."
                      : "Uploading available after this lead syncs to the database."}
                  </p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => void handleUpload(e.target.files)}
                    accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isPersisted || uploading}
                    className="h-8 gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? "Uploading…" : "Upload"}
                  </Button>
                </div>
              </div>

              {isPersisted && docsLoading && uploadedDocs.length === 0 && (
                <div className="space-y-2">
                  {[0, 1].map((i) => <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />)}
                </div>
              )}

              <div className="space-y-2">
                {uploadedDocs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 h-12">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={d.signedUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => { if (!d.signedUrl) e.preventDefault(); }}
                        className="text-sm truncate hover:underline"
                      >
                        {d.label}
                      </a>
                      <span className="text-[11px] text-muted-foreground truncate">
                        · {d.uploaded_by_name || "Intake"} · {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => void removeDoc(d).then(() => toast.success("Document removed"))}
                      className="rounded-md h-7 w-7 grid place-items-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition"
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {mondayDocs.map((d) => (
                  <a
                    key={`monday-${d.label}`}
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 h-12 hover:bg-muted transition"
                  >
                    <span className="flex items-center gap-2.5 text-sm min-w-0">
                      <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{d.label}</span>
                      <span className="text-[11px] text-muted-foreground">· Monday import</span>
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}

                {attachedDocs.filter((d) => !d.url).map((d, i) => (
                  <div key={`att-${i}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-2.5">
                    <span className="flex items-center gap-2.5 text-sm min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{d.label}</span>
                      {d.type && <span className="text-[11px] text-muted-foreground">· {d.type}</span>}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                      Storage pending
                    </span>
                  </div>
                ))}

                {uploadedDocs.length === 0 && mondayDocs.length === 0 && attachedDocs.length === 0 && !docsLoading && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isPersisted}
                    className="w-full border border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 hover:bg-muted/30 transition-colors disabled:opacity-50"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No documents on file yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Click to upload</p>
                  </button>
                )}
              </div>
            </div>
            <DocumentRequestsBlock
              lead={lead}
              existingLabels={[...uploadedDocs.map((d) => d.label.toLowerCase()), ...mondayDocs.map((d) => d.label.toLowerCase()), ...attachedDocs.map((d) => d.label.toLowerCase())]}
            />
          </TabsContent>

          {/* --- Tasks --- */}
          <TabsContent value="tasks" className="mt-4">
            <div className="rounded-2xl border border-border/60 bg-card">
              <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Workflow tasks</h4>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline" size="sm" className="h-8 gap-1.5"
                    onClick={() => {
                      if (!isPersisted) { toast.error("This lead isn't synced yet."); return; }
                      setTaskOpen("follow_up");
                    }}
                  >
                    <CalendarClock className="h-3.5 w-3.5" /> Follow-up
                  </Button>
                  <Button
                    size="sm" className="h-8 gap-1.5"
                    onClick={() => {
                      if (!isPersisted) { toast.error("This lead isn't synced yet."); return; }
                      setTaskOpen("task");
                    }}
                  >
                    <ListChecks className="h-3.5 w-3.5" /> Add task
                  </Button>
                </div>
              </div>
              {lead.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No tasks yet.</p>
              ) : (
                <div className="divide-y divide-border/40">
                  {lead.tasks.map((task) => (
                    <div
                      key={task.id}
                      data-deeplink-id={`task-${task.id}`}
                      onClick={() => updateLead(lead.id, {
                        tasks: lead.tasks.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t),
                      })}
                      className="px-5 py-3 flex items-start gap-3 hover:bg-muted/20 cursor-pointer"
                    >
                      {task.completed
                        ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        : <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", task.completed ? "text-muted-foreground line-through" : "text-foreground font-medium")}>
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          {task.workflowStep && <span>Step: {task.workflowStep}</span>}
                          {task.owner && <span>Owner: {task.owner}</span>}
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* --- Communications / Activity --- */}
          <TabsContent value="communications" className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card">
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/60 flex-wrap">
                <h4 className="text-sm font-semibold">Communication log</h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                    onClick={async () => notifyCommunicationResult(await callParent(commContext))}>
                    <Phone className="h-3 w-3" /> Call
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                    onClick={async () => notifyCommunicationResult(await sendLeadSms(commContext))}>
                    <MessageSquare className="h-3 w-3" /> SMS
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                    onClick={async () => notifyCommunicationResult(await sendLeadEmail(commContext))}>
                    <Mail className="h-3 w-3" /> Email
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                    onClick={async () => notifyCommunicationResult(await sendMissingInfoReminder(commContext))}>
                    <AlertCircle className="h-3 w-3" /> Missing info
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                    onClick={() => {
                      if (!isPersisted) { toast.error("This lead isn't synced yet."); return; }
                      setNoteOpen(true);
                    }}>
                    <StickyNote className="h-3 w-3" /> Note
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-border/40">
                {updatesLoading && (
                  <div className="p-5 space-y-2">
                    {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg bg-muted/60 animate-pulse" />)}
                  </div>
                )}
                {!updatesLoading && updates.length === 0 && lead.communications.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">No activity yet.</p>
                )}
                {!updatesLoading && updates.map((u) => (
                  <div key={u.id} className="px-5 py-3">
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">{u.author || "Unknown"}</span>
                        {u.source && (
                          <span className={cn(
                            "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border",
                            u.source === "journey_event"
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : u.source === "intake_comm"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "border-border/60 bg-muted text-muted-foreground",
                          )}>
                            {u.source === "journey_event" ? "Automation" : u.source === "intake_comm" ? (u.kind || "note") : "Monday"}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{relTime(u.posted_at)}</span>
                    </div>
                    {u.subject && u.source === "intake_comm" && (
                      <p className="text-[12px] font-medium text-foreground mb-0.5">{u.subject}</p>
                    )}
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{u.body || ""}</p>
                  </div>
                ))}
              </div>
            </div>

            <CallHistoryList
              numbers={[lead.phone]}
              title="Call recordings & transcripts"
              emptyMessage="No tracked calls linked to this lead yet."
            />
          </TabsContent>

          {/* --- Actions --- */}
          <TabsContent value="actions" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ActionRow icon={ListChecks} label="Create task"
                onClick={() => { if (!isPersisted) { toast.error("This lead isn't synced yet."); return; } setTaskOpen("task"); }} />
              <ActionRow icon={CalendarClock} label="Create follow-up"
                onClick={() => { if (!isPersisted) { toast.error("This lead isn't synced yet."); return; } setTaskOpen("follow_up"); }} />
              <ActionRow icon={StickyNote} label="Add note"
                onClick={() => { if (!isPersisted) { toast.error("This lead isn't synced yet."); return; } setNoteOpen(true); }} />
              <ActionRow icon={Link2} label={referralLink ? "Update referral source" : "Link referral source"}
                onClick={() => { if (!isPersisted) { toast.error("This lead isn't synced yet."); return; } setReferralOpen(true); }} />
              <ActionRow icon={Send} label="Send intake packet"
                onClick={async () => {
                  const res = await sendIntakePacket(commContext);
                  notifyCommunicationResult(res);
                  if (!res.success) return;
                  updateLead(lead.id, {
                    formStatus: "Sent",
                    automationLog: [...lead.automationLog, "Intake packet sent"],
                  });
                }} />
              <ActionRow icon={ShieldCheck} label="Send consent forms"
                onClick={() => {
                  updateLead(lead.id, {
                    consentStatus: "Sent",
                    automationLog: [...lead.automationLog, "Consent forms sent"],
                  });
                  toast.success("Consent forms marked sent");
                }} />
              <ActionRow icon={AlertCircle} label="Flag packet follow up / missing info"
                onClick={() => {
                  updateLead(lead.id, {
                    status: "Intake Packet Follow Up",
                    formReviewStatus: "Missing Information",
                  });
                  toast.success("Moved to Intake Packet Follow Up");
                }} />
              <ActionRow icon={CheckCircle2} label="Move to Benefits Verification"
                onClick={() => {
                  updateLead(lead.id, { status: "Benefits Verification" });
                  toast.success("Moved to Benefits Verification");
                }} />
              <ActionRow icon={Calendar} label="Schedule assessment"
                onClick={() => navigate(`/scheduling?leadId=${encodeURIComponent(lead.id)}`)} />
              <ActionRow icon={UserPlus} label="Reassign owner"
                onClick={() => setEditOpen(true)} />
              <ActionRow icon={UserX} label="Mark cannot reach" tone="danger"
                onClick={() => { updateLead(lead.id, { status: "Can't Reach" }); toast("Marked cannot reach"); }} />
              <ActionRow icon={Ban} label="Mark non-qualified" tone="danger"
                onClick={() => { updateLead(lead.id, { status: "Non-Qualified" }); toast("Marked non-qualified"); }} />
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/40 p-5">
              <h3 className="text-sm font-semibold mb-3">Move to any pipeline stage</h3>
              <div className="flex flex-wrap gap-2">
                {FAMILY_LEAD_PIPELINE_STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      moveStage([lead.id], s as LeadStatus);
                      toast.success(`Moved to ${s}`);
                    }}
                    className={cn(
                      "text-xs px-3 h-8 rounded-full border transition",
                      canonicalStage === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border/60 hover:bg-muted",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs — real, no window.prompt anywhere. */}
      <EditLeadDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} />
      {isPersisted && (
        <>
          <AddLeadNoteDialog
            open={noteOpen}
            onOpenChange={setNoteOpen}
            leadId={lead.id}
            leadName={lead.childName}
          />
          <CreateLeadTaskDialog
            open={taskOpen !== false}
            onOpenChange={(v) => { if (!v) setTaskOpen(false); }}
            leadId={lead.id}
            leadName={lead.childName}
            defaultOwner={lead.owner}
            mode={taskOpen === "follow_up" ? "follow_up" : "task"}
          />
          <LinkReferralDialog
            open={referralOpen}
            onOpenChange={setReferralOpen}
            leadId={lead.id}
            onLink={linkReferral}
          />
        </>
      )}
    </OSShell>
  );
}

function NotFoundState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-md py-24 text-center space-y-4">
      <div className="grid h-14 w-14 mx-auto place-items-center rounded-2xl bg-muted">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Lead not found</h1>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      <Button variant="outline" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </Button>
    </div>
  );
}
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLead, updateLead, moveStage, assignOwner, deleteLeads } = useLeads();
  const lead = id ? getLead(id) : undefined;

  // Hidden file inputs powering Upload document, VOB upload, and the empty-state dropzone.
  const docInputRef = useRef<HTMLInputElement>(null);
  const vobInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (n?: number) => {
    if (!n && n !== 0) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDocumentUpload = (files: FileList | null) => {
    if (!lead || !files || files.length === 0) return;
    const now = new Date().toISOString();
    const newDocs = Array.from(files).map((f) => ({
      name: f.name,
      type: "Parent Provided Document",
      uploadedAt: now,
    }));
    updateLead(lead.id, {
      documents: [...(lead.documents ?? []), ...newDocs],
      automationLog: [
        ...(lead.automationLog ?? []),
        ...newDocs.map((d) => `Document uploaded: ${d.name} (storage connection pending)`),
      ],
    });
    toast.success(`Attached ${newDocs.length} document${newDocs.length === 1 ? "" : "s"}`, {
      description: "Storage connection pending — metadata recorded against this lead.",
    });
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleVobUpload = (files: FileList | null) => {
    if (!lead || !files || files.length === 0) return;
    const f = files[0];
    const now = new Date().toISOString();
    updateLead(lead.id, {
      vobFile: { name: f.name, uploadedAt: now },
      documents: [
        ...(lead.documents ?? []),
        { name: f.name, type: "VOB", uploadedAt: now },
      ],
      automationLog: [
        ...(lead.automationLog ?? []),
        `VOB uploaded: ${f.name} (storage connection pending)`,
      ],
    });
    toast.success(`VOB uploaded: ${f.name}`, {
      description: `${formatBytes(f.size)} · storage connection pending`,
    });
    if (vobInputRef.current) vobInputRef.current.value = "";
  };

  // Deep-link: open a tab and highlight a task if requested via the URL.
  const deepLink = useDeepLink();
  useConsumeDeepLink();
  const validTabs = ["timeline","communications","tasks","forms","insurance","documents","automation"] as const;
  type LeadTabKey = typeof validTabs[number];
  const focusToTab: Record<string, LeadTabKey> = {
    tasks: "tasks", task: "tasks",
    communications: "communications", forms: "forms",
    insurance: "insurance", documents: "documents", automation: "automation",
    timeline: "timeline",
  };
  let initialTab: LeadTabKey = "timeline";
  if (deepLink.tab && (validTabs as readonly string[]).includes(deepLink.tab)) {
    initialTab = deepLink.tab as LeadTabKey;
  } else if (deepLink.focus && focusToTab[deepLink.focus.toLowerCase()]) {
    initialTab = focusToTab[deepLink.focus.toLowerCase()];
  } else if (deepLink.task) {
    initialTab = "tasks";
  }
  const [activeTab, setActiveTab] = useState<LeadTabKey>(initialTab);
  useDeepLinkHighlight(deepLink.task ? `task-${deepLink.task}` : null, !!lead);
  useEffect(() => {
    if (lead && deepLink.alert) toast.message?.("Opened from alert");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  if (!lead) {
    return (
      <OSShell>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Lead not found</p>
          <Button variant="outline" onClick={() => navigate("/leads")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
          </Button>
        </div>
      </OSShell>
    );
  }

  const alert = getInlineAlert(lead);

  const progressSteps = [
    { label: "Contacted", done: lead.lastContacted !== null },
    { label: "Form Sent", done: lead.formStatus !== "Not Sent" },
    { label: "Form Completed", done: lead.formStatus === "Completed" },
    { label: "Consent Completed", done: lead.consentStatus === "Completed" },
    { label: "VOB Sent", done: ["Sent", "Received", "Completed", "Approved", "Payment Plan Required"].includes(lead.vobStatus) },
    { label: "VOB Received", done: ["Received", "Completed", "Approved", "Payment Plan Required"].includes(lead.vobStatus) },
  ];
  const completedSteps = progressSteps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / progressSteps.length) * 100);

  const timelineIcons: Record<string, React.ReactNode> = {
    call: <Phone className="h-3.5 w-3.5" />,
    email: <Mail className="h-3.5 w-3.5" />,
    sms: <MessageSquare className="h-3.5 w-3.5" />,
    form: <FileText className="h-3.5 w-3.5" />,
    system: <Zap className="h-3.5 w-3.5" />,
    note: <StickyNote className="h-3.5 w-3.5" />,
  };

  const commIcon = (t: string) =>
    t === "call" ? <PhoneCall className="h-3.5 w-3.5" /> :
    t === "sms" ? <MessageSquare className="h-3.5 w-3.5" /> :
    t === "email" ? <Mail className="h-3.5 w-3.5" /> :
    <StickyNote className="h-3.5 w-3.5" />;

  return (
    <OSShell>
      <div className="space-y-6 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Leads
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{lead.childName}</h1>
              <span className="text-sm text-muted-foreground font-mono">{lead.id}</span>
            </div>
            <p className="text-sm text-muted-foreground">{lead.parentName} · {lead.childAge} · {lead.state}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={lead.priority} variant={priorityVariant(lead.priority)} />
          <StatusBadge status={lead.status} variant={statusVariant(lead.status)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => copy(`${window.location.origin}/leads/${lead.id}`, "Lead link")}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Copy lead link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateLead(lead.id, { priority: lead.priority === "Hot" ? "Warm" : "Hot" })}>
                <AlertCircle className="h-3.5 w-3.5 mr-2" /> Toggle priority
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (window.confirm(`Delete ${lead.childName}? This cannot be undone.`)) {
                    deleteLeads([lead.id]);
                    toast.success("Lead deleted");
                    navigate("/leads");
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inline alert banner */}
      {alert && (
        <div className={cn(
          "rounded-xl border px-4 py-2.5 flex items-center gap-2 text-sm",
          alert.type === "red" ? "bg-destructive/5 border-destructive/30 text-destructive" : "bg-warning/5 border-warning/30 text-warning",
        )}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{alert.message}</span>
        </div>
      )}

      {/* Quick Actions bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={async () => {
          notifyCommunicationResult(await callParent({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance }));
        }}>
          <Phone className="h-3.5 w-3.5" /> Call Parent
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={async () => {
          notifyCommunicationResult(await sendLeadSms({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance }));
        }}>
          <MessageSquare className="h-3.5 w-3.5" /> Send SMS
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={async () => {
          notifyCommunicationResult(await sendLeadEmail({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance }));
        }}>
          <Mail className="h-3.5 w-3.5" /> Send Email
        </Button>
        <Button
          variant="outline" size="sm" className="gap-1.5 text-xs h-8"
          onClick={async () => {
            const res = await sendIntakePacket({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance });
            notifyCommunicationResult(res);
            if (!res.success) return;
            updateLead(lead.id, {
              formStatus: "Sent",
              status: lead.status === "In Contact" || lead.status === "New Lead" ? "Sent Form" : lead.status,
              automationLog: [...lead.automationLog, "Intake packet sent via Mailchimp Email"],
            });
          }}
        >
          <FileText className="h-3.5 w-3.5" /> Send Intake Packet
        </Button>
        <Button
          variant="outline" size="sm" className="gap-1.5 text-xs h-8"
          onClick={() => {
            updateLead(lead.id, {
              consentStatus: "Sent",
              automationLog: [...lead.automationLog, "Consent forms sent"],
            });
            toast.success("Consent forms sent");
          }}
        >
          <Shield className="h-3.5 w-3.5" /> Send Consent
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="gap-1.5 text-xs h-8">
              <ArrowRight className="h-3.5 w-3.5" /> Move Stage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[400px] overflow-y-auto">
            <DropdownMenuLabel className="text-[10px]">Move to stage</DropdownMenuLabel>
            {pipelineStages.map((s) => (
              <DropdownMenuItem
                key={s.name}
                onClick={() => {
                  moveStage([lead.id], s.name as LeadStatus);
                  toast.success(`Moved to ${s.name}`);
                }}
              >
                {s.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <UserPlus className="h-3.5 w-3.5" /> Assign Owner
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-[10px]">Assign to</DropdownMenuLabel>
            {COORDINATORS.map((o) => (
              <DropdownMenuItem
                key={o}
                onClick={() => {
                  assignOwner([lead.id], o);
                  toast.success(`Assigned to ${o}`);
                }}
              >
                {o}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate("/scheduling")}>
          <Calendar className="h-3.5 w-3.5" /> Schedule
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="col-span-2 space-y-6">
          {/* Intake Progress */}
          <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Intake Progress</h3>
              <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 mb-4" />
            <div className="grid grid-cols-6 gap-3">
              {progressSteps.map((step) => (
                <div key={step.label} className="flex flex-col items-center text-center gap-1.5">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", step.done ? "bg-success/10" : "bg-muted")}>
                    {step.done
                      ? <CheckCircle2 className="h-4 w-4 text-success" />
                      : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                  </div>
                  <span className={cn("text-[10px] leading-tight", step.done ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeadTabKey)}>
            <TabsList className="bg-muted/50 flex-wrap h-auto">
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="communications" className="text-xs">Communications ({lead.communications.length})</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">Tasks ({lead.tasks.length})</TabsTrigger>
              <TabsTrigger value="forms" className="text-xs">Forms & Consent</TabsTrigger>
              <TabsTrigger value="insurance" className="text-xs">Insurance / VOB</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">Documents ({lead.documents.length})</TabsTrigger>
              <TabsTrigger value="automation" className="text-xs">Automation</TabsTrigger>
            </TabsList>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                <div className="space-y-4">
                  {lead.timeline.slice().reverse().map((event, i) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {timelineIcons[event.type]}
                        </div>
                        {i < lead.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm text-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          {event.user && <span> · {event.user}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Communications */}
            <TabsContent value="communications" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
                  <h4 className="text-sm font-semibold">Communication log</h4>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={async () => { notifyCommunicationResult(await callParent({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance })); }}><PhoneCall className="h-3 w-3" /> Call Parent</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={async () => { notifyCommunicationResult(await sendLeadSms({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance })); }}><MessageSquare className="h-3 w-3" /> Send SMS</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={async () => { notifyCommunicationResult(await sendLeadEmail({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance })); }}><Mail className="h-3 w-3" /> Send Email</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={async () => { notifyCommunicationResult(await sendMissingInfoReminder({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance })); }}><AlertCircle className="h-3 w-3" /> Missing Info</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={async () => { notifyCommunicationResult(await sendVobUpdate({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance })); }}><Shield className="h-3 w-3" /> VOB Update</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { const note = window.prompt("Add note:"); if (note) { updateLead(lead.id, { notes: (lead.notes ? lead.notes + "\n" : "") + note }); toast.success("Note added"); } }}><StickyNote className="h-3 w-3" /> Note</Button>
                  </div>
                </div>
                <div className="divide-y divide-border/40">
                  {lead.communications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No communication logged yet</p>
                  ) : lead.communications.slice().reverse().map((c) => (
                    <div key={c.id} className="px-5 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          c.type === "call" ? "bg-info/10 text-info" :
                          c.type === "sms" ? "bg-accent/10 text-accent" :
                          c.type === "email" ? "bg-primary/10 text-primary" :
                          "bg-muted text-muted-foreground",
                        )}>
                          {commIcon(c.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.type}</span>
                            {c.outcome && <StatusBadge status={c.outcome} variant={c.outcome === "Connected" ? "success" : c.outcome === "Wrong number" ? "destructive" : "warning"} />}
                            {c.direction && <span className="text-[10px] text-muted-foreground">{c.direction}</span>}
                            {c.durationSec !== undefined && <span className="text-[10px] text-muted-foreground">{Math.floor(c.durationSec / 60)}:{(c.durationSec % 60).toString().padStart(2, "0")}</span>}
                          </div>
                          {c.subject && <p className="text-sm font-medium text-foreground mb-0.5">{c.subject}</p>}
                          <p className="text-sm text-foreground/90">{c.preview}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {new Date(c.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            {c.user && ` · ${c.user}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <CallHistoryList
                  numbers={[lead.phone]}
                  title="Call Recordings & Transcripts"
                  emptyMessage="No tracked calls linked to this lead yet."
                />
              </div>
            </TabsContent>

            {/* Tasks */}
            <TabsContent value="tasks" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 shadow-sm">
                <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Workflow tasks</h4>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Circle className="h-3 w-3" /> Add task</Button>
                </div>
                {lead.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No tasks for this stage</p>
                ) : (
                  <div className="divide-y divide-border/40">
                    {lead.tasks.map((task) => (
                      <div
                        key={task.id}
                        data-deeplink-id={`task-${task.id}`}
                        onClick={() => updateLead(lead.id, { tasks: lead.tasks.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t) })}
                        className="px-5 py-3 flex items-start gap-3 hover:bg-muted/20 cursor-pointer"
                      >
                        {task.completed
                          ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                          : <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", task.completed ? "text-muted-foreground line-through" : "text-foreground font-medium")}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                            {task.workflowStep && <span>Step: {task.workflowStep}</span>}
                            {task.owner && <span>Owner: {task.owner}</span>}
                            {task.dueDate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                            {task.comments !== undefined && task.comments > 0 && <span>{task.comments} comments</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Forms & Consent */}
            <TabsContent value="forms" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Initial Intake Form</h4>
                    </div>
                    <StatusBadge status={lead.formStatus} variant={lead.formStatus === "Completed" ? "success" : lead.formStatus === "Not Sent" ? "muted" : "warning"} />
                  </div>
                  {lead.initialFormLink && (
                    <a href={lead.initialFormLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mb-3">
                      <ExternalLink className="h-3 w-3" /> View PandaDoc form
                    </a>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                    {(["Sent", "Viewed", "Completed"] as const).map((s) => {
                      const order = ["Not Sent", "Sent", "Viewed", "Completed"];
                      const reached = order.indexOf(lead.formStatus) >= order.indexOf(s);
                      return (
                        <div key={s} className={cn("flex items-center gap-1", reached ? "text-success" : "")}>
                          {reached ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                          {s}
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="my-3" />
                  <Button size="sm" className="w-full gap-1.5" onClick={() => { updateLead(lead.id, { formStatus: "Sent", status: lead.status === "In Contact" || lead.status === "New Lead" ? "Sent Form" : lead.status, automationLog: [...lead.automationLog, "Intake form sent"] }); toast.success("Intake form sent"); }}><Send className="h-3 w-3" /> {lead.formStatus === "Not Sent" ? "Send Form" : "Resend Form"}</Button>
                </div>

                <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-accent" />
                      <h4 className="text-sm font-semibold">Consent Forms</h4>
                    </div>
                    <StatusBadge status={lead.consentStatus} variant={lead.consentStatus === "Completed" ? "success" : lead.consentStatus === "Not Sent" ? "muted" : "warning"} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">HIPAA, Treatment, Telehealth, and Financial Responsibility forms.</p>
                  <Separator className="my-3" />
                  <Button size="sm" className="w-full gap-1.5" onClick={() => { updateLead(lead.id, { consentStatus: "Sent", automationLog: [...lead.automationLog, "Consent forms sent"] }); toast.success("Consent forms sent"); }}><Send className="h-3 w-3" /> {lead.consentStatus === "Not Sent" ? "Send Consent Forms" : "Resend Consent"}</Button>
                </div>

                <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Form Review</h4>
                    </div>
                    <StatusBadge
                      status={lead.formReviewStatus}
                      variant={lead.formReviewStatus === "Complete" ? "success" : lead.formReviewStatus === "Missing Information" ? "destructive" : "muted"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Once intake form is completed, the intake coordinator reviews it. Setting Form Review to <strong>Complete</strong> moves the lead to <strong>Sent to VOB</strong>. Setting to <strong>Missing Information</strong> creates a follow-up task.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Insurance / VOB */}
            <TabsContent value="insurance" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <BenefitsCheatSheetMatchPanel
                    insurance={lead.insurance || (lead as unknown as { primaryInsurance?: string }).primaryInsurance}
                    state={lead.state}
                  />
                </div>
                <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Insurance details</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      ["Insurance", lead.insurance],
                      ["Type", lead.insuranceType],
                      ["Payor", lead.payor],
                      ["Coverage", lead.coverageType],
                      ["Payment Plan", lead.paymentPlanNeeded ? "Needed" : "Not required"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">VOB</h4>
                    </div>
                    <StatusBadge
                      status={lead.vobStatus}
                      variant={lead.vobStatus === "Completed" || lead.vobStatus === "Approved" ? "success" : lead.vobStatus === "Issue" ? "destructive" : lead.vobStatus === "Not Started" ? "muted" : "warning"}
                    />
                  </div>
                  {lead.vobFile ? (
                    <div className="flex items-center justify-between bg-muted/40 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{lead.vobFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">Uploaded {lead.vobFile.uploadedAt}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><ExternalLink className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border rounded-lg p-4 text-center">
                      <Upload className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">No VOB file attached yet</p>
                    </div>
                  )}
                  <Separator className="my-3" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">Update VOB Status</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => vobInputRef.current?.click()}
                    >
                      Upload VOB
                    </Button>
                    <input
                      ref={vobInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleVobUpload(e.target.files)}
                    />
                  </div>
                </div>

                {(lead.vobStatus === "Approved" || lead.vobStatus === "Payment Plan Required") && (
                  <div className="bg-success/5 border border-success/30 rounded-xl p-5 col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-success">Ready to move to Clients</p>
                        <p className="text-xs text-success/80 mt-0.5">VOB is {lead.vobStatus.toLowerCase()}. Convert this lead into an active client.</p>
                      </div>
                      <Button size="sm" className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"><ArrowRight className="h-3.5 w-3.5" /> Move to Clients</Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                {lead.documents.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="w-full border border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Drop files here or click to upload</p>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {lead.documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-foreground font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.type}{doc.uploadedAt ? ` · uploaded ${doc.uploadedAt}` : ""}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="my-3" />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => docInputRef.current?.click()}
                  >
                    <Upload className="h-3 w-3" /> Upload document
                  </Button>
                  <span className="text-[10.5px] text-muted-foreground">Storage connection pending</span>
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleDocumentUpload(e.target.files)}
                />
              </div>
              <div className="mt-4">
                <CallHistoryList
                  numbers={[lead.phone]}
                  title="Call Recordings & Transcripts"
                  emptyMessage="No tracked call recordings for this lead yet."
                />
              </div>
            </TabsContent>

            {/* Automation Log */}
            <TabsContent value="automation" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-3 shadow-sm">
                {lead.automationLog.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{log}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column — sidebar info */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground">{lead.phone}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Copy className="h-3 w-3" /></Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground truncate">{lead.email}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Copy className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lead Details</h4>
            <div className="space-y-2.5 text-sm">
              {[
                ["State", lead.state],
                ["Source", lead.source],
                ["Owner", lead.owner],
                ["Child Age", lead.childAge],
                ["Created", new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
                ["Last Contacted", lead.lastContacted ? new Date(lead.lastContacted).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never"],
                ["Days in Stage", `${lead.daysInStage}d`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status Tracking</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Form</span>
                <StatusBadge status={lead.formStatus} variant={lead.formStatus === "Completed" ? "success" : lead.formStatus === "Not Sent" ? "muted" : "warning"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Consent</span>
                <StatusBadge status={lead.consentStatus} variant={lead.consentStatus === "Completed" ? "success" : lead.consentStatus === "Not Sent" ? "muted" : "warning"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Review</span>
                <StatusBadge status={lead.formReviewStatus} variant={lead.formReviewStatus === "Complete" ? "success" : lead.formReviewStatus === "Missing Information" ? "destructive" : "muted"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">VOB</span>
                <StatusBadge status={lead.vobStatus} variant={lead.vobStatus === "Completed" || lead.vobStatus === "Approved" ? "success" : lead.vobStatus === "Issue" ? "destructive" : lead.vobStatus === "Not Started" ? "muted" : "warning"} />
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Next Action</h4>
            <p className="text-sm text-foreground font-medium">{lead.nextAction}</p>
            {lead.nextTaskDue && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due: {new Date(lead.nextTaskDue).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
    </OSShell>
  );
}
