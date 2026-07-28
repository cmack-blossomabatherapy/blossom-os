import { Outlet, useLocation } from "react-router-dom";
import { OSShell } from "@/pages/os/OSShell";
import { RbtAppErrorBoundary } from "./RbtAppErrorBoundary";
import { PreviewBanner } from "./PreviewBanner";
import { RbtExperienceLabBar } from "./RbtExperienceLabBar";
import { RbtSubpageNav } from "./RbtSubpageNav";
import { OSRoleProvider } from "@/contexts/OSRoleContext";
import { RbtWalkthroughProvider } from "./RbtWalkthrough";

/**
 * RBT app shell now renders inside the standard Blossom OS shell so RBTs
 * see the same left sidebar/top bar as Company Home. Route-level RBT
 * lockdown (RBT_ALLOWED_PREFIXES in AppLayout) still keeps them scoped
 * to /rbt/app/*, and the RBT ROLE_MENUS entry drives the sidebar items.
 */
export default function RbtAppShell() {
  const location = useLocation();
  return (
    <OSRoleProvider>
      <OSShell>
        <RbtWalkthroughProvider>
          {/* Lab bar lives inside the walkthrough provider so its
              "Play walkthrough" / "Restart first-login tour" controls can
              drive the tour, and stays mounted across every /rbt/app/* route. */}
          <RbtExperienceLabBar />
          <PreviewBanner />
          <RbtAppErrorBoundary key={location.pathname}>
            <RbtSubpageNav />
            <Outlet />
          </RbtAppErrorBoundary>
        </RbtWalkthroughProvider>
      </OSShell>
    </OSRoleProvider>
  );
}