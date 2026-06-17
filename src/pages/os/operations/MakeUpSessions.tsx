import { CalendarPlus } from "lucide-react";
import OpsRecordsWorkspace from "./OpsRecordsWorkspace";
import { OPS_STORE_KEYS } from "@/lib/os/operations/recordsStore";

export default function MakeUpSessions() {
  return (
    <OpsRecordsWorkspace
      storeKey={OPS_STORE_KEYS.makeUpSessions}
      eyebrow="Scheduling"
      title="Make-Up Sessions"
      description="Approved make-up session requests, tracked through scheduling and confirmation."
      icon={CalendarPlus}
      primaryActionLabel="New Make-Up"
      filterField="status"
      statusField="status"
      statusOptions={[
        { value: "Requested", tone: "amber" },
        { value: "Confirmed", tone: "blue" },
        { value: "Completed", tone: "green" },
        { value: "Cancelled", tone: "rose" },
      ]}
      fields={[
        { key: "client", label: "Client / Family", required: true },
        { key: "missedDate", label: "Missed date", type: "date", required: true },
        { key: "reason", label: "Reason", placeholder: "Cancel / no-show / illness…" },
        { key: "makeUpDate", label: "Make-up date", type: "date" },
        { key: "provider", label: "Assigned RBT / BCBA" },
        { key: "status", label: "Status", type: "select", options: ["Requested", "Confirmed", "Completed", "Cancelled"] },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "client", label: "Client" },
        { key: "missedDate", label: "Missed" },
        { key: "makeUpDate", label: "Make-up" },
        { key: "provider", label: "Provider" },
        { key: "status", label: "Status" },
      ]}
      rowActions={(r, { update, remove }) => (
        <>
          <button onClick={() => update(r.id, { status: "Confirmed" })} className="text-xs text-blue-600 hover:underline">Confirm</button>
          <button onClick={() => update(r.id, { status: "Completed" })} className="text-xs text-emerald-600 hover:underline">Complete</button>
          <button onClick={() => remove(r.id)} className="text-xs text-muted-foreground hover:text-rose-600">Delete</button>
        </>
      )}
    />
  );
}