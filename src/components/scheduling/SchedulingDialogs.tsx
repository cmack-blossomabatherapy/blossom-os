import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSchedulingActions } from "@/hooks/useSchedulingActions";
import { useClients } from "@/contexts/ClientsContext";
import type { ScheduleSlot } from "@/data/clients";

const CR_NOTE = "Staged in Blossom OS. CentralReach API not connected yet — change will be queued for future sync.";

interface ClientLite { id: string; childName: string; state?: string; rbt?: string | null; bcba?: string | null; }
interface ProviderLite { name: string; role: "rbt" | "bcba"; state?: string | null; }

/* ---------------- Contact Attempt ---------------- */
export function ContactAttemptDialog({
  open, onOpenChange, client, provider, defaultContactType = "family", onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  client?: ClientLite | null;
  provider?: ProviderLite | null;
  defaultContactType?: "family" | "rbt" | "bcba" | "state_director" | "assistant_state_director" | "internal";
  onSaved?: () => void;
}) {
  const { logContactAttempt } = useSchedulingActions();
  const [contactType, setContactType] = useState(defaultContactType);
  const [channel, setChannel] = useState<"phone" | "sms" | "email" | "teams" | "internal_note">("phone");
  const [outcome, setOutcome] = useState<string>("connected");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  // Re-sync defaults whenever the dialog opens or the default contact type
  // changes. Without this the persistent dialog component keeps the first
  // value forever and Notify buttons appear to do nothing.
  useEffect(() => {
    if (open) setContactType(defaultContactType);
  }, [open, defaultContactType]);

  const save = async () => {
    setBusy(true);
    try {
      await logContactAttempt({
        clientId: client?.id ?? null,
        clientName: client?.childName ?? null,
        providerName: provider?.name ?? null,
        providerRole: provider?.role ?? null,
        contactType,
        channel,
        outcome: outcome as never,
        body,
        state: client?.state ?? provider?.state ?? null,
      });
      toast.success("Contact attempt logged.");
      onOpenChange(false);
      setBody(""); setOutcome("connected");
      onSaved?.();
    } catch { /* toast already shown */ } finally { setBusy(false); }
  };

  const title = client?.childName ?? provider?.name ?? "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log contact attempt{title ? ` · ${title}` : ""}</DialogTitle>
          <DialogDescription>Records to scheduling_contact_attempts.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Who</Label>
              <select className="w-full h-9 mt-1 px-2 rounded-md border border-border bg-background text-sm"
                value={contactType} onChange={(e) => setContactType(e.target.value as never)}>
                <option value="family">Family</option>
                <option value="rbt">RBT</option>
                <option value="bcba">BCBA</option>
                <option value="state_director">State Director</option>
                <option value="assistant_state_director">Assistant SD</option>
                <option value="internal">Internal</option>
              </select>
            </div>
            <div>
              <Label>Channel</Label>
              <select className="w-full h-9 mt-1 px-2 rounded-md border border-border bg-background text-sm"
                value={channel} onChange={(e) => setChannel(e.target.value as never)}>
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="teams">Teams</option>
                <option value="internal_note">Internal note</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Outcome</Label>
            <select className="w-full h-9 mt-1 px-2 rounded-md border border-border bg-background text-sm"
              value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="connected">Connected</option>
              <option value="left_message">Left message</option>
              <option value="no_answer">No answer</option>
              <option value="confirmed">Confirmed</option>
              <option value="declined">Declined</option>
              <option value="needs_follow_up">Needs follow-up</option>
            </select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What happened, next step…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Log Contact"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Scheduling Note ---------------- */
export function CoverageNoteDialog({
  open, onOpenChange, client, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  client?: ClientLite | null;
  onSaved?: () => void;
}) {
  const { logAction } = useSchedulingActions();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!note.trim()) { toast.error("Note is required."); return; }
    setBusy(true);
    try {
      await logAction({
        clientId: client?.id ?? null,
        clientName: client?.childName ?? null,
        actionType: "coverage_note",
        title: "Coverage note",
        note,
        state: client?.state ?? null,
      });
      toast.success("Coverage note saved.");
      setNote(""); onOpenChange(false); onSaved?.();
    } catch { /* */ } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add coverage note{client ? ` · ${client.childName}` : ""}</DialogTitle>
          <DialogDescription>Persists to scheduling_actions (coverage_note).</DialogDescription>
        </DialogHeader>
        <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did Scheduling do or learn?" />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save Note"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Cancellation ---------------- */
export function CancellationDialog({
  open, onOpenChange, client, onSaved,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; client?: ClientLite | null; onSaved?: () => void;
}) {
  const { logCancellation, logAction } = useSchedulingActions();
  const [date, setDate] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [cancelledBy, setCancelledBy] = useState<"family" | "rbt" | "bcba" | "clinic" | "weather" | "system" | "unknown">("family");
  const [reason, setReason] = useState("");
  const [makeUp, setMakeUp] = useState(true);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!client) { toast.error("Select a client first."); return; }
    setBusy(true);
    try {
      const row = await logCancellation({
        clientId: client.id,
        clientName: client.childName,
        sessionDate: date || null,
        startTime: start || null,
        endTime: end || null,
        state: client.state ?? null,
        rbtName: client.rbt ?? null,
        bcbaName: client.bcba ?? null,
        cancelledBy,
        reason,
        makeUpRequired: makeUp,
      });
      await logAction({
        clientId: client.id,
        clientName: client.childName,
        actionType: "cancellation_logged",
        title: `Cancellation (${cancelledBy})`,
        note: reason,
        state: client.state ?? null,
        metadata: { cancellation_id: (row as { id?: string } | null)?.id, make_up_required: makeUp },
      });
      toast.success(makeUp ? "Cancellation logged. Make-up queued in /ops/make-up-sessions." : "Cancellation logged.");
      onOpenChange(false); onSaved?.();
    } catch { /* */ } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log cancellation{client ? ` · ${client.childName}` : ""}</DialogTitle>
          <DialogDescription>{CR_NOTE}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Start</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><Label>End</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div>
            <Label>Cancelled by</Label>
            <select className="w-full h-9 mt-1 px-2 rounded-md border border-border bg-background text-sm"
              value={cancelledBy} onChange={(e) => setCancelledBy(e.target.value as never)}>
              {["family","rbt","bcba","clinic","weather","system","unknown"].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><Label>Reason</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={makeUp} onChange={(e) => setMakeUp(e.target.checked)} />
            Make-up required (will appear in /ops/make-up-sessions)
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !client}>{busy ? "Saving…" : "Log Cancellation"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Adjustment ---------------- */
export function AdjustmentDialog({
  open, onOpenChange, client, onSaved,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; client?: ClientLite | null; onSaved?: () => void;
}) {
  const { createAdjustment, logAction } = useSchedulingActions();
  const { addScheduleSlot } = useClients();
  const [type, setType] = useState<"move_session" | "add_session" | "remove_session" | "change_rbt" | "change_location" | "change_time">("move_session");
  const [day, setDay] = useState("");
  const [date, setDate] = useState("");
  const [oldStart, setOldStart] = useState("");
  const [newStart, setNewStart] = useState("");
  const [oldEnd, setOldEnd] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [oldRbt, setOldRbt] = useState("");
  const [newRbt, setNewRbt] = useState("");
  const [location, setLocation] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [applyLocal, setApplyLocal] = useState(true);

  // Decide whether we can safely apply this adjustment to the local Blossom OS schedule.
  function tryBuildLocalSlot(): ScheduleSlot | null {
    const dayKey = (day || "").trim().slice(0, 3);
    const allowed = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
    const dayMatch = allowed.find((d) => d.toLowerCase() === dayKey.toLowerCase());
    if (!dayMatch) return null;
    if (!newStart || !newEnd) return null;
    const loc = (["Home", "School", "Clinic"] as const).find((l) => l.toLowerCase() === location.trim().toLowerCase());
    const rbtVal = newRbt.trim() || (oldRbt.trim() || undefined);
    return { day: dayMatch, start: newStart, end: newEnd, rbt: rbtVal, location: loc };
  }

  function canApplyLocal(): boolean {
    if (!client) return false;
    if (type === "add_session") return !!tryBuildLocalSlot();
    if (type === "change_rbt") return !!tryBuildLocalSlot(); // needs day + new times to safely identify slot
    // move_session / change_time / remove_session / change_location: too ambiguous without slot ids.
    return false;
  }

  const save = async () => {
    if (!client) { toast.error("Select a client first."); return; }
    setBusy(true);
    try {
      const row = await createAdjustment({
        clientId: client.id, clientName: client.childName, adjustmentType: type, dayOfWeek: day || null, sessionDate: date || null,
        oldStartTime: oldStart || null, newStartTime: newStart || null,
        oldEndTime: oldEnd || null, newEndTime: newEnd || null,
        oldRbtName: oldRbt || null, newRbtName: newRbt || null,
        newLocation: location || null, reason,
      });
      await logAction({
        clientId: client.id, clientName: client.childName, actionType: "schedule_adjustment", title: `Adjustment: ${type}`,
        note: reason, state: client.state ?? null,
        metadata: { adjustment_id: (row as { id?: string } | null)?.id, applied_local: applyLocal && canApplyLocal() },
      });
      let appliedLocal = false;
      if (applyLocal && canApplyLocal()) {
        const slot = tryBuildLocalSlot();
        if (slot) {
          await addScheduleSlot(client.id, slot);
          appliedLocal = true;
        }
      }
      toast.success(
        appliedLocal
          ? "Saved and applied to Blossom OS schedule. CentralReach sync not connected yet."
          : "Saved as staged adjustment. Not ready for CentralReach sync.",
      );
      onOpenChange(false); onSaved?.();
    } catch { /* */ } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add schedule adjustment{client ? ` · ${client.childName}` : ""}</DialogTitle>
          <DialogDescription>{CR_NOTE}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Type</Label>
            <select className="w-full h-9 mt-1 px-2 rounded-md border border-border bg-background text-sm"
              value={type} onChange={(e) => setType(e.target.value as never)}>
              <option value="move_session">Move session</option>
              <option value="add_session">Add session</option>
              <option value="remove_session">Remove session</option>
              <option value="change_rbt">Change RBT</option>
              <option value="change_location">Change location</option>
              <option value="change_time">Change time</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Day</Label><Input placeholder="Mon/Tue…" value={day} onChange={(e) => setDay(e.target.value)} /></div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Old start</Label><Input type="time" value={oldStart} onChange={(e) => setOldStart(e.target.value)} /></div>
            <div><Label>New start</Label><Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} /></div>
            <div><Label>Old end</Label><Input type="time" value={oldEnd} onChange={(e) => setOldEnd(e.target.value)} /></div>
            <div><Label>New end</Label><Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Old RBT</Label><Input value={oldRbt} onChange={(e) => setOldRbt(e.target.value)} /></div>
            <div><Label>New RBT</Label><Input value={newRbt} onChange={(e) => setNewRbt(e.target.value)} /></div>
          </div>
          <div><Label>Location</Label><Input placeholder="Home / Clinic / School" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div><Label>Reason</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <label className="flex items-start gap-2 text-sm rounded-md border border-border/60 bg-muted/30 p-2">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={applyLocal}
              onChange={(e) => setApplyLocal(e.target.checked)}
              disabled={!canApplyLocal()}
            />
            <span>
              <span className="font-medium">Apply to Blossom OS schedule now</span>
              <span className="block text-[11px] text-muted-foreground">
                {canApplyLocal()
                  ? "We have day + new start/end. The slot will appear in the client schedule immediately. CentralReach sync is still queued."
                  : "Needs day, new start, and new end (add_session or change_rbt) to safely update the local schedule."}
              </span>
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !client}>{busy ? "Saving…" : "Save Adjustment"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Coverage Case (Find Coverage / Escalate) ---------------- */
export function CoverageCaseDialog({
  open, onOpenChange, client, mode = "find", onSaved,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; client?: ClientLite | null;
  mode?: "find" | "escalate"; onSaved?: () => void;
}) {
  const { createCoverageCase, logAction } = useSchedulingActions();
  const [reason, setReason] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!client) { toast.error("Select a client first."); return; }
    setBusy(true);
    try {
      await createCoverageCase({
        clientId: client.id, clientName: client.childName, state: client.state ?? null,
        caseType: mode === "escalate" ? "escalation" : "coverage_gap",
        riskLevel: mode === "escalate" ? "critical" : "high",
        rbtName: client.rbt ?? null, bcbaName: client.bcba ?? null,
        reason, nextAction: next,
        metadata: { escalation_level: mode === "escalate" ? 1 : 0 },
      });
      await logAction({
        clientId: client.id,
        clientName: client.childName,
        actionType: mode === "escalate" ? "state_director_escalated" : "coverage_case_opened",
        priority: mode === "escalate" ? "urgent" : "high",
        title: mode === "escalate" ? "Escalated to State Director" : "Coverage case opened",
        note: reason,
        state: client.state ?? null,
      });
      toast.success(mode === "escalate" ? "Escalated to State Director." : "Coverage case opened.");
      setReason(""); setNext("");
      onOpenChange(false); onSaved?.();
    } catch { /* */ } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "escalate" ? "Escalate to State Director" : "Open coverage case"}{client ? ` · ${client.childName}` : ""}</DialogTitle>
          <DialogDescription>Persists to scheduling_coverage_cases + scheduling_actions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Reason</Label><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <div><Label>Next action</Label><Input value={next} onChange={(e) => setNext(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !client}>{busy ? "Saving…" : mode === "escalate" ? "Escalate" : "Open Case"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Quick Pairing / Assign RBT ---------------- */
export function AssignRbtDialog({
  open, onOpenChange, client, defaultRbt = "", onSaved,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; client?: ClientLite | null;
  defaultRbt?: string; onSaved?: (rbtName: string) => void;
}) {
  const { logAction } = useSchedulingActions();
  const { assignRbt } = useClients();
  const [rbt, setRbt] = useState(defaultRbt);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  // Re-sync defaultRbt whenever dialog opens — the dialog stays mounted, so
  // without this a second Quick Pairing for a different RBT keeps the old name.
  useEffect(() => {
    if (open) setRbt(defaultRbt ?? "");
  }, [open, defaultRbt]);
  const save = async () => {
    const trimmed = rbt.trim();
    if (!client || !trimmed) { toast.error("Select a client and RBT."); return; }
    setBusy(true);
    try {
      await logAction({
        clientId: client.id, clientName: client.childName, actionType: "rbt_assigned",
        title: `RBT assigned: ${trimmed}`, note,
        state: client.state ?? null,
        status: "completed",
        metadata: { rbt_name: trimmed, prior_rbt: client.rbt ?? null },
      });
      // Update local client state so the workspace reflects the assignment
      // immediately. assignRbt already appends timeline + automation entries,
      // so we do not duplicate them here. CentralReach is intentionally NOT
      // marked as synced — the worker is not connected yet.
      await assignRbt([client.id], trimmed);
      toast.success(`Paired ${client.childName} with ${trimmed}. Staged in Blossom OS; CentralReach sync not connected yet.`);
      onOpenChange(false); onSaved?.(trimmed);
    } catch { /* */ } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign RBT{client ? ` · ${client.childName}` : ""}</DialogTitle>
          <DialogDescription>Logs to scheduling_actions (rbt_assigned) and updates the local Blossom OS client record. {CR_NOTE}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>RBT name</Label><Input value={rbt} onChange={(e) => setRbt(e.target.value)} placeholder="Start typing…" /></div>
          <div><Label>Notes</Label><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !client}>{busy ? "Saving…" : "Confirm Assignment"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Confirm Start Date ---------------- */
export function StartDateDialog({
  open, onOpenChange, client, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  client?: ClientLite | null;
  onSaved?: (date: string) => void;
}) {
  const { logAction } = useSchedulingActions();
  const { setStartDate } = useClients();
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setDate(""); setNote(""); }
  }, [open]);

  const save = async () => {
    if (!client) { toast.error("Select a client first."); return; }
    if (!date) { toast.error("Pick a start date."); return; }
    setBusy(true);
    try {
      await setStartDate([client.id], date);
      await logAction({
        clientId: client.id,
        clientName: client.childName,
        actionType: "start_date_confirmed",
        title: `Start date confirmed: ${date}`,
        note,
        state: client.state ?? null,
        status: "completed",
        metadata: { start_date: date, prior_rbt: client.rbt ?? null, bcba: client.bcba ?? null },
      });
      toast.success(`Start date set for ${client.childName}. Staged in Blossom OS; CentralReach sync not connected yet.`);
      onOpenChange(false);
      onSaved?.(date);
    } catch { /* toast already shown */ } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm start date{client ? ` · ${client.childName}` : ""}</DialogTitle>
          <DialogDescription>{CR_NOTE}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Start date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything Scheduling needs to know…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !client || !date}>{busy ? "Saving…" : "Confirm Start Date"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Provider Capacity / Caseload Risk ---------------- */
export function ProviderRiskDialog({
  open, onOpenChange, providerName, providerRole, state, onSaved,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  providerName: string; providerRole: "rbt" | "bcba"; state?: string | null;
  onSaved?: () => void;
}) {
  const { logAction, createCoverageCase } = useSchedulingActions();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await logAction({
        actionType: providerRole === "rbt" ? "rbt_capacity_risk" : "bcba_caseload_risk",
        title: providerRole === "rbt" ? `RBT capacity risk: ${providerName}` : `BCBA caseload risk: ${providerName}`,
        note: reason, state: state ?? null, priority: "high",
        providerName, providerRole,
        metadata: { provider_name: providerName, role: providerRole },
      });
      await createCoverageCase({
        state: state ?? null,
        caseType: providerRole === "rbt" ? "rbt_capacity" : "bcba_caseload",
        riskLevel: "high",
        providerName, providerRole,
        rbtName: providerRole === "rbt" ? providerName : null,
        bcbaName: providerRole === "bcba" ? providerName : null,
        reason,
      });
      toast.success("Risk flagged and coverage case opened.");
      setReason(""); onOpenChange(false); onSaved?.();
    } catch { /* */ } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Flag {providerRole === "rbt" ? "capacity" : "caseload"} risk · {providerName}</DialogTitle>
        </DialogHeader>
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this provider at risk?" />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Flag Risk"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CRSyncBadge({ status }: { status?: string | null }) {
  const s = (status ?? "not_ready").toLowerCase();
  const map: Record<string, { label: string; cls: string }> = {
    not_ready: { label: "Not ready for CR sync", cls: "bg-muted text-muted-foreground" },
    queued: { label: "Queued for CR sync", cls: "bg-info/10 text-info" },
    synced: { label: "Synced to CentralReach", cls: "bg-success/10 text-success" },
    failed: { label: "CR sync failed", cls: "bg-destructive/10 text-destructive" },
  };
  const v = map[s] ?? map.not_ready;
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${v.cls}`}>{v.label}</span>;
}