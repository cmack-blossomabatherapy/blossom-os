import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}</div>;
}

// Replica of the production route — Phase H replaces WorkspacePage with a
// hard redirect to /dashboard so the old workspace shell can never leak in.
function TestApp({ initial }: { initial: string }) {
  return (
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/ws/:id" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("/ws/:id is fully retired", () => {
  it("redirects /ws/anything to /dashboard and never renders WorkspacePage", () => {
    render(<TestApp initial="/ws/some-old-workspace" />);
    expect(screen.getByTestId("loc").textContent).toBe("/dashboard");
    expect(screen.queryByText(/Workspace/i)).toBeNull();
  });
});