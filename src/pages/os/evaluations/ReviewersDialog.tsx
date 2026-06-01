import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Send, Link2, BellRing, Trash2, CheckCircle2, Clock, Mail, X } from "lucide-react";
import type { EvalStaff, Evaluation, EvalEmailTemplate, EvalReviewer, ReviewerStatus } from "./types";
import { createFormToken, queueEvaluationEmail, templateVars } from "./workflow";
import { logAudit } from "./audit";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  staff: EvalStaff;
  evaluation: Evaluation;
  reviewers: EvalReviewer[];
  allStaff: EvalStaff[];
  templates: EvalEmailTemplate[];
  canOverrideRules: boolean;
  onChanged: () => void;
}

function StatusBadge({ s }: { s: ReviewerStatus }) {
  const map: Record<ReviewerStatus, { label: string; cls: string; Icon: any }> = {
    "Not Sent": { label: "Not Sent", cls: "bg-muted text-muted-foreground", Icon: Clock },
    Sent: { label: "Sent", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", Icon: Mail },
    "In Progress": { label: "In Progress", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300", Icon: Clock },
    Completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", Icon: CheckCircle2 },
    Declined: { label: "Declined", cls: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300", Icon: X },
  };
  const { label, cls, Icon } = map[s];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export default function ReviewersDialog({
  open, onOpenChange, staff, evaluation, reviewers, allStaff, templates, canOverrideRules, onChanged,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [externalEmail, setExternalEmail] = useState("");
  const [externalName, setExternalName] = useState("");
  const [working, setWorking] = useState(false);

  const tplByKey = useMemo(() => Object.fromEntries(templates.map((t) => [t.template_key, t])), [templates]);

  const evalReviewers = useMemo(
    () => reviewers.filter((r) => r.evaluation_id === evaluation.id),
    [reviewers, evaluation.id]
  );
  const assignedEmails = useMemo(() => new Set(evalReviewers.map((r) => r.reviewer_email.toLowerCase())), [evalReviewers]);

  const candidates = useMemo(
    () => allStaff
      .filter((s) => s.active_status && s.id !== staff.id && !assignedEmails.has(s.email.toLowerCase()))
      .sort((a, b) => a.last_name.localeCompare(b.last_name)),
    [allStaff, staff.id, assignedEmails]
  );

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

  async function addReviewer(opts: { staff_id?: string | null; email: string; name?: string | null }) {
    const email = opts.email.trim().toLowerCase();
    if (!email) return;
    if (assignedEmails.has(email)) {
      toast({ title: "Already assigned", description: email });
      return;
    }
    const { error } = await supabase.from("evaluation_reviewers").insert({
      evaluation_id: evaluation.id,
      reviewer_staff_id: opts.staff_id ?? null,
      reviewer_email: email,
      reviewer_name: opts.name ?? null,
      status: "Not Sent",
    });
    if (error) return toast({ title: "Could not add reviewer", description: error.message, variant: "destructive" });
    onChanged();
  }

  async function addExternal() {
    if (!externalEmail.trim()) return;
    await addReviewer({ email: externalEmail, name: externalName || null });
    setExternalEmail("");
    setExternalName("");
  }

  async function sendInvite(r: EvalReviewer, kind: "leadership_request" | "leadership_reminder") {
    if (kind === "leadership_request" && evaluation.self_status !== "Completed" && !canOverrideRules) {
      return toast({ title: "Self evaluation not complete", description: "Wait for self evaluation, or ask HR to override.", variant: "destructive" });
    }
    const tpl = tplByKey[kind];
    if (!tpl) return toast({ title: "Email template missing", variant: "destructive" });
    setWorking(true);
    const tok = await createFormToken({
      evaluationId: evaluation.id,
      responseType: "Leadership",
      recipientEmail: r.reviewer_email,
    });
    if ("error" in tok) {
      setWorking(false);
      return toast({ title: "Could not create link", description: tok.error, variant: "destructive" });
    }
    const reviewerObj = r.reviewer_name ? { first_name: r.reviewer_name.split(" ")[0] ?? "", last_name: r.reviewer_name.split(" ").slice(1).join(" ") } : null;
    const vars = templateVars({ staff, reviewer: reviewerObj, evaluation, formLink: tok.url });
    const { error: qerr } = await queueEvaluationEmail({
      template: tpl, recipientEmail: r.reviewer_email, evaluationId: evaluation.id, staffId: staff.id, vars,
    });
    if (qerr) { setWorking(false); return toast({ title: "Failed to queue email", description: qerr, variant: "destructive" }); }

    if (kind === "leadership_request") {
      await supabase.from("evaluation_reviewers")
        .update({ status: "Sent", sent_at: new Date().toISOString() })
        .eq("id", r.id);
      await logAudit({ evaluationId: evaluation.id, staffId: staff.id, action: "leadership_review_sent", details: { reviewer: r.reviewer_email }, overrideReason: evaluation.self_status !== "Completed" ? "HR override: self not yet complete" : undefined });
    } else {
      await logAudit({ evaluationId: evaluation.id, staffId: staff.id, action: "reminder_sent", details: { reviewer: r.reviewer_email, template: kind } });
    }
    setWorking(false);
    toast({ title: "Email queued", description: `Leadership ${kind === "leadership_reminder" ? "reminder" : "request"} sent to ${r.reviewer_email}.` });
    onChanged();
  }

  async function sendToAllPending() {
    const pending = evalReviewers.filter((r) => r.status === "Not Sent");
    if (pending.length === 0) return toast({ title: "All reviewers already sent" });
    for (const r of pending) await sendInvite(r, "leadership_request");
  }

  async function copyLink(r: EvalReviewer) {
    const tok = await createFormToken({
      evaluationId: evaluation.id,
      responseType: "Leadership",
      recipientEmail: r.reviewer_email,
    });
    if ("error" in tok) return toast({ title: "Could not create link", description: tok.error, variant: "destructive" });
    await navigator.clipboard.writeText(tok.url);
    toast({ title: "Link copied", description: tok.url });
  }

  async function removeReviewer(r: EvalReviewer) {
    if (r.status === "Completed") {
      return toast({ title: "Cannot remove", description: "This reviewer has already submitted a response.", variant: "destructive" });
    }
    const { error } = await supabase.from("evaluation_reviewers").delete().eq("id", r.id);
    if (error) return toast({ title: "Could not remove", description: error.message, variant: "destructive" });
    toast({ title: "Reviewer removed" });
    onChanged();
  }

  const pendingCount = evalReviewers.filter((r) => r.status === "Not Sent").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Leadership Reviewers</DialogTitle>
          <DialogDescription>
            Assign one or more reviewers to evaluate {staff.first_name} {staff.last_name}'s {evaluation.evaluation_type.toLowerCase()} review.
            The evaluation completes when every reviewer submits their response.
          </DialogDescription>
        </DialogHeader>

        {/* Add reviewer row */}
        <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add staff reviewer
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search staff…" />
                  <CommandList>
                    <CommandEmpty>No matching staff.</CommandEmpty>
                    <CommandGroup>
                      {candidates.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.first_name} ${c.last_name} ${c.email}`}
                          onSelect={async () => {
                            await addReviewer({ staff_id: c.id, email: c.email, name: `${c.first_name} ${c.last_name}` });
                            setPickerOpen(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm">{c.first_name} {c.last_name}</span>
                            <span className="text-[11px] text-muted-foreground">{c.role}{c.state ? ` · ${c.state}` : ""} · {c.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Badge variant="secondary" className="ml-auto">{evalReviewers.length} reviewer{evalReviewers.length === 1 ? "" : "s"}</Badge>
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input placeholder="External name (optional)" value={externalName} onChange={(e) => setExternalName(e.target.value)} className="h-9 rounded-xl bg-background" />
            <Input type="email" placeholder="external.reviewer@example.com" value={externalEmail} onChange={(e) => setExternalEmail(e.target.value)} className="h-9 rounded-xl bg-background" />
            <Button size="sm" variant="outline" className="h-9 rounded-xl" onClick={addExternal} disabled={!externalEmail.trim()}>Add</Button>
          </div>
        </div>

        {/* Reviewer list */}
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {evalReviewers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No reviewers assigned yet. Add one above to get started.</p>
          ) : (
            evalReviewers.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/60 bg-card p-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{r.reviewer_name || r.reviewer_email}</p>
                    <StatusBadge s={r.status} />
                  </div>
                  <p className="text-[11.5px] text-muted-foreground truncate">{r.reviewer_email}</p>
                  <p className="text-[10.5px] text-muted-foreground mt-0.5">
                    {r.status === "Completed"
                      ? `Completed ${fmt(r.completed_at)}`
                      : r.sent_at
                        ? `Sent ${fmt(r.sent_at)}`
                        : "Not yet sent"}
                  </p>
                </div>
                <TooltipProvider delayDuration={150}>
                  <div className="flex items-center gap-1">
                    {r.status === "Not Sent" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="default" className="h-8 rounded-lg px-2.5" onClick={() => sendInvite(r, "leadership_request")} disabled={working}>
                            <Send className="h-3.5 w-3.5 mr-1" /> Send
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send leadership review request</TooltipContent>
                      </Tooltip>
                    ) : r.status !== "Completed" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg p-0" onClick={() => sendInvite(r, "leadership_reminder")} disabled={working}>
                            <BellRing className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send reminder</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg p-0" onClick={() => copyLink(r)} disabled={working}>
                          <Link2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy review link</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg p-0 text-destructive hover:text-destructive" onClick={() => removeReviewer(r)} disabled={working || r.status === "Completed"}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            ))
          )}
        </div>

        {pendingCount > 0 && (
          <div className="flex justify-end">
            <Button size="sm" className="rounded-xl" onClick={sendToAllPending} disabled={working}>
              <Send className="h-3.5 w-3.5 mr-1.5" /> Send to all pending ({pendingCount})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}