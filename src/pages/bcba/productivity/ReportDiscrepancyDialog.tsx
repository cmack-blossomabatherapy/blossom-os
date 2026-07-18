import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, CheckCircle2, RefreshCw, Download, Trash2, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import { METRIC_DEFINITIONS, findDefinition } from "./pipeline";
import {
  useReportDiscrepancy,
  useDiscrepancyEvents,
  useDiscrepancyAttachments,
  useAddDiscrepancyComment,
  useUpdateDiscrepancyStatus,
  useUploadDiscrepancyEvidence,
  useDeleteDiscrepancyAttachment,
  getDiscrepancyEvidenceUrl,
  useDiscrepancy,
  type DiscrepancyEvent,
  type DiscrepancyAttachment,
} from "./useProductivity";

export default function ReportDiscrepancyDialog({
  open, onOpenChange, snapshotId, bcbaId, initialMetric, discrepancyId: initialDiscrepancyId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  snapshotId: string;
  bcbaId: string;
  initialMetric?: string;
  discrepancyId?: string;
}) {
  const [metric, setMetric] = useState(initialMetric ?? METRIC_DEFINITIONS[0].key);
  const [alsoImpacted, setAlsoImpacted] = useState<string[]>([]);
  const [reported, setReported] = useState("");
  const [expected, setExpected] = useState("");
  const [detail, setDetail] = useState("");
  const [activeId, setActiveId] = useState<string | null>(initialDiscrepancyId ?? null);
  const submit = useReportDiscrepancy();

  const onSubmit = async () => {
    try {
      const row: any = await submit.mutateAsync({
        snapshot_id: snapshotId,
        bcba_id: bcbaId,
        metric_key: metric,
        reported_value: reported || undefined,
        expected_value: expected || undefined,
        detail: detail || undefined,
        impacted_metric_keys: alsoImpacted,
      });
      toast.success("Discrepancy reported — a task was created for review.");
      // Transition to detail view so the user can attach evidence right away.
      if (row?.id) setActiveId(row.id as string);
      setReported(""); setExpected(""); setDetail(""); setAlsoImpacted([]);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not submit discrepancy.");
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      // Reset when dialog closes so next open starts clean unless a discrepancy id was passed in.
      setActiveId(initialDiscrepancyId ?? null);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{activeId ? "Discrepancy details" : "Report a data discrepancy"}</DialogTitle>
          <DialogDescription>
            {activeId
              ? "Attach supporting evidence, add comments, and mark this discrepancy resolved when done."
              : "Flag a metric that looks off. You’ll be able to attach evidence and track its resolution."}
          </DialogDescription>
        </DialogHeader>

        {activeId ? (
          <DiscrepancyDetail discrepancyId={activeId} onDone={() => handleClose(false)} />
        ) : (
        <div className="space-y-3">
          <div>
            <Label>Metric</Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METRIC_DEFINITIONS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              Also impacted metrics
              <span className="text-[11px] font-normal text-muted-foreground">
                (linked to the same snapshot timestamps)
              </span>
            </Label>
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {METRIC_DEFINITIONS.filter((m) => m.key !== metric).map((m) => {
                const on = alsoImpacted.includes(m.key);
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() =>
                      setAlsoImpacted((cur) =>
                        on ? cur.filter((k) => k !== m.key) : [...cur, m.key],
                      )
                    }
                    className={`text-[11px] rounded-full border px-2 py-0.5 transition ${
                      on
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Reported value</Label>
              <Input value={reported} onChange={(e) => setReported(e.target.value)} placeholder="e.g. 12 h" />
            </div>
            <div>
              <Label>Expected value</Label>
              <Input value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="e.g. 18 h" />
            </div>
          </div>
          <div>
            <Label>Detail</Label>
            <Textarea rows={4} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="What looks off, and where the correct data lives." />
          </div>
        </div>
        )}

        {!activeId && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={submit.isPending}>Submit</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  investigating: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function DiscrepancyDetail({ discrepancyId, onDone }: { discrepancyId: string; onDone: () => void }) {
  const events = useDiscrepancyEvents(discrepancyId);
  const attachments = useDiscrepancyAttachments(discrepancyId);
  const addComment = useAddDiscrepancyComment();
  const updateStatus = useUpdateDiscrepancyStatus();
  const upload = useUploadDiscrepancyEvidence();
  const removeAttachment = useDeleteDiscrepancyAttachment();

  const [comment, setComment] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const currentStatus =
    [...(events.data ?? [])].reverse().find((e) => e.to_status)?.to_status ?? "open";

  const onFile = async (file?: File | null) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File is too large (max 20 MB).");
      return;
    }
    try {
      await upload.mutateAsync({ discrepancy_id: discrepancyId, file });
      toast.success("Evidence attached.");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed.");
    }
  };

  const onDownload = async (a: DiscrepancyAttachment) => {
    try {
      const url = await getDiscrepancyEvidenceUrl(a.storage_path);
      window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open file.");
    }
  };

  const onAddComment = async () => {
    const c = comment.trim();
    if (!c) return;
    try {
      await addComment.mutateAsync({ discrepancy_id: discrepancyId, comment: c });
      setComment("");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not add comment.");
    }
  };

  const onResolve = async () => {
    try {
      await updateStatus.mutateAsync({
        discrepancy_id: discrepancyId,
        status: "resolved",
        resolution_note: resolutionNote.trim() || undefined,
      });
      toast.success("Marked as resolved.");
      setResolutionNote("");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not resolve.");
    }
  };

  const onReopen = async () => {
    try {
      await updateStatus.mutateAsync({ discrepancy_id: discrepancyId, status: "open" });
      toast.success("Reopened.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not reopen.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Status</div>
        <StatusChip status={currentStatus} />
      </div>

      {/* Attachments */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Supporting evidence</Label>
          <div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
              <Paperclip className="h-3.5 w-3.5 mr-1.5" />
              {upload.isPending ? "Uploading…" : "Attach file"}
            </Button>
          </div>
        </div>
        {(attachments.data ?? []).length === 0 ? (
          <div className="text-xs text-muted-foreground border border-dashed rounded-md px-3 py-4 text-center">
            No evidence attached yet. Screenshots, exports, or notes help reviewers verify quickly.
          </div>
        ) : (
          <ul className="divide-y rounded-md border">
            {(attachments.data ?? []).map((a) => (
              <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{a.file_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {a.content_type ?? "file"} · {formatBytes(a.size_bytes)} · {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => onDownload(a)} title="Open">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      removeAttachment.mutate({ attachment_id: a.id, discrepancy_id: discrepancyId, storage_path: a.storage_path })
                    }
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Audit timeline</Label>
        <ScrollArea className="h-48 rounded-md border">
          <ul className="divide-y">
            {(events.data ?? []).map((e) => (
              <li key={e.id} className="px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{prettyEvent(e)}</span>
                  {e.to_status && <StatusChip status={e.to_status} />}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>
                {e.comment && <div className="mt-0.5 text-xs text-muted-foreground whitespace-pre-wrap">{e.comment}</div>}
              </li>
            ))}
            {(events.data ?? []).length === 0 && (
              <li className="px-3 py-4 text-xs text-muted-foreground text-center">No activity yet.</li>
            )}
          </ul>
        </ScrollArea>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Add a comment</Label>
        <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add context, findings, or a question…" />
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={onAddComment} disabled={addComment.isPending || !comment.trim()}>
            Post comment
          </Button>
        </div>
      </div>

      {/* Resolve / reopen */}
      <div className="rounded-md border p-3 space-y-2 bg-muted/30">
        {currentStatus === "resolved" ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">This discrepancy is marked resolved.</div>
            <Button size="sm" variant="outline" onClick={onReopen} disabled={updateStatus.isPending}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reopen
            </Button>
          </div>
        ) : (
          <>
            <Label className="text-sm">Resolution note (optional)</Label>
            <Textarea rows={2} value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} placeholder="What was corrected or confirmed." />
            <div className="flex justify-end">
              <Button size="sm" onClick={onResolve} disabled={updateStatus.isPending}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark resolved
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={onDone}>Close</Button>
      </div>
    </div>
  );
}

function prettyEvent(e: DiscrepancyEvent) {
  switch (e.event_type) {
    case "created": return "Reported";
    case "status_changed": return `Status → ${e.to_status}`;
    case "resolved": return "Resolved";
    case "reopened": return "Reopened";
    case "comment": return "Comment added";
    case "attachment_added": return "Evidence attached";
    case "attachment_removed": return "Evidence removed";
    default: return e.event_type;
  }
}

function formatBytes(n: number | null | undefined) {
  const b = Number(n ?? 0);
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}