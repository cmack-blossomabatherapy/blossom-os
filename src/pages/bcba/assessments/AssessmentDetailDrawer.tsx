import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, ExternalLink, AlertTriangle, RefreshCcw, CheckCircle2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import {
  useAssessment,
  useUpdateAssessment,
  useUpdateAssessmentStatus,
  useAddQaFeedback,
  useResolveQaFeedback,
  useUpsertTreatmentPlan,
  type QaFeedback,
} from "./useAssessments";
import {
  ASSESSMENT_STATUS_LABELS,
  ASSESSMENT_STATUS_ORDER,
  ASSESSMENT_STATUS_STYLES,
  TREATMENT_PLAN_LABELS,
  TREATMENT_PLAN_ORDER,
  CORRECTION_CATEGORIES,
  daysBetween,
  type AssessmentStatus,
  type TreatmentPlanStatus,
} from "./pipeline";

function fmt(d?: string | null) { try { return d ? new Date(d).toLocaleString() : "—"; } catch { return "—"; } }
function fmtDate(d?: string | null) { try { return d ? new Date(d).toLocaleDateString() : "—"; } catch { return "—"; } }

export default function AssessmentDetailDrawer({ id, onClose, readOnly = false }: { id: string | null; onClose: () => void; readOnly?: boolean }) {
  const { data, isLoading } = useAssessment(id);
  const updateStatus = useUpdateAssessmentStatus();
  const update = useUpdateAssessment();
  const upsertPlan = useUpsertTreatmentPlan();
  const addFeedback = useAddQaFeedback();
  const resolveFeedback = useResolveQaFeedback();

  const a = data?.assessment;
  const plan = data?.plans?.[0];

  return (
    <Sheet open={!!id} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        {isLoading || !a ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
          </div>
        ) : (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SheetTitle className="text-xl">{a.client_identifier}</SheetTitle>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{a.assessment_type} · {a.assigned_bcba_name ?? "Unassigned"}</p>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ASSESSMENT_STATUS_STYLES[a.status]}`}>
                  {ASSESSMENT_STATUS_LABELS[a.status]}
                </span>
              </div>
            </SheetHeader>
            {readOnly && (
              <div className="mb-3 rounded-md border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                Preview mode — status changes, QA feedback and edits are disabled.
              </div>
            )}

            {/* Quick facts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-4">
              <Fact label="Assessment date" value={fmtDate(a.assessment_date)} />
              <Fact label="Due" value={fmtDate(a.due_date)} />
              <Fact label="Days in stage" value={`${daysBetween(a.status_entered_at)}d`} />
              <Fact label="QA reviewer" value={a.qa_reviewer_name ?? "—"} />
              <Fact label="Owner" value={a.owner_name ?? a.assigned_bcba_name ?? "—"} />
              <Fact label="Auth dep." value={a.authorization_dependency ?? "—"} />
              <Fact label="Missing" value={a.missing_item ?? "—"} />
              <Fact label="Next action" value={a.next_action ?? "—"} />
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2 mb-4">
              {a.centralreach_client_url && (
                <a href={a.centralreach_client_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1" /> CR client</Button>
                </a>
              )}
              {a.centralreach_assessment_url && (
                <a href={a.centralreach_assessment_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1" /> CR assessment</Button>
                </a>
              )}
              {plan?.centralreach_plan_url && (
                <a href={plan.centralreach_plan_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1" /> CR treatment plan</Button>
                </a>
              )}
            </div>

            <Tabs defaultValue="pipeline">
              <TabsList>
                <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                <TabsTrigger value="plan">Treatment plan</TabsTrigger>
                <TabsTrigger value="qa">QA feedback ({data?.feedback.length ?? 0})</TabsTrigger>
                <TabsTrigger value="edit">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="pipeline" className="mt-4">
                <Label className="text-xs uppercase tracking-wide">Move to stage</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ASSESSMENT_STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      disabled={readOnly || s === a.status || updateStatus.isPending}
                      onClick={async () => {
                        try { await updateStatus.mutateAsync({ id: a.id, status: s }); toast.success("Stage updated"); }
                        catch (e: any) { toast.error(e?.message ?? "Failed"); }
                      }}
                      className={`text-xs rounded-full border px-2.5 py-1 transition ${
                        s === a.status ? `${ASSESSMENT_STATUS_STYLES[s]} ring-1 ring-primary` : "border-border bg-card hover:border-primary/60"
                      }`}
                    >
                      {ASSESSMENT_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="plan" className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide">Treatment plan status</Label>
                  <Select
                    value={plan?.status ?? "not_started"}
                    disabled={readOnly}
                    onValueChange={async (v) => {
                      try {
                        await upsertPlan.mutateAsync({ assessment_id: a.id, status: v as TreatmentPlanStatus });
                        toast.success("Plan status updated");
                      } catch (e: any) { toast.error(e?.message ?? "Failed"); }
                    }}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TREATMENT_PLAN_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>{TREATMENT_PLAN_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <PlanLinksForm
                  crPlanUrl={plan?.centralreach_plan_url ?? ""}
                  signatureUrl={plan?.parent_signature_url ?? ""}
                  nextAction={plan?.next_action ?? ""}
                  onSave={async (values) => {
                    try { await upsertPlan.mutateAsync({ assessment_id: a.id, ...values }); toast.success("Saved"); }
                    catch (e: any) { toast.error(e?.message ?? "Failed"); }
                  }}
                />
                <p className="text-[11px] text-muted-foreground">
                  Only operational links and status are stored here. Full treatment-plan content lives in CentralReach.
                </p>
              </TabsContent>

              <TabsContent value="qa" className="mt-4 space-y-4">
                {!readOnly && <AddFeedback assessmentId={a.id} onSubmit={async (v) => {
                  try { await addFeedback.mutateAsync({ assessment_id: a.id, ...v }); toast.success("Feedback recorded — task created"); }
                  catch (e: any) { toast.error(e?.message ?? "Failed"); }
                }} />}
                <div className="space-y-2">
                  {(data?.feedback ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No QA feedback recorded.</div>
                  ) : (
                    (data?.feedback ?? []).map((f) => (
                      <FeedbackCard key={f.id} f={f} readOnly={readOnly} onResolve={async (resolution, status) => {
                        try { await resolveFeedback.mutateAsync({ id: f.id, resolution, resolution_status: status }); toast.success("Resolved"); }
                        catch (e: any) { toast.error(e?.message ?? "Failed"); }
                      }} />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-4 space-y-3">
                {readOnly ? (
                  <div className="text-sm text-muted-foreground">Editing disabled in preview.</div>
                ) : <EditDetailsForm
                  initial={a}
                  onSave={async (patch) => {
                    try { await update.mutateAsync({ id: a.id, ...patch }); toast.success("Saved"); }
                    catch (e: any) { toast.error(e?.message ?? "Failed"); }
                  }}
                />}
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <div className="space-y-2">
                  {(data?.activity ?? []).map((e) => (
                    <div key={e.id} className="text-xs border-l-2 border-border pl-3 py-1">
                      <div className="text-muted-foreground">{fmt(e.created_at)}</div>
                      <div>{e.message ?? e.event_type}</div>
                    </div>
                  ))}
                  {(data?.activity ?? []).length === 0 && (
                    <div className="text-sm text-muted-foreground">No activity yet.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm truncate">{value}</div>
    </div>
  );
}

function PlanLinksForm({ crPlanUrl, signatureUrl, nextAction, onSave }: {
  crPlanUrl: string; signatureUrl: string; nextAction: string;
  onSave: (v: { centralreach_plan_url: string; parent_signature_url: string; next_action: string }) => Promise<void>;
}) {
  const [cr, setCr] = useState(crPlanUrl);
  const [sig, setSig] = useState(signatureUrl);
  const [na, setNa] = useState(nextAction);
  return (
    <div className="space-y-2">
      <div>
        <Label>CentralReach plan URL</Label>
        <Input value={cr} onChange={(e) => setCr(e.target.value)} />
      </div>
      <div>
        <Label>Parent signature link</Label>
        <Input value={sig} onChange={(e) => setSig(e.target.value)} />
      </div>
      <div>
        <Label>Next action</Label>
        <Input value={na} onChange={(e) => setNa(e.target.value)} />
      </div>
      <Button size="sm" onClick={() => onSave({ centralreach_plan_url: cr, parent_signature_url: sig, next_action: na })}>Save</Button>
    </div>
  );
}

function AddFeedback({ assessmentId, onSubmit }: {
  assessmentId: string;
  onSubmit: (v: { correction_category: string; comment: string; due_date: string | null; supporting_link: string | null }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(CORRECTION_CATEGORIES[0]);
  const [comment, setComment] = useState("");
  const [due, setDue] = useState("");
  const [link, setLink] = useState("");

  if (!open) return (
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
      <MessageSquarePlus className="h-3.5 w-3.5 mr-1" /> Add QA correction
    </Button>
  );

  return (
    <div className="rounded-xl border border-border p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Correction category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CORRECTION_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Due date</Label>
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Comment</Label>
        <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Describe the correction (no PHI narrative)." />
      </div>
      <div>
        <Label>Supporting link</Label>
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="CentralReach link or document URL" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="sm" disabled={!comment.trim()} onClick={async () => {
          await onSubmit({ correction_category: category, comment: comment.trim(), due_date: due || null, supporting_link: link || null });
          setOpen(false); setComment(""); setDue(""); setLink("");
        }}>Send to BCBA</Button>
      </div>
    </div>
  );
}

function FeedbackCard({ f, onResolve, readOnly = false }: { f: QaFeedback; onResolve: (resolution: string, status: QaFeedback["resolution_status"]) => Promise<void>; readOnly?: boolean }) {
  const [resolution, setResolution] = useState(f.resolution ?? "");
  const resolved = f.resolution_status === "resolved" || f.resolution_status === "waived";
  return (
    <div className="rounded-xl border border-border p-3 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium flex items-center gap-2">
            {f.correction_category}
            {f.is_repeat_issue && (
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-300">
                <RefreshCcw className="h-3 w-3 mr-1" /> Repeat
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {fmt(f.date_returned)} · {f.reviewer_name ?? "QA"}{f.due_date ? ` · due ${fmtDate(f.due_date)}` : ""}
          </div>
        </div>
        <Badge variant={resolved ? "secondary" : "outline"} className="text-[10px]">
          {f.resolution_status.replace("_", " ")}
        </Badge>
      </div>
      <p className="text-sm mt-2 whitespace-pre-wrap">{f.comment}</p>
      {f.supporting_link && (
        <a href={f.supporting_link} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1">
          <ExternalLink className="h-3 w-3" /> supporting link
        </a>
      )}
      {!resolved && !readOnly && (
        <div className="mt-2 space-y-2">
          <Textarea rows={2} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolution note…" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => onResolve(resolution, "waived")}>Waive</Button>
            <Button size="sm" disabled={!resolution.trim()} onClick={() => onResolve(resolution, "resolved")}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark resolved
            </Button>
          </div>
        </div>
      )}
      {resolved && f.resolution && <div className="mt-2 text-xs text-muted-foreground">Resolution: {f.resolution}</div>}
    </div>
  );
}

function EditDetailsForm({ initial, onSave }: {
  initial: { assessment_date: string | null; due_date: string | null; missing_item: string | null; next_action: string | null; authorization_dependency: string | null; centralreach_client_url: string | null; centralreach_assessment_url: string | null; qa_reviewer_name: string | null; };
  onSave: (v: Record<string, any>) => Promise<void>;
}) {
  const [f, setF] = useState({
    assessment_date: initial.assessment_date ?? "",
    due_date: initial.due_date ?? "",
    missing_item: initial.missing_item ?? "",
    next_action: initial.next_action ?? "",
    authorization_dependency: initial.authorization_dependency ?? "",
    centralreach_client_url: initial.centralreach_client_url ?? "",
    centralreach_assessment_url: initial.centralreach_assessment_url ?? "",
    qa_reviewer_name: initial.qa_reviewer_name ?? "",
  });
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Assessment date</Label><Input type="date" value={f.assessment_date} onChange={(e) => setF({...f, assessment_date: e.target.value})} /></div>
        <div><Label>Due date</Label><Input type="date" value={f.due_date} onChange={(e) => setF({...f, due_date: e.target.value})} /></div>
      </div>
      <div><Label>Missing item</Label><Input value={f.missing_item} onChange={(e) => setF({...f, missing_item: e.target.value})} /></div>
      <div><Label>Next action</Label><Input value={f.next_action} onChange={(e) => setF({...f, next_action: e.target.value})} /></div>
      <div><Label>Authorization dependency</Label><Input value={f.authorization_dependency} onChange={(e) => setF({...f, authorization_dependency: e.target.value})} /></div>
      <div><Label>QA reviewer name</Label><Input value={f.qa_reviewer_name} onChange={(e) => setF({...f, qa_reviewer_name: e.target.value})} /></div>
      <div><Label>CentralReach client URL</Label><Input value={f.centralreach_client_url} onChange={(e) => setF({...f, centralreach_client_url: e.target.value})} /></div>
      <div><Label>CentralReach assessment URL</Label><Input value={f.centralreach_assessment_url} onChange={(e) => setF({...f, centralreach_assessment_url: e.target.value})} /></div>
      <Button size="sm" onClick={() => onSave({
        assessment_date: f.assessment_date || null,
        due_date: f.due_date || null,
        missing_item: f.missing_item || null,
        next_action: f.next_action || null,
        authorization_dependency: f.authorization_dependency || null,
        qa_reviewer_name: f.qa_reviewer_name || null,
        centralreach_client_url: f.centralreach_client_url || null,
        centralreach_assessment_url: f.centralreach_assessment_url || null,
      })}>Save changes</Button>
    </div>
  );
}