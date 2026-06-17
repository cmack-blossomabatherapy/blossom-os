// Retired in Sprint 03: no active route renders a "Coming Soon" page.
// Kept as a redirect-only stub so any lingering imports stay safe.
import { Navigate } from "react-router-dom";

export default function OSComingSoon(_props?: { title?: string; description?: string; icon?: unknown }) {
  return <Navigate to="/dashboard" replace />;
}
