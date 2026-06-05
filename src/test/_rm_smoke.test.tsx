import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResourceManagement from "@/pages/hr/ResourceManagement";

describe("smoke", () => {
  it("renders ResourceManagement", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/hr/resource-management"]}>
        <ResourceManagement />
      </MemoryRouter>
    );
    expect(container.textContent).toBeTruthy();
  });
});
