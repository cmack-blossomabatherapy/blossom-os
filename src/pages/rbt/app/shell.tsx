import { Outlet, useLocation } from "react-router-dom";
import { OSShell } from "@/pages/os/OSShell";
import { RbtAppErrorBoundary } from "./RbtAppErrorBoundary";
import { PreviewBanner } from "./PreviewBanner";

/**
 * RBT app shell now renders inside the standard Blossom OS shell so RBTs
 * see the same left sidebar/top bar as Company Home. Route-level RBT
 * lockdown (RBT_ALLOWED_PREFIXES in AppLayout) still keeps them scoped
 * to /rbt/app/*, and the RBT ROLE_MENUS entry drives the sidebar items.
 */
export default function RbtAppShell() {
  const location = useLocation();
  return (
    <OSShell>
      <PreviewBanner />
      <RbtAppErrorBoundary key={location.pathname}>
        <Outlet />
      </RbtAppErrorBoundary>
    </OSShell>
  );
}