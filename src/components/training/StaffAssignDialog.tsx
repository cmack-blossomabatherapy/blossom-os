import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Employee = { id: string; first_name: string; last_name: string; job_title: string | null; department_id: string | null; status: string | null };
export type AssignKind = "training" | "academy";

export function StaffAssignDialog({
  open, onClose, trackId, trackName, kind, onAssigned,
}: {
  open: boolean; onClose: () => void; trackId: string | null; trackName: string;
  kind: AssignKind; onAssigned?: () => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !trackId) return;
    setSelected({}); setSearch(""); setDueDate("");
    void load();
  }, [open, trackId]);

  async function load() {
    const [emps, existing] = await Promise.all([
      supabase.from("employees").select("id,first_name,last_name,job_title,department_id,status").order("first_name"),
      kind === "training"
        ? supabase.from("training_track_enrollments").select("employee_id").eq("track_id", trackId!)
        : supabase.from("academy_enrollments").select("employee_id").eq("track_id", trackId!),
    ]);
    setEmployees((emps.data ?? []) as Employee[]);
    setEnrolled(new Set((existing.data ?? []).map((r: any) => r.employee_id)));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return employees.filter((e) => {
      if (e.status === "terminated" || e.status === "resigned") return false;
      if (!q) return true;
      return `${e.first_name} ${e.last_name} ${e.job_title ?? ""}`.toLowerCase().includes(q);
    });
  }, [employees, search]);

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  async function assign() {
    if (selectedIds.length === 0 || !trackId) return;
    setBusy(true);
    try {
      if (kind === "training") {
        const rows = selectedIds.map((eid) => ({
          track_id: trackId, employee_id: eid, due_date: dueDate || null, status: "assigned",
        }));
        const { error } = await supabase.from("training_track_enrollments").upsert(rows, { onConflict: "track_id,employee_id" });
        if (error) throw error;
      } else {
        const rows = selectedIds.map((eid) => ({
          track_id: trackId, employee_id: eid, status: "active" as const,
        }));
        const { error } = await supabase.from("academy_enrollments").upsert(rows as any, { onConflict: "track_id,employee_id" } as any);
        if (error) throw error;
      }
      toast.success(`Assigned ${selectedIds.length} staff to ${trackName}.`);
      onAssigned?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Assign staff to track</DialogTitle>
          <DialogDescription>{trackName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees…" className="pl-9 h-9" />
          </div>
          {kind === "training" && (
            <div><Label>Due date (optional)</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          )}
          <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40">
            {filtered.map((e) => {
              const isEnrolled = enrolled.has(e.id);
              const checked = !!selected[e.id];
              return (
                <label key={e.id} className={cn("flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30", isEnrolled && "opacity-60")}>
                  <Checkbox checked={checked || isEnrolled} disabled={isEnrolled}
                    onCheckedChange={(v) => setSelected({ ...selected, [e.id]: !!v })} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{e.first_name} {e.last_name}</p>
                    <p className="text-[11px] text-muted-foreground">{e.job_title ?? "—"}</p>
                  </div>
                  {isEnrolled && <Badge variant="secondary" className="text-[10px]">Already enrolled</Badge>}
                </label>
              );
            })}
            {filtered.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No staff match.</p>}
          </div>
          <p className="text-[11px] text-muted-foreground">{selectedIds.length} selected</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={assign} disabled={busy || selectedIds.length === 0}>Assign {selectedIds.length || ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
