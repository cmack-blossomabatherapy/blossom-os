import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw, Save, ThumbsUp, ThumbsDown, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchFeedbackWeights,
  saveFeedbackWeights,
  DEFAULT_FEEDBACK_WEIGHTS,
  type SopFeedbackWeights,
} from "@/lib/sop/feedback";

type WeightField = Exclude<keyof SopFeedbackWeights, "hide_on_not_relevant">;

interface RowDef {
  key: WeightField;
  scope: string;
  helper: string;
  /** Range for the slider — up votes boost above 1, down votes dampen below 1. */
  min: number;
  max: number;
  step: number;
}

const UP_ROWS: RowDef[] = [
  { key: "up_same_query_same_filters", scope: "Same query · same filters", helper: "Strongest helpful signal — the user voted on this exact search.", min: 1, max: 3, step: 0.05 },
  { key: "up_same_query",              scope: "Same query · any filters",  helper: "Voted helpful for the same wording in a different filter scope.", min: 1, max: 3, step: 0.05 },
  { key: "up_same_filters",            scope: "Other query · same filters", helper: "Voted helpful in this filter scope but for a different question.", min: 1, max: 3, step: 0.05 },
  { key: "up_other",                   scope: "Other query · other filters", helper: "Generic positive signal across all uses.", min: 1, max: 3, step: 0.05 },
];

const DOWN_ROWS: RowDef[] = [
  { key: "down_same_query_same_filters", scope: "Same query · same filters", helper: "Strongest demotion — the user voted not helpful for this exact search.", min: 0.05, max: 1, step: 0.05 },
  { key: "down_same_query",              scope: "Same query · any filters",  helper: "Voted not helpful for the same wording elsewhere.", min: 0.05, max: 1, step: 0.05 },
  { key: "down_same_filters",            scope: "Other query · same filters", helper: "Voted not helpful in this filter scope.", min: 0.05, max: 1, step: 0.05 },
  { key: "down_other",                   scope: "Other query · other filters", helper: "Generic negative signal across all uses.", min: 0.05, max: 1, step: 0.05 },
];

export function SopRankingPanel() {
  const { toast } = useToast();
  const [weights, setWeights] = useState<SopFeedbackWeights>(DEFAULT_FEEDBACK_WEIGHTS);
  const [original, setOriginal] = useState<SopFeedbackWeights>(DEFAULT_FEEDBACK_WEIGHTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const w = await fetchFeedbackWeights();
        if (cancelled) return;
        setWeights(w);
        setOriginal(w);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dirty = JSON.stringify(weights) !== JSON.stringify(original);

  const setField = (key: keyof SopFeedbackWeights, value: number | boolean) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const saved = await saveFeedbackWeights(weights);
      setWeights(saved);
      setOriginal(saved);
      toast({ title: "Search ranking updated" });
    } catch (e) {
      toast({
        title: "Couldn't save ranking weights",
        description: e instanceof Error ? e.message : "You may not have permission to edit these.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onResetDefaults = () => setWeights(DEFAULT_FEEDBACK_WEIGHTS);
  const onRevert = () => setWeights(original);

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading ranking weights…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search ranking weights</CardTitle>
          <p className="text-xs text-muted-foreground">
            Choose how much each kind of feedback nudges SOP search results. Multipliers above 1 promote, below 1 demote. Defaults are tuned to give a noticeable but bounded effect.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Section
            icon={<ThumbsUp className="h-3.5 w-3.5 text-primary" />}
            title="Helpful (thumbs up) boosts"
            tone="primary"
          >
            {UP_ROWS.map((row) => (
              <WeightRow
                key={row.key}
                row={row}
                value={weights[row.key]}
                defaultValue={DEFAULT_FEEDBACK_WEIGHTS[row.key]}
                onChange={(v) => setField(row.key, v)}
              />
            ))}
          </Section>

          <Section
            icon={<ThumbsDown className="h-3.5 w-3.5 text-destructive" />}
            title="Not helpful (thumbs down) dampers"
            tone="destructive"
          >
            {DOWN_ROWS.map((row) => (
              <WeightRow
                key={row.key}
                row={row}
                value={weights[row.key]}
                defaultValue={DEFAULT_FEEDBACK_WEIGHTS[row.key]}
                onChange={(v) => setField(row.key, v)}
              />
            ))}
          </Section>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label htmlFor="hide-not-relevant" className="text-sm font-medium">
                    Hide on "Not relevant"
                  </Label>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  When on, results explicitly marked not relevant for an exact query and filter scope are hidden entirely. When off, they're treated as a soft demotion only.
                </p>
              </div>
              <Switch
                id="hide-not-relevant"
                checked={weights.hide_on_not_relevant}
                onCheckedChange={(v) => setField("hide_on_not_relevant", v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onResetDefaults} disabled={saving} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
        </Button>
        <Button variant="outline" size="sm" onClick={onRevert} disabled={!dirty || saving}>
          Discard changes
        </Button>
        <Button size="sm" onClick={onSave} disabled={!dirty || saving} className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "primary" | "destructive";
  children: React.ReactNode;
}) {
  const toneClass = tone === "primary" ? "text-primary" : "text-destructive";
  return (
    <div className="space-y-3 rounded-xl border border-border/60 p-4">
      <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${toneClass}`}>
        {icon} {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function WeightRow({
  row,
  value,
  defaultValue,
  onChange,
}: {
  row: RowDef;
  value: number;
  defaultValue: number;
  onChange: (v: number) => void;
}) {
  const clamp = (n: number) => Math.max(row.min, Math.min(row.max, n));
  const isDefault = Math.abs(value - defaultValue) < 0.001;
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">{row.scope}</div>
            {!isDefault && <Badge variant="outline" className="text-[9px]">customized</Badge>}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{row.helper}</p>
        </div>
        <Input
          type="number"
          min={row.min}
          max={row.max}
          step={row.step}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          className="h-8 w-20 text-right text-sm"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Slider
          min={row.min}
          max={row.max}
          step={row.step}
          value={[value]}
          onValueChange={([v]) => onChange(clamp(v))}
          className="flex-1"
        />
        <div className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">
          ×{value.toFixed(2)}
        </div>
      </div>
    </div>
  );
}