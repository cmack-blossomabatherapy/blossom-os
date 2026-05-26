import {
  GraduationCap, Users, MessageSquare, HeartHandshake, Activity,
  CalendarDays, ShieldCheck, UserCog, AlertTriangle, Flame,
  Globe2, BookOpen,
} from "lucide-react";
import CaseManagerComingSoon from "./CaseManagerComingSoon";

/* ---------- HOME ---------- */

export function CMTrainingAcademy() {
  return (
    <CaseManagerComingSoon
      title="Training Academy"
      icon={GraduationCap}
      description="Onboarding journeys, parent communication craft, escalation playbooks, and service coordination — designed to help every Case Manager grow with confidence."
      features={[
        { icon: GraduationCap, title: "Case Manager onboarding", description: "Guided journey for new Case Managers across regions." },
        { icon: MessageSquare, title: "Parent communication craft", description: "Frameworks and templates for warm, clear conversations." },
        { icon: Flame,         title: "Escalation management",     description: "How to recognize, route, and resolve sensitive situations." },
        { icon: Activity,      title: "Service coordination",      description: "Coordinating care continuity across BCBAs, RBTs, and schedules." },
        { icon: HeartHandshake,title: "Relationship management",   description: "Tools for building lasting family trust." },
        { icon: Users,         title: "Family support workflows",  description: "Step-by-step support patterns for common family needs." },
      ]}
    />
  );
}

/* ---------- FAMILY RELATIONSHIPS ---------- */

export function CMAssignedFamilies() {
  return (
    <CaseManagerComingSoon
      title="Assigned Families"
      icon={Users}
      description="Your caseload at a glance — calm, warm, and human-centered. See each family's profile, current care, and relationship health."
      features={[
        { icon: Users,         title: "Family profiles",         description: "A single warm view of each family you steward." },
        { icon: HeartHandshake,title: "Relationship health",     description: "Gentle indicators across engagement, satisfaction, and care continuity." },
        { icon: Activity,      title: "Engagement timeline",     description: "Touch-points across messages, calls, and visits." },
      ]}
      aiPreview={[
        "Summarize this family's last 30 days",
        "Draft a check-in message tailored to this parent",
        "Surface the families I haven't touched this week",
      ]}
    />
  );
}

export function CMParentCommunication() {
  return (
    <CaseManagerComingSoon
      title="Parent Communication"
      icon={MessageSquare}
      description="One calm inbox for every family conversation — messages, voicemails, follow-ups — designed to feel human, not transactional."
      features={[
        { icon: MessageSquare, title: "Unified family inbox",   description: "All inbound parent messages in one warm thread." },
        { icon: Activity,      title: "Communication timeline", description: "A complete history of touch-points per family." },
        { icon: HeartHandshake,title: "Smart templates",        description: "Warm, on-brand templates for common conversations." },
      ]}
      aiPreview={[
        "Draft a gentle response to this parent",
        "Suggest the right tone for this conversation",
        "Summarize this thread for a teammate",
      ]}
    />
  );
}

export function CMFamilySupport() {
  return (
    <CaseManagerComingSoon
      title="Family Support"
      icon={HeartHandshake}
      description="Coordinate every kind of support a family might need — from logistics to emotional check-ins — in one calm workspace."
      features={[
        { icon: HeartHandshake,title: "Support requests",     description: "Track and route family asks to the right person." },
        { icon: Activity,      title: "Family engagement",    description: "Patterns of engagement across the relationship." },
        { icon: AlertTriangle, title: "Continuity tracking",  description: "Early warning for any risk to a family's care." },
      ]}
    />
  );
}

export function CMProgressFollowUps() {
  return (
    <CaseManagerComingSoon
      title="Progress & Follow-Ups"
      icon={Activity}
      description="A focused list of follow-ups across your caseload — never miss a parent commitment, BCBA loop-back, or family check-in."
      features={[
        { icon: Activity,      title: "Follow-up queue",       description: "Today, this week, and overdue — calm and clear." },
        { icon: HeartHandshake,title: "Progress check-ins",    description: "Lightweight prompts to deepen family relationships." },
        { icon: MessageSquare, title: "Loop-back reminders",   description: "Stay current on every promise made to a parent." },
      ]}
      aiPreview={[
        "Suggest the most important follow-ups for today",
        "Draft check-ins for families approaching a milestone",
      ]}
    />
  );
}

/* ---------- OPERATIONS ---------- */

export function CMSchedulingCoordination() {
  return (
    <CaseManagerComingSoon
      title="Scheduling Coordination"
      icon={CalendarDays}
      description="Visibility into your families' schedules so you can anticipate disruption and stay one step ahead with parents."
      features={[
        { icon: CalendarDays, title: "Schedule awareness",  description: "See your families' weekly cadence at a glance." },
        { icon: AlertTriangle,title: "Cancellation signals",description: "Gentle alerts when patterns suggest a check-in." },
        { icon: Activity,     title: "Coverage gaps",       description: "Spot where families may feel a service drop." },
      ]}
    />
  );
}

export function CMAuthorizationsVisibility() {
  return (
    <CaseManagerComingSoon
      title="Authorizations Visibility"
      icon={ShieldCheck}
      description="A read-only window into authorizations for each of your families — so you're never surprised by an expiring auth."
      features={[
        { icon: ShieldCheck,  title: "Auth status per family", description: "Approved, pending, or expiring — at a glance." },
        { icon: AlertTriangle,title: "Renewal alerts",         description: "Quiet alerts ahead of an auth running short." },
        { icon: Activity,     title: "Utilization trends",     description: "Spot families burning hours faster than expected." },
      ]}
    />
  );
}

export function CMStaffingCoordination() {
  return (
    <CaseManagerComingSoon
      title="Staffing Coordination"
      icon={UserCog}
      description="Read-only staffing visibility so you can warmly prepare families for any change in their team."
      features={[
        { icon: UserCog,       title: "Assigned team",      description: "Current BCBAs and RBTs for each of your families." },
        { icon: AlertTriangle, title: "Staffing changes",   description: "Early signals when a family's team is shifting." },
        { icon: HeartHandshake,title: "Family-impact view", description: "Understand the relationship implications of a change." },
      ]}
    />
  );
}

export function CMServiceIssues() {
  return (
    <CaseManagerComingSoon
      title="Service Issues"
      icon={AlertTriangle}
      description="A calm workspace for tracking and resolving the small frictions families experience — before they grow."
      features={[
        { icon: AlertTriangle, title: "Issue tracking",    description: "Lightweight log of every reported service issue." },
        { icon: Activity,      title: "Resolution status", description: "Where each issue stands and who's on it." },
        { icon: HeartHandshake,title: "Family impact",     description: "How each issue affects the family relationship." },
      ]}
    />
  );
}

export function CMEscalations() {
  return (
    <CaseManagerComingSoon
      title="Escalations"
      icon={Flame}
      description="Sensitive situations handled with calm, structure, and care — with the right people looped in at the right time."
      features={[
        { icon: Flame,         title: "Open escalations",  description: "All active escalations across your families." },
        { icon: Activity,      title: "Routing & owners",  description: "Clear ownership across roles and regions." },
        { icon: HeartHandshake,title: "Family-first tone", description: "Templates and prompts that keep the family at the center." },
      ]}
      aiPreview={[
        "Summarize this escalation for a leader",
        "Suggest the next, most caring action",
      ]}
    />
  );
}

/* ---------- COMMUNITY & SUPPORT ---------- */

export function CMCommunityReferrals() {
  return (
    <CaseManagerComingSoon
      title="Community Referrals"
      icon={Globe2}
      description="A warm, curated library of autism resources, support organizations, and local programs to share with families."
      features={[
        { icon: Globe2,        title: "Autism resources",         description: "Trusted national and regional resources." },
        { icon: HeartHandshake,title: "Local programs",           description: "Programs near each family, by region." },
        { icon: Users,         title: "Parent support networks",  description: "Communities families can lean on." },
      ]}
    />
  );
}

export function CMResources() {
  return (
    <CaseManagerComingSoon
      title="Resource Library"
      icon={BookOpen}
      description="Connected to the global Blossom Resource Library — with categories tailored for Case Managers."
      features={[
        { icon: BookOpen,      title: "SOPs",                       description: "Standard operating procedures for Case Managers." },
        { icon: HeartHandshake,title: "Parent support resources",   description: "Curated for warm, helpful conversations." },
        { icon: MessageSquare, title: "Communication guidelines",   description: "Voice and tone across every family touch-point." },
        { icon: Flame,         title: "Escalation procedures",      description: "Clear steps for sensitive situations." },
        { icon: Activity,      title: "Service continuity workflows", description: "Keep care moving even through disruption." },
        { icon: ShieldCheck,   title: "Operational support documents", description: "Everything you need to operate calmly." },
      ]}
    />
  );
}