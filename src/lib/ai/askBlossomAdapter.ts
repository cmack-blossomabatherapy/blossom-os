import type { OSRole } from "@/lib/os/permissions";
import { searchKnowledge } from "./knowledgeBase";
import { getAiScope } from "./aiPermissions";
import type { AiAction, AiSource, AskBlossomContext, AskBlossomResponse } from "./types";
import { supabase } from "@/integrations/supabase/client";
import type { KBCategory } from "./types";

/**
 * Mock Operational Insights adapter. Intent-routes the prompt to a canned operational
 * answer, role-scopes the response, and returns sources + suggested actions in
 * the same shape the real model adapter will use later.
 */

interface Intent {
  match: RegExp;
  build: (role: OSRole, state: string) => Pick<AskBlossomResponse, "content" | "suggestedActions" | "recordsAccessed">;
}

const ACT = (id: string, kind: AiAction["kind"], label: string, to?: string): AiAction =>
  ({ id, kind, label, to });

const INTENTS: Intent[] = [
  {
    match: /(expir|renew).*(auth|authorization)|auth.*expir/i,
    build: (_r, s) => ({
      content: `**7 authorizations expire in the next 30 days** in ${s}.\n\n- 3 are within 14 days (urgent)\n- 4 have PRs already in progress\n- Top payer at risk: BCBS\n\nWould you like me to open the Authorizations tracker filtered to expiring?`,
      suggestedActions: [
        ACT("a1", "open_workflow", "Open expiring auths", "/authorizations?filter=expiring-30"),
        ACT("a2", "create_task", "Create follow-up task"),
        ACT("a3", "draft_message", "Message auth team"),
      ],
      recordsAccessed: ["authorization:expiring-30"],
    }),
  },
  {
    match: /staffing|coverage|overload|short.?staff/i,
    build: (_r, s) => ({
      content: `**Staffing snapshot — ${s}**\n\n- 4 clients without confirmed RBT coverage this week\n- 2 RBTs over 35h target (review for burnout)\n- 1 BCBA at 110% caseload — flag for State Director\n\nRecommend rebalancing 2 sessions from the float pool.`,
      suggestedActions: [
        ACT("s1", "open_workflow", "Open scheduling board", "/scheduling"),
        ACT("s2", "escalate", "Escalate to State Director"),
      ],
      recordsAccessed: ["schedule:week", "staff:roster"],
    }),
  },
  {
    match: /summar.*state|state.*summary|summar.*my state|summar.*operations/i,
    build: (_r, s) => ({
      content: `**${s} operations — this week**\n\n- Active clients: 41 (▲ 2)\n- Active BCBAs: 12 / RBTs: 38\n- Open intake leads: 9 (3 stalled >5d)\n- Auths expiring 30d: 7 · Overdue PRs: 2\n- Supervision compliance: 88% (target 90%)\n- Top risk: parent-training (97156) gaps on 4 clients\n\nNothing critical, two items worth attention today.`,
      suggestedActions: [
        ACT("ss1", "generate_report", "Export weekly summary"),
        ACT("ss2", "open_workflow", "Open Reports", "/reports"),
      ],
      recordsAccessed: ["kpi:weekly", "report:state-summary"],
    }),
  },
  {
    match: /97156|parent.?training/i,
    build: () => ({
      content: `**4 clients are missing 97156 (parent training) this month.**\n\nMost common reason: parent cancelations. Two were rescheduled, two need outreach.\n\nReminder: most payers require monthly 97156 — missing sessions risk re-auth denials.`,
      suggestedActions: [
        ACT("p1", "draft_message", "Draft parent outreach"),
        ACT("p2", "create_task", "Schedule 97156 sessions"),
      ],
      recordsAccessed: ["client:97156-gap"],
    }),
  },
  {
    match: /stuck.*lead|stalled.*lead|lead.*stuck/i,
    build: () => ({
      content: `**3 leads have been stalled longer than 5 days:**\n\n1. Lead #2041 — awaiting VOB result (Anthem)\n2. Lead #2047 — intake packet not returned\n3. Lead #2052 — diagnostic report missing\n\nAll three are within SLA recovery window. Recommend a same-day call attempt.`,
      suggestedActions: [
        ACT("l1", "draft_message", "Draft follow-up email"),
        ACT("l2", "open_workflow", "Open Intake board", "/intake"),
      ],
      recordsAccessed: ["lead:stalled-5d"],
    }),
  },
  {
    match: /stuck.*client|client.*stuck|pipeline/i,
    build: () => ({
      content: `**5 clients are currently stuck in the pipeline:**\n\n- 2 awaiting auth approval (>10 days)\n- 2 awaiting scheduling onboarding\n- 1 awaiting diagnostic upload\n\nNone are blocked on Blossom-side work for the diagnostic case.`,
      suggestedActions: [ACT("c1", "open_workflow", "Open Clients", "/clients") ],
      recordsAccessed: ["client:pipeline-stuck"],
    }),
  },
  {
    match: /overdue.*pr|pr.*overdue|progress report/i,
    build: (_r, s) => ({
      content: `**2 progress reports overdue in ${s}:**\n\n- PR for Client #1188 — 4 days late (BCBA: K. Brown)\n- PR for Client #1207 — 1 day late (BCBA: J. Patel)\n\nBoth re-auth windows still recoverable if submitted within 5 business days.`,
      suggestedActions: [
        ACT("pr1", "create_task", "Assign PR follow-ups"),
        ACT("pr2", "draft_message", "Message BCBAs"),
      ],
      recordsAccessed: ["pr:overdue"],
    }),
  },
  {
    match: /vob|verification of benefits/i,
    build: () => ({
      content: `**VOB process — quick walkthrough:**\n\n1. Confirm payer + member ID\n2. Run eligibility (real-time or payer portal)\n3. Capture deductible, OOP max, copay, coinsurance\n4. Document auth requirements & supervision ratios\n5. Post decision in VOB Decision Center\n6. Escalate ambiguous payers to the Auth Lead\n\nFull SOP lives in the SOP Library.`,
      suggestedActions: [
        ACT("v1", "open_workflow", "Open VOB Decision Center", "/vob-decision-center"),
        ACT("v2", "open_record", "View full SOP", "/resource-library"),
      ],
      recordsAccessed: ["sop:vob"],
    }),
  },
  {
    match: /who.*(handle|run|own|lead).*(georgia|ga\b|nc\b|north carolina|virginia|va\b|scheduling|auth|qa)/i,
    build: () => ({
      content: `Here are the leads I'm aware of:\n\n- **GA Scheduling:** Tasha Owens · ext 1305 · tasha.owens@blossomaba.com\n- **GA State Director:** Kayla Brown · ext 1042\n- **NC State Director:** Marcus Hill · ext 1051\n- **VA Authorizations:** Jordan Lee · ext 1208\n- **QA Director:** Renee Patel · ext 1100`,
      suggestedActions: [ACT("d1", "draft_message", "Draft message") ],
      recordsAccessed: ["directory"],
    }),
  },
  {
    match: /pto|time off/i,
    build: () => ({
      content: "**PTO request process:** HR Suite > Time Off > New Request. Approval routes to your supervisor and triggers scheduling coverage planning.",
      suggestedActions: [ACT("h1", "open_workflow", "Open HR Suite", "/hr") ],
      recordsAccessed: ["sop:pto"],
    }),
  },
  {
    match: /session note/i,
    build: () => ({
      content: "**Submitting a session note:** open the session from your calendar > Notes tab > complete required fields > sign > Submit. Must be submitted within 24h.",
      suggestedActions: [],
      recordsAccessed: ["sop:session-note"],
    }),
  },
];

function fallback(prompt: string, role: OSRole): AskBlossomResponse {
  const hits = searchKnowledge(prompt, role, 3);
  if (hits.length > 0) {
    return {
      content: `Here's what I found in the knowledge base:\n\n${hits.map((h, i) => `**${i + 1}. ${h.title}**\n${h.content}`).join("\n\n")}`,
      sources: hits.map((h): AiSource => ({
        id: h.id, title: h.title, category: h.category, sourceType: h.sourceType, sourceId: h.sourceId,
      })),
      suggestedActions: [],
      recordsAccessed: hits.map((h) => `kb:${h.id}`),
    };
  }
  return {
    content: "I don't have a confident answer for that yet. Try rephrasing, or pick one of the suggested prompts. Once the live AI layer is connected I'll pull from your live records.",
    sources: [], suggestedActions: [], recordsAccessed: [],
  };
}

/** Streaming mock — yields tokens with small delay to simulate a model. */
export async function* streamMockAnswer(
  prompt: string,
  role: OSRole,
  state: string,
  _ctx?: AskBlossomContext,
): AsyncGenerator<string, AskBlossomResponse, void> {
  const intent = INTENTS.find((i) => i.match.test(prompt));
  const built = intent ? intent.build(role, state) : null;
  const hits = searchKnowledge(prompt, role, 4);
  const baseSources: AiSource[] = hits.map((h) => ({
    id: h.id, title: h.title, category: h.category, sourceType: h.sourceType, sourceId: h.sourceId,
  }));

  const result: AskBlossomResponse = built
    ? { content: built.content, sources: baseSources, suggestedActions: built.suggestedActions, recordsAccessed: built.recordsAccessed }
    : fallback(prompt, role);

  // Stream the content word-by-word
  const words = result.content.split(/(\s+)/);
  for (const w of words) {
    yield w;
    // tiny delay so the UI feels alive
    await new Promise((res) => setTimeout(res, 12));
  }
  return result;
}

/** Non-streaming variant for the inline page embed. */
export async function askBlossomOnce(
  prompt: string,
  role: OSRole,
  state: string,
  ctx?: AskBlossomContext,
): Promise<AskBlossomResponse> {
  const gen = streamMockAnswer(prompt, role, state, ctx);
  // drain
  // eslint-disable-next-line no-empty
  while (!(await gen.next()).done) {}
  // re-run to retrieve return value
  const intent = INTENTS.find((i) => i.match.test(prompt));
  const built = intent ? intent.build(role, state) : null;
  const hits = searchKnowledge(prompt, role, 4);
  const baseSources: AiSource[] = hits.map((h) => ({
    id: h.id, title: h.title, category: h.category, sourceType: h.sourceType, sourceId: h.sourceId,
  }));
  return built
    ? { content: built.content, sources: baseSources, suggestedActions: built.suggestedActions, recordsAccessed: built.recordsAccessed }
    : fallback(prompt, role);
}

/**
 * @deprecated Removed — the Ask Blossom AI page now uses real, role-scoped queries via
 * `useBlossomAiInsights`. Do not reintroduce mock insights.
 */

/* ============================================================================
 * Live Insights adapter — wires the UI to the `chat` edge function
 * (Lovable AI Gateway with role-aware tool calling).
 * ========================================================================== */

interface ChatFnSource {
  title: string;
  url?: string;
  tool?: string;
  snippet?: string;
  similarity?: number;
  category?: string;
  resourceId?: string | null;
  number?: number;
  department?: string | null;
  type?: string | null;
}

interface ChatFnResponse {
  conversationId?: string;
  messageId?: string;
  content: string;
  tools_used?: string[];
  sources?: ChatFnSource[];
  logId?: string | null;
  error?: string;
}

function toolToCategory(tool?: string): KBCategory {
  switch (tool) {
    case "search_hr_resources": return "policy";
    case "search_training_courses": return "training";
    case "search_employees": return "directory";
    case "search_knowledge_base": return "sop";
    case "get_my_trainings": return "training";
    case "get_my_profile": return "directory";
    default: return "faq";
  }
}

function sourcesFromChat(items: ChatFnSource[] | undefined): AiSource[] {
  if (!items?.length) return [];
  return items.slice(0, 8).map((s, i) => ({
    id: s.resourceId ?? `src-${i}-${s.title.slice(0, 20)}`,
    title: s.title,
    category: toolToCategory(s.tool),
    sourceType: s.tool ?? (s.resourceId ? "resource" : "knowledge"),
    sourceId: s.resourceId ?? undefined,
    url: s.url,
    snippet: s.snippet,
    similarity: s.similarity,
  }));
}

/**
 * Streaming adapter that calls the `chat` edge function and progressively
 * reveals the returned answer to the UI. The edge function is non-streaming,
 * so we simulate token reveal locally for a calm, responsive feel.
 */
export async function* streamAskBlossom(
  prompt: string,
  role: OSRole,
  state: string,
  conversationId?: string,
): AsyncGenerator<string, AskBlossomResponse & { conversationId?: string; logId?: string | null }, void> {
  try {
    // Prefer the role-aware RAG endpoint that filters by Resource Library
    // visibility. Fall back to the legacy tool-calling `chat` function if the
    // new one isn't reachable (e.g. still deploying).
    let data: ChatFnResponse | null = null;
    let error: { message?: string } | null = null;
    const primary = await supabase.functions.invoke<ChatFnResponse>("blossom-ai-chat", {
      body: { message: prompt, role, activeState: state, conversationId },
    });
    if (primary.error || !primary.data || primary.data.error) {
      const fallback = await supabase.functions.invoke<ChatFnResponse>("chat", {
        body: { message: prompt, conversationId },
      });
      data = fallback.data ?? null;
      error = fallback.error ?? null;
    } else {
      data = primary.data;
    }

    if (error) {
      const msg = error.message ?? "AI is unavailable right now.";
      for (const w of msg.split(/(\s+)/)) {
        yield w;
        await new Promise((r) => setTimeout(r, 8));
      }
      return { content: msg, sources: [], suggestedActions: [], recordsAccessed: [] };
    }

    if (!data || data.error) {
      const msg = data?.error ?? "AI returned an empty response.";
      for (const w of msg.split(/(\s+)/)) {
        yield w;
        await new Promise((r) => setTimeout(r, 8));
      }
      return { content: msg, sources: [], suggestedActions: [], recordsAccessed: [] };
    }

    const content = data.content ?? "";
    const sources = sourcesFromChat(data.sources);

    // Word-by-word reveal so the chat feels alive even though the API is sync.
    const words = content.split(/(\s+)/);
    for (const w of words) {
      yield w;
      await new Promise((r) => setTimeout(r, 6));
    }

    return {
      content,
      sources,
      suggestedActions: [],
      recordsAccessed: (data.tools_used ?? []).map((t) => `tool:${t}`),
      conversationId: data.conversationId,
      logId: data.logId ?? null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed.";
    yield msg;
    return { content: msg, sources: [], suggestedActions: [], recordsAccessed: [] };
  }
  // role/state are intentionally available for future scoping in the edge function.
  void role;
  void state;
}
