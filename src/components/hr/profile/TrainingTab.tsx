import { useEffect, useState } from "react";
import { GraduationCap, Plus, ExternalLink, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateView } from "@/components/shared/StateView";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  TRAINING_STATUS_META,
  type Employee, type EmployeeTraining, type TrainingCourse, type TrainingStatus,
} from "@/lib/hr/types";

type Row = EmployeeTraining & { course: Pick<TrainingCourse, "name" | "category" | "provider" | "external_url"> | null };

export function TrainingTab({ employee }: { employee: Employee }) {
  const { hasPerm, user } = useAuth();
  const canAssign = hasPerm("hr.training.assign");
  const [items, setItems] = useState<Row[]>([]);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    setError(null);
    const [a, b] = await Promise.all([
      supabase.from("employee_trainings").select("*, course:training_courses(name, category, provider, external_url)").eq("employee_id", employee.id).order("assigned_at", { ascending: false }),
      supabase.from("training_courses").select("*").eq("is_active", true).order("name"),
    ]);
    if (a.error || b.error) { setError((a.error || b.error)!.message); setLoading(false); return; }
    setItems((a.data ?? []) as unknown as Row[]);
    setCourses((b.data ?? []) as TrainingCourse[]);
    setLoading(false);
  }

  async function assign() {
    if (!courseId) { toast.error("Pick a course."); return; }
    const { error } = await supabase.from("employee_trainings").insert({
      employee_id: employee.id, course_id: courseId, status: "assigned",
      due_date: dueDate || null, assigned_by: user?.id ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Training assigned.");
    setOpen(false); setCourseId(""); setDueDate("");
    void load();
  }

  async function update(id: string, patch: Partial<EmployeeTraining>) {
    const { error } = await supabase.from("employee_trainings").update(patch).eq("id", id);
    if (error) toast.error(error.message); else void load();
  }

  async function markComplete(row: Row) {
    const renewal = courses.find((c) => c.id === row.course_id)?.renewal_months;
    const expires = renewal ? new Date(Date.now() + renewal * 30 * 86400000).toISOString().slice(0, 10) : null;
    await update(row.id, { status: "completed", completed_at: new Date().toISOString(), expires_on: expires });
  }

  return (
    <Card className="glass-surface border-0 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Training & Certifications</h3>
            <p className="text-xs text-muted-foreground">{items.length} assignment{items.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        {canAssign && <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Assign training</Button>}
      </div>

      {loading ? (
        <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
      ) : error ? (
        <StateView variant="error" compact title="Couldn't load trainings" description={error} onRetry={load} />
      ) : items.length === 0 ? (
        <StateView
          variant="empty"
          compact
          icon={GraduationCap}
          title="No trainings assigned"
          description="When this employee is assigned a course it will show up here."
          action={canAssign ? <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Assign training</Button> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div key={t.id} className="p-3 rounded-xl border border-border/40 bg-background/50 backdrop-blur-sm transition hover:bg-background/70">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", TRAINING_STATUS_META[t.status].tone)}>
                      {TRAINING_STATUS_META[t.status].label}
                    </span>
                    <p className="text-sm font-medium text-foreground">{t.course?.name ?? "Unknown course"}</p>
                    {t.course?.external_url && (
                      <a href={t.course.external_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline">
                        <ExternalLink className="h-3 w-3" /> Launch
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t.course?.category ?? "Training"}
                    {t.course?.provider ? ` · ${t.course.provider}` : ""}
                    {t.due_date ? ` · Due ${t.due_date}` : ""}
                    {t.expires_on ? ` · Expires ${t.expires_on}` : ""}
                    {t.score != null ? ` · Score ${t.score}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {canAssign && (
                    <Select value={t.status} onValueChange={(v) => update(t.id, { status: v as TrainingStatus })}>
                      <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="waived">Waived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {t.status !== "completed" && (
                    <Button size="sm" variant="ghost" onClick={() => markComplete(t)}>
                      <Check className="h-3.5 w-3.5" /> Mark complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign training</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder="Pick a course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={assign}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}