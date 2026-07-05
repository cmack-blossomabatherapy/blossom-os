import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useOSRole } from "@/contexts/OSRoleContext";
import { useToast } from "@/hooks/use-toast";
import { stateDirectorStore } from "@/lib/os/stateDirector/stateDirectorStore";
import { deliverHandoff } from "@/lib/os/stateDirector/stateOperationsService";
import type { Department, Priority, StateCode } from "@/lib/os/stateDirector/types";

type Kind = "task" | "escalation" | "handoff";

interface Props {
  fromDepartment: Department;
  defaultKind?: Kind;
  linkedClientId?: string;
  linkedLeadId?: string;
  linkedCandidateId?: string;
  linkedAuthorizationId?: string;
  linkedSchedulingItemId?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultPriority?: Priority;
  sourceModule?: string;
  metadata?: Record<string, unknown>;
  buttonLabel?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}

const DEPARTMENTS: Department[] = [
  "Intake", "Authorizations", "Staffing", "Scheduling", "Clinical", "QA",
  "Recruiting", "HR", "Billing", "Growth", "Operations",
];

/**
 * Small dialog that lets a department workspace push work into the
 * State Support queue as either a task, escalation, or cross-department
 * handoff. Every record persists to Supabase and includes CentralReach
 * readiness fields.
 */
export function SendToStateSupportButton(props: Props) {
  const {
    fromDepartment, defaultKind = "task",
    buttonLabel = "Send to State Support",
    defaultTitle = "", defaultDescription = "", defaultPriority = "medium",
    sourceModule, metadata,
  } = props;
  const { activeState, role } = useOSRole();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [state, setState] = useState<StateCode>((activeState as StateCode) || "GA");
  const [toDepartment, setToDepartment] = useState<Department>("Operations");
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [submitting, setSubmitting] = useState(false);

  const actor = String(role || "Operator").replace(/_/g, " ");

  const reset = () => {
    setTitle(defaultTitle); setDescription(defaultDescription); setPriority(defaultPriority);
    setKind(defaultKind); setToDepartment("Operations");
  };

  const linked = {
    linkedClientId: props.linkedClientId,
    linkedLeadId: props.linkedLeadId,
    linkedCandidateId: props.linkedCandidateId,
    linkedAuthorizationId: props.linkedAuthorizationId,
    linkedSchedulingItemId: props.linkedSchedulingItemId,
  };
  const meta = {
    sourceModule: sourceModule ?? fromDepartment.toLowerCase(),
    metadata,
  };

  const submit = async () => {
    if (!title.trim()) {
      toast({ title: "Add a title", description: "State support needs a short summary." });
      return;
    }
    setSubmitting(true);
    try {
      if (kind === "task") {
        stateDirectorStore.createTask({
          state, title: title.trim(), description: description.trim() || undefined,
          department: fromDepartment, priority, createdBy: actor,
          ...linked, ...meta,
        });
        toast({ title: "Sent to State Support", description: "Task queued for the State Director." });
      } else if (kind === "escalation") {
        stateDirectorStore.createEscalation({
          state, title: title.trim(), description: description.trim() || undefined,
          department: fromDepartment, priority, createdBy: actor,
          ...linked, ...meta,
        });
        toast({ title: "Escalation opened", description: "State Director has been notified." });
      } else {
        await deliverHandoff({
          state, fromDepartment, toDepartment,
          subject: title.trim(), body: description.trim() || undefined,
          priority, createdBy: actor,
          ...linked, ...meta,
        });
        toast({ title: "Handoff delivered", description: `Routed to ${toDepartment}.` });
      }
      reset();
      setOpen(false);
    } catch (err) {
      toast({
        title: "Could not send",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant={props.variant ?? "outline"}
        size={props.size ?? "sm"}
        className={props.className}
        onClick={() => setOpen(true)}
      >
        <Send className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send to State Support</DialogTitle>
            <DialogDescription>
              Route work from {fromDepartment} into the State Director support queue.
              CentralReach sync is not connected yet — this is captured in Blossom OS only.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">State Support Task</SelectItem>
                    <SelectItem value="escalation">Urgent Escalation</SelectItem>
                    <SelectItem value="handoff">Department Handoff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={4} />
              </div>
              {kind === "handoff" ? (
                <div className="space-y-1">
                  <Label>Route to</Label>
                  <Select value={toDepartment} onValueChange={(v) => setToDepartment(v as Department)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : <div />}
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" />
            </div>
            <div className="space-y-1">
              <Label>Context / Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>{submitting ? "Sending…" : "Send"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}