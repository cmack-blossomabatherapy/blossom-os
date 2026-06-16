import { Link } from "react-router-dom";
import {
  BookMarked, ChevronRight, Heart, Users as UsersIcon, Mail,
} from "lucide-react";
import type { LearnerHome } from "@/lib/academy/learnerHome";

const HR_EMAIL = "HR@blossomabatherapy.com";
const HR_MAILTO = (subject: string) =>
  `mailto:${HR_EMAIL}?subject=${encodeURIComponent(subject)}`;

interface NeedHelpPanelProps {
  learnerHome: LearnerHome;
  learnerName?: string;
}

/**
 * Shared "Need help?" panel used by the Training Academy learner pages.
 *
 * - Ask my mentor uses the assigned mentor's email when present (mailto),
 *   falls back to a calm, non-dead routing target.
 * - HR partner uses a real mailto, not a hardcoded /messages destination.
 */
export function NeedHelpPanel({ learnerHome, learnerName }: NeedHelpPanelProps) {
  const mentor = learnerHome.mentor;
  const mentorName = mentor
    ? [mentor.first_name, mentor.last_name].filter(Boolean).join(" ").trim()
    : "";
  const subjectName = (learnerName ?? "").trim();
  const mentorMailtoSubject = encodeURIComponent(
    subjectName ? `Training question from ${subjectName}` : "Training question",
  );
  const hrMailto = `mailto:${HR_EMAIL}?subject=${encodeURIComponent("Training support")}`;

  type Item = {
    label: string;
    icon: typeof UsersIcon;
    href?: string;
    to?: string;
    hint?: string;
    external?: boolean;
  };

  const mentorItem: Item = (() => {
    if (mentor?.email) {
      return {
        label: "Ask my mentor",
        icon: UsersIcon,
        href: `mailto:${mentor.email}?subject=${mentorMailtoSubject}`,
        external: true,
        hint: mentorName || mentor.email,
      };
    }
    if (mentor) {
      return {
        label: "Ask my mentor",
        icon: UsersIcon,
        href: HR_MAILTO("Mentor email missing"),
        external: true,
        hint: "Mentor email missing - HR can update it",
      };
    }
    return {
      label: "Mentor not assigned yet",
      icon: UsersIcon,
      href: HR_MAILTO("Mentor assignment needed"),
      external: true,
      hint: "HR can assign your mentor",
    };
  })();

  const items: Item[] = [
    mentorItem,
    {
      label: "HR partner",
      icon: Heart,
      href: hrMailto,
      external: true,
      hint: HR_EMAIL,
    },
    { label: "Resource Library", icon: BookMarked, to: "/resource-library" },
  ];

  return (
    <div data-testid="sd-need-help" className="rounded-2xl border border-border/70 bg-card p-5">
      <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">Need help?</h3>
      <p className="mt-1 text-[11.5px] text-muted-foreground">Nothing here has to be solved alone.</p>
      <div className="mt-3 space-y-1 text-[12.5px]">
        {items.map(({ label, icon: Icon, href, to, hint, external }) => {
          const content = (
            <>
              <span className="inline-flex min-w-0 items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate text-foreground">{label}</span>
                  {hint && (
                    <span className="block truncate text-[10.5px] text-muted-foreground">{hint}</span>
                  )}
                </span>
              </span>
              {external ? (
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </>
          );
          if (href) {
            return (
              <a
                key={label}
                href={href}
                data-testid={label.includes("mentor") ? "sd-need-help-mentor" : label.includes("HR") ? "sd-need-help-hr" : undefined}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
              >
                {content}
              </a>
            );
          }
          return (
            <Link
              key={label}
              to={to!}
              data-testid={label.toLowerCase().includes("mentor") ? "sd-need-help-mentor" : undefined}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
