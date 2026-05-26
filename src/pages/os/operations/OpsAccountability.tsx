import { useMemo } from "react";
import { OpsPage, OpsCard, EmptyRow } from "./_shared";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useRecruitingCandidates } from "@/hooks/useRecruitingCandidates";

export default function OpsAccountability() {
  const auths = useLiveAuthorizations();
  const rec = useRecruitingCandidates();

  const ownerLoad = useMemo(() => {
    const map = new Map<string, { owner: string; auths: number; stalled: number }>();
    auths.items.forEach((a) => {
      const owner = a.coordinator || "Unassigned";
      const existing = map.get(owner) ?? { owner, auths: 0, stalled: 0 };
      existing.auths += 1;
      if (a.daysInStage >= 5) existing.stalled += 1;
      map.set(owner, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => b.stalled - a.stalled || b.auths - a.auths)
      .slice(0, 12);
  }, [auths.items]);

  const recruiterLoad = useMemo(() => {
    const map = new Map<string, { recruiter: string; total: number; stalled: number }>();
    rec.candidates.forEach((c) => {
      const recruiter = c.recruiter || "Unassigned";
      const existing = map.get(recruiter) ?? { recruiter, total: 0, stalled: 0 };
      existing.total += 1;
      const days = c.stage_entered_at
        ? Math.floor((Date.now() - new Date(c.stage_entered_at).getTime()) / 86400000)
        : 0;
      if (days >= 14) existing.stalled += 1;
      map.set(recruiter, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => b.stalled - a.stalled || b.total - a.total)
      .slice(0, 12);
  }, [rec.candidates]);

  return (
    <OpsPage title="Team Accountability" subtitle="Workload and follow-through by owner — supportive, not punitive.">
      <div className="grid gap-4 lg:grid-cols-2">
        <OpsCard title="Authorization coordinators" hint="Active auths · stalled ≥5d">
          {ownerLoad.length === 0 ? (
            <EmptyRow>No active authorizations.</EmptyRow>
          ) : (
            <ul className="divide-y divide-border/60">
              {ownerLoad.map((o) => (
                <li key={o.owner} className="flex items-center justify-between py-2">
                  <span className="text-[13.5px] font-medium text-foreground">{o.owner}</span>
                  <span className="text-[12px] text-muted-foreground tabular-nums">
                    {o.auths} active · <span className={o.stalled > 0 ? "text-amber-700" : ""}>{o.stalled} stalled</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        <OpsCard title="Recruiters" hint="Candidates · stalled ≥14d">
          {recruiterLoad.length === 0 ? (
            <EmptyRow>No candidates in pipeline.</EmptyRow>
          ) : (
            <ul className="divide-y divide-border/60">
              {recruiterLoad.map((r) => (
                <li key={r.recruiter} className="flex items-center justify-between py-2">
                  <span className="text-[13.5px] font-medium text-foreground">{r.recruiter}</span>
                  <span className="text-[12px] text-muted-foreground tabular-nums">
                    {r.total} active · <span className={r.stalled > 0 ? "text-amber-700" : ""}>{r.stalled} stalled</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>
      </div>
    </OpsPage>
  );
}