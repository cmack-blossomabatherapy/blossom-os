import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { SUPPORT_CATEGORIES, categoryFor, type SupportCategoryKey } from "./config";
import { useCreateSupportRequest } from "./useSupport";

export default function NewSupportRequestDialog({
  open, onOpenChange, bcbaId, bcbaName, initialCategory,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bcbaId: string;
  bcbaName?: string;
  initialCategory?: SupportCategoryKey;
}) {
  const [category, setCategory] = useState<SupportCategoryKey>(initialCategory ?? "authorization");
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [urgency, setUrgency] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [stateCode, setStateCode] = useState("");
  const [clinic, setClinic] = useState("");
  const [clientRef, setClientRef] = useState("");
  const [rbtRef, setRbtRef] = useState("");
  const [containsClient, setContainsClient] = useState(false);
  const cat = useMemo(() => categoryFor(category), [category]);
  const create = useCreateSupportRequest();

  const submit = async () => {
    if (!subject.trim()) { toast.error("Please add a short subject."); return; }
    try {
      await create.mutateAsync({
        bcba_id: bcbaId, bcba_name: bcbaName,
        category, subject: subject.trim(), detail: detail.trim() || undefined,
        urgency, state: stateCode || undefined, clinic: clinic || undefined,
        client_ref: clientRef || undefined, rbt_ref: rbtRef || undefined,
        contains_client_details: containsClient,
      });
      toast.success(`Sent to ${cat.friendlyOwner}. SLA ${cat.defaultSlaHours}h.`);
      onOpenChange(false);
      setSubject(""); setDetail(""); setClientRef(""); setRbtRef(""); setContainsClient(false);
    } catch (e: any) { toast.error(e?.message ?? "Could not submit."); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New support request</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v as SupportCategoryKey); setUrgency(categoryFor(v).defaultUrgency); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORT_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-[11px] text-muted-foreground mt-1">
              Routes to {cat.friendlyOwner} · SLA {cat.defaultSlaHours}h
            </div>
          </div>
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
          </div>
          <div>
            <Label>Detail</Label>
            <Textarea rows={4} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="What's happening, and what would help." />
            <div className="text-[11px] text-muted-foreground mt-1">Avoid full PHI. Use internal identifiers where possible.</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>State</Label>
              <Input value={stateCode} onChange={(e) => setStateCode(e.target.value)} placeholder="e.g. NC" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Clinic</Label>
              <Input value={clinic} onChange={(e) => setClinic(e.target.value)} />
            </div>
            <div>
              <Label>Client reference (optional)</Label>
              <Input value={clientRef} onChange={(e) => setClientRef(e.target.value)} placeholder="Initials or ID" />
            </div>
          </div>
          <div>
            <Label>RBT reference (optional)</Label>
            <Input value={rbtRef} onChange={(e) => setRbtRef(e.target.value)} placeholder="Name or ID" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox id="containsClient" checked={containsClient} onCheckedChange={(v) => setContainsClient(Boolean(v))} />
            <Label htmlFor="containsClient" className="text-xs font-normal text-muted-foreground">
              This request references sensitive client details (restrict visibility)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Send request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}