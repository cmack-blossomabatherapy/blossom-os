/**
 * Deep-link + browser-back acceptance coverage for every Intake and shared
 * Leads route registered in App.tsx.
 *
 * For each route we:
 *   1. open the route with a realistic query string (deep link),
 *   2. assert the page renders and the query string survives mount,
 *   3. push a second location, then simulate the browser Back button and
 *      assert the original path + query string are restored and the page
 *      still renders (no crash, no lost filter state).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import type React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { OSRoleProvider } from "@/contexts/OSRoleContext";
import { LeadsProvider } from "@/contexts/LeadsContext";
import { LeadDrawerProvider } from "@/contexts/LeadDrawerContext";
import { ClientsProvider } from "@/contexts/ClientsContext";
import { JourneyOverridesProvider } from "@/hooks/useJourneyOverrides";
import { PhoneSystemProvider } from "@/contexts/PhoneSystemContext";
import { OperatorDialogsProvider } from "@/components/os/OperatorDialogs";

/* ------------------------------------------------------------------ */
/* Backend + toast stubs (empty-but-valid backend)                     */
/* ------------------------------------------------------------------ */

function makeBuilder(): unknown {
  const result = () => ({ data: [], error: null, count: 0 });
  return new Proxy({} as Record<string, unknown>, {
    get(_t, prop: string) {
      if (prop === "then") return (res: (v: unknown) => unknown) => Promise.resolve(result()).then(res);
      if (prop === "catch") return () => Promise.resolve(result());
      if (prop === "finally") return (f: () => void) => { f?.(); return Promise.resolve(result()); };
      if (prop === "single" || prop === "maybeSingle") return async () => ({ data: null, error: null });
      return () => makeBuilder();
    },
  });
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => makeBuilder(),
    rpc: async () => ({ data: [], error: null }),
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: { id: "11111111-1111-1111-1111-111111111111" } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
    },
    channel: () => { const ch: Record<string, unknown> = {}; ch.on = () => ch; ch.subscribe = () => ch; ch.unsubscribe = () => Promise.resolve("ok"); return ch; },
    removeChannel: () => Promise.resolve("ok"),
    functions: { invoke: async () => ({ data: null, error: null }) },
    storage: { from: () => ({ list: async () => ({ data: [], error: null }), upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
  },
}));

// recharts' ResponsiveContainer needs ResizeObserver, absent in jsdom.
if (!(globalThis as { ResizeObserver?: unknown }).ResizeObserver) {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {} unobserve() {} disconnect() {}
  };
}

vi.mock("sonner", () => ({
  toast: Object.assign(() => {}, { success: () => {}, error: () => {}, info: () => {}, warning: () => {}, message: () => {}, loading: () => {}, dismiss: () => {} }),
  Toaster: () => null,
}));

/* ------------------------------------------------------------------ */
/* Route inventory (parsed from the real router)                        */
/* ------------------------------------------------------------------ */

const APP = readFileSync("src/App.tsx", "utf8");

const INTAKE_ROUTE_LINES = APP.split("\n").filter((l) =>
  /<Route\s+path="\/(intake|leads)/.test(l),
);

const REDIRECT_ROUTES = INTAKE_ROUTE_LINES.filter((l) => l.includes("<Navigate")).map((l) => ({
  path: /path="([^"]+)"/.exec(l)![1],
  to: /to="([^"]+)"/.exec(l)![1],
}));

type DeepLinkCase = {
  /** Route pattern as registered in App.tsx. */
  pattern: string;
  /** Concrete deep link, including query string. */
  url: string;
  loader: () => Promise<{ default: React.ComponentType }>;
};

const LEAD_ID = "11111111-2222-3333-4444-555555555555";

const DEEP_LINKS: DeepLinkCase[] = [
  { pattern: "/leads", url: "/leads?q=smith&stage=insurance_verification&state=GA", loader: () => import("@/pages/os/OSLeadsV2") },
  { pattern: "/leads/operations", url: "/leads/operations?view=queue&state=NC", loader: () => import("@/pages/os/OSIntakeOperations") },
  { pattern: "/leads/:id", url: `/leads/${LEAD_ID}?tab=insurance&from=intake`, loader: () => import("@/pages/LeadDetail") },
  { pattern: "/intake", url: "/intake?tab=pipeline", loader: () => import("@/pages/os/OSIntakeWorkspace") },
  { pattern: "/intake-coordinator", url: "/intake-coordinator?state=GA", loader: () => import("@/pages/os/OSIntakeCoordinator") },
  { pattern: "/intake/clients", url: "/intake/clients?q=ava&state=TN", loader: () => import("@/pages/os/OSIntakeClients") },
  { pattern: "/intake/authorizations", url: "/intake/authorizations?status=pending", loader: () => import("@/pages/os/OSIntakeAuthorizations") },
  { pattern: "/intake/dashboard", url: "/intake/dashboard?state=GA&focus=sla", loader: () => import("@/pages/os/intake/IntakeDashboard") },
  { pattern: "/intake/lead-to-active", url: "/intake/lead-to-active?stage=staffing_match", loader: () => import("@/pages/os/intake/LeadToActivePipeline") },
  { pattern: "/intake/assignments", url: "/intake/assignments?owner=unassigned", loader: () => import("@/pages/os/intake/IntakeAssignments") },
  { pattern: "/intake/configuration", url: "/intake/configuration?tab=templates", loader: () => import("@/pages/os/intake/IntakeConfiguration") },
  { pattern: "/intake/review-queues", url: "/intake/review-queues?queue=promotions", loader: () => import("@/pages/os/intake/IntakePromotionReviewQueues") },
  { pattern: "/intake/tasks", url: "/intake/tasks?status=open&assignee=me", loader: () => import("@/pages/os/intake/IntakeTasks") },
  { pattern: "/intake/missing-information", url: "/intake/missing-information?state=GA", loader: () => import("@/pages/os/intake/MissingInformation") },
  { pattern: "/intake/parent-communication", url: "/intake/parent-communication?channel=sms", loader: () => import("@/pages/os/intake/ParentCommunication") },
  { pattern: "/intake/cr-packet-prep", url: "/intake/cr-packet-prep?state=GA&ready=1", loader: () => import("@/pages/os/intake/CentralReachPacketPrep") },
];

/* ------------------------------------------------------------------ */
/* Harness                                                             */
/* ------------------------------------------------------------------ */

function LocationProbe() {
  const loc = useLocation();
  const navigate = useNavigate();
  return (
    <div>
      <span data-testid="loc">{`${loc.pathname}${loc.search}`}</span>
      <button type="button" onClick={() => navigate("/tasks?from=deeplink")}>push-away</button>
      <button type="button" onClick={() => navigate(-1)}>go-back</button>
    </div>
  );
}

function Harness({ url, pattern, Page }: { url: string; pattern: string; Page: React.ComponentType }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <AuthProvider>
          <OSRoleProvider>
            <LeadsProvider>
              <LeadDrawerProvider>
                <ClientsProvider>
                  <JourneyOverridesProvider>
                    <PhoneSystemProvider>
                      <OperatorDialogsProvider>
                        <MemoryRouter initialEntries={[url]}>
                          <LocationProbe />
                          <Routes>
                            <Route path={pattern} element={<Page />} />
                            <Route path="/tasks" element={<div>away-destination</div>} />
                            <Route path="*" element={<div>no-match</div>} />
                          </Routes>
                        </MemoryRouter>
                      </OperatorDialogsProvider>
                    </PhoneSystemProvider>
                  </JourneyOverridesProvider>
                </ClientsProvider>
              </LeadDrawerProvider>
            </LeadsProvider>
          </OSRoleProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function healthy(errorSpy: ReturnType<typeof vi.spyOn>) {
  const logged = errorSpy.mock.calls.map((c) => c.map(String).join(" ")).join("\n");
  expect(logged).not.toMatch(/must be used (inside|within)/);
  expect(logged).not.toMatch(/Cannot read propert(y|ies) of (undefined|null)/);
  expect(document.body.textContent).not.toMatch(/Something went wrong/i);
  expect(screen.queryByText("no-match")).toBeNull();
}

/* ------------------------------------------------------------------ */
/* 1. Inventory completeness                                           */
/* ------------------------------------------------------------------ */

describe("Intake & Leads deep links — inventory", () => {
  it("covers every non-redirect Intake/Leads route registered in App.tsx", () => {
    const registered = INTAKE_ROUTE_LINES
      .filter((l) => !l.includes("<Navigate"))
      .map((l) => /path="([^"]+)"/.exec(l)![1])
      // /intake/ctm-calls lives behind the phone-system feature route and is
      // covered by the CTM suite, not the Intake workspace suite.
      .filter((p) => p !== "/intake/ctm-calls");
    const covered = new Set(DEEP_LINKS.map((d) => d.pattern));
    expect(registered.filter((p) => !covered.has(p))).toEqual([]);
  });

  it("every deep link under test actually carries a query string", () => {
    for (const d of DEEP_LINKS) expect(d.url).toContain("?");
  });

  it("retired Intake paths still redirect to a live destination", () => {
    const map = Object.fromEntries(REDIRECT_ROUTES.map((r) => [r.path, r.to]));
    expect(map["/intake/leads"]).toBe("/leads");
    expect(map["/intake/vob-decision"]).toBe("/vob-decision-center");
    expect(map["/intake/referral-queue"]).toBe("/intake/dashboard");
    expect(map["/intake/benefits-cheat-sheets"]).toBe("/vob-decision-center");
    for (const r of REDIRECT_ROUTES) expect(r.to.startsWith("/")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* 2. Deep link + browser back per route                               */
/* ------------------------------------------------------------------ */

describe("Intake & Leads deep links — query strings and browser back", () => {
  beforeEach(() => { document.body.innerHTML = ""; });

  it.each(DEEP_LINKS.map((d) => [d.url, d] as const))(
    "opens %s and restores it after browser back",
    async (url, route) => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const Page = (await route.loader()).default;

      await act(async () => { render(<Harness url={url} pattern={route.pattern} Page={Page} />); });
      await waitFor(() => expect(document.body.textContent).toBeTruthy());

      // Deep link mounted with its query string intact.
      expect(screen.getByTestId("loc").textContent).toBe(url);
      healthy(errorSpy);

      // Navigate away…
      await act(async () => { screen.getByText("push-away").click(); });
      await waitFor(() => expect(screen.getByTestId("loc").textContent).toBe("/tasks?from=deeplink"));

      // …then hit the browser Back button.
      await act(async () => { screen.getByText("go-back").click(); });
      await waitFor(() => expect(screen.getByTestId("loc").textContent).toBe(url));
      healthy(errorSpy);

      errorSpy.mockRestore();
    },
    30000,
  );
});
