import type { OSRole } from "@/lib/os/permissions";

export type AiRole = "user" | "assistant" | "system";
export type AiMode = "ask" | "summarize" | "draft" | "search";

export interface AiMessage {
  id: string;
  role: AiRole;
  content: string;
  createdAt: string;
  sources?: AiSource[];
  suggestedActions?: AiAction[];
  recordsAccessed?: string[];
}

export interface AiSource {
  id: string;
  title: string;
  category: KBCategory;
  sourceType: string;
  sourceId?: string;
  url?: string;
  snippet?: string;
  similarity?: number;
  /** Inline citation number that appears as [n] in the assistant message. */
  number?: number;
}

export type AiActionKind =
  | "create_task"
  | "draft_message"
  | "open_workflow"
  | "open_record"
  | "generate_report"
  | "schedule_followup"
  | "escalate";

export interface AiAction {
  id: string;
  kind: AiActionKind;
  label: string;
  to?: string;
  payload?: Record<string, unknown>;
}

export interface AiConversation {
  id: string;
  title: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
  messages: AiMessage[];
}

export type KBCategory =
  | "sop"
  | "training"
  | "insurance"
  | "state"
  | "workflow"
  | "policy"
  | "terminology"
  | "role"
  | "faq"
  | "directory";

export interface KBEntry {
  id: string;
  category: KBCategory;
  title: string;
  content: string;
  sourceType: string;
  sourceId?: string;
  updatedAt: string;
  roles?: OSRole[];
  tags?: string[];
}

export interface AiInsight {
  id: string;
  title: string;
  detail: string;
  severity: "info" | "watch" | "risk";
  module?: string;
}

export interface AskBlossomContext {
  module?: string;
  recordRefs?: { kind: string; id: string; label: string }[];
  mode?: AiMode;
}

export interface AskBlossomResponse {
  content: string;
  sources: AiSource[];
  suggestedActions: AiAction[];
  recordsAccessed: string[];
}
