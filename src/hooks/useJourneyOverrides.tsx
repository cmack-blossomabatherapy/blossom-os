import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ONBOARDING_PHASES, type JourneyPhase, type JourneyModule } from "@/lib/onboarding/journey";

export interface PhaseOverride {
  phase_id: string;
  title?: string | null;
  objective?: string | null;
  intro_video_url?: string | null;
  intro_video_poster?: string | null;
}

export interface ModuleOverride {
  id?: string;
  phase_id: string;
  module_key: string;
  title?: string | null;
  blurb?: string | null;
  video_url?: string | null;
  video_poster?: string | null;
  video_duration?: string | null;
  video_presenter?: string | null;
  hidden?: boolean;
}

interface Ctx {
  phaseOverrides: Record<string, PhaseOverride>;
  moduleOverrides: Record<string, ModuleOverride>; // key: `${phase}:${module_key}`
  loading: boolean;
  refresh: () => Promise<void>;
}

const JourneyOverridesContext = createContext<Ctx>({
  phaseOverrides: {},
  moduleOverrides: {},
  loading: true,
  refresh: async () => {},
});

export function JourneyOverridesProvider({ children }: { children: ReactNode }) {
  const [phaseOverrides, setPhase] = useState<Record<string, PhaseOverride>>({});
  const [moduleOverrides, setMod] = useState<Record<string, ModuleOverride>>({});
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [p, m] = await Promise.all([
      supabase.from("journey_phase_overrides").select("*"),
      supabase.from("journey_module_overrides").select("*"),
    ]);
    const pMap: Record<string, PhaseOverride> = {};
    (p.data || []).forEach((row: any) => { pMap[row.phase_id] = row; });
    const mMap: Record<string, ModuleOverride> = {};
    (m.data || []).forEach((row: any) => { mMap[`${row.phase_id}:${row.module_key}`] = row; });
    setPhase(pMap);
    setMod(mMap);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("journey-overrides")
      .on("postgres_changes", { event: "*", schema: "public", table: "journey_phase_overrides" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "journey_module_overrides" }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  return (
    <JourneyOverridesContext.Provider value={{ phaseOverrides, moduleOverrides, loading, refresh }}>
      {children}
    </JourneyOverridesContext.Provider>
  );
}

export function useJourneyOverrides() {
  return useContext(JourneyOverridesContext);
}

/** Apply overrides to a phase + its modules. Returns a new phase object. */
export function applyOverridesToPhase(
  phase: JourneyPhase,
  phaseOverrides: Record<string, PhaseOverride>,
  moduleOverrides: Record<string, ModuleOverride>,
): JourneyPhase {
  const po = phaseOverrides[phase.id];
  const modules: JourneyModule[] = phase.modules
    .map((m) => {
      const mo = moduleOverrides[`${phase.id}:${m.key}`];
      if (!mo) return m;
      if (mo.hidden) return null;
      return {
        ...m,
        title: mo.title || m.title,
        blurb: mo.blurb || m.blurb,
        video: mo.video_url || mo.video_duration || mo.video_presenter || mo.video_poster
          ? {
              url: mo.video_url || m.video?.url,
              poster: mo.video_poster || m.video?.poster,
              duration: mo.video_duration || m.video?.duration,
              presenter: mo.video_presenter || m.video?.presenter,
            }
          : m.video,
      } as JourneyModule;
    })
    .filter((m): m is JourneyModule => m !== null);

  return {
    ...phase,
    title: po?.title || phase.title,
    objective: po?.objective || phase.objective,
    modules,
  };
}

/** Convenience hook that returns a phase with overrides applied. */
export function usePhaseWithOverrides(phaseId: JourneyPhase["id"]): { phase: JourneyPhase; loading: boolean } {
  const { phaseOverrides, moduleOverrides, loading } = useJourneyOverrides();
  const phase = useMemo(() => {
    const base = ONBOARDING_PHASES.find((p) => p.id === phaseId)!;
    return applyOverridesToPhase(base, phaseOverrides, moduleOverrides);
  }, [phaseId, phaseOverrides, moduleOverrides]);
  return { phase, loading };
}