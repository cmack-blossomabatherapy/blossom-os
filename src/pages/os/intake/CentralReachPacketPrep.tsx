import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, Circle, FileWarning, ListChecks,
  ShieldQuestion, Users, MapPin, FileText, HeartHandshake, Inbox,
  StickyNote, AlertCircle, Filter, Search, ShieldCheck, MinusCircle,
  Download, RefreshCw, FilePlus2,
} from "lucide-react";
import { toast } from "sonner";
import { GrowthPageShell, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import { LeadNameLink } from "@/contexts/LeadDrawerContext";
import { getMissingInfoFlags, canonicalFamilyLeadStage } from "@/lib/intake/intakeWorkflow";
import { IntakeStateFilterToggle, useIntakeStateFilter } from "@/lib/intake/intakeStateFilter";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { isDirectorOfIntake } from "@/lib/intake/intakeRoles";
import {
  evaluateAdmissionReadiness,
  CENTRALREACH_BOUNDARY_NOTE,
  type AdmissionChecklistItem,
} from "@/lib/intake/admissionReadiness";
import {
  useAdmissionPackets,
  useApproveAdmission,
  useMarkAdmissionHandoff,
  useSetAdmissionItem,
  useSyncAdmissionPacket,
  admissionPacketErrorMessage,
  type AdmissionPacketRecord,
} from "@/hooks/useIntakeAdmissionPacket";
import {
  buildPacketQueueCsv,
  buildPacketHandoffSheet,
  downloadTextFile,
  packetFileSlug,
  type PacketExportRow,
} from "@/lib/intake/admissionPacketExport";
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

/** Derived lead checks + persisted Director waivers → admission checklist. */
export function buildAdmissionChecklist(
  lead: Lead,
  persisted: AdmissionChecklistItem[] = [],
): AdmissionChecklistItem[] {
  const byKey = new Map(persisted.map((p) => [p.key, p]));
  return SECTIONS.map((s) => {
    const result = s.check(lead);
    const saved = byKey.get(s.key);
    if (saved?.status === "waived") {
      return { ...saved, label: s.label, required: s.required, status: "waived" as const };
    }
    return {
      key: s.key,
      label: s.label,
      required: s.required,
      status: (result.ok ? "complete" : "missing") as AdmissionChecklistItem["status"],
      missing: result.missing,
    };
  });
}

export default function CentralReachPacketPrep() {
  const { leads: allLeads, loading } = useLeads();
  const { matches } = useIntakeStateFilter();
  const roleCtx = useOSRoleSafe();
  const director = isDirectorOfIntake([roleCtx?.role ?? null]);
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

  const leadIds = useMemo(() => rows.slice(0, 60).map((r) => r.lead.id), [rows]);
  const { data: packets } = useAdmissionPackets(leadIds);
  const syncPacket = useSyncAdmissionPacket();
  const [syncingAll, setSyncingAll] = useState(false);

  const exportRows = useMemo<PacketExportRow[]>(
    () => rows.map(({ lead }) => buildExportRow(lead, packets?.[lead.id])),
    [rows, packets],
  );

  const exportQueue = () => {
    if (exportRows.length === 0) {
      toast.error("Nothing to export in this view.");
      return;
    }
    downloadTextFile(
      `centralreach-packet-queue-${new Date().toISOString().slice(0, 10)}.csv`,
      buildPacketQueueCsv(exportRows),
      "text/csv;charset=utf-8",
    );
    toast.success(`Exported ${exportRows.length} packet${exportRows.length === 1 ? "" : "s"}.`);
  };

  const syncAll = async () => {
    const targets = rows.slice(0, 60);
    if (targets.length === 0) return;
    setSyncingAll(true);
    let ok = 0;
    try {
      for (const { lead } of targets) {
        try {
          await syncPacket.mutateAsync({
            leadId: lead.id,
            items: buildAdmissionChecklist(lead, packets?.[lead.id]?.items ?? []),
          });
          ok += 1;
        } catch (e) {
          toast.error(admissionPacketErrorMessage(e));
          break;
        }
      }
    } finally {
      setSyncingAll(false);
    }
    if (ok > 0) toast.success(`Synced ${ok} packet${ok === 1 ? "" : "s"} with the latest lead data.`);
  };

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
        { label: "Export queue (CSV)", icon: Download, onClick: exportQueue },
        { label: syncingAll ? "Syncing…" : "Sync all packets", icon: RefreshCw, onClick: () => void syncAll() },
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
            <PacketCard
              key={lead.id}
              lead={lead}
              readiness={readiness}
              packet={packets?.[lead.id]}
              director={director}
            />
          ))}
        </section>
      )}
      <p className="text-xs text-muted-foreground">{CENTRALREACH_BOUNDARY_NOTE}</p>
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
  packet,
  director,
}: {
  lead: Lead;
  readiness: ReturnType<typeof computeReadiness>;
  packet?: AdmissionPacketRecord;
  director: boolean;
}) {
  const setItem = useSetAdmissionItem();
  const approve = useApproveAdmission();
  const markHandoff = useMarkAdmissionHandoff();

  const checklist = useMemo(
    () => buildAdmissionChecklist(lead, packet?.items ?? []),
    [lead, packet?.items],
  );
  const admission = useMemo(
    () => evaluateAdmissionReadiness(checklist, packet?.approval ?? {}),
    [checklist, packet?.approval],
  );
  const handedOff = !!packet?.handoffMarkedAt;

  const pct = admission.requiredCount
    ? Math.round(((admission.completeCount + admission.waivedCount) / admission.requiredCount) * 100)
    : 100;
  const statusBadge = handedOff
    ? { label: "Handed off to CentralReach", cls: "bg-sky-50 text-sky-700 border-sky-200" }
    : admission.submissionReady
    ? { label: "Approved — ready for CR", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : readiness.blocked
    ? { label: "Blocked", cls: "bg-rose-50 text-rose-700 border-rose-200" }
    : admission.checklistSatisfied
    ? { label: "Awaiting Director approval", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" }
    : { label: `${pct}% complete`, cls: "bg-amber-50 text-amber-800 border-amber-200" };

  const waive = async (item: AdmissionChecklistItem) => {
    const reason = window.prompt(`Reason for waiving "${item.label}"`)?.trim();
    if (!reason) return;
    try {
      await setItem.mutateAsync({
        leadId: lead.id, itemKey: item.key, label: item.label,
        required: item.required, status: "waived", missing: item.missing ?? [], reason,
      });
      toast.success(`${item.label} waived.`);
    } catch (e) { toast.error(admissionPacketErrorMessage(e)); }
  };

  const onApprove = async () => {
    const needsException = !admission.checklistSatisfied;
    const reason = needsException
      ? window.prompt("Required items are still missing. Reason for approving anyway:")?.trim()
      : null;
    if (needsException && !reason) return;
    try {
      await approve.mutateAsync({ leadId: lead.id, exceptionReason: reason });
      toast.success("Admission packet approved.");
    } catch (e) { toast.error(admissionPacketErrorMessage(e)); }
  };

  const onHandoff = async () => {
    try {
      await markHandoff.mutateAsync({ leadId: lead.id, reference: null });
      toast.success("Marked as handed off to CentralReach.");
    } catch (e) { toast.error(admissionPacketErrorMessage(e)); }
  };

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
        {checklist.map((item) => {
          const Icon = SECTIONS.find((s) => s.key === item.key)?.icon ?? ListChecks;
          const ok = item.status !== "missing";
          return (
            <li key={item.key} className="flex items-start gap-2 text-xs">
              {item.status === "complete" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
              ) : item.status === "waived" ? (
                <MinusCircle className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
              ) : (
                <Circle className={cn("h-3.5 w-3.5 mt-0.5 shrink-0",
                  item.required ? "text-rose-500" : "text-muted-foreground")} />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className={cn("truncate", ok && "text-muted-foreground line-through")}>
                    {item.label}{item.required ? "" : " (optional)"}
                  </span>
                </div>
                {item.status === "missing" && (item.missing?.length ?? 0) > 0 && (
                  <div className="text-[11px] text-muted-foreground truncate">{item.missing!.join(" · ")}</div>
                )}
                {item.status === "waived" && (
                  <div className="text-[11px] text-indigo-600 truncate">Waived — {item.waivedReason}</div>
                )}
                {item.status === "missing" && item.required && director && !handedOff && (
                  <button
                    type="button"
                    onClick={() => waive(item)}
                    className="text-[11px] underline text-muted-foreground hover:text-foreground"
                  >
                    Waive
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {!admission.submissionReady && admission.blockers.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2 text-[11px] text-amber-900">
          <span className="font-medium">Blocking handoff:</span> {admission.blockers.join(" · ")}
        </div>
      )}
      {admission.exceptionReason && (
        <div className="text-[11px] text-indigo-700">Director exception — {admission.exceptionReason}</div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          {readiness.blocked && <AlertCircle className="h-3 w-3 text-rose-500" />}
          {admission.completeCount + admission.waivedCount}/{admission.requiredCount} required complete
        </div>
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
            <Link to={`/leads/${lead.id}`}>Open lead</Link>
          </Button>
          {handedOff ? (
            <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
              Handed off
            </Badge>
          ) : director && !admission.submissionReady ? (
            <Button size="sm" className="h-7 text-xs" onClick={onApprove} disabled={approve.isPending}>
              <ShieldCheck className="h-3 w-3 mr-1" /> Approve packet
            </Button>
          ) : admission.handoffEligible ? (
            <>
              {director && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onHandoff} disabled={markHandoff.isPending}>
                  Mark handed off
                </Button>
              )}
            <Button asChild size="sm" className="h-7 text-xs">
              <Link to={`/authorizations/handoff?leadId=${lead.id}`}>
                Send to CR Handoff <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
            </>
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