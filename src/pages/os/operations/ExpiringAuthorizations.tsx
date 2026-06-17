import { ShieldAlert } from "lucide-react";
import OpsRecordsWorkspace from "./OpsRecordsWorkspace";
import { OPS_STORE_KEYS } from "@/lib/os/operations/recordsStore";

export default function ExpiringAuthorizations() {
  const today = new Date();
  const daysOut = (d: string) => {
    if (!d) return Infinity;
    const diff = (new Date(d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff;
  };
  return (
    <OpsRecordsWorkspace
      storeKey={OPS_STORE_KEYS.expiringAuths}
      eyebrow="Authorizations"
      title="Expiring Authorizations"
      description="Authorizations expiring in the next 14 / 30 / 60 / 90 days. Renew before service interruption."
      icon={ShieldAlert}
      primaryActionLabel="Start Renewal"
      filterField="state"
      statusField="status"
      statusOptions={[
        { value: "Pending Renewal", tone: "amber" },
        { value: "Submitted", tone: "blue" },
        { value: "Renewed", tone: "green" },
        { value: "Denied", tone: "rose" },
      ]}
      buckets={[
        { label: "≤ 14 days", predicate: (r) => daysOut(r.expiresOn) <= 14 && daysOut(r.expiresOn) >= 0 },
        { label: "≤ 30 days", predicate: (r) => daysOut(r.expiresOn) <= 30 && daysOut(r.expiresOn) > 14 },
        { label: "≤ 60 days", predicate: (r) => daysOut(r.expiresOn) <= 60 && daysOut(r.expiresOn) > 30 },
        { label: "≤ 90 days", predicate: (r) => daysOut(r.expiresOn) <= 90 && daysOut(r.expiresOn) > 60 },
      ]}
      fields={[
        { key: "client", label: "Client", required: true, placeholder: "Family / client name" },
        { key: "payer", label: "Payer", required: true, placeholder: "e.g. BCBS NC" },
        { key: "state", label: "State", type: "select", options: ["GA", "NC", "TN", "VA", "MD", "FL", "TX"] },
        { key: "expiresOn", label: "Expires on", type: "date", required: true },
        { key: "owner", label: "Owner", placeholder: "Assigned to" },
        { key: "status", label: "Status", type: "select", options: ["Pending Renewal", "Submitted", "Renewed", "Denied"] },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "client", label: "Client" },
        { key: "payer", label: "Payer" },
        { key: "state", label: "State" },
        { key: "expiresOn", label: "Expires" },
        { key: "owner", label: "Owner" },
        { key: "status", label: "Status" },
      ]}
      rowActions={(r, { update, remove }) => (
        <>
          <button onClick={() => update(r.id, { status: "Submitted" })} className="text-xs text-blue-600 hover:underline">Mark Submitted</button>
          <button onClick={() => update(r.id, { status: "Renewed" })} className="text-xs text-emerald-600 hover:underline">Renewed</button>
          <button onClick={() => remove(r.id)} className="text-xs text-muted-foreground hover:text-rose-600">Delete</button>
        </>
      )}
    />
  );
}