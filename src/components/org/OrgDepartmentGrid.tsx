/**
 * "By department" overview: one floating card per department with its head,
 * headcount, role mix and states. Clicking a card drills into that section of
 * the tree.
 */
import { Building2, ChevronRight, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgDepartmentSummary } from "@/lib/os/orgChart/tree";
import { cleanJobTitle } from "@/lib/os/orgChart/responsibilities";

const ACCENTS = [
  "from-[#2A6E70]/12 to-transparent border-[#2A6E70]/30",
  "from-[#3FB1B4]/12 to-transparent border-[#3FB1B4]/30",
  "from-[#6B4A8C]/12 to-transparent border-[#6B4A8C]/30",
  "from-[#7BB661]/12 to-transparent border-[#7BB661]/30",
  "from-[#C98BB9]/12 to-transparent border-[#C98BB9]/30",
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrgDepartmentGrid({
  departments,
  onOpenDepartment,
  onOpenPerson,
}: {
  departments: OrgDepartmentSummary[];
  onOpenDepartment: (dept: OrgDepartmentSummary) => void;
  onOpenPerson: (personId: string) => void;
}) {
  if (departments.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <Building2 className="size-6 opacity-60" />
        <p>No departments found in the employee directory yet.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {departments.map((dept, i) => (
          <button
            key={dept.name}
            type="button"
            onClick={() => onOpenDepartment(dept)}
            className={cn(
              "group rounded-2xl border bg-gradient-to-br p-4 text-left shadow-[0_10px_30px_-24px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-lg",
              ACCENTS[i % ACCENTS.length],
              "bg-card/70 backdrop-blur",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">{dept.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Users className="size-3" />
                  <span className="tabular-nums">{dept.headcount}</span> teammates
                  {dept.leaders > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">{dept.leaders}</span> leaders
                    </>
                  )}
                </p>
              </div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/70 px-2.5 py-2">
              <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-[11px] font-semibold">
                {dept.head?.photo ? (
                  <img
                    src={dept.head.photo}
                    alt={dept.head.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span>{dept.head ? initials(dept.head.name) : "—"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {dept.head ? (
                  <>
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (dept.anchorId) onOpenPerson(dept.anchorId);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          if (dept.anchorId) onOpenPerson(dept.anchorId);
                        }
                      }}
                      className="block truncate text-[12px] font-semibold hover:underline"
                    >
                      {dept.head.name}
                    </span>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {cleanJobTitle(dept.head.title) || "Department head"}
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    No department head set in HR
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {dept.topRoles.map((r) => (
                <span
                  key={r.label}
                  className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {r.label} <span className="tabular-nums font-semibold">{r.count}</span>
                </span>
              ))}
            </div>

            {dept.states.length > 0 && (
              <p className="mt-2 flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                <MapPin className="size-2.5" /> {dept.states.join(" · ")}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}