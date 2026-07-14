import {
  GraduationCap, Building2, Megaphone, TrendingUp, Briefcase, ShieldCheck,
  Calendar, Users, HeartHandshake, IdCard, ClipboardCheck, UserCheck,
  FileSignature, BookOpen, Brain, Compass, DollarSign, Sparkles, Settings2, Home,
  type LucideIcon,
} from "lucide-react";

export interface TrainingPath {
  slug: string;
  title: string;
  audience: string;
  category: "Role" | "Department" | "Foundations";
  description: string;
  estimatedHours: number;
  lessonCount: number;
  icon: LucideIcon;
}

/**
 * Role-based training paths surfaced inside the Training Academy.
 * Content for each path is still being authored — every path links to a
 * shared stub detail page that explains what will land there.
 */
export const TRAINING_PATHS: TrainingPath[] = [
  { slug: "blossom-os-basics",        title: "Blossom OS Basics",          audience: "Everyone",            category: "Foundations", description: "How Blossom OS works, where things live, and how to move through your daily workflows.", estimatedHours: 1,  lessonCount: 6, icon: Compass },
  { slug: "rbt",                      title: "RBT Training Academy",       audience: "RBT",                 category: "Role",        description: "Experience-based onboarding for every RBT, from welcome through career growth.",      estimatedHours: 12, lessonCount: 24, icon: GraduationCap },
  { slug: "bcba",                     title: "BCBA Training",              audience: "BCBA",                category: "Role",        description: "Clinical workflows, supervision, treatment planning, and Blossom expectations.",      estimatedHours: 8,  lessonCount: 18, icon: Brain },
  { slug: "case-manager",             title: "Case Manager Training",      audience: "Case Manager",        category: "Role",        description: "Family communication, scheduling coordination, and evaluation follow-through.",         estimatedHours: 6,  lessonCount: 14, icon: HeartHandshake },
  { slug: "behavioral-support",       title: "Behavioral Support Training", audience: "Behavioral Support", category: "Role",        description: "Support workflows, escalation handling, and clinical alignment.",                      estimatedHours: 4,  lessonCount: 10, icon: HeartHandshake },
  { slug: "clinical-director",        title: "Clinical Director Training", audience: "Clinical Director",   category: "Role",        description: "Clinical oversight, BCBA performance, and quality systems for clinical leadership.",    estimatedHours: 6,  lessonCount: 12, icon: Brain },
  { slug: "state-director",           title: "State Director Training",    audience: "State Director",      category: "Role",        description: "Running a Blossom state — leadership rhythms, command center, and team accountability.", estimatedHours: 10, lessonCount: 22, icon: Building2 },
  { slug: "intake",                   title: "Intake Training",            audience: "Intake Team",         category: "Department",  description: "Lead capture, first contact, intake packets, packet follow up / missing info, benefits verification, and the full handoff to clinical.", estimatedHours: 10, lessonCount: 22, icon: ClipboardCheck },
  { slug: "marketing",                title: "Marketing Training",         audience: "Marketing Team",      category: "Department",  description: "Campaigns, lead sources, brand standards, and growth reporting.",                       estimatedHours: 4,  lessonCount: 10, icon: Megaphone },
  { slug: "business-development",     title: "Business Development Training", audience: "Business Development", category: "Department", description: "Outreach, partnerships, referral relationships, and pipeline management.",         estimatedHours: 4,  lessonCount: 10, icon: TrendingUp },
  { slug: "recruiting",               title: "Recruiting Training",        audience: "Recruiting Team",     category: "Department",  description: "Sourcing, interviews, offers, and onboarding hand-off to HR.",                          estimatedHours: 5,  lessonCount: 12, icon: Briefcase },
  { slug: "authorizations",           title: "Authorizations Training",    audience: "Authorizations Team", category: "Department",  description: "Current-state 4-week onboarding: readiness, initial/treatment/renewal auths, pending follow-up, approvals, denials, and cross-department handoffs.", estimatedHours: 20, lessonCount: 80, icon: ShieldCheck },
  { slug: "scheduling",               title: "Scheduling Team Onboarding", audience: "Scheduling Team",     category: "Department",  description: "Current-state 4-week onboarding: readiness, assessment/new-client/therapist scheduling, CentralReach sync, coverage, conflicts, and cross-department handoffs.", estimatedHours: 20, lessonCount: 80, icon: Calendar },
  { slug: "staffing",                 title: "Staffing Team Onboarding",   audience: "Staffing Team",       category: "Department",  description: "Current-state 4-week onboarding: open case review, RBT/BT availability, case matching, pairing, coverage/open hours, follow-up, and cross-department handoffs to Scheduling / Recruiting / State Ops.", estimatedHours: 20, lessonCount: 80, icon: Users },
  { slug: "hr",                       title: "HR Team Onboarding",         audience: "HR / People Operations Team", category: "Department", description: "Current-state 4-week onboarding: HR role boundaries, employee lifecycle, current systems (records / Outlook / Viventium awareness / trackers), hiring handoff from Recruiting, onboarding logistics, background checks, orientation/training visibility, benefits basics, employee records, reviews, corrective action, offboarding, and cross-department handoffs.", estimatedHours: 20, lessonCount: 80, icon: HeartHandshake },
  { slug: "credentialing",            title: "Credentialing Team Onboarding", audience: "Credentialing Team", category: "Department", description: "Current-state 4-week onboarding: role boundaries, current systems (trackers / payer portals / Outlook / TMS-billing / CentralReach awareness), provider/BCBA credentialing basics, payer enrollment/status, missing-info follow-up, billing/RCM impact, authorizations impact, HR/Clinical handoffs, state/payer variation, maintenance/renewals, and escalations.", estimatedHours: 20, lessonCount: 80, icon: IdCard },
  { slug: "qa",                       title: "QA Team Onboarding",         audience: "QA Team",             category: "Department",  description: "Current-state 4-week onboarding: role boundaries, current systems (CentralReach, QA trackers, NoteGuard/Amerigroup awareness, Outlook/Teams), documentation standards, treatment plan and clinical report QA, missing-item follow-up, corrections, external document chase, compliance reviews, audits, new RBT check-ins, escalation, and trend reporting.", estimatedHours: 20, lessonCount: 80, icon: ClipboardCheck },
  { slug: "finance",                  title: "Finance & Billing Training", audience: "Finance / Billing / Payroll", category: "Department", description: "Blank canvas — finance, billing, payroll, and RCM workflows will land here.",         estimatedHours: 0,  lessonCount: 0, icon: DollarSign },
  { slug: "operations",               title: "Operations Training",        audience: "Operations Leadership", category: "Department", description: "Blank canvas — operations rhythms, oversight, and cross-department workflows will land here.", estimatedHours: 0,  lessonCount: 0, icon: TrendingUp },
  { slug: "executive",                title: "Executive Training",         audience: "Executive Leadership",  category: "Department", description: "Blank canvas — executive rhythms, KPI reviews, and strategic workflows will land here.",     estimatedHours: 0,  lessonCount: 0, icon: Sparkles },
  { slug: "systems",                  title: "Systems Admin Training",     audience: "Systems / Super Admin", category: "Department", description: "Blank canvas — Blossom OS administration, permissions, and configuration will land here.",   estimatedHours: 0,  lessonCount: 0, icon: Settings2 },
  { slug: "clinic-operations",        title: "Clinic Operations Training", audience: "Clinic / Office Manager", category: "Department", description: "Blank canvas — clinic-level operations, front-desk, and supply workflows will land here.",   estimatedHours: 0,  lessonCount: 0, icon: Home },
];

/** RBT experience-level buckets surfaced on the RBT Training Academy landing. */
export interface RbtBucket {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const RBT_BUCKETS: RbtBucket[] = [
  { slug: "welcome-to-blossom",                 title: "Welcome to Blossom",                  description: "First-week welcome, expectations, and how Blossom supports every RBT.",         icon: GraduationCap },
  { slug: "not-certified",                      title: "Not Certified",                       description: "Path to certification with structured learning and supervision support.",        icon: BookOpen },
  { slug: "certified-no-experience",            title: "Certified With No Experience",        description: "Confidence building, session basics, and operational onboarding.",              icon: UserCheck },
  { slug: "certified-under-2-years",            title: "Certified With Under 2 Years",        description: "Advanced session practice, documentation depth, and growth planning.",          icon: TrendingUp },
  { slug: "certified-2-plus-years",             title: "Certified With 2+ Years Experience", description: "Leadership readiness, mentorship, and career path acceleration.",                icon: Brain },
  { slug: "professionalism-and-expectations",   title: "Professionalism and Expectations",    description: "How we show up — communication, dress, punctuality, and family experience.",    icon: Compass },
  { slug: "session-readiness",                  title: "Session Readiness",                   description: "Pre-session prep, materials, transitions, and handoff routines.",               icon: ClipboardCheck },
  { slug: "documentation-basics",               title: "Documentation Basics",                description: "Session notes, data collection, and timely submission expectations.",            icon: FileSignature },
  { slug: "supervision-and-feedback",           title: "Supervision and Feedback",            description: "Working with BCBAs, receiving feedback, and translating it into practice.",      icon: Users },
  { slug: "nonbillable-points-and-growth",      title: "Nonbillable Points and Growth",       description: "How nonbillable time supports your development and career path.",                icon: TrendingUp },
  { slug: "retention-and-career-path",          title: "Retention and Career Path",           description: "Long-term growth, advancement opportunities, and staying with Blossom.",         icon: HeartHandshake },
];

export const getTrainingPath = (slug: string) =>
  TRAINING_PATHS.find((p) => p.slug === slug);