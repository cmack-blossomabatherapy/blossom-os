/** Authorization-team dialog for logging a weekly authorization workflow event. */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  AUTH_EVENT_LABELS,
  AUTH_EVENT_TYPES,
  PR_PAUSE_REASONS,
  type AuthEventType,
} from "@/lib/os/reports/crPrimary/metrics/authorizationTracker";
import type { AuthEventInput } from "@/hooks/useAuthorizationWeeklyEvents";

const STATES = ["GA", "NC", "TN", "VA", "MD", "NJ"];

export function LogAuthEventDialog({
  open,
  onOpenChange,
  onSubmit,
  clients,
  payors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: AuthEventInput) => Promise<string | null>;
  clients: string[];
  payors: string[];
}) {
  const [eventType, setEventType] = useState<AuthEventType>("ra_submitted");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clientName, setClientName] = useState("");
  const [payor, setPayor] = useState("");
  const [state, setState] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  const [pauseDetail, setPauseDetail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const isLatePrPause = eventType === "services_paused_late_pr";
  const isPause = isLatePrPause || eventType === "services_paused_no_ra";

  const submit = async () => {
    if (!eventDate) {
      toast.error("Event date is required");
      return;
    }
    if (isLatePrPause && !pauseReason) {
      toast.error("Select why the progress report was late or missing");
      return;
    }
    setSaving(true);
    const error = await onSubmit({
      event_type: eventType,
      event_date: eventDate,
      client_name: clientName.trim() || null,
      payor: payor || null,
      state: state || null,
      pause_reason: isPause ? pauseReason || null : null,
      pause_reason_detail: isPause ? pauseDetail.trim() || null : null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`${AUTH_EVENT_LABELS[eventType]} logged`);
    setClientName("");
    setPauseDetail("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log authorization event</DialogTitle>
          <DialogDescription>
            CentralReach exports do not carry submission, denial, or progress-report
            events. Log them here so the weekly tracker stays accurate.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Event</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as AuthEventType)}>
              <SelectTrigger aria-label="Event type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTH_EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {AUTH_EVENT_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="auth-event-date">Event date</Label>
              <Input
                id="auth-event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="auth-event-client">Client</Label>
              <Input
                id="auth-event-client"
                list="auth-event-clients"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
              />
              <datalist id="auth-event-clients">
                {clients.slice(0, 500).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="auth-event-payor">Payor</Label>
              <Input
                id="auth-event-payor"
                list="auth-event-payors"
                value={payor}
                onChange={(e) => setPayor(e.target.value)}
                placeholder="Payor"
              />
              <datalist id="auth-event-payors">
                {payors.slice(0, 200).map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-1.5">
              <Label>State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger aria-label="State">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isPause && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>{isLatePrPause ? "Why was the PR late or missing?" : "Pause reason"}</Label>
                <Select value={pauseReason} onValueChange={setPauseReason}>
                  <SelectTrigger aria-label="Pause reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {(isLatePrPause
                      ? PR_PAUSE_REASONS
                      : ["No reauthorization on file", "RA submitted, awaiting payor", "Other"]
                    ).map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="auth-event-pause-detail">Reason detail</Label>
                <Input
                  id="auth-event-pause-detail"
                  value={pauseDetail}
                  onChange={(e) => setPauseDetail(e.target.value)}
                  placeholder="Specifics operators need to act on"
                />
              </div>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="auth-event-notes">Notes</Label>
            <Textarea
              id="auth-event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Logging…" : "Log event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}