/**
 * Live per-user RBT Academy progress.
 *
 * Merges durable truth from:
 *   - `public.rbt_readiness_records`        (assigned path, module_progress)
 *   - `public.academy_runtime_progress`     (start/complete + elapsed time)
 * into the static RBT_PATHS shape used by the RBT Academy homepage.
 *
 * Returns the merged path, derived stats, and a `state` flag so the UI
 * can render a clean setup state when no readiness record exists (rather
 * than silently defaulting to `certified_no_experience`).
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  RBT_PATHS, pathStats,
  type RBTPath, type RBTPathId, type RBTModule, type RBTPhase,
} from "@/lib/training/rbtAcademy";

export type RbtAcademyState = "loading" | "unassigned" | "ready";

export interface MergedRbtProgress {
  state: RbtAcademyState;
  /**
   * Source of the currently-shown assignment:
   *  - "readiness"  = signed-in RBT's own readiness row
   *  - "preview"    = admin preview selection (isPreview=true)
   *  - "default"    = safety fallback, only for admins with no preview yet
   */
  assignedSource: "readiness" | "preview" | "default";
  assignedPathId: RBTPathId | null;
  /**
   * True when the current view is an admin preview (learner has no
   * readiness row of their own, or the admin explicitly selected another
   * path). Used to render "Preview only" affordances.
   */
  isPreview: boolean;
  /**
   * The merged path (RBT_PATHS entry with per-module status/progress
   * overlaid from runtime + readiness). Null while loading or when a
   * regular RBT has no readiness assignment.
   */
  path: RBTPath | null;
  stats: ReturnType<typeof pathStats> | null;
}

interface Options {
  /**
   * Admin-only preview path override. Ignored for regular RBTs.
   */
  previewPathId?: RBTPathId | null;
  isAdmin?: boolean;
}

/**
 * Merge readiness module_progress and academy_runtime_progress rows over
 * a static path. Runtime rows win when both are present because they
 * carry the latest elapsedSeconds + timestamps.
 */
export function mergeRbtPathProgress(
  path: RBTPath,
  readinessModuleProgress: Record<string, { status?: string; progress?: number }> | null | undefined,
  runtimeRows: Array<{
    source_module_id?: string | null;
    module_id: string;
    status?: string | null;
    elapsed_seconds?: number | null;
  }>,
): RBTPath {
  const runtimeBySource = new Map<string, {
    status: string;
    elapsed: number;
  }>();
  for (const r of runtimeRows) {
    const key = r.source_module_id || r.module_id;
    if (!key) continue;
    runtimeBySource.set(key, {
      status: (r.status ?? "not_started"),
      elapsed: Number(r.elapsed_seconds ?? 0),
    });
  }

  const readinessMap = readinessModuleProgress ?? {};

  const mergedPhases: RBTPhase[] = path.phases.map((phase) => ({
    ...phase,
    modules: phase.modules.map<RBTModule>((m) => {
      const rt = runtimeBySource.get(m.id);
      const rd = readinessMap[m.id];
      let status = m.status;
      let progress = m.progress;

      // Prefer runtime > readiness > static. Locked stays locked unless
      // durable data explicitly shows in_progress/completed.
      if (rt?.status === "completed" || rd?.status === "completed") {
        status = "completed";
        progress = 100;
      } else if (rt?.status === "in_progress" || rd?.status === "in_progress") {
        status = "in_progress";
        progress = typeof rd?.progress === "number"
          ? rd.progress
          : Math.min(95, Math.max(5, Math.round((rt?.elapsed ?? 0) / Math.max(1, m.minutes * 60) * 100)));
      } else if (status === "locked" && (rt || rd)) {
        // Any durable touch unlocks the module.
        status = rt?.status === "completed" ? "completed" : rt?.status === "in_progress" ? "in_progress" : "not_started";
      }

      return { ...m, status, progress };
    }),
  }));

  return { ...path, phases: mergedPhases };
}

export function useMyRbtAcademyProgress(opts: Options = {}): MergedRbtProgress {
  const { user } = useAuth();
  const { previewPathId = null, isAdmin = false } = opts;

  const [readinessPathId, setReadinessPathId] = useState<RBTPathId | null>(null);
  const [readinessModuleProgress, setReadinessModuleProgress] = useState<
    Record<string, { status?: string; progress?: number }> | null
  >(null);
  const [runtimeRows, setRuntimeRows] = useState<any[]>([]);
  const [state, setState] = useState<RbtAcademyState>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        if (cancelled) return;
        setState("unassigned");
        return;
      }

      const [readiness, runtime] = await Promise.all([
        supabase
          .from("rbt_readiness_records")
          .select("path_id, module_progress")
          .eq("user_id", user.id)
          .maybeSingle(),
        (supabase.from("academy_runtime_progress" as any) as any)
          .select("module_id, source_module_id, status, elapsed_seconds, started_at, completed_at, journey_slug, track_id")
          .eq("user_id", user.id)
          .eq("journey_slug", "rbt"),
      ]);

      if (cancelled) return;

      const rrow: any = readiness.data ?? null;
      setReadinessPathId((rrow?.path_id as RBTPathId | undefined) ?? null);
      setReadinessModuleProgress((rrow?.module_progress as any) ?? null);
      setRuntimeRows((runtime.data as any[]) ?? []);

      // A regular RBT with no readiness row is in setup state.
      if (!rrow?.path_id && !isAdmin) {
        setState("unassigned");
      } else {
        setState("ready");
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, isAdmin]);

  const merged = useMemo<MergedRbtProgress>(() => {
    if (state === "loading") {
      return {
        state, assignedSource: "default", assignedPathId: null,
        isPreview: false, path: null, stats: null,
      };
    }

    // Resolve assignedPathId + source.
    let assignedPathId: RBTPathId | null = null;
    let assignedSource: MergedRbtProgress["assignedSource"] = "default";
    let isPreview = false;

    if (isAdmin && previewPathId) {
      assignedPathId = previewPathId;
      assignedSource = "preview";
      isPreview = true;
    } else if (readinessPathId) {
      assignedPathId = readinessPathId;
      assignedSource = "readiness";
      isPreview = false;
    } else if (isAdmin) {
      // Admins get a default preview to explore paths, clearly marked.
      assignedPathId = "certified_no_experience";
      assignedSource = "default";
      isPreview = true;
    } else {
      // Regular RBT with no readiness row — unassigned.
      return {
        state: "unassigned",
        assignedSource: "default",
        assignedPathId: null,
        isPreview: false,
        path: null,
        stats: null,
      };
    }

    const base = RBT_PATHS.find((p) => p.id === assignedPathId) ?? RBT_PATHS[0];
    const path = mergeRbtPathProgress(base, readinessModuleProgress, runtimeRows);
    return {
      state: "ready",
      assignedSource,
      assignedPathId,
      isPreview,
      path,
      stats: pathStats(path),
    };
  }, [state, isAdmin, previewPathId, readinessPathId, readinessModuleProgress, runtimeRows]);

  return merged;
}
