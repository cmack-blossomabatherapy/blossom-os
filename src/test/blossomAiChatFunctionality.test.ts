import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Blossom AI — full-system operational copilot", () => {
  const chat = read("supabase/functions/blossom-ai-chat/index.ts");

  it("no longer flat-refuses when Resource Library has no hit", () => {
    // The old prompt started with the hard refuse rule; the new one keeps the
    // Blossom OS brief as a system message so the model can still answer
    // general questions.
    expect(chat).not.toMatch(/Answer ONLY from the provided KNOWLEDGE excerpts/);
    expect(chat).toMatch(/Do NOT flat-refuse/);
  });

  it("always injects the Blossom OS system brief", () => {
    expect(chat).toMatch(/BLOSSOM OS BRIEF/);
    expect(chat).toMatch(/BLOSSOM_SYSTEM_PACK/);
    expect(existsSync(resolve(process.cwd(), "supabase/functions/_shared/blossomSystemPack.ts"))).toBe(true);
  });

  it("exposes read-only operational tools scoped by caller JWT", () => {
    for (const tool of [
      "search_leads",
      "search_clients",
      "search_employees",
      "list_my_tasks",
      "list_my_goals",
      "list_expiring_authorizations",
    ]) {
      expect(chat).toContain(tool);
    }
  });

  it("bounds the tool-calling loop", () => {
    expect(chat).toMatch(/MAX_TOOL_STEPS/);
  });

  it("keeps HIPAA / draft / secret guardrails in the system prompt", () => {
    expect(chat).toMatch(/Never invent policies/);
    expect(chat).toMatch(/Draft — review before sending/);
    expect(chat).toMatch(/Never reveal secrets/);
    expect(chat).toMatch(/Never complete quizzes/);
  });

  it("ships an embedding backfill edge function for super_admin", () => {
    const backfill = read("supabase/functions/blossom-ai-embed-backfill/index.ts");
    expect(backfill).toMatch(/is\("embedding", null\)/);
    expect(backfill).toMatch(/openai\/text-embedding-3-small/);
    expect(backfill).toMatch(/super_admin/);
  });

  it("admin management page exposes the backfill runner", () => {
    const page = read("src/pages/os/OSBlossomAIManagement.tsx");
    expect(page).toMatch(/blossom-ai-embed-backfill/);
    expect(page).toMatch(/Run embedding backfill/);
  });
});
