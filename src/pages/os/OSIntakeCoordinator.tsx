import OSIntakeOperations from "./OSIntakeOperations";

/**
 * Intake Dashboard — Family Intake Operations Command Center.
 *
 * Shares the same operational workspace as the Leads page so Intake
 * Coordinators work from a single source of truth: KPIs, families needing
 * action, daily follow-ups, assessment coordination, missing-info center,
 * service-readiness pipeline, recent activity, and the Insights rail.
 */
export default function OSIntakeCoordinator() {
  return (
    <OSIntakeOperations
      title="Intake Dashboard"
      subtitle="Guide families from inquiry to operational readiness."
    />
  );
}
