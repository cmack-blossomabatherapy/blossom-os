import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, CalendarDays, Send, CheckCircle2, RotateCcw, FileDown, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { EvalStaff, Evaluation, EvalCycle, EvalMeeting, EvalNote } from "./types";
import { SelfBadge, LeadershipBadge, MeetingBadge, FinalBadge, fmtDate } from "./statusBadges";

interface Props {
  staff: EvalStaff | null;
  evaluations: Evaluation[];
  cycles: EvalCycle[];
  meetings: EvalMeeting[];
  notes: EvalNote[];
  onClose: () => void;
  onChanged: () => void;
}

function completionPct(e: Evaluation): number {
  let n = 0;
  if (e.self_status === "Completed") n++;
  if (e.leadership_status === "Completed") n++;
  if (e.meeting_status === "Completed") n++;
  if (e.final_status === "Complete") n++;
  return Math.round((n / 4) * 100);
}

export default function StaffProfileDrawer({ staff, evaluations, cycles, meetings, notes, onClose, onChanged }: Props) {
  const [noteText, setNoteText] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [working, setWorking] = useState(false);

  const open = !!staff;
  const current = useMemo(() => {
    if (!staff) return null;
    return evaluations
      .filter((e) => e.staff_id === staff.id && e.final_status !== "Complete")
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0] ?? null;
  }, [staff, evaluations]);
  const past = useMemo(() => {
    if (!staff) return [];
    return evaluations.filter((e) => e.staff_id === staff.id && e.final_status === "Complete");
  }, [staff, evaluations]);
  const cycleById = useMemo(() => Object.fromEntries(cycles.map((c) => [c.id, c])), [cycles]);
  const currentMeetings = current ? meetings.filter((m) => m.evaluation_id === current.id) : [];
  const staffNotes = current ? notes.filter((n) => n.evaluation_id === current.id) : [];

  async function startNewEvaluation(type: "Quarterly" | "Annual") {
    if (!staff) return;
    setWorking(true);
    const due = new Date();
    due.setDate(due.getDate() + (type === "Quarterly" ? 30 : 60));
    const { error } = await supabase.from("evaluations").insert({
      staff_id: staff.id,
      evaluation_type: type,
      next_review_date: due.toISOString().slice(0, 10),
      final_status: "In Progress",
    });
    setWorking(false);
    if (error) return toast({ title: "Could not create evaluation", description: error.message, variant: "destructive" });
    toast({ title: "Evaluation started", description: `${type} evaluation created for ${staff.first_name}.` });
    onChanged();
  }

  async function sendEmail(emailType: string, subject: string) {
    if (!staff || !current) return;
    setWorking(true);
    const body = `Hi ${staff.first_name},\n\nIt is time to complete your ${current.evaluation_type} ${emailType.toLowerCase()} for Blossom ABA Therapy.\n\nThank you,\nBlossom ABA Therapy`;
    const { error: emailErr } = await supabase.from("evaluation_emails").insert({
      evaluation_id: current.id,
      staff_id: staff.id,
      cycle_id: current.cycle_id,
      recipient_email: staff.email,
      email_type: emailType,
      subject,
      body,
      status: "Queued",
    });
    if (emailErr) {
      setWorking(false);
      return toast({ title: "Failed to queue email", description: emailErr.message, variant: "destructive" });
    }
    // mark status
    if (emailType === "Self Evaluation Request") {
      await supabase.from("evaluations").update({ self_status: "Sent" }).eq("id", current.id);
    } else if (emailType === "Leadership Evaluation Request") {
      await supabase.from("evaluations").update({ leadership_status: "In Progress" }).eq("id", current.id);
    }
    setWorking(false);
    toast({ title: "Email queued", description: "Email integration required to send — see Email Queue tab." });
    onChanged();
  }

  async function scheduleMeeting() {
    if (!staff || !current || !meetingDate) return;
    setWorking(true);
    await supabase.from("evaluation_meetings").insert({
      evaluation_id: current.id,
      meeting_date: new Date(meetingDate).toISOString(),
      meeting_status: "Scheduled",
    });
    await supabase.from("evaluations").update({ meeting_status: "Scheduled" }).eq("id", current.id);
    setWorking(false);
    setMeetingDate("");
    toast({ title: "Meeting scheduled" });
    onChanged();
  }

  async function markMeetingComplete() {
    if (!current) return;
    setWorking(true);
    const open = currentMeetings.find((m) => m.meeting_status === "Scheduled");
    if (open) {
      await supabase.from("evaluation_meetings").update({ meeting_status: "Completed", completed_at: new Date().toISOString() }).eq("id", open.id);
    }
    await supabase.from("evaluations").update({ meeting_status: "Completed" }).eq("id", current.id);
    setWorking(false);
    toast({ title: "Meeting marked complete" });
    onChanged();
  }

  async function completeEvaluation() {
    if (!current) return;
    setWorking(true);
    await supabase.from("evaluations").update({
      final_status: "Complete",
      completed_at: new Date().toISOString(),
    }).eq("id", current.id);
    setWorking(false);
    toast({ title: "Evaluation completed" });
    onChanged();
  }

  async function reopenEvaluation() {
    if (!current) return;
    setWorking(true);
    await supabase.from("evaluations").update({ final_status: "In Progress", completed_at: null }).eq("id", current.id);
    setWorking(false);
    toast({ title: "Evaluation reopened" });
    onChanged();
  }

  async function addNote() {
    if (!current || !noteText.trim()) return;
    setWorking(true);
    await supabase.from("evaluation_notes").insert({ evaluation_id: current.id, note: noteText.trim() });
    setWorking(false);
    setNoteText("");
    toast({ title: "Note added" });
    onChanged();
  }

  if (!staff) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center text-sm font-semibold">
              {staff.first_name[0]}{staff.last_name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">{staff.first_name} {staff.last_name}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {staff.role} · {staff.state ?? "—"} · Supervisor: {staff.supervisor_name ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{staff.email}</span>
            {staff.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{staff.phone}</span>}
            {staff.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{staff.state}</span>}
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />Hired {fmtDate(staff.hire_date)}</span>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Current Evaluation */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Current Evaluation</h3>
          {!current ? (
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">No active evaluation in progress.</p>
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="outline" onClick={() => startNewEvaluation("Quarterly")} disabled={working}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Start Quarterly
                </Button>
                <Button size="sm" variant="outline" onClick={() => startNewEvaluation("Annual")} disabled={working}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Start Annual
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/70 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium">{current.evaluation_type} Evaluation</p>
                  <p className="text-xs text-muted-foreground">
                    {current.cycle_id && cycleById[current.cycle_id] ? cycleById[current.cycle_id].name : "Ad-hoc cycle"}
                    {" · Due "}{fmtDate(current.next_review_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold tabular-nums">{completionPct(current)}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Complete</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Self</span><SelfBadge s={current.self_status} /></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Leadership</span><LeadershipBadge s={current.leadership_status} /></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Meeting</span><MeetingBadge s={current.meeting_status} /></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Final</span><FinalBadge s={current.final_status} /></div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => sendEmail("Self Evaluation Request", "Blossom ABA: Self Evaluation Needed")} disabled={working}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Send Self Eval
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => sendEmail("Leadership Evaluation Request", "Blossom ABA: Leadership Review Needed")} disabled={working}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Send Leadership
                  </Button>
                  <Button size="sm" variant="outline" onClick={markMeetingComplete} disabled={working || current.meeting_status === "Completed"}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Meeting Done
                  </Button>
                  <Button size="sm" variant="outline" onClick={completeEvaluation} disabled={working}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete Evaluation
                  </Button>
                  <Button size="sm" variant="ghost" onClick={reopenEvaluation} disabled={working}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reopen
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toast({ title: "PDF export coming soon" })}>
                    <FileDown className="h-3.5 w-3.5 mr-1" /> Download PDF
                  </Button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Input type="datetime-local" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="h-9" />
                  <Button size="sm" onClick={scheduleMeeting} disabled={working || !meetingDate}>Schedule Meeting</Button>
                </div>
              </div>
            </div>
          )}
        </section>

        <Separator className="my-4" />

        {/* Meeting notes */}
        {current && currentMeetings.length > 0 && (
          <section className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Meetings</h3>
            <ul className="space-y-2">
              {currentMeetings.map((m) => (
                <li key={m.id} className="rounded-lg border border-border/70 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{fmtDate(m.meeting_date)}</span>
                    <MeetingBadge s={m.meeting_status as any} />
                  </div>
                  {m.notes && <p className="text-muted-foreground mt-1">{m.notes}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Internal Notes */}
        <section className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Internal Notes</h3>
          <div className="space-y-2 mb-3">
            {staffNotes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
            {staffNotes.map((n) => (
              <div key={n.id} className="rounded-lg border border-border/70 p-3 text-xs">
                <p>{n.note}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(n.created_at)}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea rows={2} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note" />
            <Button size="sm" onClick={addNote} disabled={!current || !noteText.trim() || working}>Add</Button>
          </div>
          {!current && <p className="text-[10px] text-muted-foreground mt-1">Start an evaluation to add notes.</p>}
        </section>

        <Separator className="my-4" />

        {/* Past Evaluations */}
        <section>
          <h3 className="text-sm font-semibold mb-2">Past Evaluations</h3>
          {past.length === 0 ? (
            <p className="text-xs text-muted-foreground">No completed evaluations yet.</p>
          ) : (
            <ul className="divide-y divide-border/70 rounded-xl border border-border/70 overflow-hidden">
              {past.map((e) => (
                <li key={e.id} className="px-3 py-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium">{e.evaluation_type} · {e.cycle_id && cycleById[e.cycle_id] ? cycleById[e.cycle_id].name : "Ad-hoc"}</p>
                    <p className="text-muted-foreground">Completed {fmtDate(e.completed_at)}</p>
                  </div>
                  <FinalBadge s={e.final_status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </SheetContent>
    </Sheet>
  );
}