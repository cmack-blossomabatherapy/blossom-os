import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, UserPlus, Sparkles } from "lucide-react";
import { useAcademy } from "@/lib/training/academyData";
import type { LaunchAsset, PendingSop } from "@/lib/academy/launchAssets";

/**
 * Calm Assign Training modal — single consolidated assignment entry point
 * replacing scattered admin/track-assign + admin/training-assign flows.
 *
 * Display-only / mock-safe: surfaces setup warnings before assignment and
 * renders a calm confirmation state. Persistence is intentionally pending
 * integration — no fake DB writes.
 */
export function AssignTrainingModal({
  open,
  onClose,
  welcomeAssets,
  pendingSops,
}: {
  open: boolean;
  onClose: () => void;
  welcomeAssets: LaunchAsset[];
  pendingSops: PendingSop[];
}) {
  const { journeys } = useAcademy();
  const [trainee, setTrainee] = useState("");
  const [journeyId, setJourneyId] = useState<string>("");
  const [mentor, setMentor] = useState("");
  const [state, setState] = useState("");
  const [startDate, setStartDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const warnings = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (!trainee.trim())
      list.push({ key: "trainee", label: "Trainee not selected — employee/auth-user link missing." });
    if (!mentor.trim())
      list.push({ key: "mentor", label: "No mentor assigned — pair before week 1." });
    if (!state.trim())
      list.push({ key: "state", label: "No state assigned — required for State Director path." });
    const pendingWelcome = welcomeAssets.filter((a) => a.status !== "linked");
    if (pendingWelcome.length > 0)
      list.push({
        key: "welcome",
        label: `${pendingWelcome.length} welcome asset${pendingWelcome.length === 1 ? "" : "s"} pending — non-blocking, written guidance still works.`,
      });
    if (pendingSops.length > 0)
      list.push({
        key: "sops",
        label: `${pendingSops.length} SOP/resource link${pendingSops.length === 1 ? "" : "s"} pending — non-blocking admin action item.`,
      });
    return list;
  }, [trainee, mentor, state, welcomeAssets, pendingSops]);

  const canConfirm = !!journeyId;

  function reset() {
    setTrainee("");
    setJourneyId("");
    setMentor("");
    setState("");
    setStartDate("");
    setConfirmed(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-xl" data-testid="assign-training-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <UserPlus className="h-4 w-4" /> Assign training
          </DialogTitle>
          <DialogDescription>
            Enroll an employee into a training path. Persistence is pending integration —
            this confirms setup readiness only.
          </DialogDescription>
        </DialogHeader>

        {confirmed ? (
          <div className="space-y-3 py-2" data-testid="assign-confirmation">
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              <div className="text-[13px]">
                <p className="font-medium text-foreground">Assignment ready to send.</p>
                <p className="mt-0.5 text-muted-foreground">
                  Next step: complete the trainee link and mentor pairing in Training Management,
                  then publish the enrollment when persistence is wired up.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-3 text-[12.5px]">
              <p className="font-medium">Summary</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>Trainee: <span className="text-foreground">{trainee || "—"}</span></li>
                <li>Path: <span className="text-foreground">{journeys.find((j) => j.id === journeyId)?.title ?? "—"}</span></li>
                <li>Mentor: <span className="text-foreground">{mentor || "—"}</span></li>
                <li>State: <span className="text-foreground">{state || "—"}</span></li>
                <li>Start date: <span className="text-foreground">{startDate || "—"}</span></li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Trainee (employee)</Label>
                <Input
                  value={trainee}
                  onChange={(e) => setTrainee(e.target.value)}
                  placeholder="Search or enter employee name"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Training path</Label>
                <Select value={journeyId} onValueChange={setJourneyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a journey…" />
                  </SelectTrigger>
                  <SelectContent>
                    {journeys.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mentor (optional)</Label>
                <Input
                  value={mentor}
                  onChange={(e) => setMentor(e.target.value)}
                  placeholder="Mentor name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State (optional)</Label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Georgia"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Start date (optional)</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {warnings.length > 0 && (
              <div
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"
                data-testid="setup-warnings"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-[12.5px] font-medium">Setup warnings</p>
                </div>
                <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                  {warnings.map((w) => (
                    <li key={w.key}>• {w.label}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Pending integration — confirming will preview the assignment, not write to the database.
            </p>
          </div>
        )}

        <DialogFooter>
          {confirmed ? (
            <>
              <Button variant="ghost" onClick={() => setConfirmed(false)}>
                Edit
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setConfirmed(true)} disabled={!canConfirm}>
                Confirm assignment
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssignTrainingModal;