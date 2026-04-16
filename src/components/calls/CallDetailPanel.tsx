import { useNavigate } from "react-router-dom";
import {
  X, Phone, MessageSquare, Mail, Link2, UserPlus, AlertTriangle,
  PhoneIncoming, PhoneOutgoing, FileText, Clock, Send, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type PhoneCall,
  callStatusVariant,
  callTypeVariant,
  formatCallTime,
  timeSinceCall,
} from "@/data/calls";
import { mockLeads } from "@/data/leads";
import { mockClients } from "@/data/clients";

interface Props {
  call: PhoneCall | null;
  onClose: () => void;
}

export function CallDetailPanel({ call, onClose }: Props) {
  const navigate = useNavigate();

  if (!call) {
    return (
      <div className="bg-card rounded-xl border border-border/60 p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <Phone className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Select a call to view details</p>
      </div>
    );
  }

  const linkedLead = call.linkedLeadId ? mockLeads.find((l) => l.id === call.linkedLeadId) : null;
  const linkedClient = call.linkedClientId ? mockClients.find((c) => c.id === call.linkedClientId) : null;
  const unlinked = !linkedLead && !linkedClient;
  const DirIcon = call.direction === "Inbound" ? PhoneIncoming : PhoneOutgoing;

  return (
    <div className="bg-card rounded-xl border border-border/60 flex flex-col max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
            call.direction === "Inbound" ? "bg-info/10 text-info" : "bg-primary/10 text-primary",
          )}>
            <DirIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {call.callerName ?? "Unknown caller"}
            </h3>
            <p className="text-xs text-muted-foreground tabular-nums">{call.phoneNumber}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <StatusBadge status={call.type} variant={callTypeVariant(call.type)} />
              <StatusBadge status={call.status} variant={callStatusVariant(call.status)} />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-border/40">
          <div className="grid grid-cols-3 gap-1.5">
            <ActionBtn icon={Phone} label="Call back" />
            <ActionBtn icon={MessageSquare} label="Text" />
            <ActionBtn icon={Mail} label="Email" />
          </div>
        </div>

        {/* Linkage */}
        <Section title="Linkage" critical={unlinked}>
          {unlinked ? (
            <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-destructive text-xs font-medium mb-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Unlinked call · action required
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                  <Link2 className="h-3 w-3 mr-1" /> Link Lead
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                  <Link2 className="h-3 w-3 mr-1" /> Link Client
                </Button>
                <Button size="sm" className="h-7 text-xs flex-1">
                  <UserPlus className="h-3 w-3 mr-1" /> New Lead
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {linkedLead && (
                <button
                  onClick={() => navigate(`/leads/${linkedLead.id}`)}
                  className="w-full text-left p-2.5 rounded-lg border border-border/60 hover:border-primary/40 transition-colors flex items-center gap-2.5"
                >
                  <div className="h-7 w-7 rounded-md bg-info/10 text-info flex items-center justify-center text-[10px] font-bold uppercase">
                    Lead
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{linkedLead.childName}</p>
                    <p className="text-[11px] text-muted-foreground">{linkedLead.parentName} · {linkedLead.status}</p>
                  </div>
                  <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                </button>
              )}
              {linkedClient && (
                <button
                  onClick={() => navigate(`/clients/${linkedClient.id}`)}
                  className="w-full text-left p-2.5 rounded-lg border border-border/60 hover:border-primary/40 transition-colors flex items-center gap-2.5"
                >
                  <div className="h-7 w-7 rounded-md bg-success/10 text-success flex items-center justify-center text-[10px] font-bold uppercase">
                    Client
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{linkedClient.childName}</p>
                    <p className="text-[11px] text-muted-foreground">{linkedClient.stage}</p>
                  </div>
                  <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                </button>
              )}
            </div>
          )}
        </Section>

        {/* Call Outcome */}
        <Section title="Call Outcome">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{call.outcome}</span>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground">Change</Button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
            <Meta label="Direction" value={call.direction} />
            <Meta label="Duration" value={call.duration} />
            <Meta label="Attempts" value={String(call.attempts)} tone={call.attempts > 2 ? "destructive" : "default"} />
            <Meta label="Owner" value={call.assignedTo ?? "Unassigned"} />
            <Meta label="State" value={call.state ?? "—"} />
            <Meta label="Time" value={timeSinceCall(call.callTime)} />
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notes" icon={FileText}>
          {call.notes ? (
            <p className="text-sm text-foreground leading-relaxed">{call.notes}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">No notes captured</p>
          )}
        </Section>

        {/* Follow-Up Actions */}
        <Section title="Follow-Up Actions">
          <div className="grid grid-cols-2 gap-1.5">
            <ActionBtn icon={Send} label="Send Form" />
            <ActionBtn icon={Phone} label="Schedule Call" />
            <ActionBtn icon={UserPlus} label="Assign Coordinator" />
            <ActionBtn icon={CheckCircle2} label="Move to In Contact" />
          </div>
        </Section>

        {/* Timeline */}
        <Section title="Timeline" icon={Clock}>
          <div className="space-y-2.5">
            {call.timeline.map((e, i) => (
              <div key={e.id} className="flex gap-2.5">
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  {i < call.timeline.length - 1 && <div className="w-px flex-1 bg-border/60 mt-0.5" />}
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-xs text-foreground">{e.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatCallTime(e.timestamp)}{e.user ? ` · ${e.user}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Automation Log */}
        {call.automationLog.length > 0 && (
          <Section title="Automations">
            <ul className="space-y-1.5">
              {call.automationLog.map((log, i) => (
                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">⚡</span>
                  <span>{log}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title, icon: Icon, critical, children,
}: {
  title: string;
  icon?: typeof Phone;
  critical?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("px-4 py-3 border-b border-border/40 last:border-b-0", critical && "bg-destructive/5")}>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {title}
      </h4>
      {children}
    </div>
  );
}

function ActionBtn({ icon: Icon, label }: { icon: typeof Phone; label: string }) {
  return (
    <button className="px-2 py-1.5 rounded-md border border-border/60 bg-background hover:border-primary/40 hover:text-primary transition-colors text-[11px] font-medium text-foreground inline-flex items-center justify-center gap-1.5">
      <Icon className="h-3 w-3" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function Meta({
  label, value, tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "destructive";
}) {
  return (
    <div className="bg-secondary/30 rounded-md px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-xs font-medium mt-0.5", tone === "destructive" ? "text-destructive" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
