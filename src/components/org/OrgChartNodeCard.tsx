import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mail } from "lucide-react";

export type OrgNodeData = {
  name: string;
  title?: string | null;
  department?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  accent_color?: string | null;
  isEditor: boolean;
};

// Tier is inferred from accent_color so the chart can be styled to look like
// a traditional org chart (purple department headers, teal leadership pills,
// green coordinator/IC pills) without a schema change.
//   #7C3AED / purple  → "group"       — department / division header
//   #14B8A6 / teal    → "leader"      — director / manager / lead
//   #22C55E / green   → "member"      — coordinator / IC (default fallback)
function tierFromAccent(accent: string): "group" | "leader" | "member" {
  const c = accent.toLowerCase();
  if (c.startsWith("#7c3aed") || c.startsWith("#8b5cf6") || c.startsWith("#a78bfa")) return "group";
  if (c.startsWith("#14b8a6") || c.startsWith("#0ea5a4") || c.startsWith("#2dd4bf") || c.startsWith("#60a5fa")) return "leader";
  return "member";
}

function OrgChartNodeCardImpl({ data, selected }: NodeProps) {
  const d = data as unknown as OrgNodeData;
  const accent = d.accent_color || "#22C55E";
  const tier = tierFromAccent(accent);

  if (tier === "group") {
    // Department / division pill — big rounded pill in purple like the reference.
    return (
      <div
        className={[
          "relative rounded-full px-8 py-3 text-center shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] transition-all",
          selected ? "ring-2 ring-primary/40" : "",
        ].join(" ")}
        style={{ background: accent, minWidth: 220 }}
      >
        <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-white/70" />
        <p className="truncate text-[15px] font-semibold tracking-tight text-white">
          {d.name}
        </p>
        {d.title && (
          <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wider text-white/80">
            {d.title}
          </p>
        )}
        <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-white/70" />
      </div>
    );
  }

  // Leader / member — rounded rectangle pill with a solid tint, name + title.
  const width = tier === "leader" ? 210 : 180;
  return (
    <div
      className={[
        "group relative rounded-2xl text-center transition-all",
        "shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_10px_24px_-18px_rgba(0,0,0,0.4)]",
        selected ? "ring-2 ring-primary/40" : "",
      ].join(" ")}
      style={{ background: accent, width }}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-white/70" />
      <div className="px-3 py-2.5">
        <p className="truncate text-[13px] font-semibold leading-tight tracking-tight text-white">
          {d.name}
        </p>
        {d.title && (
          <p className="mt-0.5 truncate text-[11px] leading-tight text-white/85">
            {d.title}
          </p>
        )}
        {d.email && (
          <a
            href={`mailto:${d.email}`}
            className="mt-1 hidden items-center justify-center gap-1 truncate text-[10px] text-white/80 hover:text-white group-hover:flex"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="size-3" />
            <span className="truncate">{d.email}</span>
          </a>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-white/70" />
    </div>
  );
}

export const OrgChartNodeCard = memo(OrgChartNodeCardImpl);
