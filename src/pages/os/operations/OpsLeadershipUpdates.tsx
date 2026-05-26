import { OpsPage, OpsCard, EmptyRow } from "./_shared";

export default function OpsLeadershipUpdates() {
  return (
    <OpsPage
      title="Leadership Updates"
      subtitle="Operational announcements and leadership communication — not a chat tool."
      actions={
        <button
          disabled
          className="inline-flex h-9 items-center rounded-xl border border-border/70 bg-card px-4 text-[13px] font-medium text-muted-foreground"
        >
          New update (coming soon)
        </button>
      }
    >
      <OpsCard title="Recent updates">
        <EmptyRow>
          No updates posted yet. Leadership Updates is the place to publish workflow changes,
          department updates, and urgent operational communication.
        </EmptyRow>
      </OpsCard>
    </OpsPage>
  );
}