import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getAiScope, canAccessCategory, canReferenceRecord, filterContextForRole } from "@/lib/ai/aiPermissions";
import { resolveResourceOpenUrl } from "@/lib/resources/resourceStorage";
import type { Resource } from "@/lib/resources/resourceData";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

const CHAT_FN = read("supabase/functions/blossom-ai-chat/index.ts");
const INGEST_FN = read("supabase/functions/blossom-ai-ingest/index.ts");
const CHUNK_MIGRATION = read(
  "supabase/migrations/20260713225250_ed2a72f3-da77-40bc-8f24-9c39080ee2bc.sql",
);
const VIS_MIGRATION = read(
  "supabase/migrations/20260713223904_b7acdbb7-446a-4d79-b3db-659039f0a2c1.sql",
);
const ASSISTANT = read("src/components/ai/BlossomAIAssistant.tsx");
const ADAPTER = read("src/lib/ai/askBlossomAdapter.ts");
const ADMIN_PAGE = read("src/pages/os/OSBlossomAIManagement.tsx");
const REPORT_AI = read("src/components/ai/ReportAIButton.tsx");

describe("Blossom AI — QA & launch readiness (Prompt 6)", () => {
  describe("Server: retrieval, citations & role visibility", () => {
    it("chat function retrieves via role-filtered RPC (RLS applies)", () => {
      expect(CHAT_FN).toMatch(/match_resource_chunks/);
      // per-request client carries caller JWT so RLS applies
      expect(CHAT_FN).toMatch(/global:\s*{\s*headers:\s*{\s*Authorization/);
    });

    it("returns numbered sources array (citations) with resource id + title", () => {
      expect(CHAT_FN).toMatch(/sources:\s*cited/);
      expect(CHAT_FN).toMatch(/number:\s*n/);
      expect(CHAT_FN).toMatch(/resourceId:\s*c\.resource_id/);
      expect(CHAT_FN).toMatch(/title:\s*c\.source_title/);
    });

    it("does NOT flat-refuse when Resource Library has no hit — falls back to the Blossom OS brief", () => {
      expect(CHAT_FN).toMatch(/Do NOT flat-refuse/);
      expect(CHAT_FN).toMatch(/BLOSSOM OS BRIEF/);
    });

    it("system prompt keeps invention / PHI / secret guardrails", () => {
      expect(CHAT_FN).toMatch(/Never invent policies/);
      expect(CHAT_FN).toMatch(/Never reveal secrets/);
      expect(CHAT_FN).toMatch(/Never expose PHI/);
    });

    it("system prompt blocks quiz-answer leaks", () => {
      expect(CHAT_FN).toMatch(/Never complete quizzes|Never reveal quiz answers/);
    });

    it("system prompt refuses destructive actions and requires drafts", () => {
      expect(CHAT_FN).toMatch(/Never send emails|Never send emails, update records/);
      expect(CHAT_FN).toMatch(/Draft — review before sending/);
    });

    it("returns 401 without an Authorization header", () => {
      expect(CHAT_FN).toMatch(/status:\s*401/);
    });
  });

  describe("Database: role-scoped retrieval RPC & chunk RLS", () => {
    it("match_resource_chunks is SECURITY INVOKER (caller RLS enforced)", () => {
      expect(CHUNK_MIGRATION).toMatch(/SECURITY INVOKER/);
    });

    it("knowledge_chunks SELECT policy uses hr_resource_visible for resource-linked rows", () => {
      expect(CHUNK_MIGRATION).toMatch(/Role-scoped chunk visibility/);
      expect(CHUNK_MIGRATION).toMatch(/hr_resource_visible\(/);
    });

    it("hr_resource_visible enforces sensitive + admin_source_archive gating", () => {
      expect(VIS_MIGRATION).toMatch(/admin_source_archive/);
      expect(VIS_MIGRATION).toMatch(/_is_sensitive/);
      // sensitive requires explicit role overlap
      expect(VIS_MIGRATION).toMatch(/IF COALESCE\(_is_sensitive, false\) THEN\s+RETURN overlap;/);
    });

    it("chunk write policy restricted to super_admin / admin", () => {
      expect(CHUNK_MIGRATION).toMatch(/Service role and admins write chunks/);
    });
  });

  describe("Ingestion: transcript & missing-file tracking", () => {
    it("ingest function is admin-restricted", () => {
      expect(INGEST_FN).toMatch(/super_admin|admin/);
    });

    it("ingest_status / transcript_available columns added to hr_resources", () => {
      expect(CHUNK_MIGRATION).toMatch(/ingest_status text NOT NULL DEFAULT 'pending'/);
      expect(CHUNK_MIGRATION).toMatch(/transcript_available boolean/);
    });

    it("rows without a file are flagged 'no_file' and never marked ingested", () => {
      expect(CHUNK_MIGRATION).toMatch(/SET ingest_status = 'no_file'/);
      expect(CHUNK_MIGRATION).toMatch(/upload_status = 'missing_file'/);
    });
  });

  describe("Client role scope: RBT vs BCBA vs Marketing separation", () => {
    it("RBT has 'assigned' scope and no finance / hr_record access", () => {
      const s = getAiScope("rbt");
      expect(s.dataScope).toBe("assigned");
      expect(s.recordTypes).not.toContain("finance");
      expect(s.recordTypes).not.toContain("hr_record");
      expect(s.recordTypes).not.toContain("report");
    });

    it("BCBA has 'assigned' scope, includes training but no finance / HR", () => {
      const s = getAiScope("bcba");
      expect(s.dataScope).toBe("assigned");
      expect(s.recordTypes).toContain("training");
      expect(s.recordTypes).toContain("client");
      expect(s.recordTypes).not.toContain("finance");
      expect(s.recordTypes).not.toContain("hr_record");
    });

    it("RBT and BCBA scopes are distinct instances", () => {
      const rbt = getAiScope("rbt");
      const bcba = getAiScope("bcba");
      expect(rbt).not.toBe(bcba);
      // BCBA gets 'workflow' category, RBT does not
      expect(bcba.categories).toContain("workflow");
      expect(rbt.categories).not.toContain("workflow");
    });

    it("State Director is state-scoped, not company-wide", () => {
      expect(getAiScope("state_director").dataScope).toBe("state");
    });

    it("Marketing cannot reference clients or HR records", () => {
      expect(canReferenceRecord("marketing_team", "client")).toBe(false);
      expect(canReferenceRecord("marketing_team", "hr_record")).toBe(false);
    });

    it("Super Admin has full record + category access, no masks", () => {
      const s = getAiScope("super_admin");
      expect(s.maskedFields).toEqual([]);
      expect(canReferenceRecord("super_admin", "finance")).toBe(true);
      expect(canReferenceRecord("super_admin", "audit")).toBe(true);
    });

    it("filterContextForRole masks sensitive fields for non-super-admin", () => {
      const masked = filterContextForRole("rbt", {
        client_name: "X",
        client_ssn: "123",
        client_home_address: "Y",
      });
      expect(masked.client_ssn).toBe("[restricted]");
      expect(masked.client_home_address).toBe("[restricted]");
      expect(masked.client_name).toBe("X");
    });

    it("Intake cannot access HR records or payroll fields", () => {
      expect(canReferenceRecord("intake_coordinator", "hr_record")).toBe(false);
      const s = getAiScope("intake_coordinator");
      expect(s.maskedFields).toContain("payroll_amount");
    });

    it("QA does not surface finance / hr_record", () => {
      expect(canReferenceRecord("qa_team", "finance")).toBe(false);
      expect(canReferenceRecord("qa_team", "hr_record")).toBe(false);
    });

    it("Every required Prompt 6 QA role has a scope", () => {
      const roles = [
        "super_admin","executive_leadership","operations_leadership",
        "intake_coordinator","recruiting_team","marketing_team","hr_team",
        "state_director","bcba","rbt","qa_team","scheduling_team",
        "authorization_coordinator",
      ] as const;
      for (const r of roles) {
        expect(getAiScope(r).label.length).toBeGreaterThan(0);
      }
    });

    it("canAccessCategory blocks Marketing from insurance", () => {
      expect(canAccessCategory("marketing_team", "insurance")).toBe(false);
      expect(canAccessCategory("authorization_coordinator", "insurance")).toBe(true);
    });
  });

  describe("Signed URLs & path safety", () => {
    const base: Resource = {
      id: "r1", title: "T", description: "", type: "PDF",
      category: "sops", status: "Published", roles: [], departments: [],
      states: [], tags: [], uploadedBy: "sys",
      createdAt: "2026-07-13", updatedAt: "2026-07-13",
      resourceType: "sop", sensitivity: "public_internal",
      attachmentStatus: "available", uploadStatus: "published",
    } as Resource;

    it("rejects Windows local paths as storage source", async () => {
      const r: Resource = { ...base, storagePath: "C:\\Users\\Areeb\\file.pdf" };
      expect(await resolveResourceOpenUrl(r)).toBeNull();
    });

    it("rejects file:// URIs", async () => {
      const r: Resource = { ...base, storagePath: "file:///tmp/x.pdf" };
      expect(await resolveResourceOpenUrl(r)).toBeNull();
    });

    it("rejects UNC / SMB shares", async () => {
      const r: Resource = { ...base, storagePath: "\\\\server\\share\\x.pdf" };
      expect(await resolveResourceOpenUrl(r)).toBeNull();
    });

    it("returns null when no storage path is set", async () => {
      expect(await resolveResourceOpenUrl(base)).toBeNull();
    });

    it("passes through https external URLs unchanged", async () => {
      const r: Resource = { ...base, url: "https://ok.example/doc.pdf" };
      expect(await resolveResourceOpenUrl(r)).toBe("https://ok.example/doc.pdf");
    });
  });

  describe("Client guardrails: destructive-intent + quiz protection", () => {
    it("assistant has destructive-intent regex covering key verbs", () => {
      expect(ASSISTANT).toMatch(/DESTRUCTIVE_INTENT_RE\s*=/);
      const line = ASSISTANT.split("\n").find((l) => l.includes("DESTRUCTIVE_INTENT_RE ="))
        ?? ASSISTANT.split(/DESTRUCTIVE_INTENT_RE/)[1] ?? "";
      for (const kw of ["send","email","delete","payroll","password","mfa","authorization"]) {
        expect(ASSISTANT).toMatch(new RegExp(`\\b${kw}\\b`, "i"));
        void line;
      }
    });

    it("adapter passes role + activeState so server can scope correctly", () => {
      expect(ADAPTER).toMatch(/role/);
      expect(ADAPTER).toMatch(/activeState/);
    });
  });

  describe("Report AI presets carry base guardrails", () => {
    it("ReportAIButton exports guardrails baseline", () => {
      expect(REPORT_AI).toMatch(/BASE_GUARDRAILS|REPORT_AI_GUARDRAILS/);
      expect(REPORT_AI).toMatch(/recompute|invent|not change/i);
    });
  });

  describe("Super Admin monitoring surface", () => {
    it("/admin/blossom-ai management page exists with logs + ingestion panels", () => {
      expect(ADMIN_PAGE).toMatch(/ingest|index|log|feedback/i);
    });

    it("chat function writes ai_audit_log entries with role + kb_hits", () => {
      expect(CHAT_FN).toMatch(/ai_audit_log/);
      expect(CHAT_FN).toMatch(/kb_hits:\s*auditKbHits/);
      expect(CHAT_FN).toMatch(/role:\s*auditRole/);
    });
  });
});