import { Link as LinkIcon, ExternalLink, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { Escalation, OpsTask } from "@/lib/os/stateDirector/types";

/**
 * Richer read-only context panel used inside task/escalation detail
 * drawers. Shows every linked reference (Lead, Client, Candidate,
 * Authorization, Scheduling item), source module, CentralReach sync
 * status, and any metadata captured at creation time.
 *
 * Refs get action links back into the source area of the app (best-effort
 * — falls back to a query-param navigation when the exact drawer isn't
 * available yet).
 */
export function LinkedContextPanel({ row }: { row: OpsTask | Escalation }) {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const entries: { label: string; value: string }[] = [];
  const push = (label: string, value: unknown) => {
    if (value == null) return;
    const s = String(value).trim();
    if (!s) return;
    entries.push({ label, value: s });
  };
  push("Source module", row.sourceModule);
  push("State", row.state);
  push("Department", row.department);
  push("Priority", row.priority);
  push("Status", row.status);
  push("Created by", row.createdBy);
  push("Assigned", (row as any).owner ?? (row as any).assignedTo);
  push("Due", row.dueAt ? new Date(row.dueAt).toLocaleDateString() : undefined);
  push("CentralReach sync", row.centralreachSyncStatus ?? "not connected yet");

  const links: { label: string; ref: string; to: string }[] = [];
  if (row.linkedLeadId)
    links.push({ label: "Lead", ref: row.linkedLeadId, to: `/intake/dashboard?lead=${encodeURIComponent(row.linkedLeadId)}` });
  if (row.linkedClientId)
    links.push({ label: "Client", ref: row.linkedClientId, to: `/clients?client=${encodeURIComponent(row.linkedClientId)}` });
  if (row.linkedCandidateId)
    links.push({ label: "Candidate", ref: row.linkedCandidateId, to: `/recruiting?candidate=${encodeURIComponent(row.linkedCandidateId)}` });
  if (row.linkedAuthorizationId)
    links.push({ label: "Authorization", ref: row.linkedAuthorizationId, to: `/authorizations?auth=${encodeURIComponent(row.linkedAuthorizationId)}` });
  if (row.linkedSchedulingItemId)
    links.push({ label: "Scheduling item", ref: row.linkedSchedulingItemId, to: `/scheduling-workspace?item=${encodeURIComponent(row.linkedSchedulingItemId)}` });

  const metaKeys = Object.keys(meta).filter((k) => meta[k] != null && meta[k] !== "");

  if (!entries.length && !links.length && !metaKeys.length) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Info className="h-3.5 w-3.5" /> Linked context
      </div>
      {row.pending ? (
        <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">Pending — not yet saved</Badge>
      ) : null}
      {row.persistError ? (
        <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
          Save failed: {row.persistError}
        </Badge>
      ) : null}
      {entries.length ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {entries.map((e) => (
            <div key={e.label} className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">{e.label}</dt>
              <dd className="text-foreground">{e.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {links.length ? (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Linked records</div>
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <Link
                key={l.label + l.ref}
                to={l.to}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] hover:bg-muted"
              >
                <LinkIcon className="h-3 w-3" />
                <span className="font-medium">{l.label}:</span>
                <span className="text-muted-foreground">{l.ref.length > 24 ? l.ref.slice(0, 12) + "…" : l.ref}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {metaKeys.length ? (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Metadata</div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {metaKeys.map((k) => (
              <div key={k} className="flex gap-2">
                <dt className="text-muted-foreground w-28 shrink-0">{k}</dt>
                <dd className="text-foreground truncate" title={String(meta[k])}>{String(meta[k])}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}