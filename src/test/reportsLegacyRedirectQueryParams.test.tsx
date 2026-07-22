import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { NavigateWithSearch } from "@/lib/os/reporting/NavigateWithSearch";

function LandedPathProbe() {
  const { pathname, search, hash } = useLocation();
  return <div data-testid="landed">{pathname + search + hash}</div>;
}

function harness(entry: string, from: string, to: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path={from} element={<NavigateWithSearch to={to} />} />
        <Route path={to} element={<LandedPathProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Phase 4 — legacy report redirects preserve query params + hash", () => {
  it("V1 BCBA Productivity → V3 keeps ?state=NC&saved=weekly-ops#tab=providers", () => {
    harness(
      "/reports/bcba-productivity-report?state=NC&saved=weekly-ops#tab=providers",
      "/reports/bcba-productivity-report",
      "/reports/bcba-productivity-report-v3",
    );
    expect(screen.getByTestId("landed").textContent).toBe(
      "/reports/bcba-productivity-report-v3?state=NC&saved=weekly-ops#tab=providers",
    );
  });

  it("qa-supervision-pt → bcba-supervision keeps ?month=2026-06&provider=ada", () => {
    harness(
      "/reports/qa-supervision-pt?month=2026-06&provider=ada",
      "/reports/qa-supervision-pt",
      "/reports/bcba-supervision",
    );
    expect(screen.getByTestId("landed").textContent).toBe(
      "/reports/bcba-supervision?month=2026-06&provider=ada",
    );
  });

  it("qa-auth-utilization → hour-based keeps ?client=CR-42&status=active", () => {
    harness(
      "/reports/qa-auth-utilization?client=CR-42&status=active",
      "/reports/qa-auth-utilization",
      "/reports/authorization-utilization-hour-based",
    );
    expect(screen.getByTestId("landed").textContent).toBe(
      "/reports/authorization-utilization-hour-based?client=CR-42&status=active",
    );
  });

  it("qa-cancellation → cancellation-command-center keeps filters", () => {
    harness(
      "/reports/qa-cancellation?state=NC&reason=parent",
      "/reports/qa-cancellation",
      "/reports/cancellation-command-center",
    );
    expect(screen.getByTestId("landed").textContent).toBe(
      "/reports/cancellation-command-center?state=NC&reason=parent",
    );
  });

  it("passes through when there is no query string", () => {
    harness(
      "/reports/qa-supervision",
      "/reports/qa-supervision",
      "/reports/bcba-supervision",
    );
    expect(screen.getByTestId("landed").textContent).toBe("/reports/bcba-supervision");
  });
});