import { ScrollText } from "lucide-react";
import OpsRecordsWorkspace from "./OpsRecordsWorkspace";
import { OPS_STORE_KEYS } from "@/lib/os/operations/recordsStore";

/**
 * Payer Requirements — now backed by the `payer_requirements` Supabase table
 * (replaces localStorage MVP).
 */
export default function PayerRequirements() {
  return (
    <OpsRecordsWorkspace
      storeKey={OPS_STORE_KEYS.payerRequirements}
      supabaseTable="payer_requirements"
      writableFields={[
        "payer", "state",
        "auth_requirements", "document_requirements", "reassessment_rules",
        "parent_signature_rules", "submission_portal",
        "payer_contact", "phone", "email", "notes", "active",
      ]}
      eyebrow="Authorizations"
      title="Payer Requirements"
      description="Per-payer documentation, authorization, and submission requirements for every state Blossom serves. Shared across the Authorizations team."
      icon={ScrollText}
      primaryActionLabel="Add Payer"
      filterField="state"
      fields={[
        { key: "payer", label: "Payer", required: true },
        { key: "state", label: "State", type: "select", options: ["GA", "NC", "TN", "VA", "MD", "NJ"] },
        { key: "auth_requirements", label: "Auth requirements", type: "textarea" },
        { key: "document_requirements", label: "Document requirements", type: "textarea" },
        { key: "reassessment_rules", label: "Reassessment rules", type: "textarea" },
        { key: "parent_signature_rules", label: "Parent signature rules", type: "textarea" },
        { key: "submission_portal", label: "Submission portal", placeholder: "URL or portal name" },
        { key: "payer_contact", label: "Payer contact name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "payer", label: "Payer" },
        { key: "state", label: "State" },
        { key: "auth_requirements", label: "Auth Req." },
        { key: "document_requirements", label: "Doc Req." },
        { key: "payer_contact", label: "Contact" },
        { key: "phone", label: "Phone" },
      ]}
    />
  );
}