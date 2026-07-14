import type {
  AcademyCurriculum,
} from "./api";
import type {
  AcademyEnrollment,
  AcademyModule,
} from "./types";

/**
 * Display-only launch-asset and launch-setup tracking for the
 * State Director Training Academy. No DB schema changes.
 */

export type AssetStatus = "linked" | "pending" | "optional" | "needs_admin";

export interface LaunchAsset {
  key: string;
  label: string;
  kind: "video" | "training" | "sop";
  required: boolean;
  status: AssetStatus;
  note: string;
}

/** Canonical Week 1 Day 1 "Welcome to Blossom" assets. */
export const WELCOME_ASSET_TITLES = [
  "Welcome Video from Blossom",
  "Mission & Vision",
  "Core Values",
  "Meet the Team",
  "How Blossom Works",
  "Welcome from Chad Kaufman",
  "A Note from Shira Lasry",
] as const;

function statusForVideo(m: AcademyModule | undefined): AssetStatus {
  if (!m) return "needs_admin";
  if (m.video_url || m.link_url) return "linked";
  return "pending";
}

function findModule(curriculum: AcademyCurriculum | null, title: string): AcademyModule | undefined {
  if (!curriculum) return undefined;
  for (const phase of curriculum.phases) {
    for (const week of phase.weeks) {
      const m = week.modules.find((x) => x.title.toLowerCase() === title.toLowerCase());
      if (m) return m;
    }
  }
  return undefined;
}

export function computeWelcomeAssetStatus(curriculum: AcademyCurriculum | null): LaunchAsset[] {
  return WELCOME_ASSET_TITLES.map((title) => {
    const m = findModule(curriculum, title);
    const isVideo = /^(Welcome Video|Welcome from|A Note from)/i.test(title);
    const status: AssetStatus = isVideo
      ? statusForVideo(m)
      : m
        ? "linked"
        : "needs_admin";
    return {
      key: title,
      label: title,
      kind: isVideo ? "video" : "training",
      required: true,
      status,
      note:
        status === "linked"
          ? "Linked — ready for learner."
          : status === "pending"
            ? "Pending video link — learner can continue with written guidance."
            : status === "needs_admin"
              ? "Not yet linked in curriculum — admin action needed."
              : "Optional.",
    };
  });
}

export interface PendingSop {
  key: string;
  label: string;
  status: AssetStatus;
  note: string;
}

/** SOP modules in the curriculum that have no resource link yet. */
export function computePendingSops(curriculum: AcademyCurriculum | null): PendingSop[] {
  if (!curriculum) return [];
  const out: PendingSop[] = [];
  for (const phase of curriculum.phases) {
    for (const week of phase.weeks) {
      for (const m of week.modules) {
        if (m.module_type !== "sop") continue;
        const linked = Boolean(m.link_url || m.video_url);
        if (linked) continue;
        out.push({
          key: m.id,
          label: m.title,
          status: "pending",
          note: "SOP attachment pending — link from Resource Library when ready.",
        });
      }
    }
  }
  return out;
}

export type LaunchSetupStatus = "ready" | "pending" | "missing";

export interface LaunchSetupCheck {
  key: string;
  label: string;
  status: LaunchSetupStatus;
  note: string;
}

export interface LaunchSetupInput {
  enrollment: (AcademyEnrollment & { employee?: any }) | null;
  curriculum: AcademyCurriculum | null;
  hasLeadershipVisibility: boolean; // true when this row renders on the leadership dashboard
}

export function computeLaunchSetup(input: LaunchSetupInput): LaunchSetupCheck[] {
  const e = input.enrollment;
  const employeeLinked = Boolean(e?.employee?.id);
  const enrollmentActive = e?.status === "active";
  const pathSelected = Boolean(e?.path && e.path !== "either");
  const stateAssigned = Boolean(e?.assigned_state);
  const mentorAssigned = Boolean(e?.mentor_employee_id);

  const welcome = computeWelcomeAssetStatus(input.curriculum);
  const welcomeVideosPending = welcome.filter(
    (w) => w.kind === "video" && w.status !== "linked",
  ).length;
  const sopsPending = computePendingSops(input.curriculum).length;

  const firstWeek = input.curriculum?.phases[0]?.weeks?.[0];
  const firstWeekReady = Boolean(
    // Welcome to Blossom now lives as its own Phase 0 above every role journey
    // (WelcomeToBlossomCard on TrainingPathDetail) rather than inside a Day 1
    // module. Week 1 is "ready" as long as it has at least one Day 1 module.
    firstWeek && firstWeek.modules.length > 0,
  );

  const checks: LaunchSetupCheck[] = [
    {
      key: "employee_linked",
      label: "Employee record linked",
      status: employeeLinked ? "ready" : "missing",
      note: employeeLinked
        ? "Employee record connected."
        : "Link this enrollment to an employee + auth user.",
    },
    {
      key: "enrollment_active",
      label: "Enrollment active",
      status: enrollmentActive ? "ready" : "missing",
      note: enrollmentActive
        ? "Enrollment is active."
        : "Activate the State Director enrollment.",
    },
    {
      key: "path_selected",
      label: "Path selected",
      status: pathSelected ? "ready" : "missing",
      note: pathSelected
        ? `Path: ${e?.path === "new_state" ? "New state" : "Existing state"}.`
        : "Choose existing_state or new_state.",
    },
    {
      key: "state_assigned",
      label: "State assigned",
      status: stateAssigned ? "ready" : "missing",
      note: stateAssigned ? `State: ${e?.assigned_state}.` : "Assign the State Director's state.",
    },
    {
      key: "mentor_assigned",
      label: "Mentor assigned",
      status: mentorAssigned ? "ready" : "pending",
      note: mentorAssigned
        ? "Mentor is assigned."
        : "Assign a mentor before week 1 starts.",
    },
    {
      key: "welcome_videos",
      label: "Welcome videos linked",
      status: welcomeVideosPending === 0 ? "ready" : "pending",
      note:
        welcomeVideosPending === 0
          ? "All welcome videos linked."
          : `${welcomeVideosPending} welcome video(s) pending — learner can continue with written guidance.`,
    },
    {
      key: "sop_resources",
      label: "SOP resources linked",
      status: sopsPending === 0 ? "ready" : "pending",
      note:
        sopsPending === 0
          ? "All SOPs linked."
          : `${sopsPending} SOP resource(s) pending from Resource Library.`,
    },
    {
      key: "first_week_ready",
      label: "First week ready",
      status: firstWeekReady ? "ready" : "missing",
      note: firstWeekReady
        ? "Week 1 Day 1 is ready. Welcome to Blossom is available above the curriculum for every learner."
        : "Week 1 Day 1 must have at least one role orientation module.",
    },
    {
      key: "leadership_visibility",
      label: "Leadership dashboard visible",
      status: input.hasLeadershipVisibility ? "ready" : "missing",
      note: input.hasLeadershipVisibility
        ? "Trainee is visible on the leadership dashboard."
        : "Trainee not yet appearing on leadership dashboard.",
    },
  ];
  return checks;
}