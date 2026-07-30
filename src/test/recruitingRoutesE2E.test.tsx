/**
 * End-to-end route coverage for the Recruiting role.
 *
 * Loads every /recruiting* destination registered in App.tsx, exercises the
 * key quick actions on the staffing handoff queue, and asserts the
 * security-gated recruiting RPCs are defined the way the app depends on.
 * Supabase is stubbed with an empty-but-valid backend so we prove the pages
 * render their real empty/loading states rather than crashing.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { OSRoleProvider } from "@/contexts/OSRoleContext";

/* ------------------------------------------------------------------ */
/* Supabase stub                                                       */
/* ------------------------------------------------------------------ */

const calls: { table: string; op: string; payload?: unknown }[] = [];
const tableRows: Record<string, unknown[]> = {};

function makeBuilder(table: string) {
  const result = () => ({ data: tableRows[table] ?? [], error: null, count: 0 });
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_t, prop: string) {
      if (prop === "then") {
        return (res: (v: unknown) => unknown) => Promise.resolve(result()).then(res);
      }
      if (prop === "catch") return () => Promise.resolve(result());
      if (prop === "finally") return (f: () => void) => { f?.(); return Promise.resolve(result()); };
      if (prop === "single" || prop === "maybeSingle") {
        return async () => ({ data: (tableRows[table] ?? [])[0] ?? null, error: null });
      }
      return (...args: unknown[]) => {
        if (["insert", "update", "upsert", "delete"].includes(prop)) {
          calls.push({ table, op: prop, payload: args[0] });
        }
        return makeBuilder(table);
      };
    },
  };
  return new Proxy({} as Record<string, unknown>, handler);
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => makeBuilder(table),
    rpc: async (fn: string) => { calls.push({ table: fn, op: "rpc" }); return { data: [], error: null }; },
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: { id: "11111111-1111-1111-1111-111111111111" } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
    },
    channel: () => {
      const ch: Record<string, unknown> = {};
      ch.on = () => ch;
      ch.subscribe = () => ch;
      ch.unsubscribe = () => Promise.resolve("ok");
      return ch;
    },
    removeChannel: () => Promise.resolve("ok"),
    functions: { invoke: async () => ({ data: null, error: null }) },
    storage: { from: () => ({ list: async () => ({ data: [], error: null }), upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
  },
}));

vi.mock("sonner", () => ({
  toast: Object.assign(() => {}, { success: () => {}, error: () => {}, info: () => {}, warning: () => {}, message: () => {}, loading: () => {}, dismiss: () => {} }),
  Toaster: () => null,
}));

function Providers({ path, children }: { path: string; children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <AuthProvider>
          <OSRoleProvider>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route path="*" element={children} />
              </Routes>
            </MemoryRouter>
          </OSRoleProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Every recruiting route loads                                     */
/* ------------------------------------------------------------------ */

const appSource = readFileSync("src/App.tsx", "utf8");

/** Recruiting destinations, parsed straight out of the router. */
const recruitingRouteLines = appSource
  .split("\n")
  .filter((l) => /<Route\s+path="\/recruiting/.test(l));

const REDIRECTS = recruitingRouteLines
  .filter((l) => l.includes("<Navigate"))
  .map((l) => ({
    path: /path="([^"]+)"/.exec(l)![1],
    to: /to="([^"]+)"/.exec(l)![1],
  }));

const PAGE_ROUTES: { path: string; loader: () => Promise<{ default: React.ComponentType }> }[] = [
  { path: "/recruiting-team", loader: () => import("@/pages/os/OSRecruitingTeam") },
  { path: "/recruiting/workspace", loader: () => import("@/pages/os/OSRecruitingWorkspace") },
  { path: "/recruiting/pipeline", loader: () => import("@/pages/os/OSRecruitingPipeline") },
  { path: "/recruiting/jobs", loader: () => import("@/pages/os/OSRecruitingJobs") },
  { path: "/recruiting/interviews", loader: () => import("@/pages/os/OSRecruitingInterviews") },
  { path: "/recruiting/offers", loader: () => import("@/pages/os/OSRecruitingOffers") },
  { path: "/recruiting/onboarding", loader: () => import("@/pages/os/OSRecruitingOnboarding") },
  { path: "/recruiting/background", loader: () => import("@/pages/os/OSRecruitingBackgroundChecks") },
  { path: "/recruiting/orientation", loader: () => import("@/pages/os/OSRecruitingOrientation") },
  { path: "/recruiting/staffing-needs", loader: () => import("@/pages/os/OSRecruitingStaffingNeeds") },
  { path: "/recruiting/rbt", loader: () => import("@/pages/os/OSRecruitingRBT") },
  { path: "/recruiting/bcba", loader: () => import("@/pages/os/OSRecruitingBCBA") },
  { path: "/recruiting/office-staff", loader: () => import("@/pages/os/OSRecruitingOfficeStaff") },
  { path: "/recruiting/clinic-staff", loader: () => import("@/pages/os/OSRecruitingClinicStaff") },
  { path: "/recruiting/performance", loader: () => import("@/pages/os/OSRecruitingPerformance") },
  { path: "/recruiting/follow-ups", loader: () => import("@/pages/os/OSRecruitingFollowUps") },
  { path: "/recruiting/messages", loader: () => import("@/pages/os/OSRecruitingMessages") },
  { path: "/recruiting/escalations", loader: () => import("@/pages/os/OSRecruitingEscalations") },
  { path: "/recruiting/map", loader: () => import("@/pages/os/mapsly/RecruitingMap") },
];

describe("Recruiting routes — every destination loads", () => {
  beforeEach(() => { calls.length = 0; });

  it("covers every non-redirect /recruiting route registered in App.tsx", () => {
    const registered = recruitingRouteLines
      .filter((l) => !l.includes("<Navigate"))
      .map((l) => /path="([^"]+)"/.exec(l)![1]);
    const covered = new Set(PAGE_ROUTES.map((r) => r.path));
    const missing = registered.filter((p) => !covered.has(p));
    expect(missing).toEqual([]);
  });

  it.each(PAGE_ROUTES.map((r) => [r.path, r] as const))(
    "loads %s without crashing",
    async (path, route) => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mod = await route.loader();
      const Page = mod.default;
      await act(async () => {
        render(<Providers path={path}><Page /></Providers>);
      });
      await waitFor(() => expect(document.body.textContent).toBeTruthy());

      const logged = errorSpy.mock.calls.map((c) => c.map(String).join(" ")).join("\n");
      expect(logged).not.toMatch(/must be used (inside|within)/);
      expect(logged).not.toMatch(/Cannot read propert(y|ies) of (undefined|null)/);
      expect(document.body.textContent).not.toMatch(/Something went wrong|could not load/i);
      errorSpy.mockRestore();
    },
    20000,
  );

  it("keeps retired recruiting paths redirecting to live destinations", () => {
    const map = Object.fromEntries(REDIRECTS.map((r) => [r.path, r.to]));
    expect(map["/recruiting/academy"]).toBe("/academy/path/recruiting");
    expect(map["/recruiting/ready-to-staff"]).toBe("/recruiting/staffing-needs");
    expect(map["/recruiting/apploi"]).toBe("/admin/integrations?connector=apploi");
    expect(map["/recruiting/resources"]).toBe("/resource-library");
  });
});

/* ------------------------------------------------------------------ */
/* 2. Quick actions on the staffing handoff review queue               */
/* ------------------------------------------------------------------ */

const HANDOFF = {
  id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
  client_id: null,
  client_label: "Client A. (GA)",
  state: "GA",
  city: "Atlanta",
  service_setting: "In-home",
  role_needed: "RBT",
  priority: "Normal",
  desired_start_date: null,
  required_availability: "Afternoons",
  preference_notes: null,
  source: "Recruiting",
  handoff_status: "pending_review",
  handoff_blocker: null,
  matched_candidate_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
  decision_reason: null,
  reviewed_at: null,
  created_at: new Date().toISOString(),
};

describe("Recruiting quick actions — staffing handoff review queue", () => {
  beforeEach(() => {
    calls.length = 0;
    tableRows.recruiting_staffing_needs = [HANDOFF];
    tableRows.recruiting_staffing_need_events = [];
  });

  async function mountQueue() {
    const { StaffingHandoffReviewQueue } = await import("@/components/recruiting/StaffingHandoffReviewQueue");
    const { OperatorDialogsProvider } = await import("@/components/os/OperatorDialogs");
    await act(async () => {
      render(
        <Providers path="/recruiting/staffing-needs">
          <OperatorDialogsProvider>
            <StaffingHandoffReviewQueue />
          </OperatorDialogsProvider>
        </Providers>,
      );
    });
    await screen.findByText("Client A. (GA)");
  }

  it("approves a proposal and writes an audit event", async () => {
    const user = userEvent.setup();
    await mountQueue();

    await user.click(screen.getByRole("button", { name: /Approve staffing proposal for Client A/i }));
    await user.click(await screen.findByRole("button", { name: /Approve and assign/i }));

    await waitFor(() => {
      const update = calls.find((c) => c.table === "recruiting_staffing_needs" && c.op === "update");
      expect(update).toBeTruthy();
      expect(update!.payload).toMatchObject({ handoff_status: "accepted", status: "Filled" });
    });
    const event = calls.find((c) => c.table === "recruiting_staffing_need_events" && c.op === "insert");
    expect(event!.payload).toMatchObject({ event_type: "handoff_accepted", to_status: "accepted" });
  });

  it("sends a proposal back to Recruiting with a clarification question", async () => {
    const user = userEvent.setup();
    await mountQueue();

    await user.click(screen.getByRole("button", { name: /Ask Recruiting for clarification/i }));
    const box = await screen.findByRole("textbox");
    await user.type(box, "Which days are actually open?");
    await user.click(screen.getByRole("button", { name: /Send to Recruiting/i }));

    await waitFor(() => {
      const update = calls.find((c) => c.table === "recruiting_staffing_needs" && c.op === "update");
      expect(update!.payload).toMatchObject({
        handoff_status: "needs_clarification",
        decision_reason: "Which days are actually open?",
      });
    });
    // Clarification must NOT close the staffing need.
    const update = calls.find((c) => c.table === "recruiting_staffing_needs" && c.op === "update")!;
    expect(update.payload).not.toHaveProperty("status");
    const event = calls.find((c) => c.table === "recruiting_staffing_need_events" && c.op === "insert");
    expect(event!.payload).toMatchObject({ event_type: "handoff_needs_clarification" });
  });

  it("requires a reason before declining", async () => {
    const user = userEvent.setup();
    await mountQueue();

    await user.click(screen.getByRole("button", { name: /Decline staffing proposal for Client A/i }));
    await screen.findByText(/Decline staffing proposal/i);
    // Submitting with an empty reason must not write anything.
    await user.click(screen.getByRole("button", { name: /Decline proposal/i }));
    expect(calls.find((c) => c.op === "update")).toBeUndefined();
  });

  it("opens the audit trail for a handoff", async () => {
    tableRows.recruiting_staffing_need_events = [
      {
        id: "cccccccc-3333-4333-8333-cccccccccccc",
        need_id: HANDOFF.id,
        event_type: "handoff_proposed",
        from_status: null,
        to_status: "pending_review",
        note: null,
        actor_id: null,
        created_at: new Date().toISOString(),
      },
    ];
    const user = userEvent.setup();
    await mountQueue();
    await user.click(screen.getByRole("button", { name: /History for Client A/i }));
    expect(await screen.findByText("Proposed by Recruiting")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* 3. Security-gated RPCs                                              */
/* ------------------------------------------------------------------ */

const migrationDir = "supabase/migrations";
const migrationSql = readdirSync(migrationDir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(`${migrationDir}/${f}`, "utf8"))
  .join("\n");

function definitionOf(fn: string): string {
  const re = new RegExp(`create or replace function public\\.${fn}[\\s\\S]*?\\$\\$;`, "gi");
  const matches = migrationSql.match(re) ?? [];
  return matches[matches.length - 1] ?? "";
}

describe("Recruiting security-gated RPCs return only permitted data", () => {
  it("recruiting_client_staffing_options is a role-gated security definer lookup", () => {
    const def = definitionOf("recruiting_client_staffing_options");
    expect(def).not.toBe("");
    expect(def.toLowerCase()).toContain("security definer");
    expect(def.toLowerCase()).toContain("set search_path");
    // Must refuse callers who are neither recruiting nor staffing.
    expect(def).toMatch(/recruiting_can_read|has_permission/);
    expect(def.toLowerCase()).toMatch(/raise exception|return;|not authorized/);
  });

  it("the staffing option lookup exposes no clinical or contact PHI", () => {
    const def = definitionOf("recruiting_client_staffing_options").toLowerCase();
    ["diagnosis", "date_of_birth", "dob", "guardian_email", "guardian_phone", "insurance_id", "member_id", "ssn"]
      .forEach((field) => expect(def).not.toContain(field));
  });

  it("the client staffing option type stays limited to staffing-fit fields", async () => {
    const hook = readFileSync("src/hooks/useStaffingHandoff.ts", "utf8");
    const iface = /export interface ClientStaffingOption \{([\s\S]*?)\}/.exec(hook)![1];
    const fields = iface.split("\n").map((l) => l.trim().split(":")[0]).filter(Boolean).sort();
    expect(fields).toEqual([
      "clinic",
      "client_id",
      "display_label",
      "service_location",
      "staffing_status",
      "state",
    ]);
  });

  it("apploi sync RPC surfaces are guarded, never called with a raw key from the client", () => {
    const srcHasKey = readdirSync("src/hooks").some((f) =>
      /APPLOI_(API_)?KEY|apploi_api_key/i.test(readFileSync(`src/hooks/${f}`, "utf8")),
    );
    expect(srcHasKey).toBe(false);
  });

  it("staffing handoff writes always attach an actor for the audit trail", () => {
    const hook = readFileSync("src/hooks/useStaffingHandoff.ts", "utf8");
    expect(hook).toContain("recruiting_staffing_need_events");
    expect(hook).toContain("actor_id: auth?.user?.id ?? null");
    expect(hook).toContain("reviewed_by: auth?.user?.id ?? null");
  });
});
