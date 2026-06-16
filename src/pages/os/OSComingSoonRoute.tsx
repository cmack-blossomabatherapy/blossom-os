import { Link, useSearchParams } from "react-router-dom";
import { Clock, GraduationCap, BookOpen, FileText, ArrowLeft, Users, Database, BarChart3, Workflow } from "lucide-react";

/**
 * Branded Coming Soon page used for non-launch Blossom OS modules.
 * Renders a calm, intentional placeholder with clear next actions.
 */
export default function OSComingSoonRoute() {
  const [params] = useSearchParams();
  const moduleName = params.get("module") || "This Workspace";

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
        <PreviewCard icon={Database} title="What data it will connect" body="Operational sources already in Blossom OS — clients, staffing, training, and more." />
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