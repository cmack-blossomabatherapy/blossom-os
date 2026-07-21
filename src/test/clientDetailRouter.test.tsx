import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock the heavy ClientDetail body — Phase 1b is only about the resolver
// router and its render decisions, not the legacy detail chrome.
vi.mock("@/pages/ClientDetail", () => ({
  default: () => <div data-testid="legacy-client-detail">legacy</div>,
}));

// Hoisted mocks — factories run before top-level module code, so any refs
// they close over must be declared with vi.hoisted().
const H = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const getClientMock = vi.fn();
  return {
    maybeSingle,
    eq,
    select,
    from,
    getClientMock,
    clientsLoading: { value: false },
  };
});
vi.mock("@/contexts/ClientsContext", () => ({
  useClients: () => ({
    getClient: H.getClientMock,
    loading: H.clientsLoading.value,
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: H.from },
}));
const { maybeSingle, eq, select, from, getClientMock } = H;

import ClientDetailRouter from "@/pages/ClientDetailRouter";

const UUID = "11111111-2222-3333-4444-555555555555";
const RESOLVED_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/clients/:id" element={<ClientDetailRouter />} />
        <Route path="/clients" element={<div data-testid="clients-list">list</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getClientMock.mockReset();
  from.mockClear();
  select.mockClear();
  eq.mockClear();
  maybeSingle.mockReset();
  // Default: any un-queued read resolves to a benign miss so a re-mount from
  // a redirect doesn't blow up the test with an undefined result.
  maybeSingle.mockResolvedValue({ data: null, error: null });
  H.clientsLoading.value = false;
});

describe("ClientDetailRouter — Phase 1b resolver wiring", () => {
  it("renders the legacy ClientDetail when the operational context has the client", async () => {
    getClientMock.mockReturnValue({ id: UUID, childName: "Test" });
    renderAt(`/clients/${UUID}`);
    await waitFor(() =>
      expect(screen.getByTestId("legacy-client-detail")).toBeTruthy(),
    );
    expect(from).not.toHaveBeenCalled();
  });

  it("redirects a CentralReach id to the canonical UUID route", async () => {
    getClientMock.mockReturnValue(undefined);
    maybeSingle.mockResolvedValueOnce({
      data: { id: RESOLVED_UUID },
      error: null,
    });
    renderAt("/clients/cr_42");
    // The redirect lands on /clients/:id again, which now finds no context
    // record and no data on the second (uuid) fetch — either way we must
    // exit the CR-id path.
    await waitFor(() => {
      expect(eq).toHaveBeenCalledWith("centralreach_id", "cr_42");
    });
  });

  it("shows an unresolved-mapping empty state when the CR id has no canonical row", async () => {
    getClientMock.mockReturnValue(undefined);
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    renderAt("/clients/cr_missing");
    await waitFor(() =>
      expect(
        screen.getByText(/couldn't find that centralreach client/i),
      ).toBeTruthy(),
    );
  });

  it("renders the canonical detail card for a UUID that exists only in public.clients", async () => {
    getClientMock.mockReturnValue(undefined);
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: UUID,
        centralreach_id: "cr_777",
        child_name: "Canonical Kid",
        state: "GA",
        clinic: "Atlanta",
        active_service_status: "Active",
        payor: "BCBS",
      },
      error: null,
    });
    renderAt(`/clients/${UUID}`);
    await waitFor(() =>
      expect(screen.getByText("Canonical Kid")).toBeTruthy(),
    );
    expect(screen.getByText(/canonical client record/i)).toBeTruthy();
    expect(screen.getByText(/CR · cr_777/)).toBeTruthy();
    expect(eq).toHaveBeenCalledWith("id", UUID);
  });

  it("shows access-denied when RLS blocks the row read", async () => {
    getClientMock.mockReturnValue(undefined);
    maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "permission denied" },
    });
    renderAt(`/clients/${UUID}`);
    await waitFor(() =>
      expect(screen.getByText(/don't have access/i)).toBeTruthy(),
    );
  });

  it("shows missing-client for a UUID with no row", async () => {
    getClientMock.mockReturnValue(undefined);
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    renderAt(`/clients/${UUID}`);
    await waitFor(() =>
      expect(screen.getByText(/client not found/i)).toBeTruthy(),
    );
  });
});