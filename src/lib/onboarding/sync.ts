import { supabase } from "@/integrations/supabase/client";
import { getOnboardingState, type OnboardingState } from "./storage";

const STORAGE_KEY = "blossom.onboarding.v1";
const EVENT = "blossom:onboarding-change";
const SYNCED_FLAG_KEY = "blossom.onboarding.lastSyncedUser";

type Row = {
  user_id: string;
  completed_steps: string[];
  modules_complete: string[];
  acknowledgements: string[];
  quiz_passed: boolean;
  path: string;
  notes: Record<string, string> | null;
  checkins: { chad?: string[]; shira?: string[] } | null;
  completed_at: string | null;
  certificate_id: string | null;
};

function dispatch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

function writeLocal(state: OnboardingState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  dispatch();
}

function rowToState(row: Row): OnboardingState {
  return {
    completed: (row.completed_steps as OnboardingState["completed"]) || [],
    modules: row.modules_complete || [],
    notes: row.notes || {},
    checkins: { chad: row.checkins?.chad || [], shira: row.checkins?.shira || [] },
    path: row.path === "new_state" ? "new_state" : "existing_state",
    acknowledgements: row.acknowledgements || [],
    quizPassed: row.quiz_passed === true,
    completedAt: row.completed_at || undefined,
    certificateId: row.certificate_id || undefined,
  };
}

/** Server wins for completion fields; otherwise union local + server arrays. */
function mergeStates(local: OnboardingState, server: OnboardingState): OnboardingState {
  const union = (a: string[], b: string[]) => Array.from(new Set([...(a || []), ...(b || [])]));
  return {
    completed: union(local.completed, server.completed) as OnboardingState["completed"],
    modules: union(local.modules, server.modules),
    acknowledgements: union(local.acknowledgements, server.acknowledgements),
    quizPassed: local.quizPassed || server.quizPassed,
    path: server.path || local.path,
    notes: { ...local.notes, ...server.notes },
    checkins: {
      chad: union(local.checkins.chad, server.checkins.chad),
      shira: union(local.checkins.shira, server.checkins.shira),
    },
    completedAt: server.completedAt || local.completedAt,
    certificateId: server.certificateId || local.certificateId,
  };
}

async function pushToServer(userId: string, state: OnboardingState) {
  const payload = {
    user_id: userId,
    completed_steps: state.completed,
    modules_complete: state.modules,
    acknowledgements: state.acknowledgements,
    quiz_passed: state.quizPassed === true,
    path: state.path,
    notes: state.notes ?? {},
    checkins: state.checkins ?? { chad: [], shira: [] },
    completed_at: state.completedAt ?? null,
    certificate_id: state.certificateId ?? null,
  };
  const { error } = await supabase
    .from("onboarding_state")
    .upsert(payload, { onConflict: "user_id" });
  if (error) console.warn("[onboarding] push failed:", error.message);
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushingForUser: string | null = null;

function schedulePush(userId: string) {
  pushingForUser = userId;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushToServer(userId, getOnboardingState());
  }, 400);
}

let detach: (() => void) | null = null;
let currentUserId: string | null = null;
let suppressNextLocalPush = false;

/** Start syncing for the given authed user. Idempotent — call when user changes. */
export async function startOnboardingSync(userId: string) {
  if (currentUserId === userId) return;
  stopOnboardingSync();
  currentUserId = userId;

  // Pull server state and merge with local.
  try {
    const { data, error } = await supabase
      .from("onboarding_state")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle<Row>();
    if (error) throw error;
    const local = getOnboardingState();
    const server = data ? rowToState(data) : null;
    const merged = server ? mergeStates(local, server) : local;
    suppressNextLocalPush = true;
    writeLocal(merged);
    // If local had data the server didn't, push the merged state once.
    if (!server || JSON.stringify(server) !== JSON.stringify(merged)) {
      await pushToServer(userId, merged);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SYNCED_FLAG_KEY, userId);
    }
  } catch (e) {
    console.warn("[onboarding] initial sync failed:", (e as Error).message);
  }

  // Listen to local mutations and push (debounced).
  const onChange = () => {
    if (suppressNextLocalPush) {
      suppressNextLocalPush = false;
      return;
    }
    if (currentUserId) schedulePush(currentUserId);
  };
  if (typeof window !== "undefined") {
    window.addEventListener(EVENT, onChange);
  }

  // Realtime: react to server-side changes (e.g. another device).
  const channel = supabase
    .channel(`onboarding_state:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "onboarding_state", filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as Row | undefined;
        if (!row) return;
        const incoming = rowToState(row);
        const local = getOnboardingState();
        const merged = mergeStates(local, incoming);
        if (JSON.stringify(local) !== JSON.stringify(merged)) {
          suppressNextLocalPush = true;
          writeLocal(merged);
        }
      },
    )
    .subscribe();

  detach = () => {
    if (typeof window !== "undefined") window.removeEventListener(EVENT, onChange);
    supabase.removeChannel(channel);
  };
}

export function stopOnboardingSync() {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
    if (pushingForUser) {
      // Best-effort flush.
      void pushToServer(pushingForUser, getOnboardingState());
    }
  }
  detach?.();
  detach = null;
  currentUserId = null;
  pushingForUser = null;
}
