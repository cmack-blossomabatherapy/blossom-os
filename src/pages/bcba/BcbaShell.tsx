import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import BcbaMobileShell from "./BcbaMobileShell";
import { OSRoleProvider } from "@/contexts/OSRoleContext";
import { OSShell } from "@/pages/os/OSShell";
import { BcbaPreviewBanner } from "./BcbaPreviewBanner";

/**
 * Responsive shell for /bcba/*.
 *
 * - Desktop / tablet: renders inside the standard Blossom OS shell so the
 *   existing sidebar (populated from roleMenus.bcba) and top bar apply.
 * - Mobile: renders a dedicated 5-tab bottom-nav shell tuned for touch.
 *
 * Direct URL access is still gated by <PermissionRoute> upstream.
 */
export default function BcbaShell() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <OSRoleProvider>
        <BcbaMobileShell />
      </OSRoleProvider>
    );
  }

  return (
    <OSRoleProvider>
      <OSShell>
        <BcbaPreviewBanner />
        <Outlet />
      </OSShell>
    </OSRoleProvider>
  );
}