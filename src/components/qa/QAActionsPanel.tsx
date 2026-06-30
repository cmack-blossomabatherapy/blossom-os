import { useState } from "react";
import {
  CheckCircle2, Send, StickyNote, UserCheck, Flame,
  ArrowRightCircle, ListChecks, FileWarning, ClipboardCheck,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Authorization } from "@/data/authorizations";
import { useQAWorkflow } from "@/hooks/useQAWorkflow";
import { toQAWorkItemRef } from "@/lib/os/qa/qaRefs";

type Tone = "ok" | "warn" | "crit";

export type QAVariant =
  | "queue"
  | "auth-review"
  | "missing-info"
  | "expiring"
  | "progress"
  | "treatment-plan"
  | "default";

interface Props {
  auth: Authorization;
  variant?: QAVariant;
  sourceSystem?: "monday" | "manual" | "centralreach";
  onChanged?: () => void | Promise<void>;
  className?: string;
}

/**
 * Reusable QA actions grid wired to `useQAWorkflow`.
 *
 * Every action persists to `qa_work_item_overrides` (or `client_qa_reviews`
 * when a real `clients.id` is known), refreshes overlay state, and emits a
 * toast. Use inside QA detail drawers / slideouts where placeholder
 * `<ActionBtn />` grids used to live.
 */
export function QAActionsPanel({ auth, variant = "default", sourceSystem, onChanged, className }: Props) {
  const wf = useQAWorkflow();
  const ref = toQAWorkItemRef(auth, sourceSystem);
  const [note, setNote] = useState("");
  const [owner, setOwner] = useState(auth.qaOwner ?? "");
  const [reason, setReason] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [open, setOpen] = useState<null | "note" | "assign" | "escalate" | "follow">(null);
  const [pending, setPending] = useState(false);

  async function run(p: Promise<unknown> | null | undefined) {
    if (pending) return;
    setPending(true);
    try {
      await p;
      await onChanged?.();
    } finally {
      setPending(false);
    }
  }

  const showMarkReviewed   = ["queue","auth-review","treatment-plan","default"].includes(variant);
  const showMoveToSub      = ["auth-review","treatment-plan","expiring"].includes(variant);
  const showRequestMissing = ["auth-review","treatment-plan","missing-info"].includes(variant);
  const showMarkResolved   = variant === "missing-info";
  const showMarkPRReceived = ["progress","expiring"].includes(variant);

  return (
    <>
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        {showMarkReviewed && (
          <Btn icon={CheckCircle2} label="Mark reviewed" disabled={pending}
            onClick={() => run(wf.markReadyForSubmission(ref))} />
        )}
        {showMarkPRReceived && (
          <Btn icon={CheckCircle2} label="Mark PR received" disabled={pending}
            onClick={() => run(wf.addNote(ref, "Progress Report received"))} />
        )}
        {showMoveToSub && (
          <Btn icon={ArrowRightCircle} label="Submit to Auth" disabled={pending}
            onClick={() => run(wf.submitToAuth(ref))} />
        )}
        {showRequestMissing && (
          <Btn icon={showRequestMissing && variant === "missing-info" ? ListChecks : FileWarning}
            label="Request missing info" disabled={pending}
            onClick={() => run(wf.markIssuesFound(ref, ["Missing information requested"]))} />
        )}
        {showMarkResolved && (
          <Btn icon={ClipboardCheck} label="Mark resolved" disabled={pending}
            onClick={() => run(wf.resolveMissingInfo(ref))} />
        )}
        <Btn icon={Send} label="Send follow-up" disabled={pending} onClick={() => setOpen("follow")} />
        <Btn icon={StickyNote} label="Add QA note" disabled={pending} onClick={() => setOpen("note")} />
        <Btn icon={UserCheck} label="Assign owner" disabled={pending} onClick={() => setOpen("assign")} />
        <Btn icon={Flame} label="Escalate" tone="crit" disabled={pending} onClick={() => setOpen("escalate")} />
      </div>

      <Dialog open={open === "note"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add QA note</DialogTitle></DialogHeader>
          <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for this work item…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
            <Button disabled={!note.trim() || pending} onClick={async () => { await run(wf.addNote(ref, note.trim())); setNote(""); setOpen(null); }}>Save note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "assign"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign QA owner</DialogTitle></DialogHeader>
          <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
            <Button disabled={pending} onClick={async () => { await run(wf.assignOwner(ref, owner.trim() || null)); setOpen(null); }}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "escalate"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Escalate</DialogTitle></DialogHeader>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Escalation reason…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!reason.trim() || pending} onClick={async () => { await run(wf.escalate(ref, reason.trim())); setReason(""); setOpen(null); }}>Escalate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "follow"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send follow-up</DialogTitle></DialogHeader>
          <Textarea rows={4} value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="What follow-up is needed?" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
            <Button disabled={!followUp.trim() || pending} onClick={async () => { await run(wf.sendFollowUp(ref, followUp.trim())); setFollowUp(""); setOpen(null); }}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Btn({ icon: Icon, label, tone, onClick, disabled }: { icon: React.ElementType; label: string; tone?: Tone; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-9 px-3 rounded-xl text-xs font-medium border transition inline-flex items-center justify-center gap-1.5",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        tone === "crit"
          ? "border-destructive/20 text-destructive hover:bg-destructive/5"
          : "border-border/70 text-foreground bg-card hover:bg-muted",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
    </button>
  );
}