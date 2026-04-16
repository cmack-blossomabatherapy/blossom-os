import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, FileText, Calendar as CalIcon, Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { findQAItem, qaStageVariant } from "@/data/operations";

export default function QADetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const q = id ? findQAItem(id) : undefined;

  if (!q) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">QA item not found</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/qa")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to QA
        </Button>
      </div>
    );
  }

  const checklist = [
    { label: "Treatment Plan Received", done: q.treatmentPlanReceived },
    { label: "Documentation Verified", done: q.documentsVerified },
    { label: "Ready for Submission", done: q.readyForSubmission },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const progressPct = (completed / checklist.length) * 100;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <button
          onClick={() => navigate("/qa")}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to QA
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{q.clientName}</h1>
                <StatusBadge status={q.stage} variant={qaStageVariant(q.stage)} />
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>QA Owner: {q.owner}</span>
                <span>·</span>
                <span>BCBA: {q.bcba ?? "—"}</span>
                <span>·</span>
                <span>{q.payor}</span>
                <span>·</span>
                <button
                  onClick={() => navigate(`/authorizations/${q.linkedAuthId}`)}
                  className="text-primary hover:underline"
                >
                  Auth {q.linkedAuthId}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Request Document</Button>
            <Button size="sm" disabled={!q.readyForSubmission}>Send to Submission</Button>
          </div>
        </div>
      </div>

      {/* Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border/60 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">QA Status</p>
          <p className="text-base font-semibold text-foreground mt-1">{q.stage}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{q.daysInQA}d in queue</p>
        </div>
        <div className={cn("rounded-xl border p-4", q.missingItems.length > 0 ? "bg-destructive/5 border-destructive/30" : "bg-card border-border/60")}>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Blockers
          </p>
          {q.missingItems.length === 0 ? (
            <p className="text-sm text-success font-medium mt-1">No blockers</p>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {q.missingItems.map((m) => (
                <li key={m} className="text-sm text-destructive">• {m}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Next Action</p>
          <p className="text-sm text-foreground mt-1">
            {q.stage === "Awaiting Treatment Plan"
              ? "Request treatment plan from BCBA"
              : q.stage === "In QA Review"
                ? "Complete document review"
                : q.stage === "Ready to Submit"
                  ? "Send to treatment auth submission"
                  : "Return for corrections"}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-card rounded-xl border border-border/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">QA Checklist</h3>
          <span className="text-xs text-muted-foreground">{completed} / {checklist.length} complete</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
          <div className="h-full bg-success rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="space-y-2">
          {checklist.map((c) => (
            <div key={c.label} className="flex items-center gap-2.5 text-sm">
              <div
                className={cn(
                  "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                  c.done ? "bg-success border-success" : "border-border",
                )}
              >
                {c.done && <div className="h-1.5 w-1.5 bg-success-foreground rounded-full" />}
              </div>
              <span className={cn(c.done ? "text-foreground" : "text-muted-foreground")}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="auth">Linked Auth</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <div className="bg-card rounded-xl border border-border/60 p-4 space-y-2">
            {q.documents.map((d) => (
              <div key={d.name} className="flex items-center justify-between p-2.5 rounded-md bg-secondary/30 border border-border/40">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{d.name}</span>
                </div>
                {d.received ? (
                  <StatusBadge status="Received" variant="success" />
                ) : (
                  <StatusBadge status="Missing" variant="destructive" />
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auth" className="mt-4">
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{q.linkedAuthId}</p>
                  <p className="text-[11px] text-muted-foreground">Treatment authorization</p>
                </div>
              </div>
              <StatusBadge status={q.linkedAuthStatus} variant="warning" />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/40">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Submission Readiness</p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {q.readyForSubmission ? "Ready" : "Blocked by QA"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Expiration</p>
                <p className="text-sm font-medium text-foreground mt-1">{q.expirationDays} days</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Action</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1"
                  onClick={() => navigate(`/authorizations/${q.linkedAuthId}`)}
                >
                  Open Auth
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <div className="bg-card rounded-xl border border-border/60 p-4 space-y-2">
            {q.tasks.map((t) => (
              <label key={t.id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  defaultChecked={t.completed}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className={cn(t.completed ? "line-through text-muted-foreground" : "text-foreground")}>
                  {t.title}
                </span>
              </label>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <ol className="space-y-3">
              {q.timeline.map((e, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CalIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-foreground">{e.event}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{e.date}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="mt-4">
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <ul className="space-y-2">
              {q.automationLog.map((a, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
