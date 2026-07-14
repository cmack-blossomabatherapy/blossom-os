import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IntakeCoordinatorPicker } from "@/components/leads/IntakeCoordinatorPicker";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  leadName?: string;
  defaultOwner?: string;
  /** "task" (default) or "follow_up". Users can flip inside the dialog. */
  mode?: "task" | "follow_up";
  onSaved?: () => void;
}

export function CreateLeadTaskDialog({ open, onOpenChange, leadId, leadName, defaultOwner, mode = "task", onSaved }: Props) {
  const [kind, setKind] = useState<"task" | "follow_up">(mode);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<string>(defaultOwner ?? "");
  const [due, setDue] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + (mode === "follow_up" ? 2 : 1));
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setKind(mode);
      setTitle("");
      setOwner(defaultOwner ?? "");
      const d = new Date();
      d.setDate(d.getDate() + (mode === "follow_up" ? 2 : 1));
      setDue(d.toISOString().slice(0, 10));
      setNotes("");
    }
  }, [open, mode, defaultOwner]);

  const save = async () => {
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    if (!UUID_RE.test(leadId)) {
      toast.error("This lead isn't synced yet.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("intake_tasks").insert({
        lead_id: leadId,
        task_type: kind === "follow_up" ? "follow_up" : "task",
        title: title.trim(),
        owner: owner || null,
        due_date: due || null,
        notes: notes.trim() || null,
        status: "Open",
      } as never);
      if (error) throw error;
      // also log to activity
      await supabase.from("intake_communications").insert({
        lead_id: leadId,
        communication_type: "note",
        direction: "internal",
        subject: kind === "follow_up" ? "Follow-up scheduled" : "Task created",
        preview: `${title.trim()}${owner ? ` — assigned to ${owner}` : ""}${due ? ` (due ${due})` : ""}`,
        logged_by_name: owner || "Intake",
      } as never);
      toast.success(kind === "follow_up" ? "Follow-up scheduled" : "Task created");
      onOpenChange(false);
      onSaved?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {kind === "follow_up" ? "Create follow-up" : "Create task"}
            {leadName ? ` — ${leadName}` : ""}
          </DialogTitle>
          <DialogDescription>Assign to an intake teammate and set a due date.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setKind("task")}
              className={`h-8 px-3 rounded-full text-xs font-medium border ${kind === "task" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent"}`}
            >
              Task
            </button>
            <button
              type="button"
              onClick={() => setKind("follow_up")}
              className={`h-8 px-3 rounded-full text-xs font-medium border ${kind === "follow_up" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent"}`}
            >
              Follow-up
            </button>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "follow_up" ? "Call parent about intake packet" : "Confirm insurance details"} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Assign to</label>
              <IntakeCoordinatorPicker value={owner} onChange={(name) => setOwner(name)} placeholder="Unassigned" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Due date</label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : kind === "follow_up" ? "Schedule follow-up" : "Create task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}