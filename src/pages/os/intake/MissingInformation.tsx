import { useMemo } from "react";
import { LeadNameLink } from "@/contexts/LeadDrawerContext";
import {
  AlertCircle, ArrowRight, List, Plus, FileWarning, Phone as PhoneIcon,
  ShieldQuestion, FileSearch, Clock, Hourglass,
} from "lucide-react";
import { Link } from "react-router-dom";
import { GrowthPageShell, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import {
  IntakeSectionHeader, IntakePulseStrip, INTAKE_TONE, type PulseTileSpec,
} from "@/components/os/intake/IntakeVisuals";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import { Badge } from "@/components/ui/badge";
import { LeadActionsButton } from "@/components/intake/LeadActionsButton";
import { getMissingInfoFlags, canonicalFamilyLeadStage } from "@/lib/intake/intakeWorkflow";
import { IntakeStateFilterToggle, useIntakeStateFilter } from "@/lib/intake/intakeStateFilter";

export default function MissingInformation() {
  const { leads: allLeads, loading } = useLeads();
  const { matches } = useIntakeStateFilter();
  const leads = useMemo(() => allLeads.filter((l) => matches(l.state)), [allLeads, matches]);

  const blocked = useMemo(
    () =>
      leads
        .filter((l) => {
          if (canonicalFamilyLeadStage(l.status) === "Intake Packet Follow Up") return true;
          if (l.formReviewStatus === "Missing Info" || l.formReviewStatus === "Missing Information") return true;
          const flags = getMissingInfoFlags(l);
          return flags.any || (l.tags ?? []).some((t) => /missing|blocker/i.test(t));
        })
        .sort((a, b) => (a.nextTaskDue ?? "").localeCompare(b.nextTaskDue ?? "")),
    [leads],
  );

  const pulseTiles: PulseTileSpec[] = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const overdue = blocked.filter((l) => l.nextTaskDue && new Date(l.nextTaskDue) < today).length;
    let missContacts = 0, missInsurance = 0, missDocs = 0, missDx = 0;
    blocked.forEach((l) => {
      const f = getMissingInfoFlags(l);
      if (f.phone || f.email) missContacts += 1;
      if (f.insurance) missInsurance += 1;
      if (f.documents) missDocs += 1;
      if (f.diagnosis || f.dob) missDx += 1;
    });
    return [
      { key: "blocked",  label: "Total Blocked",     value: blocked.length, hint: "Awaiting info or docs",  icon: FileWarning,    tone: "rose" },
      { key: "overdue",  label: "Overdue",           value: overdue,        hint: "Past next task due",     icon: Clock,          tone: "amber" },
      { key: "contacts", label: "Missing Contact",   value: missContacts,   hint: "Phone or email gap",     icon: PhoneIcon,      tone: "violet" },
      { key: "ins",      label: "Missing Insurance", value: missInsurance,  hint: "Payer or policy gap",    icon: ShieldQuestion, tone: "indigo" },
      { key: "docs",     label: "Missing Docs",      value: missDocs,       hint: "Intake packet items",    icon: FileSearch,     tone: "sky" },
      { key: "dx",       label: "Missing DX / DOB",  value: missDx,         hint: "Eligibility blockers",   icon: AlertCircle,    tone: "emerald" },
    ];
  }, [blocked]);

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="Packet Follow Up / Missing Info"
      description="Leads waiting on packet corrections, documents, insurance details, or family follow-up."
      headerRight={<IntakeStateFilterToggle />}
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Leads", icon: List, to: "/leads" },
        { label: "Open Ready-to-Start Pipeline", icon: ArrowRight, to: "/leads?view=pipeline" },
      ]}
    >
      <section>
        <IntakeSectionHeader icon={Hourglass} tone="rose" title="Blocker Pulse" subtitle="Where families are stuck — tap to drill in." />
        <IntakePulseStrip tiles={pulseTiles} loading={loading} />
      </section>

      <section>
        <IntakeSectionHeader icon={FileWarning} tone="amber" title={`Packet follow-up queue (${blocked.length})`} subtitle="Sorted by next task due date." />
        {blocked.length === 0 ? (
          <ReadyForDataNotice message={loading ? "Loading leads…" : "No packet follow-up items are blocked right now."} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {blocked.map((lead) => {
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const overdueRow = !!lead.nextTaskDue && new Date(lead.nextTaskDue) < today;
              const tone: keyof typeof INTAKE_TONE = overdueRow ? "rose" : "amber";
              const t = INTAKE_TONE[tone];
              return (
                <div key={lead.id} className={cn("group rounded-2xl border border-border/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm", t.bg)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <LeadNameLink leadId={lead.id} className="font-semibold hover:underline truncate block">
                        {lead.childName}
                      </LeadNameLink>
                      <div className="text-xs text-muted-foreground mt-0.5">{lead.parentName}</div>
                    </div>
                    <Badge variant="outline" className="shrink-0">{lead.status}</Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <div>Owner: {lead.owner || "Unassigned"}</div>
                    {lead.lastContacted && <div>Last contact: {lead.lastContacted}</div>}
                    {lead.nextAction && (
                      <div className="flex items-center gap-1 text-amber-700">
                        <AlertCircle className="h-3 w-3" /> {lead.nextAction}
                      </div>
                    )}
                    {lead.nextTaskDue && (
                      <div className={cn("flex items-center gap-1", overdueRow && "text-rose-700 dark:text-rose-300 font-medium")}>
                        <Clock className="h-3 w-3" /> Due: {lead.nextTaskDue}{overdueRow && " · overdue"}
                      </div>
                    )}
                  </div>
                  {(() => {
                    const flags = getMissingInfoFlags(lead);
                    const list = [
                      flags.phone && "phone",
                      flags.email && "email",
                      flags.insurance && "insurance",
                      flags.diagnosis && "DX",
                      flags.dob && "DOB",
                      flags.referralSource && "referral",
                      flags.documents && "docs",
                      flags.owner && "owner",
                    ].filter(Boolean) as string[];
                    return list.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {list.map((f) => (
                          <Badge key={f} variant="secondary" className={cn("text-[10px] py-0", t.icon)}>Missing: {f}</Badge>
                        ))}
                      </div>
                    ) : null;
                  })()}
                  <div className="mt-3">
                    <LeadActionsButton lead={lead} sourcePage="missing-information" />
                    <Link
                      to={`/leads?view=pipeline&lead=${encodeURIComponent(lead.id)}`}
                      className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
                    >
                      Open in Pipeline <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </GrowthPageShell>
  );
}
