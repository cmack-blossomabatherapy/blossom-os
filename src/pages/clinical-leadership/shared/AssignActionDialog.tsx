import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ExceptionRow } from "./types";

export function AssignActionDialog({
  row, open, onOpenChange, scopeKey,
}: {
  row: ExceptionRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scopeKey: string;
}) {
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!row) return;
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const creator = userRes.user?.id ?? null;
      let assigneeId: string | null = null;
      if (assigneeEmail.trim()) {
        const { data: emp } = await supabase
          .from("employees")
          .select("id, profile_id")
          .eq("email", assigneeEmail.trim())
          .maybeSingle();
        assigneeId = (emp as any)?.profile_id ?? null;
      }
      const { error } = await supabase.from("user_tasks").insert({
        title: `[${scopeKey}] ${row.title}`,
        description: [row.subtitle, note].filter(Boolean).join("\n\n") || null,
        priority: row.severity === "critical" ? "high" : row.severity ?? "medium",
        status: "open",
        created_by: creator,
        assigned_to: assigneeId ?? creator,
        due_date: row.dueDate ?? null,
        related_entity_type: scopeKey,
        related_entity_id: row.id,
      } as any);
      if (error) throw error;
      toast.success("Task created");
      onOpenChange(false);
      setAssigneeEmail("");
      setNote("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign action</DialogTitle></DialogHeader>
        {row && (
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium">{row.title}</div>
              {row.subtitle && <div className="text-muted-foreground text-xs mt-0.5">{row.subtitle}</div>}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Assignee email (leave blank to self-assign)</div>
              <Input value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)} placeholder="person@company.com" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Note</div>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Assigning…" : "Create task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}