import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const authState = vi.hoisted(() => ({ roles: ["admin"] as string[] }));

function makeQuery(table: string) {
  const result = () => {
    if (table === "user_roles") {
      return { data: authState.roles.map((role) => ({ role })), error: null };
    }
    if (table === "role_permissions" || table === "stage_ownership" || table === "hr_resources") {
      return { data: [], error: null };
    }
    return { data: null, error: null };
  };

  const single = () => {
    if (table === "profiles") {
      return Promise.resolve({
        data: {
          state: "GA",
          must_change_password: false,
          part_of_leadership: false,
          dashboard_access: null,
          new_state_employee: false,
          avatar_url: null,
          display_name: "Test Admin",
        },
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  };

  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    order: vi.fn(() => builder),
    or: vi.fn(() => builder),
    is: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    contains: vi.fn(() => builder),
    range: vi.fn(() => builder),
    match: vi.fn(() => builder),
    filter: vi.fn(() => builder),
    not: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    maybeSingle: vi.fn(single),
    single: vi.fn(single),
    then: (resolve: any, reject: any) => Promise.resolve(result()).then(resolve, reject),
  };
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({
        data: {
          session: {
            user: { id: "user-1", email: "admin@blossom.test", user_metadata: {} },
          },
        },
      })),
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: "user-1", email: "admin@blossom.test", user_metadata: {} } },
        error: null,
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      mfa: {
        listFactors: vi.fn(() => Promise.resolve({ data: { totp: [{ id: "factor-1", status: "verified" }] } })),
        getAuthenticatorAssuranceLevel: vi.fn(() => Promise.resolve({ data: { currentLevel: "aal2" } })),
      },
    },
    from: vi.fn((table: string) => makeQuery(table)),
    channel: vi.fn(() => ({
      on: vi.fn(function (this: any) { return this; }),
      subscribe: vi.fn(function (this: any) { return this; }),
    })),
    removeChannel: vi.fn(() => Promise.resolve({ error: null })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        remove: vi.fn(() => Promise.resolve({ error: null })),
        createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: "https://example.test/resource" }, error: null })),
      })),
    },
  },
}));

import App from "@/App";

function renderAt(path: string, roles = ["admin"]) {
  cleanup();
  authState.roles = roles;
  window.localStorage.clear();
  window.history.pushState({}, "", path);
  return render(<App />);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("Resource Upload Center actual App routes", () => {
  it("visiting /hr/resource-management as super_admin renders Resource Upload Center", async () => {
    renderAt("/hr/resource-management", ["admin"]);

    expect(await screen.findByRole("heading", { name: "Resource Upload Center" })).toBeInTheDocument();
    expect(screen.getByText("Uploads here power Resource Library and Training Academy.")).toBeInTheDocument();
  });

  it("visiting /hr/resource-management#bulk-upload renders the bulk upload section", async () => {
    renderAt("/hr/resource-management#bulk-upload", ["admin"]);

    expect(await screen.findByTestId("resource-upload-bulk-section")).toBeInTheDocument();
    expect(screen.getByTestId("resource-bulk-upload-panel")).toBeInTheDocument();
  });

  it("/resource-management redirects to /hr/resource-management", async () => {
    renderAt("/resource-management", ["admin"]);

    expect(await screen.findByRole("heading", { name: "Resource Upload Center" })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe("/hr/resource-management"));
  });

  it("does not render old ResourceHub or legacy resource-management menus", async () => {
    renderAt("/hr/resource-management", ["admin"]);

    expect(await screen.findByRole("heading", { name: "Resource Upload Center" })).toBeInTheDocument();
    expect(screen.queryByText("Resource Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("Manage operational knowledge for the company.")).not.toBeInTheDocument();
    expect(screen.queryByText("Create Category")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Resource")).not.toBeInTheDocument();
    expect(screen.queryByText("All resources")).not.toBeInTheDocument();
  });

  it("Upload Resource CTA from /hr/training-center lands on the stable hash route", async () => {
    renderAt("/hr/training-center", ["admin"]);

    const uploadButtons = await screen.findAllByRole("button", { name: /Upload Resource/i });
    fireEvent.click(uploadButtons[0]);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/hr/resource-management");
      expect(window.location.hash).toBe("#bulk-upload");
    });
    expect(await screen.findByRole("heading", { name: "Resource Upload Center" })).toBeInTheDocument();
  });

  it("non-admin roles do not see Upload Resource CTA in Training Management", async () => {
    renderAt("/hr/training-center", ["rbt"]);

    expect(await screen.findByRole("heading", { name: "Training Management Center" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Upload Resource/i })).not.toBeInTheDocument();
  });

  it("non-admin roles see standard Unauthorized on the upload route", async () => {
    renderAt("/hr/resource-management", ["rbt"]);

    expect(await screen.findByText("Access restricted")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Resource Upload Center" })).not.toBeInTheDocument();
  });
});