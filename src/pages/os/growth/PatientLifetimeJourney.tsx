import { useMemo, useState } from "react";
import {
  Search, Phone, Mail, MessageSquare, FileText, ShieldCheck, UserCheck,
  Calendar, ClipboardCheck, HeartHandshake, AlertCircle, FileSignature,
  Briefcase, Plus, Download, ArrowUpRight, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GrowthPageShell, Section } from "@/components/os/growth/GrowthPageShell";
import { LiveActivityFeed } from "@/components/growth/LiveActivityFeed";

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

interface MockEvent { type: EventType; when: string; detail?: string; owner?: string }
interface MockPatient {
  id: string; name: string; stage: string; state: string;
  source: string; owner: string; status: string; nextAction: string; events: MockEvent[];
}

const MOCK_PATIENTS: MockPatient[] = [
  {
    id: "p1", name: "Avery Chen", stage: "Active care", state: "NC",
    source: "Google Ads", owner: "Intake — Maria", status: "Active",
    nextAction: "Confirm weekly supervision is scheduled for this month.",
    events: [
      { type: "lead_created", when: "Mar 4", detail: "Inbound web form" },
      { type: "call_received", when: "Mar 4", detail: "Initial parent call · 6 min", owner: "Maria" },
      { type: "form_submitted", when: "Mar 5", detail: "Intake packet completed" },
      { type: "benefits_check", when: "Mar 6", detail: "BCBS — in-network confirmed" },
      { type: "auth_requested", when: "Mar 8" },
      { type: "auth_approved", when: "Mar 14", detail: "20 hours / week approved" },
      { type: "bcba_assignment", when: "Mar 16", detail: "Assigned to BCBA Jordan" },
      { type: "evaluation", when: "Mar 22" },
      { type: "clinical_note", when: "Apr 2", detail: "Skill acquisition trending up" },
    ],
  },
  {
    id: "p2", name: "Noah Patel", stage: "Intake", state: "GA",
    source: "Pediatrician referral", owner: "Intake — Sam", status: "In progress",
    nextAction: "Request missing IEP document from family.",
    events: [
      { type: "referral_received", when: "Apr 1", detail: "From Dr. Roberts, Pediatric Partners" },
      { type: "parent_contact", when: "Apr 2", detail: "Left voicemail", owner: "Sam" },
      { type: "call_received", when: "Apr 3", detail: "Returned call — scheduled intake review" },
      { type: "form_submitted", when: "Apr 4", detail: "Insurance card uploaded" },
      { type: "intake_followup", when: "Apr 5", detail: "Awaiting IEP" },
    ],
  },
  {
    id: "p3", name: "Lily Kim", stage: "Lead", state: "TN",
    source: "Facebook Ads", owner: "Intake — Alex", status: "New",
    nextAction: "First parent outreach call.",
    events: [
      { type: "lead_created", when: "Apr 6", detail: "Captured via LeadTrap" },
      { type: "after_hours_call", when: "Apr 6", detail: "Routed to voicemail at 7:42pm" },
    ],
  },
];

export default function PatientLifetimeJourney() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  const selected = useMemo(() => MOCK_PATIENTS.find((p) => p.id === selectedId) ?? null, [selectedId]);
  const filteredPatients = MOCK_PATIENTS.filter((p) =>
    !search ? true : (p.name + " " + p.state).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Patient Lifetime Journey"
      description="A complete chronological view of every lead, call, email, form, note, referral touchpoint, intake step, authorization movement, staffing update, clinical milestone, and ongoing patient interaction."
      actions={selected ? [
        { label: "Add note", icon: Plus, variant: "default" },
        { label: "Export journey", icon: Download },
      ] : []}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-4">
        <aside className="rounded-2xl border border-border/70 bg-card p-3 h-fit">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lead or patient…"
              className="pl-9 h-9 bg-muted/40 border-0"
            />
          </div>
          <div className="mt-3 space-y-1 max-h-[60vh] overflow-auto">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "w-full text-left p-2.5 rounded-xl transition",
                  selectedId === p.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/60 border border-transparent",
                )}
              >
                <div className="text-sm font-medium text-foreground">{p.name}</div>
                <div className="text-[11px] text-muted-foreground">{p.stage} · {p.state}</div>
              </button>
            ))}
            {filteredPatients.length === 0 && (
              <div className="text-xs text-muted-foreground p-3">No matches.</div>
            )}
          </div>
        </aside>

        <div className="space-y-4">
          {!selected ? (
            <EmptyState />
          ) : (
            <>
              <PatientSummary patient={selected} />

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
                <ol className="relative border-l border-border/70 ml-3 pl-6 space-y-4">
                  {selected.events
                    .filter((e) => filter === "all" || EVENT_META[e.type].filter === filter)
                    .map((e, i) => {
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
                            {e.owner && (
                              <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Badge variant="outline" className="text-[10px] py-0">{e.owner}</Badge>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ol>
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
                <p className="text-xs text-muted-foreground mt-1">{selected.nextAction}</p>
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
                <RelatedLink label="Client record" to="/clients" />
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
    </GrowthPageShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
      <Search className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
      <h3 className="text-sm font-semibold text-foreground">Search for a lead or patient</h3>
      <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
        Search for a lead or patient to view the complete Blossom journey. As Blossom OS connects
        more workflows, this timeline will become the single source of truth for every interaction
        from first touch through ongoing care.
      </p>
    </div>
  );
}

function PatientSummary({ patient }: { patient: MockPatient }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{patient.stage}</div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{patient.name}</h2>
          <div className="text-xs text-muted-foreground mt-1">
            {patient.state} · Source: {patient.source} · Owner: {patient.owner}
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] py-0">{patient.status}</Badge>
      </div>
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
