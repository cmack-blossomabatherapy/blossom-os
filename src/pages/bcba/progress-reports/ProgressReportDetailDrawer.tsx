import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, ExternalLink, Loader2, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import {
  useProgressReport,
  useUpdateProgressReport,
  useCreateSupportRequest,
  useMilestones,
  matchMilestone,
} from "./useProgressReports";
import {
  AUTH_STATUS_LABELS,
  PARENT_INPUT_LABELS,
  PARENT_SIG_LABELS,
  QA_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_ORDER,
  REPORT_STATUS_STYLES,
  RISK_LABELS,
  RISK_STYLES,
  SUBMISSION_LABELS,
  SUPPORT_CATEGORIES,
  daysSince,
  daysUntil,
  dueDateLanguage,
  isStale,
  type ProgressReportStatus,
} from "./pipeline";

function fmt(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); } catch { return "—"; }
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
}

export default function ProgressReportDetailDrawer({ id, onClose, readOnly = false }: { id: string | null; onClose: () => void; readOnly?: boolean }) {
  const open = !!id;
  const { data, isLoading } = useProgressReport(id);
  const { data: milestones = [] } = useMilestones();
  const update = useUpdateProgressReport();
  const support = useCreateSupportRequest();

  const report = data?.report ?? null;
  const activity = data?.activity ?? [];
  const requests = data?.supportRequests ?? [];

  const [supportCategory, setSupportCategory] = useState<string>("authorization_help");
  const [supportDetail, setSupportDetail] = useState("");
  const [note, setNote] = useState("");

  const currentMilestone = useMemo(() => {
    if (!report) return null;
    const dr = daysUntil(report.progress_report_due_date);
    return matchMilestone(dr, milestones, report.payer, report.state);
  }, [report, milestones]);

  const openSupport = async () => {
    if (!report) return;
    if (supportCategory === "centralreach_link" && report.centralreach_url) {
      window.open(report.centralreach_url, "_blank");
    }
    try {
      await support.mutateAsync({
        progress_report_id: report.id,
        category: supportCategory,
        detail: supportDetail || undefined,
      });
      toast.success("Support request logged");
      setSupportDetail("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const saveStatus = async (status: ProgressReportStatus) => {
    if (!report) return;
    try {
      await update.mutateAsync({ id: report.id, report_status: status });
      toast.success("Status updated");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const saveField = async (patch: Record<string, unknown>) => {
    if (!report) return;
    try {
      await update.mutateAsync({ id: report.id, ...patch });
      toast.success("Saved");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const appendNote = async () => {
    if (!report || !note.trim()) return;
    await saveField({ last_update_note: note.trim() });
    setNote("");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {isLoading || !report ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
          </div>
        ) : (
          <div>
            <SheetHeader className="p-6 pb-3 border-b border-border/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SheetTitle className="text-xl">{report.client_identifier}</SheetTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    {report.payer ?? "—"}{report.state ? ` · ${report.state}` : ""} · BCBA: {report.assigned_bcba_name ?? "Unassigned"}
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${REPORT_STATUS_STYLES[report.report_status]}`}>
                  {REPORT_STATUS_LABELS[report.report_status]}
                </span>
              </div>
              {currentMilestone && (
                <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${RISK_STYLES[currentMilestone.risk_level]}`}>
                  <div className="text-[11px] uppercase tracking-wide opacity-80">{RISK_LABELS[currentMilestone.risk_level]} · {currentMilestone.name}</div>
                  <div className="mt-0.5">{currentMilestone.employee_message}</div>
                </div>
              )}
              {isStale(report.centralreach_source_date) && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900 px-3 py-2 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  CentralReach data last synced {fmt(report.centralreach_source_date)} ({daysSince(report.centralreach_source_date)}d ago) — verify before acting.
                </div>
              )}
            </SheetHeader>

            {readOnly && (
              <div className="mx-6 mt-3 rounded-md border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                Preview mode — status changes, notes and support requests are disabled.
              </div>
            )}

            <Tabs defaultValue="overview" className="p-6 pt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="statuses">Statuses</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Report due">{fmtDate(report.progress_report_due_date)}<div className="text-[11px] text-muted-foreground">{dueDateLanguage(daysUntil(report.progress_report_due_date))}</div></Field>
                  <Field label="Authorization expires">{fmtDate(report.authorization_expiration)}</Field>
                  <Field label="Authorization period">
                    {fmtDate(report.authorization_period_start)} → {fmtDate(report.authorization_period_end)}
                  </Field>
                  <Field label="Authorization owner">{report.authorization_owner_name ?? "—"}</Field>
                  <Field label="Payer">{report.payer ?? "—"}</Field>
                  <Field label="State">{report.state ?? "—"}</Field>
                  <Field label="Last update">{fmt(report.last_update_at)}</Field>
                  <Field label="CR source date">
                    {fmtDate(report.centralreach_source_date)}
                    {report.centralreach_url && (
                      <a href={report.centralreach_url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </Field>
                </div>

                <div>
                  <Label>Add an update note</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What changed? Keep it calm and factual." disabled={readOnly} />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={appendNote} disabled={readOnly || !note.trim() || update.isPending}>Save note</Button>
                  </div>
                  {report.last_update_note && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      <span className="font-medium">Last note:</span> {report.last_update_note}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="statuses" className="mt-4 space-y-4">
                <div>
                  <Label>Report status</Label>
                  <Select value={report.report_status} disabled={readOnly} onValueChange={(v) => saveStatus(v as ProgressReportStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REPORT_STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>{REPORT_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatusSelect
                    label="Parent input"
                    value={report.parent_input_status}
                    options={PARENT_INPUT_LABELS}
                    disabled={readOnly}
                    onChange={(v) => saveField({ parent_input_status: v })}
                  />
                  <StatusSelect
                    label="Parent signature"
                    value={report.parent_signature_status}
                    options={PARENT_SIG_LABELS}
                    disabled={readOnly}
                    onChange={(v) => saveField({ parent_signature_status: v })}
                  />
                  <StatusSelect
                    label="QA"
                    value={report.qa_status}
                    options={QA_LABELS}
                    disabled={readOnly}
                    onChange={(v) => saveField({ qa_status: v })}
                  />
                  <StatusSelect
                    label="Submission"
                    value={report.submission_status}
                    options={SUBMISSION_LABELS}
                    disabled={readOnly}
                    onChange={(v) => saveField({ submission_status: v })}
                  />
                  <StatusSelect
                    label="Authorization"
                    value={report.authorization_status}
                    options={AUTH_STATUS_LABELS}
                    disabled={readOnly}
                    onChange={(v) => saveField({ authorization_status: v })}
                  />
                  <div>
                    <Label>CentralReach URL</Label>
                    <Input
                      defaultValue={report.centralreach_url ?? ""}
                      disabled={readOnly}
                      onBlur={(e) => e.target.value !== (report.centralreach_url ?? "") && saveField({ centralreach_url: e.target.value || null })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="support" className="mt-4 space-y-4">
                <div className="rounded-xl border border-border/70 bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <LifeBuoy className="h-4 w-4 text-primary" />
                    <div className="text-sm font-medium">We can help — pick a quick action</div>
                  </div>
                  <div className="grid gap-3">
                    <Select value={supportCategory} disabled={readOnly} onValueChange={setSupportCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUPPORT_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={supportDetail}
                      onChange={(e) => setSupportDetail(e.target.value)}
                      placeholder="Optional — anything that would help us help you."
                      disabled={readOnly}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={openSupport} disabled={readOnly || support.isPending}>
                        {support.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} Submit
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recent support requests</div>
                  {requests.length === 0 ? (
                    <div className="text-sm text-muted-foreground">None yet.</div>
                  ) : (
                    <ul className="space-y-2">
                      {requests.map((r) => (
                        <li key={r.id} className="rounded-lg border border-border/70 bg-card px-3 py-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{r.category.replace(/_/g, " ")}</span>
                            <span className="text-xs text-muted-foreground">{fmt(r.created_at)}</span>
                          </div>
                          {r.detail && <div className="text-xs text-muted-foreground mt-1">{r.detail}</div>}
                          <div className="text-[11px] text-muted-foreground mt-1">Status: {r.status}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                {activity.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No activity yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {activity.map((a) => (
                      <li key={a.id} className="rounded-lg border border-border/70 bg-card px-3 py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{a.event_type.replace(/_/g, " ")}</span>
                          <span className="text-xs text-muted-foreground">{fmt(a.created_at)}</span>
                        </div>
                        {a.message && <div className="text-xs text-muted-foreground mt-1">{a.message}</div>}
                      </li>
                    ))}
                  </ul>
                )}
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
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function StatusSelect({
  label, value, options, onChange, disabled,
}: { label: string; value: string; options: Record<string, string>; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} disabled={disabled} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}