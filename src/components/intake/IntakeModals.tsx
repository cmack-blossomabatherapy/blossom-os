import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads } from "@/contexts/LeadsContext";
import type { Lead } from "@/data/leads";

type ModalKind =
  | { kind: "note"; lead?: Lead }
  | { kind: "escalate"; lead?: Lead }
  | { kind: "snooze"; lead?: Lead; followUpLabel?: string }
  | { kind: "comm"; lead?: Lead; channel: "text" | "email" | "call" }
  | { kind: "schedule"; lead?: Lead }
  | { kind: "assignBcba"; lead?: Lead }
  | { kind: "addLead" }
  | { kind: "followUp"; lead?: Lead }
  | { kind: "sendPacket"; lead?: Lead };

interface IntakeModalsCtx {
  open: (m: ModalKind) => void;
}
const Ctx = createContext<IntakeModalsCtx | null>(null);

export function useIntakeModals(): IntakeModalsCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useIntakeModals must be used inside IntakeModalsProvider");
  return v;
}

export function IntakeModalsProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ModalKind | null>(null);
  const open = useCallback((m: ModalKind) => setActive(m), []);
  const close = useCallback(() => setActive(null), []);
  const ctx = useMemo(() => ({ open }), [open]);

  return (
    <Ctx.Provider value={ctx}>
      {children}
      {active && <Modals active={active} close={close} />}
    </Ctx.Provider>
  );
}

function Modals({ active, close }: { active: ModalKind; close: () => void }) {
  const navigate = useNavigate();
  const { updateLead, addLead, leads } = useLeads();
  const leadLabel = (l?: Lead) => (l ? `${l.parentName || l.childName} — ${l.childName}` : "Select a family");

  // shared state holders per modal kind
  const [text, setText] = useState("");
  const [text2, setText2] = useState("");
  const [select1, setSelect1] = useState("");
  const [select2, setSelect2] = useState("");
  const [leadId, setLeadId] = useState<string>(active.kind !== "addLead" ? active.lead?.id ?? "" : "");

  const resolvedLead =
    active.kind !== "addLead"
      ? active.lead ?? leads.find((l) => l.id === leadId)
      : undefined;

  /* ─────────── NOTE ─────────── */
  if (active.kind === "note") {
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add note</DialogTitle>
            <DialogDescription>{leadLabel(resolvedLead)}</DialogDescription>
          </DialogHeader>
          {!active.lead && (
            <LeadPicker leads={leads} value={leadId} onChange={setLeadId} />
          )}
          <Textarea
            autoFocus
            placeholder="What happened? What's next?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              disabled={!text.trim() || !resolvedLead}
              onClick={() => {
                if (!resolvedLead) return;
                const stamp = new Date().toLocaleString();
                updateLead(resolvedLead.id, {
                  notes: [`${stamp} — ${text.trim()}`, resolvedLead.notes].filter(Boolean).join("\n\n"),
                });
                toast.success("Note saved");
                close();
              }}
            >
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─────────── ESCALATE ─────────── */
  if (active.kind === "escalate") {
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate family</DialogTitle>
            <DialogDescription>{leadLabel(resolvedLead)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Reason</Label>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. VOB stalled 10+ days" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={select1} onValueChange={setSelect1}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Assign to</Label>
                <Select value={select2} onValueChange={setSelect2}>
                  <SelectTrigger><SelectValue placeholder="Owner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intake_lead">Intake Lead</SelectItem>
                    <SelectItem value="ops">Operations</SelectItem>
                    <SelectItem value="state_director">State Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={text2} onChange={(e) => setText2(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              disabled={!text.trim() || !select1 || !select2 || !resolvedLead}
              onClick={() => {
                if (!resolvedLead) return;
                updateLead(resolvedLead.id, {
                  automationLog: [
                    `Escalated → ${select2} (${select1}): ${text.trim()}`,
                    ...resolvedLead.automationLog,
                  ],
                });
                toast.success("Escalation created");
                close();
              }}
            >
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─────────── SNOOZE ─────────── */
  if (active.kind === "snooze") {
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snooze follow-up</DialogTitle>
            <DialogDescription>
              {active.followUpLabel ? `${active.followUpLabel} · ` : ""}{leadLabel(resolvedLead)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "1", label: "Tomorrow" },
              { v: "2", label: "+2 days" },
              { v: "3", label: "+3 days" },
              { v: "7", label: "Next week" },
            ].map((p) => (
              <Button key={p.v} variant={select1 === p.v ? "default" : "outline"} onClick={() => setSelect1(p.v)}>
                {p.label}
              </Button>
            ))}
          </div>
          <div>
            <Label className="text-xs">Or pick a date</Label>
            <Input type="date" value={text} onChange={(e) => { setText(e.target.value); setSelect1(""); }} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              disabled={!resolvedLead || (!select1 && !text)}
              onClick={() => {
                if (!resolvedLead) return;
                const days = select1 ? Number(select1) : null;
                const target = days
                  ? new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
                  : text;
                updateLead(resolvedLead.id, { nextTaskDue: target });
                toast.success(`Snoozed to ${target}`);
                close();
              }}
            >
              Snooze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─────────── COMM (text / email preview) ─────────── */
  if (active.kind === "comm") {
    const isEmail = active.channel === "email";
    const isCall = active.channel === "call";
    const channelLabel = isCall ? "call" : isEmail ? "email" : "text";
    const dialogTitle = isCall
      ? "Log call"
      : isEmail
      ? "Draft email"
      : "Draft text message";
    const toField = isCall
      ? resolvedLead?.phone || "—"
      : isEmail
      ? resolvedLead?.email || "—"
      : resolvedLead?.phone || "—";
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {isCall ? "With" : "To"}: {toField} · {leadLabel(resolvedLead)}
            </DialogDescription>
          </DialogHeader>
          {isEmail && (
            <div>
              <Label className="text-xs">Subject</Label>
              <Input value={text2} onChange={(e) => setText2(e.target.value)} placeholder="Following up on your intake" />
            </div>
          )}
          <div>
            <Label className="text-xs">{isCall ? "Call notes" : "Message"}</Label>
            <Textarea
              autoFocus
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                isCall
                  ? "Summary of the call, outcome, next step…"
                  : isEmail
                  ? "Hi, just checking in…"
                  : "Hi! Just checking in on your intake forms."
              }
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              disabled={!text.trim() || !resolvedLead}
              onClick={() => {
                if (!resolvedLead) return;
                updateLead(resolvedLead.id, {
                  lastContacted: new Date().toISOString(),
                  automationLog: [
                    `${
                      isCall ? "Call logged" : isEmail ? "Email drafted" : "SMS drafted"
                    }: ${text.trim().slice(0, 80)}`,
                    ...resolvedLead.automationLog,
                  ],
                });
                toast.success(
                  isCall
                    ? "Call logged"
                    : `${isEmail ? "Email" : "SMS"} logged (preview only)`
                );
                close();
              }}
            >
              Log {channelLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─────────── SCHEDULE ASSESSMENT ─────────── */
  if (active.kind === "schedule") {
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule assessment</DialogTitle>
            <DialogDescription>{leadLabel(resolvedLead)}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" value={text2} onChange={(e) => setText2(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={select1} onChange={(e) => setSelect1(e.target.value)} rows={3} placeholder="Location, BCBA preference, etc." />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              disabled={!text || !text2 || !resolvedLead}
              onClick={() => {
                if (!resolvedLead) return;
                updateLead(resolvedLead.id, {
                  nextTaskDue: text,
                  nextAction: `Assessment scheduled ${text} ${text2}`,
                });
                toast.success("Assessment placeholder scheduled");
                close();
              }}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─────────── ASSIGN BCBA ─────────── */
  if (active.kind === "assignBcba") {
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign BCBA</DialogTitle>
            <DialogDescription>{leadLabel(resolvedLead)}</DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs">BCBA</Label>
            <Select value={select1} onValueChange={setSelect1}>
              <SelectTrigger><SelectValue placeholder="Select a BCBA" /></SelectTrigger>
              <SelectContent>
                {["Aliza R.", "Michelle K.", "Devon P.", "Priya S.", "Tariq D."].map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              disabled={!select1 || !resolvedLead}
              onClick={() => {
                if (!resolvedLead) return;
                updateLead(resolvedLead.id, {
                  automationLog: [`BCBA preference set to ${select1}`, ...resolvedLead.automationLog],
                });
                toast.success(`Suggested ${select1}`);
                close();
              }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─────────── ADD LEAD ─────────── */
  if (active.kind === "addLead") {
    // text=parent, text2=child, select1=state, select2=insurance
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New inquiry</DialogTitle>
            <DialogDescription>Add a family to the intake pipeline.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Parent name</Label><Input value={text} onChange={(e) => setText(e.target.value)} /></div>
            <div><Label className="text-xs">Child name</Label><Input value={text2} onChange={(e) => setText2(e.target.value)} /></div>
            <div>
              <Label className="text-xs">State</Label>
              <Select value={select1} onValueChange={setSelect1}>
                <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>
                  {["GA", "NC", "VA", "TN", "MD", "NJ"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Insurance</Label><Input value={select2} onChange={(e) => setSelect2(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              disabled={!text.trim() || !text2.trim()}
              onClick={() => {
                const id = `L-${Math.floor(Math.random() * 9000) + 1000}`;
                addLead({
                  id,
                  childName: text2.trim(),
                  parentName: text.trim(),
                  phone: "",
                  email: "",
                  state: select1 || "GA",
                  source: "Website",
                  status: "New Lead",
                  owner: "",
                  priority: "Warm",
                  childAge: "—",
                  createdAt: new Date().toISOString(),
                  lastContacted: null,
                  daysInStage: 0,
                  nextAction: "Make first contact",
                  nextTaskDue: new Date().toISOString().slice(0, 10),
                  lastActivity: "Manual inquiry added",
                  payor: select2 || "",
                  coverageType: "",
                  paymentPlanNeeded: false,
                  insurance: select2 || "",
                  insuranceType: "",
                  tasks: [],
                } as unknown as Lead);
                toast.success(`Inquiry added (${id})`);
                close();
              }}
            >
              Add inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─────────── FOLLOW-UP ─────────── */
  if (active.kind === "followUp") {
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create follow-up</DialogTitle>
            <DialogDescription>{leadLabel(resolvedLead)}</DialogDescription>
          </DialogHeader>
          {!active.lead && <LeadPicker leads={leads} value={leadId} onChange={setLeadId} />}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={select1} onValueChange={setSelect1}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="task">Internal task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Due</Label>
              <Input type="date" value={text} onChange={(e) => setText(e.target.value)} />
            </div>
          </div>
          <Textarea rows={3} value={text2} onChange={(e) => setText2(e.target.value)} placeholder="What needs to happen?" />
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              disabled={!resolvedLead || !select1 || !text}
              onClick={() => {
                if (!resolvedLead) return;
                updateLead(resolvedLead.id, {
                  nextTaskDue: text,
                  nextAction: text2.trim() || `Follow-up (${select1})`,
                });
                toast.success("Follow-up created");
                close();
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─────────── SEND PACKET ─────────── */
  if (active.kind === "sendPacket") {
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send intake packet</DialogTitle>
            <DialogDescription>Mark a packet as sent and log the activity.</DialogDescription>
          </DialogHeader>
          {!active.lead && <LeadPicker leads={leads} value={leadId} onChange={setLeadId} />}
          <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
            Preview: PandaDoc intake packet will be linked to {leadLabel(resolvedLead)}.
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              disabled={!resolvedLead}
              onClick={() => {
                if (!resolvedLead) return;
                updateLead(resolvedLead.id, { formStatus: "Sent" });
                toast.success("Packet marked sent");
                close();
              }}
            >
              Mark sent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Fallback (shouldn't happen)
  void navigate;
  return null;
}

function LeadPicker({
  leads,
  value,
  onChange,
}: {
  leads: Lead[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">Family</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Select a family" /></SelectTrigger>
        <SelectContent className="max-h-72">
          {leads.slice(0, 80).map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {(l.parentName || l.childName)} — {l.childName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}