import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Employee } from "@/lib/hr/types";

interface Note { id: string; body: string; visibility: string; author_name: string | null; created_at: string }

export function NotesTab({ employee }: { employee: Employee }) {
  const { hasPerm, user } = useAuth();
  const canWrite = hasPerm("hr.notes.manage");
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("employee_notes")
      .select("id, body, visibility, author_name, created_at")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false });
    setNotes((data ?? []) as Note[]);
    setLoading(false);
  }

  async function add() {
    if (!body.trim()) return;
    const { error } = await supabase.from("employee_notes").insert({
      employee_id: employee.id,
      body: body.trim(),
      visibility: "hr_only",
      author_id: user?.id ?? null,
      author_name: user?.email?.split("@")[0] ?? "HR",
    });
    if (error) { toast.error(error.message); return; }
    setBody(""); toast.success("Note added."); void load();
  }

  return (
    <Card className="p-4 space-y-4">
      {canWrite && (
        <div className="space-y-2">
          <Textarea placeholder="Add an HR-only note…" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          <div className="flex justify-end"><Button size="sm" onClick={add}>Add note</Button></div>
        </div>
      )}
      {loading ? <Skeleton className="h-20" /> : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="p-3 rounded-lg bg-secondary/30 border border-border/40">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>{n.author_name ?? "HR"}</span>
                <span>{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}