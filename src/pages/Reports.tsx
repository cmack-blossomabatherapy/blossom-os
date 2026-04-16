import { PageShell } from "@/components/shared/PageShell";
import { BarChart3 } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";

const metrics = [
  { label: "Avg Time to Contact", value: "2.4h", change: "-18% vs last month", trend: "up" as const },
  { label: "Avg Time to Form Completion", value: "3.2d", change: "-8%", trend: "up" as const },
  { label: "Avg Time to VOB", value: "1.8d", change: "+5%", trend: "down" as const },
  { label: "Avg Time to Initial Auth", value: "6.5d", change: "-12%", trend: "up" as const },
  { label: "Avg Time to Assessment", value: "11.2d", change: "-3%", trend: "up" as const },
  { label: "Avg Time to Start Date", value: "28d", change: "+2d", trend: "down" as const },
  { label: "Lead Conversion Rate", value: "34%", change: "+4%", trend: "up" as const },
  { label: "Denial Rate", value: "8%", change: "-2%", trend: "up" as const },
  { label: "QA Turnaround", value: "3.1d", change: "-1d", trend: "up" as const },
  { label: "Active Census", value: "142", change: "+8", trend: "up" as const },
  { label: "Staffing Gap", value: "13", change: "+4", trend: "down" as const },
  { label: "Flake Rate", value: "5%", change: "-1%", trend: "up" as const },
];

export default function Reports() {
  return (
    <PageShell title="Reports" description="Executive and operational performance metrics" icon={BarChart3}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics.map(m => <KpiCard key={m.label} {...m} />)}
      </div>
    </PageShell>
  );
}
