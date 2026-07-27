import { StaffFamilyPipeline } from "@/components/recruiting/StaffFamilyPipeline";

// Recruiting → Candidates → Clinic Staff Recruiting
// Real backend only (recruiting_candidates + recruiting_activity_events).
export default function OSRecruitingClinicStaff() {
  return (
    <StaffFamilyPipeline
      family="Clinic Staff"
      title="Clinic Staff Recruiting"
      description="Hire clinic directors, assistant clinic directors, clinical/training support, lead RBTs, and clinic operations roles through the canonical recruiting lifecycle."
      searchPlaceholder="Search name, applied title, state, recruiter, source…"
    />
  );
}