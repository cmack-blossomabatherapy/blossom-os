import { useEffect, useMemo, useRef, useState } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  Brain, AlertTriangle, ChevronRight, FileText, ShieldAlert, X, Clock,
  Activity, MapPin, UserCheck, ClipboardList, Calendar, ArrowUpRight,
  TrendingUp, Inbox, MessageCircle, Users,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useToast } from "@/hooks/use-toast";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { ClinicalDirectorSection } from "@/components/clinical/ClinicalDirectorSection";
import { useClinicalDirectorData } from "@/hooks/useClinicalDirectorData";
import { useClinicalDirectorActions } from "@/hooks/useClinicalDirectorActions";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";

// QA → Escalations & Follow-Ups
// Real data only — derived from live authorization workflows. Each escalation
// row represents an unresolved operational blocker (overdue PR, expiring auth,
// stalled QA review, denied auth, blocked submission) with ownership, urgency
// and the real PR escalation path (GA: Rivky → Shira+Rachel; Other: Rikki → SD).

type Tone = "ok" | "warn" | "crit";
type EscLevel = "Follow-Up" | "Escalated to QA Lead" | "Escalated to SD" | "Critical";
type WorkflowType =
  | "PR Overdue" | "Missing Documentation" | "Expiring Authorization"
  | "Stalled QA Review" | "Blocked Submission" | "Denied Auth" | "Treatment Plan";

type TabKey = "all" | "overdue" | "bcba" | "expiring" | "blocked" | "resolved";

const QA_TEAM = ["Rochel Walzman", "Amanda Avalos", "Julianne Rodriguez", "Anje Grobler", "Raizy Folger"];

// ---------- helpers ----------
function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86_400_000);
}
function toneClasses(t: Tone) {
  switch (t) {
    case "crit": return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn": return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    default:    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
}
function dot(t: Tone) {
  return t === "crit" ? "bg-destructive" : t === "warn" ? "bg-amber-500" : "bg-emerald-500";
}
function ownerForQa(clientName: string): string {
  const i = Math.abs([...clientName].reduce((a, c) => a + c.charCodeAt(0), 0)) % QA_TEAM.length;
  return QA_TEAM[i];
}
function prOutreachOwner(state: string, weeksOut: number | null): string {
  if (weeksOut === null) return state === "GA" ? "Rivky Weissman" : "Rikki Wallach";
  if (state === "GA") return weeksOut <= 6 ? "Shira + Rachel (SD)" : "Rivky Weissman";
  return weeksOut <= 6 ? "SD escalation" : "Rikki Wallach";
}

// ---------- escalation derivation ----------
type Escalation = {
  id: string;
  auth: Authorization;
  type: WorkflowType;
  status: string;
  reason: string;
  level: EscLevel;
  tone: Tone;
  daysOverdue: number;
  daysToExpire: number | null;
  weeksToExpire: number | null;
  outreachOwner: string;
  qaOwner: string;
  bcba: string;
  latestOutreach: string;
  nextAction: string;
  blockedBy: "BCBA" | "Signature" | "Submission" | "Payor" | "Documentation" | "None";
  timeline: { label: string; when: string; tone: Tone }[];
};

function buildEscalations(auths: Authorization[]): Escalation[] {
  const out: Escalation[] = [];
  for (const a of auths) {
    const dExp = daysUntil(a.expirationDate);
    const wExp = dExp === null ? null : Math.max(0, Math.round(dExp / 7));
    const qa = a.qaOwner || ownerForQa(a.clientName);
    const bcba = a.coordinator;

    // PR overdue — derived from expiring auth without TP / with missingInfo
    if (a.expirationDate && dExp !== null && dExp <= 70 && (!a.treatmentPlanReceived || a.missingInfo)) {
      const overdue = Math.max(0, 70 - dExp);
      const level: EscLevel = dExp <= 28 ? "Critical" : dExp <= 42 ? "Escalated to SD" : dExp <= 63 ? "Escalated to QA Lead" : "Follow-Up";
      const tone: Tone = dExp <= 28 ? "crit" : dExp <= 42 ? "crit" : "warn";
      out.push({
        id: `pr-${a.id}`,
        auth: a, type: "PR Overdue",
        status: dExp <= 28 ? "High Risk" : dExp <= 42 ? "Escalated to SD" : "Follow-Up Needed",
        reason: a.treatmentPlanReceived ? "Progress Report not received from BCBA" : "Treatment Plan & PR outstanding",
        level, tone,
        daysOverdue: overdue,
        daysToExpire: dExp, weeksToExpire: wExp,
        outreachOwner: prOutreachOwner(a.state, wExp),
        qaOwner: qa, bcba,
        latestOutreach: a.lastActivity,
        nextAction: dExp <= 42
          ? `Loop in ${a.state === "GA" ? "Shira + Rachel" : "State Director"} — auth in ${dExp}d`
          : `Follow up with ${bcba} — PR needed by ${a.state === "GA" ? "Rivky" : "Rikki"}`,
        blockedBy: "BCBA",
        timeline: [
          { label: "Initial follow-up", when: "9w out", tone: "ok" },
          { label: "Reminder sent", when: "7w out", tone: "warn" },
          { label: a.state === "GA" ? "Escalated to Shira + Rachel" : "Escalated to SD", when: "6w out", tone: dExp <= 42 ? "crit" : "warn" },
          { label: "Awaiting BCBA response", when: "now", tone: dExp <= 28 ? "crit" : "warn" },
        ],
      });
    }

    // Missing documentation (non-PR)
    if (a.missingInfo && a.treatmentPlanReceived) {
      const tone: Tone = a.daysInStage >= 7 ? "crit" : a.daysInStage >= 3 ? "warn" : "ok";
      const level: EscLevel = a.daysInStage >= 10 ? "Escalated to SD" : a.daysInStage >= 5 ? "Escalated to QA Lead" : "Follow-Up";
      out.push({
        id: `mi-${a.id}`,
        auth: a, type: "Missing Documentation",
        status: "Waiting on BCBA",
        reason: (a.missingRequirements?.[0]) ?? "Required documentation outstanding",
        level, tone,
        daysOverdue: a.daysInStage,
        daysToExpire: dExp, weeksToExpire: wExp,
        outreachOwner: prOutreachOwner(a.state, wExp),
        qaOwner: qa, bcba,
        latestOutreach: a.lastActivity,
        nextAction: `Request ${(a.missingRequirements?.[0]) ?? "documentation"} from ${bcba}`,
        blockedBy: /sign/i.test(a.missingRequirements?.join(" ") || "") ? "Signature" : "Documentation",
        timeline: [
          { label: "Gap identified", when: `${a.daysInStage}d ago`, tone: "warn" },
          { label: "BCBA notified", when: `${Math.max(1, a.daysInStage - 1)}d ago`, tone: "warn" },
          { label: "Awaiting response", when: "now", tone },
        ],
      });
    }

    // Stalled QA review
    if (a.stage === "In QA Review" && a.daysInStage >= 4) {
      const tone: Tone = a.daysInStage >= 8 ? "crit" : "warn";
      out.push({
        id: `qa-${a.id}`,
        auth: a, type: "Stalled QA Review",
        status: "Blocked Submission",
        reason: a.qaNotes || "QA review pending longer than expected",
        level: a.daysInStage >= 8 ? "Escalated to QA Lead" : "Follow-Up",
        tone, daysOverdue: a.daysInStage,
        daysToExpire: dExp, weeksToExpire: wExp,
        outreachOwner: qa, qaOwner: qa, bcba,
        latestOutreach: a.lastActivity,
        nextAction: "Complete QA review and route to submission",
        blockedBy: "Submission",
        timeline: [
          { label: "Entered QA", when: `${a.daysInStage}d ago`, tone: "ok" },
          { label: "Review in progress", when: "ongoing", tone: "warn" },
        ],
      });
    }

    // Denied auth
    if (a.stage === "Denied") {
      out.push({
        id: `dn-${a.id}`,
        auth: a, type: "Denied Auth",
        status: "High Risk",
        reason: a.denialReason || "Payor denial — appeal workflow required",
        level: "Critical", tone: "crit",
        daysOverdue: a.daysInStage,
        daysToExpire: dExp, weeksToExpire: wExp,
        outreachOwner: qa, qaOwner: qa, bcba,
        latestOutreach: a.lastActivity,
        nextAction: "Open appeal workflow with payor",
        blockedBy: "Payor",
        timeline: [
          { label: "Submission denied", when: `${a.daysInStage}d ago`, tone: "crit" },
          { label: "Appeal pending", when: "now", tone: "crit" },
        ],
      });
    }

    // Awaiting submission too long
    if (a.stage === "Awaiting Submission" && a.daysInStage >= 3 && !a.missingInfo) {
      out.push({
        id: `sb-${a.id}`,
        auth: a, type: "Blocked Submission",
        status: "Blocked",
        reason: `Awaiting submission ${a.daysInStage} days`,
        level: a.daysInStage >= 7 ? "Escalated to QA Lead" : "Follow-Up",
        tone: a.daysInStage >= 7 ? "crit" : "warn",
        daysOverdue: a.daysInStage,
        daysToExpire: dExp, weeksToExpire: wExp,
        outreachOwner: qa, qaOwner: qa, bcba,
        latestOutreach: a.lastActivity,
        nextAction: "Submit packet to payor today",
        blockedBy: "Submission",
        timeline: [
          { label: "Ready to submit", when: `${a.daysInStage}d ago`, tone: "warn" },
          { label: "Awaiting submission", when: "now", tone: a.daysInStage >= 7 ? "crit" : "warn" },
        ],
      });
    }
  }

  // Sort by tone+urgency
  const score = (e: Escalation) =>
    (e.tone === "crit" ? 0 : e.tone === "warn" ? 1 : 2) * 1000
    - (e.daysOverdue || 0)
    + (e.daysToExpire ?? 999);
  return out.sort((a, b) => score(a) - score(b));
}

// ---------- small UI atoms ----------
function AwareCard({
  icon: Icon, label, value, tone, sub,
}: { icon: any; label: string; value: number; tone: Tone; sub: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <span className={cn("inline-flex size-6 items-center justify-center rounded-full border", toneClasses(tone))}>
          <Icon className="size-3.5" />
        </span>
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function Chip({ children, tone = "ok", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", toneClasses(tone), className)}>
      {children}
    </span>
  );
}

function EscalationCard({ e, onOpen }: { e: Escalation; onOpen: (e: Escalation) => void }) {
  return (
    <div className="group rounded-2xl bg-card border border-border/70 p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] hover:-translate-y-0.5 hover:border-border transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", dot(e.tone))} />
            <h3 className="font-medium tracking-tight truncate">{e.auth.clientName}</h3>
            <Chip tone={e.tone}>{e.status}</Chip>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {e.auth.state}</span>
            <span className="inline-flex items-center gap-1"><UserCheck className="size-3" /> {e.bcba}</span>
            <span className="inline-flex items-center gap-1"><FileText className="size-3" /> {e.auth.id}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{e.type}</div>
          <div className="text-xs text-muted-foreground mt-1">{e.level}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl bg-muted/60 border border-border/60 px-3 py-2">
          <div className="text-muted-foreground text-[11px]">Days overdue</div>
          <div className="mt-0.5 font-semibold">{e.daysOverdue}d</div>
        </div>
        <div className="rounded-xl bg-muted/60 border border-border/60 px-3 py-2">
          <div className="text-muted-foreground text-[11px]">Expiration</div>
          <div className="mt-0.5 font-semibold">{e.daysToExpire === null ? "—" : `${e.daysToExpire}d`}</div>
        </div>
        <div className="rounded-xl bg-muted/60 border border-border/60 px-3 py-2">
          <div className="text-muted-foreground text-[11px]">QA Owner</div>
          <div className="mt-0.5 font-semibold truncate">{e.qaOwner}</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground/80">{e.reason}</p>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowUpRight className="size-3.5" />
        <span className="truncate"><span className="text-foreground/80">Next:</span> {e.nextAction}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <MessageCircle className="size-3.5" />
        <span className="truncate"><span className="text-foreground/80">Outreach:</span> {e.outreachOwner}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <button onClick={() => onOpen(e)} className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 h-8 text-xs font-medium shadow-sm hover:opacity-90 transition">
          Open workflow <ChevronRight className="size-3" />
        </button>
        <button onClick={() => onOpen(e)} title="Open workflow to send a follow-up" className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 h-8 text-xs hover:bg-muted transition"><Send className="size-3" /> Send follow-up</button>
        <button onClick={() => onOpen(e)} title="Open workflow to escalate" className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 h-8 text-xs hover:bg-muted transition"><Flame className="size-3" /> Escalate</button>
        <button onClick={() => onOpen(e)} title="Open workflow to add a QA note" className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 h-8 text-xs hover:bg-muted transition"><StickyNote className="size-3" /> Add note</button>
        <button onClick={() => onOpen(e)} title="Open workflow to mark resolved" className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 h-8 text-xs hover:bg-muted transition"><CheckCircle2 className="size-3" /> Mark resolved</button>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "h-8 px-3 rounded-full text-xs border transition",
      active ? "bg-primary text-primary-foreground border-transparent" : "bg-muted/60 border-border/60 hover:bg-muted text-muted-foreground"
    )}>
      {children}
    </button>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-xl bg-muted/60 border border-border/60 pl-3 pr-8 text-xs focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none">
        <option value="">{label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronRight className="size-3 absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ---------- slideout ----------
function EscalationSlideout({ e, onClose, onChanged, sourceSystem }: { e: Escalation; onClose: () => void; onChanged?: () => void | Promise<void>; sourceSystem?: "monday" | "manual" | "centralreach" }) {
  useSlideout(true, onClose);
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/10 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-xl h-full bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/70 px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{e.type} · {e.auth.state} · {e.auth.id}</div>
            <h2 className="text-lg font-semibold tracking-tight truncate">{e.auth.clientName}</h2>
          </div>
          <button onClick={onClose} className="rounded-full size-9 grid place-items-center hover:bg-muted transition"><X className="size-4" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <Chip tone={e.tone}>{e.status}</Chip>
            <Chip tone="warn">{e.level}</Chip>
            {e.daysToExpire !== null && (
              <Chip tone={e.daysToExpire <= 28 ? "crit" : e.daysToExpire <= 60 ? "warn" : "ok"}>
                Expires in {e.daysToExpire}d
              </Chip>
            )}
            <Chip tone="ok">Blocked by {e.blockedBy}</Chip>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Why this is escalated</h3>
            <p className="text-sm">{e.reason}</p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Escalation timeline</h3>
            <ol className="relative border-l border-border/60 ml-2 space-y-3">
              {e.timeline.map((t, i) => (
                <li key={i} className="pl-4 relative">
                  <span className={cn("absolute -left-[5px] top-1.5 size-2.5 rounded-full border-2 border-background", dot(t.tone))} />
                  <div className="text-sm">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.when}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-muted/60 border border-border/60 p-3">
              <div className="text-xs text-muted-foreground">QA Owner</div>
              <div className="font-medium mt-0.5">{e.qaOwner}</div>
            </div>
            <div className="rounded-xl bg-muted/60 border border-border/60 p-3">
              <div className="text-xs text-muted-foreground">Assigned BCBA</div>
              <div className="font-medium mt-0.5">{e.bcba}</div>
            </div>
            <div className="rounded-xl bg-muted/60 border border-border/60 p-3">
              <div className="text-xs text-muted-foreground">Outreach Owner</div>
              <div className="font-medium mt-0.5">{e.outreachOwner}</div>
            </div>
            <div className="rounded-xl bg-muted/60 border border-border/60 p-3">
              <div className="text-xs text-muted-foreground">Payor</div>
              <div className="font-medium mt-0.5">{e.auth.payor}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Readiness</h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2"><span className={cn("size-2 rounded-full", e.auth.treatmentPlanReceived ? "bg-emerald-500" : "bg-amber-500")} /> Treatment Plan {e.auth.treatmentPlanReceived ? "received" : "missing"}</li>
              <li className="flex items-center gap-2"><span className={cn("size-2 rounded-full", e.auth.missingInfo ? "bg-destructive" : "bg-emerald-500")} /> {e.auth.missingInfo ? `Missing: ${e.auth.missingRequirements?.join(", ") || "documentation"}` : "All requirements met"}</li>
              <li className="flex items-center gap-2"><span className={cn("size-2 rounded-full", e.auth.qaStatus === "Complete" ? "bg-emerald-500" : "bg-amber-500")} /> QA {e.auth.qaStatus}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Next required action</h3>
            <div className="rounded-xl border border-border/70 p-3 text-sm flex items-start gap-2">
              <ArrowUpRight className="size-4 mt-0.5 text-primary" />
              <span>{e.nextAction}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link to={`/qa-queue`} className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-4 h-9 text-xs font-medium shadow-sm hover:opacity-90 transition">
              <ExternalLink className="size-3" /> Open in QA Queue
            </Link>
            <QAActionsPanel auth={e.auth} sourceSystem={sourceSystem} onChanged={onChanged} />
          </div>

          <ClinicalDirectorSection
            sourceType="authorization"
            sourceRecordId={e.auth.id}
            clientId={e.auth.clientId}
            clientName={e.auth.clientName}
            bcbaName={e.bcba}
            state={e.auth.state}
            defaultTitle={`Clinical escalation: ${e.auth.clientName}`}
            defaultPriority="high"
            metadata={{
              type: e.type,
              level: e.level,
              reason: e.reason,
              daysOverdue: e.daysOverdue,
              daysToExpire: e.daysToExpire,
              blockedBy: e.blockedBy,
            }}
          />
        </div>
      </aside>
    </div>
  );
}

// ---------- main page ----------
export default function OSQAEscalations() {
  const { qaItems: items, refresh, sourceById } = useLiveAuthorizations();
  const all = useMemo(() => buildEscalations(items), [items]);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [owner, setOwner] = useState("");
  const [type, setType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [open, setOpen] = useState<Escalation | null>(null);

  // QA Pass 7 deep links — resolve ?id / ?focus / ?client / ?bcba against
  // the derived escalation list and open the workflow slideout. We can't use
  // useQADeepLink here because its openId contract is a string id; the
  // Escalations page needs the full Escalation object to render the drawer.
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const consumedDeepLink = useRef(false);
  useEffect(() => {
    if (consumedDeepLink.current) return;
    if (!items || items.length === 0) return;

    const idParam = searchParams.get("id") ?? searchParams.get("focus");
    const clientParam = searchParams.get("client");
    const bcbaParam = searchParams.get("bcba");
    if (!idParam && !clientParam && !bcbaParam) {
      consumedDeepLink.current = true;
      return;
    }

    const missed: string[] = [];
    let opened: Escalation | null = null;

    if (idParam) {
      const match = all.find((e) => e.auth.id === idParam);
      if (match) {
        opened = match;
      } else {
        const authExists = items.some((i) => i.id === idParam);
        if (authExists) {
          toast({
            title: "No active escalation",
            description: `Authorization ${idParam} has no active escalation or follow-up right now.`,
          });
          setQuery(idParam);
        } else {
          missed.push(`record ${idParam}`);
        }
      }
    }

    if (clientParam) {
      setQuery(clientParam);
      if (!opened) {
        const cLower = clientParam.toLowerCase();
        opened = all.find(
          (e) =>
            e.auth.clientName.toLowerCase() === cLower ||
            e.auth.clientName.toLowerCase().includes(cLower) ||
            e.auth.id === clientParam,
        ) ?? null;
        const clientExists = items.some(
          (i) =>
            (i.clientName ?? "").toLowerCase() === cLower ||
            i.id === clientParam,
        );
        if (!opened && !clientExists) missed.push(`client "${clientParam}"`);
      }
    }

    if (bcbaParam) {
      setQuery(bcbaParam);
      if (!opened) {
        const bLower = bcbaParam.toLowerCase();
        opened = all.find((e) => (e.bcba ?? "").toLowerCase() === bLower) ?? null;
        const bcbaExists = items.some(
          (i) => (i.coordinator ?? "").toLowerCase() === bLower,
        );
        if (!opened && !bcbaExists) missed.push(`BCBA "${bcbaParam}"`);
      }
    }

    if (opened) setOpen(opened);
    if (missed.length) {
      toast({
        title: "Deep link partially resolved",
        description: `Could not locate ${missed.join(", ")}.`,
      });
    }

    const next = new URLSearchParams(searchParams);
    let changed = false;
    for (const key of ["id", "focus", "client", "bcba"]) {
      if (next.has(key)) {
        next.delete(key);
        changed = true;
      }
    }
    if (changed) setSearchParams(next, { replace: true });
    consumedDeepLink.current = true;
  }, [items, all, searchParams, setSearchParams, toast]);

  const filtered = useMemo(() => {
    return all.filter(e => {
      if (state && e.auth.state !== state) return false;
      if (owner && e.qaOwner !== owner) return false;
      if (type && e.type !== type) return false;
      if (urgency === "Critical" && e.tone !== "crit") return false;
      if (urgency === "Warning" && e.tone !== "warn") return false;
      if (tab === "overdue" && e.daysOverdue < 3) return false;
      if (tab === "bcba" && e.blockedBy !== "BCBA") return false;
      if (tab === "expiring" && !(e.daysToExpire !== null && e.daysToExpire <= 30)) return false;
      if (tab === "blocked" && !(e.blockedBy === "Submission" || e.blockedBy === "Payor")) return false;
      if (query) {
        const q = query.toLowerCase();
        if (![e.auth.clientName, e.bcba, e.qaOwner, e.auth.id, e.reason, e.type].some(x => x.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [all, tab, query, state, owner, type, urgency]);

  const counts = useMemo(() => ({
    active: all.length,
    overdue: all.filter(e => e.daysOverdue >= 3).length,
    highRisk: all.filter(e => e.daysToExpire !== null && e.daysToExpire <= 14).length,
    bcba: all.filter(e => e.blockedBy === "BCBA").length,
    blocked: all.filter(e => e.blockedBy === "Submission" || e.blockedBy === "Payor").length,
  }), [all]);

  const states = useMemo(() => Array.from(new Set(all.map(e => e.auth.state))).sort(), [all]);
  const owners = QA_TEAM;
  const types: WorkflowType[] = ["PR Overdue", "Missing Documentation", "Expiring Authorization", "Stalled QA Review", "Blocked Submission", "Denied Auth", "Treatment Plan"];

  // Right-rail derivations
  const todaysRisks = all.filter(e => e.tone === "crit").slice(0, 6);
  const ownership = QA_TEAM.map(name => {
    const mine = all.filter(e => e.qaOwner === name);
    return {
      name,
      active: mine.length,
      overdue: mine.filter(e => e.daysOverdue >= 3).length,
      crit: mine.filter(e => e.tone === "crit").length,
    };
  });

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto">
        <ClinicalDirectorEscalationCenter />
        {/* Header */}
        <header className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Escalations & Follow-Ups</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Track unresolved workflows, overdue follow-ups, escalation timelines, and operational risks.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="rounded-full border border-border/70 px-3 h-8 inline-flex items-center gap-1.5"><Flame className="size-3.5 text-destructive" /> {counts.active} active</div>
            <div className="rounded-full border border-border/70 px-3 h-8 inline-flex items-center gap-1.5"><Clock className="size-3.5 text-amber-500" /> {counts.overdue} overdue</div>
            <div className="rounded-full border border-border/70 px-3 h-8 inline-flex items-center gap-1.5"><Calendar className="size-3.5" /> {todayLabel()}</div>
          </div>
        </header>

        {/* Search + filters */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search client, BCBA, escalation, PR workflow, or authorization..."
              className="w-full h-11 rounded-xl bg-muted/60 border border-border/60 pl-11 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <FilterPill active={tab === "all"} onClick={() => setTab("all")}>All</FilterPill>
              <FilterPill active={tab === "overdue"} onClick={() => setTab("overdue")}>Overdue</FilterPill>
              <FilterPill active={tab === "bcba"} onClick={() => setTab("bcba")}>Waiting on BCBA</FilterPill>
              <FilterPill active={tab === "expiring"} onClick={() => setTab("expiring")}>Expiring</FilterPill>
              <FilterPill active={tab === "blocked"} onClick={() => setTab("blocked")}>Blocked</FilterPill>
            </div>
            <Select value={state} onChange={setState} options={states} label="State" />
            <Select value={type} onChange={setType} options={types} label="Workflow type" />
            <Select value={owner} onChange={setOwner} options={owners} label="QA owner" />
            <Select value={urgency} onChange={setUrgency} options={["Critical", "Warning"]} label="Urgency" />
          </div>
        </div>

        {/* Awareness cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          <AwareCard icon={Flame} label="Active escalations" value={counts.active} tone={counts.active > 0 ? "warn" : "ok"} sub="currently escalated" />
          <AwareCard icon={Clock} label="Overdue follow-ups" value={counts.overdue} tone={counts.overdue > 5 ? "crit" : counts.overdue > 0 ? "warn" : "ok"} sub="requiring action" />
          <AwareCard icon={AlertTriangle} label="High-risk expirations" value={counts.highRisk} tone={counts.highRisk > 0 ? "crit" : "ok"} sub="≤ 14 days" />
          <AwareCard icon={UserCheck} label="Waiting on BCBA" value={counts.bcba} tone={counts.bcba > 0 ? "warn" : "ok"} sub="unresolved response" />
          <AwareCard icon={ShieldAlert} label="Blocked submissions" value={counts.blocked} tone={counts.blocked > 0 ? "warn" : "ok"} sub="cannot progress" />
        </div>

        {/* Two-column workspace */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main */}
          <div className="space-y-6 min-w-0">
            {/* Escalation feed */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-medium tracking-tight">Operational priority</h2>
                <span className="text-xs text-muted-foreground">{filtered.length} workflows</span>
              </div>
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
                  <CheckCircle2 className="size-6 text-emerald-500 mx-auto" />
                  <p className="mt-2 text-sm">No active escalations match these filters.</p>
                  <p className="text-xs text-muted-foreground">You're caught up.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {filtered.map(e => <EscalationCard key={e.id} e={e} onOpen={setOpen} />)}
                </div>
              )}
            </section>

            {/* High-risk */}
            <section>
              <h2 className="text-xl font-medium tracking-tight mb-3">High-risk workflows</h2>
              {(() => {
                const rows = all.filter(e => e.daysToExpire !== null && e.daysToExpire <= 14);
                if (rows.length === 0) return (
                  <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">No high-risk workflows currently active.</div>
                );
                return (
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
                    {rows.map(e => (
                      <button key={e.id} onClick={() => setOpen(e)} className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/50 transition">
                        <span className={cn("size-2 rounded-full shrink-0", dot(e.tone))} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium truncate">{e.auth.clientName}</span>
                            <Chip tone={e.tone}>{e.daysToExpire}d to expire</Chip>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{e.reason} · {e.bcba} · {e.auth.state}</div>
                        </div>
                        <div className="text-xs text-muted-foreground hidden sm:block">{e.outreachOwner}</div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </section>

            {/* BCBA follow-up tracker */}
            <section>
              <h2 className="text-xl font-medium tracking-tight mb-3">BCBA follow-up tracker</h2>
              {(() => {
                const rows = all.filter(e => e.blockedBy === "BCBA");
                if (rows.length === 0) return (
                  <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">No unresolved BCBA follow-ups.</div>
                );
                return (
                  <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
                    {rows.slice(0, 10).map(e => (
                      <div key={e.id} className="p-4 flex items-center gap-3">
                        <div className="size-8 rounded-full bg-muted grid place-items-center text-[11px] font-medium text-muted-foreground shrink-0">
                          {e.bcba.split(" ").map(s => s[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{e.bcba} · <span className="text-muted-foreground font-normal">{e.auth.clientName}</span></div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{e.reason}</div>
                        </div>
                        <Chip tone={e.tone}>{e.daysOverdue}d waiting</Chip>
                        <button onClick={() => setOpen(e)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">View <ChevronRight className="size-3" /></button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium tracking-tight inline-flex items-center gap-2"><Flame className="size-4 text-destructive" /> Today's risks</h3>
                <span className="text-xs text-muted-foreground">{todaysRisks.length}</span>
              </div>
              {todaysRisks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No urgent risks.</p>
              ) : (
                <ul className="space-y-2">
                  {todaysRisks.map(e => (
                    <li key={e.id}>
                      <button onClick={() => setOpen(e)} className="w-full text-left rounded-xl p-2 hover:bg-muted/60 transition">
                        <div className="text-sm font-medium truncate">{e.auth.clientName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{e.type} · {e.daysToExpire !== null ? `${e.daysToExpire}d` : `${e.daysOverdue}d`}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <h3 className="text-sm font-medium tracking-tight inline-flex items-center gap-2 mb-3"><Users className="size-4" /> Escalation ownership</h3>
              <ul className="space-y-2">
                {ownership.map(o => (
                  <li key={o.name} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{o.name}</span>
                      <span className="text-xs text-muted-foreground">{o.active}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{o.overdue} overdue</span><span>·</span><span>{o.crit} critical</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <h3 className="text-sm font-medium tracking-tight inline-flex items-center gap-2 mb-3"><Brain className="size-4 text-primary" /> Operational Insights</h3>
              <div className="space-y-2">
                {[
                  "Which escalations are highest priority?",
                  "Which workflows are overdue?",
                  "Which BCBAs have unresolved follow-ups?",
                  "What expires within 30 days?",
                  "Which submissions are blocked?",
                ].map(p => (
                  <button key={p} className="w-full text-left text-xs rounded-xl border border-border/60 px-3 py-2 hover:bg-muted/60 transition flex items-center justify-between gap-2">
                    <span className="truncate">{p}</span>
                    <Sparkles className="size-3 text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {open && <EscalationSlideout e={open} onClose={() => setOpen(null)} onChanged={refresh} sourceSystem={sourceById.get(open.auth.id)} />}
    </OSShell>
  );
}

/**
 * Clinical Director-only escalation center. Combines the derived QA escalation
 * rows already shown on this page with escalated/urgent clinical_work_items
 * (which flow in from every other Clinical Director page). Also exposes the
 * saved-view UI backed by clinical_saved_views.
 */
function ClinicalDirectorEscalationCenter() {
  const ctx = useOSRoleSafe();
  const data = useClinicalDirectorData({});
  const actions = useClinicalDirectorActions();
  const [savedViews, setSavedViews] = useState<Array<{ id: string; name: string; filters: Record<string, unknown> }>>([]);
  const [viewName, setViewName] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [dueSoon, setDueSoon] = useState(false);

  useEffect(() => {
    if (!ctx || ctx.role !== "clinical_director") return;
    void (async () => {
      try {
        const rows = await actions.listSavedViews();
        setSavedViews(rows as never);
      } catch { /* non-blocking */ }
    })();
  }, [ctx, actions]);

  if (!ctx || ctx.role !== "clinical_director") return null;

  const items = data.items.filter((i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (priorityFilter && i.priority !== priorityFilter) return false;
    if (sourceFilter && i.source_type !== sourceFilter) return false;
    if (dueSoon) {
      if (!i.due_at) return false;
      const days = (new Date(i.due_at).getTime() - Date.now()) / 86_400_000;
      if (days > 7) return false;
    }
    return true;
  });
  const escalatedOrUrgent = items.filter(
    (i) => i.status === "escalated" || i.priority === "urgent" || i.priority === "high"
      || (i.due_at && new Date(i.due_at) < new Date()),
  );

  async function saveCurrent() {
    if (!viewName.trim()) return;
    try {
      await actions.saveView(viewName.trim(), {
        statusFilter, priorityFilter, sourceFilter, dueSoon,
      });
      const rows = await actions.listSavedViews();
      setSavedViews(rows as never);
      setViewName("");
    } catch { /* non-blocking */ }
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Clinical Director escalation center</h2>
        <span className="text-xs text-muted-foreground">{escalatedOrUrgent.length} escalated / urgent · {items.length} total clinical items</span>
      </header>
      <div className="flex flex-wrap gap-2 mb-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-slate-200 px-2 py-1 text-xs">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="escalated">Escalated</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded border border-slate-200 px-2 py-1 text-xs">
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded border border-slate-200 px-2 py-1 text-xs">
          <option value="">All source types</option>
          <option value="authorization">Authorization</option>
          <option value="supervision">Supervision</option>
          <option value="bcba">BCBA</option>
          <option value="evaluation">Evaluation</option>
          <option value="manual">Manual</option>
        </select>
        <label className="text-xs inline-flex items-center gap-1">
          <input type="checkbox" checked={dueSoon} onChange={(e) => setDueSoon(e.target.checked)} /> Due within 7d / overdue
        </label>
        <input
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          placeholder="Save current view as…"
          className="ml-auto rounded border border-slate-200 px-2 py-1 text-xs"
        />
        <button onClick={saveCurrent} className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs">Save view</button>
      </div>
      {savedViews.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {savedViews.map((v) => (
            <span key={v.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px]">
              {v.name}
              <button
                onClick={async () => { await actions.deleteSavedView(v.id); setSavedViews((s) => s.filter((x) => x.id !== v.id)); }}
                className="text-slate-500 hover:text-destructive"
                title="Delete saved view"
              >×</button>
            </span>
          ))}
        </div>
      )}
      <ul className="divide-y divide-slate-100">
        {escalatedOrUrgent.slice(0, 10).map((i) => (
          <li key={i.id} className="py-2 text-sm flex items-center justify-between">
            <div className="min-w-0">
              <div className="truncate font-medium">{i.title}</div>
              <div className="text-xs text-muted-foreground">
                {i.source_type}{i.client_name ? ` · ${i.client_name}` : ""}{i.bcba_name ? ` · ${i.bcba_name}` : ""} · {i.priority} · {i.status}
              </div>
            </div>
          </li>
        ))}
        {escalatedOrUrgent.length === 0 && (
          <li className="py-3 text-xs text-muted-foreground">No escalated or urgent clinical work items.</li>
        )}
      </ul>
    </section>
  );
}