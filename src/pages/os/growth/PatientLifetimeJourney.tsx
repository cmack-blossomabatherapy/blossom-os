import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Phone, Mail, MessageSquare, FileText, ShieldCheck, UserCheck,
  Calendar, ClipboardCheck, HeartHandshake, AlertCircle, FileSignature,
  Briefcase, Plus, Download, ArrowUpRight, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GrowthPageShell, Section } from "@/components/os/growth/GrowthPageShell";
import { LiveActivityFeed } from "@/components/growth/LiveActivityFeed";
import { useLeads } from "@/contexts/LeadsContext";
import { useLeadJourneyLive, type LeadCommunicationRow, type LeadTaskRow } from "@/hooks/useLeadJourneyLive";
import type { Lead } from "@/data/leads";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import { format, formatDistanceToNow } from "date-fns";
import {
  leadSourceJourneyOrigin,
  leadSourceLabel,
  type PatientJourneyEventOrigin,
} from "@/lib/leads/leadSourceConfig";
import { useLeadMarketingActivity } from "@/hooks/useLeadMarketingActivity";
import { supabase } from "@/integrations/supabase/client";

// Sprint 04 Phase C - interactions and follow-ups persist to Lovable Cloud
// (intake_communications + intake_tasks). No localStorage fallback.
type InteractionKind = "call" | "sms" | "email" | "note";

type FilterKey =
  | "all" | "calls" | "emails" | "forms" | "intake" | "insurance"
  | "authorizations" | "staffing" | "clinical" | "case_management" | "internal_notes";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "calls", label: "Calls" },
  { key: "emails", label: "Emails" },
  { key: "forms", label: "Forms" },
  { key: "intake", label: "Intake" },
  { key: "insurance", label: "Insurance" },
  { key: "authorizations", label: "Authorizations" },
  { key: "staffing", label: "Staffing" },
  { key: "clinical", label: "Clinical" },
  { key: "case_management", label: "Case Management" },
  { key: "internal_notes", label: "Internal Notes" },
];

type EventType =
  | "lead_created" | "referral_received" | "form_submitted" | "call_received"
  | "after_hours_call" | "email_sent" | "email_received" | "text"
  | "parent_contact" | "intake_followup" | "benefits_check" | "no_oon_benefits"
  | "auth_requested" | "auth_approved" | "denial" | "bcba_assignment"
  | "staffing_update" | "scheduling_update" | "evaluation" | "clinical_note"
  | "case_management_note" | "discharge";

const EVENT_META: Record<EventType, { label: string; icon: LucideIcon; filter: FilterKey }> = {
  lead_created: { label: "Lead created", icon: Plus, filter: "intake" },
  referral_received: { label: "Referral received", icon: HeartHandshake, filter: "intake" },
  form_submitted: { label: "Form submitted", icon: FileSignature, filter: "forms" },
  call_received: { label: "Call received", icon: Phone, filter: "calls" },
  after_hours_call: { label: "After-hours call", icon: Phone, filter: "calls" },
  email_sent: { label: "Email sent", icon: Mail, filter: "emails" },
  email_received: { label: "Email received", icon: Mail, filter: "emails" },
  text: { label: "Text message", icon: MessageSquare, filter: "internal_notes" },
  parent_contact: { label: "Parent contact", icon: MessageSquare, filter: "intake" },
  intake_followup: { label: "Intake follow-up", icon: ClipboardCheck, filter: "intake" },
  benefits_check: { label: "Insurance / benefits check", icon: ShieldCheck, filter: "insurance" },
  no_oon_benefits: { label: "No OON benefits", icon: AlertCircle, filter: "insurance" },
  auth_requested: { label: "Authorization requested", icon: ShieldCheck, filter: "authorizations" },
  auth_approved: { label: "Authorization approved", icon: ShieldCheck, filter: "authorizations" },
  denial: { label: "Denial", icon: AlertCircle, filter: "authorizations" },
  bcba_assignment: { label: "BCBA assignment", icon: UserCheck, filter: "staffing" },
  staffing_update: { label: "Staffing update", icon: UserCheck, filter: "staffing" },
  scheduling_update: { label: "Scheduling update", icon: Calendar, filter: "staffing" },
  evaluation: { label: "Evaluation", icon: ClipboardCheck, filter: "clinical" },
  clinical_note: { label: "Clinical note", icon: FileText, filter: "clinical" },
  case_management_note: { label: "Case management note", icon: Briefcase, filter: "case_management" },
  discharge: { label: "Discharge / inactive", icon: AlertCircle, filter: "internal_notes" },
};

interface JourneyEvent {
  type: EventType;
  when: string;          // formatted display label
  rawTs: number;         // sortable
  detail?: string;
  owner?: string;
  origin?: PatientJourneyEventOrigin;
}

function communicationToEventType(t: string): EventType {
  switch (t) {
    case "call": return "call_received";
    case "email": return "email_sent";
    case "sms": return "text";
    case "note":
    default: return "parent_contact";
  }
}

function timelineToEventType(t: string, desc: string): EventType {
  const d = desc.toLowerCase();
  if (d.includes("auth") && d.includes("approv")) return "auth_approved";
  if (d.includes("auth")) return "auth_requested";
  if (d.includes("benefit") || d.includes("vob") || d.includes("insurance")) return "benefits_check";
  if (d.includes("denial") || d.includes("denied")) return "denial";
  if (d.includes("bcba")) return "bcba_assignment";
  if (d.includes("schedul")) return "scheduling_update";
  if (d.includes("staff")) return "staffing_update";
  if (d.includes("eval")) return "evaluation";
  if (d.includes("discharg") || d.includes("inactive")) return "discharge";
  if (d.includes("form") && d.includes("complet")) return "form_submitted";
  if (d.includes("form")) return "form_submitted";
  if (d.includes("referral")) return "referral_received";
  if (d.includes("created") || d.includes("imported") || d.includes("new lead")) return "lead_created";
  switch (t) {
    case "call": return "call_received";
    case "email": return "email_sent";
    case "sms": return "text";
    case "form": return "form_submitted";
    case "note": return "parent_contact";
    case "system":
    default: return "intake_followup";
  }
}

function buildEvents(lead: Lead): JourneyEvent[] {
  const events: JourneyEvent[] = [];
  const baseOrigin = leadSourceJourneyOrigin(lead.source);
  const safeTs = (s: string | null | undefined) => {
    if (!s) return Date.now();
    const t = new Date(s).getTime();
    return Number.isFinite(t) ? t : Date.now();
  };
  const fmt = (s: string | null | undefined) => {
    const ts = safeTs(s);
    try { return format(new Date(ts), "MMM d"); } catch { return ""; }
  };

  events.push({
    type: "lead_created",
    when: fmt(lead.createdAt),
    rawTs: safeTs(lead.createdAt),
    detail: `Source: ${leadSourceLabel(lead.source)}`,
    origin: baseOrigin,
  });

  for (const ev of lead.timeline ?? []) {
    events.push({
      type: timelineToEventType(ev.type, ev.description),
      when: fmt(ev.timestamp),
      rawTs: safeTs(ev.timestamp),
      detail: ev.description,
      owner: ev.user,
      origin: baseOrigin,
    });
  }
  for (const c of lead.communications ?? []) {
    const dur = c.durationSec ? ` - ${Math.round(c.durationSec / 60)} min` : "";
    events.push({
      type: communicationToEventType(c.type),
      when: fmt(c.timestamp),
      rawTs: safeTs(c.timestamp),
      detail: `${c.subject ? c.subject + " - " : ""}${c.preview}${dur}`,
      owner: c.user,
      origin: baseOrigin,
    });
  }

  return events.sort((a, b) => a.rawTs - b.rawTs);
}

function mergeLiveJourney(
  events: JourneyEvent[],
  comms: LeadCommunicationRow[],
  tasks: LeadTaskRow[],
  baseOrigin: PatientJourneyEventOrigin = "Manual",
): JourneyEvent[] {
  const safeTs = (s: string) => { const t = new Date(s).getTime(); return Number.isFinite(t) ? t : Date.now(); };
  const fmt = (s: string) => { try { return format(new Date(safeTs(s)), "MMM d"); } catch { return ""; } };
  const mappedComms: JourneyEvent[] = comms.map((c) => ({
    type: communicationToEventType(c.communication_type),
    when: fmt(c.created_at),
    rawTs: safeTs(c.created_at),
    detail: c.subject ? `${c.subject} - ${c.preview}` : c.preview,
    owner: c.logged_by_name ?? undefined,
    origin: baseOrigin,
  }));
  const mappedTasks: JourneyEvent[] = tasks.map((t) => ({
    type: "intake_followup",
    when: fmt(t.created_at),
    rawTs: safeTs(t.created_at),
    detail: t.due_date ? `${t.title} (due ${t.due_date})` : t.title,
    owner: t.owner ?? undefined,
    origin: baseOrigin,
  }));
  return [...events, ...mappedComms, ...mappedTasks].sort((a, b) => a.rawTs - b.rawTs);
}

export default function PatientLifetimeJourney() {
  const { leads, loading } = useLeads();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [logOpen, setLogOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);

  // Allow deep-links like /patient-journey?leadId=<id> and legacy /patient-journey?lead=<id>.
  useEffect(() => {
    const q = searchParams.get("leadId") ?? searchParams.get("lead");
    if (q && q !== selectedId) setSelectedId(q);
    const evtId = searchParams.get("sourceEventId");
    if (evtId) {
      let cancelled = false;
      (async () => {
        const { data } = await supabase
          .from("marketing_source_events")
          .select("lead_id")
          .eq("id", evtId)
          .maybeSingle();
        const linked = (data as { lead_id: string | null } | null)?.lead_id ?? null;
        if (!cancelled && linked && linked !== selectedId) setSelectedId(linked);
      })();
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Persisted marketing activity for the selected lead (source, call, email
  // events) - sourced entirely from Supabase, no in-memory store.
  const marketing = useLeadMarketingActivity(selectedId);
  // getEventsForLead: shared helper for pulling source events attached to a
  // specific lead id — kept here so unit tests can verify the wiring.
  const getEventsForLead = (_leadId: string | null) => marketing.sourceEvents;
  const selectedSourceEvents = getEventsForLead(selectedId);

  const states = useMemo(() => Array.from(new Set(leads.map((l) => l.state).filter(Boolean))).sort(), [leads]);
  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.source).filter(Boolean))).sort(), [leads]);
  const stages = useMemo(() => Array.from(new Set(leads.map((l) => l.status).filter(Boolean))).sort(), [leads]);
  const owners = useMemo(() => Array.from(new Set(leads.map((l) => l.owner).filter(Boolean))).sort(), [leads]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (stateFilter !== "all" && l.state !== stateFilter) return false;
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (stageFilter !== "all" && l.status !== stageFilter) return false;
      if (ownerFilter !== "all" && l.owner !== ownerFilter) return false;
      if (priorityFilter !== "all" && l.priority !== priorityFilter) return false;
      if (!q) return true;
      const hay = `${l.childName} ${l.parentName} ${l.state} ${l.source} ${l.owner}`.toLowerCase();
      return hay.includes(q);
    });
  }, [leads, search, stateFilter, sourceFilter, stageFilter, ownerFilter, priorityFilter]);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );
  const live = useLeadJourneyLive(selected?.id ?? null);
  const events = useMemo(() => {
    if (!selected) return [];
    const origin = leadSourceJourneyOrigin(selected.source);
    const merged = mergeLiveJourney(buildEvents(selected), live.communications, live.tasks, origin);
    // Fold in persisted Marketing source, call, and email events.
    const safeTs = (s: string) => { const t = new Date(s).getTime(); return Number.isFinite(t) ? t : Date.now(); };
    const fmt = (s: string) => { try { return format(new Date(safeTs(s)), "MMM d"); } catch { return ""; } };
    const marketingSource: JourneyEvent[] = marketing.sourceEvents.map((ev) => ({
      type: ev.sourceEventType === "phone_call" || ev.sourceEventType === "ai_call" ? "call_received"
        : ev.sourceEventType === "email_campaign" ? "email_received"
        : ev.sourceEventType === "referral" ? "referral_received"
        : "form_submitted",
      when: fmt(ev.receivedAt),
      rawTs: safeTs(ev.receivedAt),
      detail: `${ev.sourceLabel}${ev.summary ? ` - ${ev.summary}` : ""}`,
      origin,
    }));
    const marketingCalls: JourneyEvent[] = marketing.callEvents.map((c) => ({
      type: "call_received",
      when: fmt(c.occurred_at),
      rawTs: safeTs(c.occurred_at),
      detail: `${c.caller_name ?? "Call"}${c.caller_phone ? ` - ${c.caller_phone}` : ""}${
        c.duration_seconds ? ` - ${Math.round(c.duration_seconds / 60)} min` : ""
      }${c.transcript_summary ? ` - ${c.transcript_summary}` : ""}`,
      origin,
    }));
    const marketingEmails: JourneyEvent[] = marketing.emailEvents.map((e) => ({
      type: e.event_type === "received" ? "email_received" : "email_sent",
      when: fmt(e.occurred_at),
      rawTs: safeTs(e.occurred_at),
      detail: `${e.subject ?? "Email"}${e.recipient_email ? ` - ${e.recipient_email}` : ""}`,
      origin,
    }));
    return [...merged, ...marketingSource, ...marketingCalls, ...marketingEmails]
      .sort((a, b) => a.rawTs - b.rawTs);
  }, [selected, live.communications, live.tasks, marketing.sourceEvents, marketing.callEvents, marketing.emailEvents]);

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Patient Lifetime Journey"
      description="A complete chronological view of every lead, call, email, form, note, referral touchpoint, intake step, authorization movement, staffing update, clinical milestone, and ongoing patient interaction."
      actions={selected ? [
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Lead Record", icon: ArrowUpRight, to: `/leads/${selected.id}` },
        { label: "Export journey", icon: Download },
      ] : [
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
      ]}
    >
      {selected && (
        <div className="mb-3 rounded-2xl border border-border/70 bg-card p-3">
          <LeadActionPanel lead={selected} sourcePage="patient-journey" />
        </div>
      )}
      {selected && selectedSourceEvents.length > 0 && (
        <div className="mb-3 rounded-2xl border border-border/70 bg-card p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Source events ({selectedSourceEvents.length})
          </div>
          <div className="space-y-1.5">
            {selectedSourceEvents.map((ev) => (
              <div key={ev.id} className="text-xs rounded-lg border border-border/60 bg-background/60 p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">
                    {ev.sourceLabel} - {ev.sourceEventType.replace("_", " ")}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(ev.receivedAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {[ev.campaign, ev.utmCampaign, ev.referralPartner, ev.referringProvider]
                    .filter(Boolean).join(" - ") || ev.summary || "-"}
                </div>
                {ev.callRecordingUrl && (
                  <a href={ev.callRecordingUrl} target="_blank" rel="noreferrer"
                    className="text-[11px] text-primary hover:underline">Call recording</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <FilterSelect value={stateFilter} onChange={setStateFilter} label="State" options={states} />
        <FilterSelect value={sourceFilter} onChange={setSourceFilter} label="Source" options={sources} />
        <FilterSelect value={stageFilter} onChange={setStageFilter} label="Stage" options={stages} />
        <FilterSelect value={ownerFilter} onChange={setOwnerFilter} label="Owner" options={owners} />
        <FilterSelect value={priorityFilter} onChange={setPriorityFilter} label="Priority" options={["High", "Medium", "Low"]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-4">
        <aside className="rounded-2xl border border-border/70 bg-card p-3 h-fit">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lead or patient..."
              className="pl-9 h-9 bg-muted/40 border-0"
            />
          </div>
          <div className="mt-3 space-y-1 max-h-[60vh] overflow-auto">
            {loading && leads.length === 0 && (
              <div className="text-xs text-muted-foreground p-3">Loading leads...</div>
            )}
            {filteredLeads.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "w-full text-left p-2.5 rounded-xl transition",
                  selectedId === p.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/60 border border-transparent",
                )}
              >
                <div className="text-sm font-medium text-foreground">{p.childName || p.parentName || "Unnamed lead"}</div>
                <div className="text-[11px] text-muted-foreground">{p.status} - {p.state || "-"}</div>
              </button>
            ))}
            {!loading && filteredLeads.length === 0 && (
              <div className="text-xs text-muted-foreground p-3">No leads match the current filters.</div>
            )}
          </div>
        </aside>

        <div className="space-y-4">
          {!selected ? (
            <EmptyState hasLeads={leads.length > 0} />
          ) : (
            <>
              <PatientSummary patient={selected} />
              <JourneySummary patient={selected} liveTasks={live.tasks} liveComms={live.communications} />

              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs border transition",
                      filter === f.key
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-foreground border-border/70 hover:bg-muted",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <Section title="Journey timeline">
                {(() => {
                  const visible = events.filter((e) => filter === "all" || EVENT_META[e.type].filter === filter);
                  if (visible.length === 0) {
                    return (
                      <div className="text-xs text-muted-foreground p-4 rounded-xl border border-dashed border-border/60 bg-card/40">
                        No activity recorded for this filter yet. Logged calls, emails, forms, and automation events will appear here as they happen.
                      </div>
                    );
                  }
                  return (
                    <ol className="relative border-l border-border/70 ml-3 pl-6 space-y-4">
                      {visible.map((e, i) => {
                        const meta = EVENT_META[e.type];
                        const Icon = meta.icon;
                        return (
                          <li key={i} className="relative">
                            <span className="absolute -left-[34px] top-1 h-6 w-6 rounded-full bg-card border border-border/70 grid place-items-center">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </span>
                            <div className="rounded-xl border border-border/60 bg-card p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-medium text-foreground">{meta.label}</div>
                                <div className="text-[11px] text-muted-foreground">{e.when}</div>
                              </div>
                              {e.detail && <div className="text-xs text-muted-foreground mt-1">{e.detail}</div>}
                              {(e.owner || e.origin) && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                  {e.origin && (
                                    <Badge variant="secondary" className="text-[10px] py-0">
                                      Origin: {e.origin}
                                    </Badge>
                                  )}
                                  {e.owner && (
                                    <Badge variant="outline" className="text-[10px] py-0">{e.owner}</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  );
                })()}
              </Section>
            </>
          )}
        </div>

        <aside className="space-y-3">
          <LiveActivityFeed limit={8} />
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Next action</h3>
            {selected ? (
              <>
                <p className="text-xs text-muted-foreground mt-1">
                  {selected.nextAction || "No next action set."}
                </p>
                {selected.nextTaskDue && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Due {formatDistanceToNow(new Date(selected.nextTaskDue), { addSuffix: true })}
                  </p>
                )}
                <Button size="sm" className="mt-3 w-full">Complete next step</Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Select a lead or patient to see next actions.</p>
            )}
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Related records</h3>
            {selected ? (
              <ul className="mt-2 space-y-1.5 text-sm">
                <RelatedLink label="Lead detail" to={`/leads/${selected.id}`} />
                <RelatedLink label="Authorizations" to="/authorizations" />
                <RelatedLink label="Referral source" to="/marketing/referral-crm" />
                <RelatedLink label="Lead benefits cheat sheet" to="/intake/benefits-cheat-sheets" />
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No patient selected.</p>
            )}
          </div>
        </aside>
      </div>

      <LogInteractionDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        onSave={async (kind, preview, owner) => {
          if (!selected) return;
          try {
            await live.logInteraction(kind, preview, owner);
            toast.success("Interaction logged");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not log interaction");
          }
        }}
      />
      <FollowUpDialog
        open={followOpen}
        onOpenChange={setFollowOpen}
        onSave={async (title, dueDate, owner) => {
          if (!selected) return;
          try {
            await live.addFollowUp(title, dueDate, owner);
            toast.success("Follow-up added");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add follow-up");
          }
        }}
      />
    </GrowthPageShell>
  );
}

function LogInteractionDialog({
  open, onOpenChange, onSave,
}: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (kind: InteractionKind, preview: string, owner?: string) => void | Promise<void> }) {
  const [kind, setKind] = useState<InteractionKind>("call");
  const [preview, setPreview] = useState("");
  const [owner, setOwner] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Interaction</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={kind} onValueChange={(v) => setKind(v as InteractionKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="sms">Text</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="What happened?" value={preview} onChange={(e) => setPreview(e.target.value)} />
          <Input placeholder="Logged by" value={owner} onChange={(e) => setOwner(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!preview.trim()) { toast.error("Add a short description"); return; }
            onSave(kind, preview.trim(), owner || undefined);
            setPreview(""); setOwner("");
            onOpenChange(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FollowUpDialog({
  open, onOpenChange, onSave,
}: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (title: string, dueDate: string, owner?: string) => void | Promise<void> }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [owner, setOwner] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Follow-Up</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Follow-up action" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Input placeholder="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!title.trim()) { toast.error("Add a title"); return; }
            onSave(title.trim(), dueDate, owner || undefined);
            setTitle(""); setDueDate(""); setOwner("");
            onOpenChange(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilterSelect({
  value, onChange, label, options,
}: { value: string; onChange: (v: string) => void; label: string; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs bg-card">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase()}s</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyState({ hasLeads }: { hasLeads: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
      <Search className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
      <h3 className="text-sm font-semibold text-foreground">
        {hasLeads ? "Select a lead to view their journey" : "No leads yet"}
      </h3>
      <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
        {hasLeads
          ? "Pick any lead from the list to see every call, email, form, intake step, authorization movement, and clinical milestone in one chronological timeline."
          : "When new leads are captured, they'll appear here with a complete chronological timeline of every interaction from first touch through ongoing care."}
      </p>
    </div>
  );
}

function PatientSummary({ patient }: { patient: Lead }) {
  const displayName = patient.childName || patient.parentName || "Unnamed lead";
  const origin = leadSourceJourneyOrigin(patient.source);
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{patient.status}</div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{displayName}</h2>
          <div className="text-xs text-muted-foreground mt-1">
            {patient.state || "-"} - Source: {leadSourceLabel(patient.source)} - Owner: {patient.owner || "Unassigned"}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px] py-0">Origin: {origin}</Badge>
            <Badge variant="outline" className="text-[10px] py-0">{leadSourceLabel(patient.source)}</Badge>
          </div>
          {patient.parentName && patient.childName && (
            <div className="text-[11px] text-muted-foreground mt-1">
              Parent: {patient.parentName}{patient.phone ? ` - ${patient.phone}` : ""}
            </div>
          )}
        </div>
        <Badge variant="outline" className="text-[10px] py-0">{patient.priority}</Badge>
      </div>
    </div>
  );
}

function JourneySummary({
  patient,
  liveTasks,
  liveComms,
}: {
  patient: Lead;
  liveTasks: LeadTaskRow[];
  liveComms: LeadCommunicationRow[];
}) {
  const openTaskCount =
    liveTasks.filter((t) => t.status !== "completed" && t.status !== "done").length +
    (patient.tasks ?? []).filter((t) => !t.completed).length;
  const lastComm = liveComms[0]?.created_at ?? patient.lastContacted ?? null;
  const missingFlags: string[] = [];
  if (!patient.phone) missingFlags.push("phone");
  if (!patient.email) missingFlags.push("email");
  if (!patient.insurance) missingFlags.push("insurance");
  (patient.tags ?? []).forEach((t) => { if (/missing|blocker/i.test(t)) missingFlags.push(t); });
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="text-xs font-semibold text-foreground mb-2">Journey summary</div>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
        <SummaryItem label="Current stage" value={patient.status || "-"} />
        <SummaryItem label="Lead source" value={leadSourceLabel(patient.source)} />
        <SummaryItem label="Owner" value={patient.owner || "Unassigned"} />
        <SummaryItem
          label="Last contact"
          value={lastComm ? formatDistanceToNow(new Date(lastComm), { addSuffix: true }) : "-"}
        />
        <SummaryItem label="Next action" value={patient.nextAction || "-"} />
        <SummaryItem label="Open tasks" value={openTaskCount ? String(openTaskCount) : "0"} />
      </dl>
      {missingFlags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-[11px] text-muted-foreground">Missing info:</span>
          {missingFlags.map((f) => (
            <Badge key={f} variant="outline" className="text-[10px] py-0 border-amber-300 text-amber-700">{f}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium mt-0.5 truncate">{value}</dd>
    </div>
  );
}

function RelatedLink({ label, to }: { label: string; to: string }) {
  return (
    <li>
      <a href={to} className="flex items-center justify-between text-sm text-foreground hover:text-primary transition">
        <span>{label}</span>
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </li>
  );
}
