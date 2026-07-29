import { useMemo, useState } from "react";
import { Loader2, Search, ArrowRightLeft, AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useClientStaffingOptions,
  useStaffingHandoffs,
  type ClientStaffingOption,
} from "@/hooks/useStaffingHandoff";

/** Minimal candidate shape so both the canonical and legacy pipelines can use this. */
export interface HandoffCandidate {
  id: string;
  name: string;
  state?: string | null;
  city?: string | null;
  stage: string;
}

/**
 * Manual recruiting → staffing handoff for RBT / BCBA candidates.
 *
 * Captures only the minimum staffing-fit fields. No diagnosis, clinical
 * notes, or insurance data is collected or displayed.
 */

const SETTINGS = ["In-home", "Clinic", "School", "Community", "Telehealth"];
const PRIORITIES = ["Low", "Normal", "High", "Urgent"];

/** Stages that mean the person is genuinely available to be staffed. */
const STAFFING_READY_STAGES = new Set([
  "Offer Accepted", "Background Check", "Orientation Scheduled", "Onboarding", "Ready to Staff",
  // Legacy RBT/BCBA board stage labels.
  "Orientation Ready", "Staffing Ready",
]);

export function staffingBlockerFor(c: HandoffCandidate): string | null {
  if (STAFFING_READY_STAGES.has(c.stage)) return null;
  return `Candidate is still at "${c.stage}" — offer, onboarding and readiness gates are not complete.`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: HandoffCandidate;
  roleNeeded: "RBT" | "BCBA";
}

export function StaffingHandoffDialog({ open, onOpenChange, candidate, roleNeeded }: Props) {
  const { propose } = useStaffingHandoffs(candidate.id);
  const [search, setSearch] = useState("");
  const { options, loading: searching } = useClientStaffingOptions(open ? search : "");
  const [picked, setPicked] = useState<ClientStaffingOption | null>(null);
  const [manual, setManual] = useState(false);
  const [saving, setSaving] = useState(false);

  const [label, setLabel] = useState("");
  const [state, setState] = useState(candidate.state ?? "GA");
  const [city, setCity] = useState(candidate.city ?? "");
  const [setting, setSetting] = useState(SETTINGS[0]);
  const [priority, setPriority] = useState("Normal");
  const [startDate, setStartDate] = useState("");
  const [availability, setAvailability] = useState("");
  const [prefs, setPrefs] = useState("");

  const blocker = useMemo(() => staffingBlockerFor(candidate), [candidate]);
  const effectiveLabel = picked?.display_label ?? label.trim();
  const canSubmit = !!effectiveLabel && !!state && !saving;

  const reset = () => {
    setPicked(null); setManual(false); setSearch(""); setLabel("");
    setCity(candidate.city ?? ""); setStartDate(""); setAvailability(""); setPrefs("");
  };

  const submit = async () => {
    setSaving(true);
    const res = await propose({
      candidateId: candidate.id,
      clientId: picked?.client_id ?? null,
      clientLabel: effectiveLabel,
      state,
      city: picked?.clinic ?? city ?? null,
      serviceSetting: picked?.service_location ?? setting,
      roleNeeded,
      priority,
      desiredStartDate: startDate || null,
      requiredAvailability: availability || null,
      preferenceNotes: prefs || null,
      source: "Recruiting",
      blocker,
    });
    setSaving(false);
    if (res.ok) { reset(); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            Propose staffing match
          </DialogTitle>
          <DialogDescription>
            {candidate.name} · {roleNeeded}. Staffing/Operations makes the final assignment.
            Only staffing-fit details are collected.
          </DialogDescription>
        </DialogHeader>

        {blocker && (
          <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            <span>{blocker} This will be saved as a <strong>proposed future match</strong>.</span>
          </div>
        )}

        <div className="space-y-4">
          {!manual && (
            <div className="space-y-2">
              <Label htmlFor="client-search">Find an existing client</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client-search"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPicked(null); }}
                  placeholder="Search by client name, state, or clinic…"
                  className="pl-9"
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border/70 divide-y divide-border/60">
                {searching && (
                  <div className="p-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                  </div>
                )}
                {!searching && options.length === 0 && (
                  <div className="p-3 text-xs text-muted-foreground">
                    No matching clients you can access. Enter a manual staffing need instead.
                  </div>
                )}
                {!searching && options.map((o) => (
                  <button
                    key={o.client_id}
                    type="button"
                    onClick={() => { setPicked(o); setState(o.state ?? state); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition",
                      picked?.client_id === o.client_id && "bg-primary/10",
                    )}
                  >
                    <span className="font-medium">{o.display_label || "Client"}</span>
                    <span className="text-muted-foreground">
                      {" "}· {o.state ?? "—"}{o.clinic ? ` · ${o.clinic}` : ""}
                      {o.service_location ? ` · ${o.service_location}` : ""}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setManual(true)}
                className="text-xs text-primary hover:underline"
              >
                Client not in Blossom yet — enter a manual staffing need
              </button>
            </div>
          )}

          {manual && (
            <div className="space-y-2">
              <Label htmlFor="client-label">Client display name or alias *</Label>
              <Input
                id="client-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. J. Smith (Marietta)"
              />
              <button type="button" onClick={() => setManual(false)} className="text-xs text-primary hover:underline">
                Search existing clients instead
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hs-state">State *</Label>
              <Input id="hs-state" value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hs-city">City / clinic</Label>
              <Input id="hs-city" value={picked?.clinic ?? city} onChange={(e) => setCity(e.target.value)} disabled={!!picked?.clinic} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hs-setting">Service setting</Label>
              <select
                id="hs-setting"
                value={picked?.service_location ?? setting}
                onChange={(e) => setSetting(e.target.value)}
                disabled={!!picked?.service_location}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {SETTINGS.map((s) => <option key={s} value={s}>{s}</option>)}
                {picked?.service_location && !SETTINGS.includes(picked.service_location) && (
                  <option value={picked.service_location}>{picked.service_location}</option>
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hs-priority">Priority</Label>
              <select
                id="hs-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hs-start">Desired start date</Label>
              <Input id="hs-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hs-avail">Required availability</Label>
              <Input id="hs-avail" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="M–F afternoons" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hs-prefs">Language / preference notes (staffing fit only)</Label>
            <Textarea
              id="hs-prefs"
              value={prefs}
              onChange={(e) => setPrefs(e.target.value)}
              rows={2}
              placeholder="e.g. Spanish-speaking preferred, male RBT requested"
            />
            <p className="text-[11px] text-muted-foreground">
              Do not enter diagnoses, clinical notes, or insurance details.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {blocker ? "Save proposed match" : "Send to Staffing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
