import { Sparkles, Heart, Compass, Users, GraduationCap, BookOpen, ShieldCheck, ClipboardCheck, Award, type LucideIcon } from "lucide-react";

export type OnboardingStepId =
  | "welcome"
  | "mission"
  | "values"
  | "team"
  | "how-it-works"
  | "required-role"
  | "required-systems"
  | "policies"
  | "final-check"
  | "complete";

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  blurb: string;
  icon: LucideIcon;
  estMinutes: number;
  path: string;
  requirement: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: "welcome", title: "Welcome to Blossom", blurb: "Meet the company and what to expect.", icon: Sparkles, estMinutes: 5, path: "/onboarding/welcome", requirement: "Read the welcome and start your journey." },
  { id: "team", title: "Meet the Team", blurb: "The humans behind Blossom — leadership, departments, and who supports you.", icon: Users, estMinutes: 8, path: "/onboarding/team", requirement: "Explore the team directory." },
  { id: "mission", title: "Our Mission & Vision", blurb: "Why we exist and where we're going.", icon: Heart, estMinutes: 5, path: "/onboarding/mission", requirement: "Acknowledge our mission and vision." },
  { id: "values", title: "Our Core Values", blurb: "The four values that guide every decision.", icon: Compass, estMinutes: 8, path: "/onboarding/values", requirement: "Acknowledge each of the four core values." },
  { id: "how-it-works", title: "How Blossom Academy Works", blurb: "How learning, training, and growth fit together.", icon: GraduationCap, estMinutes: 5, path: "/onboarding/how-it-works", requirement: "Read the academy overview." },
  { id: "required-role", title: "Required Role Training", blurb: "The core training for your role.", icon: BookOpen, estMinutes: 60, path: "/onboarding/required-role", requirement: "Complete required role courses." },
  { id: "required-systems", title: "Required Systems Training", blurb: "Tools and platforms you'll use daily.", icon: BookOpen, estMinutes: 30, path: "/onboarding/required-systems", requirement: "Complete required systems courses." },
  { id: "policies", title: "Policies & Acknowledgements", blurb: "HIPAA, code of conduct, handbook.", icon: ShieldCheck, estMinutes: 15, path: "/onboarding/policies", requirement: "Acknowledge required policies." },
  { id: "final-check", title: "Final Knowledge Check", blurb: "A short quiz to confirm readiness.", icon: ClipboardCheck, estMinutes: 10, path: "/onboarding/final-check", requirement: "Pass the final knowledge check." },
  { id: "complete", title: "Onboarding Complete", blurb: "Receive your certificate and unlock the academy.", icon: Award, estMinutes: 2, path: "/onboarding/complete", requirement: "Claim your completion certificate." },
];

export const ONBOARDING_TOTAL_MINUTES = ONBOARDING_STEPS.reduce((s, x) => s + x.estMinutes, 0);