import { OpsPage, OpsCard, EmptyRow, MetricTile } from "./_shared";

export default function OpsTrainingAdoption() {
  return (
    <OpsPage
      title="Training & Adoption"
      subtitle="Operational consistency through Training Academy completion and SOP engagement."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MetricTile label="Academy enrollment" value="—" hint="Live tracking coming online" tone="neutral" />
        <MetricTile label="Average completion" value="—" hint="Across all role journeys" tone="neutral" />
        <MetricTile label="Stalled learners" value="—" hint="No movement ≥14 days" tone="neutral" />
      </div>

      <OpsCard title="Adoption by role">
        <EmptyRow>
          Role-level academy and SOP analytics are wiring up. Visit individual role training pages
          (Recruiting, HR, BCBA, RBT, Payroll, Scheduling) for current completion detail.
        </EmptyRow>
      </OpsCard>
    </OpsPage>
  );
}