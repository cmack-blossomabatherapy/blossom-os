import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  leadName?: string;
  onSaved?: () => void;
}

export function AddLeadNoteDialog({ open, onOpenChange, leadId, leadName, onSaved }: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!body.trim()) {
      toast.error("Note can't be empty");
      return;
    }
    if (!UUID_RE.test(leadId)) {
      toast.error("This lead isn't synced to the database yet.");
      return;
    }
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const name =
        (userRes.user?.user_metadata?.full_name as string | undefined) ||
        userRes.user?.email ||
        "Intake";
      const { error } = await supabase.from("intake_communications").insert({
        lead_id: leadId,
        communication_type: "note",
        direction: "internal",
        subject: subject.trim() || null,
        preview: body.trim(),
        logged_by_name: name,
      } as never);
      if (error) throw error;
      toast.success("Note added");
      setSubject("");
      setBody("");
      onOpenChange(false);
      onSaved?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add note{leadName ? ` — ${leadName}` : ""}</DialogTitle>
          <DialogDescription>Logged to the lead's activity timeline.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Subject (optional)</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Parent callback preference" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Note</label>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What happened? Any next steps?" autoFocus />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save note"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}