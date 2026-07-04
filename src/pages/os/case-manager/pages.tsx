import OSTraining from "../OSTraining";
import CommunityReferralsPage from "./CommunityReferrals";
import CMAssignedFamiliesPage from "./AssignedFamilies";
import CMParentCommunicationPage from "./ParentCommunication";
import CMFamilySupportPage from "./FamilySupport";
import CMProgressFollowUpsPage from "./ProgressFollowUps";
import CMSchedulingCoordinationPage from "./SchedulingCoordination";
import CMAuthorizationsVisibilityPage from "./AuthorizationsVisibility";
import CMStaffingCoordinationPage from "./StaffingCoordination";
import CMServiceIssuesPage from "./ServiceIssues";
import CMEscalationsPage from "./Escalations";

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
  return <CMEscalationsPage />;
}

/* ---------- COMMUNITY & SUPPORT ---------- */

export function CMCommunityReferrals() {
  return <CommunityReferralsPage />;
}