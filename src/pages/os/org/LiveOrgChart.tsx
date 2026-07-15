/**
 * Live Org Chart
 * ---------------
 * Renders the full company org chart from the live employee directory
 * (`v_employee_directory` — 363+ active teammates today), grouped by
 * department, split into Leadership vs Team members, in the brochure
 * "purple / teal / green" style Chad approved.
 *
 * - Auto-includes every active/on-leave employee in User Management.
 * - Realtime: subscribes to `employees` + `hr_departments` via
 *   `useEmployeeDirectory`, so new hires appear the moment HR adds them.
 * - Every card links to `/user-management/<uuid>` so leaders can jump
 *   straight to the person's profile.
 * - HR / admins get an "Open editor" button that opens the manual
 *   drag-and-drop chart (`/org-chart/editor`) for custom layouts.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Users, X, Filter, Pencil, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useEmployeeDirectory,
  type DirectoryEmployee,
} from "@/hooks/useEmployeeDirectory";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

const EDITOR_ROLES = new Set([
  "super_admin",
  "admin",
  "systems_admin",
  "hr_team",
  "hr_lead",
  "executive",
]);

/** Department order — leadership first, then everyone else alphabetical. */
const DEPT_PRIORITY = [
  "Executive",
  "Executive Support",
  "State Leadership",
  "Operations",
  "Human Resources",
  "HR / Recruiting",
  "Recruiting",
  "Payroll / Finance",
  "Finance",
  "Marketing",
  "Business Development",
  "Intake",
  "Authorizations",
  "Scheduling",
  "Staffing",
  "QA / Compliance",
  "Behavioral Support",
  "Case Management",
  "Training / Clinical Support",
  "Clinic Operations",
  "Phone / Support",
  "Systems & Software",
];

function isLeader(m: DirectoryEmployee) {
  return (
    m.leadershipLevel === "executive" ||
    m.leadershipLevel === "director" ||
    m.leadershipLevel === "manager" ||
    m.leadershipLevel === "lead" ||
    !!m.leadership
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function SectionPill({ label, count }: { label: string; count: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#6B4A8C] px-4 py-1.5 text-sm font-semibold text-white shadow-sm">
      <span>{label}</span>
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium tabular-nums">
        {count}
      </span>
    </div>
  );
}

function PersonCard({
  m,
  variant,
}: {
  m: DirectoryEmployee;
  variant: "executive" | "leader" | "member";
}) {
  const bg =
    variant === "executive"
      ? "bg-[#2A6E70]"
      : variant === "leader"
        ? "bg-[#3FB1B4]"
        : "bg-[#7BB661]";
  const target = m.uuid ? `/user-management/${m.uuid}` : "/user-management";
  const photo = m.photo;

  return (
    <Link
      to={target}
      className={cn(
        "group relative flex w-[168px] flex-col items-center gap-1 rounded-2xl px-3 pt-3 pb-2 text-center text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        bg,
      )}
      title={m.email ?? m.name}
    >
      <div className="grid size-10 place-items-center overflow-hidden rounded-full bg-white/15 ring-1 ring-white/25">
        {photo ? (
          <img
            src={photo}
            alt={m.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-[11px] font-semibold text-white/90">
            {initials(m.name)}
          </span>
        )}
      </div>
      <p className="text-[12px] font-semibold leading-tight">{m.name}</p>
      {m.title && (
        <p className="line-clamp-2 text-[10px] leading-tight opacity-90">
          {m.title}
        </p>
      )}
    </Link>
  );
}

function DepartmentBlock({
  name,
  members,
}: {
  name: string;
  members: DirectoryEmployee[];
}) {
  if (members.length === 0) return null;
  const leaders = members.filter(isLeader);
  const ics = members.filter((m) => !isLeader(m));

  return (
    <div className="flex min-w-[220px] flex-1 basis-[320px] flex-col items-center gap-3 rounded-3xl border border-border/60 bg-card/60 p-5 shadow-sm">
      <SectionPill label={name} count={members.length} />

      {leaders.length > 0 && (
        <div className="flex flex-wrap items-start justify-center gap-2">
          {leaders.map((m) => (
            <PersonCard key={m.id} m={m} variant="leader" />
          ))}
        </div>
      )}

      {ics.length > 0 && (
        <>
          {leaders.length > 0 && (
            <div className="h-px w-3/4 bg-border/70" />
          )}
          <div className="flex flex-wrap items-start justify-center gap-2">
            {ics.map((m) => (
              <PersonCard key={m.id} m={m} variant="member" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function sortDept(a: string, b: string) {
  const ai = DEPT_PRIORITY.indexOf(a);
  const bi = DEPT_PRIORITY.indexOf(b);
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  return a.localeCompare(b);
}

export default function LiveOrgChart() {
  const { members, loading } = useEmployeeDirectory();
  const { role } = useOSRole();
  const canEdit = EDITOR_ROLES.has(role as string);

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<"all" | "leaders" | "members">(
    "all",
  );

  // Only show active teammates on the public org chart.
  const activeMembers = useMemo(
    () =>
      members.filter(
        (m) => !m.status || m.status === "active" || m.status === "on_leave",
      ),
    [members],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeMembers.filter((m) => {
      if (
        deptFilter !== "all" &&
        (m.departmentName ?? "Unassigned") !== deptFilter
      )
        return false;
      if (levelFilter === "leaders" && !isLeader(m)) return false;
      if (levelFilter === "members" && isLeader(m)) return false;
      if (!q) return true;
      const hay = [m.name, m.title, m.departmentName, m.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeMembers, query, deptFilter, levelFilter]);

  const executives = useMemo(
    () =>
      activeMembers
        .filter((m) => m.leadershipLevel === "executive")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activeMembers],
  );

  const byDept = useMemo(() => {
    const map = new Map<string, DirectoryEmployee[]>();
    for (const m of filtered) {
      // Executives already appear in the top row — don't duplicate them.
      if (m.leadershipLevel === "executive" && levelFilter === "all") continue;
      const key = m.departmentName ?? "Unassigned";
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const al = isLeader(a) ? 0 : 1;
        const bl = isLeader(b) ? 0 : 1;
        if (al !== bl) return al - bl;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [filtered, levelFilter]);

  const departmentNames = useMemo(
    () =>
      Array.from(
        new Set(
          activeMembers.map((m) => m.departmentName ?? "Unassigned"),
        ),
      ).sort(sortDept),
    [activeMembers],
  );

  const orderedDepts = useMemo(
    () => Array.from(byDept.keys()).sort(sortDept),
    [byDept],
  );

  const totalShown =
    (levelFilter === "all" ? executives.length : 0) +
    Array.from(byDept.values()).reduce((s, l) => s + l.length, 0);

  const clearFilters = () => {
    setQuery("");
    setDeptFilter("all");
    setLevelFilter("all");
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-16 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, title, email…"
              className="h-9 w-72 rounded-xl pl-8 pr-8"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-9 w-[200px] rounded-xl text-sm">
              <Filter className="mr-2 size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departmentNames.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="inline-flex overflow-hidden rounded-xl border border-border/70 bg-background text-xs">
            {(["all", "leaders", "members"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevelFilter(l)}
                className={cn(
                  "px-3 py-1.5 font-medium capitalize transition-colors",
                  levelFilter === l
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {l === "all" ? "Everyone" : l}
              </button>
            ))}
          </div>

          {(query || deptFilter !== "all" || levelFilter !== "all") && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 rounded-xl text-xs text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="size-3" /> Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
            <Users className="size-3.5" />
            <span className="tabular-nums">{totalShown}</span>
            <span>shown</span>
            <span className="opacity-50">·</span>
            <span className="tabular-nums">{activeMembers.length}</span>
            <span>total</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-xl"
            onClick={() => window.print()}
            title="Print / save as PDF"
          >
            <Download className="size-4" /> Print
          </Button>
          {canEdit && (
            <Button asChild size="sm" variant="outline" className="h-9 rounded-xl">
              <Link to="/org-chart/editor">
                <Pencil className="size-4" /> Manual editor
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline" className="h-9 rounded-xl">
            <Link to="/user-management">
              <Users className="size-4" /> User management
            </Link>
          </Button>
        </div>
      </div>

      {loading && activeMembers.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading the org chart…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/60 bg-gradient-to-br from-white via-white to-[#F5F1FA] p-6 shadow-sm sm:p-10">
          <div className="min-w-[1100px] space-y-10">
            {/* Header banner */}
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex flex-col gap-2">
                <img src={logo} alt="Blossom ABA Therapy" className="h-12 w-auto" />
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#3F2A55]">
                    Organizational Chart
                  </h1>
                  <p className="text-sm text-[#6B4A8C]/80">
                    Live from User Management ·{" "}
                    {new Date().toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {executives.length > 0 && levelFilter !== "members" && (
                <div className="flex flex-col items-center gap-3">
                  <SectionPill label="Executive Leadership" count={executives.length} />
                  <div className="h-4 w-px bg-[#6B4A8C]/40" />
                  <div className="flex flex-wrap items-start justify-center gap-3">
                    {executives.map((m) => (
                      <PersonCard key={m.id} m={m} variant="executive" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Departments */}
            {orderedDepts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
                <Users className="size-6 opacity-60" />
                <p>No teammates match your filters.</p>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={clearFilters}>
                  Reset filters
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-stretch justify-center gap-6">
                {orderedDepts.map((name) => (
                  <DepartmentBlock
                    key={name}
                    name={name}
                    members={byDept.get(name) ?? []}
                  />
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-6 rounded-full bg-[#6B4A8C]" />
                Department
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-6 rounded bg-[#2A6E70]" />
                Executive
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-6 rounded bg-[#3FB1B4]" />
                Leadership
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-6 rounded bg-[#7BB661]" />
                Team member
              </span>
              <span className="opacity-50">·</span>
              <span>Click any card to open their profile in User Management.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}