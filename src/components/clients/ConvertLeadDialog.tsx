import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLeads } from "@/contexts/LeadsContext";
import { useClients } from "@/contexts/ClientsContext";
import { Client } from "@/data/clients";
import { Lead } from "@/data/leads";
import { CheckCircle2, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (client: Client) => void;
}

const CLINICS = ["Peachtree Corners", "Riverdale", "Sandy Springs", "Remote", "In-Home"];

export function ConvertLeadDialog({ open, onOpenChange, onCreated }: ConvertLeadDialogProps) {
  const { leads } = useLeads();
  const { addClient, clients } = useClients();
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [clinic, setClinic] = useState("Peachtree Corners");

  const eligible = useMemo(() => {
    const existingLeadIds = new Set(clients.map((c) => c.leadId ?? c.id.replace("C-", "L-")));
    return leads
      .filter((l) =>
        (l.financialStatus === "Approved" || l.paymentPlanSigned)
        && !existingLeadIds.has(l.id),
      )
      .filter((l) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return l.childName.toLowerCase().includes(q) || l.parentName.toLowerCase().includes(q) || l.id.toLowerCase().includes(q);
      });
  }, [leads, clients, search]);

  const selectedLead = eligible.find((l) => l.id === selectedLeadId) ?? null;

  const reset = () => {
    setSearch("");
    setSelectedLeadId(null);
    setClinic("Peachtree Corners");
  };

  const submit = async () => {
    if (!selectedLead) {
      toast.error("Pick a lead to convert");
      return;
    }
    const lead: Lead = selectedLead;
    const now = new Date().toISOString();
    const paymentPlan = lead.financialStatus === "Payment Plan Required" || lead.vobStatus === "Payment Plan Required" || lead.paymentPlanNeeded;
    const approved = lead.financialStatus === "Approved" || lead.paymentPlanSigned;
    const missingRequired = [lead.childName, lead.parentName, lead.phone, lead.email, lead.state, lead.insurance || lead.payor].some((value) => !value);

    if (!approved && !lead.paymentPlanSigned) {
      toast.error("Lead is not qualified for conversion", { description: "Financial approval or a signed payment plan is required." });
      return;
    }
    if (missingRequired) {
      toast.error("Missing lead data", { description: "Send this record back to Intake before conversion." });
      return;
    }
    const duplicate = clients.find((client) => client.childName.toLowerCase() === lead.childName.toLowerCase() || client.phone === lead.phone || client.email === lead.email);
    if (duplicate && !window.confirm(`Possible duplicate: ${duplicate.childName}. Create a new client anyway?`)) return;

    const tasks = paymentPlan
      ? [
          { id: "ct-pp1", title: "Send Payment Plan", completed: false, dueDate: now.split("T")[0] },
          { id: "ct-pp2", title: "Confirm Payment Plan has been received", completed: false },
          { id: "ct-bcba", title: "Confirm Assigned BCBA", completed: false },
        ]
      : [
          { id: "ct-bcba", title: "Confirm Assigned BCBA", completed: false },
        ];

    const draft: Omit<Client, "id"> = {
      leadId: lead.id,
      childName: lead.childName,
      parentName: lead.parentName,
      phone: lead.phone,
      email: lead.email,
      childAge: lead.childAge,
      state: lead.state,
      clinic,
      stage: "BCBA Assignment",
      bcba: null,
      rbt: null,
      intakeOwner: lead.owner,
      authStatus: "Not Submitted",
      staffingStatus: "Not Needed",
      qaStatus: "Not Started",
      daysInStage: 0,
      daysSinceVOB: 0,
      daysSinceAssessment: null,
      daysToStart: null,
      assessmentDate: null,
      startDate: null,
      nextAction: "Assign a BCBA",
      nextTaskDue: now.split("T")[0],
      lastActivity: "Converted from Leads",
      payor: lead.payor || lead.insurance,
      insurance: lead.primaryInsurance || lead.insurance,
      paymentPlanStatus: lead.paymentPlanStatus,
      paymentPlanRequired: paymentPlan,
      paymentPlanSigned: lead.paymentPlanSigned,
      readyForAuth: false,
      consentRequired: true,
      consentComplete: lead.consentStatus === "Complete" || lead.consentStatus === "Completed",
      blockers: ["No BCBA assigned", ...(paymentPlan && !lead.paymentPlanSigned ? ["Payment plan not signed"] : []), ...((lead.consentStatus === "Complete" || lead.consentStatus === "Completed") ? [] : ["Missing consent forms"])],
      authorizations: [
        { type: "Initial", status: "Not Submitted" },
        { type: "Treatment", status: "Not Submitted" },
      ],
      schedule: [],
      tasks,
      timeline: [
        { id: "ct-tl1", type: "system", description: `Converted from lead ${lead.id} (VOB ${lead.vobStatus})`, timestamp: now, user: "You" },
      ],
      documents: [
        ...lead.documents.map((document) => ({ name: document.name, type: document.type })),
        ...(lead.vobFile ? [{ name: lead.vobFile.name, type: "VOB File" }] : []),
      ],
      automationLog: [
        `Converted from lead ${lead.id}`,
        "Lead archived as source record",
        paymentPlan ? "Payment plan tasks created" : "Standard intake tasks created",
        "Awaiting BCBA assignment",
      ],
      staffingHistory: [],
    };

    const created = await addClient(draft);
    if (!created) { toast.error("Failed to create client"); return; }
    toast.success(`Client created: ${created.childName}`, { description: `BCBA Assignment stage` });
    onCreated?.(created);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Convert lead → client</DialogTitle>
          <DialogDescription>
            Per SOP, clients are created only after financial approval or a signed payment plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs">Search eligible leads</Label>
            <div className="relative">
              <Search className="absolute z-10 left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="pl-8 h-9"
              />
            </div>
          </div>

          {eligible.length === 0 ? (
            <div className="bg-muted/30 rounded-lg border border-border/60 p-6 text-center">
              <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No eligible leads.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">A lead needs financial approval or a signed payment plan before it can convert.</p>
            </div>
          ) : (
            <ScrollArea className="h-[260px] rounded-lg border border-border/60">
              <div className="divide-y divide-border/40">
                {eligible.map((l) => {
                  const selected = l.id === selectedLeadId;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedLeadId(l.id)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors",
                        selected ? "bg-primary/10" : "hover:bg-muted/30",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{l.childName}</p>
                          <span className="text-[11px] text-muted-foreground font-mono">{l.id}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {l.parentName} · {l.state} · {l.payor || l.insurance}
                          {(l.vobStatus === "Payment Plan Required" || l.paymentPlanNeeded) && <span className="text-warning"> · Payment Plan</span>}
                        </p>
                      </div>
                      {selected && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {selectedLead && (
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Setup</p>
              <div>
                <Label className="text-xs">Clinic</Label>
                <Select value={clinic} onValueChange={setClinic}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLINICS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Will start in <strong>BCBA Assignment</strong>. Linking a BCBA will auto-advance to Pending Initial Auth.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!selectedLead}>Create client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
