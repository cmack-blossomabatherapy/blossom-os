import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Authorizations Pass 7 — /auth-workspace deep links resolve outside visible queue", () => {
  const ws = read("src/pages/os/OSAuthWorkspace.tsx");

  it("drawer resolution uses the full AUTHS source list, not visible.find(...)", () => {
    expect(ws).toMatch(/openAuth\s*=\s*openId\s*\?\s*AUTHS\.find/);
    // guard against regressions
    expect(ws).not.toMatch(/openAuth\s*=\s*visible\.find/);
  });

  it("supports both authId and overlayId query params on init and effect", () => {
    expect(ws).toMatch(/searchParams\.get\("authId"\)\s*\?\?\s*searchParams\.get\("overlayId"\)/);
  });

  it("closing drawer clears both authId and overlayId from the URL", () => {
    expect(ws).toMatch(/next\.delete\("authId"\)/);
    expect(ws).toMatch(/next\.delete\("overlayId"\)/);
  });

  it("shows an out-of-view banner with clear filters / show-all actions", () => {
    expect(ws).toMatch(/openIsOutsideView/);
    expect(ws).toMatch(/Opened from link\. This authorization is outside your current queue or filters\./);
    expect(ws).toMatch(/Clear filters/);
    expect(ws).toMatch(/Show in all authorizations/);
  });
});

describe("Authorizations Pass 7 — no hardcoded /os/authorizations in active code", () => {
  const ROOT = resolve(process.cwd(), "src");
  const EXEMPT = new Set(["src/routes/legacyRoutes.tsx"]);

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      const s = statSync(p);
      if (s.isDirectory()) walk(p, out);
      else if (/\.(t|j)sx?$/.test(entry)) out.push(p);
    }
    return out;
  }

  it("no /os/authorizations occurrences outside the legacy redirect file and test suite", () => {
    const offenders: string[] = [];
    for (const abs of walk(ROOT)) {
      const rel = abs.slice(ROOT.length - 3).replace(/\\/g, "/");
      if (EXEMPT.has(rel)) continue;
      // Skip test files — they intentionally reference the string.
      if (/\/test\//.test(rel) || /\.test\./.test(rel)) continue;
      const body = readFileSync(abs, "utf8");
      if (body.includes("/os/authorizations")) offenders.push(rel);
    }
    expect(offenders, `stale /os/authorizations links: ${offenders.join(", ")}`).toEqual([]);
  });

  it("AuthorizationReportViews.tsx does not link to /os/authorizations", () => {
    const t = read("src/components/reports/AuthorizationReportViews.tsx");
    expect(t).not.toMatch(/\/os\/authorizations/);
    // still links to the canonical dashboard
    expect(t).toMatch(/to=\{`?\/authorizations`?\}/);
  });
});

describe("Authorizations Pass 7 — Payer Requirements → filtered Authorizations", () => {
  const pr = read("src/pages/os/operations/PayerRequirements.tsx");

  it("includes a 'View Matching Auths' row action that deep-links with payor + state", () => {
    expect(pr).toMatch(/View Matching Auths/);
    expect(pr).toMatch(/payor/);
    expect(pr).toMatch(/to=\{`\/authorizations\?\$\{qs\.toString\(\)\}`\}/);
  });
});

describe("Authorizations Pass 7 — /authorizations honors payer/payor + filter param sync", () => {
  const a = read("src/pages/os/OSAuthorizations.tsx");

  it("initial state accepts both payer and payor query params", () => {
    expect(a).toMatch(/searchParams\.get\("payor"\)\s*\?\?\s*searchParams\.get\("payer"\)/);
  });

  it("param-change effect reapplies state/payor/coordinator filters", () => {
    expect(a).toMatch(/nextPayor\s*=\s*searchParams\.get\("payor"\)\s*\?\?\s*searchParams\.get\("payer"\)/);
    expect(a).toMatch(/setFilters\(\(f\) => \(\{[\s\S]*state: nextState[\s\S]*payor: nextPayor[\s\S]*coordinator: nextCoord/);
  });
});

describe("Authorizations Pass 7 — Missing Docs urgency + overlay-aware Open Auth", () => {
  const md = read("src/pages/os/operations/MissingDocs.tsx");

  it("has urgency bucketing logic covering past due / today / week / no date / completed", () => {
    expect(md).toMatch(/function urgencyOf/);
    expect(md).toMatch(/past_due/);
    expect(md).toMatch(/due_today/);
    expect(md).toMatch(/due_this_week/);
    expect(md).toMatch(/no_date/);
    expect(md).toMatch(/completed/);
  });

  it("renders visible urgency badges and quick-filter buckets", () => {
    expect(md).toMatch(/URGENCY_LABEL/);
    expect(md).toMatch(/URGENCY_STYLE/);
    expect(md).toMatch(/buckets=\{\[/);
  });

  it("Open Auth still sends both authId and overlayId", () => {
    expect(md).toMatch(/authId=\$\{encodeURIComponent\(String\(r\.authorization_id\)\)\}&overlayId=\$\{encodeURIComponent\(String\(r\.authorization_id\)\)\}/);
  });

  it("Received / Waived / Delete actions surface errors via toast and confirm success", () => {
    expect(md).toMatch(/toast\.success\("Marked as received"\)/);
    expect(md).toMatch(/toast\.success\("Requirement waived"\)/);
    expect(md).toMatch(/toast\.error/);
  });
});

describe("Authorizations Pass 7 — /auth-workspace right rail is derived, not fake", () => {
  const ws = read("src/pages/os/OSAuthWorkspace.tsx");

  it("no hardcoded fake counts remain in the right rail", () => {
    expect(ws).not.toMatch(/3 auths need PR follow-up/);
    expect(ws).not.toMatch(/2 cases require State Director escalation/);
    expect(ws).not.toMatch(/1 reassessment is waiting on treatment plan from QA/);
  });

  it("Operational Signals are derived from the live auth list", () => {
    expect(ws).toMatch(/Operational Signals/);
    expect(ws).toMatch(/guidanceRows/);
    expect(ws).toMatch(/expiringSoon/);
    expect(ws).toMatch(/missingDocsCount/);
  });

  it("provides an honest empty state when there are no live auths", () => {
    expect(ws).toMatch(/No matching authorizations in the current data set/);
    expect(ws).toMatch(/Connect CentralReach or import authorization data/);
  });

  it("Ask Blossom entrypoint is a real link, not an inert input", () => {
    expect(ws).toMatch(/to="\/ai-assistant\?context=authorizations"/);
    // The old inert input placeholder must be gone.
    expect(ws).not.toMatch(/placeholder="Ask about an auth, PR risk, or blocker/);
  });

  it("SOP links route to Resource Library, not /training", () => {
    // At least one SOP anchor still exists…
    expect(ws).toMatch(/PR Escalation Process/);
    // …and no SOP anchor points at /training anymore.
    expect(ws).not.toMatch(/href="\/training"/);
    expect(ws).toMatch(/\/resource-library\?department=Authorizations/);
  });
});

describe("Authorizations Pass 7 — drawer PR tracking clean empty state", () => {
  const ws = read("src/pages/os/OSAuthWorkspace.tsx");

  it("empty state fires when there is no PR request or escalation, even if liveAuth exists", () => {
    expect(ws).toMatch(/if \(!prRequested && !escalated\) \{\s*return <p[^>]*>No PR tracking activity has been logged yet/);
  });
});

describe("Authorizations Pass 7 — Reports remain unified", () => {
  it("no role-specific Authorizations reports route exists", () => {
    const app = read("src/App.tsx");
    expect(app).not.toMatch(/path=\{?["']\/authorizations\/reports["']/);
    expect(app).not.toMatch(/path=\{?["']\/auth-workspace\/reports["']/);
  });
});