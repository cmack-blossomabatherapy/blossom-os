import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * QA Pass 5 — replaces window.prompt() for bulk operations on the QA queue.
 * Single component, multiple variants. Caller passes the variant + onSubmit.
 */
export type QABulkVariant =
  | { kind: "assign"; defaultValue?: string }
  | { kind: "followUp"; defaultValue?: string }
  | { kind: "escalate"; defaultValue?: string }
  | { kind: "markReviewed" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: QABulkVariant | null;
  selectedCount: number;
  busy?: boolean;
  /** Called with the user's input string (or "" for confirmation-only variants). */
  onSubmit: (value: string) => Promise<void> | void;
}

const COPY: Record<QABulkVariant["kind"], {
  title: string; description: string; cta: string; placeholder?: string; useTextarea?: boolean;
}> = {
  assign:       { title: "Assign QA owner",        description: "Assign or clear the QA owner on the selected items.", cta: "Assign owner", placeholder: "QA owner name (leave empty to clear)" },
  followUp:     { title: "Send follow-up",         description: "Send a follow-up note to BCBAs on the selected items.", cta: "Send follow-up", placeholder: "Follow-up note", useTextarea: true },
  escalate:     { title: "Escalate to leadership", description: "Escalate the selected items with a documented reason.", cta: "Escalate", placeholder: "Escalation reason", useTextarea: true },
  markReviewed: { title: "Mark reviewed",          description: "Move the selected items into the QA review workflow.", cta: "Mark reviewed" },
};

export function QABulkActionDialog({ open, onOpenChange, variant, selectedCount, busy, onSubmit }: Props) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!variant) return;
    setValue(
      variant.kind === "markReviewed"
        ? ""
        : (variant as { defaultValue?: string }).defaultValue ?? "",
    );
  }, [variant, open]);

  if (!variant) return null;
  const copy = COPY[variant.kind];
  const requiresInput = variant.kind === "followUp" || variant.kind === "escalate";
  const submitDisabled = !!busy || (requiresInput && value.trim().length === 0);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {copy.description} <span className="font-medium text-foreground">{selectedCount} item{selectedCount === 1 ? "" : "s"} selected.</span>
          </DialogDescription>
        </DialogHeader>

        {variant.kind === "markReviewed" ? null : copy.useTextarea ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={copy.placeholder}
            rows={4}
            autoFocus
            disabled={busy}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={copy.placeholder}
            autoFocus
            disabled={busy}
          />
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            onClick={() => { void onSubmit(value.trim()); }}
            disabled={submitDisabled}
          >
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {copy.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default QABulkActionDialog;