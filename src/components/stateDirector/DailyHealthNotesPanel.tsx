import { useMemo, useState } from "react";
import { HeartPulse, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useStateDailyHealthNotes, type StateDailyHealthNote } from "@/hooks/useStateDailyHealthNotes";

interface Props {
  stateCode: string;
  actor: string;
  canEdit?: boolean;
}

function statusInput(label: string, value: string, onChange: (v: string) => void) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Green / Yellow / Red · short note" />
    </div>
  );
}

export function DailyHealthNotesPanel({ stateCode, actor, canEdit = true }: Props) {
  const { toast } = useToast();
  const { notes, loading, error, upsertToday } = useStateDailyHealthNotes(stateCode);

  const today = new Date().toISOString().slice(0, 10);
  const todaysNote = useMemo(() => notes.find((n) => n.note_date === today), [notes, today]);

  const [summary, setSummary] = useState(todaysNote?.summary ?? "");
  const [wins, setWins] = useState(todaysNote?.wins ?? "");
  const [blockers, setBlockers] = useState(todaysNote?.blockers ?? "");
  const [intake, setIntake] = useState(todaysNote?.intake_status ?? "");
  const [staffing, setStaffing] = useState(todaysNote?.staffing_status ?? "");
  const [scheduling, setScheduling] = useState(todaysNote?.scheduling_status ?? "");
  const [auths, setAuths] = useState(todaysNote?.authorizations_status ?? "");
  const [recruiting, setRecruiting] = useState(todaysNote?.recruiting_status ?? "");
  const [saving, setSaving] = useState(false);

  // Keep local form in sync when today's note arrives via realtime.
  useMemo(() => {
    if (todaysNote) {
      setSummary(todaysNote.summary ?? "");
      setWins(todaysNote.wins ?? "");
      setBlockers(todaysNote.blockers ?? "");
      setIntake(todaysNote.intake_status ?? "");
      setStaffing(todaysNote.staffing_status ?? "");
      setScheduling(todaysNote.scheduling_status ?? "");
      setAuths(todaysNote.authorizations_status ?? "");
      setRecruiting(todaysNote.recruiting_status ?? "");
    }
  }, [todaysNote?.id]);

  const save = async () => {
    setSaving(true);
    const { error: err } = await upsertToday({
      summary, wins, blockers,
      intake_status: intake, staffing_status: staffing, scheduling_status: scheduling,
      authorizations_status: auths, recruiting_status: recruiting,
    }, actor);
    setSaving(false);
    if (err) toast({ title: "Could not save health note", description: err, variant: "destructive" });
    else toast({ title: "Daily state health note saved" });
  };

  return (
    <Card className="rounded-2xl border-border/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">Daily State Health Notes — {stateCode}</h3>
        </div>
        {error && <span className="text-[11px] text-destructive">Unable to sync</span>}
      </div>

      {canEdit && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Today's summary</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="One-liner: how did the state operate today?" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Wins</Label>
              <Textarea value={wins} onChange={(e) => setWins(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Blockers</Label>
              <Textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} rows={2} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {statusInput("Intake", intake, setIntake)}
            {statusInput("Staffing", staffing, setStaffing)}
            {statusInput("Scheduling", scheduling, setScheduling)}
            {statusInput("Authorizations", auths, setAuths)}
            {statusInput("Recruiting", recruiting, setRecruiting)}
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving…" : todaysNote ? "Update today's note" : "Save today's note"}
            </Button>
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Recent notes</p>
        {loading && !notes.length ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No health notes yet for {stateCode}.</p>
        ) : (
          <ul className="space-y-2">
            {notes.slice(0, 7).map((n: StateDailyHealthNote) => (
              <li key={n.id} className="rounded-xl border border-border/60 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{n.note_date}</span>
                  <span className="text-muted-foreground">{n.created_by_name ?? "System"}</span>
                </div>
                {n.summary && <p className="mt-1 text-muted-foreground">{n.summary}</p>}
                <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {n.intake_status && <span>Intake: {n.intake_status}</span>}
                  {n.staffing_status && <span>Staffing: {n.staffing_status}</span>}
                  {n.scheduling_status && <span>Scheduling: {n.scheduling_status}</span>}
                  {n.authorizations_status && <span>Auths: {n.authorizations_status}</span>}
                  {n.recruiting_status && <span>Recruiting: {n.recruiting_status}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}