import { FileWarning } from "lucide-react";
import OpsRecordsWorkspace from "./OpsRecordsWorkspace";
import { OPS_STORE_KEYS } from "@/lib/os/operations/recordsStore";

/**
 * Missing Documents — now backed by the `authorization_requirements`
 * Supabase table (replaces localStorage MVP).
 */
export default function MissingDocs() {
  return (
    <OpsRecordsWorkspace
      storeKey={OPS_STORE_KEYS.missingDocs}
      supabaseTable="authorization_requirements"
      writableFields={[
        "client_name", "requirement_name", "requirement_type",
        "owner_department", "owner_user", "due_date", "status",
        "notes", "state", "payer",
      ]}
      eyebrow="Authorizations"
      title="Missing Documents"
      description="Cases blocked on missing payer documentation, with owner, due date, and next action. Backed by the authorization_requirements table."
      icon={FileWarning}
      primaryActionLabel="Request Document"
      filterField="status"
      statusField="status"
      statusOptions={[
        { value: "Needed", tone: "amber" },
        { value: "Requested", tone: "amber" },
        { value: "Received", tone: "green" },
        { value: "Waived", tone: "slate" },
        { value: "Not Applicable", tone: "slate" },
      ]}
      fields={[
        { key: "client_name", label: "Client / Family", required: true },
        { key: "requirement_name", label: "Document / requirement", required: true, placeholder: "e.g. Diagnostic Report" },
        { key: "requirement_type", label: "Requirement type", placeholder: "e.g. Clinical, Payer, Parent" },
        { key: "payer", label: "Payer" },
        { key: "state", label: "State", type: "select", options: ["GA", "NC", "TN", "VA", "MD", "NJ"] },
        { key: "owner_department", label: "Owner department", placeholder: "Authorizations, BCBA, Intake…" },
        { key: "owner_user", label: "Owner" },
        { key: "due_date", label: "Due date", type: "date" },
        { key: "status", label: "Status", type: "select", options: ["Needed", "Requested", "Received", "Waived", "Not Applicable"] },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "client_name", label: "Client" },
        { key: "requirement_name", label: "Document" },
        { key: "payer", label: "Payer" },
        { key: "owner_user", label: "Owner" },
        { key: "due_date", label: "Due" },
        { key: "status", label: "Status" },
      ]}
      rowActions={(r, { update, remove }) => (
        <>
          <button onClick={() => update(r.id, { status: "Received" })} className="text-xs text-emerald-600 hover:underline">Received</button>
          <button onClick={() => update(r.id, { status: "Waived" })} className="text-xs text-slate-600 hover:underline">Waive</button>
          <button onClick={() => remove(r.id)} className="text-xs text-muted-foreground hover:text-rose-600">Delete</button>
        </>
      )}
    />
  );
}