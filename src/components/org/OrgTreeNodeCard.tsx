/**
 * Org chart tree node — person card with role, responsibilities preview,
 * report counts and a collapse chip. Rendered inside React Flow.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, Users, Building2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgLeadershipLevel } from "@/lib/os/orgChart/tree";

export type OrgTreeNodeData = {
  name: string;
  title?: string | null;
  roleLabel?: string;
  department?: string | null;
  photo?: string | null;
  state?: string | null;
  level?: OrgLeadershipLevel | null;
  responsibilities: string[];
  directReports: number;
  totalReports: number;
  collapsed: boolean;
  hasChildren: boolean;
  isRoot?: boolean;
  headcount?: number;
  overridden?: boolean;
  dimmed?: boolean;
  onToggleCollapse?: () => void;
  onOpen?: () => void;
};

const LEVEL_STYLE: Record<string, string> = {
  executive: "border-[#2A6E70]/40 bg-[#2A6E70] text-white",
  director: "border-[#3FB1B4]/40 bg-[#3FB1B4] text-white",
  manager: "border-[#6B4A8C]/30 bg-[#6B4A8C] text-white",
  lead: "border-[#7BB661]/40 bg-[#7BB661] text-white",
  individual: "border-border/70 bg-card text-foreground",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function OrgTreeNodeCardImpl({ data, selected }: NodeProps) {
  const d = data as unknown as OrgTreeNodeData;

  if (d.isRoot) {
    return (
      <div className="relative rounded-full bg-[#3F2A55] px-7 py-3 text-center text-white shadow-[0_12px_30px_-18px_rgba(0,0,0,0.45)]">
        <p className="text-sm font-semibold tracking-tight">{d.name}</p>
        <p className="text-[11px] text-white/75">
          {d.headcount ?? 0} teammates
        </p>
        <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-white/70" />
      </div>
    );
  }

  const tone = LEVEL_STYLE[d.level ?? "individual"] ?? LEVEL_STYLE.individual;
  const isLight = (d.level ?? "individual") === "individual";

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          d.onOpen?.();
        }
      }}
      onClick={() => d.onOpen?.()}
      className={cn(
        "relative w-[236px] cursor-pointer rounded-2xl border px-3 py-2.5 text-left shadow-[0_10px_26px_-20px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-lg",
        tone,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        d.dimmed && "opacity-25",
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-primary/60" />
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center overflow-hidden rounded-full",
            isLight ? "bg-muted text-foreground" : "bg-white/15 text-white ring-1 ring-white/25",
          )}
        >
          {d.photo ? (
            <img src={d.photo} alt={d.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="text-[11px] font-semibold">{initials(d.name)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight">{d.name}</p>
          <p className={cn("truncate text-[11px] leading-tight", isLight ? "text-muted-foreground" : "text-white/85")}>
            {d.title || d.roleLabel}
          </p>
          <div
            className={cn(
              "mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]",
              isLight ? "text-muted-foreground" : "text-white/75",
            )}
          >
            {d.department && (
              <span className="inline-flex items-center gap-1 truncate">
                <Building2 className="size-2.5" /> {d.department}
              </span>
            )}
            {d.totalReports > 0 && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Users className="size-2.5" /> {d.directReports}
                {d.totalReports !== d.directReports ? ` / ${d.totalReports}` : ""}
              </span>
            )}
            {d.overridden && (
              <span className="inline-flex items-center gap-1" title="Manual reporting line">
                <ShieldCheck className="size-2.5" /> manual
              </span>
            )}
          </div>
          {d.responsibilities[0] && (
            <p
              className={cn(
                "mt-1 line-clamp-1 text-[10px] italic",
                isLight ? "text-muted-foreground/80" : "text-white/70",
              )}
            >
              {d.responsibilities[0]}
            </p>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-primary/60" />
      {d.hasChildren && (
        <button
          type="button"
          aria-label={d.collapsed ? `Expand ${d.name}'s team` : `Collapse ${d.name}'s team`}
          onClick={(e) => {
            e.stopPropagation();
            d.onToggleCollapse?.();
          }}
          className="nodrag absolute -bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/70 bg-card px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm hover:bg-muted"
        >
          {d.collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
          <span className="tabular-nums">{d.totalReports}</span>
        </button>
      )}
    </div>
  );
}

export const OrgTreeNodeCard = memo(OrgTreeNodeCardImpl);