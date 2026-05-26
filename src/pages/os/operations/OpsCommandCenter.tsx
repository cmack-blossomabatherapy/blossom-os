import { OpsPage, OpsCard, HealthPill, EmptyRow } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { daysUntil } from "@/data/authorizations";

export default function OpsCommandCenter() {
  const ops = useOpsIntelligence();

  const queues = [
    {
      id: "auths-expiring",
      title: "Auths expiring soon",
      tone: "risk" as const,
      items: ops.auths.expiring30
        .sort((a, b) => (daysUntil(a.expirationDate) ?? 99) - (daysUntil(b.expirationDate) ?? 99))
        .slice(0, 8)
        .map((a) => ({
          id: a.id,
          label: a.clientName,
          meta: `${a.payor} · expires in ${daysUntil(a.expirationDate)}d`,
          owner: a.coordinator,
        })),
    },
    {
      id: "qa-stalled",
      title: "QA review backlog",
      tone: "attention" as const,
      items: ops.auths.qaStalled.slice(0, 8).map((a) => ({
        id: a.id,
        label: a.clientName,
        meta: `${a.daysInStage}d in QA · ${a.payor}`,
        owner: a.qaOwner ?? a.coordinator,
      })),
    },
    {
      id: "missing-docs",
      title: "Missing documentation",
      tone: "attention" as const,
      items: ops.auths.missingDocs.slice(0, 8).map((a) => ({
        id: a.id,
        label: a.clientName,
        meta: a.missingRequirements.slice(0, 2).join(", ") || "Awaiting documents",
        owner: a.coordinator,
      })),
    },
    {
      id: "recruiting",
      title: "Stalled candidates",
      tone: "attention" as const,
      items: ops.recruiting.stalledCandidates.slice(0, 8).map((c) => ({
        id: c.id,
        label: `${c.first_name} ${c.last_name}`,
        meta: `${c.pipeline_stage} · ${c.role} · ${c.state}`,
        owner: c.recruiter ?? "Unassigned",
      })),
    },
  ];

  return (
    <OpsPage
      title="Operations Command Center"
      subtitle="One execution view across departments. Action queues, live signals, no clutter."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {queues.map((q) => (
          <OpsCard key={q.id} title={q.title} hint={`${q.items.length} item${q.items.length === 1 ? "" : "s"}`}>
            {q.items.length === 0 ? (
              <EmptyRow>Queue is clear.</EmptyRow>
            ) : (
              <ul className="divide-y divide-border/60">
                {q.items.map((it) => (
                  <li key={it.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-foreground truncate">{it.label}</div>
                      <div className="text-[12px] text-muted-foreground truncate">{it.meta}</div>
                    </div>
                    <div className="text-[11.5px] text-muted-foreground whitespace-nowrap">{it.owner}</div>
                  </li>
                ))}
              </ul>
            )}
          </OpsCard>
        ))}
      </div>

      <OpsCard title="Cross-department signals">
        <div className="grid gap-2 sm:grid-cols-2">
          {ops.depts.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-foreground">{d.name}</div>
                <div className="text-[12px] text-muted-foreground">{d.signal}</div>
              </div>
              <HealthPill tone={d.tone}>{d.tone}</HealthPill>
            </div>
          ))}
        </div>
      </OpsCard>
    </OpsPage>
  );
}