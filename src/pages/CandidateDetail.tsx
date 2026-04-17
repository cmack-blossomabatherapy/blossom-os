import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, MapPin, Briefcase, FileText, Calendar, Clock,
  CheckCircle2, AlertCircle, Loader2, Circle, ExternalLink, User, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AvailabilityGrid } from "@/components/recruiting/AvailabilityGrid";
import { cn } from "@/lib/utils";
import {
  findCandidateById, onboardingProgress, stageVariant,
  type OnboardingStep, type TimelineEvent,
} from "@/data/recruiting";

const TABS = ["Recruiting", "Availability", "Onboarding", "Timeline"] as const;
type Tab = (typeof TABS)[number];

const STEP_ICON: Record<OnboardingStep["status"], typeof CheckCircle2> = {
  Complete: CheckCircle2,
  "In Progress": Loader2,
  "Not Started": Circle,
  Blocked: AlertCircle,
};
const STEP_TONE: Record<OnboardingStep["status"], string> = {
  Complete: "text-success",
  "In Progress": "text-info",
  "Not Started": "text-muted-foreground",
  Blocked: "text-destructive",
};
const TL_TONE: Record<TimelineEvent["type"], string> = {
  milestone: "bg-info",
  automation: "bg-primary",
  note: "bg-muted-foreground",
  alert: "bg-destructive",
};

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const candidate = id ? findCandidateById(id) : undefined;
  const [tab, setTab] = useState<Tab>("Recruiting");

  if (!candidate) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/recruiting")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Recruiting
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">Candidate not found.</p>
      </div>
    );
  }

  const op = onboardingProgress(candidate);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => navigate("/recruiting")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Recruiting
        </Button>

        <div className="bg-card rounded-xl border border-border/60 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold text-foreground">{candidate.name}</h1>
                  <StatusBadge status={candidate.role} variant="default" />
                  <StatusBadge status={candidate.stage} variant={stageVariant(candidate.stage)} />
                  <StatusBadge
                    status={candidate.status}
                    variant={candidate.status === "Active" ? "success" : candidate.status === "On Hold" ? "warning" : "muted"}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{candidate.email}</span>
                  <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{candidate.phone}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{candidate.city}, {candidate.state}</span>
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{candidate.appliedFor}</span>
                  <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />Recruiter: {candidate.recruiter}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {candidate.apploiId && (
                <a
                  href="#"
                  className="text-[11px] inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Apploi {candidate.apploiId}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button size="sm" className="h-8 text-xs">Advance Stage</Button>
            </div>
          </div>

          {candidate.alerts.length > 0 && (
            <div className="mt-4 space-y-1">
              {candidate.alerts.map((a) => (
                <div key={a} className="flex items-center gap-2 text-[12px] text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5" /> {a}
                </div>
              ))}
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <Stat label="Days in Stage" value={`${candidate.daysInStage}d`} tone={candidate.daysInStage > 10 ? "destructive" : "default"} />
            <Stat label="Onboarding" value={`${op.pct}%`} tone={op.pct === 100 ? "success" : "default"} />
            <Stat label="Max Hours / Week" value={`${candidate.maxWeeklyHours}h`} />
            <Stat label="Travel Radius" value={`${candidate.travelRadiusMiles} mi`} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Recruiting" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Section title="Source & Application" className="lg:col-span-1">
            <Row label="Source" value={candidate.source} />
            <Row label="Applied for" value={candidate.appliedFor} />
            <Row label="Applied" value={candidate.appliedDate} />
            <Row label="Recruiter" value={candidate.recruiter} />
            <div className="pt-2">
              <a href={candidate.resumeUrl} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                <FileText className="h-3.5 w-3.5" /> View resume
              </a>
            </div>
          </Section>

          <Section
            title="Interview Data Capture"
            badge={candidate.interview ? "Captured" : "Missing"}
            badgeTone={candidate.interview ? "success" : "destructive"}
            className="lg:col-span-2"
          >
            {!candidate.interview ? (
              <div className="text-xs text-muted-foreground italic">
                No structured interview data yet. Schedule a screening to capture travel radius, weekly availability, experience, and notes —
                this is the data Apploi loses today and the matching engine needs.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Row label="Travel willing" value={`${candidate.interview.travelRadiusMiles} mi`} />
                <Row label="Weekly availability" value={`${candidate.interview.weeklyAvailabilityHours}h`} />
                <Row label="Experience" value={`${candidate.interview.yearsExperience} yr`} />
                <Row label="Reliable transport" value={candidate.interview.hasReliableTransport ? "Yes" : "No"} />
                <Row label="Preferred shifts" value={candidate.interview.preferredShifts.join(", ")} />
                <Row label="Available start" value={candidate.interview.startDateAvailability} />
                <div className="col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1">Notes</p>
                  <p className="text-sm text-foreground bg-muted/40 rounded-md p-3">{candidate.interview.notes}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Captured by {candidate.interview.capturedBy} on {candidate.interview.capturedAt}
                  </p>
                </div>
              </div>
            )}
          </Section>

          <Section title="Credentials" className="lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {candidate.credentials.map((c) => (
                <div key={c.name} className="bg-muted/40 rounded-md p-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <StatusBadge
                      status={c.status}
                      variant={c.status === "Valid" ? "success" : c.status === "Pending" ? "warning" : c.status === "Expired" ? "destructive" : "muted"}
                    />
                    {c.expiresAt && <span className="text-[10px] text-muted-foreground">exp {c.expiresAt}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === "Availability" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Section title="Weekly Availability" className="lg:col-span-2">
            <AvailabilityGrid grid={candidate.availability} />
          </Section>
          <Section title="Matching Data">
            <Row label="Max weekly hours" value={`${candidate.maxWeeklyHours}h`} />
            <Row label="Travel radius" value={`${candidate.travelRadiusMiles} mi`} />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5 mt-2">Preferred locations</p>
              <div className="flex items-center gap-1 flex-wrap">
                {candidate.preferredLocations.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                    <Star className="h-2.5 w-2.5" />
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-border/60">
              <p className="text-[11px] text-muted-foreground">
                When this candidate reaches <strong className="text-foreground">Ready for Staffing</strong>, the matching engine uses these
                fields plus the availability grid to surface the best client matches.
              </p>
            </div>
          </Section>
        </div>
      )}

      {tab === "Onboarding" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Section title={`Onboarding Progress — ${op.done}/${op.total}`} className="lg:col-span-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className={cn("h-full rounded-full", op.pct === 100 ? "bg-success" : op.pct > 50 ? "bg-info" : "bg-warning")}
                style={{ width: `${op.pct}%` }}
              />
            </div>
            <div className="space-y-1.5">
              {candidate.onboarding.map((s) => {
                const Icon = STEP_ICON[s.status];
                return (
                  <div
                    key={s.key}
                    className={cn(
                      "flex items-center justify-between gap-2 px-3 py-2 rounded-md border",
                      s.status === "Blocked" ? "bg-destructive/5 border-destructive/30" : "bg-muted/30 border-border/40",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", STEP_TONE[s.status], s.status === "In Progress" && "animate-spin")} />
                      <div>
                        <p className="text-sm text-foreground">{s.label}</p>
                        {s.blockerReason && (
                          <p className="text-[11px] text-destructive mt-0.5">{s.blockerReason}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {s.category}
                      {s.completedAt && ` · ${s.completedAt}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Automation Pipeline">
            <div className="space-y-2 text-[12px] text-muted-foreground">
              <PipelineRow label="Offer Accepted" enabled />
              <PipelineRow label="→ Auto-send to Viventium" enabled />
              <PipelineRow label="Reminders for incomplete docs" enabled />
              <PipelineRow label="→ Background Check" enabled />
              <PipelineRow label="→ Orientation" enabled />
              <PipelineRow label="→ State-specific training" enabled />
              <PipelineRow label="→ Ready for Staffing" enabled />
            </div>
            <div className="pt-3 mt-3 border-t border-border/60">
              <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                Send onboarding reminder
              </Button>
            </div>
          </Section>
        </div>
      )}

      {tab === "Timeline" && (
        <div className="bg-card rounded-xl border border-border/60 p-5">
          <ol className="relative border-l border-border/60 ml-3 space-y-4">
            {candidate.timeline.slice().reverse().map((e, i) => (
              <li key={i} className="ml-4">
                <span className={cn("absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background", TL_TONE[e.type])} />
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {e.date}
                  {e.actor && <span>· {e.actor}</span>}
                  <span className="ml-auto text-[10px] uppercase tracking-wide">{e.type}</span>
                </div>
                <p className="text-sm text-foreground mt-0.5">{e.event}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ---- helpers ----
function Section({
  title, badge, badgeTone, className, children,
}: {
  title: string;
  badge?: string;
  badgeTone?: "success" | "destructive" | "warning" | "muted";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("bg-card rounded-xl border border-border/60 p-5 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {badge && <StatusBadge status={badge} variant={badgeTone ?? "muted"} />}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "default" | "success" | "destructive" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="bg-muted/40 rounded-md px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      <p className={cn("text-base font-semibold tabular-nums", toneClass)}>{value}</p>
    </div>
  );
}

function PipelineRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Clock className={cn("h-3 w-3", enabled ? "text-success" : "text-muted-foreground")} />
      <span>{label}</span>
    </div>
  );
}
