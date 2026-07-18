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
import CaseloadPage from "./caseload/CaseloadPage";
import BcbaMyRbtsPage from "./rbts/MyRbtsPage";

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

export function BcbaCaseload() {
  return <CaseloadPage />;
}

export function BcbaMyRbts() {
  return <BcbaMyRbtsPage />;
}

export function BcbaClinicalWork() {
  const tiles: Array<{ label: string; to: string; icon: React.ReactNode }> = [
    { label: "Assessments",      to: "/bcba/assessments",      icon: <ClipboardList className="h-4 w-4" strokeWidth={1.75} /> },
    { label: "Progress reports", to: "/bcba/progress-reports", icon: <FileText className="h-4 w-4" strokeWidth={1.75} /> },
    { label: "Supervision",      to: "/bcba/supervision",      icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.75} /> },
    { label: "Parent training",  to: "/bcba/parent-training",  icon: <HeartHandshake className="h-4 w-4" strokeWidth={1.75} /> },
    { label: "Productivity",     to: "/bcba/productivity",     icon: <Activity className="h-4 w-4" strokeWidth={1.75} /> },
    { label: "Fellowship",       to: "/bcba/fellowship",       icon: <BadgeCheck className="h-4 w-4" strokeWidth={1.75} /> },
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
            to="/bcba/academy"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-90"
          >
            Open BCBA Academy
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        }
      />
      <BcbaCardFrame
        title="Assigned learning"
        state="empty"
        icon={<GraduationCap className="h-4 w-4" strokeWidth={1.75} />}
        emptyLabel="Open the BCBA Academy for your assigned learning path, required modules, and Supervisor Toolkit."
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
            to="/bcba/support-center"
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
          emptyLabel="See explanations, capacity guidance, and MTD targets in your Productivity center."
          dataSource="CentralReach"
          action={
            <Link to="/bcba/productivity" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-90">
              Open productivity
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          }
        />
        <BcbaCardFrame
          title="Notifications"
          state="empty"
          icon={<User className="h-4 w-4" strokeWidth={1.75} />}
          emptyLabel="Notification preferences will appear here."
          action={
            <Link
              to="/bcba/settings/notifications"
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