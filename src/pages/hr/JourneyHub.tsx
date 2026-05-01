import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, ShieldAlert, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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

import { HeroBanner } from "@/components/journey/HeroBanner";
import { LifecycleTracker } from "@/components/journey/LifecycleTracker";
import { CurrentStagePanel } from "@/components/journey/CurrentStagePanel";
import { TrainingModulesGrid } from "@/components/journey/TrainingModulesGrid";
import { MatchingPanel } from "@/components/journey/MatchingPanel";
import { ResourceGrid } from "@/components/journey/ResourceGrid";
import { NotificationsPanel } from "@/components/journey/NotificationsPanel";
import { ProgressSummary } from "@/components/journey/ProgressSummary";

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

  const { data, key } = useMemo(
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
  const resources = adminResources.length ? adminResources : data.resources;

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

  const markStepComplete = (stepId: string) => {
    updateProgress({ ...progress, steps: { ...progress.steps, [stepId]: true } });
  };

  const toggleModule = (id: string) => {
    const next = !progress.modules[id];
    updateProgress({ ...progress, modules: { ...progress.modules, [id]: next } });
  };

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading your journey…</div>;
  }

  if (!eligible) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Training Hub is for RBTs and BCBAs</h2>
          <p className="text-sm text-muted-foreground mt-2">
            This experience guides RBTs and BCBAs through their lifecycle at Blossom. If you should have access, ask your HR admin to update your job title.
          </p>
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
    <div className="space-y-6 animate-fade-in">
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

      <HeroBanner
        viewerName={data.viewerName}
        roleLabel={data.roleLabel}
        currentStageLabel={currentStep.label}
        percent={percent}
        nextStepLabel={currentStep.shortLabel}
        onNextStep={() => openStepSheet(effectiveCurrentIndex)}
      />

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
          />
        </div>
        <NotificationsPanel items={data.notifications} />
      </div>

      <TrainingModulesGrid
        modules={data.modules}
        completed={progress.modules}
        onToggle={toggleModule}
      />

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
        onMarkComplete={(stepId) => { markStepComplete(stepId); setSheetOpen(false); }}
      />
    </div>
  );
}

function StepDetailSheet({
  open, onOpenChange, data, index, statuses, onMarkComplete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: JourneyData;
  index: number;
  statuses: ReturnType<typeof computeStepStatuses>["statuses"];
  onMarkComplete: (stepId: string) => void;
}) {
  const step = data.steps[index];
  if (!step) return null;
  const status = statuses[index];
  const Icon = step.icon;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Step {index + 1} of {data.steps.length}</p>
              <SheetTitle>{step.label}</SheetTitle>
            </div>
          </div>
          <SheetDescription>{step.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Owner</p>
            <p className="text-sm font-medium text-foreground mt-1">{step.ownerName}</p>
            <p className="text-[11px] text-muted-foreground">{step.ownerRole}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Required actions</p>
            <ul className="space-y-1.5">
              {step.checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {status !== "completed" ? (
            <Button className="w-full rounded-xl" onClick={() => onMarkComplete(step.id)}>
              Mark this step complete
            </Button>
          ) : (
            <div className="text-center text-xs text-primary font-medium py-2">✓ This step is complete</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
