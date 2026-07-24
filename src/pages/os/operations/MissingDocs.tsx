import { FileWarning, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import OpsRecordsWorkspace from "./OpsRecordsWorkspace";
import { OPS_STORE_KEYS } from "@/lib/os/operations/recordsStore";
import type { OpsRecord } from "@/lib/os/operations/recordsStore";

type UrgencyBucket = "past_due" | "due_today" | "due_this_week" | "later" | "no_date" | "completed";

function urgencyOf(row: OpsRecord): UrgencyBucket {
  const status = String(row.status ?? "").toLowerCase();
  if (status === "received" || status === "waived" || status === "not applicable") return "completed";
  const due = row.due_date ? new Date(String(row.due_date)) : null;
  if (!due || Number.isNaN(due.getTime())) return "no_date";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(due); d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return "past_due";
  if (diffDays === 0) return "due_today";
  if (diffDays <= 7) return "due_this_week";
  return "later";
}

const URGENCY_LABEL: Record<UrgencyBucket, string> = {
  past_due: "Past due",
  due_today: "Due today",
  due_this_week: "Due this week",
  later: "Later",
  no_date: "No due date",
  completed: "Received",
};

const URGENCY_STYLE: Record<UrgencyBucket, string> = {
  past_due: "bg-rose-50 text-rose-700 border-rose-200",
  due_today: "bg-amber-50 text-amber-700 border-amber-200",
  due_this_week: "bg-yellow-50 text-yellow-700 border-yellow-200",
  later: "bg-slate-50 text-slate-700 border-slate-200",
  no_date: "bg-slate-50 text-slate-500 border-slate-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

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
        {
          key: "due_date",
          label: "Due",
          render: (r) => {
            const bucket = urgencyOf(r);
            const due = r.due_date ? String(r.due_date) : null;
            return (
              <div className="flex items-center gap-2">
                <span className="text-foreground/85">{due || "—"}</span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${URGENCY_STYLE[bucket]}`}>
                  {URGENCY_LABEL[bucket]}
                </span>
              </div>
            );
          },
        },
        { key: "status", label: "Status" },
      ]}
      buckets={[
        { label: "Past due", predicate: (r) => urgencyOf(r) === "past_due" },
        { label: "Due today", predicate: (r) => urgencyOf(r) === "due_today" },
        { label: "Due this week", predicate: (r) => urgencyOf(r) === "due_this_week" },
        { label: "No due date", predicate: (r) => urgencyOf(r) === "no_date" },
      ]}
      rowActions={(r, { update, remove }) => (
        <>
          {r.authorization_id ? (
            <Link
              // `authorization_id` is the overlay record id. We pass both
              // `overlayId` (preferred) and `authId` (legacy). OSAuthorizations
              // resolves either to the correct visible auth id.
              to={`/authorizations?authId=${encodeURIComponent(String(r.authorization_id))}&overlayId=${encodeURIComponent(String(r.authorization_id))}`}
              className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
              title="Open the linked authorization record"
            >
              <ExternalLink className="h-3 w-3" /> Open Auth
            </Link>
          ) : null}
          <button
            onClick={async () => {
              try {
                await Promise.resolve(update(r.id, { status: "Received" }));
                toast.success("Marked as received");
              } catch {
                toast.error("Couldn't update status — please try again.");
              }
            }}
            className="text-xs text-emerald-600 hover:underline"
          >
            Received
          </button>
          <button
            onClick={async () => {
              try {
                await Promise.resolve(update(r.id, { status: "Waived" }));
                toast.success("Requirement waived");
              } catch {
                toast.error("Couldn't update status — please try again.");
              }
            }}
            className="text-xs text-slate-600 hover:underline"
          >
            Waive
          </button>
          <button
            onClick={async () => {
              try {
                await Promise.resolve(remove(r.id));
                toast.success("Removed");
              } catch {
                toast.error("Couldn't remove — please try again.");
              }
            }}
            className="text-xs text-muted-foreground hover:text-rose-600"
          >
            Delete
          </button>
        </>
      )}
    />
  );
}