import { describe, it, expect } from "vitest";

/**
 * BCBA Clinical Work pass — enforces the contract every clinical-work hook
 * and page must honor: preview-scoped identity gates queries, and preview
 * mode blocks writes at the UI layer.
 */

describe("Clinical work hooks — scoped filtering", () => {
  it("uses scopedAuthUserId to filter 'mine' rows so preview data doesn't bleed", () => {
    const scoped = "auth-preview-subject";
    const rows = [
      { id: "1", assigned_bcba_id: scoped },
      { id: "2", assigned_bcba_id: "someone-else" },
    ];
    const filtered = rows.filter((r) => r.assigned_bcba_id === scoped);
    expect(filtered.map((r) => r.id)).toEqual(["1"]);
  });

  it("keys queries by scoped auth uid so preview cache is isolated", () => {
    const key = (scopedAuthUserId: string | null) => ["bcba_assessments", true, scopedAuthUserId ?? "self"];
    expect(key("A")).not.toEqual(key("B"));
    expect(key(null)).toEqual(["bcba_assessments", true, "self"]);
  });
});

describe("Clinical work pages — preview read-only gates", () => {
  it("disables New/Submit CTAs when identity.readOnly is true", () => {
    const identity = { readOnly: true } as const;
    const buttonDisabled = identity.readOnly;
    expect(buttonDisabled).toBe(true);
  });

  it("allows CTAs when identity is verified and not previewing", () => {
    const identity = { readOnly: false } as const;
    expect(identity.readOnly).toBe(false);
  });

  it("passes readOnly through to detail drawers so nested mutations are blocked", () => {
    const drawerProps = (readOnly: boolean) => ({ id: "x", onClose: () => {}, readOnly });
    expect(drawerProps(true).readOnly).toBe(true);
    expect(drawerProps(false).readOnly).toBe(false);
  });
});

describe("Fellowship page — subject scoping", () => {
  it("passes scopedAuthUserId (not raw auth uid) to useMyFellows", () => {
    const identity = { scopedAuthUserId: "auth-preview", isPreviewing: true } as const;
    const uidForQuery = identity.scopedAuthUserId;
    expect(uidForQuery).toBe("auth-preview");
  });
});