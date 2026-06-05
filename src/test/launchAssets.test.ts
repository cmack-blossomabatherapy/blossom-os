import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  WELCOME_ASSET_TITLES,
  computeWelcomeAssetStatus,
  computePendingSops,
  computeLaunchSetup,
} from "@/lib/academy/launchAssets";
import type { AcademyCurriculum } from "@/lib/academy/api";

function emptyCurriculum(): AcademyCurriculum {
  return {
    track: { id: "t1", name: "SD", description: null, is_active: true },
    phases: [],
  };
}

describe("launchAssets — welcome asset tracking", () => {
  it("tracks the 7 Welcome to Blossom assets", () => {
    const assets = computeWelcomeAssetStatus(null);
    expect(assets).toHaveLength(WELCOME_ASSET_TITLES.length);
    const labels = assets.map((a) => a.label);
    for (const t of WELCOME_ASSET_TITLES) expect(labels).toContain(t);
  });

  it("marks unlinked welcome modules as needs admin (no curriculum)", () => {
    const assets = computeWelcomeAssetStatus(null);
    expect(assets.every((a) => a.status === "needs_admin")).toBe(true);
  });

  it("uses friendly pending copy for video assets without urls", () => {
    const cur: AcademyCurriculum = {
      track: { id: "t1", name: "SD", description: null, is_active: true },
      phases: [{
        id: "p1", track_id: "t1", position: 0, name: "Foundations",
        tagline: null, color_token: "primary",
        weeks: [{
          id: "w1", phase_id: "p1", week_number: 1, title: "Welcome",
          objective: null, outcomes: [], modules: [
            { id: "m1", week_id: "w1", position: 0, title: "Welcome Video from Blossom",
              description: null, module_type: "video", duration_label: null,
              leader_name: null, department: null, is_required: true,
              applies_to: "either", applies_to_new_state_only: false, quiz: null,
              video_url: null, link_url: null },
          ],
        }],
      }],
    };
    const assets = computeWelcomeAssetStatus(cur);
    const welcome = assets.find((a) => a.label === "Welcome Video from Blossom")!;
    expect(welcome.status).toBe("pending");
    expect(welcome.note.toLowerCase()).toContain("continue");
  });
});

describe("launchAssets — pending SOPs", () => {
  it("returns SOP modules without link_url", () => {
    const cur: AcademyCurriculum = {
      track: { id: "t1", name: "SD", description: null, is_active: true },
      phases: [{
        id: "p1", track_id: "t1", position: 0, name: "X", tagline: null, color_token: "primary",
        weeks: [{
          id: "w1", phase_id: "p1", week_number: 1, title: "X",
          objective: null, outcomes: [],
          modules: [
            { id: "s1", week_id: "w1", position: 0, title: "Intake SOP", description: null,
              module_type: "sop", duration_label: null, leader_name: null, department: null,
              is_required: true, applies_to: "either", applies_to_new_state_only: false,
              quiz: null, video_url: null, link_url: null },
          ],
        }],
      }],
    };
    const sops = computePendingSops(cur);
    expect(sops.map((s) => s.label)).toEqual(["Intake SOP"]);
    expect(sops[0].status).toBe("pending");
  });
});

describe("launchAssets — launch setup checks", () => {
  it("returns missing checks for an empty enrollment", () => {
    const out = computeLaunchSetup({
      enrollment: null, curriculum: emptyCurriculum(),
      hasLeadershipVisibility: false,
    });
    const keys = out.map((c) => c.key);
    for (const wanted of [
      "employee_linked",
      "enrollment_active",
      "path_selected",
      "state_assigned",
      "mentor_assigned",
      "welcome_videos",
      "sop_resources",
      "first_week_ready",
      "leadership_visibility",
    ]) {
      expect(keys).toContain(wanted);
    }
    expect(out.find((c) => c.key === "employee_linked")!.status).toBe("missing");
    expect(out.find((c) => c.key === "leadership_visibility")!.status).toBe("missing");
  });

  it("marks employee_linked ready when enrollment has employee", () => {
    const out = computeLaunchSetup({
      enrollment: {
        id: "e1", employee_id: "u1", track_id: "t1", start_date: "",
        status: "active", path: "new_state", assigned_state: "GA",
        mentor_employee_id: "m1", current_week_id: null, notes: null,
        employee: { id: "u1", first_name: "Jane", last_name: "Director" },
      } as any,
      curriculum: emptyCurriculum(),
      hasLeadershipVisibility: true,
    });
    expect(out.find((c) => c.key === "employee_linked")!.status).toBe("ready");
    expect(out.find((c) => c.key === "enrollment_active")!.status).toBe("ready");
    expect(out.find((c) => c.key === "path_selected")!.status).toBe("ready");
    expect(out.find((c) => c.key === "state_assigned")!.status).toBe("ready");
    expect(out.find((c) => c.key === "mentor_assigned")!.status).toBe("ready");
    expect(out.find((c) => c.key === "leadership_visibility")!.status).toBe("ready");
  });
});

describe("LeadershipDashboard — launch helper visible in source", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/pages/hr/academy/LeadershipDashboard.tsx"),
    "utf8",
  );

  it("renders a Launch Setup panel", () => {
    expect(src).toMatch(/Launch Setup/);
  });

  it("renders welcome assets and asset status chips", () => {
    expect(src).toMatch(/Welcome to Blossom — assets/);
    expect(src).toMatch(/AssetStatusChip/);
  });

  it("references pending SOP resources", () => {
    expect(src).toMatch(/SOP resources pending/);
  });

  it("uses calm copy: pending videos do not block", () => {
    expect(src).toMatch(/Pending videos do not block training/);
  });
});

describe("ModuleCard — pending videos do not block completion", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/components/academy/ModuleCard.tsx"),
    "utf8",
  );

  it('shows friendly "can continue" pending video copy', () => {
    expect(src).toMatch(/Video link pending\. You can continue/);
  });

  it("does not gate Mark complete on video_url presence", () => {
    // The Mark complete button must not be guarded by `!module.video_url` etc.
    expect(src).not.toMatch(/disabled=\{[^}]*!module\.video_url[^}]*\}/);
  });
});