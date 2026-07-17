import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CardFrame } from "../CardFrame";
import { useGrowth, nextStage, PRIMARY_INTEREST_OPTIONS } from "./useGrowth";
import { Check, Clock, X, Sparkles, ArrowRight, Users, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_LABEL: Record<string, string> = {
  tenure: "Tenure", training: "Training completion", credential: "Credential standing",
  attendance: "Attendance & reliability", documentation: "Documentation",
  supervision: "Supervision participation", performance: "Performance review",
  recommendation: "Manager / BCBA recommendation", application: "Application required",
  capacity: "Program capacity",
};

function StatusPill({ status }: { status: string }) {
  const map = {
    met:     { icon: Check, cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300", label: "Complete" },
    not_met: { icon: X,     cls: "bg-muted text-muted-foreground border-border", label: "Not yet" },
    waived:  { icon: Check, cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300", label: "Waived" },
    pending: { icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300", label: "In review" },
  } as const;
  const cfg = (map as any)[status] ?? map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon className="h-3 w-3" strokeWidth={2} /> {cfg.label}
    </span>
  );
}

export default function RbtMyGrowth() {
  const { user } = useAuth();
  const g = useGrowth();
  const [savingInterest, setSavingInterest] = useState(false);
  const [mentorNotes, setMentorNotes] = useState("");
  const [oppType, setOppType] = useState("");
  const [oppMessage, setOppMessage] = useState("");

  if (g.loading) return (
    <div className="space-y-3">
      {[0,1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
    </div>
  );

  const currentStage = g.stages.find(s => s.key === g.currentStageKey) ?? null;
  const next = nextStage(g.stages, g.currentStageKey);
  const nextReqs = next ? g.requirements.filter(r => r.stage_key === next.key) : [];
  const evalMap = new Map(g.evaluations.map(e => [`${e.stage_key}::${e.requirement_key}`, e]));
  const nextEvaluated = nextReqs.map(r => ({
    req: r,
    status: evalMap.get(`${r.stage_key}::${r.requirement_key}`)?.status ?? "pending",
  }));
  const completedCount = nextEvaluated.filter(r => r.status === "met" || r.status === "waived").length;
  const missing = nextEvaluated.filter(r => r.status !== "met" && r.status !== "waived");

  const setPrimary = async (value: string) => {
    setSavingInterest(true);
    const { error } = await g.saveInterests({ primary_interest: value });
    setSavingInterest(false);
    if (error) toast.error("Could not save your interest"); else toast.success("Saved");
  };

  const toggleSecondary = async (value: string) => {
    const current = g.interests?.secondary_interests ?? [];
    const has = current.includes(value);
    const nextArr = has ? current.filter(v => v !== value) : [...current, value];
    setSavingInterest(true);
    await g.saveInterests({ secondary_interests: nextArr });
    setSavingInterest(false);
  };

  const submitMentorRequest = async () => {
    if (!user) return;
    const { error } = await supabase.from("rbt_mentor_requests" as any).insert({
      employee_id: user.id, message: mentorNotes, status: "submitted",
    } as any);
    if (error) { toast.error("Could not submit request"); return; }
    await g.saveInterests({ mentor_requested: true, mentor_request_notes: mentorNotes });
    await supabase.from("rbt_growth_audit" as any).insert({
      employee_id: user.id, actor_id: user.id, event_type: "mentor.requested",
      payload: { notes: mentorNotes },
    } as any);
    setMentorNotes("");
    toast.success("Mentor request submitted");
  };

  const submitOpportunityInterest = async () => {
    if (!user || !oppType) return;
    const { error } = await supabase.from("rbt_internal_opportunity_interest" as any).insert({
      employee_id: user.id, opportunity_type: oppType, message: oppMessage, status: "submitted",
    } as any);
    if (error) { toast.error("Could not submit"); return; }
    await g.saveInterests({ open_to_internal_opportunities: true });
    await supabase.from("rbt_growth_audit" as any).insert({
      employee_id: user.id, actor_id: user.id, event_type: "opportunity_interest.submitted",
      payload: { opportunity_type: oppType, message: oppMessage },
    } as any);
    setOppType(""); setOppMessage("");
    toast.success("Interest recorded");
  };

  return (
    <div className="space-y-3">
      {/* Current stage */}
      <CardFrame title="Your growth" subtitle="Career stage, next steps, and opportunities" state="success">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Current stage</p>
          <p className="text-lg font-semibold tracking-tight">{currentStage?.name ?? "New RBT"}</p>
          {currentStage?.employee_summary && (
            <p className="text-sm text-muted-foreground">{currentStage.employee_summary}</p>
          )}
          <p className="text-xs text-muted-foreground pt-2">
            Growth here is an exploration — nothing on this page is a promise of promotion or Fellowship acceptance.
          </p>
        </div>
      </CardFrame>

      {/* Career interests */}
      <CardFrame title="Your career interests" subtitle="Update anytime. HR uses this to recommend content and opportunities." state="success">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Primary interest</p>
            <div className="grid gap-2">
              {PRIMARY_INTEREST_OPTIONS.map(opt => {
                const active = g.interests?.primary_interest === opt.value;
                return (
                  <button key={opt.value}
                    disabled={savingInterest}
                    onClick={() => setPrimary(opt.value)}
                    className={`text-left px-3 py-2 rounded-xl border text-sm min-h-11 transition ${
                      active ? "border-primary bg-primary/5 text-foreground" : "border-border/70 hover:bg-muted/50"
                    }`}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Also interested in</p>
            <div className="flex flex-wrap gap-1.5">
              {PRIMARY_INTEREST_OPTIONS.filter(o => o.value !== g.interests?.primary_interest && o.value !== "not_sure").map(opt => {
                const active = (g.interests?.secondary_interests ?? []).includes(opt.value);
                return (
                  <button key={opt.value}
                    onClick={() => toggleSecondary(opt.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      active ? "border-primary bg-primary/5" : "border-border/70 hover:bg-muted/50"
                    }`}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardFrame>

      {/* Next stage requirements */}
      {next ? (
        <CardFrame title={`Next stage: ${next.name}`}
          subtitle={`${completedCount} of ${nextReqs.length} requirements complete`}
          state="success">
          {nextReqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Requirements for this stage haven't been configured yet.</p>
          ) : (
            <ul className="space-y-2">
              {nextEvaluated.map(({ req, status }) => (
                <li key={req.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{req.label}</p>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-0.5">
                      {CATEGORY_LABEL[req.category] ?? req.category}
                    </p>
                    {req.description && (
                      <p className="text-xs text-muted-foreground mt-1">{req.description}</p>
                    )}
                  </div>
                  <StatusPill status={status} />
                </li>
              ))}
            </ul>
          )}
          {missing.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Missing: {missing.map(m => m.req.label).join(" · ")}
            </p>
          )}
          {next.requires_application && (
            <p className="text-xs text-muted-foreground mt-2">
              This stage requires a formal application, review, and approval — meeting requirements does not guarantee advancement.
            </p>
          )}
        </CardFrame>
      ) : (
        <CardFrame title="Career path" state="empty" emptyLabel="You are at the top of the current career ladder." />
      )}

      {/* Recommended learning */}
      <CardFrame title="Recommended learning" subtitle="Based on your interests" state="success">
        <div className="space-y-2">
          <Link to="/rbt/app/program" className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:bg-muted/50 transition min-h-11">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-sm font-medium">My program roadmap</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/rbt/app/passport" className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:bg-muted/50 transition min-h-11">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-sm font-medium">Skill passport</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </CardFrame>

      {/* Mentor request */}
      <CardFrame title="Request a mentor" subtitle="Pair with a Lead or senior RBT" state="success">
        {g.interests?.mentor_requested ? (
          <p className="text-sm text-muted-foreground">Your mentor request is on file. Your training team will follow up.</p>
        ) : (
          <div className="space-y-2">
            <textarea value={mentorNotes} onChange={e => setMentorNotes(e.target.value)}
              placeholder="What would you like help with? (optional)"
              className="w-full text-sm p-3 rounded-xl bg-muted/40 border border-border/70 min-h-20" />
            <button onClick={submitMentorRequest}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
              Request a mentor
            </button>
          </div>
        )}
      </CardFrame>

      {/* Internal opportunity interest */}
      <CardFrame title="Internal opportunity interest"
        subtitle="Let HR know you're open to other roles inside Blossom" state="success">
        <div className="space-y-2">
          <select value={oppType} onChange={e => setOppType(e.target.value)}
            className="w-full h-11 rounded-xl bg-muted/40 border border-border/70 px-3 text-sm">
            <option value="">Select an area…</option>
            <option value="scheduling">Scheduling / staffing</option>
            <option value="intake">Intake</option>
            <option value="training">Training</option>
            <option value="qa">QA / compliance</option>
            <option value="operations">Operations</option>
            <option value="other">Something else</option>
          </select>
          <textarea value={oppMessage} onChange={e => setOppMessage(e.target.value)}
            placeholder="Anything HR should know (optional)"
            className="w-full text-sm p-3 rounded-xl bg-muted/40 border border-border/70 min-h-16" />
          <button onClick={submitOpportunityInterest} disabled={!oppType}
            className="w-full h-11 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border/70 hover:bg-muted transition disabled:opacity-50">
            Share my interest
          </button>
        </div>
      </CardFrame>

      {/* Fellowship Explorer entry */}
      <CardFrame title="BCBA Fellowship" subtitle="Learn what's known so far" state="success">
        {g.fellowshipParticipant && (
          <p className="text-sm mb-2">
            You are tracked as <strong>{g.fellowshipParticipant?.rbt_fellowship_stages?.name}</strong> in the Fellowship pipeline.
          </p>
        )}
        <p className="text-xs text-muted-foreground mb-3">
          Program details are still being finalized. Only administrator-published sections are shown.
        </p>
        <Link to="/rbt/app/growth/fellowship"
          className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-border/70 hover:bg-muted/50 transition text-sm">
          Open Fellowship Explorer <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFrame>

      {/* Development plan */}
      <CardFrame title="Development plan" state={g.devPlan ? "success" : "empty"}
        emptyLabel="No active development plan yet. Your manager or BCBA can build one with you.">
        {g.devPlan && (
          <div className="space-y-2">
            {g.devPlan.summary && <p className="text-sm">{g.devPlan.summary}</p>}
            {Array.isArray(g.devPlan.focus_areas) && g.devPlan.focus_areas.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Focus areas</p>
                <ul className="mt-1 space-y-1">
                  {g.devPlan.focus_areas.map((f: any, i: number) => (
                    <li key={i} className="text-sm">• {typeof f === "string" ? f : f.label ?? JSON.stringify(f)}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(g.devPlan.next_steps) && g.devPlan.next_steps.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Next steps</p>
                <ul className="mt-1 space-y-1">
                  {g.devPlan.next_steps.map((f: any, i: number) => (
                    <li key={i} className="text-sm">• {typeof f === "string" ? f : f.label ?? JSON.stringify(f)}</li>
                  ))}
                </ul>
              </div>
            )}
            {g.devPlan.last_reviewed_at && (
              <p className="text-xs text-muted-foreground">
                Last reviewed {new Date(g.devPlan.last_reviewed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardFrame>
    </div>
  );
}