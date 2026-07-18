import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, Sparkles, Activity, Users, FileText, ClipboardList,
  ShieldCheck, AlertTriangle, HeartHandshake, BarChart3, BadgeCheck,
  LifeBuoy, GraduationCap, Award, ArrowRight,
} from "lucide-react";
import { BcbaCardFrame, type CardPriority } from "./CardFrame";
import type { BcbaDashboardCard } from "./useDashboardCards";

const ICONS: Record<string, ReactNode> = {
  Calendar:       <Calendar className="h-4 w-4" strokeWidth={1.75} />,
  Sparkles:       <Sparkles className="h-4 w-4" strokeWidth={1.75} />,
  Activity:       <Activity className="h-4 w-4" strokeWidth={1.75} />,
  Users:          <Users className="h-4 w-4" strokeWidth={1.75} />,
  FileText:       <FileText className="h-4 w-4" strokeWidth={1.75} />,
  ClipboardList:  <ClipboardList className="h-4 w-4" strokeWidth={1.75} />,
  ShieldCheck:    <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />,
  AlertTriangle:  <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />,
  HeartHandshake: <HeartHandshake className="h-4 w-4" strokeWidth={1.75} />,
  BarChart3:      <BarChart3 className="h-4 w-4" strokeWidth={1.75} />,
  BadgeCheck:     <BadgeCheck className="h-4 w-4" strokeWidth={1.75} />,
  LifeBuoy:       <LifeBuoy className="h-4 w-4" strokeWidth={1.75} />,
  GraduationCap:  <GraduationCap className="h-4 w-4" strokeWidth={1.75} />,
  Award:          <Award className="h-4 w-4" strokeWidth={1.75} />,
};

function priorityFromNumber(n: number): CardPriority {
  if (n <= 25) return "urgent";
  if (n <= 75) return "high";
  if (n <= 125) return "normal";
  return "low";
}

function CtaLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-90 transition-opacity"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
    </Link>
  );
}

/**
 * Generic card renderer. Every card here starts in an honest empty state
 * (no fake data). Data adapters can be introduced per-card in later phases;
 * the frame handles loading/stale/error consistently.
 */
export function BcbaCard({ card }: { card: BcbaDashboardCard }) {
  const icon = card.icon ? ICONS[card.icon] : undefined;
  const priority = priorityFromNumber(card.priority);
  const cta = card.cta_link && card.cta_label
    ? <CtaLink href={card.cta_link} label={card.cta_label} />
    : null;

  const dataSource = card.data_source
    ? card.data_source === "centralreach"
      ? "CentralReach"
      : card.data_source === "blossom"
        ? "Blossom OS"
        : card.data_source
    : null;

  // Per-card empty copy tuned for BCBA voice.
  const emptyByType: Record<string, string> = {
    todays_schedule:       "No sessions on your schedule today.",
    next_best_actions:     "No urgent actions right now.",
    caseload_health:       "Caseload health will appear once data is available.",
    my_rbt_team:           "No RBTs are currently assigned to your clients.",
    progress_reports_due:  "No progress reports due in the next 30 days.",
    assessments_due:       "No assessments in progress.",
    qa_corrections:        "No QA corrections routed to you.",
    supervision_risk:      "All RBTs are within supervision targets.",
    parent_training:       "No parent-training targets are overdue.",
    productivity_snapshot: "Productivity data will appear after your next sync.",
    credential_alert:      "No credentials expiring soon.",
    support_requests:      "No open support requests.",
    learning_due:          "No learning modules due.",
    recognition:           "No new recognition yet.",
    fellowship_supervision:"No fellowship candidates assigned.",
  };

  return (
    <BcbaCardFrame
      title={card.title}
      subtitle={card.subtitle}
      state="empty"
      priority={priority}
      dataSource={dataSource}
      freshness={card.freshness_hint}
      icon={icon}
      emptyLabel={emptyByType[card.card_type]}
      action={cta}
    />
  );
}