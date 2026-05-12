import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmployeeDirectory, type DirectoryEmployee } from "@/hooks/useEmployeeDirectory";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

/** Purple section/department pill — matches the brochure org-chart styling. */
function SectionPill({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm",
        "bg-[#6B4A8C]",
        className,
      )}
    >
      {label}
    </div>
  );
}

/** Teal node — managers / directors / coordinators (leadership). */
function TealNode({ m }: { m: DirectoryEmployee }) {
  return (
    <div className="rounded-xl bg-[#3FB1B4] px-3 py-1.5 text-center text-white shadow-sm min-w-[150px] max-w-[180px]">
      <p className="text-[12px] font-semibold leading-tight">{m.name}</p>
      <p className="text-[10px] leading-tight opacity-90">{m.title}</p>
    </div>
  );
}

/** Green node — individual contributors / specialists. */
function GreenNode({ m }: { m: DirectoryEmployee }) {
  return (
    <div className="rounded-xl bg-[#7BB661] px-3 py-1.5 text-center text-white shadow-sm min-w-[140px] max-w-[170px]">
      <p className="text-[11px] font-semibold leading-tight">{m.name}</p>
      <p className="text-[10px] leading-tight opacity-90">{m.title}</p>
    </div>
  );
}

function isLeader(m: DirectoryEmployee) {
  return (
    m.leadershipLevel === "executive" ||
    m.leadershipLevel === "director" ||
    m.leadershipLevel === "manager" ||
    m.leadership
  );
}

/** Vertical connector. */
const VLine = () => <div className="h-5 w-px bg-border" />;

/** Horizontal bar over a row of children. */
function HBar({ count }: { count: number }) {
  if (count <= 1) return null;
  return <div className="h-px w-full max-w-[80%] bg-border" />;
}

/** Department block: purple pill, optional leader(s), then ICs underneath. */
function DepartmentBlock({
  name,
  members,
  className,
}: {
  name: string;
  members: DirectoryEmployee[];
  className?: string;
}) {
  if (members.length === 0) return null;
  const leaders = members.filter(isLeader);
  const ics = members.filter((m) => !isLeader(m));

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <SectionPill label={name} />

      {leaders.length > 0 && (
        <>
          <VLine />
          <div className="flex flex-wrap items-start justify-center gap-3">
            {leaders.map((m) => (
              <TealNode key={m.id} m={m} />
            ))}
          </div>
        </>
      )}

      {ics.length > 0 && (
        <>
          <VLine />
          <HBar count={ics.length} />
          <div className="flex flex-wrap items-start justify-center gap-3">
            {ics.map((m) => (
              <GreenNode key={m.id} m={m} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OnboardingOrgChart() {
  const navigate = useNavigate();
  const { members, departments, loading } = useEmployeeDirectory();

  const byDept = useMemo(() => {
    const map = new Map<string, DirectoryEmployee[]>();
    for (const d of departments) map.set(d.id, []);
    for (const m of members) {
      const key = m.department || "unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    // Sort: leaders first, then by name
    for (const [k, list] of map) {
      list.sort((a, b) => {
        const al = isLeader(a) ? 0 : 1;
        const bl = isLeader(b) ? 0 : 1;
        if (al !== bl) return al - bl;
        return a.name.localeCompare(b.name);
      });
      map.set(k, list);
    }
    return map;
  }, [members, departments]);

  // Top-row executives: people with no manager / executive level
  const executives = useMemo(() => {
    const uuids = new Set(members.map((m) => m.uuid).filter(Boolean) as string[]);
    return members
      .filter((m) => m.leadershipLevel === "executive" || (!m.managerId && isLeader(m)) || (m.managerId && !uuids.has(m.managerId) && isLeader(m)))
      .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
      .slice(0, 4);
  }, [members]);

  const ROW_1 = ["operations", "hr-payroll", "marketing", "state-directors", "qa"];
  const ROW_2 = ["authorizations", "scheduling-rbt", "asst-state-directors", "regional-bcbas", "behavioral-support"];
  const ROW_3 = ["ga-case-management", "intake", "recruiting"];
  const KNOWN = new Set([...ROW_1, ...ROW_2, ...ROW_3]);

  // Anything else with members (extra DB departments, "unassigned", etc.)
  const extraDeptIds = useMemo(() => {
    const ids: string[] = [];
    for (const [id, list] of byDept) {
      if (!KNOWN.has(id) && list.length > 0) ids.push(id);
    }
    return ids;
  }, [byDept]);

  const deptNameFor = (id: string) => {
    if (id === "unassigned") return "Unassigned";
    return departments.find((d) => d.id === id)?.name
      ?? id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-16 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/onboarding"))}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/onboarding/team"><Users className="mr-1 h-3.5 w-3.5" /> Team Directory</Link>
        </Button>
      </div>

      {loading && members.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading org chart…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/60 bg-white p-6 shadow-sm sm:p-10">
          <div className="min-w-[1100px]">
            {/* Header */}
            <div className="mb-10 flex items-start justify-between gap-6">
              <div className="flex flex-col gap-2">
                <img src={logo} alt="Blossom ABA Therapy" className="h-14 w-auto" />
                <p className="text-lg font-medium text-[#3FB1B4]">Organizational Chart | May 2026</p>
              </div>
              {executives.length > 0 && (
                <div className="flex flex-col items-center gap-3">
                  <SectionPill label="CEO / COO" />
                  <VLine />
                  <div className="flex flex-wrap items-start justify-center gap-3">
                    {executives.map((m) => <TealNode key={m.id} m={m} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Two big rows of departments */}
            <div className="space-y-12">
              {/* Row 1: leadership / operational */}
              <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-10">
                {ROW_1.map((id) => (
                  <DepartmentBlock key={id} name={deptNameFor(id)} members={byDept.get(id) ?? []} />
                ))}
              </div>

              {/* Row 2: clinical / case ops */}
              <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-10">
                {ROW_2.map((id) => (
                  <DepartmentBlock key={id} name={deptNameFor(id)} members={byDept.get(id) ?? []} />
                ))}
              </div>

              {/* Row 3: intake & support */}
              <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-10">
                {ROW_3.map((id) => (
                  <DepartmentBlock key={id} name={deptNameFor(id)} members={byDept.get(id) ?? []} />
                ))}
              </div>

              {/* Row 4: any other department (incl. Unassigned) so every employee shows up */}
              {extraDeptIds.length > 0 && (
                <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-10">
                  {extraDeptIds.map((id) => (
                    <DepartmentBlock key={id} name={deptNameFor(id)} members={byDept.get(id) ?? []} />
                  ))}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><span className="inline-block h-3 w-6 rounded-full bg-[#6B4A8C]" /> Department</span>
              <span className="flex items-center gap-2"><span className="inline-block h-3 w-6 rounded bg-[#3FB1B4]" /> Leadership</span>
              <span className="flex items-center gap-2"><span className="inline-block h-3 w-6 rounded bg-[#7BB661]" /> Team member</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
