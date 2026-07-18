import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { METRIC_DEFINITIONS } from "./pipeline";
import { useReportDiscrepancy } from "./useProductivity";

export default function ReportDiscrepancyDialog({
  open, onOpenChange, snapshotId, bcbaId, initialMetric,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  snapshotId: string;
  bcbaId: string;
  initialMetric?: string;
}) {
  const [metric, setMetric] = useState(initialMetric ?? METRIC_DEFINITIONS[0].key);
  const [reported, setReported] = useState("");
  const [expected, setExpected] = useState("");
  const [detail, setDetail] = useState("");
  const submit = useReportDiscrepancy();

  const onSubmit = async () => {
    try {
      await submit.mutateAsync({
        snapshot_id: snapshotId,
        bcba_id: bcbaId,
        metric_key: metric,
        reported_value: reported || undefined,
        expected_value: expected || undefined,
        detail: detail || undefined,
      });
      toast.success("Discrepancy reported — a task was created for review.");
      onOpenChange(false);
      setReported(""); setExpected(""); setDetail("");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not submit discrepancy.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Report a data discrepancy</DialogTitle>
        </DialogHeader>
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
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submit.isPending}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}