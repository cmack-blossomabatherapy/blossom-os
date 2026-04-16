import { PageShell } from "@/components/shared/PageShell";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";

const docs = [
  { name: "Insurance Card - Front", type: "Insurance", linked: "L-1042", uploaded: "Apr 14", status: "Verified" },
  { name: "Intake Form", type: "Intake Form", linked: "L-1042", uploaded: "Apr 13", status: "Complete" },
  { name: "Consent Packet", type: "Consent", linked: "C-0421", uploaded: "Apr 10", status: "Signed" },
  { name: "Treatment Plan v2", type: "Treatment Plan", linked: "C-0419", uploaded: "Apr 8", status: "In QA" },
  { name: "VOB Report", type: "VOB", linked: "L-1039", uploaded: "Apr 7", status: "Complete" },
  { name: "Insurance Card - Missing", type: "Insurance", linked: "L-1038", uploaded: "—", status: "Missing" },
];

const sv = (s: string) => ({ "Verified": "success" as const, "Complete": "success" as const, "Signed": "success" as const, "In QA": "info" as const, "Missing": "destructive" as const }[s] || "muted" as const);

export default function Documents() {
  return (
    <PageShell title="Documents" description="Document management across all records" icon={FileText}
      actions={<Button size="sm" variant="outline" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload</Button>}>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            {["Document","Type","Linked","Uploaded","Status"].map(h =>
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{h}</th>
            )}
          </tr></thead>
          <tbody>{docs.map((d, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors">
              <td className="px-4 py-2.5 font-medium text-foreground">{d.name}</td>
              <td className="px-4 py-2.5"><StatusBadge status={d.type} variant="muted" /></td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{d.linked}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{d.uploaded}</td>
              <td className="px-4 py-2.5"><StatusBadge status={d.status} variant={sv(d.status)} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </PageShell>
  );
}
