import { Globe2 } from "lucide-react";
import OpsRecordsWorkspace from "../operations/OpsRecordsWorkspace";

export default function CommunityReferralsPage() {
  return (
    <OpsRecordsWorkspace
      storeKey={"blossom-os.case-manager.community-referrals.v1" as never}
      eyebrow="Case Manager · Community"
      title="Community Referrals"
      description="Curated autism resources, support organizations, and local programs to share with families."
      icon={Globe2}
      primaryActionLabel="Add Resource"
      filterField="category"
      fields={[
        { key: "name", label: "Resource name", required: true },
        { key: "category", label: "Category", type: "select", options: ["Autism Resource", "Local Program", "Parent Support", "Therapy Adjunct", "Crisis Support"] },
        { key: "state", label: "State", type: "select", options: ["GA", "NC", "TN", "VA", "MD", "FL", "TX", "National"] },
        { key: "county", label: "County / City" },
        { key: "website", label: "Website" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "category", label: "Category" },
        { key: "state", label: "State" },
        { key: "website", label: "Website" },
        { key: "phone", label: "Phone" },
      ]}
    />
  );
}