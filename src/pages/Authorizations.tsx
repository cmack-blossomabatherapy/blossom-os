import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ShieldCheck } from "lucide-react";

const auths = [
  { id: "A-2201", client: "Emma Thompson", type: "Treatment", payor: "Anthem BCBS", status: "Approved", submitted: "2026-03-01", expires: "2026-06-15", owner: "Priya K." },
  { id: "A-2200", client: "Aiden Patel", type: "Initial", payor: "United Healthcare", status: "Submitted", submitted: "2026-04-10", expires: "—", owner: "Marcus T." },
  { id: "A-2199", client: "Sofia Garcia", type: "Treatment", payor: "Aetna", status: "Approved", submitted: "2026-02-15", expires: "2026-08-01", owner: "Priya K." },
  { id: "A-2198", client: "Liam Chen", type: "Initial", payor: "Cigna", status: "Awaiting Submission", submitted: "—", expires: "—", owner: "Marcus T." },
  { id: "A-2197", client: "Olivia Brown", type: "Treatment", payor: "Anthem BCBS", status: "In QA Review", submitted: "—", expires: "—", owner: "Priya K." },
  { id: "A-2196", client: "Noah Williams", type: "Initial", payor: "Medicaid", status: "Denied", submitted: "2026-04-02", expires: "—", owner: "Marcus T." },
];

const sv = (s: string) => {
  const m: Record<string, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    "Approved": "success", "Submitted": "info", "Awaiting Submission": "warning",
    "In QA Review": "default", "Denied": "destructive", "Expiring Soon": "warning",
  };
  return m[s] || "muted";
};

export default function Authorizations() {
  return (
    <PageShell title="Authorizations" description="Track auth submissions, approvals, and renewals" icon={ShieldCheck}>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            {["ID","Client","Type","Payor","Status","Submitted","Expires","Owner"].map(h =>
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{h}</th>
            )}
          </tr></thead>
          <tbody>{auths.map(a => (
            <tr key={a.id} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors">
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{a.id}</td>
              <td className="px-4 py-2.5 font-medium text-foreground">{a.client}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{a.type}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{a.payor}</td>
              <td className="px-4 py-2.5"><StatusBadge status={a.status} variant={sv(a.status)} /></td>
              <td className="px-4 py-2.5 text-muted-foreground">{a.submitted}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{a.expires}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{a.owner}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </PageShell>
  );
}
