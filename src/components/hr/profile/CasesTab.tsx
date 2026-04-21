import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { CasePriority, CaseStatus, CaseType, Employee } from "@/lib/hr/types";

interface CaseRow {
  id: string; title: string; case_type: CaseType; status: CaseStatus;
  priority: CasePriority; summary: string | null; due_date: string | null; opened_at: string;
}

const PRIORITY_TONE: Record<CasePriority, string> = {
  low:    "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high:   "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

export function CasesTab({ employee }: { employee: Employee }) {
  const { hasPerm, user } = useAuth();
  const canManage = hasPerm("hr.cases.manage");
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<CaseType>("hr_question");
  const [priority, setPriority] = useState<CasePriority>("medium");

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("employee_cases")
      .select("id, title, case_type, status, priority, summary, due_date, opened_at")
      .eq("employee_id", employee.id)
      .order("opened_at", { ascending: false });
    setCases((data ?? []) as CaseRow[]);
    setLoading(false);
  }

  async function create() {
    if (!title.trim()) { toast.error("Title is required."); return; }
    const { error } = await supabase.from("employee_cases").insert({
      employee_id: employee.id, title: title.trim(), summary: summary.trim() || null,
      case_type: type, priority, status: "new", opened_by: user?.id ?? null,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("employee_timeline").insert({
      employee_id: employee.id, event_type: "case_opened",
      description: `Case opened: ${title}`,
    });
    toast.success("Case created.");
    setOpen(false); setTitle(""); setSummary(""); setType("hr_question"); setPriority("medium");
    void load();
  }

  async function setStatus(id: string, status: CaseStatus) {
    const { error } = await supabase.from("employee_cases").update({
      status, closed_at: ["resolved","closed"].includes(status) ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) toast.error(error.message); else void load();
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Cases</h3>
        {canManage && <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Open case</Button>}
      </div>
      {loading ? <Skeleton className="h-24" /> : cases.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No cases for this employee.</p>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => (
            <div key={c.id} className="p-3 rounded-lg border border-border/40 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${PRIORITY_TONE[c.priority]}`}>{c.priority}</span>
                    <p className="text-sm font-medium text-foreground">{c.title}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{c.case_type.replace(/_/g, " ")} · opened {new Date(c.opened_at).toLocaleDateString()}</p>
                  {c.summary && <p className="text-xs text-muted-foreground mt-1">{c.summary}</p>}
                </div>
                {canManage ? (
                  <Select value={c.status} onValueChange={(v) => setStatus(c.id, v as CaseStatus)}>
                    <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="waiting_employee">Waiting on employee</SelectItem>
                      <SelectItem value="waiting_manager">Waiting on manager</SelectItem>
                      <SelectItem value="waiting_payroll">Waiting on payroll</SelectItem>
                      <SelectItem value="waiting_hr">Waiting on HR</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : <span className="text-xs text-muted-foreground capitalize">{c.status.replace(/_/g, " ")}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open HR case</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground">Summary</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as CaseType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payroll_issue">Payroll issue</SelectItem>
                    <SelectItem value="attendance_issue">Attendance issue</SelectItem>
                    <SelectItem value="benefit_question">Benefit question</SelectItem>
                    <SelectItem value="hr_question">HR question</SelectItem>
                    <SelectItem value="onboarding_blocker">Onboarding blocker</SelectItem>
                    <SelectItem value="training_issue">Training issue</SelectItem>
                    <SelectItem value="manager_escalation">Manager escalation</SelectItem>
                    <SelectItem value="documentation_needed">Documentation needed</SelectItem>
                    <SelectItem value="access_issue">Access issue</SelectItem>
                    <SelectItem value="policy_acknowledgment">Policy acknowledgment</SelectItem>
                    <SelectItem value="disciplinary_concern">Disciplinary concern</SelectItem>
                    <SelectItem value="offboarding_case">Offboarding case</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as CasePriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}