import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import { mockRBTProfiles, type RBTProfile } from "@/data/staffing";
import { distanceBetween, type StaffingMapPoint } from "@/lib/os/staffing/mapAdapter";
import { applyPreferenceScoring } from "@/lib/os/staffing/preferenceScoring";
import type { FamilyStaffingPreferenceRow } from "@/lib/os/staffing/types";
import { useStaffingWorkspace } from "@/hooks/useStaffingWorkspace";

interface CaseLike {
  id: string;
  childName: string;
  state: string;
  clinic?: string | null;
  requiredHours: number;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  caseInfo: CaseLike | null;
  preferences: FamilyStaffingPreferenceRow[];
  onProposed?: () => void;
}

/**
 * Shared modal for proposing an RBT match from Open Cases, Coverage, and Live Map.
 * Uses preference scoring to surface a preference-adjusted score and surface conflicts.
 */
export function ProposeMatchDialog({ open, onOpenChange, caseInfo, preferences, onProposed }: Props) {
  const { propose } = useStaffingWorkspace();
  const [selectedRbtId, setSelectedRbtId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const relevantPrefs = useMemo(() => {
    if (!caseInfo) return [];
    return preferences.filter(
      (p) =>
        p.status === "active" &&
        (p.client_id === caseInfo.id ||
          p.client_name.toLowerCase() === caseInfo.childName.toLowerCase()),
    );
  }, [caseInfo, preferences]);

  const ranked = useMemo(() => {
    if (!caseInfo) return [];
    const clientPoint: StaffingMapPoint = {
      id: caseInfo.id, kind: "client", name: caseInfo.childName,
      state: caseInfo.state, city: caseInfo.clinic ?? null, zip: null,
      lat: null, lon: null, hours: caseInfo.requiredHours,
    };
    return mockRBTProfiles
      .map((r) => {
        const rbtPoint: StaffingMapPoint = {
          id: r.id, kind: "rbt", name: r.name, state: r.state,
          city: r.clinic ?? null, zip: r.zip ?? null, lat: null, lon: null,
          hours: r.capacityHours - r.assignedHours,
        };
        const miles = distanceBetween(clientPoint, rbtPoint);
        const remaining = r.capacityHours - r.assignedHours;
        const sameState = r.state === caseInfo.state;
        const base = Math.max(0, Math.min(100,
          (sameState ? 60 : 30) +
          Math.min(20, remaining) +
          (miles !== null ? Math.max(0, 20 - Math.round(miles / 5)) : 0),
        ));
        const scored = applyPreferenceScoring(base, relevantPrefs, {
          rbtName: r.name, rbtState: r.state,
        });
        return { rbt: r, miles, remaining, base, scored };
      })
      .sort((a, b) => (b.scored.score - a.scored.score));
  }, [caseInfo, relevantPrefs]);

  const selected = ranked.find((x) => x.rbt.id === selectedRbtId) ?? null;

  const submit = async () => {
    if (!caseInfo || !selected) return;
    setSaving(true);
    try {
      await propose({
        client_id: caseInfo.id,
        rbt_id: selected.rbt.id,
        rbt_name: selected.rbt.name,
        match_score: selected.scored.score,
        distance_miles: selected.miles,
        capacity_remaining: selected.remaining,
        notes: notes.trim() || `Proposed for ${caseInfo.childName}`,
      });
      onProposed?.();
      onOpenChange(false);
      setSelectedRbtId(null);
      setNotes("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Propose match {caseInfo ? `for ${caseInfo.childName}` : ""}</DialogTitle>
          <DialogDescription>
            Recommendations are ranked by base fit plus active family preferences.
            Must-have misses and avoid conflicts are flagged.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {ranked.length === 0 && (
            <p className="text-sm text-muted-foreground italic p-4 text-center">No RBTs available.</p>
          )}
          {ranked.map(({ rbt, miles, remaining, base, scored }) => {
            const isSelected = selectedRbtId === rbt.id;
            return (
              <button
                key={rbt.id}
                type="button"
                onClick={() => setSelectedRbtId(rbt.id)}
                className={cn(
                  "w-full text-left rounded-lg border bg-muted/20 p-3 flex items-start justify-between gap-3 transition-colors",
                  isSelected ? "border-primary ring-1 ring-primary/40" : "border-border/40 hover:border-primary/40",
                  scored.blocked && "border-destructive/40 bg-destructive/5",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{rbt.name}</div>
                  <div className="text-[11px] text-muted-foreground inline-flex items-center gap-2 flex-wrap">
                    <MapPin className="h-3 w-3" />
                    {rbt.state} - {rbt.clinic ?? "no clinic"}
                    {miles !== null && <span>- {miles} mi</span>}
                    <span>- {remaining}h open</span>
                  </div>
                  {scored.applied.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {scored.applied.map((a, i) => (
                        <Badge
                          key={i}
                          variant={a.impact < 0 ? "destructive" : a.matched ? "default" : "secondary"}
                          className="text-[10px]"
                          title={a.preference.preference_detail}
                        >
                          {a.preference.importance === "avoid" ? "avoid" : a.preference.importance.replace("_", " ")}
                          : {a.impact > 0 ? `+${a.impact}` : a.impact}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {scored.blocked && (
                    <div className="mt-1.5 text-[11px] text-destructive inline-flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Blocked by family preference
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="text-xs text-muted-foreground">base {base}</div>
                  <div className={cn("text-lg font-semibold", scored.blocked ? "text-destructive" : "text-foreground")}>
                    {scored.score}
                  </div>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary mt-1" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Notes (optional)</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why this match, scheduling fit, etc." />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!selected || saving} onClick={submit}>
            {saving ? "Proposing..." : "Propose match"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { CaseLike as ProposeMatchCase, RBTProfile };