import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { missingRequiredFields, type RequiredFieldRule } from "./supervisionLogic";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rbtEmployeeId: string;
  rbtName: string;
  clientOptions: string[];
  onSaved?: () => void;
}

/**
 * Structured post-supervision record. Required-field enforcement is driven
 * by bcba_supervision_config so administrators can decide which fields count
 * as required documentation vs operational-only.
 */
export function PostSupervisionDialog({ open, onOpenChange, rbtEmployeeId, rbtName, clientOptions, onSaved }: Props) {
  const { user } = useAuth();
  const osRole = useOSRoleSafe();
  const isPreviewing = Boolean(osRole?.isPreviewing);
  const qc = useQueryClient();

  const [occurredAt, setOccurredAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [minutes, setMinutes] = useState<number>(30);
  const [format, setFormat] = useState<string>("in_person");
  const [individualOrGroup, setIndividualOrGroup] = useState<string>("individual");
  const [observationCompleted, setObservationCompleted] = useState(false);
  const [casesDiscussed, setCasesDiscussed] = useState<string[]>([]);
  const [skillsReviewed, setSkillsReviewed] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [trainingAssigned, setTrainingAssigned] = useState<string>("");
  const [followupAction, setFollowupAction] = useState<string>("");
  const [nextSupervisionDate, setNextSupervisionDate] = useState<string>("");
  const [rbtAcknowledged, setRbtAcknowledged] = useState(false);
  const [bcbaSigned, setBcbaSigned] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setOccurredAt(new Date().toISOString().slice(0, 16));
    setMinutes(30); setFormat("in_person"); setIndividualOrGroup("individual");
    setObservationCompleted(false); setCasesDiscussed([]); setSkillsReviewed("");
    setFeedback(""); setTrainingAssigned(""); setFollowupAction("");
    setNextSupervisionDate(""); setRbtAcknowledged(false); setBcbaSigned(false); setAttachmentUrl("");
  }, [open, rbtEmployeeId]);

  const { data: rules } = useQuery({
    queryKey: ["bcba-supervision-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bcba_supervision_config").select("field_key,label,is_required_documentation,is_operational_only");
      if (error) throw error;
      return (data ?? []) as RequiredFieldRule[];
    },
  });

  const values = {
    occurred_at: occurredAt,
    minutes,
    supervision_format: format,
    individual_or_group: individualOrGroup,
    observation_completed: observationCompleted,
    cases_discussed: casesDiscussed,
    skills_reviewed: skillsReviewed ? skillsReviewed.split(",").map(s => s.trim()).filter(Boolean) : [],
    feedback,
    training_assigned: trainingAssigned,
    followup_action: followupAction,
    next_supervision_date: nextSupervisionDate,
    rbt_acknowledged_at: rbtAcknowledged ? new Date().toISOString() : "",
    bcba_signed_at: bcbaSigned ? new Date().toISOString() : "",
    attachment_url: attachmentUrl,
  };

  const missing = useMemo(
    () => missingRequiredFields(rules ?? [], values),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, occurredAt, minutes, format, individualOrGroup, observationCompleted, casesDiscussed, skillsReviewed, feedback, trainingAssigned, followupAction, nextSupervisionDate, rbtAcknowledged, bcbaSigned, attachmentUrl],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (isPreviewing) throw new Error("Read-only in preview mode.");
      if (missing.length > 0) {
        throw new Error(`Missing required documentation: ${missing.join(", ")}`);
      }
      const insertPayload: any = {
        provider_id: rbtEmployeeId,
        provider_name: rbtName,
        bcba_id: user?.id ?? null,
        occurred_at: new Date(occurredAt).toISOString(),
        minutes,
        modality: format,
        supervision_format: format,
        individual_or_group: individualOrGroup,
        observation_completed: observationCompleted,
        cases_discussed: [], // uuid[] — free-text client names below
        skills_reviewed: values.skills_reviewed,
        feedback,
        training_assigned: trainingAssigned || null,
        followup_action: followupAction || null,
        next_supervision_date: nextSupervisionDate || null,
        rbt_acknowledged_at: rbtAcknowledged ? new Date().toISOString() : null,
        bcba_signed_at: bcbaSigned ? new Date().toISOString() : null,
        attachment_url: attachmentUrl || null,
        notes: casesDiscussed.length ? `Cases: ${casesDiscussed.join(", ")}` : null,
        created_by: user?.id ?? null,
        client_name: casesDiscussed[0] ?? null,
      };
      const { data, error } = await supabase
        .from("bcba_supervision_logs")
        .insert(insertPayload)
        .select("id").single();
      if (error) throw error;

      await supabase.from("bcba_supervision_audit").insert({
        supervision_log_id: data.id,
        actor_id: user?.id ?? null,
        event: "created",
        payload: insertPayload,
      });

      // Mirror into rbt_supervision so the RBT sees a consistent record
      await supabase.from("rbt_supervision").insert({
        rbt_employee_id: rbtEmployeeId,
        bcba_id: user?.id ?? null,
        supervision_date: new Date(occurredAt).toISOString().slice(0, 10),
        supervision_type: format,
        notes: casesDiscussed.length ? `Cases: ${casesDiscussed.join(", ")}` : null,
        feedback,
        status: "logged",
        signed_by_bcba_at: bcbaSigned ? new Date().toISOString() : null,
        acknowledged_by_rbt_at: rbtAcknowledged ? new Date().toISOString() : null,
      });

      return data.id;
    },
    onSuccess: () => {
      toast.success("Supervision record saved");
      qc.invalidateQueries({ queryKey: ["bcba-supervision-month"] });
      onOpenChange(false);
      onSaved?.();
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save supervision"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log supervision — {rbtName}</DialogTitle>
          <DialogDescription>
            Operational tracking only. Required BACB / CentralReach records must still be filed
            in CentralReach.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div><Label>Date & time</Label>
            <Input type="datetime-local" value={occurredAt} onChange={e => setOccurredAt(e.target.value)} />
          </div>
          <div><Label>Duration (minutes)</Label>
            <Input type="number" min={1} value={minutes} onChange={e => setMinutes(Number(e.target.value))} />
          </div>
          <div><Label>Format</Label>
            <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={format} onChange={e => setFormat(e.target.value)}>
              <option value="in_person">In person</option>
              <option value="virtual">Virtual</option>
              <option value="hybrid">Hybrid</option>
              <option value="observation">Observation</option>
            </select>
          </div>
          <div><Label>Individual / group</Label>
            <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={individualOrGroup} onChange={e => setIndividualOrGroup(e.target.value)}>
              <option value="individual">Individual</option>
              <option value="group">Group</option>
            </select>
          </div>
          <label className="col-span-2 flex items-center gap-2">
            <Checkbox checked={observationCompleted} onCheckedChange={v => setObservationCompleted(!!v)} />
            <span className="text-sm">Direct observation completed</span>
          </label>
          <div className="col-span-2"><Label>Cases discussed</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {clientOptions.length === 0 && <span className="text-xs text-muted-foreground">No assigned clients.</span>}
              {clientOptions.map(name => {
                const active = casesDiscussed.includes(name);
                return (
                  <button key={name} type="button"
                    onClick={() => setCasesDiscussed(cur => active ? cur.filter(x => x !== name) : [...cur, name])}
                    className={"px-2 py-1 rounded-full text-xs border " + (active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground")}>
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="col-span-2"><Label>Skills reviewed (comma-separated)</Label>
            <Input value={skillsReviewed} onChange={e => setSkillsReviewed(e.target.value)} placeholder="Discrete trial, prompting hierarchy…" />
          </div>
          <div className="col-span-2"><Label>Feedback provided</Label>
            <Textarea rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} />
          </div>
          <div className="col-span-2"><Label>Training assigned</Label>
            <Input value={trainingAssigned} onChange={e => setTrainingAssigned(e.target.value)} placeholder="Optional" />
          </div>
          <div className="col-span-2"><Label>Follow-up action</Label>
            <Textarea rows={2} value={followupAction} onChange={e => setFollowupAction(e.target.value)} />
          </div>
          <div><Label>Next supervision date</Label>
            <Input type="date" value={nextSupervisionDate} onChange={e => setNextSupervisionDate(e.target.value)} />
          </div>
          <div><Label>Supporting attachment URL</Label>
            <Input value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} placeholder="Optional link" />
          </div>
          <label className="flex items-center gap-2">
            <Checkbox checked={rbtAcknowledged} onCheckedChange={v => setRbtAcknowledged(!!v)} />
            <span className="text-sm">RBT acknowledged</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={bcbaSigned} onCheckedChange={v => setBcbaSigned(!!v)} />
            <span className="text-sm flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> BCBA confirmation</span>
          </label>
        </div>

        {missing.length > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <div className="font-medium">Missing required documentation</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {missing.map(m => <Badge key={m} variant="outline">{m}</Badge>)}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || missing.length > 0 || isPreviewing}>
            {save.isPending ? "Saving…" : isPreviewing ? "Read-only in preview" : "Save supervision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}