import { Link } from "react-router-dom";
import { OSShell } from "../OSShell";
import { ClipboardCheck, RefreshCw, Users, Eye, ArrowRight, FileText } from "lucide-react";
import { useBehavioralSupportData } from "./useBehavioralSupportData";

/**
 * Behavioral Support Evaluations
 *
 * This is a role-safe surface for Behavioral Support. The shared /evaluations
 * page is HR-oriented (employee performance, review cycles) and would show a
 * State Director header + HR-sensitive settings if we redirected there. This
 * page instead surfaces the clinical/behavioral evaluation signal Behavioral
 * Support actually needs: open support plans due for review, escalations
 * awaiting BCBA sign-off, and supervision follow-ups.
 */
export default function BehavioralSupportEvaluations() {
  const bs = useBehavioralSupportData();

  const now = Date.now();
  const plansDue = bs.plans.filter((p) => {
    if (!["draft", "active", "monitoring"].includes(p.plan_status)) return false;
    if (!p.review_due_at) return false;
    return new Date(p.review_due_at).getTime() <= now + 14 * 86_400_000;
  });

  const supervisionEscalations = bs.escalations.filter(
    (e) => e.escalation_type === "supervision_gap" && !["resolved", "closed", "archived"].includes(e.status),
  );

  const supervisionFollowups = bs.followups.filter(
    (f) => f.followup_type === "bcba_checkin" && !["completed", "cancelled"].includes(f.status),
  );

  return (
    <OSShell>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <ClipboardCheck className="h-4 w-4" /> Behavioral Support
            </div>
            <h1 className="text-2xl font-semibold mt-1">Behavioral Support Evaluations</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Clinical evaluation signal for behavioral support: plan reviews due, supervision gaps, and BCBA follow-ups.
              HR performance evaluations are handled by HR and are not shown here.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void bs.refresh()} className="text-xs border border-border rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${bs.loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link to="/reports" className="text-xs border border-border rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Reports
            </Link>
          </div>
        </header>

        <Panel
          title="Support plans due for review"
          icon={<ClipboardCheck className="h-4 w-4" />}
          count={plansDue.length}
          empty="No support plans due for review in the next 14 days."
          href="/behavioral-support/support-plans"
        >
          {plansDue.map((p) => (
            <Row key={p.id}
              title={p.plan_title}
              subtitle={`${p.client_name} • review due ${p.review_due_at ? new Date(p.review_due_at).toLocaleDateString() : "—"}`}
              status={p.plan_status}
            />
          ))}
        </Panel>

        <Panel
          title="Supervision escalations awaiting BCBA"
          icon={<Users className="h-4 w-4" />}
          count={supervisionEscalations.length}
          empty="No open supervision-gap escalations."
          href="/behavioral-support/escalations"
        >
          {supervisionEscalations.map((e) => (
            <Row key={e.id}
              title={e.client_name}
              subtitle={`${e.state ?? "—"} • ${e.status.replace(/_/g, " ")}`}
              status={e.severity}
            />
          ))}
        </Panel>

        <Panel
          title="BCBA supervision follow-ups"
          icon={<Eye className="h-4 w-4" />}
          count={supervisionFollowups.length}
          empty="No open BCBA check-in follow-ups."
          href="/behavioral-support/follow-ups"
        >
          {supervisionFollowups.map((f) => (
            <Row key={f.id}
              title={f.client_name}
              subtitle={`priority ${f.priority} • due ${new Date(f.due_at).toLocaleString()}`}
              status={f.status}
            />
          ))}
        </Panel>
      </div>
    </OSShell>
  );
}

function Panel({ title, icon, count, empty, href, children }: {
  title: string; icon: React.ReactNode; count: number; empty: string; href: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon} {title}
          <span className="text-xs font-normal text-muted-foreground">({count})</span>
        </div>
        <Link to={href} className="text-xs text-primary hover:underline flex items-center gap-1">
          Open <ArrowRight className="h-3 w-3" />
        </Link>
      </header>
      {count === 0 ? (
        <div className="p-6 text-xs text-muted-foreground text-center">{empty}</div>
      ) : (
        <ul className="divide-y divide-border">{children}</ul>
      )}
    </section>
  );
}

function Row({ title, subtitle, status }: { title: string; subtitle: string; status: string }) {
  return (
    <li className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
      <div className="min-w-0">
        <div className="font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
      </div>
      <span className="text-xs uppercase tracking-wide text-muted-foreground shrink-0">{status.replace(/_/g, " ")}</span>
    </li>
  );
}