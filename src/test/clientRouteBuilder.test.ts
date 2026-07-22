import { describe, expect, it } from "vitest";
import {
  buildClientDetailHref,
  buildClientDetailHrefFromCandidates,
} from "@/lib/os/reporting/clientRouteBuilder";

/**
 * Phase 1c: every visible client action on Clinical / BCBA / RBT / Reports
 * surfaces routes through this helper. These tests pin the contract so future
 * refactors cannot silently reintroduce dead links or synthetic routes.
 */
describe("buildClientDetailHref", () => {
  const uuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  it("routes canonical UUIDs to the internal detail page", () => {
    expect(buildClientDetailHref(uuid)).toBe(`/clients/${uuid}`);
    // uppercase still resolves
    expect(buildClientDetailHref(uuid.toUpperCase())).toBe(
      `/clients/${uuid.toUpperCase()}`,
    );
  });

  it("routes CentralReach ids through the resolver alias", () => {
    expect(buildClientDetailHref("123456")).toBe("/clients/cr/123456");
  });

  it("percent-encodes CR ids that contain URL-unsafe characters", () => {
    expect(buildClientDetailHref("abc/def")).toBe("/clients/cr/abc%2Fdef");
    expect(buildClientDetailHref("id with spaces")).toBe(
      "/clients/cr/id%20with%20spaces",
    );
  });

  it("returns null for the synthetic canon: name-key ids", () => {
    expect(buildClientDetailHref("canon:jane-doe")).toBeNull();
    expect(buildClientDetailHref("CANON:jane doe")).toBeNull();
    expect(buildClientDetailHref("name:jane-doe")).toBeNull();
  });

  it("returns null for empty, whitespace-only, null, or undefined ids", () => {
    expect(buildClientDetailHref("")).toBeNull();
    expect(buildClientDetailHref("   ")).toBeNull();
    expect(buildClientDetailHref(null)).toBeNull();
    expect(buildClientDetailHref(undefined)).toBeNull();
  });

  it("rejects the loose 36-char strings the old MyClients regex accepted", () => {
    // "------------------------------------" is 36 chars but not a real UUID.
    expect(buildClientDetailHref("-".repeat(36))).toBe(
      `/clients/cr/${encodeURIComponent("-".repeat(36))}`,
    );
    // Bogus but 36-char: falls through to the CR alias (never to /clients/:uuid)
    // which is the correct safe default — the redirect will resolve or 404.
    const bogus = "abcdefabcdefabcdefabcdefabcdefabcdef";
    expect(buildClientDetailHref(bogus)).toBe(`/clients/cr/${bogus}`);
  });
});

describe("buildClientDetailHrefFromCandidates", () => {
  const uuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  it("prefers the first resolvable candidate", () => {
    expect(
      buildClientDetailHrefFromCandidates("canon:jane", uuid, "12345"),
    ).toBe(`/clients/${uuid}`);
  });

  it("falls back to CR alias when no UUID is available", () => {
    expect(
      buildClientDetailHrefFromCandidates(null, "canon:jane", "cr-42"),
    ).toBe("/clients/cr/cr-42");
  });

  it("returns null when nothing is resolvable", () => {
    expect(
      buildClientDetailHrefFromCandidates(null, undefined, "", "canon:x"),
    ).toBeNull();
  });
});