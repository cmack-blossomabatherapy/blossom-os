import { useNavigate } from "react-router-dom";
import {
  X, FileText, Download, Upload as UploadIcon, History, AlertTriangle, Link2,
  Eye, CheckCircle2, Send, Clock, ListChecks, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type DocumentRecord, docStatusVariant, linkedRecordVariant, formatDocDate, daysUntil,
} from "@/data/documents";
import { mockLeads } from "@/data/leads";
import { mockClients } from "@/data/clients";

interface Props {
  document: DocumentRecord | null;
  onClose: () => void;
}

export function DocumentDetailPanel({ document, onClose }: Props) {
  const navigate = useNavigate();

  if (!document) {
    return (
      <div className="bg-card rounded-xl border border-border/60 p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Select a document to view details</p>
      </div>
    );
  }

  const requiredDays = daysUntil(document.requiredBy);
  const overdue = requiredDays !== null && requiredDays < 0;
  const isMissing = document.status === "Missing";

  const linkedLead = document.linkedRecordType === "Lead" && document.linkedRecordId
    ? mockLeads.find((l) => l.id === document.linkedRecordId) : null;
  const linkedClient = document.linkedRecordType === "Client" && document.linkedRecordId
    ? mockClients.find((c) => c.id === document.linkedRecordId) : null;

  return (
    <div className="bg-card rounded-xl border border-border/60 flex flex-col max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
            isMissing ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
          )}>
            {isMissing ? <AlertTriangle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{document.name}</h3>
            <p className="text-xs text-muted-foreground">{document.type} · {document.group}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <StatusBadge status={document.status} variant={docStatusVariant(document.status)} />
              <StatusBadge status={document.linkedRecordType} variant={linkedRecordVariant(document.linkedRecordType)} />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Preview */}
        <Section title="Preview">
          {isMissing ? (
            <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-1.5" />
              <p className="text-sm font-medium text-destructive">Document not yet uploaded</p>
              {document.blockingStage && (
                <p className="text-[11px] text-destructive/80 mt-0.5">Blocking: {document.blockingStage}</p>
              )}
              <Button size="sm" className="mt-3 h-7 text-xs">
                <UploadIcon className="h-3 w-3 mr-1" /> Upload Now
              </Button>
            </div>
          ) : (
            <>
              <div className="aspect-[4/3] bg-muted/30 border border-border/40 rounded-lg flex flex-col items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-[11px] text-muted-foreground">PDF Preview</p>
                {document.fileSize && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{document.fileSize}</p>}
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <ActionBtn icon={Download} label="Download" />
                <ActionBtn icon={RefreshCw} label="Replace" />
                <ActionBtn icon={History} label="Versions" />
              </div>
            </>
          )}
        </Section>

        {/* Status Tracking */}
        <Section title="Status Tracking" icon={CheckCircle2}>
          <StatusFlow status={document.status} />
        </Section>

        {/* Required By */}
        {document.requiredBy && (
          <Section title="Deadline">
            <div className={cn(
              "rounded-lg px-3 py-2 border",
              overdue ? "bg-destructive/5 border-destructive/30" : "bg-warning/5 border-warning/30",
            )}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Required By</p>
              <p className={cn("text-sm font-semibold mt-0.5", overdue ? "text-destructive" : "text-warning")}>
                {formatDocDate(document.requiredBy)}
                {overdue ? ` · ${Math.abs(requiredDays!)}d overdue` : ` · ${requiredDays}d remaining`}
              </p>
            </div>
          </Section>
        )}

        {/* Linked Record */}
        <Section title="Linked Record" icon={Link2}>
          {linkedLead ? (
            <button
              onClick={() => navigate(`/leads/${linkedLead.id}`)}
              className="w-full text-left p-2.5 rounded-lg border border-border/60 hover:border-primary/40 transition-colors flex items-center gap-2.5"
            >
              <div className="h-7 w-7 rounded-md bg-info/10 text-info flex items-center justify-center text-[10px] font-bold uppercase">Lead</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{linkedLead.childName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{linkedLead.parentName} · {linkedLead.status}</p>
              </div>
              <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
            </button>
          ) : linkedClient ? (
            <button
              onClick={() => navigate(`/clients/${linkedClient.id}`)}
              className="w-full text-left p-2.5 rounded-lg border border-border/60 hover:border-primary/40 transition-colors flex items-center gap-2.5"
            >
              <div className="h-7 w-7 rounded-md bg-success/10 text-success flex items-center justify-center text-[10px] font-bold uppercase">Client</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{linkedClient.childName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{linkedClient.stage}</p>
              </div>
              <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
            </button>
          ) : (
            <div className="p-2.5 rounded-lg border border-border/60 flex items-center gap-2.5">
              <div className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold uppercase",
                document.linkedRecordType === "Authorization" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground",
              )}>
                {document.linkedRecordType.slice(0, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{document.linkedRecordLabel}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{document.linkedRecordId ?? "—"}</p>
              </div>
            </div>
          )}
        </Section>

        {/* Tasks */}
        <Section title="Tasks" icon={ListChecks}>
          <div className="space-y-1.5">
            {document.nextAction ? (
              <div className="flex items-start gap-2 p-2 rounded-md border border-border/60 bg-secondary/20">
                <div className="h-3.5 w-3.5 rounded border-2 border-muted-foreground/40 mt-0.5 shrink-0" />
                <span className="text-xs text-foreground">{document.nextAction}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No open tasks</p>
            )}
          </div>
        </Section>

        {/* Versions */}
        {document.versions.length > 0 && (
          <Section title="Versions" icon={History}>
            <div className="space-y-1.5">
              {document.versions.map((v) => (
                <div key={v.version} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md bg-secondary/30 border border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-foreground">{v.version}</span>
                    <span className="text-muted-foreground">{v.uploadedBy}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{formatDocDate(v.uploadedAt)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Timeline */}
        <Section title="Timeline" icon={Clock}>
          <div className="space-y-2.5">
            {document.timeline.map((e, i) => (
              <div key={e.id} className="flex gap-2.5">
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  {i < document.timeline.length - 1 && <div className="w-px flex-1 bg-border/60 mt-0.5" />}
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-xs text-foreground">{e.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDocDate(e.timestamp)}{e.user ? ` · ${e.user}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Automation */}
        {document.automationLog.length > 0 && (
          <Section title="Automations">
            <ul className="space-y-1.5">
              {document.automationLog.map((log, i) => (
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
  title, icon: Icon, children,
}: {
  title: string;
  icon?: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 border-b border-border/40 last:border-b-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {title}
      </h4>
      {children}
    </div>
  );
}

function ActionBtn({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return (
    <button className="px-2 py-1.5 rounded-md border border-border/60 bg-background hover:border-primary/40 hover:text-primary transition-colors text-[11px] font-medium text-foreground inline-flex items-center justify-center gap-1.5">
      <Icon className="h-3 w-3" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function StatusFlow({ status }: { status: DocumentRecord["status"] }) {
  const steps = [
    { key: "Sent", icon: Send },
    { key: "Viewed", icon: Eye },
    { key: "Received", icon: CheckCircle2 },
    { key: "Complete", icon: CheckCircle2 },
  ] as const;
  const order: Record<string, number> = { Missing: -1, Sent: 0, Viewed: 1, Received: 2, Complete: 3 };
  const currentIdx = order[status] ?? -1;

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const reached = i <= currentIdx;
        return (
          <div key={s.key} className="flex items-center flex-1">
            <div className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2",
              reached ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground",
            )}>
              <s.icon className="h-3 w-3" />
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-1", i < currentIdx ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
