import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useFellowAssignments, useFellowReviews, useFellowAudit,
  useCreateReview, useUpdateReviewStatus,
} from "./useFellowship";
import { REVIEW_TYPES, REVIEW_STATUSES, FELLOWSHIP_ROLES, STAGE_TONE } from "./config";

function fmt(d?: string | null) { if (!d) return "—"; try { return new Date(d).toLocaleString(); } catch { return "—"; } }
function fmtDate(d?: string | null) { if (!d) return "—"; try { return new Date(d).toLocaleDateString(); } catch { return "—"; } }

export default function FellowDetailDrawer({
  fellow, open, onClose,
}: { fellow: any | null; open: boolean; onClose: () => void }) {
  const fellowId = fellow?.id ?? null;
  const assignments = useFellowAssignments(fellowId);
  const reviews = useFellowReviews(fellowId);
  const audit = useFellowAudit(fellowId);
  const createReview = useCreateReview(fellowId);
  const updateStatus = useUpdateReviewStatus(fellowId);

  const [uid, setUid] = useState<string | null>(null);
  const [uname, setUname] = useState<string | undefined>();
  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUid(user?.id ?? null);
    setUname(user?.user_metadata?.full_name ?? user?.email ?? undefined);
  })(); }, []);

  const [rType, setRType] = useState<string>("monthly_review");
  const [rWhen, setRWhen] = useState<string>("");
  const [rNotes, setRNotes] = useState<string>("");

  const submitReview = async () => {
    if (!uid) { toast.error("You must be signed in"); return; }
    try {
      await createReview.mutateAsync({
        reviewer_id: uid,
        reviewer_name: uname,
        review_type: rType,
        scheduled_at: rWhen ? new Date(rWhen).toISOString() : null,
        status: "scheduled",
        outcome_summary: rNotes || null,
      });
      setRWhen(""); setRNotes("");
      toast.success("Review logged");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create review");
    }
  };

  const roleLabel = (k: string) => FELLOWSHIP_ROLES.find((r) => r.key === k)?.label ?? k;
  const typeLabel = (k: string) => REVIEW_TYPES.find((r) => r.key === k)?.label ?? k;

  if (!fellow) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {fellow.full_name}
            <Badge variant="outline" className={STAGE_TONE[fellow.stage_key] ?? ""}>
              {(fellow.stage_key ?? "").replace(/_/g, " ")}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Program stage" value={fellow.stage_key} />
                <Field label="RBT role status" value={fellow.rbt_role_status} />
                <Field label="Start date" value={fmtDate(fellow.start_date)} />
                <Field label="Target completion" value={fmtDate(fellow.target_completion_date)} />
                <Field label="Coursework" value={fellow.coursework_status} />
                <Field label="Fieldwork" value={fellow.fieldwork_status} />
                <Field label="Restricted hours" value={String(fellow.restricted_hours ?? 0)} />
                <Field label="Unrestricted hours" value={String(fellow.unrestricted_hours ?? 0)} />
                <Field label="Supervision status" value={fellow.supervision_status} />
                <Field label="Monthly documentation" value={fellow.monthly_documentation_status} />
                <Field label="Next meeting" value={fmt(fellow.next_meeting_at)} />
                <Field label="Readiness" value={fellow.readiness_status} />
                <Field label="Hours source date" value={fmtDate(fellow.hours_last_source_date)} />
              </div>
              {fellow.support_need ? (
                <Card><CardHeader><CardTitle className="text-sm">Support need</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{fellow.support_need}</CardContent>
                </Card>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Fellowship program requirements, financial terms, and promises are not published here until administrators
                configure approved content.
              </p>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-3 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Log a supervision review</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={rType} onValueChange={setRType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REVIEW_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="datetime-local" value={rWhen} onChange={(e) => setRWhen(e.target.value)} />
                  </div>
                  <Textarea placeholder="Outcome / next steps (optional)" value={rNotes} onChange={(e) => setRNotes(e.target.value)} />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={submitReview} disabled={createReview.isPending}>Add review</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {(reviews.data ?? []).map((r: any) => (
                  <Card key={r.id}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{typeLabel(r.review_type)}</div>
                        <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v })}>
                          <SelectTrigger className="h-7 w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {REVIEW_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Scheduled {fmt(r.scheduled_at)} · {r.reviewer_name ?? "Reviewer"}
                      </div>
                      {r.outcome_summary ? <div className="text-sm">{r.outcome_summary}</div> : null}
                    </CardContent>
                  </Card>
                ))}
                {(reviews.data ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No reviews logged yet.</p>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-2 mt-4">
              {(assignments.data ?? []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <div>
                    <div className="font-medium">{a.bcba_name ?? "BCBA"}</div>
                    <div className="text-xs text-muted-foreground">{roleLabel(a.role)}{a.is_primary ? " · Primary" : ""}</div>
                  </div>
                </div>
              ))}
              {(assignments.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No fellowship team assigned yet.</p>
              ) : null}
            </TabsContent>

            <TabsContent value="history" className="space-y-1 mt-4">
              {(audit.data ?? []).map((a: any) => (
                <div key={a.id} className="text-xs text-muted-foreground">
                  {fmt(a.created_at)} · {a.action} · {a.changed_field ?? a.entity_table}
                  {a.old_value || a.new_value ? ` · ${a.old_value ?? "—"} → ${a.new_value ?? "—"}` : ""}
                </div>
              ))}
              {(audit.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity recorded.</p>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{value ? String(value).replace(/_/g, " ") : "—"}</div>
    </div>
  );
}