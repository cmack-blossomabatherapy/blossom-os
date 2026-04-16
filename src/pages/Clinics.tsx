import { PageShell } from "@/components/shared/PageShell";
import { Building2 } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";

const clinics = [
  { name: "Peachtree Corners", state: "GA", active: 48, pending: 5, staff: 12, assessments: 3 },
  { name: "Riverdale", state: "GA", active: 32, pending: 3, staff: 8, assessments: 2 },
];

export default function Clinics() {
  return (
    <PageShell title="Clinics" description="Clinic-specific operations and census" icon={Building2}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clinics.map(c => (
          <div key={c.name} className="bg-card rounded-xl border border-border/60 p-5 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">{c.name}</h3>
              <p className="text-xs text-muted-foreground">{c.state}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Active Clients" value={c.active} />
              <KpiCard label="Pending Starts" value={c.pending} />
              <KpiCard label="Staff" value={c.staff} />
              <KpiCard label="Assessments" value={c.assessments} />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
