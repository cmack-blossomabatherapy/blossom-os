import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export default function CreateCycleDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"Quarterly" | "Annual">("Quarterly");
  const [staffType, setStaffType] = useState<"BCBA" | "RBT" | "Both">("Both");
  const [start, setStart] = useState("");
  const [selfDue, setSelfDue] = useState("");
  const [leadershipDue, setLeadershipDue] = useState("");
  const [meetingDue, setMeetingDue] = useState("");
  const [finalDue, setFinalDue] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("evaluation_cycles").insert({
      name: name.trim(),
      evaluation_type: type,
      staff_type: staffType,
      start_date: start || null,
      self_due_date: selfDue || null,
      leadership_due_date: leadershipDue || null,
      meeting_due_date: meetingDue || null,
      final_due_date: finalDue || null,
      status: "Draft",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to create cycle", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cycle created" });
    onCreated();
    onOpenChange(false);
    setName(""); setStart(""); setSelfDue(""); setLeadershipDue(""); setMeetingDue(""); setFinalDue("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Evaluation Cycle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Cycle name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q1 2026 Evaluation" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Evaluation type</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Staff type</Label>
              <Select value={staffType} onValueChange={(v) => setStaffType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BCBA">BCBA</SelectItem>
                  <SelectItem value="RBT">RBT</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Self-evaluation due</Label><Input type="date" value={selfDue} onChange={(e) => setSelfDue(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Leadership review due</Label><Input type="date" value={leadershipDue} onChange={(e) => setLeadershipDue(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Meeting due</Label><Input type="date" value={meetingDue} onChange={(e) => setMeetingDue(e.target.value)} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Final completion due</Label><Input type="date" value={finalDue} onChange={(e) => setFinalDue(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Create cycle"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}