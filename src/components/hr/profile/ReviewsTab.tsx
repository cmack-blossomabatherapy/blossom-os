import { useEffect, useState } from "react";
import { Plus, Star, Award, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  REVIEW_STATUS_META, REVIEW_RATING_META, REVIEW_TYPE_LABEL,
  type Employee, type EmployeeReview, type ReviewRating, type ReviewStatus, type ReviewType,
} from "@/lib/hr/types";

export function ReviewsTab({ employee }: { employee: Employee }) {
  const { hasPerm, user } = useAuth();
  const canManage = hasPerm("hr.reviews.manage");
  const [items, setItems] = useState<EmployeeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReviewType>("annual");
  const [reviewer, setReviewer] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("employee_reviews").select("*")
      .eq("employee_id", employee.id).order("created_at", { ascending: false });
    setItems((data ?? []) as EmployeeReview[]);
    setLoading(false);
  }

  async function create() {
    const { error } = await supabase.from("employee_reviews").insert({
      employee_id: employee.id, review_type: type, reviewer_name: reviewer.trim() || null,
      due_date: dueDate || null, status: "draft", created_by: user?.id ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Review created.");
    setOpen(false); setType("annual"); setReviewer(""); setDueDate("");
    void load();
  }

  async function update(id: string, patch: Partial<EmployeeReview>) {
    const { error } = await supabase.from("employee_reviews").update(patch).eq("id", id);
    if (error) toast.error(error.message); else void load();
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Performance Reviews</h3>
        {canManage && <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> New review</Button>}
      </div>

      {loading ? <Skeleton className="h-24" /> : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet for this employee.</p>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="p-3 rounded-lg border border-border/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", REVIEW_STATUS_META[r.status].tone)}>
                      {REVIEW_STATUS_META[r.status].label}
                    </span>
                    <span className="text-sm font-medium text-foreground">{REVIEW_TYPE_LABEL[r.review_type]}</span>
                    {r.overall_rating && (
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", REVIEW_RATING_META[r.overall_rating].tone)}>
                        <Award className="inline h-3 w-3 mr-0.5" />
                        {REVIEW_RATING_META[r.overall_rating].label}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Reviewer: {r.reviewer_name ?? "—"} · Due {r.due_date ?? "—"}
                  </p>
                  {r.strengths && <p className="text-xs mt-2 text-foreground"><strong>Strengths:</strong> {r.strengths}</p>}
                  {r.growth_areas && <p className="text-xs mt-1 text-muted-foreground"><strong>Growth:</strong> {r.growth_areas}</p>}
                  {r.goals && <p className="text-xs mt-1 text-muted-foreground"><strong>Goals:</strong> {r.goals}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {canManage && (
                    <Select value={r.status} onValueChange={(v) => update(r.id, { status: v as ReviewStatus })}>
                      <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="manager_review">Manager Review</SelectItem>
                        <SelectItem value="employee_acknowledge">Awaiting Acknowledge</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {canManage && (
                    <Select value={r.overall_rating ?? ""} onValueChange={(v) => update(r.id, { overall_rating: (v || null) as ReviewRating | null })}>
                      <SelectTrigger className="h-7 w-44 text-xs"><SelectValue placeholder="Set rating…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exceeds">Exceeds Expectations</SelectItem>
                        <SelectItem value="meets">Meets Expectations</SelectItem>
                        <SelectItem value="developing">Developing</SelectItem>
                        <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                        <SelectItem value="unsatisfactory">Unsatisfactory</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {r.status === "employee_acknowledge" && employee.user_id && (
                    <Button size="sm" variant="outline" onClick={() => update(r.id, { status: "completed", acknowledged_at: new Date().toISOString(), completed_at: new Date().toISOString() })}>
                      <Check className="h-3.5 w-3.5" /> Acknowledge
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
          <DialogHeader><DialogTitle>New performance review</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ReviewType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30_day">30-Day</SelectItem>
                  <SelectItem value="60_day">60-Day</SelectItem>
                  <SelectItem value="90_day">90-Day</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="probationary">Probationary</SelectItem>
                  <SelectItem value="ad_hoc">Ad-hoc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reviewer</Label>
              <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Manager / BCBA name" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}