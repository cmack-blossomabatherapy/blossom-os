import { useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Sparkles, Download, ShieldCheck, Activity,
  AlertTriangle, CheckCircle2, Clock, ChevronRight, X, MessageSquare,
  StickyNote, Users, ListChecks, FileWarning, ExternalLink, Heart,
  ClipboardCheck, Send, PhoneCall, CalendarClock, Lightbulb,
  Bell, FileText, ShieldAlert, Upload, CheckCheck,
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
import type { Client, ReauthCycle } from "@/data/clients";

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

/** Intake-friendly authorization status. */
type AuthSimple =
  | "Waiting on Authorization"
  | "Ready for Submission"
  | "Submitted"
  | "Approved"
  | "Blocked"
  | "Not Started";

function simpleAuth(c: Client): AuthSimple {
  if (c.authStatus === "Approved") return "Approved";
  if (c.authStatus === "Submitted") return "Submitted";
  if (c.authStatus === "Denied" || c.authStatus === "Expired") return "Blocked";
  if (c.authStatus === "Expiring Soon") return "Waiting on Authorization";
  if (c.stage?.includes("Pending") || c.stage?.includes("Awaiting")) return "Waiting on Authorization";
  if (c.authStatus === "Not Submitted") return "Ready for Submission";
  return "Not Started";
}

const AUTH_TONE: Record<AuthSimple, string> = {
  "Approved": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "Submitted": "bg-primary/10 text-primary border-primary/20",
  "Ready for Submission": "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  "Waiting on Authorization": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "Blocked": "bg-destructive/10 text-destructive border-destructive/20",
  "Not Started": "bg-muted text-muted-foreground border-border",
};

type HandoffItem = { key: string; label: string; ok: boolean };
function handoffChecklist(c: Client): HandoffItem[] {
  return [
    { key: "client", label: "Client created", ok: true },
    { key: "insurance", label: "Insurance information complete", ok: Boolean(c.insurance || c.payor) },
    { key: "vob", label: "VOB reviewed", ok: c.daysSinceVOB > 0 },
    { key: "payment", label: "Payment plan status clear", ok: !c.paymentPlanRequired || Boolean(c.paymentPlanSigned) },
    { key: "consent", label: "Consent forms complete", ok: c.consentRequired === false || Boolean(c.consentComplete) },
    { key: "diagnosis", label: "Diagnosis / referral present", ok: !c.blockers?.some((b) => /referral|diagnosis/i.test(b)) },
    { key: "assessment", label: "Assessment information available", ok: Boolean(c.assessmentDate) || c.daysSinceAssessment !== null },
    { key: "schedule", label: "Preferred schedule included", ok: (c.schedule?.length ?? 0) > 0 || Boolean(c.startDate) },
    { key: "docs", label: "Missing information resolved", ok: !c.blockers?.some((b) => /missing|consent|insurance|doc/i.test(b)) },
  ];
}
type HandoffState = "Complete" | "Missing Items" | "Needs Review" | "Blocked";
function handoffStatus(c: Client): HandoffState {
  const items = handoffChecklist(c);
  const done = items.filter((i) => i.ok).length;
  if (c.blockers?.some((b) => /block|deniedauth/i.test(b))) return "Blocked";
  if (done === items.length) return "Complete";
  if (done >= items.length - 1) return "Needs Review";
  return "Missing Items";
}
const HANDOFF_TONE: Record<HandoffState, string> = {
  Complete: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "Needs Review": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "Missing Items": "bg-destructive/10 text-destructive border-destructive/20",
  Blocked: "bg-destructive/10 text-destructive border-destructive/20",
};

type VOBSimple =
  | "Approved"
  | "Approved with Payment Plan"
  | "Finance Review Needed"
  | "Missing Info"
  | "No OON Benefits"
  | "Declined";
function simpleVOB(c: Client): VOBSimple {
  if (c.blockers?.some((b) => /no\s*oon|out\s*of\s*network/i.test(b))) return "No OON Benefits";
  if (c.blockers?.some((b) => /declined|denied vob/i.test(b))) return "Declined";
  if (!c.daysSinceVOB) return "Missing Info";
  if (c.paymentPlanRequired && !c.paymentPlanSigned) return "Finance Review Needed";
  if (c.paymentPlanRequired && c.paymentPlanSigned) return "Approved with Payment Plan";
  if (c.daysSinceVOB > 0) return "Approved";
  return "Missing Info";
}

/** Intake-relevant blocker text for an auth row. */
function authBlocker(c: Client): string | null {
  const h = handoffStatus(c);
  const a = simpleAuth(c);
  if (a === "Blocked") return "Authorization blocked by payor";
  if (h === "Missing Items") {
    const m = c.blockers?.find((b) => /missing|consent|insurance|doc|referral|diagnosis/i.test(b));
    return m ?? "Missing intake information";
  }
  if (h === "Needs Review") return "Handoff needs intake review";
  if (simpleVOB(c) === "Finance Review Needed") return "Payment plan status unclear";
  if (simpleVOB(c) === "Missing Info") return "VOB incomplete";
  if (a === "Waiting on Authorization" && (c.daysInStage ?? 0) >= 10) return `Waiting ${c.daysInStage}d on payor`;
  return null;
}

/** Pipeline stages for the intake-facing auth view. */
const PIPELINE_STAGES = [
  "Ready for Auth Review",
  "Missing Intake Info",
  "Waiting on Treatment Plan",
  "Ready for Submission",
  "Submitted",
  "Approved",
  "Blocked",
  "Needs Follow-Up",
] as const;
type PipelineStage = (typeof PIPELINE_STAGES)[number];

function pipelineStage(c: Client): PipelineStage {
  const a = simpleAuth(c);
  const h = handoffStatus(c);
  if (a === "Blocked") return "Blocked";
  if (h === "Missing Items") return "Missing Intake Info";
  if (a === "Approved") return "Approved";
  if (a === "Submitted") return "Submitted";
  if (c.stage?.toLowerCase().includes("treatment plan") || !c.assessmentDate) {
    return "Waiting on Treatment Plan";
  }
  if (h === "Needs Review") return "Needs Follow-Up";
  if (a === "Ready for Submission") return "Ready for Submission";
  return "Ready for Auth Review";
}

function nextAction(c: Client): string {
  const blocker = authBlocker(c);
  if (blocker) return blocker;
  if (c.nextAction) return c.nextAction;
  const a = simpleAuth(c);
  if (a === "Approved") return "Ready for staffing handoff";
  if (a === "Submitted") return "Awaiting payor response";
  if (a === "Ready for Submission") return "Send to auth team";
  return "Review with auth team";
}

/* ──────── SOP-aligned status tabs ──────── */

type StatusTabKey =
  | "all" | "awaiting" | "submitted" | "approved" | "denied"
  | "expiring" | "qa" | "missing" | "flaked" | "priority";

function daysUntilExpiration(c: Client): number | null {
  const dates = [
    ...(c.authorizations ?? []).map((a) => a.expirationDate).filter(Boolean) as string[],
    c.nextReauthDate ?? null,
  ].filter(Boolean) as string[];
  if (dates.length === 0) return null;
  const soonest = dates
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b)[0];
  if (!soonest) return null;
  return Math.ceil((soonest - Date.now()) / 86_400_000);
}

function hasMissingDocs(c: Client): boolean {
  return Boolean(
    c.blockers?.some((b) => /missing|consent|insurance|doc|referral|diagnosis/i.test(b)) ||
    c.authorizations?.some((a) => (a.missingDocs?.length ?? 0) > 0),
  );
}

function isFlaked(c: Client): boolean {
  // Drive off the structured flag first; fall back to stage and legacy blocker text
  // so older records without the flag still surface in the Flaked Client queue.
  if (c.clientUnreachable) return true;
  if (c.stage === "Flaked" || c.activeServiceStatus === "Flaked") return true;
  return Boolean(c.blockers?.some((b) => /flake|no\s*show|unreachable|cannot reach|can't reach/i.test(b)));
}

const STATUS_TABS: { key: StatusTabKey; label: string; match: (c: Client) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "awaiting", label: "Awaiting Submission", match: (c) => simpleAuth(c) === "Ready for Submission" || c.authStatus === "Not Submitted" },
  { key: "submitted", label: "Submitted", match: (c) => c.authStatus === "Submitted" },
  { key: "approved", label: "Approved", match: (c) => c.authStatus === "Approved" },
  { key: "denied", label: "Denied", match: (c) => c.authStatus === "Denied" },
  { key: "expiring", label: "Expiring Soon", match: (c) => {
    const d = daysUntilExpiration(c);
    return c.authStatus === "Expiring Soon" || (d !== null && d <= 90 && d >= 0);
  } },
  { key: "qa", label: "In QA Review", match: (c) => c.qaStatus === "In Review" || c.authorizations?.some((a) => a.qaStatus === "In Review") === true },
  { key: "missing", label: "Missing Information", match: hasMissingDocs },
  { key: "flaked", label: "Flaked Client", match: isFlaked },
  { key: "priority", label: "High Priority", match: (c) => {
    const d = daysUntilExpiration(c);
    return (
      c.authStatus === "Denied" ||
      (d !== null && d <= 30 && d >= 0) ||
      (c.daysInStage ?? 0) >= 14 ||
      Boolean(authBlocker(c))
    );
  } },
];

/* ──────── Next-best-action engine ──────── */

type NBA = { label: string; tone: "warn" | "info" | "ok"; why: string };
function nextBestAction(c: Client): NBA {
  const d = daysUntilExpiration(c);
  if (isFlaked(c)) {
    const reason = c.clientUnreachableReason?.trim();
    const since = c.clientUnreachableSince ? ` since ${c.clientUnreachableSince}` : "";
    return {
      label: "Re-engage family or close out",
      tone: "warn",
      why: reason
        ? `Client marked unreachable${since} — ${reason}. Attempt re-engagement or move to discharge.`
        : `Client marked unreachable${since} — attempt re-engagement or move to discharge.`,
    };
  }
  if (c.authStatus === "Denied") {
    return { label: "Review denial & resubmit", tone: "warn", why: "Payor returned a denial — review reason and prepare resubmission." };
  }
  if (hasMissingDocs(c)) {
    return { label: "Request missing information", tone: "warn", why: "Required intake documents are missing — request from family or BCBA." };
  }
  if (c.qaStatus === "In Review") {
    return { label: "Resolve QA review", tone: "warn", why: "Authorization is in QA — clear any QA flags before submission." };
  }
  if (c.authStatus === "Not Submitted" && simpleAuth(c) === "Ready for Submission") {
    return { label: "Submit authorization", tone: "info", why: "Packet is intake-complete and ready for the auth team to submit." };
  }
  if (d !== null && d <= 30 && d >= 0) {
    return { label: "Start reassessment now", tone: "warn", why: `Authorization expires in ${d} day${d === 1 ? "" : "s"} — reassessment overdue.` };
  }
  if (d !== null && d <= 90 && d >= 0) {
    return { label: "Start reassessment workflow", tone: "info", why: `Authorization expires in ${d} days — kick off reassessment with BCBA.` };
  }
  if (c.authStatus === "Submitted") {
    return { label: "Follow up with payor", tone: "info", why: "Authorization is awaiting payor response — confirm receipt if 5+ days old." };
  }
  if (c.authStatus === "Approved") {
    return { label: "Operationally healthy", tone: "ok", why: "Authorization is current — no action required from intake." };
  }
  return { label: "Review with auth team", tone: "info", why: "Confirm next operational step for this authorization." };
}

/* ───────────────────────── modals ───────────────────────── */

type AuthModal =
  | { kind: "note"; client: Client }
  | { kind: "followUp"; client: Client }
  | { kind: "escalate"; client: Client }
  | { kind: "messageTeam"; client: Client; team?: string }
  | { kind: "requestInfo"; client: Client };

const ESCALATION_LABELS: Record<string, string> = {
  auth: "Authorization Team",
  qa: "QA Team",
  ops: "Operations Leadership",
  state: "State Director",
};

function AuthModals({ active, onClose }: { active: AuthModal | null; onClose: () => void }) {
  const { updateClient, appendTimeline, appendAutomation } = useClients();
  const [text, setText] = useState("");
  const [text2, setText2] = useState("");
  const [sel, setSel] = useState("");
  if (!active) return null;
  const name = active.client.childName;
  const finish = (msg: string) => {
    setText(""); setText2(""); setSel("");
    toast.success(msg);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        {active.kind === "note" && (
          <>
            <DialogHeader><DialogTitle>Add note · {name}</DialogTitle></DialogHeader>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Note for the authorization handoff…" rows={5} />
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                disabled={!text.trim()}
                onClick={async () => {
                  await appendTimeline(active.client.id, text.trim(), "note");
                  await appendAutomation(active.client.id, `Note added: ${text.trim().slice(0, 80)}`);
                  finish("Note saved to client timeline");
                }}
              >Save note</Button>
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
              <Button
                disabled={!text || !text2.trim()}
                onClick={async () => {
                  await updateClient(active.client.id, {
                    nextAction: text2.trim(),
                    nextTaskDue: text,
                    nextReauthDate: active.client.nextReauthDate ?? text,
                  });
                  await appendTimeline(active.client.id, `Reassessment follow-up scheduled for ${text}: ${text2.trim()}`, "stage");
                  await appendAutomation(active.client.id, `Reassessment scheduled (${text})`);
                  finish("Reassessment follow-up scheduled");
                }}
              >Create</Button>
            </DialogFooter>
          </>
        )}
        {active.kind === "escalate" && (
          <>
            <DialogHeader><DialogTitle>Escalate auth issue · {name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Escalate to</Label>
                <Select value={sel} onValueChange={setSel}>
                  <SelectTrigger><SelectValue placeholder="Choose team" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auth">Authorization Team</SelectItem>
                    <SelectItem value="qa">QA Team</SelectItem>
                    <SelectItem value="ops">Operations Leadership</SelectItem>
                    <SelectItem value="state">State Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Reason</Label><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                disabled={!sel || !text.trim()}
                onClick={async () => {
                  const target = ESCALATION_LABELS[sel] ?? sel;
                  const reason = text.trim();
                  await updateClient(active.client.id, {
                    blockers: Array.from(new Set([...(active.client.blockers ?? []), `Escalated to ${target}: ${reason}`])),
                  });
                  await appendTimeline(active.client.id, `Escalated to ${target}: ${reason}`, "system");
                  await appendAutomation(active.client.id, `Escalation → ${target}: ${reason.slice(0, 80)}`);
                  finish(`Escalation routed to ${target}`);
                }}
              >Escalate</Button>
            </DialogFooter>
          </>
        )}
        {active.kind === "messageTeam" && (
          <>
            <DialogHeader><DialogTitle>Message {active.team ?? "team"} · {name}</DialogTitle></DialogHeader>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Short operational message…" rows={4} />
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                disabled={!text.trim()}
                onClick={async () => {
                  const team = active.team ?? "team";
                  await appendTimeline(active.client.id, `Message to ${team}: ${text.trim()}`, "note");
                  await appendAutomation(active.client.id, `Message → ${team}: ${text.trim().slice(0, 80)}`);
                  finish(`Message logged for ${team}`);
                }}
              >Send</Button>
            </DialogFooter>
          </>
        )}
        {active.kind === "requestInfo" && (
          <>
            <DialogHeader><DialogTitle>Request missing info · {name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>What's missing?</Label><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. updated insurance card" /></div>
              <div><Label>Message to family</Label><Textarea value={text2} onChange={(e) => setText2(e.target.value)} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                disabled={!text.trim()}
                onClick={async () => {
                  const missing = text.trim();
                  const note = text2.trim();
                  await updateClient(active.client.id, {
                    blockers: Array.from(new Set([...(active.client.blockers ?? []), `Missing: ${missing}`])),
                    nextAction: `Awaiting "${missing}" from family`,
                  });
                  await appendTimeline(
                    active.client.id,
                    `Requested missing info: ${missing}${note ? ` — ${note}` : ""}`,
                    "system",
                  );
                  await appendAutomation(active.client.id, `Info requested from family: ${missing}`);
                  finish("Request logged & family marked as awaiting info");
                }}
              >Send request</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function OSIntakeAuthorizations() {
  const { clients, loading } = useClients();
  const { leads } = useLeads();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [modal, setModal] = useState<AuthModal | null>(null);
  const [view, setView] = useState<"list" | "pipeline">("list");

  const filterPulse = params.get("pulse");
  const filterStage = params.get("stage");
  const filterHandoff = params.get("handoff");
  const filterVOB = params.get("vob");
  const filterStatus = params.get("status");
  const filterTab = (params.get("tab") as StatusTabKey | null) ?? "all";

  // Show only clients that are in any auth lifecycle (skip "Not Started" with no payor)
  const inAuth = useMemo(
    () => clients.filter((c) => simpleAuth(c) !== "Not Started" || c.authStatus !== "Not Submitted" || c.payor),
    [clients]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inAuth.filter((c) => {
      if (q) {
        const hay = [c.childName, c.parentName, c.payor, c.insurance, c.state, c.intakeOwner, simpleAuth(c), authBlocker(c) ?? ""]
          .map((s) => String(s ?? "").toLowerCase()).join(" ");
        if (!hay.includes(q)) return false;
      }
      const a = simpleAuth(c);
      const h = handoffStatus(c);
      const v = simpleVOB(c);
      if (filterStatus && a !== filterStatus) return false;
      if (filterHandoff && h !== filterHandoff) return false;
      if (filterVOB === "finance-review" && v !== "Finance Review Needed") return false;
      if (filterVOB === "missing" && v !== "Missing Info") return false;
      if (filterVOB === "approved" && !(v === "Approved" || v === "Approved with Payment Plan")) return false;
      if (filterStage && pipelineStage(c) !== filterStage) return false;
      if (filterPulse === "waiting" && a !== "Waiting on Authorization" && a !== "Submitted") return false;
      if (filterPulse === "handoff" && !(h === "Missing Items" || h === "Needs Review")) return false;
      if (filterPulse === "missing" && !c.blockers?.some((b) => /missing|consent|insurance|doc|referral/i.test(b))) return false;
      if (filterPulse === "vob" && !(v === "Finance Review Needed" || v === "Missing Info")) return false;
      if (filterPulse === "ready" && a !== "Ready for Submission") return false;
      if (filterPulse === "approved" && a !== "Approved") return false;
      if (filterTab && filterTab !== "all") {
        const tab = STATUS_TABS.find((t) => t.key === filterTab);
        if (tab && !tab.match(c)) return false;
      }
      return true;
    });
  }, [inAuth, query, filterPulse, filterStage, filterHandoff, filterVOB, filterStatus, filterTab]);

  const setFilter = (key: string, value: string | null) => {
    const p = new URLSearchParams(params);
    if (!value) p.delete(key); else p.set(key, value);
    setParams(p, { replace: true });
  };
  const clearFilters = () => setParams(new URLSearchParams(), { replace: true });
  const hasFilters = Boolean(filterPulse || filterStage || filterHandoff || filterVOB || filterStatus);

  return (
    <OSShell rightRail={<AskBlossomRail clients={inAuth} setFilter={setFilter} />}>
      <div className="space-y-8 pb-12">
        <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Authorizations</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
              Track authorization handoffs, blockers, and Intake-related follow-ups.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => toast("Create Follow-Up — pick a client from the list")}>
              <PhoneCall className="mr-1.5 h-4 w-4" /> Create Follow-Up
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/clients"><Users className="mr-1.5 h-4 w-4" /> Open Clients</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leads"><Users className="mr-1.5 h-4 w-4" /> Open Leads</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Export — coming soon")}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client, parent, insurance, auth status…"
            className="h-11 w-full rounded-xl bg-muted/60 border border-border pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition outline-none"
          />
        </div>

        <StatusTabs
          clients={inAuth}
          active={filterTab}
          onChange={(k) => setFilter("tab", k === "all" ? null : k)}
        />

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 -mt-3">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {filterPulse && <FilterChip onClear={() => setFilter("pulse", null)}>{filterPulse}</FilterChip>}
            {filterStage && <FilterChip onClear={() => setFilter("stage", null)}>{filterStage}</FilterChip>}
            {filterHandoff && <FilterChip onClear={() => setFilter("handoff", null)}>Handoff: {filterHandoff}</FilterChip>}
            {filterVOB && <FilterChip onClear={() => setFilter("vob", null)}>VOB: {filterVOB}</FilterChip>}
            {filterStatus && <FilterChip onClear={() => setFilter("status", null)}>Status: {filterStatus}</FilterChip>}
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground transition">Clear all</button>
          </div>
        )}

        {loading && inAuth.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
            Loading authorizations…
          </div>
        ) : (
          <>
            <Pulse clients={inAuth} setFilter={setFilter} active={filterPulse} />
            <NeedingAttention clients={visible} onOpen={setOpenId} onAction={setModal} />

            <div className="flex items-center gap-2">
              <ViewToggle value={view} onChange={setView} />
              <span className="text-xs text-muted-foreground ml-auto tabular-nums">{visible.length} authorizations</span>
            </div>

            {view === "list" ? (
              <AuthList clients={visible} onOpen={setOpenId} />
            ) : (
              <PipelineView clients={visible} onOpen={setOpenId} setFilter={setFilter} />
            )}

            <RecentActivity clients={inAuth} onOpen={setOpenId} />
          </>
        )}
      </div>

      {openId && (
        <AuthDrawer
          clientId={openId}
          leads={leads}
          onClose={() => setOpenId(null)}
          onAction={setModal}
        />
      )}
      <AuthModals active={modal} onClose={() => setModal(null)} />
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

function StatusTabs({
  clients, active, onChange,
}: { clients: Client[]; active: StatusTabKey; onChange: (k: StatusTabKey) => void }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tab of STATUS_TABS) map[tab.key] = clients.filter(tab.match).length;
    return map;
  }, [clients]);
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1">
      {STATUS_TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/60",
            )}
          >
            <span>{t.label}</span>
            <span className={cn(
              "tabular-nums rounded-full px-1.5 py-px text-[10px]",
              isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground/70",
            )}>{counts[t.key] ?? 0}</span>
          </button>
        );
      })}
    </div>
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
    const c = { waiting: 0, handoff: 0, missing: 0, vob: 0, ready: 0, approved: 0 };
    for (const cl of clients) {
      const a = simpleAuth(cl);
      const h = handoffStatus(cl);
      const v = simpleVOB(cl);
      if (a === "Waiting on Authorization" || a === "Submitted") c.waiting++;
      if (h === "Missing Items" || h === "Needs Review") c.handoff++;
      if (cl.blockers?.some((b) => /missing|consent|insurance|doc|referral/i.test(b))) c.missing++;
      if (v === "Finance Review Needed" || v === "Missing Info") c.vob++;
      if (a === "Ready for Submission") c.ready++;
      if (a === "Approved") c.approved++;
    }
    return c;
  }, [clients]);

  const cards = [
    { key: "waiting", label: "Waiting on Authorization", value: counts.waiting },
    { key: "handoff", label: "Intake Handoff Issues", value: counts.handoff, tone: "warning" as const },
    { key: "missing", label: "Missing Documents", value: counts.missing, tone: "destructive" as const },
    { key: "vob", label: "VOB Issues", value: counts.vob, tone: "warning" as const },
    { key: "ready", label: "Ready for Submission", value: counts.ready },
    { key: "approved", label: "Approved", value: counts.approved, tone: "success" as const },
  ];

  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Authorization Handoff Pulse</h2>
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
}: { clients: Client[]; onOpen: (id: string) => void; onAction: (m: AuthModal) => void }) {
  const items = useMemo(() => {
    return clients
      .map((c) => ({ c, blocker: authBlocker(c) }))
      .filter((x) => x.blocker)
      .sort((a, b) => (b.c.daysInStage ?? 0) - (a.c.daysInStage ?? 0))
      .slice(0, 6);
  }, [clients]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Auths Needing Intake Attention</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Blockers, missing intake info, and follow-ups owned by intake.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length} surfaced</span>
      </div>
      {items.length === 0 ? (
        <Empty message="All authorizations are clean. No intake follow-ups required." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(({ c, blocker }) => {
            const a = simpleAuth(c);
            return (
              <article key={c.id} className="group rounded-2xl border border-border/70 bg-card p-5 hover:border-border hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn("inline-block h-1.5 w-1.5 rounded-full",
                        a === "Blocked" ? "bg-destructive" : "bg-amber-500")} />
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">{blocker}</span>
                    </div>
                    <button onClick={() => onOpen(c.id)} className="text-base font-medium text-left hover:text-primary transition">
                      {c.childName}
                    </button>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {c.parentName} · {c.state || "—"} · {c.insurance || c.payor || "—"} · Intake: {c.intakeOwner || "Unassigned"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-muted-foreground">Auth</p>
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] border", AUTH_TONE[a])}>{a}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <PillButton onClick={() => onOpen(c.id)} icon={ChevronRight}>Open Client</PillButton>
                  {c.leadId && (
                    <PillButton asLink to={`/leads?id=${c.leadId}`} icon={ExternalLink}>Original Lead</PillButton>
                  )}
                  <PillButton onClick={() => toast("VOB Decision Center — coming soon")} icon={Heart}>Open VOB</PillButton>
                  <PillButton onClick={() => onAction({ kind: "note", client: c })} icon={StickyNote}>Note</PillButton>
                  <PillButton onClick={() => onAction({ kind: "followUp", client: c })} icon={Clock}>Follow-Up</PillButton>
                  <PillButton onClick={() => onAction({ kind: "messageTeam", client: c, team: "Authorization" })} icon={MessageSquare}>Auth Team</PillButton>
                  <PillButton onClick={() => onAction({ kind: "escalate", client: c })} icon={AlertTriangle}>Escalate</PillButton>
                </div>
              </article>
            );
          })}
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

function AuthList({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <Th>Client</Th><Th>Parent</Th><Th>State</Th><Th>Insurance</Th>
              <Th>Auth Status</Th><Th>Handoff</Th><Th>VOB</Th><Th>Missing Items</Th>
              <Th>Intake Follow-Up</Th><Th>Last Activity</Th><Th>Next Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {clients.length === 0 && (
              <tr><td colSpan={11} className="p-10 text-center text-muted-foreground">No authorizations match your filters.</td></tr>
            )}
            {clients.map((c) => {
              const a = simpleAuth(c);
              const h = handoffStatus(c);
              const v = simpleVOB(c);
              const blocker = authBlocker(c);
              const missing = c.blockers?.filter((b) => /missing|consent|insurance|doc|referral/i.test(b)).length ?? 0;
              return (
                <tr key={c.id} onClick={() => onOpen(c.id)} className="cursor-pointer hover:bg-muted/40 transition">
                  <Td><span className="font-medium">{c.childName}</span></Td>
                  <Td className="text-muted-foreground">{c.parentName || "—"}</Td>
                  <Td className="text-muted-foreground">{c.state || "—"}</Td>
                  <Td className="text-muted-foreground">{c.insurance || c.payor || "—"}</Td>
                  <Td><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] border", AUTH_TONE[a])}>{a}</span></Td>
                  <Td><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] border", HANDOFF_TONE[h])}>{h}</span></Td>
                  <Td className="text-muted-foreground">{v}</Td>
                  <Td className="text-muted-foreground">{missing > 0 ? <span className="text-destructive">{missing}</span> : "—"}</Td>
                  <Td>{blocker ? <span className="text-destructive text-xs">Yes</span> : <span className="text-muted-foreground text-xs">—</span>}</Td>
                  <Td className="text-muted-foreground">{relTime(c.lastActivity)}</Td>
                  <Td className="text-muted-foreground truncate max-w-[220px]">{nextAction(c)}</Td>
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

function PipelineView({
  clients, onOpen, setFilter,
}: { clients: Client[]; onOpen: (id: string) => void; setFilter: (k: string, v: string | null) => void }) {
  const byStage = useMemo(() => {
    const map = new Map<PipelineStage, Client[]>();
    PIPELINE_STAGES.forEach((s) => map.set(s, []));
    clients.forEach((c) => map.get(pipelineStage(c))?.push(c));
    return map;
  }, [clients]);

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const list = byStage.get(stage) ?? [];
          const blocked = list.filter((c) => authBlocker(c)).length;
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
                    <p className="text-muted-foreground truncate text-[11px]">{c.insurance || c.payor || "—"} · {c.daysInStage ?? 0}d</p>
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

function AuthDrawer({
  clientId, leads, onClose, onAction,
}: {
  clientId: string;
  leads: ReturnType<typeof useLeads>["leads"];
  onClose: () => void;
  onAction: (m: AuthModal) => void;
}) {
  const { getClient, updateClient, appendTimeline, appendAutomation } = useClients();
  const c = getClient(clientId);
  if (!c) return null;
  const lead = c.leadId ? leads.find((l) => l.id === c.leadId) : undefined;
  const handoff = handoffChecklist(c);
  const handoffState = handoffStatus(c);
  const auth = simpleAuth(c);
  const vob = simpleVOB(c);
  const blocker = authBlocker(c);
  const missing = handoff.filter((i) => !i.ok);
  const nba = nextBestAction(c);
  const expDays = daysUntilExpiration(c);
  const earliestExp = (c.authorizations ?? [])
    .map((a) => a.expirationDate)
    .filter(Boolean)
    .sort()[0] ?? c.nextReauthDate ?? null;

  /**
   * Real workflow transitions. Each one performs the state mutation, then
   * writes both an audit-grade timeline event and an automation log line so
   * the change is durable history — not just a toast.
   */
  const submitAuth = async () => {
    if (c.authStatus === "Approved" || c.authStatus === "Submitted") {
      toast.info(`Auth already ${c.authStatus.toLowerCase()}.`);
      return;
    }
    await updateClient(c.id, {
      authStatus: "Submitted",
      lastActivity: new Date().toISOString(),
      nextAction: "Awaiting payor decision",
    });
    await appendTimeline(c.id, `Authorization submitted to ${c.payor || "payor"}`, "auth");
    await appendAutomation(c.id, `Auth submitted (${c.payor || "payor"})`);
    toast.success("Auth submitted & logged to client timeline");
  };

  const sendToQA = async () => {
    if (c.qaStatus === "In Review" || c.qaStatus === "Complete") {
      toast.info(`QA already ${c.qaStatus.toLowerCase()}.`);
      return;
    }
    await updateClient(c.id, {
      qaStatus: "In Review",
      nextAction: "Awaiting QA review",
    });
    await appendTimeline(c.id, "Sent to QA for review", "qa");
    await appendAutomation(c.id, "Routed to QA review");
    toast.success("Sent to QA & logged to client timeline");
  };

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col bg-card">
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetHeader>
            <SheetTitle className="text-xl">{c.childName}</SheetTitle>
          </SheetHeader>
          <p className="text-sm text-muted-foreground mt-1">
            {c.parentName} · {c.state || "—"} · {c.insurance || c.payor || "—"}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] border", AUTH_TONE[auth])}>Auth · {auth}</span>
            <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] border", HANDOFF_TONE[handoffState])}>
              Handoff · {handoffState}
            </span>
            <span className="inline-flex rounded-full bg-muted text-foreground border border-border px-2.5 py-1 text-[11px]">
              VOB · {vob}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className={cn(
            "rounded-2xl border p-4",
            nba.tone === "warn" && "border-amber-500/30 bg-amber-500/[0.06]",
            nba.tone === "info" && "border-primary/30 bg-primary/[0.05]",
            nba.tone === "ok" && "border-emerald-500/30 bg-emerald-500/[0.05]",
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                nba.tone === "warn" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                nba.tone === "info" && "bg-primary/15 text-primary",
                nba.tone === "ok" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
              )}>
                <Lightbulb className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">What should happen next</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{nba.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{nba.why}</p>
              </div>
            </div>
          </div>

          <Section title="Expiration & Reassessment" icon={CalendarClock}>
            {earliestExp ? (
              <>
                <KV k="Earliest expiration" v={new Date(earliestExp).toLocaleDateString()} />
                <KV k="Time remaining" v={expDays !== null ? `${expDays}d` : "—"} />
                <KV k="Next reassessment date" v={c.nextReauthDate ? new Date(c.nextReauthDate).toLocaleDateString() : "—"} />
                {expDays !== null && expDays <= 90 && (
                  <div className={cn(
                    "mt-2 rounded-lg border px-3 py-2 text-xs",
                    expDays <= 30
                      ? "border-destructive/30 bg-destructive/[0.06] text-destructive"
                      : expDays <= 60
                        ? "border-amber-500/30 bg-amber-500/[0.06] text-amber-700 dark:text-amber-400"
                        : "border-primary/20 bg-primary/[0.05] text-primary",
                  )}>
                    {expDays <= 30
                      ? "Overdue risk — reassessment should already be in motion."
                      : expDays <= 60
                        ? "60-day warning — confirm BCBA progress report is on track."
                        : "90-day warning — kick off reassessment workflow."}
                  </div>
                )}
                <ReauthCyclesTimeline cycles={c.reauthCycles ?? []} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No expiration date on file yet.</p>
            )}
          </Section>

          <Section title="Client Overview">
            <KV k="Patient" v={c.childName} />
            <KV k="Parent/Guardian" v={c.parentName || "—"} />
            <KV k="State" v={c.state || "—"} />
            <KV k="Insurance" v={c.insurance || c.payor || "—"} />
            <KV k="Intake Coordinator" v={c.intakeOwner || "Unassigned"} />
            <KV k="Current Stage" v={c.stage} />
            {c.startDate && <KV k="Created" v={new Date(c.startDate).toLocaleDateString()} />}
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
            <KV k="VOB status" v={vob} />
            <KV k="Payment plan" v={c.paymentPlanRequired ? (c.paymentPlanSigned ? "Signed" : "Required — not signed") : "Not required"} />
            <KV k="VOB days since" v={c.daysSinceVOB ? `${c.daysSinceVOB}d` : "—"} />
            <Button variant="outline" size="sm" onClick={() => toast("VOB Decision Center — coming soon")} className="mt-2">
              Open VOB Decision
            </Button>
          </Section>

          <Section title="Authorization Status" icon={ShieldCheck}>
            <KV k="Status" v={auth} />
            <KV k="Pipeline stage" v={pipelineStage(c)} />
            <KV k="Last activity" v={relTime(c.lastActivity)} />
            {blocker && <KV k="Blocker" v={blocker} />}
          </Section>

          <Section title="Missing Items" icon={FileWarning}>
            {missing.length === 0 ? (
              <p className="text-sm text-muted-foreground">No missing items.</p>
            ) : (
              <ul className="space-y-1.5">
                {missing.map((i) => (
                  <li key={i.key} className="flex items-center gap-2 text-sm text-foreground">
                    <FileWarning className="h-4 w-4 text-amber-500" /> {i.label}
                  </li>
                ))}
              </ul>
            )}
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
              <Button variant="outline" size="sm" onClick={() => onAction({ kind: "requestInfo", client: c })}>
                <Send className="mr-1.5 h-3.5 w-3.5" /> Request Missing Info
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction({ kind: "messageTeam", client: c, team: "Authorization" })}>
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message Auth Team
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast("VOB Decision Center — coming soon")}>
                <Heart className="mr-1.5 h-3.5 w-3.5" /> Open VOB
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction({ kind: "escalate", client: c })}>
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Escalate
              </Button>
              {c.leadId && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/leads?id=${c.leadId}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open Lead</Link>
                </Button>
              )}
            </div>
          </Section>
        </div>

        <div className="border-t border-border bg-card/95 backdrop-blur px-4 py-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => { void submitAuth(); }}
              disabled={c.authStatus === "Approved" || c.authStatus === "Submitted"}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" /> Submit Auth
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { void sendToQA(); }}
              disabled={c.qaStatus === "In Review" || c.qaStatus === "Complete"}
            >
              <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> Send to QA
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction({ kind: "requestInfo", client: c })}>
              <FileWarning className="mr-1.5 h-3.5 w-3.5" /> Request Info
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction({ kind: "followUp", client: c })}>
              <CalendarClock className="mr-1.5 h-3.5 w-3.5" /> Start Reassessment
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAction({ kind: "note", client: c })}>
              <StickyNote className="mr-1.5 h-3.5 w-3.5" /> Note
            </Button>
          </div>
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
  clients, setFilter,
}: {
  clients: Client[];
  setFilter: (k: string, v: string | null) => void;
}) {
  const blocked = clients.filter((c) => simpleAuth(c) === "Blocked").length;
  const missing = clients.filter((c) => c.blockers?.some((b) => /missing|consent|insurance|doc|referral/i.test(b))).length;
  const ready = clients.filter((c) => simpleAuth(c) === "Ready for Submission").length;
  const paymentUnclear = clients.filter((c) => simpleVOB(c) === "Finance Review Needed").length;

  const prompts = [
    { label: "Which auths need Intake follow-up?", onClick: () => setFilter("pulse", "handoff") },
    { label: "Show handoff issues.", onClick: () => setFilter("handoff", "Missing Items") },
    { label: "Which clients are blocked because of missing intake info?", onClick: () => setFilter("pulse", "missing") },
    { label: "Summarize auth blockers.", onClick: () => toast("Summary — AI placeholder") },
    { label: "Find VOB-related issues.", onClick: () => setFilter("pulse", "vob") },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Ask Blossom AI</h3>
        </div>
        <p className="text-xs text-muted-foreground">Authorization handoff assistant.</p>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Insights</p>
        <div className="space-y-2">
          <InsightLine tone="destructive">{missing} authorizations blocked by missing intake documents.</InsightLine>
          <InsightLine tone="warning">{paymentUnclear} clients have unclear payment plan status.</InsightLine>
          <InsightLine tone="muted">{ready} auths are ready for submission.</InsightLine>
          {blocked > 0 && <InsightLine tone="destructive">{blocked} authorizations blocked by payor.</InsightLine>}
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

/* ─────────────────────── Reauth Cycles Timeline ─────────────────────── */

type MilestoneTone = "done" | "due" | "overdue" | "pending";

interface Milestone {
  key: string;
  label: string;
  icon: typeof Bell;
  date?: string | null;
  doneDate?: string | null;
}

function milestoneTone(m: Milestone): MilestoneTone {
  if (m.doneDate) return "done";
  if (!m.date) return "pending";
  const due = new Date(m.date).getTime();
  if (Number.isNaN(due)) return "pending";
  const now = Date.now();
  if (due < now) return "overdue";
  const inDays = (due - now) / 86_400_000;
  if (inDays <= 14) return "due";
  return "pending";
}

function buildMilestones(cycle: ReauthCycle): Milestone[] {
  return [
    {
      key: "bcba9",
      label: "BCBA 9-week notification",
      icon: Bell,
      date: cycle.bcba9WeekNotificationDate,
      doneDate: cycle.bcba9WeekNotificationDate && new Date(cycle.bcba9WeekNotificationDate).getTime() < Date.now()
        ? cycle.bcba9WeekNotificationDate
        : null,
    },
    {
      key: "bcba6",
      label: "BCBA 6-week notification",
      icon: Bell,
      date: cycle.bcba6WeekNotificationDate,
      doneDate: cycle.bcba6WeekNotificationDate && new Date(cycle.bcba6WeekNotificationDate).getTime() < Date.now()
        ? cycle.bcba6WeekNotificationDate
        : null,
    },
    {
      key: "report",
      label: "Progress report",
      icon: FileText,
      date: cycle.progressReportDueDate,
      doneDate: cycle.progressReportReceivedDate,
    },
    {
      key: "qa",
      label: "QA review",
      icon: ShieldAlert,
      date: cycle.qaReviewStartedDate,
      doneDate: cycle.qaCompletedDate,
    },
    {
      key: "submission",
      label: "Submission to payor",
      icon: Upload,
      date: cycle.reauthTriggerDate,
      doneDate: cycle.submissionDate,
    },
    {
      key: "approval",
      label: "Payor approval",
      icon: CheckCheck,
      date: cycle.currentAuthExpirationDate,
      doneDate: cycle.approvalDate,
    },
  ];
}

function fmtShort(d?: string | null): string {
  if (!d) return "—";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "—";
  return t.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ReauthCyclesTimeline({ cycles }: { cycles: ReauthCycle[] }) {
  if (!cycles.length) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        No reauth cycles tracked yet. Cycles will appear here once kicked off.
      </p>
    );
  }
  // Newest expiration first
  const sorted = [...cycles].sort(
    (a, b) => new Date(b.currentAuthExpirationDate).getTime() - new Date(a.currentAuthExpirationDate).getTime(),
  );
  return (
    <div className="mt-4 space-y-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reauth cycles</p>
      {sorted.map((cycle) => {
        const milestones = buildMilestones(cycle);
        const done = milestones.filter((m) => m.doneDate).length;
        const progressPct = Math.round((done / milestones.length) * 100);
        return (
          <div key={cycle.id} className="rounded-xl border border-border bg-card/60 p-3">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {cycle.payor} · expires {fmtShort(cycle.currentAuthExpirationDate)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Status · {cycle.status} · QA · {cycle.qaStatus} · Submission · {cycle.submissionStatus}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{done}/{milestones.length}</span>
            </div>

            <div className="h-1 w-full rounded-full bg-muted overflow-hidden mb-3" aria-hidden>
              <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>

            <ol className="space-y-2">
              {milestones.map((m, idx) => {
                const tone = milestoneTone(m);
                const Icon = m.icon;
                return (
                  <li key={m.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <span className={cn(
                        "h-6 w-6 rounded-full border flex items-center justify-center",
                        tone === "done" && "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
                        tone === "due" && "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400",
                        tone === "overdue" && "bg-destructive/15 border-destructive/40 text-destructive",
                        tone === "pending" && "bg-muted border-border text-muted-foreground",
                      )}>
                        <Icon className="h-3 w-3" />
                      </span>
                      {idx < milestones.length - 1 && (
                        <span className={cn(
                          "w-px flex-1 my-0.5 min-h-[12px]",
                          tone === "done" ? "bg-emerald-500/40" : "bg-border",
                        )} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-sm",
                          tone === "done" ? "text-foreground" : "text-foreground",
                        )}>{m.label}</span>
                        <span className={cn(
                          "text-[11px] tabular-nums shrink-0",
                          tone === "overdue" ? "text-destructive" : "text-muted-foreground",
                        )}>
                          {tone === "done"
                            ? `Done ${fmtShort(m.doneDate)}`
                            : tone === "overdue"
                              ? `Overdue · ${fmtShort(m.date)}`
                              : tone === "due"
                                ? `Due ${fmtShort(m.date)}`
                                : m.date ? `Target ${fmtShort(m.date)}` : "Not scheduled"}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {(cycle.blockers.length > 0 || cycle.alerts.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cycle.blockers.map((b) => (
                  <span key={`b-${b}`} className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/[0.06] px-2 py-0.5 text-[11px] text-destructive">
                    <AlertTriangle className="h-3 w-3" /> {b}
                  </span>
                ))}
                {cycle.alerts.map((a) => (
                  <span key={`a-${a}`} className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/[0.06] px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                    <Bell className="h-3 w-3" /> {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}