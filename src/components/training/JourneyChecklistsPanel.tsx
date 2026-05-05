import { useEffect, useMemo, useState } from "react";
import {
  ListChecks, Plus, Save, Trash2, RotateCcw, History, GripVertical,
  CheckCircle2, X, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { JourneyStep } from "@/data/journey";
import {
  getDefaultStepsForAudience,
  getStoredChecklistOverrides,
  publishChecklistVersion,
  resetChecklistToDefault,
  resolveChecklist,
  setActiveChecklistVersion,
  JOURNEY_CHECKLIST_OVERRIDES_EVENT,
  type JourneyAudienceKey,
  type JourneyChecklistOverride,
} from "@/data/journeyChecklistOverrides";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  canManage: boolean;
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
}

export function JourneyChecklistsPanel({ canManage }: Props) {
  const { user } = useAuth();
  const [audience, setAudience] = useState<JourneyAudienceKey>("rbt");
  const [steps, setSteps] = useState<JourneyStep[]>(() => getDefaultStepsForAudience("rbt"));
  const [overrides, setOverrides] = useState<JourneyChecklistOverride[]>(() => getStoredChecklistOverrides());
  const [editing, setEditing] = useState<JourneyStep | null>(null);
  const [historyStep, setHistoryStep] = useState<JourneyStep | null>(null);

  useEffect(() => {
    setSteps(getDefaultStepsForAudience(audience));
  }, [audience]);

  useEffect(() => {
    const refresh = () => setOverrides(getStoredChecklistOverrides());
    refresh();
    window.addEventListener(JOURNEY_CHECKLIST_OVERRIDES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_CHECKLIST_OVERRIDES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const overrideMap = useMemo(() => {
    const m = new Map<string, JourneyChecklistOverride>();
    overrides.filter((o) => o.audience === audience).forEach((o) => m.set(o.stepId, o));
    return m;
  }, [overrides, audience]);

  const handleResetStep = (step: JourneyStep) => {
    if (!canManage) return;
    resetChecklistToDefault(audience, step.id);
    toast.success(`"${step.label}" checklist reset to defaults`);
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Journey Checklist Templates</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit the checklist items learners see for each journey step. Every save creates a new version
            so you can roll back at any time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            status={`${overrides.filter((o) => o.audience === audience).length} customized`}
            variant="default"
          />
          <Tabs value={audience} onValueChange={(v) => setAudience(v as JourneyAudienceKey)}>
            <TabsList>
              <TabsTrigger value="rbt">RBT</TabsTrigger>
              <TabsTrigger value="bcba">BCBA</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => {
          const o = overrideMap.get(step.id);
          const resolved = resolveChecklist(audience, step);
          const itemCount = resolved.items.length;
          const Icon = step.icon;
          return (
            <div key={step.id} className="rounded-xl border border-border/60 bg-background p-3 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{step.label}</p>
                    <p className="text-[11px] text-muted-foreground">{itemCount} item{itemCount === 1 ? "" : "s"}</p>
                  </div>
                </div>
                {o ? (
                  <StatusBadge status={`v${o.activeVersion}`} variant="info" />
                ) : (
                  <StatusBadge status="default" variant="muted" />
                )}
              </div>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {resolved.items.slice(0, 4).map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 text-primary/60 shrink-0" />
                    <span className="line-clamp-2">{item}</span>
                  </li>
                ))}
                {resolved.items.length > 4 && (
                  <li className="pl-4 text-[11px]">+{resolved.items.length - 4} more</li>
                )}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setEditing(step)} disabled={!canManage}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setHistoryStep(step)}
                  disabled={!o}
                  title={o ? "View version history" : "No history yet"}
                >
                  <History className="mr-1 h-3.5 w-3.5" /> History
                </Button>
                {o && (
                  <Button size="sm" variant="ghost" onClick={() => handleResetStep(step)} disabled={!canManage}>
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ChecklistEditorDialog
        step={editing}
        audience={audience}
        canManage={canManage}
        savedBy={user?.email ?? "Unknown admin"}
        onClose={() => setEditing(null)}
      />

      <ChecklistHistoryDialog
        step={historyStep}
        audience={audience}
        canManage={canManage}
        onClose={() => setHistoryStep(null)}
      />
    </section>
  );
}

/* ---------------- Editor ---------------- */

function ChecklistEditorDialog({
  step, audience, canManage, savedBy, onClose,
}: {
  step: JourneyStep | null;
  audience: JourneyAudienceKey;
  canManage: boolean;
  savedBy: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!step) return;
    const resolved = resolveChecklist(audience, step);
    setItems([...resolved.items]);
    setNote("");
  }, [step, audience]);

  if (!step) return null;
  const existingOverride = getStoredChecklistOverrides().find(
    (o) => o.audience === audience && o.stepId === step.id,
  );
  const nextVersion = existingOverride
    ? Math.max(...existingOverride.versions.map((v) => v.version)) + 1
    : 1;

  const updateItem = (i: number, value: string) =>
    setItems((arr) => arr.map((v, idx) => (idx === i ? value : v)));
  const removeItem = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const addItem = () => setItems((arr) => [...arr, ""]);

  const onDragStart = (i: number) => setDragIndex(i);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (i: number) => {
    if (dragIndex === null || dragIndex === i) return;
    setItems((arr) => {
      const copy = [...arr];
      const [moved] = copy.splice(dragIndex, 1);
      copy.splice(i, 0, moved);
      return copy;
    });
    setDragIndex(null);
  };

  const handlePublish = () => {
    if (!canManage) return;
    const cleaned = items.map((s) => s.trim()).filter(Boolean);
    if (!cleaned.length) {
      toast.error("Add at least one checklist item before publishing");
      return;
    }
    publishChecklistVersion({
      audience,
      stepId: step.id,
      items: cleaned,
      savedBy,
      note: note.trim() || undefined,
    });
    toast.success(`Published v${nextVersion} of "${step.label}"`);
    onClose();
  };

  return (
    <Dialog open={!!step} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit checklist · {step.label}</DialogTitle>
          <DialogDescription>
            Reorder, edit, add, or remove items. Saving publishes <span className="font-medium text-foreground">v{nextVersion}</span> as the active version.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            Audience: <span className="font-medium text-foreground capitalize">{audience}</span>
            {existingOverride && (
              <> · Currently active: <span className="font-medium text-foreground">v{existingOverride.activeVersion}</span></>
            )}
          </div>

          <div className="space-y-2">
            <Label>Checklist items</Label>
            <div className="space-y-2">
              {items.map((value, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-background p-2"
                  draggable={canManage}
                  onDragStart={() => onDragStart(i)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(i)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                  <span className="text-xs text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                  <Input
                    value={value}
                    onChange={(e) => updateItem(i, e.target.value)}
                    placeholder="Checklist item"
                    disabled={!canManage}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(i)}
                    disabled={!canManage}
                    aria-label="Remove item"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addItem} disabled={!canManage}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add item
            </Button>
          </div>

          <div>
            <Label htmlFor="version-note">Version note (optional)</Label>
            <Textarea
              id="version-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What changed and why?"
              className="mt-1"
              rows={2}
              disabled={!canManage}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handlePublish} disabled={!canManage}>
            <Save className="mr-1.5 h-4 w-4" /> Publish v{nextVersion}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- History ---------------- */

function ChecklistHistoryDialog({
  step, audience, canManage, onClose,
}: {
  step: JourneyStep | null;
  audience: JourneyAudienceKey;
  canManage: boolean;
  onClose: () => void;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener(JOURNEY_CHECKLIST_OVERRIDES_EVENT, refresh);
    return () => window.removeEventListener(JOURNEY_CHECKLIST_OVERRIDES_EVENT, refresh);
  }, []);

  if (!step) return null;
  const override = getStoredChecklistOverrides().find(
    (o) => o.audience === audience && o.stepId === step.id,
  );

  const handleActivate = (version: number) => {
    if (!canManage || !override) return;
    setActiveChecklistVersion(audience, step.id, version);
    toast.success(`Activated v${version} for "${step.label}"`);
  };

  return (
    <Dialog open={!!step} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version history · {step.label}</DialogTitle>
          <DialogDescription>
            Activate any prior version to make it the live checklist for {audience.toUpperCase()}s.
          </DialogDescription>
        </DialogHeader>

        {!override ? (
          <p className="text-sm text-muted-foreground">No published versions yet.</p>
        ) : (
          <div className="space-y-3">
            {override.versions
              .slice()
              .sort((a, b) => b.version - a.version)
              .map((v) => {
                const isActive = v.version === override.activeVersion;
                return (
                  <div
                    key={v.version}
                    className={`rounded-xl border p-3 ${
                      isActive ? "border-primary/60 bg-primary/5" : "border-border/60 bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={isActive ? `v${v.version} · active` : `v${v.version}`}
                          variant={isActive ? "success" : "default"}
                        />
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(v.savedAt)} · {v.savedBy}
                        </span>
                      </div>
                      {!isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActivate(v.version)}
                          disabled={!canManage}
                        >
                          <ChevronRight className="mr-1 h-3.5 w-3.5" /> Activate
                        </Button>
                      )}
                    </div>
                    {v.note && (
                      <p className="mt-2 text-xs text-muted-foreground italic">"{v.note}"</p>
                    )}
                    <ul className="mt-2 space-y-1">
                      {v.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-xs text-muted-foreground tabular-nums w-5">{i + 1}.</span>
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
