import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import {
  Calendar, Users, ClipboardList, GraduationCap, LifeBuoy, User,
  UserCheck, FileText, ShieldCheck, HeartHandshake, BadgeCheck,
  Sparkles, ArrowRight, Activity,
} from "lucide-react";
import { BcbaCardFrame } from "./shared/CardFrame";
import { BcbaCard } from "./shared/cards";
import { useBcbaDashboardCards } from "./shared/useDashboardCards";
import BcbaHomePage from "./home/BcbaHomePage";

/* -------------------------------------------------------------------------- */
/*  Shared page chrome                                                        */
/* -------------------------------------------------------------------------- */

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1
          className={
            isMobile
              ? "text-2xl font-semibold tracking-tight"
              : "text-3xl font-semibold tracking-tight"
          }
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-2 md:px-4 py-2 md:py-8">
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Home — dashboard cards                                                    */
/* -------------------------------------------------------------------------- */

export function BcbaHome() {
  return <BcbaHomePage />;
}

function _LegacyBcbaHome() {
  const { cards, loading, error } = useBcbaDashboardCards();
  const isMobile = useIsMobile();
  const heading = <PageHeader title="Good to see you" />;
  if (loading) return <PageContainer>{heading}<BcbaCardFrame title="Loading…" state="loading" /></PageContainer>;
  if (error)   return <PageContainer>{heading}<BcbaCardFrame title="Error" state="error" errorLabel={error} /></PageContainer>;
  if (cards.length === 0) return <PageContainer>{heading}<BcbaCardFrame title="Nothing yet" state="empty" /></PageContainer>;
  return (
    <PageContainer>{heading}
      <div className={isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"}>
        {cards.map((c) => (<BcbaCard key={c.id} card={c} />
        ))}
      </div>
    </PageContainer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Placeholder pages — each ships with a clear empty state + real navigation */
/* -------------------------------------------------------------------------- */

function ComingSoonCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <BcbaCardFrame
      title={title}
      state="empty"
      emptyLabel={message}
    />
  );
}

export function BcbaCaseload() {
  return (
    <PageContainer>
      <PageHeader
        title="Caseload"
        subtitle="Every client you own, with health at a glance."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <BcbaCardFrame
          title="Case health"
          subtitle="Signals across authorization, supervision, docs, and utilization"
          state="empty"
          icon={<Activity className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="Case-health snapshots appear here once your CentralReach sync runs."
          dataSource="CentralReach"
        />
        <BcbaCardFrame
          title="Authorization deadlines"
          state="empty"
          icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="No authorizations approaching expiration."
          dataSource="CentralReach"
        />
        <BcbaCardFrame
          title="Documentation status"
          state="empty"
          icon={<FileText className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="No open documentation items."
          dataSource="Blossom OS"
        />
      </div>
    </PageContainer>
  );
}

export function BcbaMyRbts() {
  return (
    <PageContainer>
      <PageHeader
        title="My RBTs"
        subtitle="RBTs paired to your clients — supervision, training, and support."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <BcbaCardFrame
          title="Assigned RBTs"
          state="empty"
          icon={<Users className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="No RBTs are currently assigned to your clients."
          dataSource="CentralReach"
        />
        <BcbaCardFrame
          title="Supervision risk"
          state="empty"
          icon={<UserCheck className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="All RBTs are within supervision targets."
          dataSource="Blossom OS"
        />
      </div>
    </PageContainer>
  );
}

export function BcbaClinicalWork() {
  const tiles: Array<{ label: string; to: string; icon: React.ReactNode }> = [
    { label: "Assessments",     to: "/bcba/clinical",  icon: <ClipboardList className="h-4 w-4" strokeWidth={1.75} /> },
    { label: "Progress reports",to: "/bcba/clinical",  icon: <FileText className="h-4 w-4" strokeWidth={1.75} /> },
    { label: "Reassessments",   to: "/bcba/clinical",  icon: <FileText className="h-4 w-4" strokeWidth={1.75} /> },
    { label: "QA corrections",  to: "/bcba/clinical",  icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.75} /> },
    { label: "Parent training", to: "/bcba/clinical",  icon: <HeartHandshake className="h-4 w-4" strokeWidth={1.75} /> },
    { label: "Authorizations",  to: "/bcba/clinical",  icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.75} /> },
  ];
  return (
    <PageContainer>
      <PageHeader
        title="Clinical Work"
        subtitle="Blossom organizes the work around clinical care. Records live in CentralReach."
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            className="rounded-2xl border border-border/70 bg-card p-5 hover:-translate-y-0.5 transition-transform"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              {t.icon}
              <span className="text-[11px] uppercase tracking-widest">Work</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{t.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <ComingSoonCard
          title="Detailed pipelines"
          message="Assessment, report, QA, and parent-training pipelines will appear here as data becomes available."
        />
      </div>
    </PageContainer>
  );
}

export function BcbaLearn() {
  return (
    <PageContainer>
      <PageHeader
        title="Learn"
        subtitle="Your BCBA pathway in the Blossom Academy."
        action={
          <Link
            to="/training/academy"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-90"
          >
            Open Academy
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        }
      />
      <BcbaCardFrame
        title="Assigned learning"
        state="empty"
        icon={<GraduationCap className="h-4 w-4" strokeWidth={1.75} />}
        emptyLabel="Your assigned learning will appear here."
        dataSource="Blossom Academy"
      />
    </PageContainer>
  );
}

export function BcbaSupport() {
  return (
    <PageContainer>
      <PageHeader
        title="Support"
        subtitle="Reach the right team without knowing the org chart."
        action={
          <Link
            to="/rbt/app/support/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-90"
          >
            New request
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <BcbaCardFrame
          title="Open requests"
          state="empty"
          icon={<LifeBuoy className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="You have no open support requests."
        />
        <BcbaCardFrame
          title="My support team"
          state="empty"
          icon={<Users className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="Contacts appear here once support routing is configured."
          dataSource="Blossom OS"
        />
      </div>
    </PageContainer>
  );
}

export function BcbaMe() {
  return (
    <PageContainer>
      <PageHeader
        title="Me"
        subtitle="Profile, credentials, availability, growth, and preferences."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <BcbaCardFrame
          title="Credentials"
          state="empty"
          icon={<BadgeCheck className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="No credentials on file yet."
          dataSource="Blossom OS"
        />
        <BcbaCardFrame
          title="Growth"
          state="empty"
          icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="Your growth plan will appear here."
        />
        <BcbaCardFrame
          title="Productivity"
          state="empty"
          icon={<Calendar className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="Productivity data will appear after your next sync."
          dataSource="CentralReach"
        />
        <BcbaCardFrame
          title="Notifications"
          state="empty"
          icon={<User className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="Notification preferences will appear here."
          action={
            <Link
              to="/rbt/app/settings/notifications"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-90"
            >
              Open preferences
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          }
        />
      </div>
    </PageContainer>
  );
}