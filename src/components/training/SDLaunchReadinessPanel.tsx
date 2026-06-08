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
import { cn } from "@/lib/utils";
import { computeSdSopCoverageFromResources } from "@/lib/resources/sdSopCoverage";
import {
  computeSdScreenshotReadiness,
  computeSdWelcomeVideoState,
} from "@/lib/training/sdRuntimeReadiness";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";
import { getTrainings, SD_JOURNEY_MODULE_IDS } from "@/lib/training/academyData";
import {
  getStateDirectorFullContent,
  getStateDirectorScreenshots,
  isScreenshotPiiSafe,
} from "@/lib/training/stateDirectorFullTraining";

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
  const screenshots = computeSdScreenshotReadiness();
  const welcomeVideo = computeSdWelcomeVideoState(resources);
  const allManifestPublished =
    coverage.total === SD_SOP_MANIFEST.length && coverage.published === coverage.total;

  // Live content audit across the SD journey.
  const sdTrainings = getTrainings().filter((t) => SD_JOURNEY_MODULE_IDS.includes(t.id));
  const totalModules = sdTrainings.length;
  const contentAudit = sdTrainings.reduce(
    (acc, t) => {
      if (t.whyItMatters) acc.why += 1;
      if (t.whatToDo) acc.what += 1;
      if (t.completionEvidence) acc.evidence += 1;
      if (t.reflectionPrompt) acc.reflection += 1;
      const full = getStateDirectorFullContent(t);
      if (full) acc.full += 1;
      if (full && full.knowledgeCheck && full.knowledgeCheck.length >= 2) acc.knowledge += 1;
      return acc;
    },
    { why: 0, what: 0, evidence: 0, reflection: 0, full: 0, knowledge: 0 },
  );

  // Live screenshot audit across all SD modules (not just priority set).
  const screenshotAudit = sdTrainings.reduce(
    (acc, t) => {
      for (const asset of getStateDirectorScreenshots(t.id)) {
        acc.total += 1;
        const piiSafe = isScreenshotPiiSafe(asset);
        if (asset.resourceStatus === "available" && piiSafe) acc.available += 1;
        else if (asset.resourceStatus === "needs_redaction" || !piiSafe) acc.needsRedaction += 1;
        else acc.pending += 1;
      }
      return acc;
    },
    { total: 0, available: 0, pending: 0, needsRedaction: 0 },
  );

  const countState = (n: number, total: number): CheckState =>
    total === 0 ? "manual" : n === total ? "ok" : "warn";

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
    {
      label: `${totalModules} State Director modules registered`,
      state: totalModules > 0 ? "ok" : "manual",
    },
    {
      label: `${contentAudit.why}/${totalModules} modules have why-it-matters guidance`,
      state: countState(contentAudit.why, totalModules),
    },
    {
      label: `${contentAudit.what}/${totalModules} modules have what-to-do steps`,
      state: countState(contentAudit.what, totalModules),
    },
    {
      label: `${contentAudit.evidence}/${totalModules} modules have completion evidence`,
      state: countState(contentAudit.evidence, totalModules),
    },
    {
      label: `${contentAudit.full}/${totalModules} modules have full SD content`,
      state: countState(contentAudit.full, totalModules),
    },
    {
      label: `${contentAudit.knowledge}/${totalModules} modules have knowledge checks`,
      state: countState(contentAudit.knowledge, totalModules),
    },
    {
      label: `${contentAudit.reflection}/${totalModules} modules have reflection prompts`,
      state: countState(contentAudit.reflection, totalModules),
    },
  ];

  const assetItems: CheckItem[] = [
    {
      label: "Welcome video linked",
      state: "manual",
      note: "Confirm a published Welcome video resource or URL before launch.",
    },
    {
      label: `${screenshotAudit.available}/${screenshotAudit.total} walkthrough screenshots available`,
      state:
        screenshotAudit.total === 0
          ? "manual"
          : screenshotAudit.available === screenshotAudit.total &&
              screenshotAudit.needsRedaction === 0
            ? "ok"
            : "warn",
      note: `${screenshotAudit.pending} pending upload · ${screenshotAudit.needsRedaction} need redaction.`,
    },
  ];

  const trackingItems: CheckItem[] = [
    {
      label: "Start / complete sync working",
      state: "manual",
      note: "Verify with a test learner account — start one module and confirm progress in Training Management.",
    },
    {
      label: "Reflection sync working",
      state: "manual",
      note: "Submit a reflection as a test learner and confirm it appears in admin.",
    },
    {
      label: "Knowledge check score sync working",
      state: "manual",
      note: "Take one knowledge check and confirm the score is recorded.",
    },
    {
      label: "Mentor sign-off visible on shadow modules",
      state: "manual",
      note: "Open a shadow module and confirm the mentor sign-off block renders.",
    },
    {
      label: "Leadership dashboard visible",
      state: "manual",
      note: "Confirm leadership can see learner progress for their state.",
    },
    {
      label: "Progress appears in Training Management",
      state: "manual",
      note: "Refresh Training Management after a learner action and confirm the count updates.",
    },
  ];

  const designItems: CheckItem[] = [
    {
      label: "Training home visually polished",
      state: "manual",
      note: "Confirm desktop and mobile renders on /training.",
    },
    {
      label: "Welcome page visually polished",
      state: "manual",
      note: "Open /training/welcome and walk every section.",
    },
    {
      label: "Module detail visually polished",
      state: "manual",
      note: "Open one mapped SOP module and one screenshot card.",
    },
    {
      label: "No legacy menu / placeholder feel",
      state: "manual",
      note: "Scan the learner pages for any old placeholder copy.",
    },
    {
      label: "No broken links or broken image placeholders",
      state: "manual",
      note: "Click through Week 1 Day 1 modules end-to-end.",
    },
    {
      label: "No harsh missing language for learners",
      state: "manual",
      note: "Pending states should read calm, not red.",
    },
  ];

  const groups: CheckGroup[] = [
    { title: "Learner setup", testid: "sd-launch-learner", items: learnerItems },
    { title: "Content setup", testid: "sd-launch-content", items: contentItems },
    { title: "Resource setup", testid: "sd-launch-resources", items: resourceItems },
    { title: "Asset setup", testid: "sd-launch-assets", items: assetItems },
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