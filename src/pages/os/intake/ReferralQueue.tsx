import { ClipboardList, Plus } from "lucide-react";
import { GrowthPageShell, ComingSoonNotice } from "@/components/os/growth/GrowthPageShell";

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
      <ComingSoonNotice message="The live referral queue will appear here once intake data is connected. Until then, use the Marketing Referral CRM and Intake workspace to manage incoming referrals." />
    </GrowthPageShell>
  );
}