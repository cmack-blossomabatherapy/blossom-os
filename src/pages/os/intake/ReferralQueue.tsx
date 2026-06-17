import { ClipboardList, Plus } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";

export default function ReferralQueue() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Referral Queue"
      description="New referrals awaiting first contact, ownership, and intake intake action."
      actions={[
        { label: "Claim referral", icon: Plus, variant: "default" },
        { label: "Assign intake owner", icon: ClipboardList },
      ]}
    >
      <ReadyForDataNotice message="This workspace is ready for live data. The referral queue will populate as intake activity comes in. Meanwhile, use the Marketing Referral CRM and Intake workspace to manage incoming referrals." />
    </GrowthPageShell>
  );
}