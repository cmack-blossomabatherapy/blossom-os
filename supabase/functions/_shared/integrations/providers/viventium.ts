import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";

// Viventium adapter. Uses the same cookie-based login flow as viventium-sync.
// Required secrets match the operator setup: username/password + company/division codes.
export const viventiumAdapter: ProviderAdapter = {
  id: "viventium",
  classification: "payroll_hr",
  requiredSecrets: [
    "VIVENTIUM_USERNAME",
    "VIVENTIUM_PASSWORD",
    "VIVENTIUM_COMPANY_CODE",
    "VIVENTIUM_DIVISION_CODE",
  ],
  optionalSecrets: ["VIVENTIUM_BASE_URL"],

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) {
      return {
        ok: false,
        status: "not_configured",
        message: `Missing Viventium secrets: ${need.missing.join(", ")}`,
      };
    }
    const baseUrl = (getEnv("VIVENTIUM_BASE_URL") ?? "https://hcm.viventium.com").replace(/\/+$/, "");
    try {
      const res = await fetch(`${baseUrl}/API/Integration/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: getEnv("VIVENTIUM_USERNAME"),
          Password: getEnv("VIVENTIUM_PASSWORD"),
        }),
      });
      if (!res.ok) {
        return { ok: false, status: "error", message: `Viventium login failed: HTTP ${res.status}` };
      }
      return { ok: true, status: "connected", message: "Viventium login ok" };
    } catch (e) {
      return { ok: false, status: "error", message: e instanceof Error ? e.message : String(e) };
    }
  },

  async sync() {
    // Employee sync is handled by the dedicated viventium-sync edge function.
    return {
      ok: true,
      status: "success",
      message: "Use the Viventium panel (Test Viventium / Preview employee sync) for employee syncs.",
    };
  },

  normalizeWebhook() {
    return { metadata: {} };
  },
};