import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mail, GripVertical } from "lucide-react";

export type OrgNodeData = {
  name: string;
  title?: string | null;
  department?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  accent_color?: string | null;
  isEditor: boolean;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function OrgChartNodeCardImpl({ data, selected }: NodeProps) {
  const d = data as unknown as OrgNodeData;
  const accent = d.accent_color || "hsl(var(--primary))";
  return (
    <div
      className={[
        "group relative w-[260px] rounded-2xl border bg-card/95 backdrop-blur-xl transition-all",
        "shadow-[0_1px_0_hsl(var(--background)/0.6)_inset,0_10px_30px_-18px_hsl(var(--foreground)/0.35)]",
        selected ? "border-primary/60 ring-2 ring-primary/25" : "border-border/70 hover:border-border",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-0 !bg-primary/70"
      />
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl opacity-80"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="flex items-start gap-3 p-4">
        <div
          className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-primary-foreground"
          style={{ background: accent }}
        >
          {d.avatar_url ? (
            <img
              src={d.avatar_url}
              alt=""
              className="size-11 rounded-full object-cover"
            />
          ) : (
            initials(d.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              {d.name}
            </p>
            {d.isEditor && (
              <GripVertical className="ml-auto size-3.5 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </div>
          {d.title && (
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {d.title}
            </p>
          )}
          {d.department && (
            <span className="mt-2 inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {d.department}
            </span>
          )}
          {d.email && (
            <a
              href={`mailto:${d.email}`}
              className="mt-2 flex items-center gap-1.5 truncate text-[12px] text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="size-3" />
              <span className="truncate">{d.email}</span>
            </a>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-primary/70"
      />
    </div>
  );
}

export const OrgChartNodeCard = memo(OrgChartNodeCardImpl);
