import {
  GraduationCap, Users, MessageSquare, HeartHandshake, Activity,
  CalendarDays, ShieldCheck, UserCog, AlertTriangle, Flame,
  Globe2, BookOpen,
} from "lucide-react";
import CaseManagerComingSoon from "./CaseManagerComingSoon";
import OSTraining from "../OSTraining";
import CMAssignedFamiliesPage from "./AssignedFamilies";
import CMParentCommunicationPage from "./ParentCommunication";
import CMFamilySupportPage from "./FamilySupport";
import CMProgressFollowUpsPage from "./ProgressFollowUps";
import CMSchedulingCoordinationPage from "./SchedulingCoordination";
import CMAuthorizationsVisibilityPage from "./AuthorizationsVisibility";
import CMStaffingCoordinationPage from "./StaffingCoordination";
import CMServiceIssuesPage from "./ServiceIssues";

/* ---------- HOME ---------- */

/**
 * Case Manager → Training Academy
 * Renders the global, role-aware Training Academy. The Case Manager journey
 * is seeded in `src/lib/training/academyData.ts` and surfaces automatically
 * via `useOSRole()` / `getJourneyForRole("case_manager")`.
 */
export function CMTrainingAcademy() {
  return <OSTraining />;
}

/* ---------- FAMILY RELATIONSHIPS ---------- */

export function CMAssignedFamilies() {
  return <CMAssignedFamiliesPage />;
}

export function CMParentCommunication() {
  return <CMParentCommunicationPage />;
}

export function CMFamilySupport() {
  return <CMFamilySupportPage />;
}

export function CMProgressFollowUps() {
  return <CMProgressFollowUpsPage />;
}

/* ---------- OPERATIONS ---------- */

export function CMSchedulingCoordination() {
  return <CMSchedulingCoordinationPage />;
}

export function CMAuthorizationsVisibility() {
  return <CMAuthorizationsVisibilityPage />;
}

export function CMStaffingCoordination() {
  return <CMStaffingCoordinationPage />;
}

export function CMServiceIssues() {
  return <CMServiceIssuesPage />;
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