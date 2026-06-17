import { FileWarning } from "lucide-react";
import OpsRecordsWorkspace from "./OpsRecordsWorkspace";
import { OPS_STORE_KEYS } from "@/lib/os/operations/recordsStore";

export default function MissingDocs() {
  return (
    <OpsRecordsWorkspace
      storeKey={OPS_STORE_KEYS.missingDocs}
      eyebrow="Authorizations"
      title="Missing Documents"
      description="Cases blocked on missing payer documentation, with owner, due date, and next action."
      icon={FileWarning}
      primaryActionLabel="Request Document"
      filterField="status"
      statusField="status"
      statusOptions={[
        { value: "Requested", tone: "amber" },
        { value: "Received", tone: "green" },
        { value: "Snoozed", tone: "slate" },
        { value: "Escalated", tone: "rose" },
      ]}
      fields={[
        { key: "client", label: "Client / Family", required: true },
        { key: "docType", label: "Document type", required: true, placeholder: "e.g. Diagnostic Report" },
        { key: "owner", label: "Owner" },
        { key: "dueDate", label: "Due date", type: "date" },
        { key: "status", label: "Status", type: "select", options: ["Requested", "Received", "Snoozed", "Escalated"] },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "client", label: "Client" },
        { key: "docType", label: "Document" },
        { key: "owner", label: "Owner" },
        { key: "dueDate", label: "Due" },
        { key: "status", label: "Status" },
      ]}
      rowActions={(r, { update, remove }) => (
        <>
          <button onClick={() => update(r.id, { status: "Received" })} className="text-xs text-emerald-600 hover:underline">Received</button>
          <button onClick={() => {
            const next = new Date(); next.setDate(next.getDate() + 3);
            update(r.id, { status: "Snoozed", dueDate: next.toISOString().slice(0, 10) });
          }} className="text-xs text-slate-600 hover:underline">Snooze 3d</button>
          <button onClick={() => remove(r.id)} className="text-xs text-muted-foreground hover:text-rose-600">Delete</button>
        </>
      )}
    />
  );
}