import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

/**
 * Regressions for "Blossom OS reloads when returning to the tab".
 * These tests assert source-level guarantees: focus listeners and
 * window.location.reload() calls that caused the visible reload should
 * be gone, and React Query must be configured to NOT refetch on focus.
 */
describe("Tab focus stability", () => {
  it("App.tsx QueryClient disables refetchOnWindowFocus", () => {
    const src = read("src/App.tsx");
    expect(src).toMatch(/new\s+QueryClient\s*\(\s*\{[\s\S]*refetchOnWindowFocus:\s*false/);
  });

  it("AuthContext does not register an unthrottled focus refresh", () => {
    const src = read("src/contexts/AuthContext.tsx");
    expect(src).not.toMatch(/addEventListener\(\s*["']focus["']\s*,\s*refreshAccess/);
    expect(src).not.toMatch(/window\.addEventListener\(\s*["']focus["']/);
  });

  it("AuthContext does not set global loading=true during background focus refresh", () => {
    const src = read("src/contexts/AuthContext.tsx");
    // refreshAccessQuietly must not flip the global loading state.
    const fnMatch = src.match(/refreshAccessQuietly[\s\S]*?backgroundRefreshInFlight\s*=\s*false[\s\S]*?\}\s*\)/);
    const body = fnMatch?.[0] ?? "";
    expect(body).not.toMatch(/setLoading\(\s*true\s*\)/);
  });

  it("ReportsHome does not refresh on window focus", () => {
    const src = read("src/pages/os/reports/ReportsHome.tsx");
    expect(src).not.toMatch(/addEventListener\(\s*["']focus["']\s*,\s*refresh/);
  });

  it("AccessTab no longer reloads the page after link/unlink", () => {
    const src = read("src/components/hr/profile/AccessTab.tsx");
    expect(src).not.toMatch(/window\.location\.reload\(\)/);
  });

  it("OSHROrientationQueue no longer reloads the page after detail change", () => {
    const src = read("src/pages/os/OSHROrientationQueue.tsx");
    expect(src).not.toMatch(/window\.location\.reload\(\)/);
  });
});