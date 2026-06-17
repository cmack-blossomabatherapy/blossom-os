import { Users } from "lucide-react";
import OpsRecordsWorkspace from "./OpsRecordsWorkspace";
import { OPS_STORE_KEYS } from "@/lib/os/operations/recordsStore";

export default function RbtMatchQueue() {
  return (
    <OpsRecordsWorkspace
      storeKey={OPS_STORE_KEYS.rbtMatchQueue}
      eyebrow="Staffing"
      title="RBT Match Queue"
      description="Open cases ready for staffing match — by state, hours needed, language, and family preferences."
      icon={Users}
      primaryActionLabel="Propose Match"
      filterField="state"
      statusField="status"
      statusOptions={[
        { value: "Awaiting Match", tone: "amber" },
        { value: "Match Proposed", tone: "blue" },
        { value: "Accepted", tone: "green" },
        { value: "Rejected", tone: "rose" },
      ]}
      fields={[
        { key: "client", label: "Client / Family", required: true },
        { key: "state", label: "State", type: "select", options: ["GA", "NC", "TN", "VA", "MD", "FL", "TX"] },
        { key: "hoursNeeded", label: "Hours needed", placeholder: "e.g. 15/wk" },
        { key: "location", label: "Location" },
        { key: "preferences", label: "Language / preferences", placeholder: "e.g. Spanish-speaking" },
        { key: "schedule", label: "Schedule needs", placeholder: "e.g. M/W/F 3-6pm" },
        { key: "suggestedRbt", label: "Suggested RBT" },
        { key: "status", label: "Status", type: "select", options: ["Awaiting Match", "Match Proposed", "Accepted", "Rejected"] },
      ]}
      columns={[
        { key: "client", label: "Client" },
        { key: "state", label: "State" },
        { key: "hoursNeeded", label: "Hours" },
        { key: "preferences", label: "Preferences" },
        { key: "suggestedRbt", label: "Suggested RBT" },
        { key: "status", label: "Status" },
      ]}
      rowActions={(r, { update, remove }) => (
        <>
          <button onClick={() => update(r.id, { status: "Match Proposed" })} className="text-xs text-blue-600 hover:underline">Propose</button>
          <button onClick={() => update(r.id, { status: "Accepted" })} className="text-xs text-emerald-600 hover:underline">Accept</button>
          <button onClick={() => update(r.id, { status: "Rejected" })} className="text-xs text-rose-600 hover:underline">Reject</button>
          <button onClick={() => remove(r.id)} className="text-xs text-muted-foreground hover:text-rose-600">Delete</button>
        </>
      )}
    />
  );
}