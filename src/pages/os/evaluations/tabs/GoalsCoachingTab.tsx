import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Target, LifeBuoy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { fmtDate } from "../statusBadges";
import { StatusPill } from "../statusBadges";
import type { EvaluationsData } from "../useEvaluationsData";

const GOAL_CATEGORIES = ["Clinical", "Professional Development", "Documentation", "Attendance", "Communication", "Leadership"];
const GOAL_STATUSES = ["Not Started", "In Progress", "Completed", "Carried Over"];
const COACHING_STATUSES = ["Active", "Monitoring", "Improved", "Escalated", "Completed"];

export default function GoalsCoachingTab({ data }: { data: EvaluationsData }) {
  const [goalOpen, setGoalOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);

  const staffById = useMemo(() => new Map(data.staff.map((s) => [s.id, s])), [data.staff]);

  return (
    <Tabs defaultValue="goals" className="space-y-4">
      <TabsList>
        <TabsTrigger value="goals"><Target className="h-3.5 w-3.5 mr-1.5" />Goals ({data.goals.length})</TabsTrigger>
        <TabsTrigger value="coaching"><LifeBuoy className="h-3.5 w-3.5 mr-1.5" />Coaching Plans ({data.coachingPlans.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="goals" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setGoalOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Add Goal</Button>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
          {data.goals.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No goals yet. Add a goal to get started.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Employee</th>
                  <th className="text-left font-medium px-3 py-3">Goal</th>
                  <th className="text-left font-medium px-3 py-3">Category</th>
                  <th className="text-left font-medium px-3 py-3">Due</th>
                  <th className="text-left font-medium px-3 py-3">Progress</th>
                  <th className="text-left font-medium px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {data.goals.map((g) => {
                  const s = staffById.get(g.staff_id);
                  return (
                    <tr key={g.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 text-xs">{s ? `${s.first_name} ${s.last_name}` : "—"}</td>
                      <td className="px-3 py-2.5"><div className="font-medium text-sm">{g.title}</div>{g.description && <div className="text-[11px] text-muted-foreground line-clamp-1">{g.description}</div>}</td>
                      <td className="px-3 py-2.5 text-xs">{g.category}</td>
                      <td className="px-3 py-2.5 text-xs">{fmtDate(g.due_date)}</td>
                      <td className="px-3 py-2.5 w-32"><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${g.progress}%` }} /></div><div className="text-[10px] text-muted-foreground mt-0.5">{g.progress}%</div></td>
                      <td className="px-3 py-2.5"><StatusPill tone={g.status === "Completed" ? "ok" : g.status === "In Progress" ? "info" : "muted"}>{g.status}</StatusPill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </TabsContent>

      <TabsContent value="coaching" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCoachOpen(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />New Coaching Plan</Button>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
          {data.coachingPlans.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No coaching plans yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Employee</th>
                  <th className="text-left font-medium px-3 py-3">Concern</th>
                  <th className="text-left font-medium px-3 py-3">Expectations</th>
                  <th className="text-left font-medium px-3 py-3">Created</th>
                  <th className="text-left font-medium px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {data.coachingPlans.map((c) => {
                  const s = staffById.get(c.staff_id);
                  return (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 text-xs">{s ? `${s.first_name} ${s.last_name}` : "—"}</td>
                      <td className="px-3 py-2.5"><div className="font-medium text-sm">{c.concern_category}</div>{c.description && <div className="text-[11px] text-muted-foreground line-clamp-1">{c.description}</div>}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground line-clamp-2 max-w-xs">{c.expectations ?? "—"}</td>
                      <td className="px-3 py-2.5 text-xs">{fmtDate(c.created_at)}</td>
                      <td className="px-3 py-2.5"><StatusPill tone={c.status === "Completed" || c.status === "Improved" ? "ok" : c.status === "Escalated" ? "crit" : c.status === "Monitoring" ? "info" : "warn"}>{c.status}</StatusPill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </TabsContent>

      <AddGoalDialog open={goalOpen} onOpenChange={setGoalOpen} data={data} onSaved={data.refresh} />
      <AddCoachingDialog open={coachOpen} onOpenChange={setCoachOpen} data={data} onSaved={data.refresh} />
    </Tabs>
  );
}

function AddGoalDialog({ open, onOpenChange, data, onSaved }: { open: boolean; onOpenChange: (b: boolean) => void; data: EvaluationsData; onSaved: () => void }) {
  const [staffId, setStaffId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Professional Development");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!staffId || !title.trim()) return toast({ title: "Employee and title required", variant: "destructive" });
    setSaving(true);
    const { error } = await (supabase.from as any)("evaluation_goals").insert({
      staff_id: staffId, title, description: description || null, category, due_date: dueDate || null,
    });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Goal added" });
    setStaffId(""); setTitle(""); setDescription(""); setDueDate("");
    onOpenChange(false); onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Goal</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Employee</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>{data.staff.filter((s) => s.active_status).map((s) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.role}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Improve documentation timeliness" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GOAL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Add Goal"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCoachingDialog({ open, onOpenChange, data, onSaved }: { open: boolean; onOpenChange: (b: boolean) => void; data: EvaluationsData; onSaved: () => void }) {
  const [staffId, setStaffId] = useState("");
  const [concern, setConcern] = useState("");
  const [description, setDescription] = useState("");
  const [expectations, setExpectations] = useState("");
  const [improvements, setImprovements] = useState("");
  const [support, setSupport] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!staffId || !concern.trim()) return toast({ title: "Employee and concern required", variant: "destructive" });
    setSaving(true);
    const { error } = await (supabase.from as any)("evaluation_coaching_plans").insert({
      staff_id: staffId, concern_category: concern, description: description || null,
      expectations: expectations || null, required_improvements: improvements || null,
      support_resources: support || null, status: "Active",
    });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Coaching plan created" });
    setStaffId(""); setConcern(""); setDescription(""); setExpectations(""); setImprovements(""); setSupport("");
    onOpenChange(false); onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Coaching Plan</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div><Label className="text-xs">Employee</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>{data.staff.filter((s) => s.active_status).map((s) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.role}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Concern category</Label><Input value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="Documentation, Attendance, Communication…" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div><Label className="text-xs">Expectations</Label><Textarea value={expectations} onChange={(e) => setExpectations(e.target.value)} rows={2} /></div>
          <div><Label className="text-xs">Required improvements</Label><Textarea value={improvements} onChange={(e) => setImprovements(e.target.value)} rows={2} /></div>
          <div><Label className="text-xs">Support / resources provided</Label><Textarea value={support} onChange={(e) => setSupport(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Create Plan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}