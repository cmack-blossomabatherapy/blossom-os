import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LeadNameLink, useLeadDrawer } from "@/contexts/LeadDrawerContext";
import {
  MessageSquare, Plus, ArrowRight, ArrowLeft, UserPlus, AlertCircle,
  ShieldCheck, ShieldAlert, Flame, ExternalLink,
  Phone, Send, Mail, FileText, BellRing,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/data/leads";
import { useLeads } from "@/contexts/LeadsContext";
import { useLeadJourneyLive } from "@/hooks/useLeadJourneyLive";
import {
  getNextFamilyLeadStage,
  getPreviousFamilyLeadStage,
  canonicalFamilyLeadStage,
  isReadyToStartStage,
  getMissingInfoFlags,
  ESCALATION_SEVERITIES,
  type EscalationSeverity,
} from "@/lib/intake/intakeWorkflow";
import {
  callParent,
  sendLeadEmail,
  sendLeadSms,
  sendIntakePacket,
  sendMissingInfoReminder,
  notifyCommunicationResult,
} from "@/lib/integrations/communications/communicationAdapters";

export type LeadActionPanelProps = {
  lead: Lead;
  compact?: boolean;
  sourcePage?: string;
  onAfterAction?: () => void;
};

type InteractionKind = "call" | "sms" | "email" | "note";

const MISSING_OPTIONS: { key: string; label: string; tag: string }[] = [
  { key: "phone", label: "Parent phone", tag: "missing_phone" },
  { key: "email", label: "Parent email", tag: "missing_email" },
  { key: "insurance", label: "Insurance", tag: "missing_insurance" },
  { key: "diagnosis", label: "Diagnosis / DX", tag: "missing_dx" },
  { key: "dob", label: "Date of birth", tag: "missing_dob" },
  { key: "referral_source", label: "Referral source", tag: "missing_referral_source" },
  { key: "documents", label: "Documents", tag: "missing_documents" },
  { key: "other", label: "Other", tag: "missing_other" },
];

/**
 * Sprint 08 — canonical operational action surface for a single lead.
 *
 * Consumes the existing `useLeads` context and the live `useLeadJourneyLive`
 * hook for UUID-backed leads. For non-persistable leads (mock / Monday
 * imports) it still updates the local context where possible and surfaces a
 * friendly toast for DB-only actions.
 */
export function LeadActionPanel({ lead, compact, sourcePage, onAfterAction }: LeadActionPanelProps) {
  const { moveStage, revertStage, assignOwner, addTag } = useLeads();
  const { logInteraction, addFollowUp, isPersistable } = useLeadJourneyLive(lead.id);
  const { openLead } = useLeadDrawer();

  const [logOpen, setLogOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [missingOpen, setMissingOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);

  // Export 80 — canonical 13-stage Family / Lead Workflow movement. Legacy
  // statuses are aliased via canonicalFamilyLeadStage so a record sitting in
  // a Monday-era status still advances along the canonical pipeline.
  const canonical = useMemo(() => canonicalFamilyLeadStage(lead.status), [lead.status]);
  const nextStage = useMemo(() => getNextFamilyLeadStage(lead.status), [lead.status]);
  const prevStage = useMemo(() => getPreviousFamilyLeadStage(lead.status), [lead.status]);
  const atPipelineEnd = useMemo(() => isReadyToStartStage(lead.status), [lead.status]);
  const vobEligible = canonical === "Intake Complete";
  const benefitsInProgress = canonical === "Benefits Verification";

  const after = () => onAfterAction?.();

  const safeMove = (next: LeadStatus, label: string) => {
    moveStage([lead.id], next);
    toast.success(`Moved to ${label}`);
    after();
  };

  const handleAssign = (owner: string) => {
    if (!owner.trim()) return;
    assignOwner([lead.id], owner.trim());
    toast.success(`Assigned to ${owner.trim()}`);
    setOwnerOpen(false);
    after();
  };

  const btnSize = compact ? "sm" : "sm";

  // Export 81 — adapter-driven family contact actions. These replace the old
  // logging-only pattern as the primary communication workflow.
  const leadContext = {
    leadId: lead.id,
    phone: lead.phone,
    email: lead.email,
    parentName: lead.parentName,
    childName: lead.childName,
    state: lead.state,
    insurance: lead.insurance,
  };
  const hasPhone = Boolean(lead.phone && lead.phone.trim());
  const hasEmail = Boolean(lead.email && lead.email.trim());

  // Compact mode (used on cards) keeps the legacy chip strip so card layout
  // does not blow up. The modal/expanded surface gets the new sectioned UI.
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1" data-source-page={sourcePage}>
        <Button size="sm" variant="default" disabled={!hasPhone}
          onClick={async () => notifyCommunicationResult(await callParent(leadContext))}>
          <Phone className="h-3.5 w-3.5 mr-1" /> Call
        </Button>
        <Button size="sm" variant="outline" disabled={!hasPhone}
          onClick={async () => notifyCommunicationResult(await sendLeadSms(leadContext))}>
          <Send className="h-3.5 w-3.5 mr-1" /> SMS
        </Button>
        <Button size="sm" variant="outline" disabled={!hasEmail}
          onClick={async () => notifyCommunicationResult(await sendLeadEmail(leadContext))}>
          <Mail className="h-3.5 w-3.5 mr-1" /> Email
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setFollowOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Follow-Up
        </Button>
      </div>
    );
  }

  type ActionCard = {
    icon: LucideIcon;
    label: string;
    description: string;
    onClick: () => void;
    disabled?: boolean;
    disabledHint?: string;
    tone?: "primary" | "default" | "warning" | "danger";
  };

  type ActionSection = {
    id: string;
    title: string;
    subtitle: string;
    actions: ActionCard[];
  };

  const sections: ActionSection[] = [
    {
      id: "contact",
      title: "Contact family",
      subtitle: "Reach the parent directly through the phone, SMS, or email systems.",
      actions: [
        {
          icon: Phone,
          label: "Call Parent",
          description: "Place an outbound call through the phone system.",
          onClick: async () => notifyCommunicationResult(await callParent(leadContext)),
          disabled: !hasPhone,
          disabledHint: "No phone on file",
          tone: "primary",
        },
        {
          icon: Send,
          label: "Send SMS",
          description: "Send a quick text to the parent's phone on file.",
          onClick: async () => notifyCommunicationResult(await sendLeadSms(leadContext)),
          disabled: !hasPhone,
          disabledHint: "No phone on file",
        },
        {
          icon: Mail,
          label: "Send Email",
          description: "Email the parent using their address on file.",
          onClick: async () => notifyCommunicationResult(await sendLeadEmail(leadContext)),
          disabled: !hasEmail,
          disabledHint: "No email on file",
        },
        {
          icon: FileText,
          label: "Send Intake Packet",
          description: "Email the standard intake packet for the family to complete.",
          onClick: async () => notifyCommunicationResult(await sendIntakePacket(leadContext)),
          disabled: !hasEmail,
          disabledHint: "No email on file",
        },
        {
          icon: BellRing,
          label: "Missing Info Reminder",
          description: "Nudge the family for outstanding documents or info.",
          onClick: async () => notifyCommunicationResult(await sendMissingInfoReminder(leadContext)),
          disabled: !hasPhone && !hasEmail,
          disabledHint: "No phone or email on file",
        },
      ],
    },
    {
      id: "workflow",
      title: "Move the workflow",
      subtitle: "Advance, rewind, or trigger the canonical Family / Lead pipeline.",
      actions: [
        ...(nextStage && !atPipelineEnd
          ? [{
              icon: ArrowRight,
              label: `Move Forward → ${nextStage}`,
              description: "Advance this lead to the next canonical pipeline stage.",
              onClick: () => safeMove(nextStage, nextStage),
              tone: "primary" as const,
            }]
          : []),
        ...(prevStage
          ? [{
              icon: ArrowLeft,
              label: `Back to ${prevStage}`,
              description: "Send the lead back one stage if it was moved by mistake.",
              onClick: () => {
                revertStage(lead.id, prevStage, 0, "Manual workflow correction");
                toast.success(`Moved back to ${prevStage}`);
                after();
              },
            }]
          : []),
        ...(vobEligible
          ? [{
              icon: ShieldCheck,
              label: "Start Benefits Verification",
              description: "Begin the benefits verification workflow and queue a follow-up.",
              onClick: () => {
                moveStage([lead.id], "Benefits Verification");
                void tryAddFollowUp({ isPersistable, addFollowUp, title: "Start benefits verification" });
                toast.success("Started benefits verification");
                after();
              },
            }]
          : []),
        ...(benefitsInProgress
          ? [{
              icon: ShieldCheck,
              label: "Mark Benefits Verified",
              description: "Confirm benefits and advance to Assessment Scheduling.",
              onClick: () => {
                moveStage([lead.id], "Assessment Scheduling");
                void tryAddFollowUp({ isPersistable, addFollowUp, title: "Schedule assessment" });
                toast.success("Benefits verified — moved to Assessment Scheduling");
                after();
              },
            }]
          : []),
        {
          icon: Plus,
          label: "Add Follow-Up",
          description: "Create a dated follow-up task tied to this lead.",
          onClick: () => setFollowOpen(true),
        },
      ],
    },
    {
      id: "coordination",
      title: "Coordinate",
      subtitle: "Assign ownership, flag what's missing, or raise an escalation.",
      actions: [
        {
          icon: UserPlus,
          label: "Assign Owner",
          description: "Hand off this lead to another intake coordinator.",
          onClick: () => setOwnerOpen(true),
        },
        {
          icon: AlertCircle,
          label: "Flag Missing Info",
          description: "Tag what's missing and move to Intake Packet Follow Up.",
          onClick: () => setMissingOpen(true),
          tone: "warning",
        },
        {
          icon: Flame,
          label: "Escalate",
          description: "Raise an escalation with severity and assigned owner.",
          onClick: () => setEscalateOpen(true),
          tone: "danger",
        },
      ],
    },
    {
      id: "other",
      title: "Lead record",
      subtitle: "Open the full record or log a note for the timeline.",
      actions: [
        {
          icon: ExternalLink,
          label: "Open Lead",
          description: "Open the full lead detail drawer with timeline and docs.",
          onClick: () => {
            openLead(lead.id);
            after();
          },
        },
        {
          icon: ExternalLink,
          label: "Journey",
          description: "Open the lead's Journey timeline in the detail drawer.",
          onClick: () => {
            openLead(lead.id);
            after();
          },
        },
        {
          icon: MessageSquare,
          label: "Add Note",
          description: "Log a note, call, text, or email entry on the lead timeline.",
          onClick: () => setLogOpen(true),
        },
      ],
    },
  ];

  const toneClasses: Record<NonNullable<ActionCard["tone"]>, string> = {
    primary: "border-primary/30 bg-primary/[0.04] hover:border-primary/60 hover:bg-primary/[0.08]",
    default: "border-border/60 bg-background hover:border-primary/40 hover:bg-accent/40",
    warning: "border-amber-300/60 bg-amber-50/40 hover:border-amber-400 hover:bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/[0.06] dark:hover:bg-amber-500/[0.12]",
    danger:  "border-rose-300/60 bg-rose-50/40 hover:border-rose-400 hover:bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/[0.06] dark:hover:bg-rose-500/[0.12]",
  };
  const toneIconClasses: Record<NonNullable<ActionCard["tone"]>, string> = {
    primary: "bg-primary/10 text-primary",
    default: "bg-muted text-foreground/70",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    danger:  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  };

  return (
    <div className="space-y-5" data-source-page={sourcePage}>
      {!isPersistable && (
        <div className="rounded-lg border border-dashed border-amber-300/60 bg-amber-50/40 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/[0.06] dark:text-amber-200">
          This lead isn't synced to the database yet — actions that write history (follow-ups, notes) are disabled until it syncs.
        </div>
      )}

      {sections.map((section) => (
        section.actions.length === 0 ? null : (
          <section key={section.id} className="space-y-2">
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h4>
              <p className="text-xs text-muted-foreground/80">{section.subtitle}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {section.actions.map((a) => {
                const tone = a.tone ?? "default";
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.onClick}
                    disabled={a.disabled}
                    title={a.disabled ? a.disabledHint : undefined}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                      "hover:shadow-sm",
                      a.disabled
                        ? "cursor-not-allowed opacity-50 border-border/60 bg-muted/20"
                        : toneClasses[tone],
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        a.disabled ? "bg-muted text-muted-foreground" : toneIconClasses[tone],
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-tight text-foreground">
                        {a.label}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                        {a.disabled && a.disabledHint ? a.disabledHint : a.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )
      ))}

      <LogContactDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        onSave={async (kind, preview, owner, subject) => {
          if (!isPersistable) {
            toast.message("This lead is not synced yet. Logging will be available after sync.");
            return;
          }
          try {
            await logInteraction(kind, preview, owner, subject);
            toast.success("Contact logged");
            after();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not log contact");
          }
        }}
      />

      <FollowUpDialog
        open={followOpen}
        onOpenChange={setFollowOpen}
        defaultOwner={lead.owner}
        onSave={async (title, dueDate, owner, notes) => {
          if (!isPersistable) {
            toast.message("This lead is not synced yet. Follow-ups will be available after sync.");
            return;
          }
          try {
            await addFollowUp(title, dueDate, owner, notes);
            toast.success("Follow-up added");
            after();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not add follow-up");
          }
        }}
      />

      <AssignOwnerDialog
        open={ownerOpen}
        onOpenChange={setOwnerOpen}
        currentOwner={lead.owner}
        onSave={handleAssign}
      />

      <MissingInfoDialog
        open={missingOpen}
        onOpenChange={setMissingOpen}
        lead={lead}
        onSave={async (selected) => {
          if (selected.length === 0) return;
          const tags = selected.map((s) => s.tag);
          tags.forEach((t) => addTag([lead.id], t));
          // Export 88 — decide "already blocked" via canonical stage so
          // legacy "Missing Information" / "Sent Form" rows that map to
          // Intake Packet Follow Up are not double-moved.
          const canonicalCurrent = canonicalFamilyLeadStage(lead.status);
          const isBlockedAlready =
            canonicalCurrent === "Intake Packet Follow Up" ||
            lead.status === "Non-Qualified" ||
            lead.status === "Non-qualified Lead" ||
            lead.status === "Can't Reach" ||
            lead.status === "Sent Packet - Can't Reach";
          if (!isBlockedAlready) {
            // Export 87 — canonical Family / Lead Workflow uses
            // "Intake Packet Follow Up" as the missing-info stage.
            moveStage([lead.id], "Intake Packet Follow Up");
          }
          if (isPersistable) {
            try {
              await addFollowUp(
                "Collect missing information",
                undefined,
                lead.owner,
                selected.map((s) => s.label).join(", "),
              );
              await logInteraction(
                "note",
                `Missing info flagged: ${selected.map((s) => s.label).join(", ")}`,
                lead.owner,
              );
            } catch {
              /* non-fatal */
            }
          }
          toast.success(isBlockedAlready ? "Packet follow-up flagged" : "Moved to Intake Packet Follow Up");
          after();
        }}
      />

      <EscalateDialog
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        onSave={async (reason, severity, owner) => {
          addTag([lead.id], "escalated");
          addTag([lead.id], `escalation_${severity}`);
          if (isPersistable) {
            try {
              await addFollowUp(
                `Escalation: ${reason}`,
                undefined,
                owner || lead.owner,
                `Severity: ${severity}`,
              );
              await logInteraction(
                "note",
                `Escalated (${severity}): ${reason}`,
                owner || lead.owner,
              );
            } catch {
              /* non-fatal */
            }
          }
          toast.success("Lead escalated");
          after();
        }}
      />
    </div>
  );
}

async function tryAddFollowUp(opts: {
  isPersistable: boolean;
  addFollowUp: (title: string, dueDate?: string, owner?: string, notes?: string) => Promise<void>;
  title: string;
}) {
  if (!opts.isPersistable) return;
  try { await opts.addFollowUp(opts.title); } catch { /* non-fatal */ }
}

/* --------------------------------- Dialogs -------------------------------- */

function LogContactDialog({
  open, onOpenChange, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (kind: InteractionKind, preview: string, owner?: string, subject?: string) => Promise<void> | void;
}) {
  const [kind, setKind] = useState<InteractionKind>("call");
  const [preview, setPreview] = useState("");
  const [subject, setSubject] = useState("");
  const [owner, setOwner] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Contact</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as InteractionKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="sms">Text</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea placeholder="What happened?" value={preview} onChange={(e) => setPreview(e.target.value)} rows={3} />
          <Input placeholder="Logged by (optional)" value={owner} onChange={(e) => setOwner(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!preview.trim()) { toast.error("Add a short summary"); return; }
            await onSave(kind, preview.trim(), owner || undefined, subject || undefined);
            setPreview(""); setSubject(""); setOwner("");
            onOpenChange(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FollowUpDialog({
  open, onOpenChange, onSave, defaultOwner,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultOwner?: string;
  onSave: (title: string, dueDate?: string, owner?: string, notes?: string) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [owner, setOwner] = useState(defaultOwner ?? "");
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Follow-Up</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Follow-up action" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Input placeholder="Owner (optional)" value={owner} onChange={(e) => setOwner(e.target.value)} />
          <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!title.trim()) { toast.error("Title required"); return; }
            await onSave(title.trim(), dueDate || undefined, owner || undefined, notes || undefined);
            setTitle(""); setDueDate(""); setNotes("");
            onOpenChange(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignOwnerDialog({
  open, onOpenChange, onSave, currentOwner,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentOwner?: string;
  onSave: (owner: string) => void;
}) {
  const [owner, setOwner] = useState(currentOwner ?? "");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign Owner</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label className="text-xs">Owner name</Label>
          <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Intake coordinator name" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(owner)}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MissingInfoDialog({
  open, onOpenChange, onSave, lead,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: Lead;
  onSave: (selected: { key: string; label: string; tag: string }[]) => Promise<void> | void;
}) {
  const flags = useMemo(() => getMissingInfoFlags(lead), [lead]);
  const initial = useMemo(() => {
    const preset = new Set<string>();
    if (flags.phone) preset.add("phone");
    if (flags.email) preset.add("email");
    if (flags.insurance) preset.add("insurance");
    if (flags.diagnosis) preset.add("diagnosis");
    if (flags.dob) preset.add("dob");
    if (flags.referralSource) preset.add("referral_source");
    if (flags.documents) preset.add("documents");
    return preset;
  }, [flags]);
  const [picked, setPicked] = useState<Set<string>>(initial);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) setPicked(new Set(initial)); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Flag Packet Follow Up / Missing Info</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {MISSING_OPTIONS.map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={picked.has(opt.key)}
                onCheckedChange={(c) => {
                  setPicked((prev) => {
                    const next = new Set(prev);
                    if (c) next.add(opt.key); else next.delete(opt.key);
                    return next;
                  });
                }}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            const selected = MISSING_OPTIONS.filter((o) => picked.has(o.key));
            if (selected.length === 0) { toast.error("Pick at least one"); return; }
            await onSave(selected);
            onOpenChange(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EscalateDialog({
  open, onOpenChange, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (reason: string, severity: EscalationSeverity, owner?: string) => Promise<void> | void;
}) {
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<EscalationSeverity>("medium");
  const [owner, setOwner] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Escalate Lead</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Textarea placeholder="Reason for escalation" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          <div>
            <Label className="text-xs">Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as EscalationSeverity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESCALATION_SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Owner / team (optional)" value={owner} onChange={(e) => setOwner(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!reason.trim()) { toast.error("Add a reason"); return; }
            await onSave(reason.trim(), severity, owner || undefined);
            setReason(""); setOwner(""); setSeverity("medium");
            onOpenChange(false);
          }}>Escalate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}