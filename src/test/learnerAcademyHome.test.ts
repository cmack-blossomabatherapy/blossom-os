import { describe, it, expect, vi } from "vitest";
import { buildLearnerHome, completeLearnerModule, startLearnerModule } from "@/lib/academy/learnerHome";
import type { AcademyCurriculum } from "@/lib/academy/api";
import type { AcademyEnrollment, AcademyModule, AcademyPath } from "@/lib/academy/types";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "p1" }, error: null }),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    }),
  },
}));

function mod(over: Partial<AcademyModule>): AcademyModule {
  return {
    id: over.id ?? "m1",
    week_id: over.week_id ?? "w1",
    position: 1,
    title: over.title ?? "Module",
    description: null,
    module_type: over.module_type ?? "training",
    duration_label: null,
    leader_name: null,
    department: null,
    is_required: over.is_required ?? true,
    applies_to: (over.applies_to ?? "either") as AcademyPath,
    applies_to_new_state_only: false,
    quiz: null,
    link_url: null,
    cover_image_url: null,
    video_url: null,
    ...over,
  };
}

const curriculum: AcademyCurriculum = {
  track: { id: "t1", name: "SD", description: null, is_active: true },
  phases: [
    {
      id: "p1", track_id: "t1", position: 1, name: "Launch", tagline: null, color_token: "primary",
      weeks: [
        {
          id: "w1", phase_id: "p1", week_number: 1, title: "Foundations", objective: "Get grounded", outcomes: [],
          modules: [
            mod({ id: "welcome", title: "Welcome to Blossom", module_type: "video" }),
            mod({ id: "m1", title: "Mission" }),
            mod({ id: "m2", title: "NewState only", applies_to: "new_state" }),
          ],
        },
        {
          id: "w2", phase_id: "p1", week_number: 2, title: "Systems", objective: "Tour", outcomes: [],
          modules: [mod({ id: "m3", title: "CR Tour" })],
        },
      ],
    },
  ],
};

const enrollment: AcademyEnrollment = {
  id: "e1", employee_id: "emp1", track_id: "t1", start_date: "2025-01-01",
  status: "active", path: "new_state", assigned_state: "GA",
  mentor_employee_id: null, current_week_id: null, notes: null,
};

describe("learnerHome view-model", () => {
  it("flags setup gaps when employee/enrollment are missing", () => {
    const home = buildLearnerHome({
      employee: null, curriculum: null, enrollment: null,
      progress: [], shadows: [], checkins: [],
    });
    expect(home.setupGaps).toContain("no_employee_link");
    expect(home.setupGaps).toContain("no_curriculum");
    expect(home.setupGaps).toContain("no_enrollment");
    expect(home.weeks).toEqual([]);
    expect(home.launchProgress.requiredTotal).toBe(0);
  });

  it("scopes launch progress to the active path, not global required totals", () => {
    const home = buildLearnerHome({
      employee: { id: "emp1", first_name: "Corey", last_name: "X", job_title: "SD", state: "GA" },
      curriculum, enrollment,
      progress: [], shadows: [], checkins: [],
    });
    // new_state path keeps "new_state" + "either" modules => welcome + m1 + m2 + m3 = 4
    expect(home.launchProgress.requiredTotal).toBe(4);
    expect(home.launchProgress.requiredCompleted).toBe(0);
    // never the global "133" style
    expect(home.launchProgress.requiredTotal).toBeLessThan(50);
  });

  it("surfaces Welcome to Blossom module + completion state", () => {
    const home = buildLearnerHome({
      employee: { id: "emp1", first_name: "Corey", last_name: "X", job_title: "SD", state: "GA" },
      curriculum, enrollment,
      progress: [
        { id: "p1", enrollment_id: "e1", module_id: "welcome", status: "completed",
          score: null, reflection: null, verified_by_name: null, verified_at: null,
          started_at: null, completed_at: "2025-01-02" },
      ],
      shadows: [], checkins: [],
    });
    expect(home.welcomeModuleId).toBe("welcome");
    expect(home.welcomeComplete).toBe(true);
    expect(home.launchProgress.requiredCompleted).toBe(1);
  });

  it("picks the current week and the next non-completed module as next action", () => {
    const home = buildLearnerHome({
      employee: { id: "emp1", first_name: "Corey", last_name: "X", job_title: "SD", state: "GA" },
      curriculum, enrollment,
      progress: [
        { id: "p1", enrollment_id: "e1", module_id: "welcome", status: "completed",
          score: null, reflection: null, verified_by_name: null, verified_at: null,
          started_at: null, completed_at: "2025-01-02" },
      ],
      shadows: [], checkins: [],
    });
    expect(home.currentWeek?.week_number).toBe(1);
    expect(home.nextAction?.module.id).toBe("m1");
  });

  it("startLearnerModule and completeLearnerModule call upsertProgress with enrollment+module", async () => {
    const api = await import("@/lib/academy/api");
    const spy = vi.spyOn(api, "upsertProgress").mockResolvedValue({ data: { id: "p1" } } as any);
    await startLearnerModule("e1", "m1");
    await completeLearnerModule("e1", "m1");
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0][0]).toBe("e1");
    expect(spy.mock.calls[0][1]).toBe("m1");
    expect(spy.mock.calls[0][2].status).toBe("in_progress");
    expect(spy.mock.calls[1][2].status).toBe("completed");
    spy.mockRestore();
  });
});
