import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { OverviewSection } from "@/components/profile/OverviewSection";
import { LearningSection } from "@/components/profile/LearningSection";
import { CertificationsSection } from "@/components/profile/CertificationsSection";
import { HRSection } from "@/components/profile/HRSection";
import { LoginsSection } from "@/components/profile/LoginsSection";
import { SettingsSection } from "@/components/profile/SettingsSection";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "learning", label: "My Learning" },
  { id: "certs", label: "Certifications" },
  { id: "hr", label: "HR" },
  { id: "logins", label: "My Logins" },
  { id: "settings", label: "Settings" },
] as const;
type TabId = typeof TABS[number]["id"];

export default function Profile() {
  const { user } = useAuth();
  const ob = useOnboardingStatus();
  const nav = useNavigate();
  const loc = useLocation();
  const initial = (loc.hash.replace("#", "") as TabId) || "overview";
  const [tab, setTab] = useState<TabId>(TABS.some((t) => t.id === initial) ? initial : "overview");
  const [hrPanel, setHrPanel] = useState<string | null>(null);

  useEffect(() => { nav({ hash: tab }, { replace: true }); }, [tab, nav]);

  const { data: profileRow } = useQuery({
    queryKey: ["profile_row", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, full_name, name, first_name, last_name").eq("id", user!.id).maybeSingle();
      return data as any;
    },
  });

  const name = (
    profileRow?.display_name ||
    profileRow?.full_name ||
    profileRow?.name ||
    [profileRow?.first_name, profileRow?.last_name].filter(Boolean).join(" ").trim() ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Blossom User"
  );
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "BU";

  const { data: hrProfile } = useQuery({
    queryKey: ["hr_profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("employee_hr_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const badges = useMemo(() => [
    { e: "🌱", l: "Day 1", earned: true },
    { e: "📘", l: "First Course", earned: true },
    { e: "🤝", l: "Team Met", earned: true },
    { e: "🔒", l: "HIPAA", earned: true },
    { e: "⭐", l: "5 Lessons", earned: ob.percent >= 50 },
    { e: "🏆", l: "Track Master", earned: false },
    { e: "🎓", l: "Graduate", earned: ob.isComplete },
    { e: "💎", l: "Mentor", earned: false },
  ], [ob.percent, ob.isComplete]);
  const earnedBadges = badges.filter((b) => b.earned).length;

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <ProfileHero
        name={name}
        email={user.email}
        initials={initials}
        role="Intake Staff"
        department={hrProfile?.department || undefined}
        state={hrProfile?.location_state || undefined}
        manager={undefined}
        onboardingPercent={ob.percent}
        onboardingComplete={ob.isComplete}
        academyPercent={25}
        badgesEarned={earnedBadges}
        badgesTotal={badges.length}
        onContinueTraining={() => nav(ob.nextPhase?.path || "/my-learning")}
        onRequestPTO={() => { setTab("hr"); setHrPanel("pto"); }}
        onViewLogins={() => setTab("logins")}
        onViewCertificates={() => setTab("certs")}
      />

      {/* Segmented tab nav */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex min-w-full gap-1 rounded-2xl border border-border/60 bg-card p-1 shadow-sm sm:min-w-0">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition sm:text-sm",
                tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && <OverviewSection ob={ob} badges={badges} />}
      {tab === "learning" && <LearningSection academyPercent={25} />}
      {tab === "certs" && <CertificationsSection />}
      {tab === "hr" && <HRSection userId={user.id} openPanel={hrPanel} setOpenPanel={setHrPanel} />}
      {tab === "logins" && <LoginsSection userId={user.id} />}
      {tab === "settings" && <SettingsSection ob={ob} />}
    </div>
  );
}
