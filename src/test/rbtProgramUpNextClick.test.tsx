/**
 * Component-level regression: clicking "Open" on Up Next opens the sheet
 * whose title matches the Up Next step, not step 0. Also verifies every
 * roadmap row opens its own step across the three lab pathways at the
 * midway preset.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { projectProgram, type LabPathwayKey } from "@/lib/rbt/experienceLab";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  },
}));

vi.mock("@/pages/rbt/app/useRbtIdentity", () => ({
  useRbtIdentity: () => ({
    employeeId: "lab-preview",
    writableEmployeeId: null,
    isPreviewing: true,
    loading: false,
  }),
}));

const labState: { pathway: LabPathwayKey; preset: "midway" } = {
  pathway: "under_2_years",
  preset: "midway",
};

vi.mock("@/pages/rbt/app/useExperienceLab", () => ({
  useExperienceLab: () => ({ active: true, state: labState, isEligible: true }),
}));

import RbtProgram from "@/pages/rbt/app/training/RbtProgram";

function renderProgram() {
  return render(
    <MemoryRouter>
      <RbtProgram />
    </MemoryRouter>,
  );
}

describe("RbtProgram Up Next click opens the correct step", () => {
  beforeEach(() => cleanup());

  it("Developing / Midway: Up Next Open shows 'Lead RBT + client session', not step 0", async () => {
    labState.pathway = "under_2_years";
    renderProgram();
    const openBtn = await screen.findByTestId("rbt-upnext-open");
    const expected = projectProgram(labState).rows.find(
      (r) => r.progress.status !== "complete",
    )!;
    expect(openBtn.getAttribute("data-step-id")).toBe(expected.step.id);
    fireEvent.click(openBtn);
    // Sheet renders the step title in its header.
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(expected.step.title)).toBeInTheDocument();
    expect(expected.step.title).toBe("Lead RBT + client session");
    // And explicitly NOT the first step's title.
    expect(within(dialog).queryByText("Zoom learning intro")).not.toBeInTheDocument();
  });

  for (const pathway of ["new_rbt_certification", "under_2_years", "experienced_rbt"] as const) {
    it(`${pathway} / midway: every roadmap row opens its own step`, async () => {
      labState.pathway = pathway;
      renderProgram();
      const proj = projectProgram(labState);
      const rowButtons = await screen.findAllByTestId("rbt-roadmap-row");
      expect(rowButtons.length).toBe(proj.rows.length);
      for (let i = 0; i < proj.rows.length; i++) {
        const row = proj.rows[i];
        expect(rowButtons[i].getAttribute("data-step-id")).toBe(row.step.id);
        fireEvent.click(rowButtons[i]);
        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByText(row.step.title)).toBeInTheDocument();
        // Close before next iteration.
        fireEvent.keyDown(dialog, { key: "Escape" });
      }
    });
  }
});