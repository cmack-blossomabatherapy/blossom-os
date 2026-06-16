import { Link, useSearchParams } from "react-router-dom";
import {
  Clock, GraduationCap, BookOpen, FileText, ArrowLeft, Users, Database,
  BarChart3, Workflow, AlertTriangle, Activity, ChevronRight, Building2,
} from "lucide-react";
import { findModuleByName, type ModuleDefinition, type ModuleKpi } from "@/lib/os/moduleRegistry";
import { useToast } from "@/hooks/use-toast";

/**
 * Branded Coming Soon page used for non-launch Blossom OS modules.
 * Renders a calm, intentional placeholder with clear next actions.
 */
export default function OSComingSoonRoute() {
  const [params] = useSearchParams();
  const moduleName = params.get("module") || "This Workspace";
  const def = findModuleByName(moduleName);

  if (def) return <ModuleWireframe def={def} moduleName={moduleName} />;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-16 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Clock className="h-3 w-3" />
        Coming Soon
      </div>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
        {moduleName}
      </h1>

      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
        This Blossom OS workspace is planned and will become part of the full
        operating system. For launch, this area is intentionally held in Coming
        Soon so the team can work from clean, reliable modules first.
      </p>
      <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
        This page will later include role-specific queues, ownership, action
        items, status tracking, reports, and activity history.
      </p>

      <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <PreviewCard icon={Workflow} title="What this will manage" body="Role-based queues, status tracking, and the workflows that move work through this area." />
        <PreviewCard icon={Users} title="Who will use it" body="Owners and assigned teammates with action items, not passive viewers." />
        <PreviewCard icon={Database} title="What data it will connect" body="Operational sources already in Blossom OS - clients, staffing, training, and more." />
        <PreviewCard icon={BarChart3} title="What reports leadership will see" body="Activity history, performance, and risk views for the people accountable for this work." />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 h-10 text-sm font-medium text-primary-foreground transition hover:opacity-90">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <Link to="/academy" className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-secondary px-4 h-10 text-sm font-medium text-secondary-foreground transition hover:bg-muted">
          <GraduationCap className="h-4 w-4" /> Open Training Academy
        </Link>
        <Link to="/resources" className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-secondary px-4 h-10 text-sm font-medium text-secondary-foreground transition hover:bg-muted">
          <BookOpen className="h-4 w-4" /> Open Resource Library
        </Link>
        <Link to="/reports" className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-secondary px-4 h-10 text-sm font-medium text-secondary-foreground transition hover:bg-muted">
          <FileText className="h-4 w-4" /> Open Reports
        </Link>
      </div>
    </div>
  );
}

function PreviewCard({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 text-left shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Module Wireframe
// -----------------------------------------------------------------------------

function ModuleWireframe({ def, moduleName }: { def: ModuleDefinition; moduleName: string }) {
  const { toast } = useToast();
  const onAction = (label: string) =>
    toast({
      title: label,
      description: `This action is part of the planned ${def.title} workflow.`,
    });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5">
              <Clock className="h-3 w-3" /> Coming Soon
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5">
              <Building2 className="h-3 w-3" /> {def.department}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5">
              <Users className="h-3 w-3" /> {def.ownerRole}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{moduleName}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{def.purpose}</p>
          {moduleName !== def.title && (
            <p className="mt-1 text-xs text-muted-foreground">Part of {def.title}</p>
          )}
          {def.relatedModules && def.relatedModules.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {def.relatedModules.map((r) => (
                <span key={r} className="rounded-full border border-border/70 bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          to="/dashboard"
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-secondary px-3.5 text-sm text-secondary-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      {/* KPI strip */}
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {def.kpis.map((k) => <KpiCard key={k.label} kpi={k} />)}
      </div>

      {/* Action bar */}
      <Section title="Actions" subtitle="Planned operational actions for this workspace.">
        <div className="flex flex-wrap gap-2">
          {def.primaryActions.map((a) => (
            <button
              key={a}
              onClick={() => onAction(a)}
              className="inline-flex h-9 items-center rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {a}
            </button>
          ))}
          {def.secondaryActions?.map((a) => (
            <button
              key={a}
              onClick={() => onAction(a)}
              className="inline-flex h-9 items-center rounded-xl border border-border/70 bg-secondary px-3.5 text-sm text-secondary-foreground hover:bg-muted"
            >
              {a}
            </button>
          ))}
        </div>
      </Section>

      {/* Main grid: queue + side panel */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Queue" subtitle="Wireframe data - sample records for the planned table.">
            <QueueTable def={def} />
          </Section>

          <Section title="Activity Timeline" subtitle="How Blossom OS will track activity for this workspace.">
            <div className="rounded-2xl border border-border/70 bg-card">
              <ul className="divide-y divide-border/70">
                {def.activity.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <Activity className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-medium text-foreground">{a.type}</span>
                        <span className="text-xs text-muted-foreground">- {a.who}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{a.when}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">{a.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Detail" subtitle="Selected record (sample).">
            <DetailPanel def={def} />
          </Section>

          <Section title="Escalations">
            <div className="space-y-2">
              {def.escalations.map((e, i) => (
                <div key={i} className="rounded-2xl border border-border/70 bg-card p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <AlertTriangle className="h-3.5 w-3.5" /> {e.level}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{e.reason}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">Owner: {e.owner} - Age: {e.age}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">Next: {e.next}</p>
                </div>
              ))}
            </div>
          </Section>

          {def.plannedDataFields.length > 0 && (
            <Section title="Planned Data Fields">
              <div className="flex flex-wrap gap-1.5">
                {def.plannedDataFields.map((f) => (
                  <span key={f} className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                    {f}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Reports */}
      {def.reports.length > 0 && (
        <Section title="Related Reports" subtitle="Reports planned from this module.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {def.reports.map((r) => (
              <Link
                key={r.name}
                to={`/reports`}
                className="group rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  {r.name}
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">{r.description}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Footer nav */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-border/70 pt-8">
        <Link to="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <Link to="/academy" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-secondary px-4 text-sm text-secondary-foreground hover:bg-muted">
          <GraduationCap className="h-4 w-4" /> Training Academy
        </Link>
        <Link to="/resources" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-secondary px-4 text-sm text-secondary-foreground hover:bg-muted">
          <BookOpen className="h-4 w-4" /> Resource Library
        </Link>
        <Link to="/reports" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-secondary px-4 text-sm text-secondary-foreground hover:bg-muted">
          <FileText className="h-4 w-4" /> Reports
        </Link>
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: ModuleKpi }) {
  const tone =
    kpi.tone === "critical" ? "text-destructive" :
    kpi.tone === "warning" ? "text-amber-600 dark:text-amber-400" :
    kpi.tone === "success" ? "text-emerald-600 dark:text-emerald-400" :
    "text-foreground";
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight ${tone}`}>{kpi.value}</p>
      {kpi.hint && <p className="mt-1 text-[12px] text-muted-foreground">{kpi.hint}</p>}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function QueueTable({ def }: { def: ModuleDefinition }) {
  if (def.sampleRecords.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
        No records match this view yet.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Record</th>
              <th className="px-4 py-2.5 font-medium">State</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Owner</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
              <th className="px-4 py-2.5 font-medium">Next Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {def.sampleRecords.map((r, i) => (
              <tr key={i} className="hover:bg-muted/40">
                <td className="px-4 py-2.5 font-medium text-foreground">{r.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.state || "-"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.status}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.owner}</td>
                <td className="px-4 py-2.5">
                  <PriorityPill priority={r.priority} />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.nextAction || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PriorityPill({ priority }: { priority?: string }) {
  if (!priority) return <span className="text-xs text-muted-foreground">-</span>;
  const tone =
    priority === "Urgent" ? "border-destructive/30 bg-destructive/10 text-destructive" :
    priority === "High" ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" :
    "border-border/70 bg-muted/60 text-muted-foreground";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>{priority}</span>;
}

function DetailPanel({ def }: { def: ModuleDefinition }) {
  const rec = def.sampleRecords[0];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      {rec ? (
        <>
          <p className="text-sm font-semibold text-foreground">{rec.name}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{rec.state || ""} - {rec.status}</p>
          <dl className="mt-3 space-y-1.5 text-[13px]">
            <Row k="Owner" v={rec.owner} />
            <Row k="Priority" v={rec.priority || "Normal"} />
            <Row k="Due" v={rec.due || "-"} />
            <Row k="Last Activity" v={rec.lastActivity || "-"} />
            <Row k="Next Action" v={rec.nextAction || "-"} />
          </dl>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Select a record to see its detail panel.</p>
      )}
      <div className="mt-4 rounded-xl bg-muted/40 p-3 text-[12px] text-muted-foreground">
        <p className="font-medium text-foreground">Workflow stages</p>
        <p className="mt-1">{def.workflowStages.join(" -> ")}</p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-foreground">{v}</dd>
    </div>
  );
}