import { Badge } from "@/components/ui/badge";
import { CloudOff, CloudUpload, RefreshCw, CheckCircle2, Eye, Hand, MinusCircle, Send, XCircle } from "lucide-react";

/**
 * Honest CentralReach sync status pill for BCBA workflow records.
 * "pending_import" is the default — we do NOT claim connected until the
 * CentralReach adapter actually round-trips the record.
 */
export function BcbaCentralReachBadge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  const s = (status ?? "pending_import").toLowerCase();
  const map: Record<string, { label: string; icon: any; tone: string }> = {
    synced:          { label: "CentralReach: synced",           icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    syncing:         { label: "CentralReach: syncing…",         icon: RefreshCw,    tone: "bg-blue-50 text-blue-700 border-blue-200" },
    error:           { label: "CentralReach: sync error",       icon: CloudOff,     tone: "bg-red-50 text-red-700 border-red-200" },
    not_configured:  { label: "CentralReach: not connected",    icon: CloudOff,     tone: "bg-slate-100 text-slate-600 border-slate-200" },
    pending_import:  { label: "CentralReach: pending import",   icon: CloudUpload,  tone: "bg-amber-50 text-amber-800 border-amber-200" },
    pending_review:  { label: "CentralReach: needs review",     icon: Eye,          tone: "bg-amber-50 text-amber-800 border-amber-200" },
    ready_for_api:   { label: "CentralReach: ready for future API", icon: CloudUpload, tone: "bg-sky-50 text-sky-700 border-sky-200" },
    manual_update_required: { label: "CentralReach: manual update required", icon: Hand, tone: "bg-orange-50 text-orange-800 border-orange-200" },
    not_applicable:  { label: "CentralReach: not applicable",   icon: MinusCircle,  tone: "bg-slate-100 text-slate-600 border-slate-200" },
    sent:            { label: "CentralReach: sent",             icon: Send,         tone: "bg-blue-50 text-blue-700 border-blue-200" },
    failed:          { label: "CentralReach: failed",           icon: XCircle,      tone: "bg-red-50 text-red-700 border-red-200" },
  };
  const v = map[s] ?? map.pending_import;
  const Icon = v.icon;
  return (
    <Badge variant="outline" className={`gap-1 border ${v.tone} ${className ?? ""}`}>
      <Icon className="h-3 w-3" aria-hidden />
      <span className="text-[11px] font-medium">{v.label}</span>
    </Badge>
  );
}

/**
 * Summary badge used on BCBA workspace / report headers to show how many
 * BOS-native workflow records are still awaiting a CentralReach import.
 */
export function BcbaCentralReachSummaryBadge({
  pendingCount,
  className,
}: {
  pendingCount: number;
  className?: string;
}) {
  if (pendingCount <= 0) {
    return (
      <Badge variant="outline" className={`gap-1 border bg-emerald-50 text-emerald-700 border-emerald-200 ${className ?? ""}`}>
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        <span className="text-[11px] font-medium">No pending CentralReach review</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`gap-1 border bg-amber-50 text-amber-800 border-amber-200 ${className ?? ""}`}>
      <CloudUpload className="h-3 w-3" aria-hidden />
      <span className="text-[11px] font-medium">
        {pendingCount} record{pendingCount === 1 ? "" : "s"} pending CentralReach review
      </span>
    </Badge>
  );
}