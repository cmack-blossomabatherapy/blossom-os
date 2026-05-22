import OSIntakeOperations from "./OSIntakeOperations";

/**
 * Intake Workspace — the operational execution environment for Intake Coordinators.
 *
 * Mounted at `/intake` and shares the same wiring as the Leads page (URL-driven
 * filters, IntakeModalsProvider, queues, blockers, pipeline, AI rail), but
 * framed as a coordinator workspace rather than a record list.
 */
export default function OSIntakeWorkspace() {
  return (
    <OSIntakeOperations
      title="Intake Workspace"
      subtitle="Coordinate family onboarding and move families toward operational readiness."
    />
  );
}
