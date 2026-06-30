import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, FileWarning, UserCog, ClipboardCheck,
  CheckCircle2, AlertTriangle, Loader2, ExternalLink, Clock,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Authorization } from "@/data/authorizations";
import { daysUntil } from "@/data/authorizations";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useAuthorizationActions, type EnsureOverlayInput } from "@/hooks/useAuthorizationActions";

/**
 * Initial → Treatment handoff board.
 * Surfaces the operational chain that moves a client from an approved
 * initial authorization (assessment) into an approved treatment
 * authorization (ongoing ABA). Each lane has one owner and surfaces the
 * concrete blocker keeping the case from advancing.
 */

type LaneId =
  | "initial_submitted"
  | "initial_approved"
  | "tx_plan_drafting"
  | "tx_plan_qa"
  | "tx_auth_submitted"
  | "tx_auth_approved";

interface Lane {
  id: LaneId;
  title: string;
  subtitle: string;
  owner: string;
  accent: string;
  Icon: typeof ShieldCheck;
  // next stage label to move to when "Advance" is clicked
  advanceTo?: string;
  advanceLabel?: string;
}

const LANES: Lane[] = [
  { id: "initial_submitted", title: "Initial Auth Submitted", subtitle: "Awaiting payor decision on assessment", owner: "Auth Coordinator", accent: "from-sky-500/15 to-sky-500/0 border-sky-500/30", Icon: ShieldCheck, advanceTo: "Approved", advanceLabel: "Mark Approved" },
  { id: "initial_approved", title: "Initial Approved — Schedule Eval", subtitle: "Hand off to intake / BCBA for assessment scheduling", owner: "Intake + BCBA", accent: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/30", Icon: UserCog, advanceTo: "In QA Review", advanceLabel: "Treatment Plan Ready" },
  { id: "tx_plan_drafting", title: "Treatment Plan Drafting", subtitle: "BCBA writing treatment plan from assessment", owner: "BCBA", accent: "from-violet-500/15 to-violet-500/0 border-violet-500/30", Icon: ClipboardCheck, advanceTo: "In QA Review", advanceLabel: "Send to QA" },
  { id: "tx_plan_qa", title: "Treatment Plan in QA", subtitle: "QA reviewing plan before submission", owner: "QA", accent: "from-amber-500/15 to-amber-500/0 border-amber-500/30", Icon: ClipboardCheck, advanceTo: "Awaiting Submission", advanceLabel: "QA Cleared — Ready to Submit" },
  { id: "tx_auth_submitted", title: "Treatment Auth Submitted", subtitle: "Awaiting payor decision on treatment auth", owner: "Auth Coordinator", accent: "from-indigo-500/15 to-indigo-500/0 border-indigo-500/30", Icon: ShieldCheck, advanceTo: "Approved", advanceLabel: "Mark Approved" },
  { id: "tx_auth_approved", title: "Treatment Auth Approved", subtitle: "Ready for staffing & start of care", owner: "Scheduling", accent: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/40", Icon: CheckCircle2 },
];

function classifyLane(a: Authorization): LaneId | null {
  const isInitial = a.authType === "Initial";
  const isTx = a.authType === "Treatment";

  // Initial side
  if (isInitial && (a.stage === "Awaiting Submission" || a.stage === "Submitted")) return "initial_submitted";
  if (isInitial && a.stage === "Approved" && !a.treatmentPlanReceived) return "initial_approved";
  if (isInitial && a.stage === "Approved" && a.treatmentPlanReceived && a.stage !== "In QA Review") return "tx_plan_drafting";

  // Treatment side
  if (isTx && a.stage === "In QA Review") return "tx_plan_qa";
  if (isTx && (a.stage === "Awaiting Submission" || a.stage === "Submitted")) return "tx_auth_submitted";
  if (isTx && a.stage === "Approved") return "tx_auth_approved";

  // catch-all: initial that's already in QA → treat as plan in QA
  if (a.stage === "In QA Review") return "tx_plan_qa";
  return null;
}

function detectBlocker(a: Authorization, lane: LaneId): { label: string; tone: "warn" | "danger" | "info" } | null {
  const days = daysUntil(a.expirationDate);
  if (a.missingInfo) return { label: "Missing documentation", tone: "danger" };
  if (days !== null && days >= 0 && days < 15) return { label: `Expires in ${days}d`, tone: "danger" };
  if (lane === "initial_submitted" && a.daysInStage >= 5) return { label: `Awaiting payor ${a.daysInStage}d`, tone: "warn" };
  if (lane === "initial_approved" && a.daysInStage >= 3) return { label: "Eval not scheduled", tone: "warn" };
  if (lane === "tx_plan_drafting" && a.daysInStage >= 5) return { label: `Plan drafting ${a.daysInStage}d`, tone: "warn" };
  if (lane === "tx_plan_qa" && a.daysInStage >= 3) return { label: "QA review pending", tone: "warn" };
  if (lane === "tx_auth_submitted" && a.daysInStage >= 7) return { label: `Submitted ${a.daysInStage}d ago`, tone: "warn" };
  if (a.coordinator === "Unassigned" && lane !== "tx_auth_approved") return { label: "Unassigned coordinator", tone: "info" };
  return null;
}

function toOverlay(a: Authorization, source: "monday" | "manual" | "centralreach", overlayId: string | undefined, liveBcba: string | null | undefined): EnsureOverlayInput {
  return {
    source_system: source,
    overlay_id: overlayId ?? null,
    monday_item_id: source === "monday" ? a.id : null,
    centralreach_authorization_id: source === "centralreach" ? a.id : null,
    source_id: a.id,
    client_name: a.clientName,
    state: a.state,
    payer: a.payor,
    auth_type: a.authType,
    status: a.stage,
    workflow_stage: a.stage,
    assigned_owner: a.coordinator ?? null,
    assigned_bcba: liveBcba ?? null,
    expiration_date: a.expirationDate ?? null,
  };
}

export default function OSAuthHandoff() {
  const { loading, error, items, sourceById, overlayIdByAuthId, bcbaById, refresh } = useLiveAuthorizations();
  const actions = useAuthorizationActions();
  const [stateFilter, setStateFilter] = useState<string>("all");

  const states = useMemo(() => {
    const s = new Set<string>();
    items.forEach((a) => a.state && a.state !== "—" && s.add(a.state));
    return ["all", ...Array.from(s).sort()];
  }, [items]);

  const grouped = useMemo(() => {
    const m: Record<LaneId, Authorization[]> = {
      initial_submitted: [], initial_approved: [], tx_plan_drafting: [],
      tx_plan_qa: [], tx_auth_submitted: [], tx_auth_approved: [],
    };
    items
      .filter((a) => stateFilter === "all" || a.state === stateFilter)
      .forEach((a) => {
        const lane = classifyLane(a);
        if (lane) m[lane].push(a);
      });
    return m;
  }, [items, stateFilter]);

  const total = Object.values(grouped).reduce((s, l) => s + l.length, 0);
  const blocked = Object.entries(grouped).reduce(
    (s, [lane, arr]) => s + arr.filter((a) => detectBlocker(a, lane as LaneId)?.tone === "danger").length,
    0,
  );

  const advance = async (a: Authorization, lane: Lane) => {
    if (!lane.advanceTo) return;
    const src = sourceById.get(a.id) ?? "monday";
    const overlayId = overlayIdByAuthId.get(a.id);
    const liveBcba = bcbaById.get(a.id);
    await actions.bulkChangeStatus([toOverlay(a, src, overlayId, liveBcba)], lane.advanceTo);
    await refresh();
  };

  return (
    <OSShell>
      <div className="p-6 space-y-6">
        {/* header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/authorizations" className="hover:text-foreground">Authorizations</Link>
              <span>/</span>
              <span>Initial → Treatment Handoff</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Initial → Treatment Handoff</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Move clients cleanly from an approved initial authorization into an approved treatment authorization. Each
              lane shows the owner and the single thing blocking the case from advancing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {states.map((s) => <option key={s} value={s}>{s === "all" ? "All states" : s}</option>)}
            </select>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/authorizations"><ExternalLink className="h-3.5 w-3.5" /> Full workspace</Link>
            </Button>
          </div>
        </div>

        {/* summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile label="In flight" value={total} Icon={Loader2} tone="info" />
          <Tile label="Blocked / urgent" value={blocked} Icon={AlertTriangle} tone="danger" />
          <Tile label="Initial submitted" value={grouped.initial_submitted.length + grouped.initial_approved.length} Icon={ShieldCheck} tone="info" />
          <Tile label="Treatment approved" value={grouped.tx_auth_approved.length} Icon={CheckCircle2} tone="success" />
        </div>

        {/* errors / loading */}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Couldn't load authorizations — {error}
          </div>
        )}

        {/* lanes */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {LANES.map((lane) => {
            const cards = grouped[lane.id];
            return (
              <section key={lane.id} className={cn("rounded-2xl border bg-gradient-to-b p-4 min-h-[260px] flex flex-col", lane.accent)}>
                <header className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-background/80 border border-border/60 flex items-center justify-center">
                      <lane.Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground leading-tight">{lane.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{lane.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-foreground bg-background/80 border border-border/60 rounded-full px-2 py-0.5">
                    {cards.length}
                  </span>
                </header>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                  Owner: <span className="text-foreground font-medium normal-case tracking-normal">{lane.owner}</span>
                </div>

                <div className="flex-1 space-y-2">
                  {loading && cards.length === 0 && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>
                  )}
                  {!loading && cards.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">Nothing here</p>
                  )}
                  {cards.slice(0, 8).map((a) => {
                    const blocker = detectBlocker(a, lane.id);
                    return (
                      <article
                        key={a.id}
                        className="rounded-lg bg-background border border-border/60 p-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{a.clientName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {a.state} · {a.payor} · {a.authType}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {a.daysInStage}d
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          <span className="text-foreground/80">Owner:</span> {a.coordinator || "Unassigned"}
                        </div>
                        {blocker && (
                          <div className={cn(
                            "mt-2 inline-flex items-center gap-1 text-[10px] font-medium rounded-md px-2 py-0.5 border",
                            blocker.tone === "danger" && "bg-destructive/10 text-destructive border-destructive/30",
                            blocker.tone === "warn" && "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
                            blocker.tone === "info" && "bg-muted text-muted-foreground border-border",
                          )}>
                            <FileWarning className="h-2.5 w-2.5" />
                            {blocker.label}
                          </div>
                        )}
                        {lane.advanceTo && (
                          <div className="mt-2 flex items-center justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 text-xs"
                              disabled={actions.pending}
                              onClick={() => advance(a, lane)}
                            >
                              {lane.advanceLabel ?? "Advance"} <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {cards.length > 8 && (
                    <p className="text-[11px] text-muted-foreground text-center">+{cards.length - 8} more</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </OSShell>
  );
}

function Tile({ label, value, Icon, tone }: { label: string; value: number; Icon: typeof ShieldCheck; tone: "info" | "danger" | "success" }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={cn(
          "h-4 w-4",
          tone === "info" && "text-sky-500",
          tone === "danger" && "text-destructive",
          tone === "success" && "text-emerald-500",
        )} />
      </div>
      <div className="text-2xl font-semibold tracking-tight mt-1">{value}</div>
    </div>
  );
}