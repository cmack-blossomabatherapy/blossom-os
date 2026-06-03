import type { Database } from "@/integrations/supabase/types";

export type ReferralCompany = Database["public"]["Tables"]["referral_companies"]["Row"];
export type ReferralContact = Database["public"]["Tables"]["referral_contacts"]["Row"];
export type ReferralActivity = Database["public"]["Tables"]["referral_activities"]["Row"];
export type ReferralImportBatch = Database["public"]["Tables"]["referral_import_batches"]["Row"];

export const COMPANY_TYPES = [
  "Medical Practice",
  "Pediatric Office",
  "Therapy Practice",
  "School",
  "Social Services",
  "Case Management",
  "Autism Organization",
  "Community Organization",
  "Hospital / Health System",
  "Diagnostic Provider",
  "Other",
] as const;

export const COMPANY_STATUSES = ["Active", "Inactive", "Needs Review", "Duplicate", "Archived"] as const;

export const COMPANY_STAGES = [
  "New",
  "Active",
  "Warm",
  "Strong Partner",
  "Needs Follow-Up",
  "Dormant",
  "Do Not Contact",
] as const;

export const CONTACT_ROLE_TYPES = [
  "Doctor",
  "Pediatrician",
  "Social Worker",
  "Case Worker",
  "Educator",
  "School Administrator",
  "Therapist",
  "BCBA",
  "Office Manager",
  "Community Partner",
  "Referral Coordinator",
  "Other Professional",
] as const;

export const CONTACT_STATUSES = [
  "Active",
  "Needs Follow-Up",
  "New",
  "Connected",
  "Unresponsive",
  "Do Not Contact",
  "Duplicate",
  "Archived",
] as const;

export const CONTACT_STAGES = [
  "New Contact",
  "First Outreach",
  "Connected",
  "Active Referral Source",
  "Strong Partner",
  "Dormant",
  "Needs Follow-Up",
] as const;

export const PREFERRED_CONTACT_METHODS = ["Email", "Phone", "Text", "In-Person", "Unknown"] as const;

export const ACTIVITY_TYPES = [
  "Call",
  "Email",
  "Meeting",
  "Visit",
  "Event",
  "Referral Received",
  "Follow-Up",
  "Note",
  "Task",
  "Other",
] as const;

export const ACTIVITY_OUTCOMES = [
  "Connected",
  "Left Message",
  "Sent Email",
  "Meeting Booked",
  "Referral Sent",
  "Needs Follow-Up",
  "No Response",
  "Not Interested",
  "Other",
] as const;

export type CompanyWithCounts = ReferralCompany & { contact_count: number };
export type ContactWithCompany = ReferralContact & { company: ReferralCompany | null };