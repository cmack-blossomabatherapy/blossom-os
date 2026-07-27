import { StaffFamilyPipeline } from "@/components/recruiting/StaffFamilyPipeline";

// Recruiting → Candidates → Office Staff Recruiting
// Real backend only (recruiting_candidates + recruiting_activity_events).
export default function OSRecruitingOfficeStaff() {
  return (
    <StaffFamilyPipeline
      family="Office Staff"
      title="Office Staff Recruiting"
      description="Hire intake, scheduling, authorizations, billing/RCM, HR, and state/regional office support roles through the canonical recruiting lifecycle."
      searchPlaceholder="Search name, applied title, state, recruiter, source…"
    />
  );
}