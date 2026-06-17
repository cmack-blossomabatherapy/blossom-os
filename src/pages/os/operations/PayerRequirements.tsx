import { ScrollText } from "lucide-react";
import OpsRecordsWorkspace from "./OpsRecordsWorkspace";
import { OPS_STORE_KEYS } from "@/lib/os/operations/recordsStore";

export default function PayerRequirements() {
  return (
    <OpsRecordsWorkspace
      storeKey={OPS_STORE_KEYS.payerRequirements}
      eyebrow="Authorizations"
      title="Payer Requirements"
      description="Per-payer documentation, auth, and submission requirements for every state Blossom serves."
      icon={ScrollText}
      primaryActionLabel="Add Payer"
      filterField="state"
      fields={[
        { key: "payer", label: "Payer", required: true },
        { key: "state", label: "State", type: "select", options: ["GA", "NC", "TN", "VA", "MD", "FL", "TX"] },
        { key: "authRequirements", label: "Auth requirements", type: "textarea" },
        { key: "docRequirements", label: "Document requirements", type: "textarea" },
        { key: "reassessmentRules", label: "Reassessment rules", type: "textarea" },
        { key: "contact", label: "Payer contact", placeholder: "Phone / email" },
      ]}
      columns={[
        { key: "payer", label: "Payer" },
        { key: "state", label: "State" },
        { key: "authRequirements", label: "Auth Req." },
        { key: "docRequirements", label: "Doc Req." },
        { key: "contact", label: "Contact" },
      ]}
    />
  );
}