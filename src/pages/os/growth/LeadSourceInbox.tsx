import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Inbox, Plus, Phone, Mail, MessageSquare, Search, Filter, AlertTriangle,
  CheckCircle2, ExternalLink, Link2, FileText, Copy, ShieldCheck, Radio,
  Megaphone, HeartHandshake, Globe, type LucideIcon,
} from "lucide-react";
import { GrowthPageShell, Section, StatCard } from "@/components/os/growth/GrowthPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import { LEAD_SOURCE_OPTIONS } from "@/lib/leads/leadSourceConfig";
import {
  type LeadSourceEvent,
  type LeadSourceEventStatus,
  type LeadSourceEventType,
  eventToLeadDefaults,
  findPossibleLeadMatches,
  getEventDisplayName,
  getEventPriority,
  getEventSourceBadge,
  shouldRequireReview,
} from "@/lib/leads/leadSourceEvents";
import {
  addLeadSourceEvent,
  subscribeLeadSourceEvents,
  updateLeadSourceEventStatus,
} from "@/lib/leads/leadSourceEventsStore";
import { BLOSSOM_INTEGRATIONS } from "@/lib/os/integrations/integrationRegistry";

const STATUS_LABEL: Record<LeadSourceEventStatus, string> = {
  new: "New",
  needs_review: "Needs review",
  possible_duplicate: "Possible duplicate",
  converted_to_lead: "Converted",
  attached_to_existing_lead: "Attached",
  ignored: "Ignored",
  error: "Error",
};

const STATUS_VARIANT: Record<LeadSourceEventStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  needs_review: "secondary",
  possible_duplicate: "secondary",
  converted_to_lead: "outline",
  attached_to_existing_lead: "outline",
  ignored: "outline",
  error: "destructive",
};

const EVENT_TYPE_LABEL: Record<LeadSourceEventType, string> = {
  web_form: "Web form",
  phone_call: "Phone call",
  ai_call: "AI call",
  ad_lead: "Ad lead",
  email_campaign: "Email campaign",
  referral: "Referral",
  business_development: "BD",
  manual_import: "Manual import",
};

const EVENT_TYPE_ICON: Record<LeadSourceEventType, LucideIcon> = {
  web_form: Globe,
  phone_call: Phone,
  ai_call: Radio,
  ad_lead: Megaphone,
  email_campaign: Mail,
  referral: HeartHandshake,
  business_development: HeartHandshake,
  manual_import: FileText,
};

/** Sources we want featured in the integration readiness panel. */
const READINESS_SOURCE_IDS = [
  "ctm", "retell", "leadtrap", "google-ads", "meta-ads", "mailchimp",
  "ms365", "jivetel", "calendly", "apploi", "centralreach",
] as const;

/* ----------------------------- Add-event dialog ---------------------------- */

function AddEventDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [source, setSource] = useState("CTM");
  const [eventType, setEventType] = useState<LeadSourceEventType>("phone_call");
  const [parentFirstName, setPF] = useState("");
  const [parentLastName, setPL] = useState("");
  const [childFirstName, setCF] = useState("");
  const [childLastName, setCL] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("GA");
  const [campaign, setCampaign] = useState("");
  const [referralPartner, setRP] = useState("");
  const [summary, setSummary] = useState("");

  const reset = () => {
    setSource("CTM"); setEventType("phone_call");
    setPF(""); setPL(""); setCF(""); setCL("");
    setPhone(""); setEmail(""); setState("GA");
    setCampaign(""); setRP(""); setSummary("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader><DialogTitle>Add source event</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-1">
            <Label className="text-xs">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {LEAD_SOURCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <Label className="text-xs">Event type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as LeadSourceEventType)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input className="h-9" placeholder="Parent first name" value={parentFirstName} onChange={(e) => setPF(e.target.value)} />
          <Input className="h-9" placeholder="Parent last name" value={parentLastName} onChange={(e) => setPL(e.target.value)} />
          <Input className="h-9" placeholder="Child first name" value={childFirstName} onChange={(e) => setCF(e.target.value)} />
          <Input className="h-9" placeholder="Child last name" value={childLastName} onChange={(e) => setCL(e.target.value)} />
          <Input className="h-9" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input className="h-9" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input className="h-9" placeholder="State (e.g. GA)" value={state} onChange={(e) => setState(e.target.value)} />
          <Input className="h-9" placeholder="Campaign / referral partner" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          <Input className="h-9 col-span-2" placeholder="Referral partner / provider (optional)" value={referralPartner} onChange={(e) => setRP(e.target.value)} />
          <Textarea className="col-span-2" rows={3} placeholder="Summary or raw notes" value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            addLeadSourceEvent({
              source, sourceEventType: eventType,
              parentFirstName, parentLastName, childFirstName, childLastName,
              phone, email, state, campaign,
              referralPartner: referralPartner || undefined,
              summary,
            });
            toast.success("Source event added");
            reset();
            onOpenChange(false);
          }}>Add event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- Attach-to-lead dialog ------------------------- */

function AttachLeadDialog({
  open, onOpenChange, event, onAttach,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: LeadSourceEvent | null;
  onAttach: (leadId: string) => void;
}) {
  const { leads } = useLeads();
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    if (!event) return [];
    const auto = findPossibleLeadMatches(event, leads, { minScore: 0.2, limit: 8 });
    if (!query.trim()) return auto;
    const q = query.trim().toLowerCase();
    return leads
      .filter((l) => `${l.childName} ${l.parentName} ${l.phone} ${l.email}`.toLowerCase().includes(q))
      .slice(0, 8)
      .map((l) => ({ leadId: l.id, lead: l, score: 0, reasons: [] as string[] }));
  }, [event, leads, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Attach to existing lead</DialogTitle></DialogHeader>
        <Input className="h-9" placeholder="Search leads by name, phone, email…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="mt-2 max-h-72 overflow-auto space-y-1.5">
          {matches.length === 0 && (
            <div className="text-xs text-muted-foreground py-6 text-center">No matching leads.</div>
          )}
          {matches.map((m) => (
            <button
              key={m.leadId}
              onClick={() => { onAttach(m.leadId); onOpenChange(false); }}
              className="w-full text-left rounded-lg border border-border/60 bg-card px-3 py-2 hover:bg-muted/60 transition"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm truncate">{m.lead.childName}</div>
                {m.score > 0 && (
                  <Badge variant="secondary" className="text-[10px]">match {(m.score * 100).toFixed(0)}%</Badge>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {m.lead.parentName} · {m.lead.state} · {m.lead.status} · {m.lead.phone || m.lead.email}
              </div>
              {m.reasons.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.reasons.slice(0, 3).map((r) => <Badge key={r} variant="outline" className="text-[10px] py-0">{r}</Badge>)}
                </div>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Main inbox page ----------------------------- */

export default function LeadSourceInbox() {
  const { leads, createLead } = useLeads();
  const [events, setEvents] = useState<LeadSourceEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  useEffect(() => subscribeLeadSourceEvents(setEvents), []);

  // Recompute duplicate scores live as leads change.
  const scored = useMemo(() => events.map((e) => {
    const matches = findPossibleLeadMatches(e, leads, { minScore: 0.35, limit: 5 });
    const top = matches[0];
    return {
      event: e,
      matches,
      score: top?.score ?? 0,
      status: (top && top.score >= 0.4 && e.status === "new") ? "possible_duplicate" as LeadSourceEventStatus : e.status,
    };
  }), [events, leads]);

  const sourceOptions = useMemo(() => Array.from(new Set(events.map((e) => e.source))).sort(), [events]);
  const stateOptions = useMemo(() => Array.from(new Set(events.map((e) => e.state).filter(Boolean))).sort() as string[], [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scored.filter(({ event, status }) => {
      if (sourceFilter !== "all" && event.source !== sourceFilter) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (stateFilter !== "all" && event.state !== stateFilter) return false;
      if (typeFilter !== "all" && event.sourceEventType !== typeFilter) return false;
      if (!q) return true;
      const hay = [
        getEventDisplayName(event), event.phone, event.email, event.source,
        event.campaign, event.referralPartner, event.summary, event.notes,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [scored, search, sourceFilter, statusFilter, stateFilter, typeFilter]);

  const selected = useMemo(
    () => scored.find((s) => s.event.id === selectedId) ?? filtered[0] ?? null,
    [scored, selectedId, filtered],
  );

  // KPIs
  const counts = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const newCount = scored.filter((s) => s.status === "new").length;
    const needsReview = scored.filter((s) => s.status === "needs_review" || s.status === "possible_duplicate").length;
    const dupes = scored.filter((s) => s.status === "possible_duplicate").length;
    const convertedToday = scored.filter((s) => {
      if (s.event.status !== "converted_to_lead" || !s.event.resolvedAt) return false;
      return new Date(s.event.resolvedAt).getTime() >= today.getTime();
    }).length;
    const bySource = new Map<string, number>();
    scored.forEach((s) => {
      if (new Date(s.event.receivedAt).getTime() >= today.getTime() - 86_400_000) {
        bySource.set(s.event.source, (bySource.get(s.event.source) ?? 0) + 1);
      }
    });
    const topSource = Array.from(bySource.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { newCount, needsReview, dupes, convertedToday, topSource };
  }, [scored]);

  const onConvert = async (s: typeof scored[number]) => {
    if (s.score >= 0.6) {
      const ok = window.confirm(
        `This event likely matches an existing lead (${(s.score * 100).toFixed(0)}% match). Create a new lead anyway?`,
      );
      if (!ok) return;
    }
    try {
      const defaults = eventToLeadDefaults(s.event);
      const tags = (defaults.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
      const lead = await createLead({
        patientFirstName: defaults.patientFirstName,
        patientLastName:  defaults.patientLastName,
        childName:        defaults.childName,
        parentFirstName:  defaults.parentFirstName,
        parentLastName:   defaults.parentLastName,
        parentName:       defaults.parentName,
        phone:            defaults.phone,
        email:            defaults.email,
        state:            defaults.state,
        leadSource:       defaults.leadSource,
        referralSource:   defaults.referralSource,
        referralPartner:  defaults.referralPartner,
        utmSource:        defaults.utmSource,
        utmMedium:        defaults.utmMedium,
        utmCampaign:      defaults.utmCampaign,
        insurance:        defaults.insurance,
        pipelineStage:    defaults.pipelineStage,
        nextAction:       defaults.nextAction,
        notes:            defaults.notes,
        tags:             tags.length ? tags : undefined,
        priority:         "Warm",
        sourceMetadata:   defaults.sourceMetadata,
      });
      updateLeadSourceEventStatus(s.event.id, "converted_to_lead", {
        resolvedLeadId: lead.id,
        matchedLeadId: lead.id,
      });
      toast.success(`Lead created from ${s.event.sourceLabel}`, {
        description: lead.childName,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create lead");
    }
  };

  const onAttach = (leadId: string) => {
    if (!selected) return;
    updateLeadSourceEventStatus(selected.event.id, "attached_to_existing_lead", {
      resolvedLeadId: leadId,
      matchedLeadId: leadId,
    });
    toast.success("Event attached to lead");
  };

  const onMarkReview = (id: string) => {
    updateLeadSourceEventStatus(id, "needs_review");
    toast.message("Marked for review");
  };
  const onIgnore = (id: string) => {
    updateLeadSourceEventStatus(id, "ignored");
    toast.message("Event ignored");
  };
  const onCopy = (s: typeof scored[number]) => {
    const text = JSON.stringify(s.event, null, 2);
    navigator.clipboard.writeText(text).then(() => toast.success("Source details copied"));
  };

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Lead Source Inbox"
      description="Review inbound lead events from calls, ads, referral partners, website forms, campaigns, and manual imports before they enter intake."
      actions={[
        { label: "Add source event", icon: Plus, variant: "default", onClick: () => setAddOpen(true) },
        { label: "Open Intake Dashboard", icon: Inbox, to: "/intake/dashboard" },
        { label: "Patient Lifetime Journey", icon: HeartHandshake, to: "/patient-journey" },
      ]}
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="New events" value={String(counts.newCount)} icon={Inbox} status={counts.newCount ? "live" : "ready"} />
        <StatCard label="Needs review" value={String(counts.needsReview)} icon={AlertTriangle} status={counts.needsReview ? "live" : "ready"} />
        <StatCard label="Possible duplicates" value={String(counts.dupes)} icon={Link2} status={counts.dupes ? "live" : "ready"} />
        <StatCard label="Converted today" value={String(counts.convertedToday)} icon={CheckCircle2} status={counts.convertedToday ? "live" : "ready"} />
        <StatCard label="Top source today" value={counts.topSource} icon={Megaphone} status="ready" />
      </div>

      <Section title="Filters" description={null as unknown as string}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 h-9 bg-muted/40 border-0" placeholder="Search by name, phone, email, campaign…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <FilterPill value={sourceFilter} onChange={setSourceFilter} label="Source" options={sourceOptions} />
          <FilterPill value={statusFilter} onChange={setStatusFilter} label="Status"
            options={Object.keys(STATUS_LABEL)} labeller={(v) => STATUS_LABEL[v as LeadSourceEventStatus] ?? v} />
          <FilterPill value={stateFilter} onChange={setStateFilter} label="State" options={stateOptions} />
          <FilterPill value={typeFilter} onChange={setTypeFilter} label="Type"
            options={Object.keys(EVENT_TYPE_LABEL)} labeller={(v) => EVENT_TYPE_LABEL[v as LeadSourceEventType] ?? v} />
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <Section title={`Inbound events (${filtered.length})`} description="Most recent at top.">
          <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60">
            {filtered.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground text-center">
                No events match the current filters.
              </div>
            )}
            {filtered.map((s) => {
              const TypeIcon = EVENT_TYPE_ICON[s.event.sourceEventType] ?? FileText;
              const isSelected = selectedId === s.event.id || (selectedId === null && s === filtered[0]);
              const review = shouldRequireReview(s.event) || s.status === "possible_duplicate";
              return (
                <button key={s.event.id} onClick={() => setSelectedId(s.event.id)}
                  className={cn(
                    "w-full text-left p-3 flex items-start gap-3 hover:bg-muted/40 transition",
                    isSelected && "bg-muted/60",
                  )}>
                  <TypeIcon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium text-sm truncate">{getEventDisplayName(s.event)}</div>
                      <Badge variant={STATUS_VARIANT[s.status]} className="text-[10px]">{STATUS_LABEL[s.status]}</Badge>
                      <Badge variant="outline" className="text-[10px]">{s.event.sourceLabel}</Badge>
                      {review && <Badge variant="secondary" className="text-[10px]">review</Badge>}
                      {getEventPriority(s.event) === "high" && (
                        <Badge variant="default" className="text-[10px]">high</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {s.event.state ?? "—"} · {s.event.phone ?? s.event.email ?? "no contact"} ·{" "}
                      {new Date(s.event.receivedAt).toLocaleString()}
                      {s.event.campaign && ` · ${s.event.campaign}`}
                    </div>
                    {s.event.summary && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">{s.event.summary}</div>
                    )}
                    {s.matches.length > 0 && (
                      <div className="text-[11px] text-amber-700 mt-1">
                        {s.matches.length} possible duplicate{s.matches.length === 1 ? "" : "s"}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <aside className="space-y-4">
          <Section title="Event details" description={null as unknown as string}>
            {!selected ? (
              <div className="text-sm text-muted-foreground p-3">Select an event to see details.</div>
            ) : (
              <EventDetail
                s={selected}
                onConvert={() => onConvert(selected)}
                onAttach={() => setAttachOpen(true)}
                onReview={() => onMarkReview(selected.event.id)}
                onIgnore={() => onIgnore(selected.event.id)}
                onCopy={() => onCopy(selected)}
              />
            )}
          </Section>
          <IntegrationReadinessPanel />
        </aside>
      </div>

      <AddEventDialog open={addOpen} onOpenChange={setAddOpen} />
      <AttachLeadDialog open={attachOpen} onOpenChange={setAttachOpen}
        event={selected?.event ?? null} onAttach={onAttach} />
    </GrowthPageShell>
  );
}

/* ------------------------------- Sub-components ---------------------------- */

function FilterPill({
  value, onChange, label, options, labeller,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: string[];
  labeller?: (v: string) => string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 min-w-[140px] bg-muted/40 border-0">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{label}: all</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{labeller ? labeller(o) : o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function EventDetail({
  s, onConvert, onAttach, onReview, onIgnore, onCopy,
}: {
  s: { event: LeadSourceEvent; matches: ReturnType<typeof findPossibleLeadMatches>; score: number; status: LeadSourceEventStatus };
  onConvert: () => void;
  onAttach: () => void;
  onReview: () => void;
  onIgnore: () => void;
  onCopy: () => void;
}) {
  const badge = getEventSourceBadge(s.event);
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 space-y-3">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-semibold text-sm">{getEventDisplayName(s.event)}</div>
          <Badge variant="outline" className="text-[10px]">{badge.label}</Badge>
          <Badge variant={STATUS_VARIANT[s.status]} className="text-[10px]">{STATUS_LABEL[s.status]}</Badge>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          Received {new Date(s.event.receivedAt).toLocaleString()} · {EVENT_TYPE_LABEL[s.event.sourceEventType]}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Field label="Phone" value={s.event.phone} />
        <Field label="Email" value={s.event.email} />
        <Field label="State" value={s.event.state} />
        <Field label="Campaign" value={s.event.campaign} />
        <Field label="UTM source" value={s.event.utmSource} />
        <Field label="UTM campaign" value={s.event.utmCampaign} />
        <Field label="External id" value={s.event.externalId} />
        <Field label="Referral partner" value={s.event.referralPartner} />
        <Field label="Referring provider" value={s.event.referringProvider} />
        <Field label="Insurance" value={s.event.insurance} />
      </div>

      {s.event.summary && (
        <div className="text-xs">
          <div className="text-muted-foreground mb-1">Summary</div>
          <div className="rounded-lg bg-muted/40 p-2">{s.event.summary}</div>
        </div>
      )}
      {s.event.transcript && (
        <div className="text-xs">
          <div className="text-muted-foreground mb-1">Transcript</div>
          <div className="rounded-lg bg-muted/40 p-2 max-h-32 overflow-auto whitespace-pre-wrap">{s.event.transcript}</div>
        </div>
      )}
      {s.event.callRecordingUrl && (
        <a href={s.event.callRecordingUrl} target="_blank" rel="noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          <Phone className="h-3 w-3" /> Call recording <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {s.matches.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">Possible duplicates</div>
          <div className="space-y-1.5">
            {s.matches.map((m) => (
              <div key={m.leadId} className="rounded-lg border border-border/60 bg-background/60 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <Link to={`/leads/${m.leadId}`} className="font-medium hover:underline">{m.lead.childName}</Link>
                  <Badge variant="secondary" className="text-[10px]">{(m.score * 100).toFixed(0)}%</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground">{m.reasons.join(" · ")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        <Button size="sm" onClick={onConvert}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Convert to lead
        </Button>
        <Button size="sm" variant="outline" onClick={onAttach}>
          <Link2 className="h-3.5 w-3.5 mr-1" /> Attach to existing
        </Button>
        {s.event.resolvedLeadId && (
          <Button asChild size="sm" variant="ghost">
            <Link to={`/leads/${s.event.resolvedLeadId}`}>
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open matched lead
            </Link>
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onReview}>
          <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Mark review
        </Button>
        <Button size="sm" variant="ghost" onClick={onIgnore}>Ignore</Button>
        <Button size="sm" variant="ghost" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5 mr-1" /> Copy
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to={s.event.resolvedLeadId ? `/patient-journey?lead=${s.event.resolvedLeadId}` : `/patient-journey?sourceEventId=${s.event.id}`}>
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Journey
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="truncate">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

/* -------------------------- Integration readiness ------------------------- */

const READINESS_STATUS_LABEL: Record<string, string> = {
  connected: "Connected",
  ready_for_api: "Ready for API",
  needs_credentials: "Needs credentials",
  future: "Future",
};

function readinessStatusFor(id: string): keyof typeof READINESS_STATUS_LABEL {
  // Map registry status to inbox readiness label.
  const reg = BLOSSOM_INTEGRATIONS.find((i) => i.id === id);
  if (!reg) return "future";
  if (reg.status === "connected") return "connected";
  if (reg.status === "planned" || reg.status === "future") return "future";
  return "needs_credentials";
}

function nextStepFor(id: string): string {
  switch (id) {
    case "ctm":         return "Add CTM API key + webhook for call leads";
    case "retell":      return "Wire Retell post-call webhook with transcript payload";
    case "leadtrap":    return "Connect LeadTrap webhook for inbound web forms";
    case "google-ads":  return "Enable Google Ads lead form extension + conversion";
    case "meta-ads":    return "Hook Meta Lead Ads webhook into inbox";
    case "mailchimp":   return "Connect Mailchimp campaign reply/sync";
    case "ms365":       return "Authorize Outlook for parent email threading";
    case "jivetel":     return "Forward Jivetel call events to inbox";
    case "calendly":    return "Sync Calendly intake bookings to inbox";
    case "apploi":      return "Pipe Apploi applicant events (recruiting)";
    case "centralreach": return "Confirm shared dataset stays in sync";
    default:            return "Define inbound payload schema";
  }
}

function IntegrationReadinessPanel() {
  return (
    <Section title="Integration readiness" description="Source systems Blossom OS is preparing to ingest from.">
      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60">
        {READINESS_SOURCE_IDS.map((id) => {
          const reg = BLOSSOM_INTEGRATIONS.find((i) => i.id === id);
          const status = readinessStatusFor(id);
          if (!reg) return null;
          return (
            <div key={id} className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm truncate">{reg.displayName ?? reg.name}</div>
                <Badge variant={status === "connected" ? "default" : "outline"} className="text-[10px]">
                  {READINESS_STATUS_LABEL[status]}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                Inbound: {(reg.inboundData ?? []).slice(0, 3).join(", ") || "—"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
                <ShieldCheck className="h-3 w-3 mt-0.5" /> {nextStepFor(id)}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}