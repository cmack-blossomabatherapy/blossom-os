import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShieldAlert, Eye, Clock, User, Mail, ExternalLink, ArrowRight,
  Info, CheckCircle2, BookOpen, LifeBuoy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  resolveJourney, isJourneyEligible, loadProgress, saveProgress,
  computeStepStatuses, DEMO_OPTIONS, type DemoKey, type JourneyData,
} from "@/data/journey";
import {
  getJourneyResourcesFor, JOURNEY_RESOURCES_UPDATED_EVENT,
} from "@/data/journeyResources";
import {
  applyModuleOverrides, JOURNEY_MODULE_OVERRIDES_EVENT,
} from "@/data/journeyModuleOverrides";
import {
  applyChecklistOverrides, JOURNEY_CHECKLIST_OVERRIDES_EVENT,
} from "@/data/journeyChecklistOverrides";

import { JourneyHero } from "@/components/onboarding/JourneyHero";
import { WelcomeToBlossomCard } from "@/components/onboarding/WelcomeToBlossomCard";
import { LifecycleTracker } from "@/components/journey/LifecycleTracker";
import { CurrentStagePanel } from "@/components/journey/CurrentStagePanel";
import { TrainingModulesGrid } from "@/components/journey/TrainingModulesGrid";
import { MatchingPanel } from "@/components/journey/MatchingPanel";
import { ResourceGrid } from "@/components/journey/ResourceGrid";
import { NotificationsPanel } from "@/components/journey/NotificationsPanel";
import { ProgressSummary } from "@/components/journey/ProgressSummary";
import { FollowupCalendar } from "@/components/journey/FollowupCalendar";
import { StepAttachments } from "@/components/journey/StepAttachments";

export default function JourneyHub() {
  const { user, isAdmin, roles } = useAuth();
  const [params, setParams] = useSearchParams();
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load employee record for current user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("employees")
        .select("first_name,last_name,job_title")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setJobTitle(data.job_title ?? null);
        setDisplayName(`${data.first_name} ${data.last_name}`.trim());
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const override = params.get("as");
  const hasRoleAccess = roles?.includes("rbt") || roles?.includes("bcba");
  const eligible = isJourneyEligible(jobTitle) || hasRoleAccess || isAdmin || !!override;

  const { data: rawData, key } = useMemo(
    () => resolveJourney({ override, jobTitle, displayName }),
    [override, jobTitle, displayName],
  );

  // Admin-managed resources override the static defaults baked into the journey demo.
  const audience: "rbt" | "bcba" = roles?.includes("bcba") && !roles?.includes("rbt") ? "bcba" : "rbt";
  const [adminResources, setAdminResources] = useState(() => getJourneyResourcesFor(audience));
  useEffect(() => {
    const refresh = () => setAdminResources(getJourneyResourcesFor(audience));
    refresh();
    window.addEventListener(JOURNEY_RESOURCES_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_RESOURCES_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [audience]);
  const resources = adminResources.length ? adminResources : rawData.resources;

  // Admin-managed module overrides (links, coordinator, more info)
  const [moduleVersion, setModuleVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setModuleVersion((v) => v + 1);
    window.addEventListener(JOURNEY_MODULE_OVERRIDES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_MODULE_OVERRIDES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const modules = useMemo(
    () => applyModuleOverrides(rawData.modules, audience),
    [rawData.modules, audience, moduleVersion],
  );

  // Admin-managed checklist template overrides (with versioning)
  const [checklistVersion, setChecklistVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setChecklistVersion((v) => v + 1);
    window.addEventListener(JOURNEY_CHECKLIST_OVERRIDES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_CHECKLIST_OVERRIDES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const stepsWithChecklists = useMemo(
    () => applyChecklistOverrides(rawData.steps, audience),
    [rawData.steps, audience, checklistVersion],
  );
  const data = useMemo(
    () => ({ ...rawData, steps: stepsWithChecklists }),
    [rawData, stepsWithChecklists],
  );

  const userKey = (user?.id ?? "anon") + ":" + key;
  const [progress, setProgress] = useState(() => loadProgress(userKey));
  useEffect(() => { setProgress(loadProgress(userKey)); }, [userKey]);

  const { statuses, effectiveCurrentIndex, percent } = computeStepStatuses(data, progress);
  const [selectedIndex, setSelectedIndex] = useState(effectiveCurrentIndex);
  useEffect(() => { setSelectedIndex(effectiveCurrentIndex); }, [effectiveCurrentIndex, key]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);

  const openStepSheet = (i: number) => { setSheetIndex(i); setSheetOpen(true); };

  const updateProgress = (next: typeof progress) => {
    setProgress(next);
    saveProgress(userKey, next);
  };

  const isStepChecklistComplete = (stepId: string) => {
    const step = data.steps.find((s) => s.id === stepId);
    if (!step) return true;
    const total = step.checklist.length;
    if (total === 0) return true;
    const items = progress.checklistItems?.[stepId] ?? {};
    return step.checklist.every((_, i) => !!items[i]);
  };

  const markStepComplete = (stepId: string): boolean => {
    if (!isStepChecklistComplete(stepId)) {
      const step = data.steps.find((s) => s.id === stepId);
      const total = step?.checklist.length ?? 0;
      const done = step ? step.checklist.reduce(
        (acc, _, i) => acc + ((progress.checklistItems?.[stepId]?.[i]) ? 1 : 0),
        0,
      ) : 0;
      toast.error(`Finish all checklist items first (${done}/${total} done)`);
      return false;
    }
    updateProgress({ ...progress, steps: { ...progress.steps, [stepId]: true } });
    return true;
  };

  const toggleModule = (id: string) => {
    const next = !progress.modules[id];
    updateProgress({ ...progress, modules: { ...progress.modules, [id]: next } });
  };

  const toggleChecklistItem = (stepId: string, idx: number) => {
    const stepItems = progress.checklistItems?.[stepId] ?? {};
    const next = !stepItems[idx];
    updateProgress({
      ...progress,
      checklistItems: {
        ...(progress.checklistItems ?? {}),
        [stepId]: { ...stepItems, [idx]: next },
      },
    });
  };

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading your journey…</div>;
  }

  if (!eligible) {
    return (
      // Even non-RBT/BCBA users get the universal Welcome to Blossom phase.
      <div className="aurora-bg -mx-4 -my-4 px-4 py-4 md:-mx-6 md:-my-6 md:px-6 md:py-6 min-h-full">
        <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
          <JourneyHero
            title={`Welcome to Blossom${displayName ? `, ${displayName.split(" ")[0]}` : ""}`}
            description="The full Training Hub is tailored to RBTs and BCBAs. In the meantime, every Blossom teammate starts here — meet the team, learn our mission, and watch the welcome video."
            ctaLabel="Open Welcome to Blossom"
            ctaTo="/training/welcome"
          />
          <WelcomeToBlossomCard />
          <div className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground shadow-sm flex items-start gap-3">
            <ShieldAlert className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p>
              The week-by-week training experience below this point is reserved for RBTs and BCBAs. If you should have access, ask your HR admin to update your job title.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = data.steps[effectiveCurrentIndex];
  const currentStatus = statuses[effectiveCurrentIndex];

  // Compute remaining minutes from non-completed steps
  const remainingMinutes = data.steps.reduce(
    (acc, s, i) => acc + (statuses[i] === "completed" ? 0 : s.estMinutes),
    0,
  );
  const completedCount = statuses.filter((s) => s === "completed").length;

  // Show matching panel at "ready" or later
  const showMatching = !!data.matching && (
    data.matching.assignedCaseManager
      ? true
      : data.steps[effectiveCurrentIndex]?.id === "ready" || effectiveCurrentIndex >= data.steps.findIndex((s) => s.id === "ready")
  );
  const matchingVariant: "ready" | "assigned" = data.matching?.assignedCaseManager ? "assigned" : "ready";

  return (
    <div className="aurora-bg -mx-4 -my-4 px-4 py-4 md:-mx-6 md:-my-6 md:px-6 md:py-6 min-h-full">
      <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      {isAdmin && (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">Admin preview</span>
            <span className="text-muted-foreground">— viewing as {data.viewerName}</span>
          </div>
          <Select
            value={override ?? "__self__"}
            onValueChange={(v) => {
              const next = new URLSearchParams(params);
              if (v && v !== "__self__") next.set("as", v); else next.delete("as");
              setParams(next, { replace: true });
            }}
          >
            <SelectTrigger className="h-8 w-[260px] text-xs"><SelectValue placeholder="Use my real role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__self__">Use my real role</SelectItem>
              {DEMO_OPTIONS.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <JourneyHero
        eyebrow={`${data.roleLabel} · Training Hub`}
        title={`Welcome to Blossom, ${data.viewerName.split(" ")[0]}`}
        description={`You're in ${currentStep.label}. Keep going — the next step is ${currentStep.shortLabel}.`}
        progressPercent={percent}
        progressLabel={`${completedCount} of ${data.steps.length} steps complete`}
        ctaLabel={`Continue: ${currentStep.shortLabel}`}
        ctaOnClick={() => openStepSheet(effectiveCurrentIndex)}
      />

      <WelcomeToBlossomCard />

      <LifecycleTracker
        steps={data.steps}
        statuses={statuses}
        onSelect={openStepSheet}
        selectedIndex={selectedIndex}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CurrentStagePanel
            step={currentStep}
            status={currentStatus}
            onMarkComplete={() => markStepComplete(currentStep.id)}
            canComplete={isStepChecklistComplete(currentStep.id)}
            checkedItems={progress.checklistItems?.[currentStep.id] ?? {}}
            onToggleChecklistItem={(idx) => toggleChecklistItem(currentStep.id, idx)}
            checklistProgress={{
              total: currentStep.checklist.length,
              done: currentStep.checklist.reduce(
                (acc, _, i) => acc + ((progress.checklistItems?.[currentStep.id]?.[i]) ? 1 : 0),
                0,
              ),
            }}
          />
        </div>
        <NotificationsPanel items={data.notifications} />
      </div>

      <TrainingModulesGrid
        modules={modules}
        completed={progress.modules}
        onToggle={toggleModule}
      />

      {user && (
        <FollowupCalendar
          userId={user.id}
          audience={audience}
          modules={modules}
        />
      )}

      {showMatching && data.matching && (
        <MatchingPanel matching={data.matching} variant={matchingVariant} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ResourceGrid resources={resources} />
        </div>
        <ProgressSummary
          percent={percent}
          completed={completedCount}
          total={data.steps.length}
          remainingMinutes={remainingMinutes}
        />
      </div>

      <StepDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        data={data}
        index={sheetIndex}
        statuses={statuses}
        modules={modules}
        resources={resources}
        journeyKey={key}
        ownerUserId={user?.id ?? ""}
        currentUserId={user?.id ?? ""}
        currentUserName={displayName}
        isAdmin={!!isAdmin}
        checklistProgress={progress.checklistItems ?? {}}
        onToggleChecklistItem={toggleChecklistItem}
        onMarkComplete={(stepId) => { if (markStepComplete(stepId)) setSheetOpen(false); }}
      />
      </div>
    </div>
  );
}

function StepDetailSheet({
  open, onOpenChange, data, index, statuses, modules, resources,
  journeyKey, ownerUserId, currentUserId, currentUserName, isAdmin,
  checklistProgress, onToggleChecklistItem,
  onMarkComplete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: JourneyData;
  index: number;
  statuses: ReturnType<typeof computeStepStatuses>["statuses"];
  modules: ReturnType<typeof applyModuleOverrides>;
  resources: typeof data.resources;
  journeyKey: string;
  ownerUserId: string;
  currentUserId: string;
  currentUserName?: string | null;
  isAdmin?: boolean;
  checklistProgress: Record<string, Record<number, boolean>>;
  onToggleChecklistItem: (stepId: string, idx: number) => void;
  onMarkComplete: (stepId: string) => void;
}) {
  const step = data.steps[index];
  if (!step) return null;
  const status = statuses[index];
  const Icon = step.icon;
  const isComplete = status === "completed";
  const relatedModules = modules.filter((m) => m.stepId === step.id);
  const relatedResources = resources.slice(0, 4);
  const estLabel = step.estMinutes
    ? step.estMinutes < 60
      ? `${step.estMinutes} min`
      : `${Math.round(step.estMinutes / 60)} hr`
    : "Ongoing";
  const stepChecks = checklistProgress[step.id] ?? {};
  const total = step.checklist.length;
  const checkedCount = isComplete
    ? total
    : step.checklist.reduce((acc, _, i) => acc + (stepChecks[i] ? 1 : 0), 0);
  const checkPercent = total ? Math.round((checkedCount / total) * 100) : 0;
  const allChecked = total > 0 && checkedCount === total;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${isComplete ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Step {index + 1} of {data.steps.length}</p>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isComplete ? "bg-primary/10 text-primary border-primary/30"
                  : status === "in_progress" ? "bg-warning/10 text-warning border-warning/30"
                  : status === "available" ? "bg-info/10 text-info border-info/30"
                  : "bg-muted text-muted-foreground border-border"
                }`}>
                  {isComplete ? "Complete" : status === "in_progress" ? "In progress" : status === "available" ? "Available" : "Locked"}
                </span>
              </div>
              <SheetTitle className="mt-0.5">{step.label}</SheetTitle>
            </div>
          </div>
          <SheetDescription>{step.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Owner + estimated time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Owner</p>
              <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> {step.ownerName}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{step.ownerRole}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Estimated time</p>
              <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {estLabel}
              </p>
            </div>
          </div>

          {/* More information */}
          {step.moreInfo && (
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" /> More information
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{step.moreInfo}</p>
            </div>
          )}

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-foreground">Completion checklist</p>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {checkedCount}/{total} done
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${checkPercent}%` }}
              />
            </div>
            <ul className="space-y-1">
              {step.checklist.map((item, i) => {
                const checked = isComplete || !!stepChecks[i];
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => !isComplete && onToggleChecklistItem(step.id, i)}
                      disabled={isComplete}
                      className={`w-full flex items-start gap-2.5 text-sm text-left rounded-lg px-2 py-1.5 transition-colors ${
                        isComplete ? "cursor-default" : "hover:bg-muted/40"
                      }`}
                    >
                      <div
                        className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {checked && <CheckCircle2 className="h-3 w-3" />}
                      </div>
                      <span className={checked ? "text-muted-foreground line-through" : "text-foreground"}>
                        {item}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!isComplete && allChecked && (
              <p className="mt-2 text-[11px] text-primary font-medium">
                All items checked — you can mark this step complete below.
              </p>
            )}
          </div>

          {/* Helpful links */}
          {step.links && step.links.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Helpful links</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {step.links.map((link) => {
                  const internal = link.url.startsWith("/");
                  const inner = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{link.label}</p>
                        {internal
                          ? <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                          : <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />}
                      </div>
                      {link.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{link.description}</p>}
                    </>
                  );
                  const cls = "group rounded-lg border border-border/40 p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors block";
                  return internal
                    ? <Link key={link.url} to={link.url} className={cls} onClick={() => onOpenChange(false)}>{inner}</Link>
                    : <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className={cls}>{inner}</a>;
                })}
              </div>
            </div>
          )}

          {/* Coordinator */}
          {(step.coordinatorEmail || step.coordinatorName) && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">Training coordinator</p>
                <p className="text-sm font-medium text-foreground mt-1 truncate">
                  {step.coordinatorName ?? step.ownerName}
                  {step.coordinatorRole && <span className="text-muted-foreground"> · {step.coordinatorRole}</span>}
                </p>
                {step.coordinatorEmail && <p className="text-xs text-muted-foreground truncate">{step.coordinatorEmail}</p>}
              </div>
              {step.coordinatorEmail && (
                <Button asChild variant="outline" size="sm" className="rounded-lg shrink-0">
                  <a href={`mailto:${step.coordinatorEmail}?subject=${encodeURIComponent(`Question about: ${step.label}`)}`}>
                    <Mail className="h-3.5 w-3.5" /> Email coordinator
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Related training modules */}
          {relatedModules.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Related training modules
              </p>
              <div className="space-y-2">
                {relatedModules.map((m) => (
                  <div key={m.id} className="rounded-lg border border-border/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{m.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.description}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border whitespace-nowrap">
                        {m.estMinutes} min
                      </span>
                    </div>
                    {m.coordinatorEmail && (
                      <a
                        href={`mailto:${m.coordinatorEmail}?subject=${encodeURIComponent(`Question about: ${m.title}`)}`}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3" /> {m.coordinatorName ?? m.coordinatorEmail}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {ownerUserId && (
            <StepAttachments
              ownerUserId={ownerUserId}
              journeyKey={journeyKey}
              stepId={step.id}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isAdmin={isAdmin}
            />
          )}

          {/* Quick resources */}
          {relatedResources.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <LifeBuoy className="h-3.5 w-3.5 text-primary" /> Quick resources
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {relatedResources.map((r) => {
                  const ResourceIcon = r.icon;
                  const inner = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <ResourceIcon className="h-3.5 w-3.5" />
                        </div>
                        {r.internalRoute
                          ? <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{r.category}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5 line-clamp-1">{r.title}</p>
                    </>
                  );
                  const cls = "rounded-lg border border-border/40 p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors block";
                  return r.internalRoute
                    ? <Link key={r.id} to={r.internalRoute} className={cls} onClick={() => onOpenChange(false)}>{inner}</Link>
                    : <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className={cls}>{inner}</a>;
                })}
              </div>
            </div>
          )}

          {!isComplete ? (
            <div className="space-y-1.5">
              <Button
                className="w-full rounded-xl"
                onClick={() => onMarkComplete(step.id)}
                disabled={total > 0 && !allChecked}
              >
                <CheckCircle2 className="h-4 w-4" /> Mark this step complete
              </Button>
              {total > 0 && !allChecked && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Check all {total} items to enable ({checkedCount}/{total} done).
                </p>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-primary font-medium py-2">✓ This step is complete</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
