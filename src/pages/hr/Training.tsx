import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Search, Plus, AlertTriangle, CalendarClock, CheckCircle2, ListChecks } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { GlassStat } from "@/components/shared/GlassStat";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  TRAINING_STATUS_META,
  type Employee, type EmployeeTraining, type TrainingCourse,
} from "@/lib/hr/types";

type Row = EmployeeTraining & {
  employee: Pick<Employee, "id" | "first_name" | "last_name" | "job_title" | "state"> | null;
  course: Pick<TrainingCourse, "name" | "category" | "renewal_months"> | null;
};

export default function Training() {
  const { hasPerm } = useAuth();
  const canAssign = hasPerm("hr.training.assign");
  const [tab, setTab] = useState<"assignments" | "courses">("assignments");
  const [rows, setRows] = useState<Row[]>([]);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // course dialog
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Compliance");
  const [provider, setProvider] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [renewal, setRenewal] = useState("12");
  const [desc, setDesc] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from("employee_trainings")
        .select("*, employee:employees(id, first_name, last_name, job_title, state), course:training_courses(name, category, renewal_months)")
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("training_courses").select("*").order("name"),
    ]);
    if (a.error || b.error) toast.error(a.error?.message ?? b.error?.message ?? "Training data could not load.");
    setRows((a.data ?? []) as unknown as Row[]);
    setCourses((b.data ?? []) as TrainingCourse[]);
    setLoading(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => `${r.employee?.first_name} ${r.employee?.last_name} ${r.course?.name}`.toLowerCase().includes(q));
  }, [rows, search]);

  const overdue = rows.filter((r) => r.due_date && r.due_date < today && r.status !== "completed").length;
  const expiringSoon = rows.filter((r) => r.expires_on && r.expires_on >= today && r.expires_on <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).length;
  const completed = rows.filter((r) => r.status === "completed").length;

  async function createCourse() {
    if (!name.trim()) { toast.error("Name is required."); return; }
    const { error } = await supabase.from("training_courses").insert({
      name: name.trim(), title: name.trim(), category, provider: provider.trim() || null,
      description: desc.trim() || null,
      estimated_minutes: minutes ? parseInt(minutes) : 30,
      renewal_months: renewal ? parseInt(renewal) : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Course added.");
    setOpen(false); setName(""); setProvider(""); setMinutes("30"); setRenewal(""); setDesc("");
    void load();
  }

  return (
    <GlassPageShell
      eyebrow="Blossom Training"
      eyebrowIcon={GraduationCap}
      title="Training & Compliance"
      description="Training assignments, certifications, and course catalog."
      stats={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <GlassStat icon={ListChecks} tone="primary" label="Assignments" value={rows.length} />
          <GlassStat icon={AlertTriangle} tone="destructive" label="Overdue" value={overdue} />
          <GlassStat icon={CalendarClock} tone="warning" label="Expiring ≤30d" value={expiringSoon} />
          <GlassStat icon={CheckCircle2} tone="success" label="Completed" value={completed} />
        </div>
      }
    >
      <GlassPanel bodyClassName="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="assignments">Assignments ({rows.length})</TabsTrigger>
              <TabsTrigger value="courses">Catalog ({courses.length})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            {tab === "assignments" && (
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-7 h-8 w-56 text-xs" />
              </div>
            )}
            {tab === "courses" && canAssign && (
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> New course</Button>
            )}
          </div>
        </div>

        {loading ? <Skeleton className="h-40" /> : tab === "assignments" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Employee</th>
                  <th className="py-2 pr-3">Course</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3">Expires</th>
                  <th className="py-2 pr-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="py-2 pr-3">
                      {r.employee ? (
                        <Link to={`/hr/employees/${r.employee.id}`} className="font-medium text-foreground hover:text-primary">
                          {r.employee.first_name} {r.employee.last_name}
                        </Link>
                      ) : "—"}
                      <p className="text-[11px] text-muted-foreground">{r.employee?.job_title} · {r.employee?.state}</p>
                    </td>
                    <td className="py-2 pr-3 text-foreground">
                      {r.course?.name ?? "—"}
                      <p className="text-[11px] text-muted-foreground">{r.course?.category ?? ""}</p>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", TRAINING_STATUS_META[r.status].tone)}>
                        {TRAINING_STATUS_META[r.status].label}
                      </span>
                    </td>
                    <td className={cn("py-2 pr-3 tabular-nums", r.due_date && r.due_date < today && r.status !== "completed" ? "text-destructive font-medium" : "text-muted-foreground")}>
                      {r.due_date ?? "—"}
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-muted-foreground">{r.expires_on ?? "—"}</td>
                    <td className="py-2 pr-3 tabular-nums text-muted-foreground">{r.score ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.map((c) => (
              <div key={c.id} className="p-3 rounded-lg border border-border/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {c.category} · {c.provider ?? "Internal"}
                      {c.renewal_months ? ` · renews every ${c.renewal_months} mo` : " · no renewal"}
                    </p>
                    {c.description && <p className="text-xs text-muted-foreground mt-1.5">{c.description}</p>}
                  </div>
                  <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", c.is_active ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground border-border")}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New training course</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Provider</Label><Input value={provider} onChange={(e) => setProvider(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">Estimated minutes</Label><Input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Renewal months (blank = none)</Label><Input type="number" value={renewal} onChange={(e) => setRenewal(e.target.value)} /></div>
            </div>
            <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createCourse}>Create course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassPageShell>
  );
}
