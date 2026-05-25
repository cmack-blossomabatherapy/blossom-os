import { ShieldCheck } from "lucide-react";
import { HRShellPage } from "./_HRShellPage";

export default function OSHRCompliance() {
  return (
    <HRShellPage
      title="Compliance & Documents"
      subtitle="HIPAA · BACB · I-9 · E-Verify · state credentials"
      icon={ShieldCheck}
      intent="Quietly maintain the documents and credentials that keep us operating — surface only what’s missing or expiring."
      kpis={[
        { label: "Compliance rate", value: "—" },
        { label: "Missing docs", value: "—" },
        { label: "Expiring 30d", value: "—" },
        { label: "Expired", value: "—" },
        { label: "Background pending", value: "—" },
      ]}
      sections={[
        { title: "Missing or expiring", body: <p className="text-sm text-muted-foreground">Connects to employee_documents + employee_certifications in Phase 2.</p> },
        { title: "Background checks", body: <p className="text-sm text-muted-foreground">Live status from background_checks.</p> },
      ]}
      aside={<p className="text-sm text-muted-foreground">“Which employees have HIPAA expiring this month?”</p>}
    />
  );
}