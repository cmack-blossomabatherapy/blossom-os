import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, CalendarDays, Send, CheckCircle2, RotateCcw, FileDown, Plus, Link2, BellRing, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { EvalStaff, Evaluation, EvalCycle, EvalMeeting, EvalNote, EvalEmailTemplate, EvalResponse } from "./types";
import { SelfBadge, LeadershipBadge, MeetingBadge, FinalBadge, fmtDate } from "./statusBadges";
import { createFormToken, queueEvaluationEmail, templateVars, buildFormUrl } from "./workflow";
import type { Permissions } from "./permissions";
import { logAudit, AUDIT_LABELS, type AuditEntry } from "./audit";
import { buildEvaluationSummaryHtml, openPrintableSummary } from "./pdf";

interface Props {
  staff: EvalStaff | null;
  evaluations: Evaluation[];
  cycles: EvalCycle[];
  meetings: EvalMeeting[];
  notes: EvalNote[];
  templates: EvalEmailTemplate[];
  responses: EvalResponse[];
  allStaff: EvalStaff[];
  audit: AuditEntry[];
  permissions: Permissions;
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

export default function StaffProfileDrawer({ staff, evaluations, cycles, meetings, notes, templates, responses, allStaff, audit, permissions, onClose, onChanged }: Props) {
  const [noteText, setNoteText] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingType, setMeetingType] = useState("Zoom");
  const [meetingLink, setMeetingLink] = useState("");
  const [working, setWorking] = useState(false);
  const [viewResponse, setViewResponse] = useState<EvalResponse | null>(null);

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
  const currentResponses = current ? responses.filter((r) => r.evaluation_id === current.id) : [];
  const reviewer = staff?.supervisor_id ? allStaff.find((s) => s.id === staff.supervisor_id) ?? null : null;
  const tplByKey = useMemo(() => Object.fromEntries(templates.map((t) => [t.template_key, t])), [templates]);
  const staffAudit = useMemo(() => (staff ? audit.filter((a) => a.staff_id === staff.id || (current && a.evaluation_id === current.id)) : []), [staff, audit, current]);

  async function startNewEvaluation(type: "Quarterly" | "Annual") {
    if (!staff) return;
    setWorking(true);
    const due = new Date();
    due.setDate(due.getDate() + (type === "Quarterly" ? 30 : 60));
    const { data: created, error } = await supabase.from("evaluations").insert({
      staff_id: staff.id,
      evaluation_type: type,
      next_review_date: due.toISOString().slice(0, 10),
      final_status: "In Progress",
    }).select().maybeSingle();
    setWorking(false);
    if (error) return toast({ title: "Could not create evaluation", description: error.message, variant: "destructive" });
    await logAudit({ evaluationId: created?.id, staffId: staff.id, action: "evaluation_created", details: { type } });
    toast({ title: "Evaluation started", description: `${type} evaluation created for ${staff.first_name}.` });
    onChanged();
  }

  async function generateLink(responseType: "Self" | "Leadership"): Promise<{ url: string } | null> {
    if (!staff || !current) return null;
    const recipient = responseType === "Self" ? staff.email : reviewer?.email ?? staff.email;
    const res = await createFormToken({
      evaluationId: current.id,
      responseType,
      recipientEmail: recipient,
    });
    if ("error" in res) {
      toast({ title: "Could not create link", description: res.error, variant: "destructive" });
      return null;
    }
    return { url: res.url };
  }

  async function copyLink(responseType: "Self" | "Leadership") {
    const r = await generateLink(responseType);
    if (!r) return;
    await navigator.clipboard.writeText(r.url);
    toast({ title: "Link copied", description: r.url });
    onChanged();
  }

  async function sendEmailFromTemplate(templateKey: "self_request" | "self_reminder" | "leadership_request" | "leadership_reminder" | "overdue_notice", responseType?: "Self" | "Leadership") {
    if (!staff || !current) return;
    const tpl = tplByKey[templateKey];
    if (!tpl) return toast({ title: "Template missing", variant: "destructive" });
    setWorking(true);
    let formLink: string | undefined;
    if (responseType) {
      const r = await generateLink(responseType);
      if (!r) { setWorking(false); return; }
      formLink = r.url;
    }
    const cycle = current.cycle_id ? cycles.find((c) => c.id === current.cycle_id) ?? null : null;
    const recipient = responseType === "Leadership" ? (reviewer?.email ?? staff.email) : staff.email;
    const vars = templateVars({ staff, reviewer, cycle, evaluation: current, formLink });
    const { error } = await queueEvaluationEmail({
      template: tpl,
      recipientEmail: recipient,
      evaluationId: current.id,
      staffId: staff.id,
      cycleId: current.cycle_id,
      vars,
    });
    if (error) {
      setWorking(false);
      return toast({ title: "Failed to queue email", description: error, variant: "destructive" });
    }
    if (templateKey === "self_request") {
      await supabase.from("evaluations").update({ self_status: "Sent", final_status: "In Progress" }).eq("id", current.id);
      await logAudit({ evaluationId: current.id, staffId: staff.id, action: "self_eval_sent" });
    } else if (templateKey === "leadership_request") {
      // Block leadership review before self complete unless override
      if (current.self_status !== "Completed" && !permissions.canOverrideRules) {
        setWorking(false);
        return toast({ title: "Self evaluation not complete", description: "Wait for self evaluation, or ask HR to override.", variant: "destructive" });
      }
      await supabase.from("evaluations").update({ leadership_status: "In Progress" }).eq("id", current.id);
      await logAudit({ evaluationId: current.id, staffId: staff.id, action: "leadership_review_sent", overrideReason: current.self_status !== "Completed" ? "HR override: self not yet complete" : undefined });
    } else if (templateKey === "self_reminder" || templateKey === "leadership_reminder" || templateKey === "overdue_notice") {
      await logAudit({ evaluationId: current.id, staffId: staff.id, action: "reminder_sent", details: { template: templateKey } });
    }
    setWorking(false);
    toast({ title: "Email queued", description: "See Email Queue tab. Connect email provider to deliver live." });
    onChanged();
  }

  async function scheduleMeeting() {
    if (!staff || !current || !meetingDate) return;
    setWorking(true);
    await supabase.from("evaluation_meetings").insert({
      evaluation_id: current.id,
      meeting_date: new Date(meetingDate).toISOString(),
      meeting_status: "Scheduled",
      meeting_type: meetingType,
      meeting_link: meetingLink || null,
    });
    await supabase.from("evaluations").update({ meeting_status: "Scheduled" }).eq("id", current.id);
    await logAudit({ evaluationId: current.id, staffId: staff.id, action: "meeting_scheduled", details: { date: meetingDate, type: meetingType } });
    setWorking(false);
    setMeetingDate("");
    setMeetingLink("");
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
    await logAudit({ evaluationId: current.id, staffId: staff?.id, action: "meeting_completed" });
    setWorking(false);
    toast({ title: "Meeting marked complete" });
    onChanged();
  }

  async function completeEvaluation() {
    if (!current) return;
    // Data quality: must have leadership review complete
    if (current.leadership_status !== "Completed" && !permissions.canOverrideRules) {
      return toast({ title: "Leadership review required", description: "Complete leadership review first, or ask HR to override.", variant: "destructive" });
    }
    if (current.meeting_status !== "Completed" && !permissions.canOverrideRules) {
      const reason = window.prompt("Meeting not marked complete. Enter override reason (or cancel):");
      if (!reason) return;
      await logAudit({ evaluationId: current.id, staffId: staff?.id, action: "override_used", overrideReason: reason, details: { step: "finalize_without_meeting" } });
    }
    if (!permissions.canFinalize) {
      return toast({ title: "Not authorized", description: "Your role cannot finalize evaluations.", variant: "destructive" });
    }
    setWorking(true);
    await supabase.from("evaluations").update({
      final_status: "Complete",
      completed_at: new Date().toISOString(),
    }).eq("id", current.id);
    await logAudit({ evaluationId: current.id, staffId: staff?.id, action: "evaluation_finalized" });
    // queue completion notice
    if (staff) {
      const tpl = tplByKey["completed_notice"];
      if (tpl) {
        const cycle = current.cycle_id ? cycles.find((c) => c.id === current.cycle_id) ?? null : null;
        const vars = templateVars({ staff, reviewer, cycle, evaluation: current });
        await queueEvaluationEmail({
          template: tpl, recipientEmail: staff.email,
          evaluationId: current.id, staffId: staff.id, cycleId: current.cycle_id, vars,
        });
      }
    }
    setWorking(false);
    toast({ title: "Evaluation completed" });
    onChanged();
  }

  async function reopenEvaluation() {
    if (!current) return;
    if (!permissions.canReopen) return toast({ title: "Not authorized", variant: "destructive" });
    setWorking(true);
    await supabase.from("evaluations").update({ final_status: "In Progress", completed_at: null }).eq("id", current.id);
    await logAudit({ evaluationId: current.id, staffId: staff?.id, action: "evaluation_reopened" });
    setWorking(false);
    toast({ title: "Evaluation reopened" });
    onChanged();
  }

  async function addNote() {
    if (!current || !noteText.trim()) return;
    setWorking(true);
    await supabase.from("evaluation_notes").insert({ evaluation_id: current.id, note: noteText.trim() });
    await logAudit({ evaluationId: current.id, staffId: staff?.id, action: "note_added" });
    setWorking(false);
    setNoteText("");
    toast({ title: "Note added" });
    onChanged();
  }

  function downloadSummary(evaluation: Evaluation) {
    if (!staff) return;
    const cycle = evaluation.cycle_id ? cycles.find((c) => c.id === evaluation.cycle_id) ?? null : null;
    const evalMeetings = meetings.filter((m) => m.evaluation_id === evaluation.id);
    const evalNotes = notes.filter((n) => n.evaluation_id === evaluation.id);
    const evalResponses = responses.filter((r) => r.evaluation_id === evaluation.id);
    const html = buildEvaluationSummaryHtml({ staff, evaluation, cycle, reviewer, meetings: evalMeetings, notes: evalNotes, responses: evalResponses });
    openPrintableSummary(html);
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
                  <Button size="sm" variant="outline" onClick={() => sendEmailFromTemplate("self_request", "Self")} disabled={working}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Send Self Eval
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => sendEmailFromTemplate("leadership_request", "Leadership")} disabled={working}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Send Leadership
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => copyLink("Self")} disabled={working}>
                    <Link2 className="h-3.5 w-3.5 mr-1" /> Copy Self Link
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => copyLink("Leadership")} disabled={working}>
                    <Link2 className="h-3.5 w-3.5 mr-1" /> Copy Leadership Link
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => sendEmailFromTemplate("self_reminder", "Self")} disabled={working}>
                    <BellRing className="h-3.5 w-3.5 mr-1" /> Self Reminder
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => sendEmailFromTemplate("leadership_reminder", "Leadership")} disabled={working}>
                    <BellRing className="h-3.5 w-3.5 mr-1" /> Leadership Reminder
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

                <div className="pt-2 space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Schedule Meeting</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="datetime-local" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="h-9" />
                    <Select value={meetingType} onValueChange={setMeetingType}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="Zoom">Zoom</SelectItem>
                        <SelectItem value="Teams">Teams</SelectItem>
                        <SelectItem value="In Person">In Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Meeting link (optional)" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className="h-9" />
                    <Button size="sm" onClick={scheduleMeeting} disabled={working || !meetingDate}>Schedule</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Responses */}
        {current && currentResponses.length > 0 && (
          <>
            <Separator className="my-4" />
            <section>
              <h3 className="text-sm font-semibold mb-2">Evaluation Responses</h3>
              <ul className="space-y-2">
                {currentResponses.map((r) => (
                  <li key={r.id} className="rounded-lg border border-border/70 p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-medium">{r.response_type} Evaluation</p>
                      <p className="text-muted-foreground">Submitted {fmtDate(r.submitted_at)} by {r.respondent_email ?? "—"}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setViewResponse(r)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

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
                  {(m as any).meeting_type && (
                    <p className="text-muted-foreground mt-1">{(m as any).meeting_type}{(m as any).meeting_link ? ` · ${(m as any).meeting_link}` : ""}</p>
                  )}
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

      <Dialog open={!!viewResponse} onOpenChange={(o) => !o && setViewResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewResponse?.response_type} Evaluation Response</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            {viewResponse && Object.entries(viewResponse.answers_json ?? {}).map(([k, v]) => (
              <div key={k} className="rounded-lg border p-2">
                <p className="text-[11px] text-muted-foreground">{k.replace(/^(rating|text)::/, "").replace(/::/g, " · ")}</p>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{String(v)}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}