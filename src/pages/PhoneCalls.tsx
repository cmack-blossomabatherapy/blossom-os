import { PageShell } from "@/components/shared/PageShell";
import { Phone } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

const calls = [
  { time: "9:42 AM", caller: "Jennifer Thompson", type: "Inbound", status: "Connected", linked: "L-1042", duration: "4m 12s", handler: "Sarah M." },
  { time: "10:15 AM", caller: "Unknown", type: "Inbound", status: "Missed", linked: "—", duration: "—", handler: "—" },
  { time: "11:30 AM", caller: "Ravi Patel", type: "Outbound", status: "Attempted", linked: "L-1041", duration: "0m 30s", handler: "James R." },
  { time: "1:05 PM", caller: "Maria Garcia", type: "Inbound", status: "Connected", linked: "C-0419", duration: "8m 45s", handler: "Sarah M." },
];

const sv = (s: string) => ({ "Connected": "success" as const, "Missed": "destructive" as const, "Attempted": "warning" as const }[s] || "muted" as const);

export default function PhoneCalls() {
  return (
    <PageShell title="Phone Calls" description="Inbound and outbound call management" icon={Phone}>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            {["Time","Caller","Type","Status","Linked","Duration","Handler"].map(h =>
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{h}</th>
            )}
          </tr></thead>
          <tbody>{calls.map((c, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors">
              <td className="px-4 py-2.5 text-muted-foreground">{c.time}</td>
              <td className="px-4 py-2.5 font-medium text-foreground">{c.caller}</td>
              <td className="px-4 py-2.5"><StatusBadge status={c.type} variant="muted" /></td>
              <td className="px-4 py-2.5"><StatusBadge status={c.status} variant={sv(c.status)} /></td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{c.linked}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{c.duration}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{c.handler}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </PageShell>
  );
}
