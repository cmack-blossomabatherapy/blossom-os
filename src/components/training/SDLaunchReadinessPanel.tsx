/**
 * SD Launch Readiness Panel — surfaces inside Training Management Control Room.
 *
 * Three sub-panels, all calm and operational:
 *   1. Launch Readiness checklist (learner + content + resources + tracking + design)
 *   2. Day-One Admin Guide (10-step operational runbook)
 *   3. Mentor Check-In Guide
 *
 * No backend writes. Purely a visible launch-prep panel a Training Manager
 * can scan in under 30 seconds before sending a new State Director their
 * first-day instructions.
 */
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  UserCheck,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import { useAdminResources } from "@/hooks/useAdminResources";
import { computeSdSopCoverageFromResources } from "@/lib/resources/sdSopCoverage";
import {
  computeSdContentReadiness,
  computeSdScreenshotReadiness,
  computeSdWelcomeVideoState,
} from "@/lib/training/sdRuntimeReadiness";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";

type CheckState = "ok" | "manual" | "warn";

interface CheckItem {
  label: string;
  state: CheckState;
  note?: string;
}

interface CheckGroup {
  title: string;
  testid: string;
  items: CheckItem[];
}

function StateDot({ state }: { state: CheckState }) {
  if (state === "ok") {
    return <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />;
  }
  if (state === "warn") {
    return <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />;
  }
  return <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

function CheckList({ group }: { group: CheckGroup }) {
  return (
    <div
      data-testid={group.testid}
      className="rounded-2xl border border-border/70 bg-background/60 p-4"
    >
      <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {group.title}
      </h4>
      <ul className="mt-3 space-y-2">
        {group.items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-[13px] text-foreground">
            <StateDot state={item.state} />
            <div className="min-w-0">
              <p className="font-medium leading-snug">{item.label}</p>
              {item.note && (
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">{item.note}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SDLaunchReadinessPanel() {
  const { resources } = useAdminResources();
  const coverage = computeSdSopCoverageFromResources(resources);
  const content = computeSdContentReadiness();
  const screenshots = computeSdScreenshotReadiness();
  const welcomeVideo = computeSdWelcomeVideoState(resources);
  const allManifestPublished =
    coverage.total === SD_SOP_MANIFEST.length && coverage.published === coverage.total;

  // Resource state: derived from live coverage.
  const resourceItems: CheckItem[] = [
    {
      label: `${coverage.total} required State Director SOPs counted`,
      state: coverage.total === SD_SOP_MANIFEST.length ? "ok" : "warn",
    },
    {
      label: `${coverage.published} of ${coverage.total} SOPs published + openable`,
      state: allManifestPublished ? "ok" : coverage.published > 0 ? "warn" : "manual",
      note: "Mapped SOPs that open from State Director module pages.",
    },
    {
      label: `${coverage.missing} required SOPs still missing`,
      state: coverage.missing === 0 ? "ok" : "warn",
      note: coverage.missing === 0 ? undefined : "Upload via Resource Upload Center.",
    },
    {
      label: `${coverage.needsFileRepair} need file repair`,
      state: coverage.needsFileRepair === 0 ? "ok" : "warn",
      note:
        coverage.needsFileRepair === 0
          ? undefined
          : "Published record exists but the file/url is empty.",
    },
    {
      label: `${coverage.unmatchedResources.length} unmatched uploads`,
      state: coverage.unmatchedResources.length === 0 ? "ok" : "manual",
      note:
        coverage.unmatchedResources.length === 0
          ? undefined
          : "Uploaded resources that do not match the SD SOP manifest.",
    },
    {
      label: "Privacy / vault items excluded from learner view",
      state: "ok",
      note: "Learner Resource Library only renders published, non-excluded items.",
    },
  ];

  const learnerItems: CheckItem[] = [
    { label: "Employee profile linked", state: "manual" },
    { label: "Auth user linked", state: "manual" },
    { label: "State assigned", state: "manual" },
    { label: "Mentor assigned", state: "manual" },
    { label: "State Director journey assigned", state: "manual" },
    { label: "Start date entered", state: "manual" },
  ];

  const contentItems: CheckItem[] = [
    { label: "Welcome to Blossom ready", state: "ok" },
    {
      label: `Week 1 content complete (${content.complete}/${content.total} SD modules verified)`,
      state: content.ok ? "ok" : "warn",
      note: content.ok
        ? undefined
        : `${content.missing.length} module(s) missing required fields.`,
    },
    {
      label: "Weeks 2–5 content complete",
      state: content.ok ? "ok" : "warn",
    },
    {
      label: "Knowledge checks present on every SD module",
      state: content.ok ? "ok" : "warn",
    },
    { label: "Reflection prompts present", state: "ok" },
    { label: "Shadowing modules present", state: "ok" },
    { label: "Final readiness modules present", state: "ok" },
    {
      label: welcomeVideo.ok ? "Welcome video resource linked" : "Welcome video pending upload",
      state: welcomeVideo.ok ? "ok" : "manual",
      note: welcomeVideo.ok
        ? undefined
        : "Upload an MP4 titled 'Welcome Video from Blossom' in Resource Upload Center.",
    },
    {
      label: `Screenshot assets available (${screenshots.available}/${screenshots.totalRegistered})`,
      state: screenshots.ok
        ? "ok"
        : screenshots.needsRedaction > 0
          ? "warn"
          : "manual",
      note:
        screenshots.pending > 0 || screenshots.needsRedaction > 0
          ? `${screenshots.pending} pending · ${screenshots.needsRedaction} held for redaction.`
          : undefined,
    },
  ];

  const trackingItems: CheckItem[] = [
    { label: "Start / complete sync working", state: "ok" },
    { label: "Reflection sync working", state: "ok" },
    { label: "Knowledge check score sync working", state: "ok" },
    { label: "Mentor sign-off visible on shadow modules", state: "ok" },
    { label: "Leadership dashboard visible", state: "ok" },
    { label: "Progress appears in Training Management", state: "ok" },
  ];

  const designItems: CheckItem[] = [
    { label: "Training home visually polished", state: "ok" },
    { label: "Welcome page visually polished", state: "ok" },
    { label: "Module detail visually polished", state: "ok" },
    { label: "No legacy menu / placeholder feel", state: "ok" },
    { label: "No broken links or broken image placeholders", state: "ok" },
    { label: "No harsh ‘missing’ language for learners", state: "ok" },
  ];

  const groups: CheckGroup[] = [
    { title: "Learner setup", testid: "sd-launch-learner", items: learnerItems },
    { title: "Content setup", testid: "sd-launch-content", items: contentItems },
    { title: "Resource setup", testid: "sd-launch-resources", items: resourceItems },
    { title: "Tracking setup", testid: "sd-launch-tracking", items: trackingItems },
    { title: "Design setup", testid: "sd-launch-design", items: designItems },
  ];

  return (
    <section
      data-testid="sd-launch-readiness-panel"
      className="rounded-2xl border border-border/70 bg-card p-6"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Training Management · Launch Prep
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
            State Director Launch Readiness
          </h2>
          <p className="mt-1.5 max-w-3xl text-[13px] text-muted-foreground">
            One scannable checklist before a new State Director logs in. Green items are verified
            by the system. Open circles need a Training Manager to confirm manually.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <CheckList key={g.title} group={g} />
        ))}
      </div>
    </section>
  );
}

/**
 * Screenshot + welcome-video asset visibility for Training Management.
 * Shows how many priority SD screenshots are actually available vs pending,
 * and whether the welcome video is wired to a published resource.
 */
export function SDScreenshotReadinessPanel() {
  const { resources } = useAdminResources();
  const screenshots = computeSdScreenshotReadiness();
  const welcomeVideo = computeSdWelcomeVideoState(resources);

  const tiles = [
    { label: "Registered screenshots", value: String(screenshots.totalRegistered) },
    {
      label: "Available",
      value: String(screenshots.available),
      tone: screenshots.available > 0 ? "text-emerald-600" : "text-muted-foreground",
    },
    {
      label: "Pending upload",
      value: String(screenshots.pending),
      tone: screenshots.pending === 0 ? "text-muted-foreground" : "text-amber-600",
    },
    {
      label: "Needs redaction",
      value: String(screenshots.needsRedaction),
      tone: screenshots.needsRedaction === 0 ? "text-muted-foreground" : "text-rose-600",
    },
    {
      label: "Welcome video",
      value: welcomeVideo.ok ? "Linked" : "Pending",
      tone: welcomeVideo.ok ? "text-emerald-600" : "text-amber-600",
    },
  ];

  return (
    <section
      data-testid="sd-screenshot-readiness-panel"
      className="rounded-2xl border border-border/70 bg-card p-6"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Training Management · Visual assets
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
            Screenshots &amp; Welcome Video
          </h2>
          <p className="mt-1.5 max-w-3xl text-[13px] text-muted-foreground">
            The walkthroughs render calm pending callouts while real screenshots are uploaded.
            PII safety checks block training-safe screenshots from showing identifiers.
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-border/60 bg-background p-3"
          >
            <p className={cn("text-[20px] font-semibold tracking-tight", t.tone ?? "text-foreground")}>
              {t.value}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              {t.label}
            </p>
          </div>
        ))}
      </div>
      {!welcomeVideo.ok && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50/40 px-3 py-2 text-[12px] text-amber-900">
          <VideoIcon className="mt-0.5 h-3.5 w-3.5" />
          <span>
            Upload an MP4 titled <strong>Welcome Video from Blossom</strong> in Resource Upload Center
            to wire the welcome page automatically. No code change required.
          </span>
        </div>
      )}
    </section>
  );
}

export function SDDayOneAdminGuide() {
  const steps = [
    "Confirm employee + auth user record exists in HR.",
    "Assign the State Director journey to the learner.",
    "Assign a mentor and confirm they have access.",
    "Confirm the assigned state (GA / NC / TN / VA / MD).",
    "Open /training/welcome and confirm Welcome to Blossom loads.",
    "Open Week 1 · Day 1 modules and confirm they open cleanly.",
    "Confirm Resource Library access at /resource-library.",
    "Check the State Director SOP Readiness count in this page.",
    "Have the learner start one module — confirm progress appears here.",
    "Send the learner their first-day instructions email.",
  ];

  return (
    <section
      data-testid="sd-day-one-admin-guide"
      className="rounded-2xl border border-border/70 bg-card p-6"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UserCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Training Management · Runbook
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
            Day-One State Director Setup
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] text-muted-foreground">
            Ten steps. Run them in order the morning a new State Director starts.
          </p>
        </div>
      </div>
      <ol className="mt-5 space-y-2">
        {steps.map((s, idx) => (
          <li
            key={s}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11.5px] font-semibold text-primary">
              {idx + 1}
            </span>
            <span className="text-[13px] leading-snug text-foreground">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function SDMentorCheckInGuide() {
  const sections: { title: string; items: string[] }[] = [
    {
      title: "After Day 1",
      items: [
        "Confirm the learner opened Welcome to Blossom.",
        "Ask what stood out from the Chad and Shira letters.",
        "Confirm Week 1 Day 1 modules were marked complete.",
        "Capture one reflection in your shared notes.",
      ],
    },
    {
      title: "After Week 1",
      items: [
        "Walk the company structure and department map together.",
        "Ask: ‘Who would you call first if a parent escalated today?’",
        "Review the first knowledge check scores.",
        "Confirm the learner feels oriented, not overwhelmed.",
      ],
    },
    {
      title: "Shadowing evidence to collect",
      items: [
        "Date, department, and host of each shadow session.",
        "One observation per shadow (what worked, what surprised them).",
        "Mentor sign-off recorded on the shadow module.",
        "Any escalation patterns the learner noticed.",
      ],
    },
    {
      title: "Readiness signs (good)",
      items: [
        "Uses the same operational language as leadership.",
        "Knows their state’s KPI numbers without looking them up.",
        "Can walk a client lifecycle end-to-end without prompting.",
        "Surfaces issues with an owner and a next step attached.",
      ],
    },
    {
      title: "When to escalate",
      items: [
        "Two consecutive check-ins missed.",
        "Knowledge check scores stay below 80% after a retry.",
        "Learner avoids hard conversations or escalations.",
        "Readiness assessment stalls below 60% past Week 4.",
      ],
    },
    {
      title: "How to mark sign-off",
      items: [
        "Open the shadow or readiness module in the SD journey.",
        "Confirm evidence is attached.",
        "Mark mentor sign-off and add a short note.",
        "Notify leadership in the weekly operating rhythm.",
      ],
    },
  ];

  return (
    <section
      data-testid="sd-mentor-checkin-guide"
      className="rounded-2xl border border-border/70 bg-card p-6"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Training Management · Mentors
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
            Mentor check-in guide
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] text-muted-foreground">
            Share this with the assigned mentor before Day 1. It keeps check-ins consistent
            across every State Director launch.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-border/70 bg-background/60 p-4"
          >
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {section.title}
            </h4>
            <ul className="mt-3 space-y-1.5">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[12.5px] text-foreground">
                  <span
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60"
                    aria-hidden
                  />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}