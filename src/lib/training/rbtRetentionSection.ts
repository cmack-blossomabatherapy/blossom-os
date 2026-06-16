// Curated "RBT Support & Retention" resource bundle.
// IDs reference seeded resources in rbtResources.ts; the section is rendered by
// <RBTRetentionSection /> wherever supportive guidance belongs.

export interface RetentionGroup {
  id: string;
  title: string;
  blurb: string;
  resourceIds: string[];
}

export const RBT_RETENTION_GROUPS: RetentionGroup[] = [
  {
    id: "earn-points",
    title: "How to earn points",
    blurb: "Points recognize the everyday things you already do. Here's how the system works and what counts.",
    resourceIds: ["lib-rt-5", "lib-rt-6", "lib-rt-1"],
  },
  {
    id: "non-billable",
    title: "How non-billable activities work",
    blurb: "When you're not in session, this is what counts and how to submit it. No guesswork.",
    resourceIds: ["lib-rt-7", "lib-rt-2", "lib-rt-8"],
  },
  {
    id: "payroll-schedule",
    title: "Payroll, mileage & scheduling — without the confusion",
    blurb: "Know the pay dates, send schedule changes the right way, and get reimbursed for miles.",
    resourceIds: ["lib-a-3", "lib-a-4", "lib-p-2", "lib-a-1"],
  },
];

// All retention IDs in one list — handy for filtering and quick lookups.
export const RBT_RETENTION_RESOURCE_IDS = RBT_RETENTION_GROUPS.flatMap((g) => g.resourceIds);

export const RBT_RETENTION_CONTACTS = [
  { label: "Lead RBT Trainer",  detail: "Day-to-day support, coaching, signoffs." },
  { label: "Scheduling team",   detail: "Schedule changes, coverage, time-off coordination." },
  { label: "Payroll & HR",      detail: "Paychecks, mileage, PTO, benefits." },
  { label: "Operational Insights",    detail: "Quick answers to policy and how-to questions, 24/7." },
];