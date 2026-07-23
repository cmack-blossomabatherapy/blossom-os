import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, Circle, FileWarning, ListChecks,
  ShieldQuestion, Users, MapPin, FileText, HeartHandshake, Inbox,
  StickyNote, AlertCircle, Filter, Search,
} from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import { LeadNameLink } from "@/contexts/LeadDrawerContext";
import { getMissingInfoFlags, canonicalFamilyLeadStage } from "@/lib/intake/intakeWorkflow";
import { IntakeStateFilterToggle, useIntakeStateFilter } from "@/lib/intake/intakeStateFilter";
import type { Lead } from "@/data/leads";

type SectionKey =
  | "demographics" | "guardian" | "address" | "insurance"
  | "diagnosis"    | "consents"  | "source"  | "availability" | "notes";

interface SectionSpec {
  key: SectionKey;
  label: string;
  icon: typeof Users;
  required: boolean;
  check: (l: Lead) => { ok: boolean; missing: string[] };
}

const SECTIONS: SectionSpec[] = [
  { key: "demographics", label: "Demographics",              icon: Users,          required: true,
    check: (l) => {
      const missing: string[] = [];
      if (!l.childName?.trim()) missing.push("Child name");
      if (!l.intake?.dob && !l.childAge?.trim()) missing.push("DOB / age");
      return { ok: missing.length === 0, missing };
    } },
  { key: "guardian", label: "Guardian / Contact Info",       icon: HeartHandshake, required: true,
    check: (l) => {
      const missing: string[] = [];
      if (!l.parentName?.trim()) missing.push("Parent / guardian name");
      if (!l.phone?.trim() && !l.email?.trim()) missing.push("Phone or email");
      return { ok: missing.length === 0, missing };
    } },
  { key: "address", label: "Address / State / Location",     icon: MapPin,         required: true,
    check: (l) => {
      const missing: string[] = [];
      if (!l.state?.trim()) missing.push("State");
      return { ok: missing.length === 0, missing };
    } },
  { key: "insurance", label: "Insurance Cards",              icon: ShieldQuestion, required: true,
    check: (l) => {
      const missing: string[] = [];
      if (!l.insurance?.trim()) missing.push("Payer / plan");
      return { ok: missing.length === 0, missing };
    } },
  { key: "diagnosis", label: "Diagnosis Documents",          icon: FileText,       required: true,
    check: (l) => {
      const f = getMissingInfoFlags(l);
      const missing: string[] = [];
      if (f.diagnosis) missing.push("Diagnosis confirmation");
      if (!(l.documents ?? []).some((d) => /dx|diagnos|eval/i.test(d.name ?? ""))) missing.push("DX / evaluation doc");
      return { ok: missing.length === 0, missing };
    } },
  { key: "consents", label: "Consents / Forms",              icon: FileWarning,    required: true,
    check: (l) => {
      const missing: string[] = [];
      const formOk = l.formStatus === "Complete" || l.formStatus === "Completed";
      const reviewOk = l.formReviewStatus === "Complete";
      if (!formOk && !reviewOk) missing.push("Intake packet completed");
      return { ok: missing.length === 0, missing };
    } },
  { key: "source", label: "Lead Source",                     icon: Inbox,          required: true,
    check: (l) => {
      const missing: string[] = [];
      const hasSource = !!(l.source || l.intake?.referralSource || l.intake?.referralPartner);
      if (!hasSource) missing.push("Referral source");
      return { ok: missing.length === 0, missing };
    } },
  { key: "availability", label: "Family Availability",       icon: ListChecks,     required: false,
    check: (l) => {
      const missing: string[] = [];
      if (!l.intake?.messageComments?.trim()) missing.push("Availability / scheduling window");
      return { ok: missing.length === 0, missing };
    } },
  { key: "notes", label: "Notes for RCM / Auth / Scheduling", icon: StickyNote,    required: false,
    check: (l) => {
      const missing: string[] = [];
      if (!l.notes?.trim()) missing.push("Handoff notes");
      return { ok: missing.length === 0, missing };
    } },
];

function isBlocked(lead: Lead): boolean {
  const stage = canonicalFamilyLeadStage(lead.status);
  if (stage === "Intake Packet Follow Up") return true;
  return (lead.tags ?? []).some((t) => /blocked|blocker/i.test(t));
}

function computeReadiness(lead: Lead) {
  const results = SECTIONS.map((s) => ({ ...s, result: s.check(lead) }));
  const requiredMissing = results.filter((r) => r.required && !r.result.ok);
  const totalRequired = results.filter((r) => r.required).length;
  const completeRequired = totalRequired - requiredMissing.length;
  return {
    results,
    requiredMissing,
    totalRequired,
    completeRequired,
    ready: requiredMissing.length === 0 || isBlocked(lead),
    blocked: isBlocked(lead),
  };
}

export default function CentralReachPacketPrep() {
  const { leads: allLeads, loading } = useLeads();
  const { matches } = useIntakeStateFilter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "incomplete" | "ready" | "blocked">("all");

  const scoped = useMemo(
    () => allLeads.filter((l) => matches(l.state)),
    [allLeads, matches],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped
      .filter((l) => canonicalFamilyLeadStage(l.status) !== "Intake Complete")
      .map((lead) => ({ lead, readiness: computeReadiness(lead) }))
      .filter(({ lead, readiness }) => {
        if (filter === "ready" && !(readiness.ready && !readiness.blocked)) return false;
        if (filter === "incomplete" && readiness.ready) return false;
        if (filter === "blocked" && !readiness.blocked) return false;
        if (!q) return true;
        return (
          lead.childName?.toLowerCase().includes(q) ||
          lead.parentName?.toLowerCase().includes(q) ||
          lead.owner?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.readiness.completeRequired - b.readiness.completeRequired);
  }, [scoped, filter, query]);

  const totals = useMemo(() => {
    const ready    = rows.filter((r) => r.readiness.ready && !r.readiness.blocked).length;
    const blocked  = rows.filter((r) => r.readiness.blocked).length;
    const pending  = rows.length - ready - blocked;
    return { total: rows.length, ready, pending, blocked };
  }, [rows]);

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="CentralReach Packet Prep"
      description="Confirm every operational field the CentralReach chart needs. Send to the CR Handoff Queue when required items are complete or clearly marked as blocked."
      headerRight={<IntakeStateFilterToggle />}
      actions={[
        { label: "CR Handoff Queue", icon: ArrowRight, variant: "default", to: "/authorizations/handoff" },
        { label: "Missing Info Queue", icon: FileWarning, to: "/intake/missing-information" },
      ]}
    >
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile label="Leads in prep"   value={totals.total}   tone="slate" />
        <SummaryTile label="Ready for CR"    value={totals.ready}   tone="emerald" />
        <SummaryTile label="Pending items"   value={totals.pending} tone="amber" />
        <SummaryTile label="Blocked"         value={totals.blocked} tone="rose" />
      </section>

      <section className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search child, parent, or owner"
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          {(["all","incomplete","ready","blocked"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              className="h-7 px-2 capitalize"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </section>

      {rows.length === 0 ? (
        <ReadyForDataNotice message={loading ? "Loading leads…" : "No leads match this filter."} />
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {rows.map(({ lead, readiness }) => (
            <PacketCard key={lead.id} lead={lead} readiness={readiness} />
          ))}
        </section>
      )}
    </GrowthPageShell>
  );
}

function SummaryTile({
  label, value, tone,
}: { label: string; value: number; tone: "slate" | "emerald" | "amber" | "rose" }) {
  const toneCls = {
    slate:   "bg-slate-50 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber:   "bg-amber-50 text-amber-800 border-amber-200",
    rose:    "bg-rose-50 text-rose-700 border-rose-200",
  }[tone];
  return (
    <div className={cn("rounded-2xl border p-4", toneCls)}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
}

function PacketCard({
  lead,
  readiness,
}: {
  lead: Lead;
  readiness: ReturnType<typeof computeReadiness>;
}) {
  const pct = Math.round((readiness.completeRequired / readiness.totalRequired) * 100);
  const statusBadge = readiness.blocked
    ? { label: "Blocked", cls: "bg-rose-50 text-rose-700 border-rose-200" }
    : readiness.ready
    ? { label: "Ready for CR", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : { label: `${pct}% complete`, cls: "bg-amber-50 text-amber-800 border-amber-200" };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <LeadNameLink leadId={lead.id} className="font-semibold hover:underline truncate block">
            {lead.childName}
          </LeadNameLink>
          <div className="text-xs text-muted-foreground mt-0.5">
            {lead.parentName || "—"} · {lead.state || "—"} · Owner {lead.owner || "Unassigned"}
          </div>
        </div>
        <Badge variant="outline" className={cn("shrink-0 text-[10px]", statusBadge.cls)}>
          {statusBadge.label}
        </Badge>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {readiness.results.map(({ key, label, icon: Icon, required, result }) => (
          <li key={key} className="flex items-start gap-2 text-xs">
            {result.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Circle className={cn("h-3.5 w-3.5 mt-0.5 shrink-0",
                required ? "text-rose-500" : "text-muted-foreground")} />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className={cn("truncate", result.ok && "text-muted-foreground line-through")}>
                  {label}{required ? "" : " (optional)"}
                </span>
              </div>
              {!result.ok && result.missing.length > 0 && (
                <div className="text-[11px] text-muted-foreground truncate">{result.missing.join(" · ")}</div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          {readiness.blocked && <AlertCircle className="h-3 w-3 text-rose-500" />}
          {readiness.completeRequired}/{readiness.totalRequired} required complete
        </div>
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
            <Link to={`/leads/${lead.id}`}>Open lead</Link>
          </Button>
          {readiness.ready ? (
            <Button asChild size="sm" className="h-7 text-xs">
              <Link to={`/authorizations/handoff?leadId=${lead.id}`}>
                Send to CR Handoff <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link to={`/intake/missing-information?leadId=${lead.id}`}>Resolve missing</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}