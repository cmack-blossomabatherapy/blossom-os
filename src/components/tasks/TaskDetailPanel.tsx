import { useNavigate } from "react-router-dom";
import {
  X, CheckSquare, Link2, AlertTriangle, Clock, MessageSquare, Zap,
  CheckCircle2, UserCog, Flag, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type TaskRecord,
  taskStatusVariant,
  taskPriorityVariant,
  departmentVariant,
  linkedTypeVariant,
  isOverdue,
  formatTaskDate,
} from "@/data/tasks";
import { mockLeads } from "@/data/leads";
import { mockClients } from "@/data/clients";

interface Props {
  task: TaskRecord | null;
  onClose: () => void;
}

export function TaskDetailPanel({ task, onClose }: Props) {
  const navigate = useNavigate();

  if (!task) {
    return (
      <div className="bg-card rounded-xl border border-border/60 p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <CheckSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Select a task to view details</p>
      </div>
    );
  }

  const overdue = isOverdue(task);
  const linkedLead =
    task.linkedRecordType === "Lead" && task.linkedRecordId
      ? mockLeads.find((l) => l.id === task.linkedRecordId) ?? null
      : null;
  const linkedClient =
    task.linkedRecordType === "Client" && task.linkedRecordId
      ? mockClients.find((c) => c.id === task.linkedRecordId) ?? null
      : null;

  return (
    <div className="bg-card rounded-xl border border-border/60 flex flex-col max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
              task.status === "Completed"
                ? "bg-success/10 text-success"
                : task.status === "Blocked"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
            )}
          >
            <CheckSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{task.title}</h3>
            <p className="text-xs text-muted-foreground font-mono">{task.id}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <StatusBadge status={task.department} variant={departmentVariant(task.department)} />
              <StatusBadge status={task.status} variant={taskStatusVariant(task.status)} />
              <StatusBadge status={task.priority} variant={taskPriorityVariant(task.priority)} />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Snapshot */}
        <Section title="Snapshot">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Owner" value={task.owner} />
            <Field
              label="Due"
              value={formatTaskDate(task.dueDate)}
              tone={overdue ? "destructive" : "default"}
            />
            <Field label="Stage" value={task.currentStage} />
            <Field label="State" value={task.state} />
          </div>
        </Section>

        {/* Blocker */}
        {task.blocker && (
          <Section title="Blocker" icon={AlertTriangle}>
            <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-destructive">{task.blocker}</p>
              {task.blockerDetail && (
                <p className="text-[11px] text-destructive/80 mt-0.5">{task.blockerDetail}</p>
              )}
            </div>
          </Section>
        )}

        {/* Quick Actions */}
        <Section title="Actions">
          <div className="grid grid-cols-2 gap-1.5">
            <ActionBtn icon={CheckCircle2} label="Mark Complete" disabled={task.status === "Completed"} />
            <ActionBtn icon={UserCog} label="Reassign" />
            <ActionBtn icon={Flag} label="Priority" />
            <ActionBtn icon={Calendar} label="Due Date" />
          </div>
        </Section>

        {/* Linked Record */}
        <Section title="Linked Record" icon={Link2}>
          {linkedLead ? (
            <button
              onClick={() => navigate(`/leads/${linkedLead.id}`)}
              className="w-full text-left p-2.5 rounded-lg border border-border/60 hover:border-primary/40 transition-colors flex items-center gap-2.5"
            >
              <div className="h-7 w-7 rounded-md bg-info/10 text-info flex items-center justify-center text-[10px] font-bold uppercase">
                Lead
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{linkedLead.childName}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {linkedLead.parentName} · {linkedLead.status}
                </p>
              </div>
              <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
            </button>
          ) : linkedClient ? (
            <button
              onClick={() => navigate(`/clients/${linkedClient.id}`)}
              className="w-full text-left p-2.5 rounded-lg border border-border/60 hover:border-primary/40 transition-colors flex items-center gap-2.5"
            >
              <div className="h-7 w-7 rounded-md bg-success/10 text-success flex items-center justify-center text-[10px] font-bold uppercase">
                Client
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{linkedClient.childName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{linkedClient.stage}</p>
              </div>
              <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
            </button>
          ) : (
            <div className="p-2.5 rounded-lg border border-border/60 flex items-center gap-2.5">
              <StatusBadge
                status={task.linkedRecordType}
                variant={linkedTypeVariant(task.linkedRecordType)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.linkedRecordLabel}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{task.linkedRecordId ?? "—"}</p>
              </div>
            </div>
          )}
        </Section>

        {/* Context */}
        {(linkedLead || linkedClient) && (
          <Section title="Context">
            <div className="space-y-1.5">
              {linkedLead && (
                <>
                  <ContextRow label="Lead Status" value={linkedLead.status} />
                  <ContextRow label="Source" value={linkedLead.source} />
                </>
              )}
              {linkedClient && (
                <>
                  <ContextRow label="Stage" value={linkedClient.stage} />
                  <ContextRow label="Auth" value={linkedClient.authStatus} />
                  <ContextRow label="Staffing" value={linkedClient.staffingStatus} />
                </>
              )}
            </div>
          </Section>
        )}

        {/* Notes */}
        {task.notes && (
          <Section title="Notes" icon={MessageSquare}>
            <p className="text-xs text-foreground bg-secondary/30 border border-border/40 rounded-md p-2.5 whitespace-pre-wrap">
              {task.notes}
            </p>
          </Section>
        )}

        {/* Comments */}
        {task.comments.length > 0 && (
          <Section title={`Comments · ${task.comments.length}`} icon={MessageSquare}>
            <div className="space-y-2">
              {task.comments.map((c) => (
                <div key={c.id} className="bg-secondary/30 border border-border/40 rounded-md p-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground">{c.author}</p>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {formatTaskDate(c.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.text}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Timeline */}
        <Section title="Timeline" icon={Clock}>
          <div className="space-y-2.5">
            {task.timeline.map((e, i) => (
              <div key={e.id} className="flex gap-2.5">
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  {i < task.timeline.length - 1 && <div className="w-px flex-1 bg-border/60 mt-0.5" />}
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-xs text-foreground">{e.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatTaskDate(e.timestamp)}
                    {e.user ? ` · ${e.user}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Automation */}
        {task.automationOrigin && (
          <Section title="Automation" icon={Zap}>
            <div className="text-[11px] text-muted-foreground bg-primary/5 border border-primary/20 rounded-md p-2.5 inline-flex items-start gap-1.5">
              <Zap className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <span>Auto-created from: <span className="text-foreground font-medium">{task.automationOrigin}</span></span>
            </div>
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
  icon?: typeof CheckSquare;
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

function Field({
  label, value, tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "destructive";
}) {
  return (
    <div className="bg-secondary/30 border border-border/40 rounded-md p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-xs font-medium mt-0.5", tone === "destructive" ? "text-destructive" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-secondary/30 border border-border/40">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium truncate ml-2">{value}</span>
    </div>
  );
}

function ActionBtn({
  icon: Icon, label, disabled,
}: {
  icon: typeof CheckSquare;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      className="h-8 text-xs justify-start"
    >
      <Icon className="h-3 w-3 mr-1.5" />
      {label}
    </Button>
  );
}
