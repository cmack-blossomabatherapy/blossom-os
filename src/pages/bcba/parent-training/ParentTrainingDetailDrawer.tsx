import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ExternalLink, AlertTriangle, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useParentTrainingRecord,
  useUpdateParentTrainingRecord,
  useCreateParentTrainingSupport,
} from "./useParentTraining";
import {
  PT_STATUS_LABELS, PT_STATUS_ORDER, PT_STATUS_STYLES,
  FREQUENCY_LABELS, SUPPORT_CATEGORIES, isStale,
  type ParentTrainingStatus,
} from "./pipeline";

function fmt(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
}

export default function ParentTrainingDetailDrawer({
  id, onClose, readOnly = false,
}: { id: string | null; onClose: () => void; readOnly?: boolean }) {
  const { data, isLoading } = useParentTrainingRecord(id);
  const update = useUpdateParentTrainingRecord();
  const support = useCreateParentTrainingSupport();

  const [category, setCategory] = useState<string>("schedule_followup");
  const [detail, setDetail] = useState("");

  const rec = data?.record;

  const setStatus = async (status: ParentTrainingStatus) => {
    if (!rec) return;
    try {
      await update.mutateAsync({ id: rec.id, status });
      toast.success(`Status set to ${PT_STATUS_LABELS[status]}`);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const submitSupport = async () => {
    if (!rec) return;
    try {
      await support.mutateAsync({ record_id: rec.id, category, detail: detail || undefined });
      toast.success("Support request submitted");
      setDetail("");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <Sheet open={!!id} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{rec?.client_identifier ?? "Parent training"}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            {rec?.assigned_bcba_name ?? "Unassigned BCBA"}
            {rec?.payer ? ` · ${rec.payer}` : ""}{rec?.state ? ` · ${rec.state}` : ""}
          </p>
        </SheetHeader>

        {isLoading || !rec ? (
          <div className="p-10 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…
          </div>
        ) : (
          <div className="mt-4">
            {readOnly && (
              <div className="mb-3 rounded-md border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                Preview mode — status changes, edits and support requests are disabled.
              </div>
            )}
            {isStale(rec.centralreach_source_date) && (
              <div className="mb-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                CentralReach data may be stale — last synced {fmt(rec.centralreach_source_date)}
              </div>
            )}

            <Tabs defaultValue="overview">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Frequency">{FREQUENCY_LABELS[rec.required_frequency]}</Field>
                  <Field label="Required / month">{rec.required_per_month}</Field>
                  <Field label="Scheduled">{rec.scheduled_sessions}</Field>
                  <Field label="Completed">{rec.completed_sessions}</Field>
                  <Field label="Cancelled">{rec.cancelled_sessions}</Field>
                  <Field label="Last completed">{fmt(rec.last_completed_date)}</Field>
                  <Field label="Next scheduled">{fmt(rec.next_scheduled_date)}</Field>
                  <Field label="Reschedule needed">{rec.reschedule_needed ? "Yes" : "No"}</Field>
                  <Field label="Documentation">{rec.documentation_pending ? "Pending" : "Up to date"}</Field>
                  <Field label="Last CR sync">{fmt(rec.last_sync_at)}</Field>
                </div>
                {rec.barrier && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Barrier</Label>
                    <div className="mt-1 text-sm rounded-md border border-border/70 bg-muted/30 px-3 py-2">{rec.barrier}</div>
                  </div>
                )}
                {rec.centralreach_url && (
                  <a href={rec.centralreach_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    Open in CentralReach <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </TabsContent>

              <TabsContent value="status" className="mt-4 space-y-3">
                <Label>Current status</Label>
                <div className="flex flex-wrap gap-2">
                  {PT_STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      disabled={readOnly}
                      onClick={() => setStatus(s)}
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition ${PT_STATUS_STYLES[s]} ${rec.status === s ? "ring-2 ring-offset-1 ring-primary" : "opacity-80 hover:opacity-100"} ${readOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {PT_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Next scheduled</Label>
                    <Input
                      type="date"
                      defaultValue={rec.next_scheduled_date ?? ""}
                      disabled={readOnly}
                      onBlur={(e) => update.mutate({ id: rec.id, next_scheduled_date: e.target.value || null })}
                    />
                  </div>
                  <div>
                    <Label>Last completed</Label>
                    <Input
                      type="date"
                      defaultValue={rec.last_completed_date ?? ""}
                      disabled={readOnly}
                      onBlur={(e) => update.mutate({ id: rec.id, last_completed_date: e.target.value || null })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Barrier (factual, no clinical narrative)</Label>
                  <Textarea
                    defaultValue={rec.barrier ?? ""}
                    disabled={readOnly}
                    onBlur={(e) => update.mutate({ id: rec.id, barrier: e.target.value || null })}
                    placeholder="e.g. Parent work schedule conflict Mondays"
                  />
                </div>
              </TabsContent>

              <TabsContent value="support" className="mt-4 space-y-3">
                <div className="rounded-md border border-border/70 bg-card p-3 space-y-3">
                  <div>
                    <Label>Quick action</Label>
                    <Select value={category} disabled={readOnly} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUPPORT_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Detail (optional)</Label>
                    <Textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Add operational context — no clinical narrative." disabled={readOnly} />
                  </div>
                  <Button size="sm" onClick={submitSupport} disabled={readOnly || support.isPending}>
                    {support.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} Submit
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  {data?.supportRequests.length === 0 && (
                    <div className="text-xs text-muted-foreground">No support requests yet.</div>
                  )}
                  {data?.supportRequests.map((s) => (
                    <div key={s.id} className="rounded-md border border-border/70 bg-card px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-medium capitalize">{s.category.replace(/_/g, " ")}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
                      </div>
                      {s.detail && <div className="text-xs text-muted-foreground mt-1">{s.detail}</div>}
                      <div className="text-[11px] text-muted-foreground mt-1">Status: {s.status}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-4 space-y-2">
                {data?.activity.length === 0 && (
                  <div className="text-xs text-muted-foreground">No activity yet.</div>
                )}
                {data?.activity.map((a) => (
                  <div key={a.id} className="rounded-md border border-border/70 bg-card px-3 py-2 text-sm flex items-start gap-2">
                    <MessageCircle className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div>{a.message ?? a.event_type}</div>
                      <div className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}