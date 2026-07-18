import { useMemo, useState } from "react";
import {
  CheckCircle2, Circle, AlertTriangle, ExternalLink, Loader2,
  ShieldCheck, ChevronRight, FileText, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useBcbaOnboarding, OnboardingItem, BcbaOnbStatus } from "./useBcbaOnboarding";

/* -------------------------------------------------------------------------- */

const OWNER_LABEL: Record<string, string> = {
  bcba: "You",
  credentialing: "Credentialing",
  hr: "HR",
  clinical_leadership: "Clinical Leadership",
  training: "Training",
  systems: "Systems",
  state_leadership: "State Leadership",
  super_admin: "Super Admin",
};

function statusPill(s: BcbaOnbStatus) {
  const map: Record<BcbaOnbStatus, { label: string; cls: string }> = {
    not_started:      { label: "Not started",      cls: "bg-muted text-muted-foreground" },
    in_progress:      { label: "In progress",      cls: "bg-primary/10 text-primary" },
    waiting_on_bcba:  { label: "Waiting on you",   cls: "bg-amber-500/10 text-amber-600" },
    waiting_on_owner: { label: "Waiting on team",  cls: "bg-amber-500/10 text-amber-600" },
    submitted:        { label: "Submitted",        cls: "bg-primary/10 text-primary" },
    approved:         { label: "Approved",         cls: "bg-emerald-500/10 text-emerald-600" },
    completed:        { label: "Complete",         cls: "bg-emerald-500/10 text-emerald-600" },
    blocked:          { label: "Blocked",          cls: "bg-destructive/10 text-destructive" },
    skipped:          { label: "Skipped",          cls: "bg-muted text-muted-foreground" },
  };
  const m = map[s] ?? map.not_started;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

/* -------------------------------------------------------------------------- */

function ItemRow({
  item, onToggle, canEdit,
}: {
  item: OnboardingItem;
  onToggle: (next: BcbaOnbStatus) => Promise<void>;
  canEdit: boolean;
}) {
  const t = item.template!;
  const [busy, setBusy] = useState(false);
  const done = item.status === "completed" || item.status === "approved";

  const primaryLabel =
    t.evidence_type === "approval"       ? (done ? "Approved" : "Awaiting approval") :
    t.evidence_type === "external_link"  ? "Open link"        :
    t.evidence_type === "file_upload"    ? (done ? "Uploaded" : "Mark uploaded") :
                                           (done ? "Done" : "Mark complete");

  const handlePrimary = async () => {
    if (!canEdit || busy) return;
    if (t.evidence_type === "external_link" && t.external_link_hint) {
      window.open(t.external_link_hint, "_blank", "noopener,noreferrer");
    }
    if (t.evidence_type === "approval") return; // owners approve, BCBA can't
    setBusy(true);
    await onToggle(done ? "in_progress" : "completed");
    setBusy(false);
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {done
            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
            : <Circle className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-medium text-foreground">{t.title}</h3>
            {t.is_completion_gate && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <ShieldCheck className="h-3 w-3" strokeWidth={1.75} /> Gate
              </Badge>
            )}
            {t.required && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Required</span>}
          </div>
          {t.employee_instructions && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {t.employee_instructions}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            {statusPill(item.status)}
            <span>Owner · {OWNER_LABEL[t.owner_role] ?? t.owner_role}</span>
            {item.due_date && <span>Due · {new Date(item.due_date).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="shrink-0">
          <Button
            size="sm"
            variant={done ? "secondary" : "default"}
            disabled={busy || !canEdit || t.evidence_type === "approval"}
            onClick={handlePrimary}
            className="rounded-xl"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {t.evidence_type === "external_link"
              ? (<>{primaryLabel} <ExternalLink className="h-3.5 w-3.5 ml-1.5" /></>)
              : primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function BcbaOnboardingPage({
  bcbaUserId, canEdit = true,
}: { bcbaUserId?: string; canEdit?: boolean }) {
  const { grouped, gates, progress, loading, error, items, start, updateStatus } =
    useBcbaOnboarding(bcbaUserId);

  const notStarted = !loading && !error && items.length === 0;

  const stageBadge = useMemo(() => {
    if (!items.length) return null;
    const open = items.find(i => i.status !== "completed" && i.status !== "approved");
    return open?.template?.lifecycle_stage.replace(/_/g, " ") ?? "complete";
  }, [items]);

  return (
    <div className="mx-auto w-full max-w-4xl px-2 md:px-4 py-2 md:py-8">
      <header className="mb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Your onboarding</h1>
          {stageBadge && (
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {stageBadge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          One place for every step — from welcome to your first caseload.
        </p>
      </header>

      {loading && (
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
          {error}
        </div>
      )}

      {notStarted && (
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
          <FileText className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="mt-3 text-lg font-medium">Ready to begin?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll open your personalized onboarding checklist.
          </p>
          <Button className="mt-4 rounded-xl" onClick={start}>
            Start onboarding <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          {/* Progress + gates */}
          <div className="mb-6 rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Progress</p>
                <p className="mt-0.5 text-2xl font-semibold">{progress}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Caseload activation</p>
                <p className="mt-0.5 text-sm text-foreground">
                  {gates.cleared}/{gates.total} gates cleared
                </p>
              </div>
            </div>
            <Progress value={progress} className="mt-3 h-1.5" />
            {gates.blocked.length > 0 && (
              <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <p className="text-amber-700 font-medium">Caseload assignment is on hold</p>
                    <p className="text-amber-700/80 text-xs mt-0.5">
                      Remaining: {gates.blocked.join(" · ")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {grouped.map(([section, list]) => (
              <section key={section}>
                <div className="mb-3 flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <h2 className="text-sm font-medium tracking-tight text-foreground">{section}</h2>
                  <span className="text-xs text-muted-foreground">
                    · {list.filter(i => i.status === "completed" || i.status === "approved").length}/{list.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {list.map(it => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      canEdit={canEdit}
                      onToggle={(next) => updateStatus(it.id, next).then(() => undefined)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}