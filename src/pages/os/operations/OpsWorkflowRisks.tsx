import { OpsPage, OpsCard, HealthPill, EmptyRow } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { daysUntil } from "@/data/authorizations";

export default function OpsWorkflowRisks() {
  const ops = useOpsIntelligence();

  const groups = [
    {
      id: "auth-expiring",
      title: "Authorization expirations",
      tone: "risk" as const,
      hint: "Reauth must start before expiration",
      items: ops.auths.expiring30
        .sort((a, b) => (daysUntil(a.expirationDate) ?? 99) - (daysUntil(b.expirationDate) ?? 99))
        .slice(0, 10)
        .map((a) => ({
          id: a.id,
          label: a.clientName,
          meta: `${a.payor} · expires in ${daysUntil(a.expirationDate)}d`,
        })),
    },
    {
      id: "qa-stalled",
      title: "QA review bottleneck",
      tone: "attention" as const,
      hint: "Plans sitting ≥3 days in QA",
      items: ops.auths.qaStalled.slice(0, 10).map((a) => ({
        id: a.id,
        label: a.clientName,
        meta: `${a.daysInStage}d · ${a.qaOwner ?? "Unassigned"}`,
      })),
    },
    {
      id: "missing-docs",
      title: "Missing documentation",
      tone: "attention" as const,
      hint: "Submissions blocked by missing info",
      items: ops.auths.missingDocs.slice(0, 10).map((a) => ({
        id: a.id,
        label: a.clientName,
        meta: a.missingRequirements.slice(0, 2).join(", ") || "Awaiting documents",
      })),
    },
    {
      id: "denied",
      title: "Denied authorizations",
      tone: "blocked" as const,
      hint: "Appeals coordination required",
      items: ops.auths.denied.slice(0, 10).map((a) => ({
        id: a.id,
        label: a.clientName,
        meta: `${a.payor}${a.denialReason ? " · " + a.denialReason : ""}`,
      })),
    },
  ];

  return (
    <OpsPage title="Workflow Risks" subtitle="Where work is getting stuck across the operational pipeline.">
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => (
          <OpsCard
            key={g.id}
            title={g.title}
            hint={`${g.items.length} · ${g.hint}`}
          >
            <div className="mb-2"><HealthPill tone={g.tone}>{g.tone}</HealthPill></div>
            {g.items.length === 0 ? (
              <EmptyRow>No risks in this category.</EmptyRow>
            ) : (
              <ul className="divide-y divide-border/60">
                {g.items.map((it) => (
                  <li key={it.id} className="py-2">
                    <div className="text-[13px] font-medium text-foreground">{it.label}</div>
                    <div className="text-[12px] text-muted-foreground">{it.meta}</div>
                  </li>
                ))}
              </ul>
            )}
          </OpsCard>
        ))}
      </div>
    </OpsPage>
  );
}