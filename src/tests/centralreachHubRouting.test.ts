import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const APP = fs.readFileSync(path.resolve(__dirname, "../App.tsx"), "utf8");

describe("CentralReach Data Hub routing", () => {
  it("mounts the unified hub at /system/centralreach", () => {
    expect(APP).toMatch(/path="\/system\/centralreach"[^>]*CentralReachHub/);
  });

  it("redirects every legacy upload route into a hub tab", () => {
    const legacy = [
      "/system/centralreach-uploads",
      "/system/bcba-productivity-uploads",
      "/system/authorization-uploads",
      "/system/cancellation-uploads",
      "/admin/centralreach-sync",
    ];
    for (const p of legacy) {
      const re = new RegExp(`path="${p.replace(/\//g, "\\/")}"[^>]*Navigate to="\\/system\\/centralreach\\?tab=`);
      expect(APP, `expected ${p} to redirect to /system/centralreach?tab=…`).toMatch(re);
    }
  });

  it("guards the intake CentralReach Packet Prep route", () => {
    expect(APP).toMatch(/path="\/intake\/cr-packet-prep"[\s\S]*?PermissionRoute[\s\S]*?CentralReachPacketPrep/);
  });

  it("gates the hub behind AdminRoute", () => {
    expect(APP).toMatch(/path="\/system\/centralreach"[\s\S]*?AdminRoute[\s\S]*?CentralReachHub/);
  });
});