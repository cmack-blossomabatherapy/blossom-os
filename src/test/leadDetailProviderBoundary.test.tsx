import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LeadDetail from "@/pages/LeadDetail";
import { LeadsProvider } from "@/contexts/LeadsContext";
import { LeadDrawerProvider } from "@/contexts/LeadDrawerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OSRoleProvider } from "@/contexts/OSRoleContext";

// Silence heavy sub-tree work not relevant to the provider-boundary assertion.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
    }),
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));

describe("LeadDetail provider boundary", () => {
  it("renders under the real route + OSShell composition without throwing 'useBlossomAI must be used inside <BlossomAIProvider>'", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(
        <QueryClientProvider client={client}>
          <TooltipProvider>
            <AuthProvider>
              <LeadsProvider>
                <LeadDrawerProvider>
                  <OSRoleProvider>
                    <MemoryRouter initialEntries={["/leads/7a0c5861-72c7-4649-b7f4-081dc39587f0"]}>
                      <Routes>
                        <Route path="/leads/:id" element={<LeadDetail />} />
                      </Routes>
                    </MemoryRouter>
                  </OSRoleProvider>
                </LeadDrawerProvider>
              </LeadsProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>,
      ),
    ).not.toThrow();

    const combined = errorSpy.mock.calls.map((c) => c.map(String).join(" ")).join("\n");
    expect(combined).not.toMatch(/useBlossomAI must be used inside/);

    // Page renders SOMETHING (not-found state is fine — the mock has no lead).
    // The point: no provider-boundary crash from the error boundary.
    expect(document.body.textContent).toBeTruthy();

    errorSpy.mockRestore();
  });
});