import { useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Plus, Sparkles, Download, ShieldCheck, Activity,
  AlertTriangle, CheckCircle2, Clock, ChevronRight, X, MessageSquare,
  StickyNote, ArrowUpRight, Users, ListChecks, PhoneCall, FileWarning,
  ExternalLink, Heart, ClipboardCheck, ArrowRightCircle,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useClients } from "@/contexts/ClientsContext";
import { useLeads } from "@/contexts/LeadsContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { canonicalPipelineStage } from "@/data/pipeline";
import type { Client } from "@/data/clients";

/* ───────────────────────── helpers ───────────────────────── */

function relTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type HandoffItem = { key: string; label: string; ok: boolean };
function handoffChecklist(c: Client): HandoffItem[] {
  return [
    { key: "family", label: "Family information complete", ok: Boolean(c.parentName && (c.phone || c.email)) },
    { key: "insurance", label: "Insurance entered", ok: Boolean(c.insurance || c.payor) },
    { key: "vob", label: "VOB reviewed", ok: c.daysSinceVOB > 0 },
    { key: "payment", label: "Payment plan status clear", ok: !c.paymentPlanRequired || Boolean(c.paymentPlanSigned) },
    { key: "consent", label: "Consent forms complete", ok: c.consentRequired === false || Boolean(c.consentComplete) },
    { key: "schedule", label: "Preferred schedule entered", ok: (c.schedule?.length ?? 0) > 0 || Boolean(c.startDate) },
    { key: "assessment", label: "Assessment info included", ok: Boolean(c.assessmentDate) || c.daysSinceAssessment !== null },
    { key: "docs", label: "Missing documents resolved", ok: !c.blockers?.some((b) => /missing|consent|insurance|doc/i.test(b)) },
  ];
}
function handoffStatus(c: Client): "Complete" | "Missing Items" | "Needs Review" | "Not Started" {
  const items = handoffChecklist(c);
  const done = items.filter((i) => i.ok).length;
  if (done === items.length) return "Complete";
  if (done === 0) return "Not Started";
  if (done >= items.length - 2) return "Needs Review";
  return "Missing Items";
}
const HANDOFF_TONE: Record<ReturnType<typeof handoffStatus>, string> = {
  Complete: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "Needs Review": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "Missing Items": "bg-destructive/10 text-destructive border-destructive/20",
  "Not Started": "bg-muted text-muted-foreground border-border",
};

function simpleAuth(c: Client): "Not Started" | "Pending" | "Submitted" | "Approved" | "Blocked" {
  if (c.authStatus === "Approved") return "Approved";
  if (c.authStatus === "Submitted") return "Submitted";
  if (c.authStatus === "Denied" || c.authStatus === "Expired") return "Blocked";
  if (c.authStatus === "Expiring Soon" || c.stage?.includes("Pending")) return "Pending";
  return "Not Started";
}
function simpleStaffing(c: Client): "Not Ready" | "Waiting on Staffing" | "Partially Staffed" | "Fully Staffed" {
  if (c.bcba && c.rbt) return "Fully Staffed";
  if (c.bcba && !c.rbt) return "Partially Staffed";
  if (c.staffingStatus === "Needed" || c.staffingStatus === "In Progress") return "Waiting on Staffing";
  return "Not Ready";
}
function simpleScheduling(c: Client): "Not Started" | "Scheduled" | "Active" {
  if (c.stage === "Active" || c.activeServiceStatus === "Active") return "Active";
  if ((c.schedule?.length ?? 0) > 0 || c.schedulingStatus === "Schedule Created") return "Scheduled";
  return "Not Started";
}

/** Compute Intake's operational lifecycle stage for a client. */
const LIFECYCLE_STAGES = [
  "Client Created",
  "Intake Handoff Review",
  "Ready for Authorization",
  "Authorization Submitted",
  "Authorization Approved",
  "Ready for Staffing",
  "Partially Staffed",
  "Fully Staffed",
  "Active Services",
  "At Risk / Blocked",
] as const;
type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

function lifecycleStage(c: Client): LifecycleStage {
  const auth = simpleAuth(c);
  const staff = simpleStaffing(c);
  const sched = simpleScheduling(c);
  const handoff = handoffStatus(c);
  if (c.blockers?.length && (c.daysInStage ?? 0) >= 7) return "At Risk / Blocked";
  if (sched === "Active") return "Active Services";
  if (staff === "Fully Staffed") return "Fully Staffed";
  if (staff === "Partially Staffed") return "Partially Staffed";
  if (auth === "Approved") return "Ready for Staffing";
  if (auth === "Submitted") return "Authorization Submitted";
  if (handoff === "Complete" && auth === "Not Started") return "Ready for Authorization";
  if (handoff === "Missing Items" || handoff === "Needs Review") return "Intake Handoff Review";
  return "Client Created";
}

function needsIntakeFollowUp(c: Client): { needs: boolean; reason?: string } {
  const h = handoffStatus(c);
  if (h === "Missing Items") return { needs: true, reason: "Handoff has missing items" };
  if (c.blockers?.some((b) => /insurance|consent|missing|payment/i.test(b))) {
    return { needs: true, reason: c.blockers.find((b) => /insurance|consent|missing|payment/i.test(b)) };
  }
  if (simpleAuth(c) === "Blocked") return { needs: true, reason: "Auth blocked — verify intake data" };
  if ((c.daysInStage ?? 0) >= 10 && lifecycleStage(c) === "Intake Handoff Review") {
    return { needs: true, reason: `Stuck in handoff review ${c.daysInStage}d` };
  }
  return { needs: false };
}

/**
 * SOP-aligned client stage tabs. Matches Blossom's canonical operational stages.
 * Each tab filters by the underlying ClientStage values (some stages map multiple
 * synonymous strings produced by Monday/CR imports).
 */
const STAGE_TABS: { key: string; label: string; match: (c: Client) => boolean }[] = [
  { key: "all",                    label: "All Clients",          match: () => true },
  { key: "BCBA Assignment",        label: "BCBA Assignment",      match: (c) => c.stage === "BCBA Assignment" || (c.stage === "Converted to Client" && !c.bcba) },
  { key: "Pending Initial Auth",   label: "Pending Initial Auth", match: (c) => c.stage === "Pending Initial Auth" || c.stage === "Pending Initial Authorization" || c.stage === "Initial Auth – Awaiting Submission" || c.stage === "Initial Auth – Submitted" },
  { key: "Waiting on Consent",     label: "Waiting on Consent",   match: (c) => c.stage === "Waiting on Consent" || c.stage === "Waiting on Consent Forms" },
  { key: "Schedule Assessment",    label: "Schedule Assessment",  match: (c) => c.stage === "Schedule Assessment" },
  { key: "Assessment Scheduled",   label: "Assessment Scheduled", match: (c) => c.stage === "Assessment Scheduled" || c.stage === "Assessment Completed" },
  { key: "In QA",                  label: "In QA",                match: (c) => c.stage === "In QA" || c.stage === "QA Review" || c.stage === "QA Issues / Fix Required" },
  { key: "Pending Treatment Auth", label: "Pending Treatment Auth", match: (c) => c.stage === "Pending Treatment Auth" || c.stage === "Treatment Auth – Awaiting Submission" || c.stage === "Treatment Auth – Submitted" },
  { key: "Staffing Needed",        label: "Staffing Needed",      match: (c) => c.stage === "Staffing Needed" },
  { key: "Pending Start Date",     label: "Pending Start Date",   match: (c) => c.stage === "Pending Start Date" },
  { key: "Active",                 label: "Active",               match: (c) => c.stage === "Active" || c.activeServiceStatus === "Active" },
  { key: "Services on Pause",      label: "On Pause",             match: (c) => c.stage === "Services on Pause" || c.activeServiceStatus === "Services on Pause" },
  { key: "Flaked",                 label: "Flaked",               match: (c) => c.stage === "Flaked" || c.activeServiceStatus === "Flaked" },
  { key: "Discharged",             label: "Discharged",           match: (c) => c.stage === "Discharged" || c.activeServiceStatus === "Discharged" },
];

function agingDot(c: Client): { tone: string; label: string } {
  const d = c.daysInStage ?? 0;
  if (d <= 3) return { tone: "bg-emerald-500", label: `${d}d in stage` };
  if (d <= 7) return { tone: "bg-amber-500",   label: `${d}d in stage` };
  return { tone: "bg-rose-500",   label: `${d}d in stage` };
}

/**
 * Next-Best-Action — explainable, SOP-aligned recommendation per client.
 * Drives the "What should happen next?" banner in the drawer.
 */
function nextBestAction(c: Client): { label: string; why: string; tone: "ok" | "warn" | "crit" } {
  const stage = c.stage;
  if ((stage === "BCBA Assignment" || stage === "Converted to Client") && !c.bcba)
    return { label: "Assign a BCBA", why: "No BCBA is on this case yet. Pick the right BCBA for the family's state and availability.", tone: "warn" };
  if ((stage === "Waiting on Consent" || stage === "Waiting on Consent Forms") && !c.consentComplete)
    return { label: "Follow up on consent forms", why: "Consent isn't complete. Resend the consent packet and confirm receipt with the parent.", tone: "warn" };
  if (stage === "Schedule Assessment")
    return { label: "Schedule the assessment", why: "Assessment isn't on the calendar yet. Coordinate with the BCBA and the family.", tone: "warn" };
  if (stage === "In QA" || stage === "QA Issues / Fix Required")
    return { label: "Resolve QA items", why: "Treatment plan is in QA. Address open QA notes before the auth submission.", tone: "warn" };
  if (stage === "Pending Initial Auth" || stage === "Pending Initial Authorization" || stage === "Pending Treatment Auth" || stage === "Treatment Auth – Awaiting Submission")
    return { label: "Monitor authorization", why: "Authorization is in flight. Confirm submission status and chase the payor if it ages out.", tone: "warn" };
  if (stage === "Staffing Needed" || (!c.rbt && c.bcba && stage !== "Active"))
    return { label: "Send to Staffing", why: "BCBA is in place but RBT staffing isn't. Hand this off to the Staffing team.", tone: "warn" };
  if (stage === "Pending Start Date" && !c.startDate)
    return { label: "Confirm start date", why: "Family is ready but no start date is locked. Coordinate scheduling and lock the date.", tone: "warn" };
  if (stage === "Active" || c.activeServiceStatus === "Active")
    return { label: "On services — monitor", why: "Family is in active care. Watch for auth expirations and staffing changes.", tone: "ok" };
  if (handoffStatus(c) === "Missing Items")
    return { label: "Resolve handoff issues", why: "Intake handoff has missing items. Clean these up before pushing to the next team.", tone: "crit" };
  return { label: "Review and move forward", why: "No blocking issues detected. Confirm the next operational owner.", tone: "ok" };
}

const NBA_STYLES: Record<"ok" | "warn" | "crit", { wrap: string; chip: string; icon: string }> = {
  ok:   { wrap: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white", chip: "bg-emerald-600 text-white hover:bg-emerald-700", icon: "text-emerald-600" },
  warn: { wrap: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",     chip: "bg-amber-500 text-white hover:bg-amber-600",   icon: "text-amber-600" },
  crit: { wrap: "border-rose-200 bg-gradient-to-br from-rose-50 to-white",       chip: "bg-rose-600 text-white hover:bg-rose-700",     icon: "text-rose-600" },
};

/* ───────────────────────── modals ───────────────────────── */

type ClientModal =
  | { kind: "note"; client: Client }
  | { kind: "followUp"; client: Client }
  | { kind: "escalate"; client: Client }
  | { kind: "messageTeam"; client: Client; team?: string }
  | { kind: "addClient" };

function ClientModals({ active, onClose }: { active: ClientModal | null; onClose: () => void }) {
  const [text, setText] = useState("");
  const [text2, setText2] = useState("");
  const [sel, setSel] = useState("");
  if (!active) return null;
  const name = active.kind !== "addClient" ? active.client.childName : "";

  const submit = (msg: string) => { toast.success(msg); setText(""); setText2(""); setSel(""); onClose(); };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        {active.kind === "note" && (
          <>
            <DialogHeader><DialogTitle>Add note · {name}</DialogTitle></DialogHeader>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Operational note for the intake handoff…" rows={5} />
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button disabled={!text.trim()} onClick={() => submit("Note added")}>Save note</Button>
            </DialogFooter>
          </>
        )}
        {active.kind === "followUp" && (
          <>
            <DialogHeader><DialogTitle>Create follow-up · {name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Due</Label><Input type="date" value={text} onChange={(e) => setText(e.target.value)} /></div>
              <div><Label>What's the follow-up?</Label><Textarea value={text2} onChange={(e) => setText2(e.target.value)} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button disabled={!text || !text2.trim()} onClick={() => submit("Follow-up created")}>Create</Button>
            </DialogFooter>
          </>
        )}
        {active.kind === "escalate" && (
          <>
            <DialogHeader><DialogTitle>Escalate handoff issue · {name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Escalate to</Label>
                <Select value={sel} onValueChange={setSel}>
                  <SelectTrigger><SelectValue placeholder="Choose team" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auth">Authorization Team</SelectItem>
                    <SelectItem value="scheduling">Scheduling Team</SelectItem>
                    <SelectItem value="ops">Operations Leadership</SelectItem>
                    <SelectItem value="state">State Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Reason</Label><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button disabled={!sel || !text.trim()} onClick={() => submit("Escalation sent")}>Escalate</Button>
            </DialogFooter>
          </>
        )}
        {active.kind === "messageTeam" && (
          <>
            <DialogHeader><DialogTitle>Message {active.team ?? "team"} · {name}</DialogTitle></DialogHeader>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Short operational message…" rows={4} />
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button disabled={!text.trim()} onClick={() => submit("Message sent")}>Send</Button>
            </DialogFooter>
          </>
        )}
        {active.kind === "addClient" && (
          <>
            <DialogHeader><DialogTitle>Add client</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Patient name</Label><Input value={text} onChange={(e) => setText(e.target.value)} /></div>
              <div><Label>Parent name</Label><Input value={text2} onChange={(e) => setText2(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button disabled={!text.trim()} onClick={() => submit("Client created — placeholder")}>Create</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function OSIntakeClients() {
  const { clients, loading } = useClients();
  const { leads } = useLeads();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [modal, setModal] = useState<ClientModal | null>(null);
  const [view, setView] = useState<"list" | "pipeline">("list");

  const filterHandoff = params.get("handoff");
  const filterAuth = params.get("auth");
  const filterStaffing = params.get("staffing");
  const filterPulse = params.get("pulse");
  const filterStage = params.get("stage");
  const filterCstage = params.get("cstage") ?? "all";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (q) {
        const hay = [c.childName, c.parentName, c.payor, c.insurance, c.state, c.bcba, c.intakeOwner]
          .map((s) => String(s ?? "").toLowerCase()).join(" ");
        if (!hay.includes(q)) return false;
      }
      if (filterHandoff === "missing" && handoffStatus(c) !== "Missing Items") return false;
      if (filterHandoff === "review" && handoffStatus(c) !== "Needs Review") return false;
      if (filterAuth === "blocked" && simpleAuth(c) !== "Blocked") return false;
      if (filterAuth === "pending" && simpleAuth(c) !== "Pending" && simpleAuth(c) !== "Submitted") return false;
      if (filterStaffing === "waiting" && simpleStaffing(c) !== "Waiting on Staffing") return false;
      if (filterStage && lifecycleStage(c) !== filterStage) return false;
      if (filterCstage && filterCstage !== "all") {
        const t = STAGE_TABS.find((s) => s.key === filterCstage);
        if (t && !t.match(c)) return false;
      }
      if (filterPulse === "new" && (c.daysInStage ?? 0) > 7) return false;
      if (filterPulse === "active" && simpleScheduling(c) !== "Active") return false;
      if (filterPulse === "followup" && !needsIntakeFollowUp(c).needs) return false;
      if (filterPulse === "auth" && simpleAuth(c) === "Approved") return false;
      if (filterPulse === "staffing" && simpleStaffing(c) === "Fully Staffed") return false;
      if (filterPulse === "handoff" && handoffStatus(c) === "Complete") return false;
      return true;
    });
  }, [clients, query, filterHandoff, filterAuth, filterStaffing, filterPulse, filterStage, filterCstage]);

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of STAGE_TABS) c[t.key] = 0;
    for (const cl of clients) for (const t of STAGE_TABS) if (t.match(cl)) c[t.key]++;
    return c;
  }, [clients]);

  const setFilter = (key: string, value: string | null) => {
    const p = new URLSearchParams(params);
    if (!value) p.delete(key); else p.set(key, value);
    setParams(p, { replace: true });
  };
  const clearFilters = () => setParams(new URLSearchParams(), { replace: true });
  const hasFilters = Boolean(filterHandoff || filterAuth || filterStaffing || filterPulse || filterStage);

  return (
    <OSShell rightRail={<AskBlossomRail clients={clients} onOpen={setOpenId} setFilter={setFilter} />}>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
              Track client setup, intake handoffs, and operational readiness after intake.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leads"><Users className="mr-1.5 h-4 w-4" /> Open Leads</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/authorizations"><ShieldCheck className="mr-1.5 h-4 w-4" /> Open Authorizations</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Export — coming soon")}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Create Follow-Up — pick a client from the list")}>
              <PhoneCall className="mr-1.5 h-4 w-4" /> Create Follow-Up
            </Button>
            <Button size="sm" onClick={() => setModal({ kind: "addClient" })}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Client
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client, parent, insurance, BCBA, state…"
            className="h-11 w-full rounded-xl bg-muted/60 border border-border pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition outline-none"
          />
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 -mt-3">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {filterPulse && <FilterChip onClear={() => setFilter("pulse", null)}>{filterPulse}</FilterChip>}
            {filterStage && <FilterChip onClear={() => setFilter("stage", null)}>{filterStage}</FilterChip>}
            {filterHandoff && <FilterChip onClear={() => setFilter("handoff", null)}>Handoff: {filterHandoff}</FilterChip>}
            {filterAuth && <FilterChip onClear={() => setFilter("auth", null)}>Auth: {filterAuth}</FilterChip>}
            {filterStaffing && <FilterChip onClear={() => setFilter("staffing", null)}>Staffing: {filterStaffing}</FilterChip>}
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground transition">Clear all</button>
          </div>
        )}

        {loading && clients.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
            Loading clients…
          </div>
        ) : (
          <>
            <Pulse clients={clients} setFilter={setFilter} active={filterPulse} />
            <NeedingAttention clients={visible} onOpen={setOpenId} onAction={setModal} />

            <div className="flex items-center gap-2">
              <ViewToggle value={view} onChange={setView} />
              <span className="text-xs text-muted-foreground ml-auto tabular-nums">{visible.length} clients</span>
            </div>

            {view === "list" ? (
              <ClientsList clients={visible} onOpen={setOpenId} />
            ) : (
              <LifecyclePipeline clients={visible} onOpen={setOpenId} setFilter={setFilter} />
            )}

            <RecentActivity clients={clients} onOpen={setOpenId} />
          </>
        )}
      </div>

      {openId && (
        <ClientDrawer
          clientId={openId}
          leads={leads}
          onClose={() => setOpenId(null)}
          onAction={setModal}
        />
      )}
      <ClientModals active={modal} onClose={() => setModal(null)} />
    </OSShell>
  );
}

/* ───────────────────────── sections ───────────────────────── */

function FilterChip({ children, onClear }: { children: ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs">
      {children}
      <button onClick={onClear} className="hover:text-primary/70"><X className="h-3 w-3" /></button>
    </span>
  );
}

function ViewToggle({ value, onChange }: { value: "list" | "pipeline"; onChange: (v: "list" | "pipeline") => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
      {(["list", "pipeline"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition capitalize",
            value === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {v} view
        </button>
      ))}
    </div>
  );
}

function Pulse({
  clients, setFilter, active,
}: { clients: Client[]; setFilter: (k: string, v: string | null) => void; active: string | null }) {
  const counts = useMemo(() => {
    const c = { new: 0, auth: 0, staffing: 0, handoff: 0, followup: 0, active: 0 };
    for (const cl of clients) {
      if ((cl.daysInStage ?? 99) <= 7) c.new++;
      if (simpleAuth(cl) === "Pending" || simpleAuth(cl) === "Submitted") c.auth++;
      if (simpleStaffing(cl) === "Waiting on Staffing" || simpleStaffing(cl) === "Not Ready") c.staffing++;
      if (handoffStatus(cl) === "Missing Items" || handoffStatus(cl) === "Needs Review") c.handoff++;
      if (needsIntakeFollowUp(cl).needs) c.followup++;
      if (simpleScheduling(cl) === "Active") c.active++;
    }
    return c;
  }, [clients]);

  const cards = [
    { key: "new", label: "New Clients", value: counts.new },
    { key: "auth", label: "Waiting on Authorization", value: counts.auth },
    { key: "staffing", label: "Waiting on Staffing", value: counts.staffing },
    { key: "handoff", label: "Handoff Issues", value: counts.handoff, tone: "warning" as const },
    { key: "followup", label: "Intake Follow-Up Needed", value: counts.followup, tone: "destructive" as const },
    { key: "active", label: "Active Services", value: counts.active, tone: "success" as const },
  ];

  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Client Lifecycle Pulse</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter("pulse", active === c.key ? null : c.key)}
            className={cn(
              "text-left rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm",
              active === c.key ? "border-primary/40 bg-primary/[0.04]" : "border-border/70",
            )}
          >
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className={cn(
              "mt-1.5 text-2xl font-semibold tabular-nums",
              c.tone === "destructive" && "text-destructive",
              c.tone === "warning" && "text-amber-600 dark:text-amber-400",
              c.tone === "success" && "text-emerald-600 dark:text-emerald-400",
            )}>{c.value.toLocaleString()}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function NeedingAttention({
  clients, onOpen, onAction,
}: { clients: Client[]; onOpen: (id: string) => void; onAction: (m: ClientModal) => void }) {
  const items = useMemo(() => {
    return clients
      .map((c) => ({ c, followUp: needsIntakeFollowUp(c), handoff: handoffStatus(c) }))
      .filter((x) => x.followUp.needs || x.handoff === "Missing Items")
      .sort((a, b) => (b.c.daysInStage ?? 0) - (a.c.daysInStage ?? 0))
      .slice(0, 6);
  }, [clients]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Clients Needing Intake Attention</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Handoff issues, missing info, and follow-ups owned by intake.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length} surfaced</span>
      </div>
      {items.length === 0 ? (
        <Empty message="All handoffs clean. No intake follow-ups required." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(({ c, followUp, handoff }) => (
            <article key={c.id} className="group rounded-2xl border border-border/70 bg-card p-5 hover:border-border hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", handoff === "Missing Items" ? "bg-destructive" : "bg-amber-500")} />
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{followUp.reason ?? handoff}</span>
                  </div>
                  <button onClick={() => onOpen(c.id)} className="text-base font-medium text-left hover:text-primary transition">
                    {c.childName}
                  </button>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {c.parentName} · {c.state || "—"} · {c.payor || "—"} · Intake: {c.intakeOwner || "Unassigned"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-muted-foreground">Stage</p>
                  <p className="text-xs font-medium">{lifecycleStage(c)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <PillButton onClick={() => onOpen(c.id)} icon={ChevronRight}>Open Client</PillButton>
                {c.leadId && (
                  <PillButton asLink to={`/leads?id=${c.leadId}`} icon={ExternalLink}>Original Lead</PillButton>
                )}
                <PillButton onClick={() => onAction({ kind: "note", client: c })} icon={StickyNote}>Note</PillButton>
                <PillButton onClick={() => onAction({ kind: "followUp", client: c })} icon={Clock}>Follow-Up</PillButton>
                <PillButton onClick={() => onAction({ kind: "escalate", client: c })} icon={AlertTriangle}>Escalate</PillButton>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PillButton({
  children, icon: Icon, onClick, asLink, to,
}: { children: ReactNode; icon: typeof ChevronRight; onClick?: () => void; asLink?: boolean; to?: string }) {
  const cls = "inline-flex items-center gap-1.5 rounded-full border border-border bg-background hover:bg-muted px-2.5 py-1 text-[11px] transition";
  if (asLink && to) return <Link to={to} className={cls}><Icon className="h-3 w-3" /> {children}</Link>;
  return <button onClick={onClick} className={cls}><Icon className="h-3 w-3" /> {children}</button>;
}

function ClientsList({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <Th>Client</Th><Th>Parent</Th><Th>State</Th><Th>Lifecycle Stage</Th>
              <Th>Handoff</Th><Th>Auth</Th><Th>Staffing</Th><Th>Scheduling</Th><Th>Intake Follow-Up</Th><Th>Last Activity</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {clients.length === 0 && (
              <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">No clients match your filters.</td></tr>
            )}
            {clients.map((c) => {
              const h = handoffStatus(c);
              const fu = needsIntakeFollowUp(c);
              return (
                <tr key={c.id} onClick={() => onOpen(c.id)} className="cursor-pointer hover:bg-muted/40 transition">
                  <Td><span className="font-medium">{c.childName}</span></Td>
                  <Td className="text-muted-foreground">{c.parentName || "—"}</Td>
                  <Td className="text-muted-foreground">{c.state || "—"}</Td>
                  <Td className="text-muted-foreground">{lifecycleStage(c)}</Td>
                  <Td><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] border", HANDOFF_TONE[h])}>{h}</span></Td>
                  <Td className="text-muted-foreground">{simpleAuth(c)}</Td>
                  <Td className="text-muted-foreground">{simpleStaffing(c)}</Td>
                  <Td className="text-muted-foreground">{simpleScheduling(c)}</Td>
                  <Td>{fu.needs ? <span className="text-destructive text-xs">Yes</span> : <span className="text-muted-foreground text-xs">—</span>}</Td>
                  <Td className="text-muted-foreground">{relTime(c.lastActivity)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Th({ children }: { children: ReactNode }) { return <th className="text-left font-medium px-4 py-2.5">{children}</th>; }
function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}

function LifecyclePipeline({
  clients, onOpen, setFilter,
}: { clients: Client[]; onOpen: (id: string) => void; setFilter: (k: string, v: string | null) => void }) {
  const byStage = useMemo(() => {
    const map = new Map<LifecycleStage, Client[]>();
    LIFECYCLE_STAGES.forEach((s) => map.set(s, []));
    clients.forEach((c) => map.get(lifecycleStage(c))?.push(c));
    return map;
  }, [clients]);

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {LIFECYCLE_STAGES.map((stage) => {
          const list = byStage.get(stage) ?? [];
          const blocked = list.filter((c) => c.blockers?.length).length;
          const overdue = list.filter((c) => (c.daysInStage ?? 0) >= 10).length;
          return (
            <div key={stage} className="rounded-2xl border border-border/70 bg-card p-3.5 min-h-[180px]">
              <button onClick={() => setFilter("stage", stage)} className="w-full text-left">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium">{stage}</p>
                  <span className="text-xs tabular-nums text-muted-foreground">{list.length}</span>
                </div>
                <div className="text-[11px] text-muted-foreground flex gap-3 mb-2">
                  {blocked > 0 && <span className="text-destructive">{blocked} blocked</span>}
                  {overdue > 0 && <span className="text-amber-600 dark:text-amber-400">{overdue} overdue</span>}
                </div>
              </button>
              <div className="space-y-1.5">
                {list.slice(0, 4).map((c) => (
                  <button key={c.id} onClick={() => onOpen(c.id)} className="w-full text-left rounded-lg border border-border/60 bg-background hover:border-border px-2.5 py-1.5 text-xs hover:bg-muted/50 transition">
                    <p className="font-medium truncate">{c.childName}</p>
                    <p className="text-muted-foreground truncate text-[11px]">{c.intakeOwner || "—"} · {c.daysInStage ?? 0}d</p>
                  </button>
                ))}
                {list.length > 4 && <p className="text-[11px] text-muted-foreground px-1">+{list.length - 4} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentActivity({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  const events = useMemo(() => {
    return clients
      .flatMap((c) => (c.timeline ?? []).slice(0, 3).map((t) => ({ ...t, client: c })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [clients]);
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Recent Activity</h2>
      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60">
        {events.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No recent activity.</div>}
        {events.map((e) => (
          <button key={`${e.client.id}-${e.id}`} onClick={() => onOpen(e.client.id)} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition">
            <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate"><span className="font-medium">{e.client.childName}</span> · {e.description}</p>
              <p className="text-[11px] text-muted-foreground">{relTime(e.timestamp)}{e.user ? ` · ${e.user}` : ""}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </section>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/* ───────────────────────── drawer ───────────────────────── */

function ClientDrawer({
  clientId, leads, onClose, onAction,
}: {
  clientId: string;
  leads: ReturnType<typeof useLeads>["leads"];
  onClose: () => void;
  onAction: (m: ClientModal) => void;
}) {
  const { getClient } = useClients();
  const c = getClient(clientId);
  if (!c) return null;
  const lead = c.leadId ? leads.find((l) => l.id === c.leadId) : undefined;
  const handoff = handoffChecklist(c);
  const handoffState = handoffStatus(c);

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <SheetHeader>
            <SheetTitle className="text-xl">{c.childName}</SheetTitle>
          </SheetHeader>
          <p className="text-sm text-muted-foreground mt-1">
            {c.parentName} · {c.state || "—"} · {c.payor || "—"}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] border", HANDOFF_TONE[handoffState])}>
              Handoff · {handoffState}
            </span>
            <span className="inline-flex rounded-full bg-muted text-foreground border border-border px-2.5 py-1 text-[11px]">
              {lifecycleStage(c)}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          <Section title="Client Overview">
            <KV k="Patient" v={c.childName} />
            <KV k="Parent/Guardian" v={c.parentName || "—"} />
            <KV k="State" v={c.state || "—"} />
            <KV k="Insurance" v={c.insurance || c.payor || "—"} />
            <KV k="Intake Coordinator" v={c.intakeOwner || "Unassigned"} />
            <KV k="Current Stage" v={c.stage} />
          </Section>

          <Section title="Intake Handoff Checklist" icon={ClipboardCheck}>
            <ul className="space-y-1.5">
              {handoff.map((i) => (
                <li key={i.key} className="flex items-center gap-2 text-sm">
                  {i.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <FileWarning className="h-4 w-4 text-amber-500" />}
                  <span className={cn(i.ok ? "text-foreground" : "text-muted-foreground")}>{i.label}</span>
                </li>
              ))}
            </ul>
          </Section>

          {lead ? (
            <Section title="Original Lead">
              <KV k="Lead source" v={(lead as { source?: string }).source || "—"} />
              <KV k="Lead status" v={(lead as { status?: string }).status || "—"} />
              <Button variant="outline" size="sm" asChild className="mt-2">
                <Link to={`/leads?id=${lead.id}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open Original Lead</Link>
              </Button>
            </Section>
          ) : (
            <Section title="Original Lead">
              <p className="text-sm text-muted-foreground">No lead linked to this client.</p>
            </Section>
          )}

          <Section title="VOB Summary" icon={Heart}>
            <KV k="Payment plan" v={c.paymentPlanRequired ? (c.paymentPlanSigned ? "Signed" : "Required — not signed") : "Not required"} />
            <KV k="VOB days since" v={c.daysSinceVOB ? `${c.daysSinceVOB}d` : "—"} />
            <Button variant="outline" size="sm" onClick={() => toast("VOB Decision Center — coming soon")} className="mt-2">
              Open VOB Decision
            </Button>
          </Section>

          <Section title="Authorization & Staffing" icon={ShieldCheck}>
            <KV k="Authorization" v={simpleAuth(c)} />
            <KV k="Staffing" v={simpleStaffing(c)} />
            <KV k="Scheduling" v={simpleScheduling(c)} />
            <KV k="BCBA" v={c.bcba || "Unassigned"} />
            <KV k="RBT" v={c.rbt || "Unassigned"} />
          </Section>

          <Section title="Notes & Activity" icon={Activity}>
            <ul className="space-y-2.5 max-h-64 overflow-y-auto">
              {(c.timeline ?? []).slice(0, 12).map((t) => (
                <li key={t.id} className="text-sm">
                  <p className="text-foreground">{t.description}</p>
                  <p className="text-[11px] text-muted-foreground">{relTime(t.timestamp)}{t.user ? ` · ${t.user}` : ""}</p>
                </li>
              ))}
              {(c.timeline ?? []).length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            </ul>
          </Section>

          <Section title="Next Actions" icon={ListChecks}>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => onAction({ kind: "followUp", client: c })}>
                <Clock className="mr-1.5 h-3.5 w-3.5" /> Create Follow-Up
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction({ kind: "note", client: c })}>
                <StickyNote className="mr-1.5 h-3.5 w-3.5" /> Add Note
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction({ kind: "messageTeam", client: c, team: "Authorization" })}>
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message Auth Team
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction({ kind: "messageTeam", client: c, team: "Scheduling" })}>
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message Scheduling
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction({ kind: "escalate", client: c })}>
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Escalate Handoff Issue
              </Button>
              {c.leadId && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/leads?id=${c.leadId}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open Lead</Link>
                </Button>
              )}
            </div>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: typeof ChevronRight; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />} {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground text-xs">{k}</span>
      <span className="text-right text-foreground">{v}</span>
    </div>
  );
}

/* ───────────────────────── AI rail ───────────────────────── */

function AskBlossomRail({
  clients, onOpen, setFilter,
}: {
  clients: Client[];
  onOpen: (id: string) => void;
  setFilter: (k: string, v: string | null) => void;
}) {
  const handoff = clients.filter((c) => handoffStatus(c) === "Missing Items").length;
  const authBlocked = clients.filter((c) => simpleAuth(c) === "Blocked").length;
  const waitStaffing = clients.filter((c) => simpleStaffing(c) === "Waiting on Staffing").length;

  const prompts = [
    { label: "Which clients need Intake follow-up?", onClick: () => setFilter("pulse", "followup") },
    { label: "Show handoff issues.", onClick: () => setFilter("pulse", "handoff") },
    { label: "Which clients are stuck after intake?", onClick: () => setFilter("auth", "blocked") },
    { label: "Summarize client setup blockers.", onClick: () => toast("Summary — AI placeholder") },
    { label: "Find clients missing intake info.", onClick: () => setFilter("handoff", "missing") },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Ask Blossom AI</h3>
        </div>
        <p className="text-xs text-muted-foreground">Operational intake handoff assistant.</p>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Insights</p>
        <div className="space-y-2">
          <InsightLine tone="warning">{handoff} clients have incomplete intake handoffs.</InsightLine>
          <InsightLine tone="destructive">{authBlocked} clients blocked in authorization.</InsightLine>
          <InsightLine tone="muted">{waitStaffing} clients waiting on staffing.</InsightLine>
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Suggested prompts</p>
        <div className="space-y-1.5">
          {prompts.map((p) => (
            <button key={p.label} onClick={p.onClick} className="w-full text-left rounded-lg border border-border/70 bg-card hover:bg-muted/60 px-3 py-2 text-xs transition">
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightLine({ children, tone }: { children: ReactNode; tone: "warning" | "destructive" | "muted" }) {
  return (
    <div className={cn(
      "rounded-lg border px-3 py-2 text-xs",
      tone === "warning" && "border-amber-500/20 bg-amber-500/[0.06] text-amber-700 dark:text-amber-400",
      tone === "destructive" && "border-destructive/20 bg-destructive/[0.06] text-destructive",
      tone === "muted" && "border-border bg-muted/50 text-muted-foreground",
    )}>{children}</div>
  );
}

// keep canonicalPipelineStage import used (silence lint in case)
void canonicalPipelineStage;